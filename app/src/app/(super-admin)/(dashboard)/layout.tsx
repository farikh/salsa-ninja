import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { SuperAdminShell } from '../_components/admin-shell'

export default async function AuthenticatedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify user is a super admin using service role (bypasses RLS)
  const serviceClient = createServiceRoleClient()
  const { data: admin } = await serviceClient
    .from('super_admins')
    .select('id, email, full_name, role')
    .eq('user_id', user.id)
    .single()

  if (!admin) {
    redirect('/login')
  }

  return (
    <SuperAdminShell admin={admin}>
      {children}
    </SuperAdminShell>
  )
}
