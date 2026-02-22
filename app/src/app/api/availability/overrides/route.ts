import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AvailabilityOverride } from '@/types/booking'

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
    override_date: string
    start_time?: string | null
    end_time?: string | null
    is_available: boolean
    reason?: string | null
    slot_duration_minutes?: number
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.instructor_id || !body.override_date || body.is_available === undefined) {
    return NextResponse.json(
      { error: 'Missing required fields: instructor_id, override_date, is_available' },
      { status: 400 }
    )
  }

  // If marking as available (extra availability), start_time and end_time are required
  if (body.is_available && (!body.start_time || !body.end_time)) {
    return NextResponse.json(
      { error: 'start_time and end_time are required when adding extra availability' },
      { status: 400 }
    )
  }

  const tenantId = request.headers.get('x-tenant-id')

  // RLS enforces that only the instructor or owner can insert
  const { data, error } = await supabase
    .from('availability_overrides')
    .insert({
      instructor_id: body.instructor_id,
      override_date: body.override_date,
      start_time: body.start_time ?? null,
      end_time: body.end_time ?? null,
      is_available: body.is_available,
      reason: body.reason ?? null,
      slot_duration_minutes: body.slot_duration_minutes ?? 60,
      tenant_id: tenantId,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Duplicate override: this date/time already has an override' },
        { status: 409 }
      )
    }
    if (error.code === '42501') {
      return NextResponse.json(
        { error: 'Not authorized to manage this instructor\'s overrides' },
        { status: 403 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data as AvailabilityOverride }, { status: 201 })
}
