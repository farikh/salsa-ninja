import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SlotsResponse } from '@/types/booking'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instructorId: string }> }
) {
  const { instructorId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!start || !end) {
    return NextResponse.json(
      { error: 'Missing required query params: start, end (DATE format YYYY-MM-DD)' },
      { status: 400 }
    )
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(start) || !dateRegex.test(end)) {
    return NextResponse.json(
      { error: 'start and end must be in YYYY-MM-DD format' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase.rpc('get_available_slots', {
    p_instructor_id: instructorId,
    p_start_date: start,
    p_end_date: end,
  })

  if (error) {
    console.error('[slots API] get_available_slots RPC error:', {
      instructorId,
      start,
      end,
      error: error.message,
      code: error.code,
    })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ slots: data ?? [] } satisfies SlotsResponse)
}
