'use client';

import { cn } from '@/lib/utils';
import type { ScheduleItem } from '@/types/schedule';
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

interface ScheduleMonthViewProps {
  currentDate: Date;
  items: ScheduleItem[];
  onDateClick: (date: Date) => void;
  onItemClick: (item: ScheduleItem) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_VISIBLE_ITEMS = 3;

/** Returns true if the color string is a raw hex/rgb value (used in inline styles). */
function isInlineColor(color: string): boolean {
  return color.startsWith('#') || color.startsWith('rgb');
}

// ---- Inline sub-components ----

function ScheduleItemChip({
  item,
  onClick,
  compact = false,
}: {
  item: ScheduleItem;
  onClick?: (item: ScheduleItem) => void;
  compact?: boolean;
}) {
  const start = new Date(item.start_time);
  const timeStr = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const inlineColor = isInlineColor(item.color);

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onClick?.(item)}
        className={cn('w-1.5 h-1.5 rounded-full shrink-0')}
        style={{
          backgroundColor: inlineColor ? item.color : undefined,
          opacity: item.opacity,
        }}
        title={item.title}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(item);
      }}
      className={cn(
        'w-full text-left rounded px-1.5 py-0.5 text-xs truncate',
        'cursor-pointer transition-colors duration-150',
        'hover:brightness-125 min-h-[22px]'
      )}
      style={{
        backgroundColor: inlineColor ? `${item.color}26` : undefined, // 15% opacity hex suffix
        color: inlineColor ? item.color : undefined,
        borderLeft: `2px ${item.borderStyle} ${inlineColor ? item.color : 'currentColor'}`,
        opacity: item.opacity,
      }}
    >
      <span className="font-medium">{timeStr}</span>{' '}
      <span className="opacity-80">{item.title}</span>
    </button>
  );
}

// ---- Main component ----

export function ScheduleMonthView({
  currentDate,
  items,
  onDateClick,
  onItemClick,
}: ScheduleMonthViewProps) {
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

  // Group items by date
  function getItemsForDate(date: Date): ScheduleItem[] {
    return items.filter((item) => isSameDay(new Date(item.start_time), date));
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
            const dayItems = getItemsForDate(date);
            const isCurrentMonth = isSameMonth(date, currentDate);
            const isCurrentDay = isToday(date);
            const hasMore = dayItems.length > MAX_VISIBLE_ITEMS;

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

                {/* Items - chips on desktop, dots on mobile */}
                <div className="hidden sm:flex flex-col gap-0.5">
                  {dayItems.slice(0, MAX_VISIBLE_ITEMS).map((item) => (
                    <ScheduleItemChip
                      key={item.id}
                      item={item}
                      onClick={onItemClick}
                    />
                  ))}
                  {hasMore && (
                    <span className="text-[10px] text-muted-foreground pl-1">
                      +{dayItems.length - MAX_VISIBLE_ITEMS} more
                    </span>
                  )}
                </div>

                {/* Dots on mobile */}
                <div className="flex sm:hidden gap-0.5 flex-wrap mt-0.5">
                  {dayItems.slice(0, 5).map((item) => (
                    <ScheduleItemChip
                      key={item.id}
                      item={item}
                      onClick={onItemClick}
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
