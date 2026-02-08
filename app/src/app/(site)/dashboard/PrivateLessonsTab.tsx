'use client'

import { CalendarView } from '../private-sessions/CalendarView'
import InstructorAvailabilityManager from '../private-sessions/InstructorAvailabilityManager'
import type { Instructor } from '@/types/booking'

interface PrivateLessonsTabProps {
  instructors: Instructor[]
  memberId: string
}

export function PrivateLessonsTab({ instructors, memberId }: PrivateLessonsTabProps) {
  return (
    <div>
      {/* Instructor Availability Manager */}
      <div style={{ marginBottom: '2rem' }}>
        <InstructorAvailabilityManager instructorId={memberId} />
      </div>

      {/* Booking Calendar */}
      <div>
        <h2 className="heading-md" style={{ marginBottom: '0.5rem' }}>Book a Session</h2>
        <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Browse instructor availability and manage bookings
        </p>
        <CalendarView instructors={instructors} />
      </div>
    </div>
  )
}
