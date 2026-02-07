'use client';

import { cn } from '@/lib/utils';
import { TimeGrid } from '../TimeGrid';
import { EventBlock } from '../EventBlock';
import type { CalendarEvent } from '@/types/calendar';
import { startOfWeek, addDays, isSameDay, isToday, format } from 'date-fns';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick?: (start: Date, end: Date) => void;
  hourStart?: number;
  hourEnd?: number;
}

export function WeekView({
  currentDate,
  events,
  onEventClick,
  onSlotClick,
  hourStart = 6,
  hourEnd = 22,
}: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function getEventsForDay(date: Date): CalendarEvent[] {
    return events.filter((e) => isSameDay(new Date(e.start_time), date));
  }

  const columnHeaders = (
    <>
      {days.map((day) => (
        <div
          key={day.toISOString()}
          className={cn(
            'flex-1 py-2 text-center border-l border-border first:border-l-0',
            isToday(day) && 'bg-accent'
          )}
        >
          <p className="text-xs text-muted-foreground font-medium">
            {format(day, 'EEE')}
          </p>
          <p
            className={cn(
              'text-sm font-semibold',
              isToday(day) && 'text-primary'
            )}
          >
            {format(day, 'd')}
          </p>
        </div>
      ))}
    </>
  );

  function handleColumnClick(columnIndex: number, e: React.MouseEvent<HTMLDivElement>) {
    if (!onSlotClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const yPct = (e.clientY - rect.top) / rect.height;
    const totalHours = hourEnd - hourStart;
    const clickHour = hourStart + yPct * totalHours;
    const snappedHour = Math.floor(clickHour * 2) / 2; // 30-min snap
    const day = days[columnIndex];
    const startDate = new Date(day);
    startDate.setHours(Math.floor(snappedHour), (snappedHour % 1) * 60, 0, 0);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 60);
    onSlotClick(startDate, endDate);
  }

  return (
    <div className="overflow-x-auto">
      <TimeGrid
        hourStart={hourStart}
        hourEnd={hourEnd}
        columnCount={7}
        columnHeaders={columnHeaders}
        showCurrentTime
        renderColumn={(i) => {
          const day = days[i];
          const dayEvents = getEventsForDay(day);

          return (
            <div
              className="absolute inset-0"
              onClick={(e) => handleColumnClick(i, e)}
            >
              {dayEvents.map((event) => (
                <EventBlock
                  key={event.id}
                  event={event}
                  hourStart={hourStart}
                  hourEnd={hourEnd}
                  onClick={onEventClick}
                  compact
                />
              ))}
            </div>
          );
        }}
      />
    </div>
  );
}
