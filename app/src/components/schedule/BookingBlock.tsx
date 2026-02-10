'use client';

import { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import type { ScheduleItem } from '@/types/schedule';
import { BOOKING_COLORS } from '@/types/schedule';

interface BookingBlockProps {
  item: ScheduleItem;
  onClick: (item: ScheduleItem) => void;
  style: CSSProperties;
}

type BookingColorKey = keyof typeof BOOKING_COLORS;

function getColorKey(item: ScheduleItem): BookingColorKey {
  if (
    item.bookingStatus === 'cancelled_by_member' ||
    item.bookingStatus === 'cancelled_by_instructor'
  ) {
    return 'cancelled';
  }
  if (item.bookingStatus === 'pending') {
    return 'pending';
  }
  // confirmed / completed — distinguish teaching vs attending
  if (item.title.includes('(Teaching)')) {
    return 'confirmed_teaching';
  }
  return 'confirmed_attending';
}

export function BookingBlock({ item, onClick, style }: BookingBlockProps) {
  const colorKey = getColorKey(item);
  const colors = BOOKING_COLORS[colorKey];

  const start = new Date(item.start_time);
  const end = new Date(item.end_time);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  const isCancelled =
    item.bookingStatus === 'cancelled_by_member' ||
    item.bookingStatus === 'cancelled_by_instructor';
  const isPending = item.bookingStatus === 'pending';
  const isTeaching = item.title.includes('(Teaching)');

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={cn(
        'absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 text-left',
        'cursor-pointer transition-colors duration-150 overflow-hidden',
        'hover:brightness-125 z-10 min-h-[22px]',
        colors.bg,
        colors.text,
        isPending ? 'border border-dashed' : 'border-l-[3px] border-solid',
        isPending ? colors.border : colors.border,
        isCancelled && 'opacity-50'
      )}
      style={style}
    >
      <div className="flex items-center gap-1">
        {item.hasUnread && (
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
        )}
        <p className="font-semibold text-xs leading-tight truncate">
          {item.title}
        </p>
        {isTeaching && (
          <span className="text-[9px] font-medium bg-white/20 rounded px-1 shrink-0">
            Teaching
          </span>
        )}
      </div>
      {item.otherPartyName && (
        <p className="text-[10px] opacity-75 truncate">
          {item.otherPartyName}
        </p>
      )}
      <p className="text-[10px] opacity-75 truncate">
        {formatTime(start)} - {formatTime(end)}
      </p>
      {item.bookingStatus && (
        <span className="text-[9px] opacity-60 capitalize">
          {item.bookingStatus.replace(/_/g, ' ')}
        </span>
      )}
    </button>
  );
}
