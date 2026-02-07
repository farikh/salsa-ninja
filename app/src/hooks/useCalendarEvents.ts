'use client';

import useSWR, { preload } from 'swr';
import { useEffect } from 'react';
import type { CalendarEvent, CalendarEventType, CalendarDateRange } from '@/types/calendar';

interface UseCalendarEventsOptions {
  dateRange: CalendarDateRange;
  eventTypes?: CalendarEventType[];
  instructorId?: string;
}

interface UseCalendarEventsReturn {
  events: CalendarEvent[];
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

function buildCacheKey(options: UseCalendarEventsOptions): string {
  const params = new URLSearchParams({
    start: options.dateRange.start.toISOString(),
    end: options.dateRange.end.toISOString(),
  });
  if (options.eventTypes?.length) {
    params.set('types', options.eventTypes.join(','));
  }
  if (options.instructorId) {
    params.set('instructor_id', options.instructorId);
  }
  params.set('include_rsvp', 'true');
  return `/api/events?${params.toString()}`;
}

async function fetcher(url: string): Promise<CalendarEvent[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch events: ${res.statusText}`);
  }
  const json = await res.json();
  return json.events ?? [];
}

function getPreviousRange(
  currentDate: Date,
  view: 'month' | 'week' | 'day' | 'list'
): CalendarDateRange {
  const d = new Date(currentDate);
  switch (view) {
    case 'month':
      d.setMonth(d.getMonth() - 1);
      return {
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0),
      };
    case 'week':
      d.setDate(d.getDate() - 7);
      return { start: new Date(d), end: new Date(d.getTime() + 6 * 86400000) };
    case 'day':
      d.setDate(d.getDate() - 1);
      return { start: new Date(d), end: new Date(d) };
    case 'list':
      d.setDate(d.getDate() - 7);
      return { start: new Date(d), end: new Date(d.getTime() + 6 * 86400000) };
  }
}

function getNextRange(
  currentDate: Date,
  view: 'month' | 'week' | 'day' | 'list'
): CalendarDateRange {
  const d = new Date(currentDate);
  switch (view) {
    case 'month':
      d.setMonth(d.getMonth() + 1);
      return {
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0),
      };
    case 'week':
      d.setDate(d.getDate() + 7);
      return { start: new Date(d), end: new Date(d.getTime() + 6 * 86400000) };
    case 'day':
      d.setDate(d.getDate() + 1);
      return { start: new Date(d), end: new Date(d) };
    case 'list':
      d.setDate(d.getDate() + 7);
      return { start: new Date(d), end: new Date(d.getTime() + 6 * 86400000) };
  }
}

export function useCalendarEvents(
  options: UseCalendarEventsOptions,
  view: 'month' | 'week' | 'day' | 'list' = 'month'
): UseCalendarEventsReturn {
  const key = buildCacheKey(options);
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  // Prefetch adjacent ranges
  useEffect(() => {
    const prevRange = getPreviousRange(options.dateRange.start, view);
    const nextRange = getNextRange(options.dateRange.start, view);
    const prevKey = buildCacheKey({ ...options, dateRange: prevRange });
    const nextKey = buildCacheKey({ ...options, dateRange: nextRange });
    preload(prevKey, fetcher);
    preload(nextKey, fetcher);
  }, [view, options.dateRange.start.toISOString()]);

  return {
    events: data ?? [],
    isLoading,
    error: error ?? null,
    mutate: () => { mutate(); },
  };
}
