'use client';

import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types/calendar';
import { EVENT_TYPE_COLORS } from '@/types/calendar';

interface EventChipProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
  compact?: boolean;
}

export function EventChip({ event, onClick, compact = false }: EventChipProps) {
  const colors = EVENT_TYPE_COLORS[event.event_type] ?? EVENT_TYPE_COLORS.class;
  const start = new Date(event.start_time);
  const timeStr = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (compact) {
    // Dot indicator for mobile
    return (
      <button
        type="button"
        onClick={() => onClick?.(event)}
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: colors.text }}
        title={event.title}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(event);
      }}
      className={cn(
        'w-full text-left rounded px-1.5 py-0.5 text-xs truncate',
        'cursor-pointer transition-colors duration-150',
        'hover:brightness-125 min-h-[22px]'
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderLeft: `2px solid ${colors.border}`,
      }}
    >
      <span className="font-medium">{timeStr}</span>{' '}
      <span className="opacity-80">{event.title}</span>
    </button>
  );
}
