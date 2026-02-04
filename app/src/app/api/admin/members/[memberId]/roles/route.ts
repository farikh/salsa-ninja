import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// POST /api/admin/members/[memberId]/roles - Add a role to a member
export async function POST(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const supabase = await createClient()
  const { memberId } = await params

  // Validate UUID format
  if (!UUID_REGEX.test(memberId)) {
    return NextResponse.json({ error: 'Invalid member ID format' }, { status: 400 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { role } = body

  if (!role) {
    return NextResponse.json({ error: 'Role is required' }, { status: 400 })
  }

  const validRoles = ['owner', 'instructor', 'member_full', 'member_limited', 'guest']
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('add_member_role', {
    p_member_id: memberId,
    p_role_name: role
  })

  if (error) {
    console.error('Error adding role:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data.success) {
    return NextResponse.json({ error: data.error }, { status: 403 })
  }

  return NextResponse.json({ success: true })
}

// DELETE /api/admin/members/[memberId]/roles - Remove a role from a member
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const supabase = await createClient()
  const { memberId } = await params

  // Validate UUID format
  if (!UUID_REGEX.test(memberId)) {
    return NextResponse.json({ error: 'Invalid member ID format' }, { status: 400 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role')

  if (!role) {
    return NextResponse.json({ error: 'Role is required' }, { status: 400 })
  }

  const validRoles = ['owner', 'instructor', 'member_full', 'member_limited', 'guest']
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('remove_member_role', {
    p_member_id: memberId,
    p_role_name: role
  })

  if (error) {
    console.error('Error removing role:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data.success) {
    return NextResponse.json({ error: data.error }, { status: 403 })
  }

  return NextResponse.json({ success: true })
}
