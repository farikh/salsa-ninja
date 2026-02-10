'use client';

import { useState } from 'react';
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
import { useCalendarNavigation } from '@/hooks/useCalendarNavigation';
import type { CalendarViewType, CalendarEvent } from '@/types/calendar';
import { EVENT_TYPE_COLORS } from '@/types/calendar';

interface CalendarShellProps {
  defaultView?: CalendarViewType;
}

export function CalendarShell({ defaultView }: CalendarShellProps) {
  const {
    currentView,
    currentDate,
    dateRange,
    title,
    isMobile,
    handleViewChange,
    handleDateChange,
    handleToday,
    handleDateClick,
  } = useCalendarNavigation({ defaultView, storageKey: 'calendar-view' });

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Data fetching
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
