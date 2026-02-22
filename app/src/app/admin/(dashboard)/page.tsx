import { createServiceRoleClient } from '@/lib/supabase/service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Building2, Users, Activity, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default async function SuperAdminDashboard() {
  const supabase = createServiceRoleClient()

  // Fetch all metrics in parallel
  const [
    tenantsResult,
    membersResult,
    recentSignupsResult,
    tenantHealthResult,
  ] = await Promise.all([
    // Total tenants by status
    supabase.from('tenants').select('id, status'),
    // Total members across all tenants
    supabase.from('members').select('id', { count: 'exact', head: true }),
    // New signups in last 7 days
    supabase
      .from('members')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    // Tenant health data
    supabase
      .from('tenants')
      .select('id, name, slug, status, theme_id, created_at, themes(name)')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const tenants = tenantsResult.data || []
  const totalMembers = membersResult.count || 0
  const recentSignups = recentSignupsResult.count || 0

  const activeTenants = tenants.filter((t) => t.status === 'active').length
  const suspendedTenants = tenants.filter((t) => t.status === 'suspended').length
  const archivedTenants = tenants.filter((t) => t.status === 'archived').length

  // Get member counts per tenant
  const healthTenants = tenantHealthResult.data || []
  const tenantIds = healthTenants.map((t) => t.id)

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
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400">Platform overview and tenant health</p>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Tenants
            </CardTitle>
            <Building2 className="size-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{tenants.length}</div>
            <p className="text-xs text-slate-500">
              {activeTenants} active, {suspendedTenants} suspended, {archivedTenants} archived
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Students
            </CardTitle>
            <Users className="size-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalMembers}</div>
            <p className="text-xs text-slate-500">Across all tenants</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Active Tenants
            </CardTitle>
            <Activity className="size-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{activeTenants}</div>
            <p className="text-xs text-slate-500">
              {tenants.length > 0
                ? `${Math.round((activeTenants / tenants.length) * 100)}% of total`
                : 'No tenants yet'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              New Signups (7d)
            </CardTitle>
            <UserPlus className="size-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{recentSignups}</div>
            <p className="text-xs text-slate-500">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Tenant health table */}
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <CardTitle className="text-white">Tenant Health</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Name</TableHead>
                <TableHead className="text-slate-400">Slug</TableHead>
                <TableHead className="text-slate-400">Members</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Theme</TableHead>
                <TableHead className="text-slate-400">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {healthTenants.length === 0 ? (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    No tenants yet. Create your first tenant to get started.
                  </TableCell>
                </TableRow>
              ) : (
                healthTenants.map((tenant) => {
                  const theme = (Array.isArray(tenant.themes) ? tenant.themes[0] : tenant.themes) as { name: string } | null
                  return (
                    <TableRow key={tenant.id} className="border-slate-800">
                      <TableCell>
                        <Link
                          href={`/admin/tenants/${tenant.id}`}
                          className="font-medium text-white hover:text-blue-400 transition-colors"
                        >
                          {tenant.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-slate-400">{tenant.slug}</TableCell>
                      <TableCell className="text-slate-300">
                        {memberCounts[tenant.id] || 0}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColor[tenant.status] || 'outline'}>
                          {tenant.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {theme?.name || 'None'}
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
