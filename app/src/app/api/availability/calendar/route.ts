import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from 'date-fns'

// GET /api/availability/calendar?instructor_id=UUID&view=weekly|monthly&date=YYYY-MM-DD
// Returns availability + bookings + overrides for the given date range
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate params
  const { searchParams } = new URL(request.url)
  const instructorId = searchParams.get('instructor_id')
  const view = searchParams.get('view')
  const dateStr = searchParams.get('date')

  if (!instructorId || !view || !dateStr) {
    return NextResponse.json(
      { error: 'Missing required params: instructor_id, view, date' },
      { status: 400 }
    )
  }

  if (view !== 'weekly' && view !== 'monthly') {
    return NextResponse.json(
      { error: 'view must be "weekly" or "monthly"' },
      { status: 400 }
    )
  }

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return NextResponse.json(
      { error: 'date must be a valid ISO date string (YYYY-MM-DD)' },
      { status: 400 }
    )
  }

  // Authorization: caller must be the instructor or have owner role
  const { data: member } = await supabase
    .from('member_profiles')
    .select('id, all_roles, role_name')
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 403 })
  }

  const allRoles: string[] = member.all_roles || [member.role_name]
  const isOwner = allRoles.includes('owner')
  const isRequestingOwnCalendar = member.id === instructorId

  if (!isOwner && !isRequestingOwnCalendar) {
    return NextResponse.json(
      { error: 'Not authorized to view this instructor\'s calendar' },
      { status: 403 }
    )
  }

  // Determine date range
  let rangeStart: Date
  let rangeEnd: Date

  if (view === 'weekly') {
    rangeStart = startOfWeek(date, { weekStartsOn: 0 })
    rangeEnd = endOfWeek(date, { weekStartsOn: 0 })
  } else {
    rangeStart = startOfMonth(date)
    rangeEnd = endOfMonth(date)
  }

  const rangeStartStr = format(rangeStart, 'yyyy-MM-dd')
  const rangeEndStr = format(rangeEnd, 'yyyy-MM-dd')

  // Parallel fetch: availability, bookings, overrides
  const [availabilityResult, bookingsResult, overridesResult] =
    await Promise.all([
      supabase
        .from('instructor_availability')
        .select('*')
        .eq('instructor_id', instructorId)
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time'),

      supabase
        .from('private_lesson_bookings')
        .select('*')
        .eq('instructor_id', instructorId)
        .gte('start_time', `${rangeStartStr}T00:00:00`)
        .lte('start_time', `${rangeEndStr}T23:59:59`)
        .in('status', ['pending', 'confirmed'])
        .order('start_time'),

      supabase
        .from('availability_overrides')
        .select('*')
        .eq('instructor_id', instructorId)
        .gte('override_date', rangeStartStr)
        .lte('override_date', rangeEndStr)
        .order('override_date'),
    ])

  if (availabilityResult.error) {
    return NextResponse.json(
      { error: availabilityResult.error.message },
      { status: 500 }
    )
  }
  if (bookingsResult.error) {
    return NextResponse.json(
      { error: bookingsResult.error.message },
      { status: 500 }
    )
  }
  if (overridesResult.error) {
    return NextResponse.json(
      { error: overridesResult.error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    availability: availabilityResult.data,
    bookings: bookingsResult.data,
    overrides: overridesResult.data,
  })
}
