'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'

export async function inviteAdmin(formData: FormData) {
  const supabase = createServiceRoleClient()

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

  // Check if auth user exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email
  )

  let userId: string

  if (existingUser) {
    userId = existingUser.id
  } else {
    // Invite via magic link
    const { data: invitedUser, error: inviteError } =
      await supabase.auth.admin.inviteUserByEmail(email)

    if (inviteError || !invitedUser.user) {
      return { error: `Failed to invite user: ${inviteError?.message}` }
    }
    userId = invitedUser.user.id
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

  revalidatePath('/admins')
}

export async function sendAdminMagicLink(formData: FormData) {
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
