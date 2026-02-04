import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { InstructorAvailability } from '@/types/booking'

// GET /api/availability?instructor_id=UUID - Get instructor's weekly availability
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const instructorId = searchParams.get('instructor_id')

  if (!instructorId) {
    return NextResponse.json({ error: 'instructor_id is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('instructor_availability')
    .select('*')
    .eq('instructor_id', instructorId)
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    instructor_id: string
    day_of_week: number
    start_time: string
    end_time: string
    slot_duration_minutes?: number
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (
    !body.instructor_id ||
    body.day_of_week === undefined ||
    !body.start_time ||
    !body.end_time
  ) {
    return NextResponse.json(
      { error: 'Missing required fields: instructor_id, day_of_week, start_time, end_time' },
      { status: 400 }
    )
  }

  if (body.day_of_week < 0 || body.day_of_week > 6) {
    return NextResponse.json(
      { error: 'day_of_week must be between 0 (Sunday) and 6 (Saturday)' },
      { status: 400 }
    )
  }

  if (body.start_time >= body.end_time) {
    return NextResponse.json(
      { error: 'start_time must be before end_time' },
      { status: 400 }
    )
  }

  // RLS enforces that only the instructor themselves or an owner can insert
  const { data, error } = await supabase
    .from('instructor_availability')
    .insert({
      instructor_id: body.instructor_id,
      day_of_week: body.day_of_week,
      start_time: body.start_time,
      end_time: body.end_time,
      slot_duration_minutes: body.slot_duration_minutes ?? 60,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Duplicate availability: this day/time already exists' },
        { status: 409 }
      )
    }
    if (error.code === '42501') {
      return NextResponse.json(
        { error: 'Not authorized to manage this instructor\'s availability' },
        { status: 403 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data as InstructorAvailability }, { status: 201 })
}
