// SWR hook for fetching bookings with details for a date range
// Design doc: docs/specs/features/unified-schedule.md (Section 4.3)

'use client';

import useSWR from 'swr';
import type { BookingWithDetails } from '@/types/booking';
import type { CalendarDateRange } from '@/types/calendar';

async function fetcher(url: string): Promise<BookingWithDetails[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch bookings: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data ?? [];
}

export function useBookingsInRange(dateRange: CalendarDateRange) {
  const params = new URLSearchParams({
    start: dateRange.start.toISOString().split('T')[0],
    end: dateRange.end.toISOString().split('T')[0],
  });

  return useSWR<BookingWithDetails[]>(
    `/api/bookings?${params}`,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 5000 }
  );
}
