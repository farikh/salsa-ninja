import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/bookings/pending?instructor_id=UUID
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get current member
  const { data: member } = await supabase
    .from('member_profiles')
    .select('id, role_name, all_roles')
    .eq('user_id', user.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 403 });
  }

  const allRoles: string[] = member.all_roles || [member.role_name];
  const isOwner = allRoles.includes('owner');
  const isInstructor = allRoles.includes('instructor') || isOwner;

  if (!isInstructor) {
    return NextResponse.json(
      { error: 'Only instructors can view pending bookings' },
      { status: 403 }
    );
  }

  // Owner sees all pending, instructor sees own
  let query = supabase
    .from('private_lesson_bookings')
    .select(
      `*, member:members!private_lesson_bookings_member_id_fkey(
        id, display_name, full_name, avatar_url
      )`
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50);

  if (!isOwner) {
    query = query.eq('instructor_id', member.id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Pending bookings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
