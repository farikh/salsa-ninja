// Role-aware realtime subscriptions for the unified schedule
// Design doc: docs/specs/features/unified-schedule.md (Section 4.4)

'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UseScheduleRealtimeOptions {
  userId: string;
  userRole: string; // 'instructor' | 'member_full' | 'member_limited' | 'owner'
  bookingIds: string[];
  onBookingChange: () => void;
  onNewMessage: (bookingId: string) => void;
  onReconnect: () => void;
}

export function useScheduleRealtime(options: UseScheduleRealtimeOptions): void {
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  useEffect(() => {
    const supabase = createClient();
    const { userId, userRole, bookingIds } = callbacksRef.current;

    if (!userId) return;

    // Determine booking filter based on role
    const isInstructor = userRole === 'instructor' || userRole === 'owner';
    const bookingFilter = isInstructor
      ? `instructor_id=eq.${userId}`
      : `member_id=eq.${userId}`;

    let channel = supabase.channel(`schedule-bookings-${userId}`);

    // Subscribe to booking changes
    channel = channel.on(
      'postgres_changes' as never,
      {
        event: '*',
        schema: 'public',
        table: 'private_lesson_bookings',
        filter: bookingFilter,
      } as never,
      () => {
        callbacksRef.current.onBookingChange();
      }
    );

    // For dual-role users (instructor who also books as student), add second channel
    if (isInstructor) {
      channel = channel.on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'private_lesson_bookings',
          filter: `member_id=eq.${userId}`,
        } as never,
        () => {
          callbacksRef.current.onBookingChange();
        }
      );
    }

    // Subscribe to new messages for current bookings
    if (bookingIds.length > 0) {
      for (const bookingId of bookingIds) {
        channel = channel.on(
          'postgres_changes' as never,
          {
            event: 'INSERT',
            schema: 'public',
            table: 'booking_messages',
            filter: `booking_id=eq.${bookingId}`,
          } as never,
          () => {
            callbacksRef.current.onNewMessage(bookingId);
          }
        );
      }
    }

    channel.subscribe();

    // Handle tab visibility change — full refetch on return
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        callbacksRef.current.onReconnect();
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [options.userId, options.userRole, JSON.stringify(options.bookingIds)]);
}
