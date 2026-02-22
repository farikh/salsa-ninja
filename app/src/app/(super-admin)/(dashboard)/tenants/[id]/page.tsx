import { createServiceRoleClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, CalendarDays, MessageSquare, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { TenantEditForm } from './_components/tenant-edit-form'
import { TenantStatusActions } from './_components/tenant-status-actions'

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServiceRoleClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*, themes(id, name, config)')
    .eq('id', id)
    .single()

  if (!tenant) {
    notFound()
  }

  // Fetch themes for selector and stats in parallel
  const [themesResult, memberCountResult, eventCountResult, messageCountResult] =
    await Promise.all([
      supabase
        .from('themes')
        .select('id, name, slug, config')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', id),
      supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', id)
        .gte('start_time', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', id)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ])

  const themes = themesResult.data || []
  const memberCount = memberCountResult.count || 0
  const eventCount = eventCountResult.count || 0
  const messageCount = messageCountResult.count || 0

  const statusColor: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    suspended: 'destructive',
    archived: 'secondary',
  }

  const drillDownLinks = [
    { href: `/tenants/${id}/members`, label: 'Members', icon: Users, count: memberCount },
    { href: `/tenants/${id}/events`, label: 'Events', icon: CalendarDays, count: eventCount },
    { href: `/tenants/${id}/messages`, label: 'Messages', icon: MessageSquare, count: messageCount },
    { href: `/tenants/${id}/analytics`, label: 'Analytics', icon: BarChart3, count: null },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/tenants"
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Tenants
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
            <Badge variant={statusColor[tenant.status] || 'outline'}>
              {tenant.status}
            </Badge>
          </div>
          <p className="text-sm text-slate-400 font-mono">{tenant.slug}</p>
        </div>
        <TenantStatusActions tenantId={tenant.id} currentStatus={tenant.status} />
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {drillDownLinks.map((link) => {
          const Icon = link.icon
          return (
            <Link key={link.href} href={link.href}>
              <Card className="border-slate-800 bg-slate-900 hover:border-slate-700 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">{link.label}</p>
                      {link.count !== null && (
                        <p className="text-2xl font-bold text-white">{link.count}</p>
                      )}
                      {link.count === null && (
                        <p className="text-sm text-blue-400">View</p>
                      )}
                    </div>
                    <Icon className="size-5 text-slate-600" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Edit form */}
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <CardTitle className="text-white">Tenant Details</CardTitle>
        </CardHeader>
        <CardContent>
          <TenantEditForm
            tenant={{
              id: tenant.id,
              name: tenant.name,
              slug: tenant.slug,
              custom_domain: tenant.custom_domain,
              theme_id: tenant.theme_id,
            }}
            themes={themes}
          />
        </CardContent>
      </Card>
    </div>
  )
}
