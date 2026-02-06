'use client'

import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { MessageSquare, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { UnreadBookingMessage, PrivateLessonBooking } from '@/types/booking'

interface MessageBannerProps {
  unread: UnreadBookingMessage[]
  bookings: PrivateLessonBooking[]
  onViewBooking: (bookingId: string) => void
}

export function MessageBanner({
  unread,
  bookings,
  onViewBooking,
}: MessageBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  // Pick the most recent unread message
  const latestUnread = useMemo(() => {
    if (unread.length === 0) return null
    return unread.reduce((latest, u) =>
      new Date(u.latest_message_at) > new Date(latest.latest_message_at) ? u : latest
    )
  }, [unread])

  if (dismissed || !latestUnread) return null

  // Find the associated booking for context
  const booking = bookings.find((b) => b.id === latestUnread.booking_id)
  const bookingTime = booking
    ? format(parseISO(booking.start_time), 'MMM d, h:mm a')
    : ''

  const previewText =
    latestUnread.latest_message.length > 80
      ? latestUnread.latest_message.slice(0, 80) + '...'
      : latestUnread.latest_message

  return (
    <Card className="border-l-4 border-l-primary py-3 gap-3">
      <CardContent className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 text-primary">
          <MessageSquare className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            New message from {latestUnread.sender_name}
          </p>
          {bookingTime && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Lesson: {bookingTime}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1 truncate">
            {previewText}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="default"
            size="sm"
            onClick={() => onViewBooking(latestUnread.booking_id)}
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss notification"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
