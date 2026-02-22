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

// Event type color mapping — uses CSS custom properties from globals.css
export const EVENT_TYPE_COLORS: Record<CalendarEventType, { bg: string; text: string; border: string }> = {
  class: { bg: 'color-mix(in srgb, var(--event-class) 15%, transparent)', text: 'var(--event-class)', border: 'var(--event-class)' },
  workshop: { bg: 'color-mix(in srgb, var(--event-workshop) 15%, transparent)', text: 'var(--event-workshop)', border: 'var(--event-workshop)' },
  bootcamp: { bg: 'color-mix(in srgb, var(--event-bootcamp) 15%, transparent)', text: 'var(--event-bootcamp)', border: 'var(--event-bootcamp)' },
  studio_social: { bg: 'color-mix(in srgb, var(--event-social) 15%, transparent)', text: 'var(--event-social)', border: 'var(--event-social)' },
  community: { bg: 'color-mix(in srgb, var(--event-community) 15%, transparent)', text: 'var(--event-community)', border: 'var(--event-community)' },
  private_lesson: { bg: 'color-mix(in srgb, var(--event-private) 15%, transparent)', text: 'var(--event-private)', border: 'var(--event-private)' },
};

// Availability block color mapping — uses CSS custom properties from globals.css
export const AVAILABILITY_COLORS = {
  recurring: { bg: 'color-mix(in srgb, var(--status-success) 12%, transparent)', border: 'var(--status-success)', style: 'solid' as const },
  oneOff: { bg: 'color-mix(in srgb, var(--status-success) 12%, transparent)', border: 'var(--status-success)', style: 'dashed' as const },
  blocked: { bg: 'color-mix(in srgb, var(--status-error) 8%, transparent)', border: 'transparent', style: 'none' as const },
  pendingBooking: { bg: 'color-mix(in srgb, var(--status-warning) 15%, transparent)', border: 'var(--status-warning)', style: 'solid' as const },
  confirmedBooking: { bg: 'color-mix(in srgb, var(--status-info) 15%, transparent)', border: 'var(--status-info)', style: 'solid' as const },
};
