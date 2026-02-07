'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { CalendarEvent } from '@/types/calendar';
import { EVENT_TYPE_COLORS } from '@/types/calendar';
import { format, parseISO, isSameDay } from 'date-fns';

interface ListViewProps {
  events: CalendarEvent[];
  dateRange: { start: Date; end: Date };
  onEventClick: (event: CalendarEvent) => void;
  loading?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  class: 'Class',
  workshop: 'Workshop',
  bootcamp: 'Bootcamp',
  studio_social: 'Social',
  community: 'Community',
  private_lesson: 'Private',
};

export function ListView({
  events,
  onEventClick,
  loading = false,
}: ListViewProps) {
  // Group events by date
  const groupedEvents: { date: Date; events: CalendarEvent[] }[] = [];

  const sorted = [...events].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  for (const event of sorted) {
    const eventDate = parseISO(event.start_time);
    const lastGroup = groupedEvents[groupedEvents.length - 1];
    if (lastGroup && isSameDay(lastGroup.date, eventDate)) {
      lastGroup.events.push(event);
    } else {
      groupedEvents.push({ date: eventDate, events: [event] });
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-card border border-border p-4">
            <div className="h-4 bg-muted rounded w-32 mb-3 animate-pulse" />
            <div className="h-5 bg-muted rounded w-48 mb-2 animate-pulse" />
            <div className="h-3 bg-muted rounded w-40 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (groupedEvents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No events in this period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedEvents.map(({ date, events: dayEvents }) => (
        <div key={date.toISOString()}>
          {/* Date header */}
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            {format(date, 'EEEE, MMMM d')}
          </h3>

          {/* Event cards */}
          <div className="space-y-2">
            {dayEvents.map((event) => {
              const colors = EVENT_TYPE_COLORS[event.event_type] ?? EVENT_TYPE_COLORS.class;
              const start = parseISO(event.start_time);
              const end = parseISO(event.end_time);

              return (
                <button
                  type="button"
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={cn(
                    'w-full text-left rounded-lg border border-border bg-card p-3',
                    'transition-all duration-150 cursor-pointer',
                    'hover:border-primary/30 hover:bg-accent/50'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          className="text-[10px] px-1.5 py-0"
                          style={{
                            backgroundColor: colors.bg,
                            color: colors.text,
                            borderColor: `${colors.border}40`,
                          }}
                        >
                          {TYPE_LABELS[event.event_type] ?? event.event_type}
                        </Badge>
                        {event.difficulty && (
                          <span className="text-[10px] text-muted-foreground capitalize">
                            {event.difficulty.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-sm truncate">
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                        {event.instructor_name && ` \u00b7 ${event.instructor_name}`}
                      </p>
                    </div>
                    {event.capacity != null && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {event.rsvp_count}/{event.capacity}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
