'use client';

import { cn } from '@/lib/utils';
import type { ScheduleItem } from '@/types/schedule';
import { BOOKING_COLORS } from '@/types/schedule';

interface BookingChipProps {
  item: ScheduleItem;
  onClick: (item: ScheduleItem) => void;
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
  if (item.title.includes('(Teaching)')) {
    return 'confirmed_teaching';
  }
  return 'confirmed_attending';
}

export function BookingChip({ item, onClick }: BookingChipProps) {
  const colorKey = getColorKey(item);
  const colors = BOOKING_COLORS[colorKey];

  const start = new Date(item.start_time);
  const timeStr = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const isCancelled =
    item.bookingStatus === 'cancelled_by_member' ||
    item.bookingStatus === 'cancelled_by_instructor';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(item);
      }}
      className={cn(
        'w-full text-left rounded px-1.5 py-0.5 text-xs truncate',
        'cursor-pointer transition-colors duration-150',
        'hover:brightness-125 min-h-[22px]',
        colors.bg,
        colors.text,
        'border-l-2 border-solid',
        colors.border,
        isCancelled && 'opacity-50'
      )}
    >
      <span className="flex items-center gap-1">
        {item.hasUnread && (
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
        )}
        <span className="font-medium">{timeStr}</span>{' '}
        <span className="opacity-80 truncate">{item.title}</span>
      </span>
    </button>
  );
}
