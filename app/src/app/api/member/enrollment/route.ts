import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { enrollment_plan?: string; bootcamp_enrolled?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}

  if (body.enrollment_plan !== undefined) {
    const validPlans = ['classes_5', 'classes_8', 'unlimited']
    if (!validPlans.includes(body.enrollment_plan)) {
      return NextResponse.json({ error: 'Invalid enrollment plan' }, { status: 400 })
    }
    updates.enrollment_plan = body.enrollment_plan
  }

  if (body.bootcamp_enrolled !== undefined) {
    if (typeof body.bootcamp_enrolled !== 'boolean') {
      return NextResponse.json({ error: 'bootcamp_enrolled must be boolean' }, { status: 400 })
    }
    updates.bootcamp_enrolled = body.bootcamp_enrolled
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('members')
    .update(updates)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
