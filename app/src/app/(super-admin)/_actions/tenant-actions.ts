'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function createTenant(formData: FormData) {
  const supabase = createServiceRoleClient()

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string || slugify(name)
  const themeId = formData.get('theme_id') as string | null
  const ownerEmail = formData.get('owner_email') as string

  if (!name || !ownerEmail) {
    return { error: 'Name and owner email are required' }
  }

  // 1. Create the tenant record
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name,
      slug,
      theme_id: themeId || null,
      status: 'active',
      settings: {},
    })
    .select('id')
    .single()

  if (tenantError) {
    return { error: `Failed to create tenant: ${tenantError.message}` }
  }

  // 2. Check if auth user exists for the owner email
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === ownerEmail.toLowerCase()
  )

  let userId: string

  if (existingUser) {
    userId = existingUser.id
  } else {
    // Invite the user via Supabase auth
    const { data: invitedUser, error: inviteError } =
      await supabase.auth.admin.inviteUserByEmail(ownerEmail.toLowerCase())

    if (inviteError || !invitedUser.user) {
      return { error: `Failed to invite user: ${inviteError?.message}` }
    }
    userId = invitedUser.user.id
  }

  // 3. Create member record
  const { data: member, error: memberError } = await supabase
    .from('members')
    .insert({
      user_id: userId,
      tenant_id: tenant.id,
      email: ownerEmail.toLowerCase(),
      display_name: ownerEmail.split('@')[0],
    })
    .select('id')
    .single()

  if (memberError) {
    return { error: `Failed to create member: ${memberError.message}` }
  }

  // 4. Create member_role with "owner" role
  const { error: roleError } = await supabase
    .from('member_roles')
    .insert({
      member_id: member.id,
      role: 'owner',
    })

  if (roleError) {
    return { error: `Failed to assign owner role: ${roleError.message}` }
  }

  revalidatePath('/tenants')
  redirect(`/tenants/${tenant.id}`)
}

export async function updateTenant(tenantId: string, formData: FormData) {
  const supabase = createServiceRoleClient()

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const customDomain = formData.get('custom_domain') as string | null
  const themeId = formData.get('theme_id') as string | null

  const { error } = await supabase
    .from('tenants')
    .update({
      name,
      slug,
      custom_domain: customDomain || null,
      theme_id: themeId || null,
    })
    .eq('id', tenantId)

  if (error) {
    return { error: `Failed to update tenant: ${error.message}` }
  }

  revalidatePath(`/tenants/${tenantId}`)
  revalidatePath('/tenants')
}

export async function updateTenantStatus(tenantId: string, status: string) {
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('tenants')
    .update({ status })
    .eq('id', tenantId)

  if (error) {
    return { error: `Failed to update status: ${error.message}` }
  }

  revalidatePath(`/tenants/${tenantId}`)
  revalidatePath('/tenants')
  revalidatePath('/')
}
