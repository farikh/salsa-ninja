import { createServiceRoleClient } from '@/lib/supabase/service'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { InviteAdminDialog } from './_components/invite-admin-dialog'

export default async function AdminsPage() {
  const supabase = createServiceRoleClient()

  const { data: admins } = await supabase
    .from('super_admins')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admins</h1>
          <p className="text-sm text-slate-400">Manage platform administrators</p>
        </div>
        <InviteAdminDialog />
      </div>

      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Name</TableHead>
                <TableHead className="text-slate-400">Email</TableHead>
                <TableHead className="text-slate-400">Role</TableHead>
                <TableHead className="text-slate-400">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!admins || admins.length === 0) ? (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                    No admins found.
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => (
                  <TableRow key={admin.id} className="border-slate-800">
                    <TableCell className="text-white font-medium">
                      {admin.full_name || '—'}
                    </TableCell>
                    <TableCell className="text-slate-400">{admin.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={admin.role === 'super_admin' ? 'default' : 'secondary'}
                        className={admin.role === 'super_admin' ? 'bg-blue-600' : ''}
                      >
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Support'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {new Date(admin.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
