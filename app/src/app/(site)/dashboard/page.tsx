import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './logout-button'
import { DashboardTabs } from './DashboardTabs'
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

  // Fetch available roles for members tab (admin only)
  let availableRoles: { id: string; name: string; display_name: string }[] = []
  if (isAdmin) {
    const { data: roles } = await supabase
      .from('roles')
      .select('id, name, display_name')
      .order('name')
    availableRoles = roles ?? []
  }

  // Fetch instructors for private lessons tab
  let instructors: { id: string; display_name: string; full_name: string; avatar_url: string | null }[] = []
  if (isInstructor) {
    const { data: allMembers } = await supabase
      .from('member_profiles')
      .select('id, display_name, full_name, avatar_url, all_roles, role_name')

    instructors = (allMembers ?? [])
      .filter((m) => {
        const roles: string[] = m.all_roles || [m.role_name]
        return roles.includes('instructor') || roles.includes('owner')
      })
      .map((m) => ({
        id: m.id,
        display_name: m.display_name,
        full_name: m.full_name,
        avatar_url: m.avatar_url,
      }))
  }

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

        <DashboardTabs
          member={{
            id: member.id,
            email: member.email,
            full_name: member.full_name,
            display_name: member.display_name,
            dance_experience: member.dance_experience,
            created_at: member.created_at,
            enrollment_plan: member.enrollment_plan ?? null,
            bootcamp_enrolled: member.bootcamp_enrolled ?? false,
          }}
          bookings={(bookings ?? []) as PrivateLessonBooking[]}
          events={events ?? []}
          isAdmin={isAdmin}
          isInstructor={isInstructor}
          isStaff={isStaff}
          availableRoles={availableRoles}
          instructors={instructors}
        />
      </div>
    </section>
  )
}
