'use client'

import { useMemo } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { isSameDay, isBefore, startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'

interface MonthCalendarProps {
  currentMonth: Date
  selectedDate: Date | null
  availableDates: Date[]
  bookedDates: Date[]
  unreadDates: Date[]
  loading: boolean
  onMonthChange: (date: Date) => void
  onDateSelect: (date: Date) => void
}

export function MonthCalendar({
  currentMonth,
  selectedDate,
  availableDates,
  bookedDates,
  unreadDates,
  loading,
  onMonthChange,
  onDateSelect,
}: MonthCalendarProps) {
  const today = useMemo(() => startOfDay(new Date()), [])

  const modifiers = useMemo(
    () => ({
      available: availableDates,
      booked: bookedDates,
      unread: unreadDates,
    }),
    [availableDates, bookedDates, unreadDates]
  )

  const modifiersClassNames = useMemo(
    () => ({
      available: 'calendar-day--available',
      booked: 'calendar-day--booked',
      unread: 'motion-safe:animate-glow rounded-md',
    }),
    []
  )

  return (
    <div className={cn('relative', loading && 'opacity-60 pointer-events-none')}>
      <Calendar
        mode="single"
        selected={selectedDate ?? undefined}
        onSelect={(date) => {
          if (date) onDateSelect(date)
        }}
        month={currentMonth}
        onMonthChange={onMonthChange}
        disabled={(date) => isBefore(date, today)}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        showOutsideDays={false}
        className="mx-auto w-full max-w-sm [--cell-size:--spacing(10)] md:[--cell-size:--spacing(11)]"
        classNames={{
          months: 'flex flex-col w-full',
          month: 'w-full',
          table: 'w-full',
          head_row: 'flex w-full',
          row: 'flex w-full',
          day: 'relative flex-1 p-0 text-center aspect-square select-none',
        }}
      />

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-emerald-500" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-primary" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-amber-500" />
          <span>Unread</span>
        </div>
      </div>

      {/* CSS for calendar day indicators */}
      <style>{`
        .calendar-day--available .rdp-day_button::after,
        .calendar-day--available [data-slot="button"]::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: var(--color-emerald-500, #10b981);
        }
        .calendar-day--booked .rdp-day_button::after,
        .calendar-day--booked [data-slot="button"]::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: var(--primary);
        }
        /* Booked takes precedence over available when both exist */
        .calendar-day--booked.calendar-day--available .rdp-day_button::after,
        .calendar-day--booked.calendar-day--available [data-slot="button"]::after {
          background-color: var(--primary);
        }
      `}</style>
    </div>
  )
}
