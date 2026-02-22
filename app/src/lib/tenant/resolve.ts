import { createServiceRoleClient } from '@/lib/supabase/service'

export interface TenantInfo {
  id: string
  name: string
  slug: string
  custom_domain: string | null
  theme_id: string | null
  status: string
  settings: Record<string, unknown>
}

// In-memory cache with 1-minute TTL
const CACHE_TTL_MS = 60_000

interface CacheEntry {
  tenant: TenantInfo | null
  timestamp: number
}

const tenantCache = new Map<string, CacheEntry>()

function getCached(key: string): TenantInfo | null | undefined {
  const entry = tenantCache.get(key)
  if (!entry) return undefined
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    tenantCache.delete(key)
    return undefined
  }
  return entry.tenant
}

function setCache(key: string, tenant: TenantInfo | null) {
  tenantCache.set(key, { tenant, timestamp: Date.now() })
}

/**
 * The root domain for the platform. Subdomains are parsed relative to this.
 * Examples: "salsaninja.com", "localhost:3000"
 */
function getRootDomain(): string {
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
}

/**
 * Extracts subdomain from hostname.
 * - `salsa-ninja.salsaninja.com` → `salsa-ninja`
 * - `localhost` → null (use query param fallback)
 * - `salsa-ninja.localhost` → `salsa-ninja`
 * - Skips `www` and `admin` subdomains (returns null for www, handled separately for admin)
 */
export function parseSubdomain(hostname: string): string | null {
  // Strip port if present
  const host = hostname.split(':')[0]
  const rootDomain = getRootDomain().split(':')[0]

  // Exact root domain match — no subdomain
  if (host === rootDomain || host === 'localhost') {
    return null
  }

  // Handle *.localhost (e.g. salsa-ninja.localhost)
  if (host.endsWith('.localhost')) {
    const sub = host.replace('.localhost', '')
    if (sub === 'www' || sub === 'admin') return null
    return sub || null
  }

  // Handle *.rootDomain (e.g. salsa-ninja.salsaninja.com)
  if (host.endsWith(`.${rootDomain}`)) {
    const sub = host.slice(0, -(rootDomain.length + 1))
    if (sub === 'www' || sub === 'admin') return null
    return sub || null
  }

  // If the host doesn't match the root domain at all, it could be a custom domain
  // Return null — custom domain matching is handled separately
  return null
}

/**
 * Returns true if the hostname is the super admin domain.
 * e.g. `admin.salsaninja.com` or `admin.localhost`
 */
export function isSuperAdminDomain(hostname: string): boolean {
  const host = hostname.split(':')[0]
  const rootDomain = getRootDomain().split(':')[0]

  return host === `admin.${rootDomain}` || host === 'admin.localhost'
}

/**
 * Returns true if the hostname is the root domain (no subdomain) or www.
 */
export function isRootDomain(hostname: string): boolean {
  const host = hostname.split(':')[0]
  const rootDomain = getRootDomain().split(':')[0]

  return (
    host === rootDomain ||
    host === `www.${rootDomain}` ||
    host === 'localhost' ||
    host === 'www.localhost'
  )
}

/**
 * Resolves a tenant from hostname using:
 * 1. Custom domain match (exact)
 * 2. Subdomain → slug match
 *
 * Uses service role client to bypass RLS.
 * Results are cached for 1 minute.
 */
export async function resolveTenantFromHostname(
  hostname: string
): Promise<TenantInfo | null> {
  // Check cache first
  const cached = getCached(hostname)
  if (cached !== undefined) return cached

  const supabase = createServiceRoleClient()
  const host = hostname.split(':')[0]

  // 1. Try custom domain match
  const { data: customDomainTenant } = await supabase
    .from('tenants')
    .select('id, name, slug, custom_domain, theme_id, status, settings')
    .eq('custom_domain', host)
    .eq('status', 'active')
    .single()

  if (customDomainTenant) {
    const tenant = customDomainTenant as TenantInfo
    setCache(hostname, tenant)
    return tenant
  }

  // 2. Try subdomain → slug match
  const subdomain = parseSubdomain(hostname)
  if (subdomain) {
    const { data: slugTenant } = await supabase
      .from('tenants')
      .select('id, name, slug, custom_domain, theme_id, status, settings')
      .eq('slug', subdomain)
      .eq('status', 'active')
      .single()

    if (slugTenant) {
      const tenant = slugTenant as TenantInfo
      setCache(hostname, tenant)
      return tenant
    }
  }

  // Not found
  setCache(hostname, null)
  return null
}
