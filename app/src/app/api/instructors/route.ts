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

  const { data, error } = await supabase
    .from('members')
    .select('id, display_name, full_name, avatar_url, roles!inner(name)')
    .in('roles.name', ['instructor', 'owner'])
    .order('display_name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const instructors: Instructor[] = (data ?? []).map((m) => ({
    id: m.id,
    display_name: m.display_name,
    full_name: m.full_name,
    avatar_url: m.avatar_url,
  }))

  return NextResponse.json({ instructors } satisfies InstructorsResponse)
}
