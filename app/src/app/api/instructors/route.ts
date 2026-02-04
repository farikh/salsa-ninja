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

  // Query instructors through member_roles junction table (multi-role support)
  // Fallback: also check legacy roles FK for backward compatibility during migration
  const { data, error } = await supabase
    .from('members')
    .select(`
      id,
      display_name,
      full_name,
      avatar_url,
      member_roles!left(
        roles!inner(name)
      ),
      roles!left(name)
    `)
    .order('display_name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Filter to only instructors/owners (check both member_roles and legacy role_id)
  const instructors: Instructor[] = (data ?? [])
    .filter((m) => {
      // Check member_roles (new multi-role system)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const memberRoles = m.member_roles as any[] | null
      const hasRoleInMemberRoles = memberRoles?.some(
        (mr) => mr.roles?.name === 'instructor' || mr.roles?.name === 'owner'
      )
      // Check legacy roles FK (backward compatibility)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const legacyRole = m.roles as any
      const hasLegacyRole = legacyRole?.name === 'instructor' || legacyRole?.name === 'owner'

      return hasRoleInMemberRoles || hasLegacyRole
    })
    .map((m) => ({
      id: m.id,
      display_name: m.display_name,
      full_name: m.full_name,
      avatar_url: m.avatar_url,
    }))

  return NextResponse.json({ instructors } satisfies InstructorsResponse)
}
