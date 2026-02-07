import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/bookings/upcoming
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get current member
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('private_lesson_bookings')
    .select(
      `*, instructor:members!private_lesson_bookings_instructor_id_fkey(
        id, display_name, full_name, avatar_url
      )`
    )
    .eq('member_id', member.id)
    .in('status', ['pending', 'confirmed'])
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(30);

  if (error) {
    console.error('Upcoming bookings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
