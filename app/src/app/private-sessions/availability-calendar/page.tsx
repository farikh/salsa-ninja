import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AvailabilityCalendar } from './AvailabilityCalendar'

export default async function AvailabilityCalendarPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirect=/private-sessions/availability-calendar')
  }

  // Get member profile with roles
  const { data: member } = await supabase
    .from('member_profiles')
    .select('id, all_roles, role_name')
    .eq('user_id', user.id)
    .single()

  if (!member) {
    redirect('/private-sessions')
  }

  const allRoles: string[] = member.all_roles || [member.role_name]
  const isInstructor =
    allRoles.includes('owner') || allRoles.includes('instructor')

  if (!isInstructor) {
    redirect('/private-sessions')
  }

  return (
    <>
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <span className="badge">Instructor</span>
            <h1 className="heading-xl mt-4">Availability Calendar</h1>
            <p className="subtitle">
              View and manage your teaching schedule
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: '1100px' }}>
          <AvailabilityCalendar instructorId={member.id} />
        </div>
      </section>
    </>
  )
}
