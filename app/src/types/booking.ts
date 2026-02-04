// Private Lesson Booking Types
// Design doc: docs/specs/features/private-lesson-booking.md

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'declined'
  | 'expired'
  | 'cancelled_by_member'
  | 'cancelled_by_instructor'
  | 'completed'
  | 'no_show';

export interface InstructorAvailability {
  id: string;
  instructor_id: string;
  day_of_week: number; // 0=Sun, 6=Sat
  start_time: string; // TIME as string "HH:MM:SS"
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
  effective_from: string; // DATE as string
  effective_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityOverride {
  id: string;
  instructor_id: string;
  override_date: string; // DATE as string
  start_time: string | null;
  end_time: string | null;
  is_available: boolean;
  reason: string | null;
  slot_duration_minutes: number;
  created_at: string;
}

export interface PrivateLessonBooking {
  id: string;
  instructor_id: string;
  member_id: string;
  start_time: string; // TIMESTAMPTZ as ISO string
  end_time: string;
  status: BookingStatus;
  notes: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface BookingMessageRead {
  booking_id: string;
  member_id: string;
  last_read_at: string;
}

export interface TimeSlot {
  slot_start: string; // TIMESTAMPTZ as ISO string
  slot_end: string;
}

export interface Instructor {
  id: string;
  display_name: string;
  full_name: string;
  avatar_url: string | null;
}

export interface UnreadBookingMessage {
  booking_id: string;
  latest_message: string;
  latest_message_at: string;
  sender_name: string;
}

// Booking with related data for UI display
export interface BookingWithDetails extends PrivateLessonBooking {
  instructor?: Instructor;
  member?: { id: string; display_name: string; full_name: string; avatar_url: string | null };
  has_unread?: boolean;
}

// Calendar state managed by useReducer
export type CalendarAction =
  | { type: 'SET_INSTRUCTOR'; instructorId: string }
  | { type: 'SET_MONTH'; date: Date }
  | { type: 'SET_SELECTED_DATE'; date: Date | null }
  | { type: 'SET_SLOTS'; slots: TimeSlot[] }
  | { type: 'SET_BOOKINGS'; bookings: PrivateLessonBooking[] }
  | { type: 'SET_UNREAD'; unread: UnreadBookingMessage[] }
  | { type: 'BOOKING_CHANGED'; booking: PrivateLessonBooking }
  | { type: 'NEW_MESSAGE'; message: BookingMessage }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SELECTED_BOOKING'; bookingId: string | null };

export interface CalendarState {
  selectedInstructorId: string | null;
  currentMonth: Date;
  selectedDate: Date | null;
  selectedBookingId: string | null;
  slots: TimeSlot[];
  bookings: PrivateLessonBooking[];
  unread: UnreadBookingMessage[];
  loading: boolean;
}

// API response types
export interface ApiResponse<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface CreateBookingResponse {
  success: boolean;
  booking_id?: string;
  error?: string;
}

export interface SlotsResponse {
  slots: TimeSlot[];
}

export interface BookingsResponse {
  data: PrivateLessonBooking[];
}

export interface MessagesResponse {
  messages: BookingMessage[];
  hasUnread: boolean;
}

export interface InstructorsResponse {
  instructors: Instructor[];
}

export interface UnreadResponse {
  unread: UnreadBookingMessage[];
}
