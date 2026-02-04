import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { InstructorAvailability, AvailabilityOverride } from '@/types/booking'

/**
 * GET /api/availability/[id]
 * When used as GET, the [id] param is the instructor_id.
 * Returns weekly availability + date overrides for the given instructor.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: instructorId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [weeklyResult, overridesResult] = await Promise.all([
    supabase
      .from('instructor_availability')
      .select('*')
      .eq('instructor_id', instructorId)
      .eq('is_active', true)
      .order('day_of_week')
      .order('start_time'),
    supabase
      .from('availability_overrides')
      .select('*')
      .eq('instructor_id', instructorId)
      .gte('override_date', new Date().toISOString().split('T')[0])
      .order('override_date'),
  ])

  if (weeklyResult.error) {
    return NextResponse.json({ error: weeklyResult.error.message }, { status: 500 })
  }
  if (overridesResult.error) {
    return NextResponse.json({ error: overridesResult.error.message }, { status: 500 })
  }

  return NextResponse.json({
    weekly: weeklyResult.data as InstructorAvailability[],
    overrides: overridesResult.data as AvailabilityOverride[],
  })
}

/**
 * DELETE /api/availability/[id]
 * When used as DELETE, the [id] param is the availability record id.
 * Deletes the availability record and auto-declines pending bookings.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch the availability record before deleting so we can auto-decline affected bookings
  const { data: availability, error: fetchError } = await supabase
    .from('instructor_availability')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !availability) {
    return NextResponse.json(
      { error: 'Availability record not found' },
      { status: 404 }
    )
  }

  // Delete the availability record (RLS enforces ownership)
  const { error: deleteError } = await supabase
    .from('instructor_availability')
    .delete()
    .eq('id', id)

  if (deleteError) {
    if (deleteError.code === '42501') {
      return NextResponse.json(
        { error: 'Not authorized to delete this availability' },
        { status: 403 }
      )
    }
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Auto-decline pending bookings that fall within the deleted availability window.
  // First, fetch pending bookings for this instructor, then filter by day-of-week
  // and time overlap with the deleted availability.
  const { data: pendingBookings } = await supabase
    .from('private_lesson_bookings')
    .select('id, start_time, end_time')
    .eq('instructor_id', availability.instructor_id)
    .eq('status', 'pending')
    .gt('start_time', new Date().toISOString())

  const affectedIds: string[] = []
  if (pendingBookings) {
    for (const b of pendingBookings) {
      const bookingDate = new Date(b.start_time)
      const bookingDow = bookingDate.getDay() // 0=Sun, matches day_of_week
      if (bookingDow !== availability.day_of_week) continue

      // Check time overlap: extract HH:MM from the booking and compare with availability window
      const bookingStartTime = bookingDate.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/New_York',
      })
      const bookingEndDate = new Date(b.end_time)
      const bookingEndTime = bookingEndDate.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/New_York',
      })

      // Overlap: booking starts before avail ends AND booking ends after avail starts
      if (
        bookingStartTime < availability.end_time &&
        bookingEndTime > availability.start_time
      ) {
        affectedIds.push(b.id)
      }
    }
  }

  let declinedCount = 0
  if (affectedIds.length > 0) {
    const { data: declined } = await supabase
      .from('private_lesson_bookings')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .in('id', affectedIds)
      .select('id')
    declinedCount = declined?.length ?? 0
  }

  return NextResponse.json({
    success: true,
    declined_bookings: declinedCount,
  })
}
