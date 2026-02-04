'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
  isSameDay,
} from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useCalendarState } from './hooks/useCalendarState'
import { useCalendarRealtime } from './hooks/useCalendarRealtime'
import { InstructorSelector } from './InstructorSelector'
import { MonthCalendar } from './MonthCalendar'
import { TimeSlotDrawer } from './TimeSlotDrawer'
import { TimeSlotSheet } from './TimeSlotSheet'
import { MessageBanner } from './MessageBanner'
import { BookingDetailSheet } from './BookingDetailSheet'
import { BookingConfirmDialog } from './BookingConfirmDialog'
import type {
  Instructor,
  TimeSlot,
  SlotsResponse,
  BookingsResponse,
  UnreadResponse,
} from '@/types/booking'

interface CalendarViewProps {
  instructors: Instructor[]
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    setMatches(mql.matches)

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

export function CalendarView({ instructors }: CalendarViewProps) {
  const {
    state,
    setInstructor,
    setMonth,
    setSelectedDate,
    setSlots,
    setBookings,
    setUnread,
    bookingChanged,
    newMessage,
    setLoading,
    setSelectedBooking,
  } = useCalendarState()

  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null)
  const [confirmSlot, setConfirmSlot] = useState<TimeSlot | null>(null)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  // Get current member ID on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from('members')
          .select('id')
          .eq('user_id', data.user.id)
          .single()
          .then(({ data: member }) => {
            if (member) setCurrentMemberId(member.id)
          })
      }
    })
  }, [])

  // Auto-select first instructor on mount
  useEffect(() => {
    if (instructors.length > 0 && !state.selectedInstructorId) {
      setInstructor(instructors[0].id)
    }
  }, [instructors, state.selectedInstructorId, setInstructor])

  // Fetch slots and bookings when instructor or month changes
  useEffect(() => {
    if (!state.selectedInstructorId) return

    const monthStart = format(startOfMonth(state.currentMonth), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(state.currentMonth), 'yyyy-MM-dd')

    const controller = new AbortController()

    async function fetchData() {
      setLoading(true)
      try {
        const [slotsRes, bookingsRes] = await Promise.all([
          fetch(
            `/api/slots/${state.selectedInstructorId}?start=${monthStart}&end=${monthEnd}`,
            { signal: controller.signal }
          ),
          fetch(
            `/api/bookings?instructor_id=${state.selectedInstructorId}&start=${monthStart}&end=${monthEnd}`,
            { signal: controller.signal }
          ),
        ])

        if (slotsRes.ok) {
          const slotsData: SlotsResponse = await slotsRes.json()
          setSlots(slotsData.slots)
        } else {
          setSlots([])
        }

        if (bookingsRes.ok) {
          const bookingsData: BookingsResponse = await bookingsRes.json()
          setBookings(bookingsData.data)
        } else {
          setBookings([])
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setSlots([])
        setBookings([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    return () => controller.abort()
  }, [
    state.selectedInstructorId,
    state.currentMonth,
    setSlots,
    setBookings,
    setLoading,
  ])

  // Fetch unread messages on mount and reconnect
  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/bookings/unread')
      if (res.ok) {
        const data: UnreadResponse = await res.json()
        setUnread(data.unread)
      }
    } catch {
      // Silently fail — not critical
    }
  }, [setUnread])

  useEffect(() => {
    fetchUnread()
  }, [fetchUnread])

  // Realtime subscriptions
  const bookingIds = useMemo(
    () => state.bookings.map((b) => b.id),
    [state.bookings]
  )

  const handleReconnect = useCallback(() => {
    fetchUnread()
  }, [fetchUnread])

  const handleNewMessage = useCallback(
    (message: Parameters<typeof newMessage>[0]) => {
      newMessage(message)
      fetchUnread()
    },
    [newMessage, fetchUnread]
  )

  useCalendarRealtime({
    instructorId: state.selectedInstructorId,
    bookingIds,
    onBookingChange: bookingChanged,
    onNewMessage: handleNewMessage,
    onReconnect: handleReconnect,
  })

  // Computed derived data
  const availableDates = useMemo(() => {
    const dateSet = new Set<string>()
    for (const slot of state.slots) {
      const d = format(parseISO(slot.slot_start), 'yyyy-MM-dd')
      dateSet.add(d)
    }
    return Array.from(dateSet).map((d) => parseISO(d))
  }, [state.slots])

  const bookedDates = useMemo(() => {
    if (!currentMemberId) return []
    const dateSet = new Set<string>()
    for (const booking of state.bookings) {
      const isParticipant =
        booking.member_id === currentMemberId ||
        booking.instructor_id === currentMemberId
      if (
        isParticipant &&
        !['declined', 'expired', 'cancelled_by_member', 'cancelled_by_instructor', 'no_show'].includes(booking.status)
      ) {
        const d = format(parseISO(booking.start_time), 'yyyy-MM-dd')
        dateSet.add(d)
      }
    }
    return Array.from(dateSet).map((d) => parseISO(d))
  }, [state.bookings, currentMemberId])

  const unreadDates = useMemo(() => {
    const bookingIdSet = new Set(state.unread.map((u) => u.booking_id))
    const dateSet = new Set<string>()
    for (const booking of state.bookings) {
      if (bookingIdSet.has(booking.id)) {
        const d = format(parseISO(booking.start_time), 'yyyy-MM-dd')
        dateSet.add(d)
      }
    }
    return Array.from(dateSet).map((d) => parseISO(d))
  }, [state.unread, state.bookings])

  // Selected instructor object
  const selectedInstructor = useMemo(
    () => instructors.find((i) => i.id === state.selectedInstructorId) ?? null,
    [instructors, state.selectedInstructorId]
  )

  // Selected booking object
  const selectedBooking = useMemo(
    () =>
      state.selectedBookingId
        ? state.bookings.find((b) => b.id === state.selectedBookingId) ?? null
        : null,
    [state.selectedBookingId, state.bookings]
  )

  // Booking's instructor
  const bookingInstructor = useMemo(() => {
    if (!selectedBooking) return null
    return instructors.find((i) => i.id === selectedBooking.instructor_id) ?? null
  }, [selectedBooking, instructors])

  // Handlers
  const handleInstructorChange = useCallback(
    (id: string) => {
      setInstructor(id)
    },
    [setInstructor]
  )

  const handleMonthChange = useCallback(
    (date: Date) => {
      setMonth(date)
    },
    [setMonth]
  )

  const handleDateSelect = useCallback(
    (date: Date) => {
      setSelectedDate(date)
    },
    [setSelectedDate]
  )

  const handleBookSlot = useCallback((slot: TimeSlot) => {
    setConfirmSlot(slot)
  }, [])

  const handleViewBooking = useCallback(
    (bookingId: string) => {
      setSelectedDate(null)
      setSelectedBooking(bookingId)
    },
    [setSelectedDate, setSelectedBooking]
  )

  const handleBookingConfirmed = useCallback(
    (_bookingId: string) => {
      // Refetch bookings to pick up the new one
      const monthStart = format(startOfMonth(state.currentMonth), 'yyyy-MM-dd')
      const monthEnd = format(endOfMonth(state.currentMonth), 'yyyy-MM-dd')
      fetch(
        `/api/bookings?instructor_id=${state.selectedInstructorId}&start=${monthStart}&end=${monthEnd}`
      )
        .then((res) => res.json())
        .then((data: BookingsResponse) => setBookings(data.data))
        .catch(() => {})
    },
    [state.currentMonth, state.selectedInstructorId, setBookings]
  )

  const handleBookingUpdate = useCallback(() => {
    const monthStart = format(startOfMonth(state.currentMonth), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(state.currentMonth), 'yyyy-MM-dd')
    fetch(
      `/api/bookings?instructor_id=${state.selectedInstructorId}&start=${monthStart}&end=${monthEnd}`
    )
      .then((res) => res.json())
      .then((data: BookingsResponse) => setBookings(data.data))
      .catch(() => {})
  }, [state.currentMonth, state.selectedInstructorId, setBookings])

  // Whether date panel should be open
  const datePanelOpen = state.selectedDate !== null

  return (
    <div className="space-y-4">
      {/* Unread message banner */}
      <MessageBanner
        unread={state.unread}
        bookings={state.bookings}
        onViewBooking={handleViewBooking}
      />

      {/* Instructor selector */}
      <InstructorSelector
        instructors={instructors}
        selectedId={state.selectedInstructorId}
        onSelect={handleInstructorChange}
      />

      {/* Calendar */}
      <MonthCalendar
        currentMonth={state.currentMonth}
        selectedDate={state.selectedDate}
        availableDates={availableDates}
        bookedDates={bookedDates}
        unreadDates={unreadDates}
        loading={state.loading}
        onMonthChange={handleMonthChange}
        onDateSelect={handleDateSelect}
      />

      {/* Time slot panel — Drawer on mobile, Sheet on desktop */}
      {state.selectedDate && !isDesktop && (
        <TimeSlotDrawer
          open={datePanelOpen}
          onOpenChange={(open) => {
            if (!open) setSelectedDate(null)
          }}
          date={state.selectedDate}
          slots={state.slots}
          bookings={state.bookings}
          unread={state.unread}
          currentMemberId={currentMemberId}
          loading={state.loading}
          onBookSlot={handleBookSlot}
          onViewBooking={handleViewBooking}
        />
      )}

      {state.selectedDate && isDesktop && (
        <TimeSlotSheet
          open={datePanelOpen}
          onOpenChange={(open) => {
            if (!open) setSelectedDate(null)
          }}
          date={state.selectedDate}
          slots={state.slots}
          bookings={state.bookings}
          unread={state.unread}
          currentMemberId={currentMemberId}
          loading={state.loading}
          onBookSlot={handleBookSlot}
          onViewBooking={handleViewBooking}
        />
      )}

      {/* Booking detail sheet */}
      <BookingDetailSheet
        open={state.selectedBookingId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedBooking(null)
        }}
        booking={selectedBooking}
        instructor={bookingInstructor}
        currentMemberId={currentMemberId}
        onBookingUpdate={handleBookingUpdate}
      />

      {/* Booking confirmation dialog */}
      <BookingConfirmDialog
        open={confirmSlot !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmSlot(null)
        }}
        slot={confirmSlot}
        instructor={selectedInstructor}
        onConfirmed={handleBookingConfirmed}
      />
    </div>
  )
}
