// Unified Schedule Types
// Design doc: docs/specs/features/unified-schedule.md (Section 4.2)

import type { CalendarEvent, CalendarEventType } from './calendar';
import type { BookingStatus, PrivateLessonBooking } from './booking';

export type ScheduleItemType = 'event' | 'booking' | 'available_slot';

export interface ScheduleItem {
  id: string;
  type: ScheduleItemType;
  title: string;
  start_time: string; // ISO 8601
  end_time: string;
  color: string; // Tailwind color class
  borderStyle: 'solid' | 'dashed';
  opacity: number; // 0.0-1.0

  // Event-specific (nullable)
  event?: CalendarEvent;
  eventType?: CalendarEventType;

  // Booking-specific (nullable)
  booking?: PrivateLessonBooking;
  bookingStatus?: BookingStatus;
  otherPartyName?: string; // instructor name (student view) or student name (instructor view)
  otherPartyAvatar?: string | null;

  // Slot-specific (nullable)
  instructorId?: string;
  instructorName?: string;

  // UI state
  hasUnread?: boolean;
}

// Color constants for booking items (must not conflict with EVENT_TYPE_COLORS)
export const BOOKING_COLORS = {
  confirmed_teaching: {
    bg: 'bg-indigo-600',
    border: 'border-indigo-700',
    text: 'text-white',
  },
  confirmed_attending: {
    bg: 'bg-indigo-500',
    border: 'border-indigo-600',
    text: 'text-white',
  },
  pending: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-400',
    text: 'text-yellow-800',
  },
  cancelled: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-500',
  },
} as const;

export const AVAILABLE_SLOT_COLORS = {
  bg: 'bg-green-50',
  border: 'border-green-300',
  text: 'text-green-700',
} as const;
