'use client';

import { cn } from '@/lib/utils';
import { TimeGrid } from '@/components/calendar/TimeGrid';
import type { ScheduleItem } from '@/types/schedule';
import { isSameDay, format, isToday } from 'date-fns';

interface ScheduleDayViewProps {
  date: Date;
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
}: {
  item: ScheduleItem;
  hourStart: number;
  hourEnd: number;
  onClick?: (item: ScheduleItem) => void;
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
      <p className="text-xs font-semibold leading-tight truncate">
        {item.title}
      </p>
      <p className="text-[10px] opacity-75 truncate">
        {formatTime(start)} - {formatTime(end)}
      </p>
      {item.otherPartyName && (
        <p className="text-[10px] opacity-60 truncate">
          {item.otherPartyName}
        </p>
      )}
    </button>
  );
}

// ---- Main component ----

export function ScheduleDayView({
  date,
  items,
  onItemClick,
  onSlotClick,
  hourStart = 6,
  hourEnd = 22,
}: ScheduleDayViewProps) {
  const dayItems = items.filter((item) => isSameDay(new Date(item.start_time), date));

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
          {dayItems.map((item) => (
            <ScheduleItemBlock
              key={item.id}
              item={item}
              hourStart={hourStart}
              hourEnd={hourEnd}
              onClick={onItemClick}
            />
          ))}
        </div>
      )}
    />
  );
}
