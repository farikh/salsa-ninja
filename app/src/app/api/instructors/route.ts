import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Instructor, InstructorsResponse } from '@/types/booking'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Query instructors via member_profiles view (has pre-computed all_roles array)
  const { data, error } = await supabase
    .from('member_profiles')
    .select('id, display_name, full_name, avatar_url, all_roles, role_name')
    .order('display_name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const instructors: Instructor[] = (data ?? [])
    .filter((m) => {
      const allRoles: string[] = m.all_roles || [m.role_name]
      return allRoles.includes('instructor') || allRoles.includes('owner')
    })
    .map((m) => ({
      id: m.id,
      display_name: m.display_name,
      full_name: m.full_name,
      avatar_url: m.avatar_url,
    }))

  return NextResponse.json({ instructors } satisfies InstructorsResponse)
}
