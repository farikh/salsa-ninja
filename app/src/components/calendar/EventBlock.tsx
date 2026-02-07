'use client';

import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types/calendar';
import { EVENT_TYPE_COLORS } from '@/types/calendar';

interface EventBlockProps {
  event: CalendarEvent;
  hourStart: number;
  hourEnd: number;
  onClick?: (event: CalendarEvent) => void;
  compact?: boolean;
}

export function EventBlock({
  event,
  hourStart,
  hourEnd,
  onClick,
  compact = false,
}: EventBlockProps) {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);

  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;

  const totalHours = hourEnd - hourStart;
  const topPercent = ((startHour - hourStart) / totalHours) * 100;
  const heightPercent = ((endHour - startHour) / totalHours) * 100;

  const colors = EVENT_TYPE_COLORS[event.event_type] ?? EVENT_TYPE_COLORS.class;

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <button
      type="button"
      onClick={() => onClick?.(event)}
      className={cn(
        'absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 text-left',
        'cursor-pointer transition-colors duration-150 overflow-hidden',
        'hover:brightness-125 z-10 min-h-[22px]'
      )}
      style={{
        top: `${topPercent}%`,
        height: `${heightPercent}%`,
        backgroundColor: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
        color: colors.text,
      }}
    >
      <p
        className={cn(
          'font-semibold leading-tight truncate',
          compact ? 'text-[10px]' : 'text-xs'
        )}
      >
        {event.title}
      </p>
      {!compact && (
        <p className="text-[10px] opacity-75 truncate">
          {formatTime(start)} - {formatTime(end)}
        </p>
      )}
      {!compact && event.instructor_name && (
        <p className="text-[10px] opacity-60 truncate">
          {event.instructor_name}
        </p>
      )}
    </button>
  );
}
