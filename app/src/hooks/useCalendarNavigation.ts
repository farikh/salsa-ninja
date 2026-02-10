// Shared calendar navigation logic
// Extracted from CalendarShell.tsx — used by both CalendarShell and UnifiedSchedule
// Design doc: docs/specs/features/unified-schedule.md (Section 4.5)

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { CalendarViewType, CalendarDateRange } from '@/types/calendar';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
} from 'date-fns';

interface UseCalendarNavigationOptions {
  defaultView?: CalendarViewType;
  storageKey?: string; // localStorage key for view persistence
}

function getViewTitle(view: CalendarViewType, date: Date): string {
  switch (view) {
    case 'month':
      return format(date, 'MMMM yyyy');
    case 'week': {
      const start = startOfWeek(date, { weekStartsOn: 0 });
      const end = endOfWeek(date, { weekStartsOn: 0 });
      if (start.getMonth() === end.getMonth()) {
        return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
      }
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
    case 'day':
      return format(date, 'EEEE, MMMM d, yyyy');
    case 'list':
      return format(date, 'MMMM yyyy');
  }
}

function getDateRange(view: CalendarViewType, date: Date): CalendarDateRange {
  switch (view) {
    case 'month':
      return {
        start: startOfWeek(startOfMonth(date), { weekStartsOn: 0 }),
        end: endOfWeek(endOfMonth(date), { weekStartsOn: 0 }),
      };
    case 'week':
      return {
        start: startOfWeek(date, { weekStartsOn: 0 }),
        end: endOfWeek(date, { weekStartsOn: 0 }),
      };
    case 'day':
      return { start: date, end: date };
    case 'list':
      return { start: date, end: addDays(date, 30) };
  }
}

function getDefaultView(storageKey: string): CalendarViewType {
  if (typeof window === 'undefined') return 'month';
  const saved = localStorage.getItem(storageKey);
  if (saved && ['month', 'week', 'day', 'list'].includes(saved)) {
    return saved as CalendarViewType;
  }
  const w = window.innerWidth;
  if (w < 640) return 'list';
  if (w < 1024) return 'week';
  return 'month';
}

export function useCalendarNavigation(options?: UseCalendarNavigationOptions) {
  const storageKey = options?.storageKey ?? 'calendar-view';
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlView = searchParams.get('view') as CalendarViewType | null;
  const urlDate = searchParams.get('date');

  const [currentView, setCurrentView] = useState<CalendarViewType>(
    urlView ?? options?.defaultView ?? 'month'
  );
  const [currentDate, setCurrentDate] = useState<Date>(
    urlDate ? new Date(urlDate) : new Date()
  );
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (!urlView && !options?.defaultView) {
      setCurrentView(getDefaultView(storageKey));
    }
    setIsMobile(window.innerWidth < 768);

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateUrl = useCallback(
    (view: CalendarViewType, date: Date) => {
      const params = new URLSearchParams();
      params.set('view', view);
      params.set('date', format(date, 'yyyy-MM-dd'));
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  const handleViewChange = useCallback(
    (view: CalendarViewType) => {
      setCurrentView(view);
      localStorage.setItem(storageKey, view);
      updateUrl(view, currentDate);
    },
    [currentDate, storageKey, updateUrl]
  );

  const handleDateChange = useCallback(
    (date: Date) => {
      setCurrentDate(date);
      updateUrl(currentView, date);
    },
    [currentView, updateUrl]
  );

  const handleToday = useCallback(() => {
    const now = new Date();
    setCurrentDate(now);
    updateUrl(currentView, now);
  }, [currentView, updateUrl]);

  const handleDateClick = useCallback(
    (date: Date) => {
      setCurrentView('day');
      setCurrentDate(date);
      updateUrl('day', date);
    },
    [updateUrl]
  );

  const dateRange = useMemo(
    () => getDateRange(currentView, currentDate),
    [currentView, currentDate.toISOString()]
  );

  const title = getViewTitle(currentView, currentDate);

  return {
    currentView,
    currentDate,
    dateRange,
    title,
    isMobile,
    handleViewChange,
    handleDateChange,
    handleToday,
    handleDateClick,
  };
}
