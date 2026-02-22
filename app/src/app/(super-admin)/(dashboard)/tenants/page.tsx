import { createServiceRoleClient } from '@/lib/supabase/service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { TenantFilters } from './_components/tenant-filters'

interface SearchParams {
  status?: string
  q?: string
}

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = createServiceRoleClient()

  let query = supabase
    .from('tenants')
    .select('id, name, slug, custom_domain, status, theme_id, subscription_status, created_at, themes(name)')
    .order('created_at', { ascending: false })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,slug.ilike.%${params.q}%`)
  }

  const { data: tenants } = await query

  // Get member counts
  const tenantIds = (tenants || []).map((t) => t.id)
  let memberCounts: Record<string, number> = {}

  if (tenantIds.length > 0) {
    const { data: counts } = await supabase
      .from('members')
      .select('tenant_id')
      .in('tenant_id', tenantIds)

    if (counts) {
      memberCounts = counts.reduce((acc: Record<string, number>, row) => {
        acc[row.tenant_id] = (acc[row.tenant_id] || 0) + 1
        return acc
      }, {})
    }
  }

  const statusColor: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    suspended: 'destructive',
    archived: 'secondary',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tenants</h1>
          <p className="text-sm text-slate-400">Manage studio tenants</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/tenants/new">
            <Plus className="size-4" />
            New Tenant
          </Link>
        </Button>
      </div>

      <TenantFilters currentStatus={params.status || 'all'} currentQuery={params.q || ''} />

      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Name</TableHead>
                <TableHead className="text-slate-400">Slug</TableHead>
                <TableHead className="text-slate-400">Custom Domain</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Members</TableHead>
                <TableHead className="text-slate-400">Theme</TableHead>
                <TableHead className="text-slate-400">Subscription</TableHead>
                <TableHead className="text-slate-400">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!tenants || tenants.length === 0) ? (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                    No tenants found.
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => {
                  const theme = (Array.isArray(tenant.themes) ? tenant.themes[0] : tenant.themes) as { name: string } | null
                  return (
                    <TableRow key={tenant.id} className="border-slate-800">
                      <TableCell>
                        <Link
                          href={`/tenants/${tenant.id}`}
                          className="font-medium text-white hover:text-blue-400 transition-colors"
                        >
                          {tenant.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-slate-400 font-mono text-xs">
                        {tenant.slug}
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs">
                        {tenant.custom_domain || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColor[tenant.status] || 'outline'}>
                          {tenant.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {memberCounts[tenant.id] || 0}
                      </TableCell>
                      <TableCell className="text-slate-400">{theme?.name || '—'}</TableCell>
                      <TableCell className="text-slate-400 text-xs">
                        {tenant.subscription_status || '—'}
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {new Date(tenant.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
