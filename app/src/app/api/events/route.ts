import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/events?start=ISO&end=ISO&types=class,workshop&instructor_id=UUID&include_rsvp=true
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const types = searchParams.get('types');
  const instructorId = searchParams.get('instructor_id');
  const includeRsvp = searchParams.get('include_rsvp') === 'true';

  if (!start || !end) {
    return NextResponse.json(
      { error: 'Missing required params: start, end' },
      { status: 400 }
    );
  }

  // Validate dates
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json(
      { error: 'start and end must be valid ISO date strings' },
      { status: 400 }
    );
  }

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Build query
  let query = supabase
    .from('events')
    .select(
      `id, title, event_type, start_time, end_time,
       instructor_id, dance_style, difficulty, location,
       capacity, series_id, visibility, approval_status,
       instructor:members!events_instructor_id_fkey(
         display_name, avatar_url
       )`
    )
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString())
    .eq('approval_status', 'approved')
    .order('start_time', { ascending: true })
    .limit(500);

  // Filter by event types
  if (types) {
    const typeList = types.split(',').filter(Boolean);
    if (typeList.length > 0) {
      query = query.in('event_type', typeList);
    }
  }

  // Filter by instructor
  if (instructorId) {
    query = query.eq('instructor_id', instructorId);
  }

  // Visibility filter for unauthenticated users
  if (!user) {
    query = query.eq('visibility', 'public');
  }

  const { data: rawEvents, error } = await query;

  if (error) {
    console.error('Events query error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Get RSVP counts for all events
  const eventIds = (rawEvents ?? []).map((e: Record<string, unknown>) => e.id as string);
  let rsvpCounts: Record<string, number> = {};
  let userRsvps: Record<string, string> = {};

  if (eventIds.length > 0) {
    const { data: rsvpData } = await supabase
      .from('event_rsvps')
      .select('event_id, status')
      .in('event_id', eventIds)
      .in('status', ['going', 'waitlist']);

    if (rsvpData) {
      for (const rsvp of rsvpData) {
        if (rsvp.status === 'going') {
          rsvpCounts[rsvp.event_id] = (rsvpCounts[rsvp.event_id] || 0) + 1;
        }
      }
    }

    // Get current user's RSVP status
    if (includeRsvp && user) {
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (member) {
        const { data: userRsvpData } = await supabase
          .from('event_rsvps')
          .select('event_id, status')
          .in('event_id', eventIds)
          .eq('member_id', member.id);

        if (userRsvpData) {
          for (const rsvp of userRsvpData) {
            userRsvps[rsvp.event_id] = rsvp.status;
          }
        }
      }
    }
  }

  // Transform to CalendarEvent format
  const events = (rawEvents ?? []).map((e: Record<string, unknown>) => {
    const instructor = e.instructor as Record<string, unknown> | null;
    const count = rsvpCounts[e.id as string] || 0;
    const cap = e.capacity as number | null;

    return {
      id: e.id,
      title: e.title,
      event_type: e.event_type,
      start_time: e.start_time,
      end_time: e.end_time,
      instructor_id: e.instructor_id,
      instructor_name: instructor?.display_name ?? null,
      instructor_avatar: instructor?.avatar_url ?? null,
      dance_style: e.dance_style,
      difficulty: e.difficulty,
      location: e.location,
      capacity: cap,
      rsvp_count: count,
      is_full: cap != null && count >= cap,
      series_id: e.series_id,
      user_rsvp_status: userRsvps[e.id as string] ?? null,
      visibility: e.visibility,
    };
  });

  return NextResponse.json({ events });
}
