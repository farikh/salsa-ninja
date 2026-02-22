'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { usePendingBookings } from '@/hooks/useBookings';
import { useRealtimeCalendar } from '@/hooks/useRealtimeCalendar';
import type { BookingStatus } from '@/types/booking';

interface InstructorPendingBookingsCardProps {
  instructorId: string;
}

export function InstructorPendingBookingsCard({
  instructorId,
}: InstructorPendingBookingsCardProps) {
  const { bookings, isLoading, mutate } = usePendingBookings(instructorId);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Real-time updates
  useRealtimeCalendar({
    tables: [
      {
        table: 'private_lesson_bookings',
        filter: `instructor_id=eq.${instructorId}`,
      },
    ],
    onUpdate: mutate,
    channelName: `calendar:bookings:instructor:${instructorId}`,
  });

  const handleAction = useCallback(
    async (bookingId: string, action: 'confirm' | 'decline') => {
      setActionLoading(bookingId);
      try {
        const res = await fetch(`/api/bookings/${bookingId}/${action}`, {
          method: 'POST',
        });
        if (res.ok) {
          mutate();
        }
      } catch {
        // User can retry
      } finally {
        setActionLoading(null);
      }
    },
    [mutate]
  );

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
              'linear-gradient(135deg, color-mix(in srgb, var(--primary-light) 15%, transparent), color-mix(in srgb, var(--primary) 15%, transparent))',
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
            stroke="var(--primary-light)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <h3 style={{ fontWeight: 600 }}>Pending Requests</h3>
          {bookings.length > 0 && (
            <span
              style={{
                fontSize: '0.7rem',
                background: 'color-mix(in srgb, var(--primary-light) 20%, transparent)',
                color: 'var(--primary-light)',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontWeight: 700,
              }}
            >
              {bookings.length}
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-16 bg-muted rounded animate-pulse"
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
          No pending booking requests.
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
            const memberName =
              booking.member?.display_name ??
              booking.member?.full_name ??
              'Student';

            return (
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
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      {memberName}
                    </p>
                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--muted-foreground)',
                        margin: '0.15rem 0 0',
                      }}
                    >
                      {format(start, 'EEE, MMM d')} &middot;{' '}
                      {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                    </p>
                    {booking.notes && (
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--muted-foreground)',
                          margin: '0.25rem 0 0',
                          fontStyle: 'italic',
                        }}
                      >
                        {booking.notes}
                      </p>
                    )}
                  </div>
                  <BookingStatusBadge
                    status={booking.status as BookingStatus}
                    size="sm"
                  />
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
        Manage private lessons
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
