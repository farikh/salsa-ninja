'use client';

import { useState, useCallback, useMemo } from 'react';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarLegend } from '@/components/calendar/CalendarLegend';
import { ScheduleMonthView } from './views/ScheduleMonthView';
import { ScheduleWeekView } from './views/ScheduleWeekView';
import { ScheduleDayView } from './views/ScheduleDayView';
import { ScheduleListView } from './views/ScheduleListView';
import { ScheduleDetailSheet } from './ScheduleDetailSheet';
import { AvailabilityOverlay } from './AvailabilityOverlay';
import { useCalendarNavigation } from '@/hooks/useCalendarNavigation';
import { useUnifiedSchedule } from '@/hooks/useUnifiedSchedule';
import { useScheduleRealtime } from '@/hooks/useScheduleRealtime';
import { EVENT_TYPE_COLORS } from '@/types/calendar';
import type { ScheduleItem } from '@/types/schedule';

interface UnifiedScheduleProps {
  userId: string;
  userRole: string;
}

// Booking legend colors — uses CSS custom properties from globals.css
const BOOKING_LEGEND_COLORS = {
  booking: 'var(--status-info)',
  pending: 'var(--status-warning)',
  available: 'var(--status-success)',
};

export function UnifiedSchedule({ userId, userRole }: UnifiedScheduleProps) {
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
  } = useCalendarNavigation({ defaultView: undefined, storageKey: 'schedule-view' });

  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);

  const {
    items,
    isLoading,
    mutateEvents,
    mutateBookings,
    bookingIds,
    markItemUnread,
  } = useUnifiedSchedule({ dateRange, view: currentView, userId, userRole });

  // Realtime subscriptions
  const handleBookingChange = useCallback(() => {
    mutateBookings();
  }, [mutateBookings]);

  const handleNewMessage = useCallback((bookingId: string) => {
    markItemUnread(bookingId);
  }, [markItemUnread]);

  const handleReconnect = useCallback(() => {
    mutateEvents();
    mutateBookings();
  }, [mutateEvents, mutateBookings]);

  useScheduleRealtime({
    userId,
    userRole,
    bookingIds,
    onBookingChange: handleBookingChange,
    onNewMessage: handleNewMessage,
    onReconnect: handleReconnect,
  });

  // Merge availability overlay slots into visible items
  const [availabilitySlots, setAvailabilitySlots] = useState<ScheduleItem[]>([]);
  const allItems = useMemo(
    () => [...items, ...availabilitySlots].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    ),
    [items, availabilitySlots]
  );

  // Determine instructor ID for availability overlay (show for non-instructors)
  const isInstructor = userRole === 'instructor' || userRole === 'owner';

  // Legend items: event types + booking types
  const legendItems = useMemo(() => {
    const eventItems = Object.entries(EVENT_TYPE_COLORS)
      .filter(([type]) => type !== 'private_lesson') // Shown via booking colors instead
      .map(([type, colors]) => ({
        color: colors.text,
        label: type
          .replace('_', ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
      }));

    const bookingItems = [
      { color: BOOKING_LEGEND_COLORS.booking, label: 'Private Lesson' },
      { color: BOOKING_LEGEND_COLORS.pending, label: 'Pending' },
      { color: BOOKING_LEGEND_COLORS.available, label: 'Available Slot' },
    ];

    return [...eventItems, ...bookingItems];
  }, []);

  function handleItemClick(item: ScheduleItem) {
    setSelectedItem(item);
  }

  function handleBookingUpdate() {
    mutateBookings();
    setSelectedItem(null);
  }

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

      {/* Schedule body */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div
          className="transition-opacity duration-200"
          style={{ opacity: isLoading ? 0.6 : 1 }}
        >
          {currentView === 'month' && (
            <ScheduleMonthView
              currentDate={currentDate}
              items={allItems}
              onDateClick={handleDateClick}
              onItemClick={handleItemClick}
            />
          )}
          {currentView === 'week' && (
            <ScheduleWeekView
              currentDate={currentDate}
              items={allItems}
              onItemClick={handleItemClick}
            />
          )}
          {currentView === 'day' && (
            <ScheduleDayView
              date={currentDate}
              items={allItems}
              onItemClick={handleItemClick}
            />
          )}
          {currentView === 'list' && (
            <ScheduleListView
              items={allItems}
              dateRange={dateRange}
              onItemClick={handleItemClick}
              loading={isLoading}
            />
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4">
        <CalendarLegend items={legendItems} compact={isMobile} />
      </div>

      {/* Availability Overlay — non-instructor users see instructor availability */}
      {!isInstructor && (
        <AvailabilityOverlay
          instructorId={null}
          dateRange={dateRange}
          onSlotClick={handleItemClick}
        />
      )}

      {/* Detail sheet */}
      <ScheduleDetailSheet
        item={selectedItem}
        open={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        isMobile={isMobile}
        currentUserId={userId}
        onBookingUpdate={handleBookingUpdate}
      />
    </div>
  );
}
