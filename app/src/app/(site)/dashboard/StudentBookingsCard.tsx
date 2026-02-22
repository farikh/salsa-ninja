'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { useUpcomingBookings } from '@/hooks/useBookings';
import { useRealtimeCalendar } from '@/hooks/useRealtimeCalendar';
import type { BookingStatus } from '@/types/booking';

interface StudentBookingsCardProps {
  memberId: string;
}

export function StudentBookingsCard({ memberId }: StudentBookingsCardProps) {
  const { bookings, isLoading, mutate } = useUpcomingBookings(memberId);

  // Real-time updates
  useRealtimeCalendar({
    tables: [
      {
        table: 'private_lesson_bookings',
        filter: `member_id=eq.${memberId}`,
      },
    ],
    onUpdate: mutate,
    channelName: `calendar:bookings:student:${memberId}`,
  });

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
              'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(34,197,94,0.15))',
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
            stroke="#3b82f6"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="m9 16 2 2 4-4" />
          </svg>
        </div>
        <h3 style={{ fontWeight: 600 }}>Upcoming Lessons</h3>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-12 bg-muted rounded animate-pulse"
            />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <p
          style={{
            color: 'var(--muted-foreground)',
            fontSize: '0.9rem',
            flex: 1,
          }}
        >
          No upcoming private lessons booked.
        </p>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            flex: 1,
          }}
        >
          {bookings.slice(0, 5).map((booking) => {
            const start = parseISO(booking.start_time);
            const end = parseISO(booking.end_time);
            const instructorName =
              booking.instructor?.display_name ??
              booking.instructor?.full_name ??
              'Instructor';

            return (
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
                <div>
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>
                    {format(start, 'EEE, MMM d')} &middot;{' '}
                    {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                  </p>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--muted-foreground)',
                      margin: '0.15rem 0 0',
                    }}
                  >
                    with {instructorName}
                  </p>
                </div>
                <BookingStatusBadge
                  status={booking.status as BookingStatus}
                  size="sm"
                />
              </div>
            );
          })}
          {bookings.length > 5 && (
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--muted-foreground)',
                margin: '0.25rem 0 0',
              }}
            >
              +{bookings.length - 5} more
            </p>
          )}
        </div>
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
        Book a private lesson
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
  );
}
