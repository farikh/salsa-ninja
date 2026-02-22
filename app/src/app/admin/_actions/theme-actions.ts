'use server'

import { revalidatePath } from 'next/cache'
import { requireSuperAdmin } from './auth'

export async function updateTheme(themeId: string, formData: FormData) {
  const supabase = await requireSuperAdmin()

  const name = formData.get('name') as string
  const description = formData.get('description') as string

  // Build config from form data
  const config: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('config_') && typeof value === 'string' && value) {
      const configKey = key.replace('config_', '')
      config[configKey] = value
    }
  }

  const { error } = await supabase
    .from('themes')
    .update({
      name,
      description: description || null,
      config,
    })
    .eq('id', themeId)

  if (error) {
    return { error: `Failed to update theme: ${error.message}` }
  }

  revalidatePath(`/admin/themes/${themeId}`)
  revalidatePath('/admin/themes')
}

export async function assignThemeToTenant(themeId: string, tenantId: string) {
  const supabase = await requireSuperAdmin()

  const { error } = await supabase
    .from('tenants')
    .update({ theme_id: themeId })
    .eq('id', tenantId)

  if (error) {
    return { error: `Failed to assign theme: ${error.message}` }
  }

  revalidatePath('/admin/themes')
  revalidatePath('/admin/tenants')
}
