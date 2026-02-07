'use client';

import useSWR from 'swr';
import type {
  InstructorAvailability,
  AvailabilityOverride,
  PrivateLessonBooking,
} from '@/types/booking';

interface UseAvailabilityOptions {
  instructorId: string;
  view: 'weekly' | 'monthly';
  date: Date;
}

interface UseAvailabilityReturn {
  availability: InstructorAvailability[];
  overrides: AvailabilityOverride[];
  bookings: PrivateLessonBooking[];
  isLoading: boolean;
  mutate: () => void;
}

function buildKey(options: UseAvailabilityOptions): string {
  const params = new URLSearchParams({
    instructor_id: options.instructorId,
    view: options.view,
    date: options.date.toISOString().split('T')[0],
  });
  return `/api/availability/calendar?${params.toString()}`;
}

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch availability: ${res.statusText}`);
  }
  return res.json();
}

export function useAvailability(
  options: UseAvailabilityOptions
): UseAvailabilityReturn {
  const key = buildKey(options);
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  return {
    availability: data?.availability ?? [],
    overrides: data?.overrides ?? [],
    bookings: data?.bookings ?? [],
    isLoading,
    mutate: () => { mutate(); },
  };
}
