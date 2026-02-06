'use client'

import { useReducer, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  format,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type {
  InstructorAvailability,
  PrivateLessonBooking,
  AvailabilityOverride,
} from '@/types/booking'
import { WeeklyGridView } from './WeeklyGridView'
import { MonthlyAvailabilityView } from './MonthlyAvailabilityView'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface AvailabilityCalendarState {
  view: 'weekly' | 'monthly'
  selectedDate: Date
  availability: InstructorAvailability[]
  bookings: PrivateLessonBooking[]
  overrides: AvailabilityOverride[]
  loading: boolean
  error: string | null
}

type AvailabilityCalendarAction =
  | { type: 'SET_VIEW'; view: 'weekly' | 'monthly' }
  | { type: 'SET_DATE'; date: Date }
  | { type: 'NAVIGATE'; direction: 'prev' | 'next' }
  | {
      type: 'SET_DATA'
      availability: InstructorAvailability[]
      bookings: PrivateLessonBooking[]
      overrides: AvailabilityOverride[]
    }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'ADD_AVAILABILITY'; item: InstructorAvailability }
  | { type: 'REPLACE_AVAILABILITY'; tempId: string; item: InstructorAvailability }
  | { type: 'REMOVE_AVAILABILITY'; id: string }

function reducer(
  state: AvailabilityCalendarState,
  action: AvailabilityCalendarAction
): AvailabilityCalendarState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.view }
    case 'SET_DATE':
      return { ...state, selectedDate: action.date }
    case 'NAVIGATE': {
      const { view, selectedDate } = state
      let nextDate: Date
      if (view === 'weekly') {
        nextDate =
          action.direction === 'prev'
            ? subWeeks(selectedDate, 1)
            : addWeeks(selectedDate, 1)
      } else {
        nextDate =
          action.direction === 'prev'
            ? subMonths(selectedDate, 1)
            : addMonths(selectedDate, 1)
      }
      return { ...state, selectedDate: nextDate }
    }
    case 'SET_DATA':
      return {
        ...state,
        availability: action.availability,
        bookings: action.bookings,
        overrides: action.overrides,
        loading: false,
      }
    case 'SET_LOADING':
      return { ...state, loading: action.loading }
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false }
    case 'ADD_AVAILABILITY':
      return {
        ...state,
        availability: [...state.availability, action.item],
      }
    case 'REPLACE_AVAILABILITY':
      return {
        ...state,
        availability: state.availability.map((a) =>
          a.id === action.tempId ? action.item : a
        ),
      }
    case 'REMOVE_AVAILABILITY':
      return {
        ...state,
        availability: state.availability.filter((a) => a.id !== action.id),
      }
    default:
      return state
  }
}

function initialState(): AvailabilityCalendarState {
  return {
    view: 'weekly',
    selectedDate: new Date(),
    availability: [],
    bookings: [],
    overrides: [],
    loading: true,
    error: null,
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AvailabilityCalendarProps {
  instructorId: string
}

export function AvailabilityCalendar({
  instructorId,
}: AvailabilityCalendarProps) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const availabilityRef = useRef(state.availability)
  availabilityRef.current = state.availability

  // ---- Data fetching ----

  const fetchData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', loading: true })

    const dateStr = format(state.selectedDate, 'yyyy-MM-dd')
    const url = `/api/availability/calendar?instructor_id=${instructorId}&view=${state.view}&date=${dateStr}`

    try {
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        dispatch({
          type: 'SET_DATA',
          availability: json.availability ?? [],
          bookings: json.bookings ?? [],
          overrides: json.overrides ?? [],
        })
        dispatch({ type: 'SET_ERROR', error: null })
      } else {
        const json = await res.json().catch(() => ({ error: 'Failed to load calendar data' }))
        dispatch({ type: 'SET_ERROR', error: json.error })
      }
    } catch {
      dispatch({ type: 'SET_ERROR', error: 'Network error — could not load calendar data' })
    }
  }, [instructorId, state.view, state.selectedDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ---- Handlers ----

  const handleAddAvailability = useCallback(
    async (day: number, startTime: string, endTime: string) => {
      // Optimistic: add a temporary entry immediately
      const tempId = `temp-${Date.now()}`
      const tempItem: InstructorAvailability = {
        id: tempId,
        instructor_id: instructorId,
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
        slot_duration_minutes: 60,
        is_active: true,
        effective_from: new Date().toISOString().split('T')[0],
        effective_until: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      dispatch({ type: 'ADD_AVAILABILITY', item: tempItem })

      try {
        const res = await fetch('/api/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instructor_id: instructorId,
            day_of_week: day,
            start_time: startTime,
            end_time: endTime,
            slot_duration_minutes: 60,
          }),
        })

        if (res.ok) {
          const json = await res.json()
          // Replace temp entry with real server data
          dispatch({ type: 'REPLACE_AVAILABILITY', tempId, item: json.data })
        } else {
          const error = await res.json().catch(() => ({ error: 'Unknown error' }))
          console.error('Failed to add availability:', error.error)
          // Roll back optimistic entry
          dispatch({ type: 'REMOVE_AVAILABILITY', id: tempId })
        }
      } catch {
        // Roll back on network error
        dispatch({ type: 'REMOVE_AVAILABILITY', id: tempId })
      }
    },
    [instructorId]
  )

  const handleDeleteAvailability = useCallback(
    async (id: string) => {
      // Snapshot before dispatch via ref (avoids stale closure)
      const removed = availabilityRef.current.find((a) => a.id === id)
      dispatch({ type: 'REMOVE_AVAILABILITY', id })

      try {
        const res = await fetch(`/api/availability/${id}`, {
          method: 'DELETE',
        })

        if (!res.ok) {
          const error = await res.json().catch(() => ({ error: 'Unknown error' }))
          console.error('Failed to delete availability:', error.error)
          if (removed) dispatch({ type: 'ADD_AVAILABILITY', item: removed })
        }
      } catch {
        if (removed) dispatch({ type: 'ADD_AVAILABILITY', item: removed })
      }
    },
    []
  )

  const handleDateSelect = useCallback((date: Date) => {
    dispatch({ type: 'SET_DATE', date })
    dispatch({ type: 'SET_VIEW', view: 'weekly' })
  }, [])

  // ---- Derived labels ----

  const dateLabel =
    state.view === 'weekly'
      ? `${format(startOfWeek(state.selectedDate, { weekStartsOn: 0 }), 'MMM d')} - ${format(endOfWeek(state.selectedDate, { weekStartsOn: 0 }), 'MMM d, yyyy')}`
      : format(state.selectedDate, 'MMMM yyyy')

  // ---- Render ----

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link
        href="/private-sessions"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
        Back to Private Sessions
      </Link>

      {/* Navigation bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Prev / Date / Next */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => dispatch({ type: 'NAVIGATE', direction: 'prev' })}
              aria-label={
                state.view === 'weekly' ? 'Previous week' : 'Previous month'
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Button>

            <span
              className="text-sm font-medium select-none"
              style={{ minWidth: '180px', textAlign: 'center' }}
            >
              {dateLabel}
            </span>

            <Button
              variant="outline"
              size="icon"
              onClick={() => dispatch({ type: 'NAVIGATE', direction: 'next' })}
              aria-label={
                state.view === 'weekly' ? 'Next week' : 'Next month'
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Button>
          </div>

          {/* Today button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: 'SET_DATE', date: new Date() })}
          >
            Today
          </Button>

          {/* View toggle */}
          <div className="flex rounded-md overflow-hidden border border-border">
            <Button
              variant={state.view === 'weekly' ? 'default' : 'outline'}
              size="sm"
              className="rounded-none border-0"
              onClick={() => dispatch({ type: 'SET_VIEW', view: 'weekly' })}
            >
              Weekly
            </Button>
            <Button
              variant={state.view === 'monthly' ? 'default' : 'outline'}
              size="sm"
              className="rounded-none border-0"
              onClick={() => dispatch({ type: 'SET_VIEW', view: 'monthly' })}
            >
              Monthly
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading state */}
      {state.loading && (
        <Card className="p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <svg
              className="animate-spin"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span>Loading availability...</span>
          </div>
        </Card>
      )}

      {/* Error state */}
      {state.error && (
        <Card className="p-4">
          <p className="text-sm text-destructive">{state.error}</p>
        </Card>
      )}

      {/* Calendar views */}
      {!state.loading && !state.error && state.view === 'weekly' && (
        <WeeklyGridView
          weekStart={startOfWeek(state.selectedDate, { weekStartsOn: 0 })}
          availability={state.availability}
          bookings={state.bookings}
          overrides={state.overrides}
          onAddAvailability={handleAddAvailability}
          onDeleteAvailability={handleDeleteAvailability}
        />
      )}

      {!state.loading && !state.error && state.view === 'monthly' && (
        <MonthlyAvailabilityView
          month={state.selectedDate}
          availability={state.availability}
          bookings={state.bookings}
          overrides={state.overrides}
          onDateSelect={handleDateSelect}
          onAddAvailability={handleAddAvailability}
          onDeleteAvailability={handleDeleteAvailability}
        />
      )}
    </div>
  )
}
