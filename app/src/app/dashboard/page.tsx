import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './logout-button'
import UpcomingEventsWidget from './upcoming-events-widget'
import { DashboardBookings } from './DashboardBookings'
import { DashboardMessages } from './DashboardMessages'
import type { PrivateLessonBooking } from '@/types/booking'

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

  // Fetch bookings for the dashboard — RLS ensures correct access
  const { data: bookings } = await supabase
    .from('private_lesson_bookings')
    .select('*')
    .in('status', ['pending', 'confirmed'])
    .gte('end_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(20)

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: '900px' }}>
        {/* Welcome Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 className="heading-lg">
              Welcome, {member.display_name || member.full_name}
            </h1>
            <p style={{ color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
              {allRoles.map(r => roleLabels[r] || r).join(' \u2022 ')}
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* Quick Actions — Staff Only */}
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

        {/* Main Dashboard Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>

          {/* Messages */}
          <DashboardMessages
            initialBookings={(bookings ?? []) as PrivateLessonBooking[]}
            memberId={member.id}
          />

          {/* Upcoming Bookings — live data */}
          <DashboardBookings
            initialBookings={(bookings ?? []) as PrivateLessonBooking[]}
            memberId={member.id}
            isInstructor={isInstructor}
          />

          {/* My Enrollment */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.15))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <polyline points="17 11 19 13 23 9"/>
                </svg>
              </div>
              <h3 style={{ fontWeight: 600 }}>My Enrollment</h3>
            </div>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', marginBottom: '1rem', flex: 1 }}>
              View class schedules and manage your enrollment.
            </p>
            <Link
              href="/schedule"
              style={{
                color: '#ef4444',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              View class schedule
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          </div>

          {/* Video Library */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.15))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </div>
              <h3 style={{ fontWeight: 600 }}>Video Library</h3>
            </div>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', marginBottom: '1rem', flex: 1 }}>
              Access class recordings and archived videos. Coming soon!
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span
                style={{
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                Recent class videos
                <span style={{
                  fontSize: '0.7rem',
                  background: 'rgba(239,68,68,0.15)',
                  color: '#ef4444',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontWeight: 600,
                }}>
                  Soon
                </span>
              </span>
              <span
                style={{
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                Video archive
                <span style={{
                  fontSize: '0.7rem',
                  background: 'rgba(239,68,68,0.15)',
                  color: '#ef4444',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontWeight: 600,
                }}>
                  Soon
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Events & Announcements Row */}
        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          <UpcomingEventsWidget initialEvents={events ?? []} isStaff={isStaff} />

          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Announcements</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
              No announcements at this time.
            </p>
          </div>
        </div>

        {/* Your Profile */}
        <div className="card">
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

      <style>{`
        @media (max-width: 640px) {
          .container > div[style*="grid-template-columns: repeat(2"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
