import { headers } from 'next/headers'
import { createServiceRoleClient } from '@/lib/supabase/service'
import type { Tenant, ThemeConfig } from './types'

/**
 * Reads tenant info from request headers (set by middleware).
 * Use in Server Components and Route Handlers.
 */
export async function getTenantFromHeaders(): Promise<Tenant | null> {
  const headerStore = await headers()
  const id = headerStore.get('x-tenant-id')

  if (!id) return null

  return {
    id,
    name: headerStore.get('x-tenant-name') || '',
    slug: headerStore.get('x-tenant-slug') || '',
    custom_domain: null,
    theme_id: headerStore.get('x-tenant-theme-id') || null,
    status: 'active',
    settings: {},
  }
}

/**
 * Fetches the full theme config JSONB from the database.
 * Uses service role client to bypass RLS (themes are global).
 */
export async function getThemeConfig(
  themeId: string
): Promise<ThemeConfig | null> {
  const supabase = createServiceRoleClient()

  const { data } = await supabase
    .from('themes')
    .select('config')
    .eq('id', themeId)
    .single()

  if (!data?.config) return null
  return data.config as ThemeConfig
}
