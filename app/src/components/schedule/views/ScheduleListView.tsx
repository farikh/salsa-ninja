'use client';

import { cn } from '@/lib/utils';
import type { ScheduleItem } from '@/types/schedule';
import { format, parseISO, isSameDay } from 'date-fns';

interface ScheduleListViewProps {
  items: ScheduleItem[];
  dateRange: { start: Date; end: Date };
  onItemClick: (item: ScheduleItem) => void;
  loading?: boolean;
}

/** Returns true if the color string is a raw hex/rgb value (used in inline styles). */
function isInlineColor(color: string): boolean {
  return color.startsWith('#') || color.startsWith('rgb');
}

const TYPE_LABELS: Record<string, string> = {
  event: 'Event',
  booking: 'Booking',
  available_slot: 'Available',
};

export function ScheduleListView({
  items,
  onItemClick,
  loading = false,
}: ScheduleListViewProps) {
  // Group items by date
  const groupedItems: { date: Date; items: ScheduleItem[] }[] = [];

  const sorted = [...items].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  for (const item of sorted) {
    const itemDate = parseISO(item.start_time);
    const lastGroup = groupedItems[groupedItems.length - 1];
    if (lastGroup && isSameDay(lastGroup.date, itemDate)) {
      lastGroup.items.push(item);
    } else {
      groupedItems.push({ date: itemDate, items: [item] });
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

  if (groupedItems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No items in this period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedItems.map(({ date, items: dayItems }) => (
        <div key={date.toISOString()}>
          {/* Date header */}
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            {format(date, 'EEEE, MMMM d')}
          </h3>

          {/* Item cards */}
          <div className="space-y-2">
            {dayItems.map((item) => {
              const inlineColor = isInlineColor(item.color);
              const start = parseISO(item.start_time);
              const end = parseISO(item.end_time);

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className={cn(
                    'w-full text-left rounded-lg border bg-card p-3',
                    'transition-all duration-150 cursor-pointer',
                    'hover:border-primary/30 hover:bg-accent/50'
                  )}
                  style={{
                    borderColor: inlineColor ? `${item.color}40` : undefined,
                    borderStyle: item.borderStyle,
                    opacity: item.opacity,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {/* Color indicator dot */}
                        <span
                          className="inline-block w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: inlineColor ? item.color : undefined,
                          }}
                        />
                        <span className="text-[10px] text-muted-foreground font-medium uppercase">
                          {TYPE_LABELS[item.type] ?? item.type}
                        </span>
                        {item.eventType && (
                          <span className="text-[10px] text-muted-foreground capitalize">
                            {item.eventType.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm truncate">
                          {item.title}
                        </p>
                        {item.hasUnread && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                        {item.otherPartyName && ` \u00b7 ${item.otherPartyName}`}
                      </p>
                    </div>
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
