'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import { BookingDetailSheet } from '../../private-sessions/BookingDetailSheet'
import type { PrivateLessonBooking, Instructor, UnreadBookingMessage } from '@/types/booking'

interface ConversationsListProps {
  bookings: PrivateLessonBooking[]
  participants: Record<string, { display_name: string; full_name: string }>
  currentMemberId: string
  instructors: Instructor[]
}

export function ConversationsList({
  bookings,
  participants,
  currentMemberId,
  instructors,
}: ConversationsListProps) {
  const [selectedBooking, setSelectedBooking] = useState<PrivateLessonBooking | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [unread, setUnread] = useState<Set<string>>(new Set())

  // Fetch unread status
  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch('/api/bookings/unread')
        if (res.ok) {
          const data = await res.json()
          const ids = new Set<string>(
            (data.unread as UnreadBookingMessage[]).map(u => u.booking_id)
          )
          setUnread(ids)
        }
      } catch {
        // non-critical
      }
    }
    fetchUnread()
  }, [])

  const openConversation = (booking: PrivateLessonBooking) => {
    setSelectedBooking(booking)
    setSheetOpen(true)
    // Clear unread indicator for this booking
    setUnread(prev => {
      const next = new Set(prev)
      next.delete(booking.id)
      return next
    })
  }

  const getOtherParticipantName = (booking: PrivateLessonBooking) => {
    const otherId = booking.member_id === currentMemberId
      ? booking.instructor_id
      : booking.member_id
    const p = participants[otherId]
    return p?.display_name || p?.full_name || 'Unknown'
  }

  const getInstructor = (booking: PrivateLessonBooking): Instructor | null => {
    return instructors.find(i => i.id === booking.instructor_id) ?? null
  }

  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    confirmed: '#22c55e',
    completed: 'var(--muted-foreground)',
  }

  if (bookings.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
          No conversations yet. Book a private lesson to start messaging.
        </p>
        <Link
          href="/private-sessions"
          className="btn btn-primary"
          style={{ textDecoration: 'none', display: 'inline-flex' }}
        >
          Book a Private Lesson
        </Link>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {bookings.map((booking) => (
          <button
            key={booking.id}
            onClick={() => openConversation(booking)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'border-color 0.15s',
              color: 'inherit',
            }}
          >
            {/* Unread dot */}
            <div style={{ width: '8px', flexShrink: 0 }}>
              {unread.has(booking.id) && (
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ef4444',
                }} />
              )}
            </div>

            {/* Conversation info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>
                  {getOtherParticipantName(booking)}
                </p>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: `1px solid ${statusColors[booking.status] || 'var(--border)'}`,
                  color: statusColors[booking.status] || 'var(--muted-foreground)',
                  flexShrink: 0,
                }}>
                  {booking.status}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: '0.2rem 0 0' }}>
                {format(parseISO(booking.start_time), 'EEE, MMM d · h:mm a')}
                {booking.notes && (
                  <span> — {booking.notes.length > 40 ? booking.notes.slice(0, 40) + '...' : booking.notes}</span>
                )}
              </p>
            </div>

            {/* Arrow */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        ))}
      </div>

      {/* Booking Detail Sheet with messaging */}
      <BookingDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        booking={selectedBooking}
        instructor={selectedBooking ? getInstructor(selectedBooking) : null}
        currentMemberId={currentMemberId}
        onBookingUpdate={() => {
          // Could refresh bookings list here if needed
        }}
      />
    </>
  )
}
