'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireSuperAdmin } from './auth'

/** Standard roles seeded for every new tenant. */
const STANDARD_ROLES = [
  { name: 'owner', display_name: 'Owner', permissions: { all: true } },
  { name: 'instructor', display_name: 'Instructor', permissions: { manage_events: true, manage_bookings: true } },
  { name: 'member_full', display_name: 'Full Member', permissions: { view_content: true, book_classes: true } },
  { name: 'member_limited', display_name: 'Limited Member', permissions: { view_content: true } },
  { name: 'guest', display_name: 'Guest', permissions: {} },
]

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
  const supabase = await requireSuperAdmin()

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

  // 2. Seed tenant-scoped roles
  const { error: rolesError } = await supabase
    .from('roles')
    .insert(
      STANDARD_ROLES.map((r) => ({
        name: r.name,
        display_name: r.display_name,
        permissions: r.permissions,
        tenant_id: tenant.id,
      }))
    )

  if (rolesError) {
    return { error: `Failed to seed roles: ${rolesError.message}` }
  }

  // 3. Find or create the auth user for the owner email
  let userId: string

  // Try inviteUserByEmail first -- it creates if new, errors if exists
  const { data: invitedUser, error: inviteError } =
    await supabase.auth.admin.inviteUserByEmail(ownerEmail.toLowerCase())

  if (invitedUser?.user) {
    userId = invitedUser.user.id
  } else if (inviteError) {
    // User likely already exists -- look up from members table or auth
    const { data: existingMember } = await supabase
      .from('members')
      .select('user_id')
      .eq('email', ownerEmail.toLowerCase())
      .limit(1)
      .single()

    if (existingMember) {
      userId = existingMember.user_id
    } else {
      // Last resort: try getUserByEmail via admin API (available in newer Supabase versions)
      // If that doesn't work, the invite error is genuine
      return { error: `Failed to invite user: ${inviteError.message}` }
    }
  } else {
    return { error: 'Failed to resolve user for owner email' }
  }

  // 4. Create member record
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

  // 5. Assign the "owner" role via role_id lookup
  const { data: ownerRole, error: ownerRoleLookupError } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'owner')
    .eq('tenant_id', tenant.id)
    .single()

  if (ownerRoleLookupError || !ownerRole) {
    return { error: 'Failed to find owner role for tenant' }
  }

  const { error: roleError } = await supabase
    .from('member_roles')
    .insert({
      member_id: member.id,
      role_id: ownerRole.id,
      tenant_id: tenant.id,
    })

  if (roleError) {
    return { error: `Failed to assign owner role: ${roleError.message}` }
  }

  revalidatePath('/admin/tenants')
  redirect(`/admin/tenants/${tenant.id}`)
}

export async function updateTenant(tenantId: string, formData: FormData) {
  const supabase = await requireSuperAdmin()

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

  revalidatePath(`/admin/tenants/${tenantId}`)
  revalidatePath('/admin/tenants')
}

export async function updateTenantStatus(tenantId: string, status: string) {
  const supabase = await requireSuperAdmin()

  const { error } = await supabase
    .from('tenants')
    .update({ status })
    .eq('id', tenantId)

  if (error) {
    return { error: `Failed to update status: ${error.message}` }
  }

  revalidatePath(`/admin/tenants/${tenantId}`)
  revalidatePath('/admin/tenants')
  revalidatePath('/admin')
}
