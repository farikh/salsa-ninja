// Calendar/Scheduling System Types
// Design doc: docs/specs/features/calendar-redesign-technical-design.md

export type CalendarViewType = 'month' | 'week' | 'day' | 'list';

export type CalendarEventType =
  | 'class'
  | 'workshop'
  | 'bootcamp'
  | 'studio_social'
  | 'community'
  | 'private_lesson';

export interface CalendarEvent {
  id: string;
  title: string;
  event_type: CalendarEventType;
  start_time: string; // ISO 8601
  end_time: string;
  instructor_id: string | null;
  instructor_name: string | null;
  instructor_avatar: string | null;
  dance_style: string | null;
  difficulty: string | null;
  location: string | null;
  capacity: number | null;
  rsvp_count: number;
  is_full: boolean;
  series_id: string | null;
  user_rsvp_status: string | null; // 'going' | 'waitlist' | null
  visibility: string;
}

export interface AvailabilityBlock {
  id: string;
  instructor_id: string;
  day_of_week: number;
  start_time: string; // TIME "HH:MM"
  end_time: string;
  is_recurring: boolean; // true = from instructor_availability, false = from override
  override_date?: string; // Only for non-recurring
}

export interface CalendarDateRange {
  start: Date;
  end: Date;
}

// Event type color mapping
export const EVENT_TYPE_COLORS: Record<CalendarEventType, { bg: string; text: string; border: string }> = {
  class: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '#ef4444' },
  workshop: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: '#f59e0b' },
  bootcamp: { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316', border: '#f97316' },
  studio_social: { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', border: '#a855f7' },
  community: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: '#22c55e' },
  private_lesson: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: '#3b82f6' },
};

// Availability block color mapping
export const AVAILABILITY_COLORS = {
  recurring: { bg: 'rgba(34, 197, 94, 0.12)', border: '#22c55e', style: 'solid' as const },
  oneOff: { bg: 'rgba(34, 197, 94, 0.12)', border: '#22c55e', style: 'dashed' as const },
  blocked: { bg: 'rgba(239, 68, 68, 0.08)', border: 'transparent', style: 'none' as const },
  pendingBooking: { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', style: 'solid' as const },
  confirmedBooking: { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', style: 'solid' as const },
};
