import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './logout-button'
import UpcomingEventsWidget from './upcoming-events-widget'

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

  // Check all_roles array for multi-role support, fallback to role_name for backward compatibility
  const allRoles: string[] = member.all_roles || [member.role_name]
  const isAdmin = allRoles.includes('owner')
  const isInstructor = allRoles.includes('owner') || allRoles.includes('instructor')
  const isStaff = isAdmin || isInstructor

  // Display role labels
  const roleLabels: Record<string, string> = {
    owner: 'Admin',
    instructor: 'Instructor',
    member_full: 'Student',
    member_limited: 'Limited',
    guest: 'Guest'
  }

  const { data: events } = await supabase
    .from('upcoming_events')
    .select('id, title, description, start_time, end_time')
    .limit(10)

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 className="heading-lg">
              Welcome, {member.display_name || member.full_name}
            </h1>
            <p style={{ color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
              {allRoles.map(r => roleLabels[r] || r).join(' • ')}
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* Quick Actions */}
        {isStaff && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Quick Actions</h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {isAdmin && (
                <Link
                  href="/dashboard/admin/members"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  Manage Members
                </Link>
              )}
              {isInstructor && (
                <Link
                  href="/private-sessions"
                  className="btn btn-secondary"
                  style={{ textDecoration: 'none' }}
                >
                  Private Lessons
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="grid-2">
          <UpcomingEventsWidget initialEvents={events ?? []} isStaff={isStaff} />

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
