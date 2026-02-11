'use client';

import { cn } from '@/lib/utils';
import type { ScheduleItem } from '@/types/schedule';
import { BOOKING_COLORS } from '@/types/schedule';

interface BookingListCardProps {
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

export function BookingListCard({ item, onClick }: BookingListCardProps) {
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

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={cn(
        'w-full text-left rounded-lg bg-white p-3',
        'cursor-pointer transition-colors duration-150',
        'hover:bg-gray-50',
        isPending ? 'border-l-4 border-dashed' : 'border-l-4 border-solid',
        colors.border,
        isCancelled && 'opacity-50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {item.hasUnread && (
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            )}
            <p className="font-semibold text-sm text-zinc-900 truncate">
              {item.title}
            </p>
          </div>
          {item.otherPartyName && (
            <p className="text-xs text-zinc-500 mt-0.5 truncate">
              with {item.otherPartyName}
            </p>
          )}
          <p className="text-xs text-zinc-400 mt-0.5">
            {formatTime(start)} - {formatTime(end)}
          </p>
        </div>
        {item.bookingStatus && (
          <span
            className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize shrink-0',
              colors.bg,
              colors.text
            )}
          >
            {item.bookingStatus.replace(/_/g, ' ')}
          </span>
        )}
      </div>
    </button>
  );
}
