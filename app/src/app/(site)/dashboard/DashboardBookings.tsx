'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { format, parseISO, isPast } from 'date-fns'
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge'
import type { PrivateLessonBooking, BookingStatus } from '@/types/booking'

interface DashboardBookingsProps {
  /** All bookings the user should see (filtered server-side via RLS) */
  initialBookings: PrivateLessonBooking[]
  /** Member ID of the current user */
  memberId: string
  /** If the user is an instructor, their member ID is also their instructor ID */
  isInstructor: boolean
}

function formatBookingTime(startTime: string, endTime: string): string {
  const start = parseISO(startTime)
  const end = parseISO(endTime)
  return `${format(start, 'EEE, MMM d')} \u00b7 ${format(start, 'h:mm a')} \u2013 ${format(end, 'h:mm a')}`
}

export function DashboardBookings({
  initialBookings,
  memberId,
  isInstructor,
}: DashboardBookingsProps) {
  const [bookings, setBookings] = useState(initialBookings)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Separate pending requests (for instructors) from own bookings
  const pendingRequests = isInstructor
    ? bookings.filter(
        (b) => b.status === 'pending' && b.instructor_id === memberId && b.member_id !== memberId
      )
    : []

  const myBookings = bookings.filter((b) => {
    const isActive: BookingStatus[] = ['pending', 'confirmed']
    return isActive.includes(b.status) && !isPast(parseISO(b.end_time))
  })

  const handleAction = useCallback(
    async (bookingId: string, action: 'confirm' | 'decline') => {
      setActionLoading(bookingId)
      try {
        const res = await fetch(`/api/bookings/${bookingId}/${action}`, {
          method: 'POST',
        })
        if (res.ok) {
          setBookings((prev) =>
            prev.map((b) =>
              b.id === bookingId
                ? { ...b, status: action === 'confirm' ? 'confirmed' : ('declined' as BookingStatus) }
                : b
            )
          )
        }
      } catch {
        // Silently fail — user can retry
      } finally {
        setActionLoading(null)
      }
    },
    []
  )

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background:
              'linear-gradient(135deg, color-mix(in srgb, var(--primary) 15%, transparent), color-mix(in srgb, var(--primary-light) 15%, transparent))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <h3 style={{ fontWeight: 600 }}>
          {isInstructor ? 'Bookings' : 'Upcoming Bookings'}
        </h3>
      </div>

      {/* Pending requests — instructor only */}
      {pendingRequests.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <p
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--primary-light)',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Pending Requests ({pendingRequests.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pendingRequests.map((booking) => (
              <div
                key={booking.id}
                style={{
                  border: '1px solid color-mix(in srgb, var(--primary-light) 30%, transparent)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  background: 'color-mix(in srgb, var(--primary-light) 5%, transparent)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        margin: 0,
                      }}
                    >
                      {formatBookingTime(booking.start_time, booking.end_time)}
                    </p>
                    {booking.notes && (
                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--muted-foreground)',
                          margin: '0.25rem 0 0',
                        }}
                      >
                        {booking.notes}
                      </p>
                    )}
                  </div>
                  <BookingStatusBadge status={booking.status} size="sm" />
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginTop: '0.5rem',
                  }}
                >
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
                      color: 'var(--primary)',
                      border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
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

      {/* My upcoming bookings */}
      {myBookings.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {isInstructor && pendingRequests.length > 0 && (
            <p
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--muted-foreground)',
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Upcoming
            </p>
          )}
          {myBookings.slice(0, 5).map((booking) => (
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
              <p
                style={{
                  fontSize: '0.85rem',
                  margin: 0,
                }}
              >
                {formatBookingTime(booking.start_time, booking.end_time)}
              </p>
              <BookingStatusBadge status={booking.status} size="sm" />
            </div>
          ))}
          {myBookings.length > 5 && (
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--muted-foreground)',
                margin: '0.25rem 0 0',
              }}
            >
              +{myBookings.length - 5} more
            </p>
          )}
        </div>
      ) : (
        pendingRequests.length === 0 && (
          <p
            style={{
              color: 'var(--muted-foreground)',
              fontSize: '0.9rem',
              marginBottom: '1rem',
              flex: 1,
            }}
          >
            No upcoming private lessons booked.
          </p>
        )
      )}

      <Link
        href="/private-sessions"
        style={{
          color: 'var(--primary)',
          fontSize: '0.85rem',
          fontWeight: 600,
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          marginTop: '0.75rem',
        }}
      >
        {isInstructor ? 'Manage private lessons' : 'Book a private lesson'}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </Link>
    </div>
  )
}
