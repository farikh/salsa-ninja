'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isSameMonth,
  getDay,
  isToday,
  parseISO,
} from 'date-fns'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type {
  InstructorAvailability,
  PrivateLessonBooking,
  AvailabilityOverride,
} from '@/types/booking'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MonthlyAvailabilityViewProps {
  month: Date
  availability: InstructorAvailability[]
  bookings: PrivateLessonBooking[]
  overrides: AvailabilityOverride[]
  onDateSelect: (date: Date) => void
  onAddAvailability: (day: number, startTime: string) => void
  onDeleteAvailability: (id: string) => void
}

interface DayCellData {
  date: Date
  hasAvailability: boolean
  availabilitySlots: InstructorAvailability[]
  pendingCount: number
  confirmedCount: number
  hasOverride: boolean
  overrideBlocked: boolean
  override: AvailabilityOverride | null
  dayBookings: PrivateLessonBooking[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

function bookingStatusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'confirmed':
      return 'default'
    case 'pending':
      return 'secondary'
    case 'cancelled_by_member':
    case 'cancelled_by_instructor':
    case 'declined':
      return 'destructive'
    default:
      return 'outline'
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MonthlyAvailabilityView({
  month,
  availability,
  bookings,
  overrides,
  onDateSelect,
  onAddAvailability,
  onDeleteAvailability,
}: MonthlyAvailabilityViewProps) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  // -----------------------------------------------------------------------
  // Build the calendar grid dates (includes leading/trailing days)
  // -----------------------------------------------------------------------

  const calendarDays = useMemo(() => {
    const start = startOfMonth(month)
    const end = endOfMonth(month)
    const startDay = startOfWeek(start, { weekStartsOn: 0 })
    const endDay = endOfWeek(end, { weekStartsOn: 0 })

    const days: Date[] = []
    let current = startDay
    while (current <= endDay) {
      days.push(current)
      current = addDays(current, 1)
    }
    return days
  }, [month])

  // -----------------------------------------------------------------------
  // Pre-compute data for each day cell
  // -----------------------------------------------------------------------

  const dayCellMap = useMemo(() => {
    const map = new Map<string, DayCellData>()

    for (const date of calendarDays) {
      const dateKey = format(date, 'yyyy-MM-dd')
      const dayOfWeek = getDay(date)

      // Recurring availability for this day of week
      const availabilitySlots = availability.filter(
        (a) => a.day_of_week === dayOfWeek && a.is_active
      )

      // Bookings on this specific date
      const dayBookings = bookings.filter((b) => {
        const bookingDate = format(parseISO(b.start_time), 'yyyy-MM-dd')
        return bookingDate === dateKey
      })

      const pendingCount = dayBookings.filter(
        (b) => b.status === 'pending'
      ).length
      const confirmedCount = dayBookings.filter(
        (b) => b.status === 'confirmed'
      ).length

      // Overrides for this specific date
      const override = overrides.find((o) => o.override_date === dateKey) ?? null

      map.set(dateKey, {
        date,
        hasAvailability: availabilitySlots.length > 0,
        availabilitySlots,
        pendingCount,
        confirmedCount,
        hasOverride: override !== null,
        overrideBlocked: override !== null && !override.is_available,
        override,
        dayBookings,
      })
    }

    return map
  }, [calendarDays, availability, bookings, overrides])

  // -----------------------------------------------------------------------
  // Selected day detail data
  // -----------------------------------------------------------------------

  const selectedDayData = useMemo(() => {
    if (!selectedDay) return null
    const key = format(selectedDay, 'yyyy-MM-dd')
    return dayCellMap.get(key) ?? null
  }, [selectedDay, dayCellMap])

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleDayClick = useCallback(
    (date: Date) => {
      setSelectedDay((prev) =>
        prev && isSameDay(prev, date) ? null : date
      )
      onDateSelect(date)
    },
    [onDateSelect]
  )

  const handleAddAvailability = useCallback(() => {
    if (!selectedDay) return
    const dayOfWeek = getDay(selectedDay)
    onAddAvailability(dayOfWeek, '10:00')
  }, [selectedDay, onAddAvailability])

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4">
      {/* Calendar grid */}
      <Card className="p-0">
        <CardContent className="p-3 sm:p-4">
          {/* Month header */}
          <h2 className="mb-3 text-center text-lg font-semibold">
            {format(month, 'MMMM yyyy')}
          </h2>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAY_HEADERS.map((day) => (
              <div
                key={day}
                className="py-1 text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-px">
            {calendarDays.map((date) => {
              const key = format(date, 'yyyy-MM-dd')
              const cellData = dayCellMap.get(key)!
              const inMonth = isSameMonth(date, month)
              const today = isToday(date)
              const selected = selectedDay ? isSameDay(date, selectedDay) : false
              const isWeekend = getDay(date) === 0 || getDay(date) === 6

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleDayClick(date)}
                  className={cn(
                    'relative flex flex-col items-center rounded-lg border border-transparent p-1 text-sm transition-colors',
                    'min-h-[3.5rem] sm:min-h-[4.5rem]',
                    'hover:border-border hover:bg-accent/50',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    !inMonth && 'opacity-30',
                    inMonth && isWeekend && 'bg-muted/30',
                    today && 'ring-2 ring-primary/60 ring-inset',
                    selected && 'bg-primary/10 border-primary',
                    cellData.overrideBlocked && inMonth && 'bg-red-500/5'
                  )}
                >
                  {/* Day number */}
                  <span
                    className={cn(
                      'text-xs font-medium leading-none sm:text-sm',
                      today && 'text-primary font-bold',
                      !inMonth && 'text-muted-foreground'
                    )}
                  >
                    {format(date, 'd')}
                  </span>

                  {/* Indicator dots */}
                  {inMonth && (
                    <div className="mt-1 flex items-center gap-0.5">
                      {cellData.hasAvailability && !cellData.overrideBlocked && (
                        <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
                      )}
                      {cellData.pendingCount > 0 && (
                        <span className="inline-block size-1.5 rounded-full bg-amber-500" />
                      )}
                      {cellData.confirmedCount > 0 && (
                        <span className="inline-block size-1.5 rounded-full bg-blue-500" />
                      )}
                      {cellData.overrideBlocked && (
                        <span className="relative inline-block size-1.5">
                          <span className="absolute inset-0 rotate-45 border-t-2 border-red-500" />
                        </span>
                      )}
                    </div>
                  )}

                  {/* Count badges (shown on larger screens) */}
                  {inMonth && (cellData.availabilitySlots.length > 0 || cellData.dayBookings.length > 0) && (
                    <div className="mt-0.5 hidden flex-col items-center gap-0.5 sm:flex">
                      {cellData.availabilitySlots.length > 0 && !cellData.overrideBlocked && (
                        <span className="text-[10px] leading-none text-emerald-600 dark:text-emerald-400">
                          {cellData.availabilitySlots.length}{' '}
                          {cellData.availabilitySlots.length === 1 ? 'slot' : 'slots'}
                        </span>
                      )}
                      {cellData.pendingCount > 0 && (
                        <span className="text-[10px] leading-none text-amber-600 dark:text-amber-400">
                          {cellData.pendingCount} pending
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-emerald-500" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-amber-500" />
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-blue-500" />
              <span>Confirmed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative inline-block size-2">
                <span className="absolute inset-0 rotate-45 border-t-2 border-red-500" />
              </span>
              <span>Blocked</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day detail panel */}
      {selectedDay && selectedDayData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {format(selectedDay, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Override notice */}
            {selectedDayData.hasOverride && selectedDayData.override && (
              <div
                className={cn(
                  'rounded-md border px-3 py-2 text-sm',
                  selectedDayData.overrideBlocked
                    ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
                    : 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                )}
              >
                <p className="font-medium">
                  {selectedDayData.overrideBlocked
                    ? 'Unavailable (Override)'
                    : 'Custom availability (Override)'}
                </p>
                {selectedDayData.override.reason && (
                  <p className="mt-0.5 text-xs opacity-80">
                    {selectedDayData.override.reason}
                  </p>
                )}
                {selectedDayData.override.start_time &&
                  selectedDayData.override.end_time && (
                    <p className="mt-0.5 text-xs">
                      {formatTime(selectedDayData.override.start_time)} -{' '}
                      {formatTime(selectedDayData.override.end_time)}
                    </p>
                  )}
              </div>
            )}

            {/* Availability section */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  Recurring Availability ({DAYS_OF_WEEK[getDay(selectedDay)]})
                </h3>
                <Button size="xs" variant="outline" onClick={handleAddAvailability}>
                  + Add Hours
                </Button>
              </div>

              {selectedDayData.availabilitySlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recurring availability set for{' '}
                  {DAYS_OF_WEEK[getDay(selectedDay)]}s.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {selectedDayData.availabilitySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-block size-2 rounded-full bg-emerald-500" />
                        <span className="text-sm font-medium">
                          {formatTime(slot.start_time)} -{' '}
                          {formatTime(slot.end_time)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({slot.slot_duration_minutes}min lessons)
                        </span>
                      </div>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onDeleteAvailability(slot.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bookings section */}
            <div>
              <h3 className="mb-2 text-sm font-semibold">
                Bookings ({selectedDayData.dayBookings.length})
              </h3>

              {selectedDayData.dayBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No bookings on this date.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {selectedDayData.dayBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {formatTime(format(parseISO(booking.start_time), 'HH:mm'))}
                          {' - '}
                          {formatTime(format(parseISO(booking.end_time), 'HH:mm'))}
                        </span>
                      </div>
                      <Badge variant={bookingStatusVariant(booking.status)}>
                        {booking.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
