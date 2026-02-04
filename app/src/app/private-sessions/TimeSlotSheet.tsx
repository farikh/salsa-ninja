'use client'

import { format } from 'date-fns'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { TimeSlotPanel } from './TimeSlotPanel'
import type { TimeSlot, PrivateLessonBooking, UnreadBookingMessage } from '@/types/booking'

interface TimeSlotSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date
  slots: TimeSlot[]
  bookings: PrivateLessonBooking[]
  unread: UnreadBookingMessage[]
  currentMemberId: string | null
  loading: boolean
  onBookSlot: (slot: TimeSlot) => void
  onViewBooking: (bookingId: string) => void
}

export function TimeSlotSheet({
  open,
  onOpenChange,
  date,
  slots,
  bookings,
  unread,
  currentMemberId,
  loading,
  onBookSlot,
  onViewBooking,
}: TimeSlotSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{format(date, 'EEEE, MMMM d, yyyy')}</SheetTitle>
          <SheetDescription>Select a time slot</SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto flex-1">
          <TimeSlotPanel
            date={date}
            slots={slots}
            bookings={bookings}
            unread={unread}
            currentMemberId={currentMemberId}
            loading={loading}
            onBookSlot={onBookSlot}
            onViewBooking={onViewBooking}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
