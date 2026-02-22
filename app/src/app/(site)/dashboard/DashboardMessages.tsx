'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDistanceToNow, parseISO } from 'date-fns'
import type { PrivateLessonBooking, UnreadBookingMessage } from '@/types/booking'

interface DashboardMessagesProps {
  initialBookings: PrivateLessonBooking[]
  memberId: string
}

export function DashboardMessages({ initialBookings, memberId }: DashboardMessagesProps) {
  const [unread, setUnread] = useState<UnreadBookingMessage[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch unread messages on mount
  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch('/api/bookings/unread')
        if (res.ok) {
          const data = await res.json()
          setUnread(data.unread ?? [])
        }
      } catch {
        // Silently fail — not critical
      } finally {
        setLoading(false)
      }
    }
    fetchUnread()
  }, [])

  // Bookings this user is part of (for showing threads)
  const myBookings = initialBookings.filter(
    (b) => b.member_id === memberId || b.instructor_id === memberId,
  )

  const hasBookings = myBookings.length > 0

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 15%, transparent), color-mix(in srgb, var(--primary-light) 15%, transparent))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
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
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h3 style={{ fontWeight: 600 }}>Messages</h3>
        {unread.length > 0 && (
          <span
            style={{
              fontSize: '0.7rem',
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontWeight: 700,
              marginLeft: 'auto',
            }}
          >
            {unread.length} new
          </span>
        )}
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', flex: 1 }}>
          Loading messages...
        </p>
      ) : unread.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {unread.slice(0, 3).map((msg) => (
            <Link
              key={msg.booking_id}
              href="/dashboard/conversations"
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
                background: 'color-mix(in srgb, var(--primary) 5%, transparent)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {msg.sender_name}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                  {formatDistanceToNow(parseISO(msg.latest_message_at), { addSuffix: true })}
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--muted-foreground)',
                  margin: '0.2rem 0 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {msg.latest_message}
              </p>
            </Link>
          ))}
          {unread.length > 3 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: '0.25rem 0 0' }}>
              +{unread.length - 3} more
            </p>
          )}
        </div>
      ) : hasBookings ? (
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', flex: 1 }}>
          No new messages. Open a booking to start a conversation.
        </p>
      ) : (
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', flex: 1 }}>
          No messages yet. Book a private lesson to message your instructor.
        </p>
      )}

      <Link
        href="/dashboard/conversations"
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
        View all conversations
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
