'use client'

import { format } from 'date-fns'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { TimeSlotPanel } from './TimeSlotPanel'
import type { TimeSlot, PrivateLessonBooking, UnreadBookingMessage } from '@/types/booking'

interface TimeSlotDrawerProps {
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

export function TimeSlotDrawer({
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
}: TimeSlotDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{format(date, 'EEEE, MMMM d, yyyy')}</DrawerTitle>
          <DrawerDescription>Select a time slot</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto max-h-[60vh]">
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
      </DrawerContent>
    </Drawer>
  )
}
