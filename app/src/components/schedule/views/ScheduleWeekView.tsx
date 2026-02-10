'use client';

import { cn } from '@/lib/utils';
import { TimeGrid } from '@/components/calendar/TimeGrid';
import type { ScheduleItem } from '@/types/schedule';
import { startOfWeek, addDays, isSameDay, isToday, format } from 'date-fns';

interface ScheduleWeekViewProps {
  currentDate: Date;
  items: ScheduleItem[];
  onItemClick: (item: ScheduleItem) => void;
  onSlotClick?: (start: Date, end: Date) => void;
  hourStart?: number;
  hourEnd?: number;
}

/** Returns true if the color string is a raw hex/rgb value (used in inline styles). */
function isInlineColor(color: string): boolean {
  return color.startsWith('#') || color.startsWith('rgb');
}

// ---- Inline sub-component ----

function ScheduleItemBlock({
  item,
  hourStart,
  hourEnd,
  onClick,
  compact = false,
}: {
  item: ScheduleItem;
  hourStart: number;
  hourEnd: number;
  onClick?: (item: ScheduleItem) => void;
  compact?: boolean;
}) {
  const start = new Date(item.start_time);
  const end = new Date(item.end_time);

  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;

  const totalHours = hourEnd - hourStart;
  const topPercent = ((startHour - hourStart) / totalHours) * 100;
  const heightPercent = ((endHour - startHour) / totalHours) * 100;

  const inlineColor = isInlineColor(item.color);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <button
      type="button"
      onClick={() => onClick?.(item)}
      className={cn(
        'absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 text-left',
        'cursor-pointer transition-colors duration-150 overflow-hidden',
        'hover:brightness-125 z-10 min-h-[22px]'
      )}
      style={{
        top: `${topPercent}%`,
        height: `${heightPercent}%`,
        backgroundColor: inlineColor ? `${item.color}26` : undefined,
        borderLeft: `3px ${item.borderStyle} ${inlineColor ? item.color : 'currentColor'}`,
        color: inlineColor ? item.color : undefined,
        opacity: item.opacity,
      }}
    >
      <p
        className={cn(
          'font-semibold leading-tight truncate',
          compact ? 'text-[10px]' : 'text-xs'
        )}
      >
        {item.title}
      </p>
      {!compact && (
        <p className="text-[10px] opacity-75 truncate">
          {formatTime(start)} - {formatTime(end)}
        </p>
      )}
      {!compact && item.otherPartyName && (
        <p className="text-[10px] opacity-60 truncate">
          {item.otherPartyName}
        </p>
      )}
    </button>
  );
}

// ---- Main component ----

export function ScheduleWeekView({
  currentDate,
  items,
  onItemClick,
  onSlotClick,
  hourStart = 6,
  hourEnd = 22,
}: ScheduleWeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function getItemsForDay(date: Date): ScheduleItem[] {
    return items.filter((item) => isSameDay(new Date(item.start_time), date));
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
          const dayItems = getItemsForDay(day);

          return (
            <div
              className="absolute inset-0"
              onClick={(e) => handleColumnClick(i, e)}
            >
              {dayItems.map((item) => (
                <ScheduleItemBlock
                  key={item.id}
                  item={item}
                  hourStart={hourStart}
                  hourEnd={hourEnd}
                  onClick={onItemClick}
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
