'use client';

import useSWR from 'swr';
import type { BookingWithDetails } from '@/types/booking';

async function fetcher(url: string): Promise<BookingWithDetails[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch bookings: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data ?? [];
}

export function usePendingBookings(instructorId: string) {
  const key = instructorId
    ? `/api/bookings/pending?instructor_id=${instructorId}`
    : null;
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  return {
    bookings: data ?? [],
    isLoading,
    error: error ?? null,
    mutate: () => { mutate(); },
  };
}

export function useUpcomingBookings(memberId: string) {
  const key = memberId
    ? `/api/bookings/upcoming?member_id=${memberId}`
    : null;
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  return {
    bookings: data ?? [],
    isLoading,
    error: error ?? null,
    mutate: () => { mutate(); },
  };
}
