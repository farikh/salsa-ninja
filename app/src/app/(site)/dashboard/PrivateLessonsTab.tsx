'use client'

import { useState, useCallback } from 'react'
import { format, parseISO, isPast } from 'date-fns'
import { CalendarView } from '../private-sessions/CalendarView'
import InstructorAvailabilityManager from '../private-sessions/InstructorAvailabilityManager'
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge'
import type { Instructor, PrivateLessonBooking, BookingStatus } from '@/types/booking'

interface PrivateLessonsTabProps {
  instructors: Instructor[]
  memberId: string
  isInstructor: boolean
  bookings: PrivateLessonBooking[]
}

function formatBookingTime(startTime: string, endTime: string): string {
  const start = parseISO(startTime)
  const end = parseISO(endTime)
  return `${format(start, 'EEE, MMM d')} \u00b7 ${format(start, 'h:mm a')} \u2013 ${format(end, 'h:mm a')}`
}

export function PrivateLessonsTab({ instructors, memberId, isInstructor, bookings: initialBookings }: PrivateLessonsTabProps) {
  const [bookings, setBookings] = useState(initialBookings)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const pendingRequests = isInstructor
    ? bookings.filter(b => b.status === 'pending' && b.instructor_id === memberId && b.member_id !== memberId)
    : []

  const upcomingBookings = bookings.filter(b => {
    const isActive: BookingStatus[] = ['pending', 'confirmed']
    return isActive.includes(b.status) && !isPast(parseISO(b.end_time))
  })

  const handleAction = useCallback(async (bookingId: string, action: 'confirm' | 'decline') => {
    setActionLoading(bookingId)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/${action}`, { method: 'POST' })
      if (res.ok) {
        setBookings(prev => prev.map(b =>
          b.id === bookingId
            ? { ...b, status: (action === 'confirm' ? 'confirmed' : 'declined') as BookingStatus }
            : b
        ))
      }
    } catch {
      // user can retry
    } finally {
      setActionLoading(null)
    }
  }, [])

  return (
    <div>
      {/* Section 1: Calendar */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="heading-md" style={{ marginBottom: '0.5rem' }}>Private Lessons</h2>
        <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {isInstructor
            ? 'View your calendar, manage bookings, and set availability'
            : 'Browse instructor availability and book sessions'}
        </p>
        <CalendarView instructors={instructors} />
      </div>

      {/* Section 2: Bookings List */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>
          {isInstructor ? 'Your Bookings' : 'Your Bookings'}
        </h3>

        {/* Pending requests — instructor only */}
        {pendingRequests.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <p style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#f59e0b',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Pending Requests ({pendingRequests.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {pendingRequests.map(booking => (
                <div
                  key={booking.id}
                  style={{
                    border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    background: 'rgba(245,158,11,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '0.5rem' }}>
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 500, margin: 0 }}>
                        {formatBookingTime(booking.start_time, booking.end_time)}
                      </p>
                      {booking.notes && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: '0.25rem 0 0' }}>
                          {booking.notes}
                        </p>
                      )}
                    </div>
                    <BookingStatusBadge status={booking.status} size="sm" />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => handleAction(booking.id, 'confirm')}
                      disabled={actionLoading === booking.id}
                      style={{
                        background: '#22c55e',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.3rem 0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: actionLoading === booking.id ? 0.5 : 1,
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleAction(booking.id, 'decline')}
                      disabled={actionLoading === booking.id}
                      style={{
                        background: 'transparent',
                        color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '6px',
                        padding: '0.3rem 0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: actionLoading === booking.id ? 0.5 : 1,
                      }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {upcomingBookings.length > 0 ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {upcomingBookings.map(booking => (
              <div
                key={booking.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <p style={{ fontSize: '0.85rem', margin: 0 }}>
                  {formatBookingTime(booking.start_time, booking.end_time)}
                </p>
                <BookingStatusBadge status={booking.status} size="sm" />
              </div>
            ))}
          </div>
        ) : (
          pendingRequests.length === 0 && (
            <div className="card">
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', margin: 0 }}>
                No upcoming bookings. {isInstructor ? 'Check the calendar above for new requests.' : 'Select a date on the calendar to book a session.'}
              </p>
            </div>
          )
        )}
      </div>

      {/* Section 3: Availability — instructor only */}
      {isInstructor && (
        <div>
          <InstructorAvailabilityManager instructorId={memberId} />
        </div>
      )}
    </div>
  )
}
