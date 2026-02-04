import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './logout-button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: member } = await supabase
    .from('member_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!member) {
    redirect('/join/profile')
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 className="heading-lg">
              Welcome, {member.display_name || member.full_name}
            </h1>
            <p style={{ color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
              {member.role_name === 'owner' ? 'Owner' :
               member.role_name === 'instructor' ? 'Instructor' :
               member.role_name === 'member_full' ? 'Member' :
               member.role_name === 'member_limited' ? 'Limited Member' : 'Guest'}
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="grid-2">
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Upcoming Events</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
              No upcoming events yet. Check back soon!
            </p>
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Announcements</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
              No announcements at this time.
            </p>
          </div>
        </div>

        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Your Profile</h3>
          <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.95rem' }}>
            <div><span style={{ color: 'var(--muted-foreground)' }}>Email:</span> {member.email}</div>
            <div><span style={{ color: 'var(--muted-foreground)' }}>Name:</span> {member.full_name}</div>
            {member.dance_experience && (
              <div><span style={{ color: 'var(--muted-foreground)' }}>Experience:</span> {member.dance_experience}</div>
            )}
            <div><span style={{ color: 'var(--muted-foreground)' }}>Member since:</span> {new Date(member.created_at).toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
