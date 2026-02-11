// Orchestrates data fetching + merging for the unified schedule
// Design doc: docs/specs/features/unified-schedule.md (Sections 4.3, 4.6)

'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { useCalendarEvents } from './useCalendarEvents';
import { useBookingsInRange } from './useBookingsInRange';
import type { CalendarDateRange, CalendarEvent, CalendarViewType } from '@/types/calendar';
import { EVENT_TYPE_COLORS } from '@/types/calendar';
import type { BookingWithDetails, UnreadBookingMessage } from '@/types/booking';
import type { ScheduleItem } from '@/types/schedule';
import { mutate as globalMutate } from 'swr';

// Hex color mapping for booking items (views use inline styles with hex, not Tailwind classes)
const BOOKING_HEX_COLORS = {
  confirmed_teaching: '#4f46e5',  // indigo-600
  confirmed_attending: '#6366f1', // indigo-500
  pending: '#eab308',             // yellow-500
  cancelled: '#9ca3af',           // gray-400
} as const;

interface UseUnifiedScheduleOptions {
  dateRange: CalendarDateRange;
  view: CalendarViewType;
  userId: string;
  userRole: string;
}

interface UseUnifiedScheduleReturn {
  items: ScheduleItem[];
  isLoading: boolean;
  eventsError: Error | null;
  bookingsError: Error | null;
  mutateEvents: () => void;
  mutateBookings: () => void;
  bookingIds: string[];
  markItemUnread: (bookingId: string) => void;
}

async function unreadFetcher(url: string): Promise<UnreadBookingMessage[]> {
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return json.unread ?? [];
}

function mergeToScheduleItems(
  events: CalendarEvent[],
  bookings: BookingWithDetails[],
  unreadSet: Set<string>,
  userRole: string,
  userId: string
): ScheduleItem[] {
  const items: ScheduleItem[] = [];

  // Map events → ScheduleItem, filtering out private_lesson type to avoid duplication
  for (const event of events) {
    if (event.event_type === 'private_lesson') continue;

    const colors = EVENT_TYPE_COLORS[event.event_type];
    items.push({
      id: `event-${event.id}`,
      type: 'event',
      title: event.title,
      start_time: event.start_time,
      end_time: event.end_time,
      color: colors.text,
      borderStyle: 'solid',
      opacity: 1,
      event,
      eventType: event.event_type,
    });
  }

  // Map bookings → ScheduleItem
  for (const booking of bookings) {
    const isTeaching = booking.instructor_id === userId;
    const isPending = booking.status === 'pending';
    const isCancelled = booking.status === 'cancelled_by_member' ||
      booking.status === 'cancelled_by_instructor';

    let hexColor: string;
    if (isCancelled) {
      hexColor = BOOKING_HEX_COLORS.cancelled;
    } else if (isPending) {
      hexColor = BOOKING_HEX_COLORS.pending;
    } else if (isTeaching) {
      hexColor = BOOKING_HEX_COLORS.confirmed_teaching;
    } else {
      hexColor = BOOKING_HEX_COLORS.confirmed_attending;
    }

    const otherParty = isTeaching ? booking.member : booking.instructor;

    items.push({
      id: `booking-${booking.id}`,
      type: 'booking',
      title: isPending
        ? 'Pending Lesson Request'
        : `Private Lesson${isTeaching ? ' (Teaching)' : ''}`,
      start_time: booking.start_time,
      end_time: booking.end_time,
      color: hexColor,
      borderStyle: isPending ? 'dashed' : 'solid',
      opacity: isCancelled ? 0.5 : 1,
      booking,
      bookingStatus: booking.status,
      otherPartyName: otherParty?.display_name ?? otherParty?.full_name,
      otherPartyAvatar: otherParty?.avatar_url,
      hasUnread: unreadSet.has(booking.id),
    });
  }

  // Sort by start_time
  items.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return items;
}

export function useUnifiedSchedule(options: UseUnifiedScheduleOptions): UseUnifiedScheduleReturn {
  const { dateRange, view, userId, userRole } = options;

  // Parallel data fetching
  const {
    events,
    isLoading: eventsLoading,
    error: eventsError,
    mutate: mutateEvents,
  } = useCalendarEvents({ dateRange }, view);

  const {
    data: bookings,
    isLoading: bookingsLoading,
    error: bookingsError,
    mutate: mutateBookings,
  } = useBookingsInRange(dateRange);

  // Fetch unread messages
  const { data: unreadList } = useSWR<UnreadBookingMessage[]>(
    '/api/bookings/unread',
    unreadFetcher,
    { revalidateOnFocus: true, dedupingInterval: 10000 }
  );

  const unreadSet = useMemo(
    () => new Set(unreadList?.map(u => u.booking_id) ?? []),
    [unreadList]
  );

  const bookingIds = useMemo(
    () => (bookings ?? []).map(b => b.id),
    [bookings]
  );

  // Merge events + bookings into unified ScheduleItems
  const items = useMemo(
    () => mergeToScheduleItems(events, bookings ?? [], unreadSet, userRole, userId),
    [events, bookings, unreadSet, userRole, userId]
  );

  function markItemUnread(_bookingId: string) {
    // Trigger SWR revalidation of unread list so the blue dot appears
    globalMutate('/api/bookings/unread');
  }

  return {
    items,
    isLoading: eventsLoading || bookingsLoading,
    eventsError: eventsError ?? null,
    bookingsError: bookingsError ?? null,
    mutateEvents: () => { mutateEvents(); },
    mutateBookings: () => { mutateBookings(); },
    bookingIds,
    markItemUnread,
  };
}
