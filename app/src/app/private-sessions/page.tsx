import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CalendarView } from './CalendarView'
import InstructorAvailabilityManager from './InstructorAvailabilityManager'
import type { Instructor } from '@/types/booking'

export default async function PrivateSessionsPage() {
  const supabase = await createClient()

  // Check auth state
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch member profile if authenticated
  let currentMemberId: string | null = null
  let isInstructor = false
  let instructors: Instructor[] = []

  if (user) {
    // Get current member's ID and check if they're an instructor
    const { data: member } = await supabase
      .from('member_profiles')
      .select('id, all_roles, role_name')
      .eq('user_id', user.id)
      .single()

    if (member) {
      currentMemberId = member.id
      const allRoles: string[] = member.all_roles || [member.role_name]
      isInstructor = allRoles.includes('owner') || allRoles.includes('instructor')
    }

    // Fetch all instructors via member_profiles view (has pre-computed all_roles array)
    const { data: allMembers } = await supabase
      .from('member_profiles')
      .select('id, display_name, full_name, avatar_url, all_roles, role_name')

    instructors = (allMembers ?? [])
      .filter((m) => {
        const allRoles: string[] = m.all_roles || [m.role_name]
        return allRoles.includes('instructor') || allRoles.includes('owner')
      })
      .map((m) => ({
        id: m.id,
        display_name: m.display_name,
        full_name: m.full_name,
        avatar_url: m.avatar_url,
      }))
  }

  return (
    <>
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <span className="badge">One-on-One</span>
            <h1 className="heading-xl mt-4">Private Lessons</h1>
            <p className="subtitle">
              Accelerate your learning with personalized instruction
            </p>
          </div>
        </div>
      </section>

      {/* Instructor Availability Manager — only visible to instructors */}
      {user && isInstructor && currentMemberId && (
        <section className="section">
          <div className="container" style={{ maxWidth: '800px' }}>
            <InstructorAvailabilityManager instructorId={currentMemberId} />
          </div>
        </section>
      )}

      {/* Booking calendar — only visible when logged in */}
      {user ? (
        <section className="section">
          <div className="container">
            <div className="text-center mb-8">
              <h2 className="heading-lg">Book a Session</h2>
              <p
                className="text-muted-foreground mt-4"
                style={{ maxWidth: '42rem', margin: '1rem auto 0' }}
              >
                Private lessons offer personalized instruction tailored to your
                goals. Whether you&apos;re preparing for a special event, want
                to accelerate your learning, or focus on specific techniques,
                our instructors are here to help.
              </p>
            </div>

            <CalendarView instructors={instructors} />
          </div>
        </section>
      ) : (
        <section className="section">
          <div className="container">
            <div
              className="text-center"
              style={{ maxWidth: '32rem', margin: '0 auto' }}
            >
              <h2 className="heading-lg">Book a Session</h2>
              <p
                className="text-muted-foreground mt-4"
                style={{ lineHeight: 1.7 }}
              >
                Private lessons offer personalized instruction tailored to your
                goals. Log in to browse instructor availability and book your
                next session.
              </p>
              <Link
                href="/login?redirect=/private-sessions"
                className="btn btn-primary mt-6"
                style={{ display: 'inline-flex' }}
              >
                Log In to Book
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Pricing */}
      <section className="section section-alt">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="heading-lg">Pricing</h2>
          </div>
          <div
            className="grid-2"
            style={{ maxWidth: '600px', margin: '0 auto' }}
          >
            <div className="card text-center">
              <div
                style={{
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  color: 'var(--muted-foreground)',
                  marginBottom: '0.5rem',
                }}
              >
                5 Hour Package
              </div>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  color: 'var(--primary)',
                }}
              >
                $475
              </div>
              <div
                style={{
                  color: 'var(--muted-foreground)',
                  fontSize: '0.9rem',
                }}
              >
                $95/hour
              </div>
            </div>
            <div className="card text-center">
              <div
                style={{
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  color: 'var(--muted-foreground)',
                  marginBottom: '0.5rem',
                }}
              >
                10 Hour Package
              </div>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  color: 'var(--primary)',
                }}
              >
                $850
              </div>
              <div
                style={{
                  color: 'var(--muted-foreground)',
                  fontSize: '0.9rem',
                }}
              >
                $85/hour
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Important info */}
      <section className="section">
        <div className="container">
          <div
            style={{
              textAlign: 'center',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            <h3 className="heading-md" style={{ marginBottom: '1rem' }}>
              Important Information
            </h3>
            <p
              style={{
                color: 'var(--muted-foreground)',
                lineHeight: 1.7,
              }}
            >
              All private lesson appointments must be approved 24 hours in
              advance. Cancellations require at least 24 hours notice to
              reschedule without penalty.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
