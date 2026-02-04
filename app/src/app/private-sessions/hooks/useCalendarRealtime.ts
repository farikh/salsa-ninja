'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PrivateLessonBooking, BookingMessage } from '@/types/booking'

interface UseCalendarRealtimeOptions {
  instructorId: string | null
  bookingIds: string[]
  onBookingChange: (booking: PrivateLessonBooking) => void
  onNewMessage: (message: BookingMessage) => void
  onReconnect: () => void
}

export function useCalendarRealtime({
  instructorId,
  bookingIds,
  onBookingChange,
  onNewMessage,
  onReconnect,
}: UseCalendarRealtimeOptions) {
  const supabase = useRef(createClient()).current

  // Booking changes channel — filtered by instructor_id
  useEffect(() => {
    if (!instructorId) return

    const channel = supabase
      .channel(`calendar-${instructorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'private_lesson_bookings',
          filter: `instructor_id=eq.${instructorId}`,
        },
        (payload) => {
          // DELETE events have empty payload.new — skip them
          if (payload.eventType === 'DELETE') return
          onBookingChange(payload.new as PrivateLessonBooking)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Connected/reconnected — refetch data
        }
        if (status === 'CHANNEL_ERROR') {
          // Will auto-reconnect
        }
      })

    // Handle tab visibility change — refetch on return to catch missed events
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        onReconnect()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [instructorId, supabase, onBookingChange, onReconnect])

  // Message channel — filtered by active booking IDs
  useEffect(() => {
    if (!bookingIds.length) return

    const channel = supabase
      .channel(`messages-${bookingIds.join('-').slice(0, 50)}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_messages',
          filter: `booking_id=in.(${bookingIds.join(',')})`,
        },
        (payload) => {
          onNewMessage(payload.new as BookingMessage)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bookingIds, supabase, onNewMessage])
}
