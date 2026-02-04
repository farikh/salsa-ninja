import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { BookingsResponse, CreateBookingResponse } from '@/types/booking'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const instructorId = searchParams.get('instructor_id')
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  // Build query - RLS filters to own bookings for members, all for staff
  let query = supabase
    .from('private_lesson_bookings')
    .select('*')
    .order('start_time', { ascending: true })

  if (instructorId) {
    query = query.eq('instructor_id', instructorId)
  }
  if (start) {
    query = query.gte('start_time', `${start}T00:00:00.000Z`)
  }
  if (end) {
    query = query.lte('start_time', `${end}T23:59:59.999Z`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] } satisfies BookingsResponse)
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
    start_time: string
    end_time: string
    notes?: string | null
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.instructor_id || !body.start_time || !body.end_time) {
    return NextResponse.json(
      { error: 'Missing required fields: instructor_id, start_time, end_time' },
      { status: 400 }
    )
  }

  // Call the SECURITY DEFINER RPC which resolves the member from auth.uid()
  const { data, error } = await supabase.rpc('create_booking', {
    p_instructor_id: body.instructor_id,
    p_start_time: body.start_time,
    p_end_time: body.end_time,
    p_notes: body.notes ?? null,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result = data as CreateBookingResponse

  if (!result.success) {
    // Map specific errors to appropriate HTTP status codes
    const errorMsg = result.error ?? 'Unknown error'
    if (errorMsg.includes('Guests cannot book')) {
      return NextResponse.json({ error: errorMsg }, { status: 403 })
    }
    if (errorMsg.includes('already confirmed') || errorMsg.includes('not an available slot')) {
      return NextResponse.json({ error: errorMsg }, { status: 409 })
    }
    return NextResponse.json({ error: errorMsg }, { status: 400 })
  }

  return NextResponse.json(result, { status: 201 })
}
