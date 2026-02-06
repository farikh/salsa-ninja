'use client'

import { useReducer, useCallback } from 'react'
import type {
  CalendarState,
  CalendarAction,
  TimeSlot,
  PrivateLessonBooking,
  UnreadBookingMessage,
  BookingMessage,
} from '@/types/booking'

const initialState: CalendarState = {
  selectedInstructorId: null,
  currentMonth: new Date(),
  selectedDate: null,
  selectedBookingId: null,
  slots: [],
  bookings: [],
  unread: [],
  loading: true,
}

function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case 'SET_INSTRUCTOR':
      return {
        ...state,
        selectedInstructorId: action.instructorId,
        selectedDate: null,
        selectedBookingId: null,
        loading: true,
      }
    case 'SET_MONTH':
      return { ...state, currentMonth: action.date, selectedDate: null, loading: true }
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.date, selectedBookingId: null }
    case 'SET_SLOTS':
      return { ...state, slots: action.slots, loading: false }
    case 'SET_BOOKINGS':
      return { ...state, bookings: action.bookings }
    case 'SET_UNREAD':
      return { ...state, unread: action.unread }
    case 'BOOKING_CHANGED': {
      const existing = state.bookings.findIndex((b) => b.id === action.booking.id)
      const bookings =
        existing >= 0
          ? state.bookings.map((b) => (b.id === action.booking.id ? action.booking : b))
          : [...state.bookings, action.booking]
      return { ...state, bookings }
    }
    case 'NEW_MESSAGE':
      // Just trigger unread refresh -- handled externally
      return state
    case 'SET_LOADING':
      return { ...state, loading: action.loading }
    case 'SET_SELECTED_BOOKING':
      return { ...state, selectedBookingId: action.bookingId }
    default:
      return state
  }
}

export function useCalendarState() {
  const [state, dispatch] = useReducer(calendarReducer, initialState)

  const setInstructor = useCallback(
    (id: string) => dispatch({ type: 'SET_INSTRUCTOR', instructorId: id }),
    []
  )
  const setMonth = useCallback(
    (date: Date) => dispatch({ type: 'SET_MONTH', date }),
    []
  )
  const setSelectedDate = useCallback(
    (date: Date | null) => dispatch({ type: 'SET_SELECTED_DATE', date }),
    []
  )
  const setSlots = useCallback(
    (slots: TimeSlot[]) => dispatch({ type: 'SET_SLOTS', slots }),
    []
  )
  const setBookings = useCallback(
    (bookings: PrivateLessonBooking[]) => dispatch({ type: 'SET_BOOKINGS', bookings }),
    []
  )
  const setUnread = useCallback(
    (unread: UnreadBookingMessage[]) => dispatch({ type: 'SET_UNREAD', unread }),
    []
  )
  const bookingChanged = useCallback(
    (booking: PrivateLessonBooking) => dispatch({ type: 'BOOKING_CHANGED', booking }),
    []
  )
  const newMessage = useCallback(
    (message: BookingMessage) => dispatch({ type: 'NEW_MESSAGE', message }),
    []
  )
  const setLoading = useCallback(
    (loading: boolean) => dispatch({ type: 'SET_LOADING', loading }),
    []
  )
  const setSelectedBooking = useCallback(
    (bookingId: string | null) => dispatch({ type: 'SET_SELECTED_BOOKING', bookingId }),
    []
  )

  return {
    state,
    dispatch,
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
  }
}
