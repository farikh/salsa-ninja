'use server'

import { revalidatePath } from 'next/cache'
import { requireSuperAdmin } from './auth'
import { createServiceRoleClient } from '@/lib/supabase/service'

export async function inviteAdmin(formData: FormData) {
  const supabase = await requireSuperAdmin()

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const role = formData.get('role') as string
  const fullName = formData.get('full_name') as string

  if (!email || !role) {
    return { error: 'Email and role are required' }
  }

  if (role !== 'super_admin' && role !== 'platform_support') {
    return { error: 'Invalid role' }
  }

  // Check if already a super admin
  const { data: existing } = await supabase
    .from('super_admins')
    .select('id')
    .eq('email', email)
    .single()

  if (existing) {
    return { error: 'This email is already a super admin' }
  }

  // Find or create the auth user
  let userId: string

  // Try inviteUserByEmail first -- creates if new, errors if exists
  const { data: invitedUser, error: inviteError } =
    await supabase.auth.admin.inviteUserByEmail(email)

  if (invitedUser?.user) {
    userId = invitedUser.user.id
  } else if (inviteError) {
    // User likely already exists -- look up from members table
    const { data: existingMember } = await supabase
      .from('members')
      .select('user_id')
      .eq('email', email)
      .limit(1)
      .single()

    if (existingMember) {
      userId = existingMember.user_id
    } else {
      return { error: `Failed to invite user: ${inviteError.message}` }
    }
  } else {
    return { error: 'Failed to resolve user' }
  }

  // Create super_admins record
  const { error: insertError } = await supabase
    .from('super_admins')
    .insert({
      user_id: userId,
      email,
      full_name: fullName || null,
      role,
    })

  if (insertError) {
    return { error: `Failed to create admin record: ${insertError.message}` }
  }

  revalidatePath('/admin/admins')
}

export async function sendAdminMagicLink(formData: FormData) {
  // This action is called from the login page BEFORE the user is authenticated,
  // so we cannot use requireSuperAdmin() here. Instead, we verify the email
  // exists in super_admins before sending the magic link.
  const supabase = createServiceRoleClient()

  const email = (formData.get('email') as string)?.trim().toLowerCase()

  if (!email) {
    return { error: 'Email is required' }
  }

  // Check if this email is a super admin
  const { data: admin } = await supabase
    .from('super_admins')
    .select('id')
    .eq('email', email)
    .single()

  if (!admin) {
    return { error: 'access_denied' }
  }

  // Send magic link via Supabase auth admin API
  const { error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (error) {
    return { error: `Failed to send magic link: ${error.message}` }
  }

  return { success: true }
}
