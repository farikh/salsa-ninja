import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  resolveTenantFromHostname,
  isSuperAdminDomain,
  isRootDomain,
} from '@/lib/tenant/resolve'

const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/pricing',
  '/schedule',
  '/contact',
  '/login',
  '/join',
  '/private-sessions',
  '/events',
  '/bootcamp',
  '/shoes',
  '/roadmap',
  '/themes',
  '/admin/login',
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )
}

export async function updateSession(request: NextRequest) {
  const hostname = request.headers.get('host') || 'localhost:3000'
  const pathname = request.nextUrl.pathname
  const isAuthCallback = pathname.startsWith('/auth/callback')
  const isApiRoute = pathname.startsWith('/api/')

  // ── Resolve tenant context before creating response ──────
  // This determines which headers to set on the request object
  // before NextResponse.next({ request }) is created.

  let tenantHeaders: Record<string, string> = {}
  let redirectUrl: string | null = null
  let domainType: 'root' | 'admin' | 'tenant' = 'root'

  if (isRootDomain(hostname)) {
    domainType = 'root'
  } else if (isSuperAdminDomain(hostname)) {
    domainType = 'admin'
    tenantHeaders['x-super-admin'] = 'true'
  } else {
    domainType = 'tenant'

    // Resolve tenant from hostname, or ?tenant= query param on localhost
    let tenantHostname = hostname
    const tenantParam = request.nextUrl.searchParams.get('tenant')
    if (tenantParam && hostname.split(':')[0] === 'localhost') {
      tenantHostname = `${tenantParam}.localhost`
    }

    const tenant = await resolveTenantFromHostname(tenantHostname)

    if (!tenant) {
      const rootDomain =
        process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
      const protocol = request.nextUrl.protocol
      redirectUrl = `${protocol}//${rootDomain}`
    } else {
      tenantHeaders['x-tenant-id'] = tenant.id
      tenantHeaders['x-tenant-slug'] = tenant.slug
      tenantHeaders['x-tenant-name'] = tenant.name
      if (tenant.theme_id) {
        tenantHeaders['x-tenant-theme-id'] = tenant.theme_id
      }
    }
  }

  // Early redirect if tenant not found
  if (redirectUrl) {
    return NextResponse.redirect(redirectUrl)
  }

  // Set headers on request before creating the Supabase response.
  // This ensures headers are included in any NextResponse.next({ request })
  // created inside the setAll callback.
  for (const [key, value] of Object.entries(tenantHeaders)) {
    request.headers.set(key, value)
  }

  // ── Supabase session handling ────────────────────────────
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session — important for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Copy tenant headers to the response (they're already on the request)
  for (const [key, value] of Object.entries(tenantHeaders)) {
    supabaseResponse.headers.set(key, value)
  }

  // ── Route protection ─────────────────────────────────────

  if (domainType === 'root') {
    // Marketing site — no auth required
    return supabaseResponse
  }

  if (domainType === 'admin') {
    // Super admin: allow login, auth callback, and API routes without auth
    if (pathname === '/login' || isAuthCallback || isApiRoute) {
      return supabaseResponse
    }
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Tenant domain: allow public routes, auth callbacks, and API routes
  if (isPublicRoute(pathname) || isAuthCallback || isApiRoute) {
    return supabaseResponse
  }

  // Require authentication for protected tenant routes
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
