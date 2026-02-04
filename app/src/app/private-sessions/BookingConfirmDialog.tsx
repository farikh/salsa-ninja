'use client'

import { useState, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { TimeSlot, Instructor, CreateBookingResponse } from '@/types/booking'

interface BookingConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slot: TimeSlot | null
  instructor: Instructor | null
  onConfirmed: (bookingId: string) => void
}

export function BookingConfirmDialog({
  open,
  onOpenChange,
  slot,
  instructor,
  onConfirmed,
}: BookingConfirmDialogProps) {
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = useCallback(async () => {
    if (!slot || !instructor) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructor_id: instructor.id,
          start_time: slot.slot_start,
          end_time: slot.slot_end,
          notes: notes.trim() || undefined,
        }),
      })

      const data: CreateBookingResponse = await res.json()

      if (data.success && data.booking_id) {
        setNotes('')
        onOpenChange(false)
        onConfirmed(data.booking_id)
      } else {
        setError(data.error || 'Failed to create booking. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [slot, instructor, notes, onOpenChange, onConfirmed])

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open) {
        setNotes('')
        setError(null)
      }
      onOpenChange(open)
    },
    [onOpenChange]
  )

  if (!slot || !instructor) return null

  const startTime = parseISO(slot.slot_start)
  const endTime = parseISO(slot.slot_end)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Private Lesson</DialogTitle>
          <DialogDescription>
            Your booking request will be sent to the instructor for approval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Instructor</span>
              <span className="text-sm font-medium">
                {instructor.display_name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="text-sm font-medium">
                {format(startTime, 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Time</span>
              <span className="text-sm font-medium">
                {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="booking-notes"
              className="text-sm font-medium mb-1.5 block"
            >
              Notes <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea
              id="booking-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any topics you'd like to focus on, questions, or goals for the lesson..."
              className="resize-none"
              rows={3}
              disabled={submitting}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Request Lesson
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
