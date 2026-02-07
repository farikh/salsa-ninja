# Calendar Redesign -- Technical Design

> **Bead:** app-hjb.3
> **Date:** 2026-02-06
> **Status:** Complete
> **Inputs:** [Research 2026](../../research/calendar-scheduling-research-2026.md) | [Feature Requirements](../../research/calendar-feature-requirements-2026.md) | [Calendar Architecture](./calendar-architecture.md) | [Private Lesson Booking v2](./private-lesson-booking-v2.md)

---

## Table of Contents

1. [Library & Dependency Choices](#1-library--dependency-choices)
2. [Component Architecture](#2-component-architecture)
3. [Calendar Views](#3-calendar-views)
4. [Data Layer](#4-data-layer)
5. [Supabase Realtime Strategy](#5-supabase-realtime-strategy)
6. [Database Changes](#6-database-changes)
7. [API Route Changes](#7-api-route-changes)
8. [Role-Based Behavior](#8-role-based-behavior)
9. [Instructor Availability Management](#9-instructor-availability-management)
10. [Booking Flow](#10-booking-flow)
11. [Mobile Design](#11-mobile-design)
12. [Styling Specification](#12-styling-specification)
13. [File Structure](#13-file-structure)
14. [Implementation Order](#14-implementation-order)

---

## 1. Library & Dependency Choices

### Confirmed Stack

| Layer | Package | Version | Rationale |
|-------|---------|---------|-----------|
| Calendar UI | Custom shadcn/ui components | N/A | Reference: `lramos33/big-calendar`. Native Tailwind/shadcn fit, full control over every pixel. No CSS override gymnastics. |
| Drag-and-Drop | `@dnd-kit/core` + `@dnd-kit/utilities` | `^5.1.0` / `^3.2.0` | Industry standard. Built-in touch/keyboard/pointer support. 12 KB gzipped. |
| Recurrence | `rrule` | `^2.8.1` | RFC 5545 compliant. Used server-side for event series expansion. |
| Date handling | `date-fns` (already installed) | `^4.1.0` | Already in project. Tree-shakable. Covers format, startOfWeek, addDays, etc. |
| Real-time | Supabase Realtime (already installed) | N/A | Already in stack. postgres_changes subscriptions. |
| Data fetching | SWR | `^2.2.5` | Lightweight (4 KB gzipped). Stale-while-revalidate caching, focus revalidation, mutation. Preferred over React Query for this project's scope. |
| Bottom sheets | Vaul (already installed via shadcn Drawer) | `^1.1.2` | Already installed. Gesture-native. |
| Date picker | react-day-picker (already installed) | `^9.13.0` | Used by shadcn Calendar component. Extend for month calendar views. |

### New Dependencies to Install

```bash
cd app && npm install @dnd-kit/core@^5.1.0 @dnd-kit/utilities@^3.2.0 rrule@^2.8.1 swr@^2.2.5
```

### Bundle Budget

| Package | Size (min+gzip) |
|---------|----------------|
| @dnd-kit/core | ~12 KB |
| @dnd-kit/utilities | ~2 KB |
| rrule | ~8 KB |
| swr | ~4 KB |
| date-fns (additional imports, tree-shaken) | ~2 KB |
| Custom calendar components | ~18 KB |
| **Total new calendar bundle** | **~46 KB** |

This is well under the 80-100 KB that FullCalendar would require, and we get native shadcn/ui styling with zero CSS overrides.

### What We Are NOT Adding

- **luxon**: `date-fns` already handles our date arithmetic. Luxon was recommended in the architecture doc for RRULE timezone expansion, but `rrule`'s `tzid` option combined with `date-fns` `formatInTimeZone` covers our single-timezone needs. Revisit if multi-timezone becomes necessary.
- **@dnd-kit/sortable**: Not needed. We use core DnD for drag-to-create availability blocks, not list reordering.
- **React Query / TanStack Query**: Over-engineered for our scale. SWR is simpler and lighter.

---

## 2. Component Architecture

### Component Tree

```
CalendarShell (layout wrapper)
├── CalendarHeader
│   ├── ViewSwitcher (month/week/day/list tabs)
│   ├── DateNavigator (prev/next/today)
│   └── CalendarActions (+ create event, filters)
├── CalendarBody
│   ├── MonthView
│   │   ├── MonthGrid
│   │   │   └── MonthDayCell (x 35-42)
│   │   │       └── EventIndicator (dots/chips per event)
│   │   └── EventPopover (click day to expand)
│   ├── WeekView
│   │   ├── WeekHeader (day labels)
│   │   ├── AllDayRow (all-day events)
│   │   └── TimeGrid
│   │       ├── TimeGutter (hour labels)
│   │       ├── DayColumn (x 7)
│   │       │   ├── EventBlock (positioned by time)
│   │       │   ├── AvailabilityBlock (instructor only)
│   │       │   └── DragOverlay (dnd-kit)
│   │       └── CurrentTimeIndicator
│   ├── DayView
│   │   ├── DayHeader
│   │   └── TimeGrid (single column variant)
│   └── ListView
│       └── EventListItem (chronological)
├── CalendarSidebar (desktop only)
│   ├── MiniCalendar (date picker)
│   ├── CalendarLegend
│   └── InstructorFilter
└── EventDetail
    ├── EventDetailSheet (desktop)
    └── EventDetailDrawer (mobile)

InstructorAvailabilityCalendar (separate route)
├── AvailabilityHeader
│   ├── ViewToggle (weekly/monthly)
│   └── WeekNavigator / MonthNavigator
├── WeeklyGridView
│   ├── WeekTimeGrid
│   │   ├── TimeGutter
│   │   └── DayColumn (x 7)
│   │       ├── AvailabilityBlock (draggable)
│   │       ├── BookingOverlay
│   │       └── DragToCreateZone
│   └── AvailabilityActions (add/edit/delete)
├── MonthlyAvailabilityView
│   ├── MonthGrid (reuses MonthView shell)
│   │   └── AvailabilityDayCell (color-coded)
│   └── DayDetailPopover
└── AddAvailabilityDialog

DashboardCards
├── InstructorPendingBookingsCard
│   └── PendingBookingRow (confirm/decline)
├── StudentBookingsCard
│   └── StudentBookingRow (status badge)
└── BookingStatusBadge
```

### Component Specifications

#### CalendarShell

| Property | Value |
|----------|-------|
| **File** | `app/src/components/calendar/CalendarShell.tsx` |
| **Type** | Client Component |
| **Responsibility** | Top-level layout wrapper. Renders header, body, and optional sidebar. Manages view state via URL search params. |
| **Props** | `children: ReactNode` |

```typescript
interface CalendarShellProps {
  children: React.ReactNode;
  defaultView?: CalendarViewType;
}
```

#### CalendarHeader

| Property | Value |
|----------|-------|
| **File** | `app/src/components/calendar/CalendarHeader.tsx` |
| **Type** | Client Component |
| **Responsibility** | View switcher (month/week/day/list), date navigation, action buttons. |

```typescript
interface CalendarHeaderProps {
  currentView: CalendarViewType;
  currentDate: Date;
  onViewChange: (view: CalendarViewType) => void;
  onDateChange: (date: Date) => void;
  onToday: () => void;
  title: string; // "February 2026", "Feb 2-8, 2026", etc.
  actions?: React.ReactNode; // Slot for role-specific buttons
}
```

#### MonthView

| Property | Value |
|----------|-------|
| **File** | `app/src/components/calendar/views/MonthView.tsx` |
| **Type** | Client Component |
| **Responsibility** | 6-row x 7-column grid. Renders event indicators per day. Click day to show popover or navigate to day view. |

```typescript
interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  renderDayContent?: (date: Date, events: CalendarEvent[]) => React.ReactNode;
}
```

#### WeekView

| Property | Value |
|----------|-------|
| **File** | `app/src/components/calendar/views/WeekView.tsx` |
| **Type** | Client Component |
| **Responsibility** | 7-column time grid (6 AM - 10 PM). Events rendered as positioned blocks. Current time indicator. Drag-to-create for instructors. |

```typescript
interface WeekViewProps {
  currentDate: Date; // Any day in the target week
  events: CalendarEvent[];
  availabilityBlocks?: AvailabilityBlock[]; // Instructor availability overlay
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick?: (start: Date, end: Date) => void; // Empty slot interaction
  onDragCreate?: (start: Date, end: Date) => void; // Drag-to-create
  hourStart?: number; // Default 6
  hourEnd?: number; // Default 22
}
```

#### DayView

| Property | Value |
|----------|-------|
| **File** | `app/src/components/calendar/views/DayView.tsx` |
| **Type** | Client Component |
| **Responsibility** | Single-column time grid. Detailed event blocks with full title, time, instructor. |

```typescript
interface DayViewProps {
  date: Date;
  events: CalendarEvent[];
  availabilityBlocks?: AvailabilityBlock[];
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick?: (start: Date, end: Date) => void;
}
```

#### ListView

| Property | Value |
|----------|-------|
| **File** | `app/src/components/calendar/views/ListView.tsx` |
| **Type** | Client Component |
| **Responsibility** | Chronological list of events grouped by date. Mobile-optimized. Loads more on scroll. |

```typescript
interface ListViewProps {
  events: CalendarEvent[];
  dateRange: { start: Date; end: Date };
  onEventClick: (event: CalendarEvent) => void;
  loading?: boolean;
}
```

#### WeeklyGridView (Instructor Availability)

| Property | Value |
|----------|-------|
| **File** | `app/src/app/(site)/private-sessions/availability-calendar/WeeklyGridView.tsx` |
| **Type** | Client Component (already exists -- will be enhanced) |
| **Responsibility** | 7-day time grid for instructor availability management. Drag-to-create availability blocks via @dnd-kit. Click existing blocks to edit/delete. Shows booking overlays. |

```typescript
interface WeeklyGridViewProps {
  weekStart: Date;
  availability: InstructorAvailability[];
  overrides: AvailabilityOverride[];
  bookings: PrivateLessonBooking[];
  onAddAvailability: (dayOfWeek: number, startTime: string, endTime: string) => void;
  onEditAvailability: (id: string) => void;
  onDeleteAvailability: (id: string) => void;
}
```

#### InstructorPendingBookingsCard

| Property | Value |
|----------|-------|
| **File** | `app/src/app/(site)/dashboard/InstructorPendingBookingsCard.tsx` |
| **Type** | Client Component |
| **Responsibility** | Dashboard card. Lists pending booking requests with confirm/decline actions. Real-time count badge. |

```typescript
interface InstructorPendingBookingsCardProps {
  instructorId: string;
}
```

#### StudentBookingsCard

| Property | Value |
|----------|-------|
| **File** | `app/src/app/(site)/dashboard/StudentBookingsCard.tsx` |
| **Type** | Client Component |
| **Responsibility** | Dashboard card. Lists upcoming bookings with color-coded status badges. Links to booking detail. |

```typescript
interface StudentBookingsCardProps {
  memberId: string;
}
```

#### BookingStatusBadge

| Property | Value |
|----------|-------|
| **File** | `app/src/components/booking/BookingStatusBadge.tsx` |
| **Type** | Client Component |
| **Responsibility** | Reusable status indicator badge. |

```typescript
interface BookingStatusBadgeProps {
  status: BookingStatus;
  size?: 'sm' | 'default';
}
```

#### CalendarLegend

| Property | Value |
|----------|-------|
| **File** | `app/src/components/calendar/CalendarLegend.tsx` |
| **Type** | Client Component |
| **Responsibility** | Color-coded legend for calendar views. Adapts items based on context (student vs instructor). |

```typescript
interface CalendarLegendProps {
  items: Array<{ color: string; label: string }>;
  compact?: boolean; // For mobile
}
```

### Shared vs Page-Specific Components

**Shared (reusable across pages):**
- `CalendarShell`, `CalendarHeader`, `MonthView`, `WeekView`, `DayView`, `ListView` -- in `components/calendar/`
- `BookingStatusBadge`, `CalendarLegend` -- in `components/booking/` and `components/calendar/`
- `EventDetailSheet`, `EventDetailDrawer` -- in `components/calendar/`

**Page-specific (used in one route):**
- `WeeklyGridView`, `MonthlyAvailabilityView`, `AvailabilityCalendar` -- in `private-sessions/availability-calendar/`
- `InstructorPendingBookingsCard`, `StudentBookingsCard` -- in `dashboard/`

### Component Composition Patterns

1. **View switching** uses conditional rendering inside `CalendarBody`, controlled by URL search param `?view=month|week|day|list`.
2. **Event detail** uses shadcn `Sheet` (desktop >= 768px) or `Drawer` (mobile < 768px), selected via `useMediaQuery`.
3. **Time grid** is a shared primitive used by `WeekView`, `DayView`, and `WeeklyGridView`. The `TimeGrid` component renders the hour gutter + columns; each view composes it with different column counts and content.

---

## 3. Calendar Views

### Month View

**Layout:** 7-column grid, 5-6 rows depending on month. Each cell shows the day number plus up to 3 event chips. A "+N more" link appears when events overflow.

**Event indicators:**
- Colored dots below the day number (mobile)
- Short event chips with title truncated (desktop)
- Color-coded by event type (see Styling section)

**Interactions:**
- Click day cell -> opens day popover (desktop) or navigates to day view (mobile)
- Click event chip -> opens event detail sheet/drawer
- Click "+N more" -> navigates to day view

**URL sync:** `?view=month&date=2026-02-01` -- the `date` param is always the first of the displayed month.

### Week View

**Layout:** 7 columns (Sun-Sat or Mon-Sun based on locale) with a time gutter on the left showing hour labels from 6 AM to 10 PM. Each 1-hour interval has 2 rows (30-min granularity).

**Event rendering:** Events are absolutely positioned within their day column using `top` (start time offset from grid start) and `height` (duration as percentage of grid). Overlapping events are rendered side-by-side with reduced width.

**Instructor-specific features:**
- Availability blocks shown as semi-transparent green overlays behind events
- Drag-to-create: dragging on empty time creates a new event or availability block
- Current time indicator: red line at the current time

**Interactions:**
- Click event block -> opens event detail
- Click empty slot -> opens create event form (instructor/admin only)
- Drag on empty slot -> creates event with start/end from drag coordinates (instructor/admin only)

**URL sync:** `?view=week&date=2026-02-02` -- the `date` param is the Monday (or first day) of the displayed week.

### Day View

**Layout:** Single-column time grid, same structure as week view but wider. Events have more room for details (full title, instructor name, attendee count).

**Interactions:** Same as week view for a single day.

**URL sync:** `?view=day&date=2026-02-06`

### List/Agenda View

**Layout:** Vertical list of events grouped by date. Each group has a date header (e.g., "Thursday, February 6") followed by event cards.

**Event cards show:** Time range, title, event type badge, instructor avatar + name, RSVP count/capacity.

**Mobile optimized:** Default view on screens < 640px. No grid overhead, easy to scroll. Pull-to-refresh for latest events.

**URL sync:** `?view=list&date=2026-02-06` -- shows events starting from the given date.

### View Switching

**URL-driven state:** The current view and date are stored in URL search params via `useSearchParams` + `router.replace`. This enables deep linking and browser back/forward.

**Animated transitions:** CSS transitions on `opacity` and `transform` during view switches. The outgoing view fades out while the incoming view fades in. No heavy animation library needed.

**Default view by breakpoint:**
- Mobile (< 640px): List view
- Tablet (640px - 1023px): Week view
- Desktop (>= 1024px): Month view

The default only applies on initial load. Once a user selects a view, their choice is persisted in localStorage and restored on subsequent visits.

### Date Navigation

- **Previous/Next buttons:** Navigate by the unit of the current view (month/week/day). In list view, shifts by 7 days.
- **Today button:** Snaps to current date in the current view.
- **Date picker:** Mini calendar in sidebar (desktop) or dropdown (mobile) for jumping to any date.

---

## 4. Data Layer

### Core Types

```typescript
// types/calendar.ts

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
  user_rsvp_status: string | null; // 'going' | 'waitlist' | null for current user
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
```

### Custom Hooks

#### useCalendarEvents

Primary data-fetching hook for calendar views. Uses SWR for caching and revalidation.

```typescript
// hooks/useCalendarEvents.ts

import useSWR from 'swr';

interface UseCalendarEventsOptions {
  dateRange: CalendarDateRange;
  eventTypes?: CalendarEventType[];
  instructorId?: string;
}

interface UseCalendarEventsReturn {
  events: CalendarEvent[];
  isLoading: boolean;
  error: Error | null;
  mutate: () => void; // Force revalidation
}

export function useCalendarEvents(options: UseCalendarEventsOptions): UseCalendarEventsReturn {
  const key = buildCacheKey(options);
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });
  return { events: data ?? [], isLoading, error, mutate };
}
```

**Fetcher:** Calls `GET /api/events?start=ISO&end=ISO&types=class,workshop&instructor=UUID`.

**Caching strategy:** SWR caches by the serialized query key. Adjacent date ranges (e.g., prev/next month) are prefetched in the background when the user navigates, so switching views feels instant.

#### useAvailability

Fetches instructor availability for the availability calendar.

```typescript
// hooks/useAvailability.ts

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

export function useAvailability(options: UseAvailabilityOptions): UseAvailabilityReturn;
```

**Fetcher:** Calls existing `GET /api/availability/calendar?instructor_id=UUID&view=weekly|monthly&date=ISO`.

#### useBookings

Fetches booking data for dashboard cards.

```typescript
// hooks/useBookings.ts

// For instructor dashboard
export function usePendingBookings(instructorId: string): {
  bookings: BookingWithDetails[];
  isLoading: boolean;
  mutate: () => void;
};

// For student dashboard
export function useUpcomingBookings(memberId: string): {
  bookings: BookingWithDetails[];
  isLoading: boolean;
  mutate: () => void;
};
```

#### useRealtimeCalendar

Subscribes to Supabase Realtime and invalidates SWR caches when data changes.

```typescript
// hooks/useRealtimeCalendar.ts

interface UseRealtimeCalendarOptions {
  tables: Array<{
    table: string;
    filter?: string;
  }>;
  onUpdate: () => void; // Called when any subscribed table changes
}

export function useRealtimeCalendar(options: UseRealtimeCalendarOptions): void;
```

### Data Fetching Strategy

1. **Initial load:** Server component fetches initial data and passes to client components as props. This gives fast first paint with no loading spinner.
2. **Client hydration:** Client components initialize SWR with the server-fetched data (via `fallbackData`). SWR immediately renders the server data, then revalidates in the background.
3. **Navigation:** When the user changes view or date, SWR fetches the new data. If adjacent data was prefetched, it renders instantly from cache.
4. **Real-time:** Supabase Realtime subscription calls `mutate()` on the relevant SWR cache key, triggering a refetch. This ensures the SWR cache stays consistent.

### Optimistic Updates

**Use optimistic updates for:**
- RSVP to free events (low conflict risk)
- Instructor confirming/declining a booking from the dashboard
- Updating event details (instructor/admin)

**Do NOT use optimistic updates for:**
- Private lesson booking (conflict risk -- must verify server-side with GIST constraint)
- Payment-dependent RSVPs
- Near-capacity class RSVPs (race condition risk)

Implementation uses SWR's `mutate` with `optimisticData`:

```typescript
mutate(
  key,
  async (currentData) => {
    const result = await confirmBooking(bookingId);
    return updateBookingInList(currentData, result);
  },
  {
    optimisticData: (currentData) =>
      updateBookingStatus(currentData, bookingId, 'confirmed'),
    rollbackOnError: true,
  }
);
```

### Prefetching Strategy

When the calendar renders a date range, it also prefetches the adjacent range:
- Month view showing February -> prefetch January and March
- Week view showing Feb 2-8 -> prefetch Jan 26-Feb 1 and Feb 9-15

```typescript
// Prefetch on mount and navigation
useEffect(() => {
  const prevRange = getPreviousRange(currentView, currentDate);
  const nextRange = getNextRange(currentView, currentDate);
  preload(buildCacheKey({ dateRange: prevRange }), fetcher);
  preload(buildCacheKey({ dateRange: nextRange }), fetcher);
}, [currentView, currentDate]);
```

---

## 5. Supabase Realtime Strategy

### Subscribed Tables

| Table | Events | Filter | Consumers |
|-------|--------|--------|-----------|
| `events` | INSERT, UPDATE, DELETE | `start_time` within current view range (where feasible) | All calendar views |
| `event_rsvps` | INSERT, UPDATE | `event_id` in visible events | RSVP counts on calendar, waitlist |
| `private_lesson_bookings` | INSERT, UPDATE | `instructor_id` or `member_id` = current user | Booking calendar, dashboard cards |
| `instructor_availability` | INSERT, UPDATE, DELETE | `instructor_id` = current user (instructors) | Availability calendar |
| `availability_overrides` | INSERT, UPDATE, DELETE | `instructor_id` = current user | Availability calendar |

### Channel Naming

```
calendar:events:{userId}           -- General event updates
calendar:bookings:{userId}         -- Private lesson booking updates
calendar:availability:{instructorId} -- Instructor availability updates
```

### Subscription Lifecycle

```typescript
// useRealtimeCalendar.ts
useEffect(() => {
  const supabase = createClient();
  const channelRef = { current: null };

  const channel = supabase
    .channel(`calendar:events:${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'events',
    }, (payload) => {
      // Use ref to avoid stale closure
      onUpdateRef.current();
    })
    .subscribe();

  channelRef.current = channel;

  return () => {
    // Cleanup on unmount or dependency change
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
  };
}, [userId]); // Recreate channel when user changes
```

**Key patterns:**
- Use `useRef` for the `onUpdate` callback to avoid stale closures
- Use `useRef` for the channel reference to ensure cleanup targets the correct channel
- Tear down and recreate channels when filter criteria change (e.g., switching instructor)
- React strict mode double-mount is handled by cleanup in the effect return

### Real-Time Event Conflicts

When a booking is confirmed by someone else while a student is viewing the same slot:

1. Realtime delivers the `UPDATE` payload with `status: 'confirmed'`
2. `useRealtimeCalendar` triggers SWR `mutate()` to refetch available slots
3. The slot disappears from the available slots list
4. If the student had selected that slot, a toast notification appears: "This slot was just booked. Please select another time."

### Date-Range Filtering

Supabase Realtime filters do not support range queries on `start_time`. Instead:
- Subscribe broadly (all events for a table with user-based filter)
- Filter on the client side: only process `payload.new` records that fall within the current view's date range
- This is acceptable because the data volume is small (~200 events/month max)

---

## 6. Database Changes

### No New Tables Required

All calendar views use existing tables. The redesign is a UI/UX layer change, not a data model change.

### New Index for Calendar Event Queries

```sql
-- Composite index for efficient date-range event queries
CREATE INDEX IF NOT EXISTS idx_events_time_range
  ON events(start_time, end_time)
  WHERE cancelled_at IS NULL AND approval_status = 'approved';

-- Index for efficient RSVP count lookups
CREATE INDEX IF NOT EXISTS idx_event_rsvps_status_count
  ON event_rsvps(event_id, status)
  WHERE status IN ('going', 'pending_payment', 'waitlist');
```

### Migration SQL

```sql
-- Migration: calendar_redesign_indexes
-- Purpose: Add indexes for calendar view performance

BEGIN;

-- Event date range queries (used by all calendar views)
CREATE INDEX IF NOT EXISTS idx_events_time_range
  ON events(start_time, end_time)
  WHERE cancelled_at IS NULL AND approval_status = 'approved';

-- RSVP status counts per event (used by event cards)
CREATE INDEX IF NOT EXISTS idx_event_rsvps_status_count
  ON event_rsvps(event_id, status)
  WHERE status IN ('going', 'pending_payment', 'waitlist');

COMMIT;
```

### RLS Policy Updates

No changes needed. Existing RLS policies already cover all access patterns for the calendar redesign.

---

## 7. API Route Changes

### New Routes

#### GET /api/events

Unified event listing endpoint for all calendar views. Replaces ad-hoc queries scattered across components.

**File:** `app/src/app/api/events/route.ts`

```typescript
// Query parameters
interface EventsQueryParams {
  start: string;        // ISO date, required
  end: string;          // ISO date, required
  types?: string;       // Comma-separated: "class,workshop,private_lesson"
  instructor_id?: string; // Filter by instructor
  include_rsvp?: string;  // "true" to include current user's RSVP status
}

// Response
interface EventsResponse {
  events: CalendarEvent[];
}
```

**Implementation:**
- Queries `events` table with `start_time >= start AND start_time <= end`
- Joins `members` for instructor info
- Subquery for `rsvp_count` and `is_full`
- If `include_rsvp=true`, left joins `event_rsvps` for current user's status
- Filters by `cancelled_at IS NULL AND approval_status = 'approved'`
- Returns max 500 events per request
- Auth: authenticated for full data, unauthenticated for public events only

**Error handling:**
- 400 if `start` or `end` missing or invalid
- 401 if unauthenticated and requesting non-public data
- 500 on database error with logged error detail

#### GET /api/bookings/pending

Pending bookings for instructor dashboard. *Already specified in v2.md.*

**File:** `app/src/app/api/bookings/pending/route.ts`

```typescript
// Response
{
  data: BookingWithDetails[] // status='pending', ordered by created_at DESC, limit 50
}
```

#### GET /api/bookings/upcoming

Upcoming bookings for student dashboard. *Already specified in v2.md.*

**File:** `app/src/app/api/bookings/upcoming/route.ts`

```typescript
// Response
{
  data: BookingWithDetails[] // start_time >= now, ordered by start_time ASC, limit 30
}
```

### Modified Routes

#### GET /api/availability/calendar (existing -- enhance)

**Current:** Returns availability + bookings + overrides for a single instructor.

**Enhancement:** Add `format` query param:
- `format=raw` (default, current behavior): returns raw table rows
- `format=blocks`: returns computed `AvailabilityBlock[]` with availability expanded into concrete time blocks for the view's date range

This avoids duplicating availability expansion logic on the client.

### Unchanged Routes

All existing booking CRUD routes (`/api/bookings/[id]/confirm`, `/cancel`, `/decline`, `/messages`, etc.) and availability CRUD routes (`/api/availability`, `/overrides`) remain unchanged.

---

## 8. Role-Based Behavior

### Calendar View Access

| Feature | guest | member_limited | member_full | instructor | owner |
|---------|-------|---------------|-------------|------------|-------|
| **View public schedule** | Read-only | Read-only | Read-only | Read-only | Read-only |
| **View events calendar** | Public events only | All member-visible events | All member-visible events | All events + own availability | All events + all availability |
| **Month view** | Yes | Yes | Yes | Yes | Yes |
| **Week view** | Yes | Yes | Yes | Yes | Yes |
| **Day view** | Yes | Yes | Yes | Yes | Yes |
| **List view** | Yes | Yes | Yes | Yes | Yes |
| **RSVP to events** | No | Yes | Yes | Yes | Yes |
| **View RSVP count** | No | Yes | Yes | Yes | Yes |
| **View waitlist position** | No | Own only | Own only | All | All |

### Private Lesson Calendar Access

| Feature | guest | member_limited | member_full | instructor | owner |
|---------|-------|---------------|-------------|------------|-------|
| **Browse instructor availability** | No | Yes | Yes | Yes | Yes |
| **Book private lesson** | No | Yes | Yes | With other instructors | Yes |
| **View own bookings on calendar** | N/A | Yes | Yes | Yes (both roles) | All |
| **Confirm/decline bookings** | No | No | No | Own bookings | All |
| **Manage own availability** | N/A | No | No | Yes | Yes (all instructors) |
| **View availability calendar** | N/A | No | No | Own | All instructors |

### Calendar UI Differences by Role

**Guest:**
- Sees public schedule grid (existing `/schedule` page)
- Events calendar shows public events only (studio_social, community approved)
- No RSVP buttons, no booking UI
- CTA: "Log in to book classes and private lessons"

**member_limited / member_full:**
- Full events calendar with RSVP capability
- Private lesson booking calendar with instructor selector
- Dashboard: `StudentBookingsCard` showing upcoming bookings with status badges
- member_full can additionally submit community events

**instructor:**
- Full events calendar + own availability overlay on week/day views
- Private lesson booking calendar (can book with other instructors)
- Availability calendar with weekly grid + monthly overview
- Dashboard: `InstructorPendingBookingsCard` with confirm/decline
- Can create/edit events they are assigned to
- FAB button "+" to add availability or create event

**owner:**
- Everything instructor can do, for all instructors
- Master calendar view: toggle "All Instructors" to see combined availability
- Can create/edit/delete any event
- Dashboard: `InstructorPendingBookingsCard` showing all instructor pending bookings

---

## 9. Instructor Availability Management

### Weekly Recurring Availability

**How it works today (form-based):** Instructors use `InstructorAvailabilityManager` to add/remove weekly time windows via a form (select day, enter start/end time).

**How it will work (calendar-based):** The `WeeklyGridView` in the availability calendar renders a 7-day time grid. Existing recurring availability appears as green blocks. Instructors interact via:

1. **Drag-to-create:** Click and drag on an empty time slot to create a new availability block. The drag start determines the start time, the drag end determines the end time. On release, the `AddAvailabilityDialog` opens with the day and times pre-filled.

2. **Click existing block:** Opens a popover with:
   - Time range display
   - "Edit" button -> opens dialog with editable fields
   - "Delete" button -> confirmation then deletes

3. **Visual feedback during drag:**
   - Ghost overlay follows the cursor during drag
   - Snaps to 30-minute intervals
   - Shows the computed time range as text ("2:00 PM - 5:00 PM")
   - Block turns green when hovering valid area, red when overlapping existing

### Date-Specific Overrides

**Block a date (vacation, sick):**
- In the monthly availability view, click a date -> "Block this date" option
- Or in the weekly grid, right-click (desktop) or long-press (mobile) a day header -> "Block entire day"
- Blocked dates show a red "X" overlay on the monthly view and a strikethrough in the weekly view

**Add extra availability (one-off):**
- In the weekly grid, drag-to-create on a day that normally has no availability
- The system detects there's no recurring rule for that day and creates an `availability_override` with `is_available = true` instead
- Extra availability blocks show with a dashed border to distinguish from recurring blocks

### Save/Update Flow

1. User completes interaction (drag-create, edit dialog, delete)
2. Client calls existing API routes:
   - `POST /api/availability` for new recurring availability
   - `DELETE /api/availability/[id]` to remove (auto-declines affected pending bookings)
   - `POST /api/availability/overrides` for date-specific overrides
   - `DELETE /api/availability/overrides/[id]` to remove override
3. On success: SWR cache invalidated, UI updates immediately
4. On error: toast with error message, no UI change
5. Realtime subscription picks up the change and notifies other clients (e.g., owner viewing all instructors)

---

## 10. Booking Flow

### Student Booking Flow

```
1. Student navigates to /private-sessions
2. Selects instructor from avatar pills (InstructorSelector)
3. Calendar updates to show selected instructor's availability
   - Green dots on dates with available slots
   - Yellow dots on dates with pending bookings (student's own)
   - Blue dots on dates with confirmed bookings (student's own)
4. Student clicks a date with a green dot
5. TimeSlotDrawer (mobile) or TimeSlotSheet (desktop) opens
   - Shows available time slots as cards
   - Slots that overlap with student's pending bookings are grayed out
   - Each slot shows: time range, duration, instructor name
6. Student selects a slot
7. BookingConfirmDialog opens
   - Shows: instructor, date, time, optional notes field
   - "Confirm Booking Request" button
8. Student confirms
   - POST /api/bookings creates pending booking
   - Calendar immediately shows yellow dot (optimistic? No -- we wait for server)
   - Toast: "Booking request sent! You'll be notified when the instructor responds."
9. Student waits for instructor response
10. When instructor confirms:
    - Realtime delivers status change
    - Calendar dot changes from yellow to blue
    - Dashboard card updates status badge
    - Toast (if on page): "Your lesson with Maria on Feb 5 at 2 PM has been confirmed!"
11. When instructor declines:
    - Realtime delivers status change
    - Yellow dot removed from calendar
    - Dashboard card shows "Declined" badge with reason
```

### Confirmation/Decline Workflow

**From Dashboard (InstructorPendingBookingsCard):**

```
1. Instructor sees pending request row:
   [Sarah Martinez] [Thu Feb 5, 2:00-3:00 PM] [Focus on cross-body lead]
   [Confirm] [Decline]                                       [2h ago]

2a. Click [Confirm]:
   - Optimistic update: row moves to "confirmed" section with green badge
   - POST /api/bookings/{id}/confirm
   - On success: toast "Booking confirmed! Sarah will be notified."
   - On error: rollback, show error toast

2b. Click [Decline]:
   - Optional reason dialog appears (shadcn Dialog)
   - Instructor types reason or leaves blank
   - POST /api/bookings/{id}/decline with reason
   - On success: row removed from pending list, toast "Booking declined."
   - On error: show error toast
```

**From Availability Calendar (WeeklyGridView):**
- Pending bookings appear as yellow blocks overlaying the availability blocks
- Click a pending booking block -> opens detail popover with confirm/decline buttons
- Same API calls as dashboard

### Cancellation Policy

- **Student cancelling pending:** Always allowed. No restrictions.
- **Student cancelling confirmed:** Blocked within 24 hours of start time. Error toast: "Cannot cancel within 24 hours. Contact your instructor."
- **Instructor cancelling:** No time restriction. Can cancel any confirmed booking.
- **Owner cancelling:** No time restriction. Can cancel any booking.

### Real-Time Slot Updates

When a slot is booked by someone else while a student is viewing the same time slot list:

1. `useRealtimeCalendar` receives the booking INSERT
2. `mutate()` called on the slots SWR cache key
3. SWR refetches slots from `/api/slots/[instructorId]`
4. The booked slot is no longer returned by `get_available_slots()` (DB function excludes it)
5. If the student had selected that slot (it's highlighted in the drawer):
   - Show toast: "This slot was just booked. Please select another time."
   - Deselect the slot
   - Refresh the slot list

---

## 11. Mobile Design

### Responsive Breakpoints

| Breakpoint | Width | Default View | Layout Behavior |
|------------|-------|-------------|----------------|
| **Mobile** | < 640px | List view | Single column, stacked. Bottom sheet for event details. Swipe navigation. |
| **Tablet portrait** | 640px - 767px | List view | Single column, wider cards. Side sheet starts to appear. |
| **Tablet landscape** | 768px - 1023px | Week view | 7-column grid with compact events. Side sheet for details. |
| **Desktop** | >= 1024px | Month view | Full grid with sidebar (mini calendar + legend). Side sheet for details. |

### Default Views Per Breakpoint

On first visit (no saved preference):
- < 640px: List view (most scannable on narrow screens)
- 640px - 1023px: Week view (fits 7 columns with adequate touch targets)
- >= 1024px: Month view (full calendar with sidebar)

Once the user selects a view, their preference is saved in localStorage and persists across sessions, regardless of breakpoint.

### Touch Interactions

| Gesture | Action | Context |
|---------|--------|---------|
| **Tap event** | Open event detail (drawer on mobile, sheet on desktop) | All views |
| **Swipe left** | Navigate to next period (day/week/month) | Month, Week, Day views |
| **Swipe right** | Navigate to previous period | Month, Week, Day views |
| **Long press event** | Enter drag mode (instructors only) | Week, Day views |
| **Long press empty slot** | Open "Create Event" dialog (instructors only) | Week, Day views |
| **Pull down** | Refresh calendar data | List view |
| **Tap day number** | Navigate to day view | Month view |

### Touch Target Sizes

All interactive elements meet the 44x44px minimum (Apple HIG / WCAG 2.5.8):
- Event chips in month view: min-height 44px, full cell width
- Time slots in booking drawer: min-height 48px
- Confirm/Decline buttons on dashboard: 44px height, adequate padding
- View switcher tabs: 44px height
- Navigation arrows: 44x44px

### Mobile-Specific Components

**Event Detail Drawer (< 768px):**
- Uses shadcn `Drawer` (Vaul) instead of `Sheet`
- Snap points:
  - **Peek (30%):** Event title, time, type badge
  - **Half (50%):** Full details including instructor, location, RSVP count
  - **Full (90%):** RSVP form, attendee list, event description
- Dismiss via swipe-down or backdrop tap

**Mobile Calendar Header:**
- Compact layout: view switcher and date nav stack vertically
- Date displayed as abbreviated month + year ("Feb 2026")
- Prev/Next arrows are larger (48x48px) for easier tapping

**Instructor Availability (Mobile):**
- Weekly grid on mobile shows single-day view
- Day selector as horizontal swipeable strip at top
- Swipe left/right to change day
- Drag-to-create replaced with tap-to-select: tap start time, tap end time, dialog opens

---

## 12. Styling Specification

### Color Palette

All colors from the existing Fiery Motion design system defined in `globals.css`:

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` / `--red` | `#ef4444` | Primary actions, active states, current time indicator |
| `--primary-light` / `--orange` | `#f59e0b` | Secondary actions, hover states, pending booking indicators |
| `--background` | `#0f0f0f` | Page background |
| `--dark-2` / `--card` | `#1a1a1a` | Card backgrounds, calendar cells |
| `--dark-3` / `--accent` | `#222222` | Hover states, today highlight |
| `--dark-4` / `--muted` | `#2a2a2a` | Muted backgrounds, disabled states |
| `--foreground` | `#ffffff` | Primary text |
| `--text-light` | `rgba(255,255,255,0.75)` | Secondary text |
| `--text-muted` | `#777777` | Muted text, time labels |
| `--border` | `rgba(255,255,255,0.06)` | Grid lines, card borders |
| `--gradient` | `linear-gradient(135deg, #ef4444, #f59e0b)` | Gradient accents, badges |

### Event Type Color Coding

| Event Type | Background | Text | Border |
|------------|-----------|------|--------|
| **class** | `rgba(239, 68, 68, 0.15)` | `#ef4444` | `#ef4444` |
| **workshop** | `rgba(245, 158, 11, 0.15)` | `#f59e0b` | `#f59e0b` |
| **bootcamp** | `rgba(249, 115, 22, 0.15)` | `#f97316` | `#f97316` |
| **studio_social** | `rgba(168, 85, 247, 0.15)` | `#a855f7` | `#a855f7` |
| **community** | `rgba(34, 197, 94, 0.15)` | `#22c55e` | `#22c55e` |
| **private_lesson** | `rgba(59, 130, 246, 0.15)` | `#3b82f6` | `#3b82f6` |

These use low-opacity backgrounds on the dark theme so events pop without clashing with the dark card backgrounds.

### Booking Status Colors

| Status | Badge Background | Badge Text |
|--------|-----------------|-----------|
| **pending** | `rgba(245, 158, 11, 0.2)` | `#f59e0b` |
| **confirmed** | `rgba(34, 197, 94, 0.2)` | `#22c55e` |
| **declined** | `rgba(239, 68, 68, 0.2)` | `#ef4444` |
| **expired** | `rgba(119, 119, 119, 0.2)` | `#777777` |
| **cancelled** | `rgba(119, 119, 119, 0.2)` | `#777777` |

### Availability Block Colors

| State | Background | Border |
|-------|-----------|--------|
| **Available (recurring)** | `rgba(34, 197, 94, 0.12)` | `#22c55e` (solid) |
| **Available (one-off override)** | `rgba(34, 197, 94, 0.12)` | `#22c55e` (dashed) |
| **Blocked (override)** | `rgba(239, 68, 68, 0.08)` | none |
| **Pending booking** | `rgba(245, 158, 11, 0.15)` | `#f59e0b` |
| **Confirmed booking** | `rgba(59, 130, 246, 0.15)` | `#3b82f6` |

### shadcn/ui Components Used

| Component | Usage |
|-----------|-------|
| `Card` | Calendar wrapper, dashboard cards, event detail |
| `Dialog` | Add availability, decline reason, booking confirm |
| `Sheet` | Event detail (desktop), booking detail |
| `Drawer` | Event detail (mobile), time slot selection (mobile) |
| `Badge` | Event type labels, booking status |
| `Button` | Actions, navigation, view switching |
| `Tabs` | View switcher (month/week/day/list) |
| `Avatar` | Instructor photos in event cards and selector |
| `Skeleton` | Loading states for calendar grid and cards |
| `ScrollArea` | Horizontal scroll for instructor selector, vertical for event lists |
| `Select` | Instructor filter dropdown |
| `Calendar` (DayPicker) | Mini calendar in sidebar, month picker |
| `Toggle` / `ToggleGroup` | Instructor selector pills |
| `Input` | Search, notes fields |

### Animation/Transition Specs

| Transition | Duration | Easing | Property |
|------------|----------|--------|----------|
| View switch (month/week/day) | 200ms | `ease-out` | `opacity`, `transform` |
| Event hover | 150ms | `ease` | `background-color`, `border-color` |
| Drawer open/close | 300ms | `spring` | Handled by Vaul |
| Sheet open/close | 200ms | `ease-out` | Handled by shadcn |
| Skeleton pulse | 1.5s | `ease-in-out` | `opacity` (infinite) |
| Calendar glow (unread) | 2s | `ease-in-out` | `box-shadow` (infinite, existing) |
| Current time indicator | none | none | Static red line |
| Drag overlay | real-time | none | `transform` (follows cursor) |

### Dark Mode

The site is dark-only (no light mode toggle). All colors above are designed for the dark theme. The `--background: #0f0f0f` base ensures sufficient contrast for all text and interactive elements.

---

## 13. File Structure

### New Files

```
app/src/
├── types/
│   └── calendar.ts                              -- CalendarEvent, CalendarViewType, AvailabilityBlock types
│
├── hooks/
│   ├── useCalendarEvents.ts                     -- SWR hook for event data
│   ├── useAvailability.ts                       -- SWR hook for availability data
│   ├── useBookings.ts                           -- SWR hooks: usePendingBookings, useUpcomingBookings
│   └── useRealtimeCalendar.ts                   -- Supabase Realtime subscription + SWR invalidation
│
├── components/
│   ├── calendar/
│   │   ├── CalendarShell.tsx                    -- Layout wrapper (header + body + sidebar)
│   │   ├── CalendarHeader.tsx                   -- View switcher, date nav, actions
│   │   ├── CalendarLegend.tsx                   -- Color-coded legend
│   │   ├── TimeGrid.tsx                         -- Shared time grid primitive (hour gutter + columns)
│   │   ├── CurrentTimeIndicator.tsx             -- Red line at current time
│   │   ├── EventBlock.tsx                       -- Positioned event in time grid
│   │   ├── EventChip.tsx                        -- Compact event in month cell
│   │   ├── EventDetailSheet.tsx                 -- Event detail sidebar (desktop)
│   │   ├── EventDetailDrawer.tsx                -- Event detail bottom sheet (mobile)
│   │   └── views/
│   │       ├── MonthView.tsx                    -- Month grid view
│   │       ├── WeekView.tsx                     -- Week time grid view
│   │       ├── DayView.tsx                      -- Day time grid view
│   │       └── ListView.tsx                     -- Chronological list view
│   │
│   └── booking/
│       └── BookingStatusBadge.tsx               -- Reusable status badge
│
├── app/
│   ├── api/
│   │   ├── events/
│   │   │   └── route.ts                        -- GET /api/events (unified event listing)
│   │   └── bookings/
│   │       ├── pending/
│   │       │   └── route.ts                    -- GET /api/bookings/pending
│   │       └── upcoming/
│   │           └── route.ts                    -- GET /api/bookings/upcoming
│   │
│   └── (site)/
│       ├── calendar/
│       │   └── page.tsx                        -- Events calendar page (Server Component)
│       └── dashboard/
│           ├── InstructorPendingBookingsCard.tsx
│           └── StudentBookingsCard.tsx
```

### Modified Files

```
app/src/
├── app/
│   └── (site)/
│       ├── dashboard/
│       │   └── page.tsx                         -- Add conditional booking card rendering
│       ├── private-sessions/
│       │   ├── MonthCalendar.tsx                -- Add pending booking indicators (yellow dots)
│       │   ├── InstructorAvailabilityManager.tsx -- Add "View Calendar" button
│       │   ├── availability-calendar/
│       │   │   ├── WeeklyGridView.tsx           -- Replace with @dnd-kit drag-to-create
│       │   │   ├── MonthlyAvailabilityView.tsx  -- Add booking overlay colors
│       │   │   └── AvailabilityCalendar.tsx     -- Integrate SWR + Realtime
│       │   └── hooks/
│       │       └── useCalendarRealtime.ts       -- Extend for availability changes
│       └── schedule/
│           └── page.tsx                         -- Add link to dynamic events calendar
│
├── types/
│   └── booking.ts                               -- Export shared types used by new hooks
│
└── app/api/
    └── availability/
        └── calendar/
            └── route.ts                         -- Add format=blocks query param
```

### Files to Delete/Replace

None. All changes are additive or modify existing files. No files are deleted as part of this redesign.

---

## 14. Implementation Order

### Phase A: Foundation (Complexity: M)

Build the shared primitives and data layer that all calendar views depend on.

| Step | Task | Files | Depends On | Complexity |
|------|------|-------|------------|------------|
| A1 | Define calendar types | `types/calendar.ts` | -- | S |
| A2 | Install new dependencies | `package.json` | -- | S |
| A3 | Create `useCalendarEvents` hook | `hooks/useCalendarEvents.ts` | A1 | S |
| A4 | Create `GET /api/events` endpoint | `api/events/route.ts` | A1 | M |
| A5 | Create `useRealtimeCalendar` hook | `hooks/useRealtimeCalendar.ts` | A3 | M |
| A6 | Create `BookingStatusBadge` | `components/booking/BookingStatusBadge.tsx` | A1 | S |
| A7 | Create `CalendarLegend` | `components/calendar/CalendarLegend.tsx` | -- | S |
| A8 | Create `TimeGrid` shared primitive | `components/calendar/TimeGrid.tsx` | -- | M |
| A9 | Create `CurrentTimeIndicator` | `components/calendar/CurrentTimeIndicator.tsx` | -- | S |
| A10 | Create `EventBlock` and `EventChip` | `components/calendar/EventBlock.tsx`, `EventChip.tsx` | A1 | S |
| A11 | Database migration (indexes) | SQL migration | -- | S |

### Phase B: Calendar Views (Complexity: L)

Build the four calendar views using the Phase A primitives.

| Step | Task | Files | Depends On | Complexity |
|------|------|-------|------------|------------|
| B1 | Build `MonthView` | `components/calendar/views/MonthView.tsx` | A8, A10 | M |
| B2 | Build `WeekView` | `components/calendar/views/WeekView.tsx` | A8, A9, A10 | L |
| B3 | Build `DayView` | `components/calendar/views/DayView.tsx` | A8, A9, A10 | M |
| B4 | Build `ListView` | `components/calendar/views/ListView.tsx` | A10 | S |
| B5 | Build `CalendarHeader` | `components/calendar/CalendarHeader.tsx` | -- | S |
| B6 | Build `CalendarShell` (view switching + routing) | `components/calendar/CalendarShell.tsx` | B1-B5 | M |
| B7 | Build event detail components | `EventDetailSheet.tsx`, `EventDetailDrawer.tsx` | A1 | M |
| B8 | Build `/calendar` page | `app/(site)/calendar/page.tsx` | B6, B7, A3, A5 | M |

### Phase C: Instructor Availability (Complexity: L)

Enhance the existing availability calendar with drag-to-create and visual improvements.

| Step | Task | Files | Depends On | Complexity |
|------|------|-------|------------|------------|
| C1 | Create `useAvailability` hook | `hooks/useAvailability.ts` | A5 | S |
| C2 | Enhance `WeeklyGridView` with @dnd-kit | `availability-calendar/WeeklyGridView.tsx` | A8, C1 | L |
| C3 | Enhance `MonthlyAvailabilityView` | `availability-calendar/MonthlyAvailabilityView.tsx` | B1, C1 | M |
| C4 | Integrate Realtime into `AvailabilityCalendar` | `AvailabilityCalendar.tsx` | C1, A5 | M |
| C5 | Add "View Calendar" button to `InstructorAvailabilityManager` | `InstructorAvailabilityManager.tsx` | -- | S |
| C6 | Enhance `/api/availability/calendar` with `format=blocks` | `api/availability/calendar/route.ts` | -- | S |

### Phase D: Dashboard Cards (Complexity: M)

Build the role-specific dashboard booking cards.

| Step | Task | Files | Depends On | Complexity |
|------|------|-------|------------|------------|
| D1 | Create `usePendingBookings` and `useUpcomingBookings` hooks | `hooks/useBookings.ts` | A5 | S |
| D2 | Create `GET /api/bookings/pending` route | `api/bookings/pending/route.ts` | -- | S |
| D3 | Create `GET /api/bookings/upcoming` route | `api/bookings/upcoming/route.ts` | -- | S |
| D4 | Build `InstructorPendingBookingsCard` | `dashboard/InstructorPendingBookingsCard.tsx` | A6, D1, D2 | M |
| D5 | Build `StudentBookingsCard` | `dashboard/StudentBookingsCard.tsx` | A6, D1, D3 | M |
| D6 | Update dashboard page with conditional rendering | `dashboard/page.tsx` | D4, D5 | S |

### Phase E: Booking Enhancements (Complexity: M)

Enhance the student booking calendar with status indicators and real-time slot updates.

| Step | Task | Files | Depends On | Complexity |
|------|------|-------|------------|------------|
| E1 | Add pending booking indicators to `MonthCalendar` | `private-sessions/MonthCalendar.tsx` | A6 | S |
| E2 | Add real-time slot conflict detection | `private-sessions/hooks/useCalendarRealtime.ts` | A5 | M |
| E3 | Add link from `/schedule` to events calendar | `schedule/page.tsx` | B8 | S |

### Phase F: Polish & Testing (Complexity: M)

| Step | Task | Depends On | Complexity |
|------|------|------------|------------|
| F1 | Mobile responsive testing and fixes | All phases | M |
| F2 | Touch gesture testing (swipe, drag, long-press) | B2, C2 | M |
| F3 | Accessibility audit (keyboard nav, screen readers, ARIA) | All phases | M |
| F4 | Performance profiling (render counts, bundle analysis) | All phases | S |
| F5 | E2E testing of booking flows with Realtime | D4, D5, E1, E2 | M |

### Recommended Build Order

```
A1-A2 -> A3-A11 (parallel) -> B1-B4 (parallel) -> B5-B8 -> C1-C6 -> D1-D6 -> E1-E3 -> F1-F5
```

Phases A and B are the critical path. Phases C, D, and E can overlap once the shared primitives exist. Phase F runs last.

### Complexity Legend

- **S (Small):** 1-2 hours. Single file, straightforward logic.
- **M (Medium):** 2-4 hours. Multiple concerns, some complexity.
- **L (Large):** 4-8 hours. Complex interactions, multiple edge cases, significant testing.

---

## Appendix: Key Decisions Summary

| Decision | Choice | Why |
|----------|--------|-----|
| Calendar library | Custom shadcn/ui | Native fit, lighter bundle, full control |
| DnD library | @dnd-kit | Touch-native, accessible, lightweight |
| Data fetching | SWR | Simpler than React Query, adequate for our scale |
| State in URL | Search params via `useSearchParams` | Deep linking, back/forward, shareable |
| Real-time approach | Supabase postgres_changes + SWR mutate | Already in stack, minimal new code |
| Time grid | Shared `TimeGrid` primitive | Reused by WeekView, DayView, WeeklyGridView |
| Mobile event detail | Drawer (Vaul) with snap points | Native gesture feel, already installed |
| Optimistic updates | Only for low-conflict actions | Prevent stale UI for bookings with GIST constraints |
| View default | Breakpoint-dependent, localStorage-persisted | Best experience per device, respects preference |

---

*Document Status: Complete*
*Author: Designer Agent*
*Date: 2026-02-06*
