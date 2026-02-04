import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
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

  let body: { reason?: string | null } = {}
  try {
    const text = await request.text()
    if (text) {
      body = JSON.parse(text)
    }
  } catch {
    // Body is optional for cancel, so we can proceed without it
  }

  // Call the SECURITY DEFINER RPC which resolves caller from auth.uid()
  const { data, error } = await supabase.rpc('cancel_booking', {
    p_booking_id: id,
    p_reason: body.reason ?? null,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result = data as { success: boolean; error?: string }

  if (!result.success) {
    const errorMsg = result.error ?? 'Unknown error'
    if (errorMsg.includes('Not authorized')) {
      return NextResponse.json({ error: errorMsg }, { status: 403 })
    }
    if (errorMsg.includes('Cannot cancel within 24 hours')) {
      return NextResponse.json({ error: errorMsg }, { status: 403 })
    }
    return NextResponse.json({ error: errorMsg }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
