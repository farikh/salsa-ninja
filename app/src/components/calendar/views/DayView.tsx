'use client';

import { TimeGrid } from '../TimeGrid';
import { EventBlock } from '../EventBlock';
import type { CalendarEvent } from '@/types/calendar';
import { isSameDay, format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface DayViewProps {
  date: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick?: (start: Date, end: Date) => void;
  hourStart?: number;
  hourEnd?: number;
}

export function DayView({
  date,
  events,
  onEventClick,
  onSlotClick,
  hourStart = 6,
  hourEnd = 22,
}: DayViewProps) {
  const dayEvents = events.filter((e) => isSameDay(new Date(e.start_time), date));

  const columnHeaders = (
    <div
      className={cn(
        'flex-1 py-3 text-center',
        isToday(date) && 'bg-accent'
      )}
    >
      <p className="text-sm text-muted-foreground font-medium">
        {format(date, 'EEEE')}
      </p>
      <p
        className={cn(
          'text-lg font-bold',
          isToday(date) && 'text-primary'
        )}
      >
        {format(date, 'MMMM d, yyyy')}
      </p>
    </div>
  );

  function handleColumnClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!onSlotClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const yPct = (e.clientY - rect.top) / rect.height;
    const totalHours = hourEnd - hourStart;
    const clickHour = hourStart + yPct * totalHours;
    const snappedHour = Math.floor(clickHour * 2) / 2;
    const startDate = new Date(date);
    startDate.setHours(Math.floor(snappedHour), (snappedHour % 1) * 60, 0, 0);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 60);
    onSlotClick(startDate, endDate);
  }

  return (
    <TimeGrid
      hourStart={hourStart}
      hourEnd={hourEnd}
      columnCount={1}
      columnHeaders={columnHeaders}
      showCurrentTime
      renderColumn={() => (
        <div className="absolute inset-0" onClick={handleColumnClick}>
          {dayEvents.map((event) => (
            <EventBlock
              key={event.id}
              event={event}
              hourStart={hourStart}
              hourEnd={hourEnd}
              onClick={onEventClick}
            />
          ))}
        </div>
      )}
    />
  );
}
