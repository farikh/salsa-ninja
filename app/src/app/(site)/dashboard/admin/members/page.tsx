import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MembersManager from './MembersManager'

export default async function AdminMembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin (owner)
  const { data: isAdmin } = await supabase.rpc('is_admin')

  if (!isAdmin) {
    redirect('/dashboard')
  }

  // Get list of all roles for the UI
  const { data: roles } = await supabase
    .from('roles')
    .select('id, name, display_name')
    .order('name')

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: '1200px' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="heading-lg">Member Management</h1>
          <p style={{ color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
            Manage member roles and permissions
          </p>
        </div>

        <MembersManager availableRoles={roles ?? []} />
      </div>
    </section>
  )
}
