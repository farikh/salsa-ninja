'use client';

import { cn } from '@/lib/utils';
import { EventChip } from '../EventChip';
import type { CalendarEvent } from '@/types/calendar';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from 'date-fns';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_VISIBLE_EVENTS = 3;

export function MonthView({
  currentDate,
  events,
  onDateClick,
  onEventClick,
}: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // Build weeks
  const weeks: Date[][] = [];
  let day = gridStart;
  while (day <= gridEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  // Group events by date
  function getEventsForDate(date: Date): CalendarEvent[] {
    return events.filter((e) => isSameDay(new Date(e.start_time), date));
  }

  return (
    <div className="w-full">
      {/* Day header row */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, wIdx) => (
        <div key={wIdx} className="grid grid-cols-7">
          {week.map((date) => {
            const dayEvents = getEventsForDate(date);
            const isCurrentMonth = isSameMonth(date, currentDate);
            const isCurrentDay = isToday(date);
            const hasMore = dayEvents.length > MAX_VISIBLE_EVENTS;

            return (
              <button
                type="button"
                key={date.toISOString()}
                onClick={() => onDateClick(date)}
                className={cn(
                  'min-h-[80px] md:min-h-[100px] p-1 border-b border-r border-border text-left',
                  'transition-colors duration-150 cursor-pointer',
                  !isCurrentMonth && 'opacity-40',
                  isCurrentDay && 'bg-accent',
                  'hover:bg-accent/50'
                )}
              >
                {/* Day number */}
                <div className="flex justify-between items-center mb-0.5">
                  <span
                    className={cn(
                      'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                      isCurrentDay && 'bg-primary text-primary-foreground'
                    )}
                  >
                    {format(date, 'd')}
                  </span>
                </div>

                {/* Events - chips on desktop, dots on mobile */}
                <div className="hidden sm:flex flex-col gap-0.5">
                  {dayEvents.slice(0, MAX_VISIBLE_EVENTS).map((event) => (
                    <EventChip
                      key={event.id}
                      event={event}
                      onClick={onEventClick}
                    />
                  ))}
                  {hasMore && (
                    <span className="text-[10px] text-muted-foreground pl-1">
                      +{dayEvents.length - MAX_VISIBLE_EVENTS} more
                    </span>
                  )}
                </div>

                {/* Dots on mobile */}
                <div className="flex sm:hidden gap-0.5 flex-wrap mt-0.5">
                  {dayEvents.slice(0, 5).map((event) => (
                    <EventChip
                      key={event.id}
                      event={event}
                      onClick={onEventClick}
                      compact
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
