'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { format, parseISO, differenceInHours } from 'date-fns'
import { Send, Loader2, Check, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useBookingMessages } from './hooks/useBookingMessages'
import type {
  PrivateLessonBooking,
  Instructor,
  BookingMessage,
} from '@/types/booking'

interface BookingDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: PrivateLessonBooking | null
  instructor: Instructor | null
  currentMemberId: string | null
  onBookingUpdate: () => void
}

function statusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pending Approval'
    case 'confirmed':
      return 'Confirmed'
    case 'declined':
      return 'Declined'
    case 'cancelled_by_member':
      return 'Cancelled by You'
    case 'cancelled_by_instructor':
      return 'Cancelled by Instructor'
    case 'completed':
      return 'Completed'
    case 'no_show':
      return 'No Show'
    case 'expired':
      return 'Expired'
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
    case 'no_show':
      return 'destructive'
    default:
      return 'outline'
  }
}

function canCancel(
  booking: PrivateLessonBooking,
  currentMemberId: string | null
): boolean {
  if (booking.status === 'pending') return true
  if (booking.status !== 'confirmed') return false
  // Instructors can always cancel their own bookings (no 24hr restriction)
  if (booking.instructor_id === currentMemberId) return true
  // Members: enforce 24-hour rule
  const hoursUntil = differenceInHours(
    parseISO(booking.start_time),
    new Date()
  )
  return hoursUntil >= 24
}

function canConfirmOrDecline(
  booking: PrivateLessonBooking,
  currentMemberId: string | null
): boolean {
  return (
    booking.status === 'pending' &&
    booking.instructor_id === currentMemberId
  )
}

export function BookingDetailSheet({
  open,
  onOpenChange,
  booking,
  instructor,
  currentMemberId,
  onBookingUpdate,
}: BookingDetailSheetProps) {
  const { messages, loading, sending, fetchMessages, sendMessage, addMessage } =
    useBookingMessages(booking?.id ?? null)
  const [messageText, setMessageText] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch messages when sheet opens
  useEffect(() => {
    if (open && booking) {
      fetchMessages()
    }
  }, [open, booking, fetchMessages])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!messageText.trim()) return
    const success = await sendMessage(messageText)
    if (success) {
      setMessageText('')
    }
  }, [messageText, sendMessage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleCancel = useCallback(async () => {
    if (!booking) return
    setCancelling(true)
    setCancelError(null)
    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        onBookingUpdate()
        onOpenChange(false)
      } else {
        const data = await res.json()
        setCancelError(data.error || 'Failed to cancel booking')
      }
    } catch {
      setCancelError('Network error. Please try again.')
    } finally {
      setCancelling(false)
    }
  }, [booking, onBookingUpdate, onOpenChange])

  const handleConfirm = useCallback(async () => {
    if (!booking) return
    setConfirming(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/bookings/${booking.id}/confirm`, {
        method: 'POST',
      })
      if (res.ok) {
        onBookingUpdate()
        onOpenChange(false)
      } else {
        const data = await res.json()
        setActionError(data.error || 'Failed to confirm booking')
      }
    } catch {
      setActionError('Network error. Please try again.')
    } finally {
      setConfirming(false)
    }
  }, [booking, onBookingUpdate, onOpenChange])

  const handleDecline = useCallback(async () => {
    if (!booking) return
    setDeclining(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/bookings/${booking.id}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        onBookingUpdate()
        onOpenChange(false)
      } else {
        const data = await res.json()
        setActionError(data.error || 'Failed to decline booking')
      }
    } catch {
      setActionError('Network error. Please try again.')
    } finally {
      setDeclining(false)
    }
  }, [booking, onBookingUpdate, onOpenChange])

  // Expose addMessage for external realtime updates
  // The parent can call this via ref if needed
  void addMessage

  if (!booking) return null

  const startTime = parseISO(booking.start_time)
  const endTime = parseISO(booking.end_time)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Booking Details</SheetTitle>
          <SheetDescription>
            {format(startTime, 'EEEE, MMMM d, yyyy')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col flex-1 min-h-0 px-4 gap-4">
          {/* Booking info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {instructor?.display_name ?? 'Instructor'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                </p>
              </div>
              <Badge variant={statusVariant(booking.status)}>
                {statusLabel(booking.status)}
              </Badge>
            </div>

            {booking.notes && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Notes
                </p>
                <p className="text-sm">{booking.notes}</p>
              </div>
            )}

            {booking.cancellation_reason && (
              <div className="rounded-lg bg-destructive/10 p-3">
                <p className="text-xs font-medium text-destructive mb-1">
                  Cancellation Reason
                </p>
                <p className="text-sm">{booking.cancellation_reason}</p>
              </div>
            )}

            {/* Instructor: Confirm / Decline buttons for pending bookings */}
            {canConfirmOrDecline(booking, currentMemberId) && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleConfirm}
                  disabled={confirming || declining}
                  className="flex-1"
                >
                  {confirming ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  Confirm
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDecline}
                  disabled={confirming || declining}
                  className="flex-1"
                >
                  {declining ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <X className="size-4" />
                  )}
                  Decline
                </Button>
              </div>
            )}

            {canCancel(booking, currentMemberId) &&
              !canConfirmOrDecline(booking, currentMemberId) && (
                <div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="w-full"
                  >
                    {cancelling && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    Cancel Booking
                  </Button>
                  {cancelError && (
                    <p className="text-xs text-destructive mt-1">
                      {cancelError}
                    </p>
                  )}
                </div>
              )}

            {actionError && (
              <p className="text-xs text-destructive">{actionError}</p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Messages section */}
          <div className="flex flex-col flex-1 min-h-0">
            <p className="text-sm font-medium mb-2">Messages</p>

            {loading ? (
              <div className="space-y-3 flex-1">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-10 w-2/3 ml-auto" />
                <Skeleton className="h-10 w-3/4" />
              </div>
            ) : (
              <ScrollArea className="flex-1 min-h-0 max-h-[40vh]">
                <div ref={scrollRef} className="space-y-3 pr-3">
                  {messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No messages yet. Start a conversation below.
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isOwn={msg.sender_id === currentMemberId}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            )}

            {/* Message input */}
            <div className="flex gap-2 pt-3 mt-auto">
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="min-h-10 max-h-24 resize-none text-sm"
                disabled={sending}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={sending || !messageText.trim()}
                aria-label="Send message"
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: BookingMessage
  isOwn: boolean
}) {
  const time = format(parseISO(message.created_at), 'h:mm a')

  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-3 py-2',
          isOwn
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        <p className="text-sm break-words">{message.content}</p>
        <p
          className={cn(
            'text-[10px] mt-1',
            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {time}
        </p>
      </div>
    </div>
  )
}
