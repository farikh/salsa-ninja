'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CalendarHeader } from './CalendarHeader';
import { MonthView } from './views/MonthView';
import { WeekView } from './views/WeekView';
import { DayView } from './views/DayView';
import { ListView } from './views/ListView';
import { EventDetailSheet } from './EventDetailSheet';
import { EventDetailDrawer } from './EventDetailDrawer';
import { CalendarLegend } from './CalendarLegend';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useRealtimeCalendar } from '@/hooks/useRealtimeCalendar';
import type { CalendarViewType, CalendarEvent, CalendarDateRange } from '@/types/calendar';
import { EVENT_TYPE_COLORS } from '@/types/calendar';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
} from 'date-fns';

interface CalendarShellProps {
  defaultView?: CalendarViewType;
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

function getDefaultView(): CalendarViewType {
  if (typeof window === 'undefined') return 'month';
  // Check saved preference
  const saved = localStorage.getItem('calendar-view');
  if (saved && ['month', 'week', 'day', 'list'].includes(saved)) {
    return saved as CalendarViewType;
  }
  // Default by breakpoint
  const w = window.innerWidth;
  if (w < 640) return 'list';
  if (w < 1024) return 'week';
  return 'month';
}

export function CalendarShell({ defaultView }: CalendarShellProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read from URL or defaults
  const urlView = searchParams.get('view') as CalendarViewType | null;
  const urlDate = searchParams.get('date');

  const [currentView, setCurrentView] = useState<CalendarViewType>(
    urlView ?? defaultView ?? 'month'
  );
  const [currentDate, setCurrentDate] = useState<Date>(
    urlDate ? new Date(urlDate) : new Date()
  );
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Initialize default view on mount
  useEffect(() => {
    if (!urlView && !defaultView) {
      setCurrentView(getDefaultView());
    }
    setIsMobile(window.innerWidth < 768);

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync state to URL
  const updateUrl = useCallback(
    (view: CalendarViewType, date: Date) => {
      const params = new URLSearchParams();
      params.set('view', view);
      params.set('date', format(date, 'yyyy-MM-dd'));
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  function handleViewChange(view: CalendarViewType) {
    setCurrentView(view);
    localStorage.setItem('calendar-view', view);
    updateUrl(view, currentDate);
  }

  function handleDateChange(date: Date) {
    setCurrentDate(date);
    updateUrl(currentView, date);
  }

  function handleToday() {
    const now = new Date();
    setCurrentDate(now);
    updateUrl(currentView, now);
  }

  function handleDateClick(date: Date) {
    if (isMobile) {
      setCurrentView('day');
      setCurrentDate(date);
      updateUrl('day', date);
    } else {
      setCurrentDate(date);
      setCurrentView('day');
      updateUrl('day', date);
    }
  }

  // Data fetching
  const dateRange = useMemo(
    () => getDateRange(currentView, currentDate),
    [currentView, currentDate.toISOString()]
  );

  const { events, isLoading, mutate } = useCalendarEvents(
    { dateRange },
    currentView
  );

  // Real-time subscription
  useRealtimeCalendar({
    tables: [{ table: 'events' }, { table: 'event_rsvps' }],
    onUpdate: mutate,
    channelName: 'calendar:events',
  });

  const title = getViewTitle(currentView, currentDate);

  const legendItems = Object.entries(EVENT_TYPE_COLORS).map(([type, colors]) => ({
    color: colors.text,
    label: type
      .replace('_', ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
  }));

  return (
    <div className="w-full">
      <CalendarHeader
        currentView={currentView}
        currentDate={currentDate}
        onViewChange={handleViewChange}
        onDateChange={handleDateChange}
        onToday={handleToday}
        title={title}
      />

      {/* Calendar body with transition */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div
          className="transition-opacity duration-200"
          style={{ opacity: isLoading ? 0.6 : 1 }}
        >
          {currentView === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={events}
              onDateClick={handleDateClick}
              onEventClick={setSelectedEvent}
            />
          )}
          {currentView === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={events}
              onEventClick={setSelectedEvent}
            />
          )}
          {currentView === 'day' && (
            <DayView
              date={currentDate}
              events={events}
              onEventClick={setSelectedEvent}
            />
          )}
          {currentView === 'list' && (
            <ListView
              events={events}
              dateRange={dateRange}
              onEventClick={setSelectedEvent}
              loading={isLoading}
            />
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4">
        <CalendarLegend items={legendItems} compact={isMobile} />
      </div>

      {/* Event detail - Sheet on desktop, Drawer on mobile */}
      {isMobile ? (
        <EventDetailDrawer
          event={selectedEvent}
          open={selectedEvent !== null}
          onClose={() => setSelectedEvent(null)}
        />
      ) : (
        <EventDetailSheet
          event={selectedEvent}
          open={selectedEvent !== null}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
