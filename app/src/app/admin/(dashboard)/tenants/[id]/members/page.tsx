import { createServiceRoleClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
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
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function TenantMembersPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServiceRoleClient()

  // Verify tenant exists
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!tenant) {
    notFound()
  }

  // Fetch members with their roles
  const { data: members } = await supabase
    .from('members')
    .select(`
      id,
      email,
      display_name,
      avatar_url,
      subscription_status,
      created_at,
      last_login_at,
      member_roles(role)
    `)
    .eq('tenant_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/tenants/${id}`}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to {tenant.name}
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Members</h1>
        <p className="text-sm text-slate-400">{tenant.name} - {members?.length || 0} members</p>
      </div>

      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Name</TableHead>
                <TableHead className="text-slate-400">Email</TableHead>
                <TableHead className="text-slate-400">Roles</TableHead>
                <TableHead className="text-slate-400">Subscription</TableHead>
                <TableHead className="text-slate-400">Last Login</TableHead>
                <TableHead className="text-slate-400">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!members || members.length === 0) ? (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    No members found.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => {
                  const roles = (member.member_roles as { role: string }[]) || []
                  return (
                    <TableRow key={member.id} className="border-slate-800">
                      <TableCell className="text-white font-medium">
                        {member.display_name || '—'}
                      </TableCell>
                      <TableCell className="text-slate-400">{member.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {roles.map((r, i) => (
                            <Badge key={i} variant="outline" className="text-xs border-slate-700 text-slate-300">
                              {r.role}
                            </Badge>
                          ))}
                          {roles.length === 0 && (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs">
                        {member.subscription_status || '—'}
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {member.last_login_at
                          ? new Date(member.last_login_at).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {new Date(member.created_at).toLocaleDateString()}
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
