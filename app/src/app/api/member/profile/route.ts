import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_FIELDS = ['display_name', 'full_name', 'phone', 'bio', 'dance_experience'] as const
type AllowedField = (typeof ALLOWED_FIELDS)[number]

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Only allow known profile fields
  const updates: Partial<Record<AllowedField, string | null>> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body) {
      const val = body[key]
      if (val === null || typeof val === 'string') {
        updates[key] = typeof val === 'string' ? val.trim() : null
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  // full_name is required
  if ('full_name' in updates && (!updates.full_name || updates.full_name.length === 0)) {
    return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('members')
    .update(updates)
    .eq('user_id', user.id)

  if (error) {
    console.error('Profile update failed:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
