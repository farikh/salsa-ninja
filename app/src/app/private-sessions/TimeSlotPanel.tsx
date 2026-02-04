'use client'

import { useMemo } from 'react'
import { format, parseISO, isSameDay } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { TimeSlot, PrivateLessonBooking, UnreadBookingMessage } from '@/types/booking'

interface TimeSlotPanelProps {
  date: Date
  slots: TimeSlot[]
  bookings: PrivateLessonBooking[]
  unread: UnreadBookingMessage[]
  currentMemberId: string | null
  loading: boolean
  onBookSlot: (slot: TimeSlot) => void
  onViewBooking: (bookingId: string) => void
}

function formatTimeRange(startIso: string, endIso: string): string {
  const start = parseISO(startIso)
  const end = parseISO(endIso)
  return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`
}

function statusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'confirmed':
      return 'Confirmed'
    case 'declined':
      return 'Declined'
    case 'cancelled_by_member':
    case 'cancelled_by_instructor':
      return 'Cancelled'
    case 'completed':
      return 'Completed'
    default:
      return status
  }
}

function statusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'confirmed':
      return 'default'
    case 'pending':
      return 'secondary'
    case 'declined':
    case 'cancelled_by_member':
    case 'cancelled_by_instructor':
      return 'destructive'
    default:
      return 'outline'
  }
}

export function TimeSlotPanel({
  date,
  slots,
  bookings,
  unread,
  currentMemberId,
  loading,
  onBookSlot,
  onViewBooking,
}: TimeSlotPanelProps) {
  // Filter slots to the selected date
  const daySlots = useMemo(() => {
    return slots.filter((slot) => {
      const slotDate = parseISO(slot.slot_start)
      return isSameDay(slotDate, date)
    })
  }, [slots, date])

  // Find bookings where user is either the member or the instructor
  const userBookings = useMemo(() => {
    if (!currentMemberId) return []
    return bookings.filter((b) => {
      const isParticipant =
        b.member_id === currentMemberId || b.instructor_id === currentMemberId
      const isActive = !['declined', 'expired', 'cancelled_by_member', 'cancelled_by_instructor', 'no_show'].includes(b.status)
      const bookingDate = parseISO(b.start_time)
      return isParticipant && isActive && isSameDay(bookingDate, date)
    })
  }, [bookings, currentMemberId, date])

  // Map: slot_start -> booking (if user has one)
  const slotBookingMap = useMemo(() => {
    const map = new Map<string, PrivateLessonBooking>()
    for (const booking of userBookings) {
      // Find the slot that matches this booking's time range
      for (const slot of daySlots) {
        const slotStart = parseISO(slot.slot_start).getTime()
        const slotEnd = parseISO(slot.slot_end).getTime()
        const bookingStart = parseISO(booking.start_time).getTime()
        const bookingEnd = parseISO(booking.end_time).getTime()
        // Check for overlap
        if (bookingStart < slotEnd && bookingEnd > slotStart) {
          map.set(slot.slot_start, booking)
        }
      }
    }
    return map
  }, [daySlots, userBookings])

  // Unread booking IDs set
  const unreadBookingIds = useMemo(
    () => new Set(unread.map((u) => u.booking_id)),
    [unread]
  )

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (daySlots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <p className="text-muted-foreground text-sm">
          No available time slots for this date.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-4">
      {daySlots.map((slot) => {
        const booking = slotBookingMap.get(slot.slot_start)
        const hasUnread = booking ? unreadBookingIds.has(booking.id) : false
        const timeLabel = formatTimeRange(slot.slot_start, slot.slot_end)

        if (booking) {
          // User has a booking for this slot
          return (
            <button
              key={slot.slot_start}
              type="button"
              onClick={() => onViewBooking(booking.id)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors hover:bg-accent/50',
                hasUnread && 'motion-safe:animate-glow'
              )}
            >
              <div>
                <p className="text-sm font-medium">{timeLabel}</p>
                {hasUnread && (
                  <p className="text-xs text-amber-600 mt-0.5">New message</p>
                )}
              </div>
              <Badge variant={statusVariant(booking.status)}>
                {statusLabel(booking.status)}
              </Badge>
            </button>
          )
        }

        // Available slot
        return (
          <button
            key={slot.slot_start}
            type="button"
            onClick={() => onBookSlot(slot)}
            className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors hover:bg-accent/50"
          >
            <p className="text-sm font-medium">{timeLabel}</p>
            <Badge variant="outline" className="text-emerald-600 border-emerald-300">
              Available
            </Badge>
          </button>
        )
      })}
    </div>
  )
}
