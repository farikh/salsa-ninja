# Private Lesson Scheduling & Booking System — Design v2.0

> **Status:** Complete Design (7 phases)
> **Date:** 2026-02-06
> **Addresses:** REQ-001 through REQ-006
> **Related:** [Original Design](./private-lesson-booking.md) | [Database Schema](../database-schema.md) | [Auth & Roles](../auth-and-roles.md)

---

## Table of Contents

1. [Phase 1: Discovery](#phase-1-discovery)
2. [Phase 2: User Stories](#phase-2-user-stories)
3. [Phase 3: UI/UX Design](#phase-3-uiux-design)
4. [Phase 4: Technical Design](#phase-4-technical-design)
5. [Phase 5: API Contracts](#phase-5-api-contracts)
6. [Phase 6: Edge Cases](#phase-6-edge-cases)
7. [Phase 7: Acceptance Criteria](#phase-7-acceptance-criteria)

---

## Phase 1: Discovery

### 1.1 Existing System Analysis

**Database Tables (Already Implemented):**
- `instructor_availability` — Weekly recurring time windows with day_of_week, start_time, end_time, slot_duration_minutes
- `availability_overrides` — Date-specific blocks or extra availability
- `private_lesson_bookings` — Individual bookings with status enum, GIST exclusion constraint to prevent double-booking
- `booking_messages` — Per-booking message thread
- `booking_message_reads` — Unread tracking per member per booking

**Database Functions (Already Implemented):**
- `get_available_slots()` — Generates concrete time slots from availability rules, filters out confirmed bookings
- `create_booking()` — SECURITY DEFINER function that validates and creates pending bookings
- `confirm_booking()` — Atomic confirmation with auto-decline of competing requests
- `cancel_booking()` — Enforces 24-hour cancellation rule for members
- `decline_booking()` — Instructor or owner declines pending request

**API Routes (Already Implemented):**
- `GET/POST /api/bookings` — Fetch bookings, create booking via RPC
- `POST /api/bookings/:id/confirm` — Confirm booking
- `POST /api/bookings/:id/decline` — Decline booking
- `POST /api/bookings/:id/cancel` — Cancel booking
- `GET/POST /api/bookings/:id/messages` — Fetch/send booking messages
- `GET /api/bookings/unread` — Fetch unread message summary
- `GET /api/slots/:instructorId` — Fetch available slots
- `GET/POST/DELETE /api/availability` — Manage instructor availability
- `GET/POST/DELETE /api/availability/overrides` — Manage date-specific overrides

**UI Components (Already Implemented):**
- `CalendarView.tsx` — Main orchestration component with useReducer state management
- `InstructorSelector.tsx` — Instructor toggle pills
- `MonthCalendar.tsx` — Month grid using shadcn Calendar
- `TimeSlotPanel.tsx` / `TimeSlotDrawer.tsx` / `TimeSlotSheet.tsx` — Slot selection UI
- `BookingDetailSheet.tsx` — Booking detail + message thread
- `BookingConfirmDialog.tsx` — Confirmation modal for booking requests
- `MessageBanner.tsx` — Unread message preview banner
- `InstructorAvailabilityManager.tsx` — Weekly availability management UI

**Realtime (Already Implemented):**
- `useCalendarRealtime.ts` — Supabase Realtime subscriptions for bookings and messages
- Single channel per instructor with multiple listeners
- Auto-reconnect and refetch on connection restore

**Auth & Roles (Multi-Role System):**
- `member_roles` junction table allows multiple roles per member
- Functions: `is_admin()`, `is_instructor()`, `is_staff()`, `has_role()`
- `member_profiles` view includes `all_roles` array

### 1.2 Problem Statement

**Who is affected:**
- **Instructors:** Need weekly calendar views to set availability, monthly views to see all bookings, and a dashboard to manage pending requests
- **Students (Full/Limited Members):** Need monthly calendar views to browse availability across instructors, clear booking status visibility, and ability to message instructors
- **Owner:** Needs visibility into all instructor schedules and bookings

**What problem they face:**
- Current system is fully functional but lacks the comprehensive calendar views specified in REQ-001/002
- No dedicated instructor dashboard for managing pending bookings (REQ-005)
- No dedicated student dashboard showing booking status (REQ-006)
- Monthly calendar view exists but weekly view for instructor availability management is missing (REQ-001)
- Month paging exists but the distinction between "open slots" and "all availability" for students vs. instructors needs clarification (REQ-002)

**Impact:**
- Instructors must navigate back to the availability manager instead of seeing a weekly calendar
- Students see a functional calendar but lack a centralized view of their booking statuses
- Pending bookings are visible but not in a dedicated "requests dashboard"

**Success:**
- **REQ-001:** Instructors can view and manage availability in weekly OR monthly calendar view with recurring/one-time slot creation
- **REQ-002:** Students see monthly calendar with clear open slot indicators, can page through months, filters to show only bookable times
- **REQ-003:** Booking confirmation workflow clearly shows pending → confirmed/rejected, with visual blocking of pending slots
- **REQ-004:** Student-instructor messaging is fully functional (already implemented), ensure UI clarity
- **REQ-005:** Instructor dashboard shows all pending bookings with one-click confirm/reject
- **REQ-006:** Student dashboard shows booking status for all upcoming bookings with status badges

---

## Phase 2: User Stories

### Must Have (Priority 1)

| ID | Role | Story | Benefit | REQ |
|----|------|-------|---------|-----|
| U1 | Instructor | I want to view my availability in a weekly calendar format | So I can see my teaching hours at a glance | REQ-001 |
| U2 | Instructor | I want to view my bookings in a monthly calendar format | So I can see my full monthly schedule | REQ-001 |
| U3 | Instructor | I want to toggle between weekly and monthly calendar views | So I can manage schedule at different granularities | REQ-001 |
| U4 | Instructor | I want to see pending booking requests on a dedicated dashboard | So I can quickly approve or decline them | REQ-005 |
| U5 | Instructor | I want to confirm or reject a booking with one click from the dashboard | So I can manage requests efficiently | REQ-005 |
| U6 | Member | I want to see a monthly calendar showing only open (bookable) slots | So I can find available times without clutter | REQ-002 |
| U7 | Member | I want to page through months in the booking calendar | So I can book lessons weeks ahead | REQ-002 |
| U8 | Member | I want to see a dashboard showing all my bookings with status badges | So I know which are pending, confirmed, or rejected | REQ-006 |
| U9 | Member | I want to see pending bookings marked as "blocked" on the calendar | So I know which slots are awaiting confirmation | REQ-003 |
| U10 | Both | I want the booking status to update in real-time when confirmed or rejected | So I get immediate feedback | REQ-003 |

### Should Have (Priority 2)

| ID | Role | Story | Benefit | REQ |
|----|------|-------|---------|-----|
| S1 | Instructor | I want to see a count of pending bookings on the dashboard card | So I know how many requests need attention | REQ-005 |
| S2 | Instructor | I want to filter my calendar view to show only confirmed bookings | So I can see my committed schedule | REQ-001 |
| S3 | Member | I want to filter the booking calendar by instructor | So I can focus on one instructor's availability | REQ-002 |
| S4 | Member | I want to see a visual distinction between "open slots" and "my bookings" on the calendar | So I can quickly identify my scheduled lessons | REQ-002 |
| S5 | Owner | I want to see all instructors' bookings on a master calendar view | So I have full studio visibility | REQ-001 |

### Could Have (Priority 3)

| ID | Role | Story | Benefit | REQ |
|----|------|-------|---------|-----|
| C1 | Instructor | I want to bulk-approve or bulk-decline pending requests | So I can process multiple requests quickly | REQ-005 |
| C2 | Member | I want to export my booking schedule to iCal | So I can sync with my personal calendar | REQ-006 |
| C3 | Instructor | I want to view booking statistics (total hours taught, revenue) | So I can track my performance | REQ-001 |

### Won't Have (This Time)

- Google Calendar sync
- Email notifications for bookings (in-app only)
- Recurring lesson packages
- Payment processing for bookings (Stripe integration is future phase)
- Waitlist for fully booked times

---

## Phase 3: UI/UX Design

### 3.1 User Flows

#### Instructor Availability Management Flow (REQ-001)

```
Private Sessions page (logged in as instructor)
  → See "Your Availability" card with weekly availability list
  → Click "View Calendar" button
  → Availability Calendar View opens (new modal or route)
    → Toggle: [Weekly View] | Monthly View
    → Weekly View: 7-day grid showing recurring availability blocks
      → Click empty time slot → "Add Availability" dialog
      → Click existing block → Edit/Delete options
    → Monthly View: Full month with all availability + bookings overlaid
      → Color-coded: Green = available, Yellow = pending, Red = confirmed
  → Return to main private sessions page
```

#### Instructor Pending Bookings Dashboard (REQ-005)

```
Dashboard page (logged in as instructor)
  → See "Pending Booking Requests" card
    → Shows count badge: "3 pending"
    → List view of pending requests:
      [Member Name] — [Date & Time] — [Confirm] [Decline]
  → Click [Confirm] → Booking confirmed, updates in real-time
  → Click [Decline] → Optional reason dialog → Booking declined
  → Pending count updates to "2 pending"
```

#### Student Booking Calendar Flow (REQ-002, REQ-003)

```
Private Sessions page (logged in as member)
  → See Instructor Selector pills (existing)
  → See Monthly Calendar showing:
    - Green dots = available slots for selected instructor
    - Yellow dots = my pending bookings (awaiting confirmation)
    - Blue dots = my confirmed bookings
  → Click << or >> to page through months
  → Click date with green dot → Time Slot Drawer opens (existing)
  → Select slot → Booking Confirmation Dialog (existing)
  → Confirm → Booking created as pending
  → Slot immediately shows yellow dot (pending)
  → Instructor confirms → Slot updates to blue dot (confirmed) in real-time
```

#### Student Bookings Dashboard (REQ-006)

```
Dashboard page (logged in as member)
  → See "My Bookings" card
    → Shows upcoming bookings as list:
      [Date] [Time] [Instructor] [Status Badge]
      Thu Feb 5, 2pm — Maria — [Pending]
      Mon Feb 9, 3pm — Carlos — [Confirmed]
      Wed Feb 12, 4pm — Maria — [Declined]
  → Click booking → BookingDetailSheet opens (existing)
  → See message thread, cancel button, booking details
```

### 3.2 Wireframes

#### Instructor Availability Calendar (Weekly View) — NEW

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Back to Private Sessions        Your Availability Calendar        │
│                                                                      │
│ View: ● Weekly View   ○ Monthly View                   [+ Add Hours]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Week of Feb 2 - Feb 8, 2026               << This Week >>          │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐                │
│  │ Sun  │ Mon  │ Tue  │ Wed  │ Thu  │ Fri  │ Sat  │                │
│  │  2   │  3   │  4   │  5   │  6   │  7   │  8   │                │
│  ├──────┼──────┼──────┼──────┼──────┼──────┼──────┤                │
│  │      │      │┌────┐│      │┌────┐│      │      │   6am          │
│  │      │      ││    ││      ││    ││      │      │                │
│  │      │      │└────┘│      │└────┘│      │      │   9am          │
│  │      │      │      │      │      │      │      │                │
│  │      │      │      │      │      │      │      │   12pm         │
│  │      │      │┌────┐│      │┌────┐│      │      │                │
│  │      │      ││ 2pm││      ││ 2pm││      │      │   2pm          │
│  │      │      ││  to ││      ││  to ││      │      │                │
│  │      │      ││ 6pm││      ││ 6pm││      │      │   4pm          │
│  │      │      │└────┘│      │└────┘│      │      │                │
│  │      │      │      │      │      │      │      │   6pm          │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘                │
│                                                                      │
│  Legend:                                                             │
│  ■ Available (recurring)   ■ Pending booking   ■ Confirmed booking  │
└─────────────────────────────────────────────────────────────────────┘
```

#### Instructor Availability Calendar (Monthly View) — NEW

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Back to Private Sessions        Your Availability Calendar        │
│                                                                      │
│ View: ○ Weekly View   ● Monthly View                   [+ Add Hours]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                        << February 2026 >>                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Sun  Mon  Tue  Wed  Thu  Fri  Sat                             │   │
│  │                          1                                    │   │
│  │  2    3    4●   5●   6●   7    8                             │   │
│  │  9   10   11●  12●  13●  14   15                             │   │
│  │ 16   17   18●  19●  20●  21   22                             │   │
│  │ 23   24   25●  26●  27●  28   29                             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ● = Has availability (recurring or override)                       │
│  Hover over date to see time blocks + bookings                      │
│  Click date to see detailed day view                                 │
└─────────────────────────────────────────────────────────────────────┘
```

#### Instructor Dashboard — Pending Bookings Card (NEW for REQ-005)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Dashboard > Quick Actions                                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 📅 Pending Booking Requests                              [3] │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ Sarah Martinez — Thu Feb 5, 2:00 - 3:00 PM                   │   │
│  │ "Focus on cross-body lead"                                    │   │
│  │              [✓ Confirm]  [✕ Decline]          Requested 2h ago│   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ Michael Chen — Fri Feb 6, 4:00 - 5:00 PM                     │   │
│  │ No message                                                     │   │
│  │              [✓ Confirm]  [✕ Decline]         Requested 5h ago│   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ Emily Rodriguez — Mon Feb 9, 3:00 - 4:00 PM                  │   │
│  │ "Preparing for showcase"                                      │   │
│  │              [✓ Confirm]  [✕ Decline]         Requested 1d ago│   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  [View All Bookings →]                                              │
└─────────────────────────────────────────────────────────────────────┘
```

#### Student Dashboard — My Bookings Card (NEW for REQ-006)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Dashboard > My Bookings                                              │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 📅 Upcoming Private Lessons                              [2] │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ Thu Feb 5, 2:00 PM — Maria                   ● Pending       │   │
│  │ Awaiting instructor confirmation                 [View]       │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ Mon Feb 9, 3:00 PM — Carlos                  ✓ Confirmed     │   │
│  │ Cross-body styling focus                         [View]       │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ Wed Feb 12, 4:00 PM — Maria                  ✕ Declined      │   │
│  │ "I'm unavailable that day, sorry!"              [Rebook]     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  [Book New Lesson →]                                                │
└─────────────────────────────────────────────────────────────────────┘
```

#### Student Booking Calendar — Updated with Status Indicators (REQ-002, REQ-003)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Private Lessons > Book a Session                                     │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                            │
│  │  [Ava]   │ │  [Ava]   │ │  [Ava]   │  ← Instructor selector     │
│  │  Maria   │ │  Carlos  │ │ Jennifer │                             │
│  └──────────┘ └──────────┘ └──────────┘                            │
│                                                                      │
│  ┌─────────────────────────────┐                                    │
│  │      << February 2026 >>    │                                    │
│  │  Mon  Tue  Wed  Thu  Fri    │                                    │
│  │   2    3●   4    5●▲  6     │                                    │
│  │   9▲  10●  11   12●  13     │                                    │
│  │  16   17●  18   19●  20     │                                    │
│  │  23   24●  25   26●  27     │                                    │
│  │                              │                                    │
│  │  ● = Available to book       │                                    │
│  │  ▲ = My pending booking      │                                    │
│  │  ◆ = My confirmed booking    │                                    │
│  └─────────────────────────────┘                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Component Inventory

**New Components:**

| Component | Source | Role | REQ |
|-----------|--------|------|-----|
| AvailabilityCalendar | New | Weekly/monthly calendar view for instructor availability management | REQ-001 |
| WeeklyGridView | New | 7-day grid showing time blocks | REQ-001 |
| MonthlyAvailabilityView | New | Monthly view with availability overlay | REQ-001 |
| InstructorPendingBookingsCard | New | Dashboard card showing pending booking requests with confirm/decline actions | REQ-005 |
| StudentBookingsCard | New | Dashboard card showing all bookings with status badges | REQ-006 |
| BookingStatusBadge | New | Reusable status badge component (Pending, Confirmed, Declined, etc.) | REQ-003, REQ-006 |
| CalendarLegend | New | Shows color-coded legend for calendar views | REQ-002 |

**Updated Components:**

| Component | Update | REQ |
|-----------|--------|-----|
| MonthCalendar | Add visual modifiers for pending bookings (yellow indicator) | REQ-003 |
| DashboardPage | Add InstructorPendingBookingsCard and StudentBookingsCard | REQ-005, REQ-006 |
| InstructorAvailabilityManager | Add "View Calendar" button to open AvailabilityCalendar | REQ-001 |

**Reused Components (No Changes):**

| Component | Usage |
|-----------|-------|
| TimeSlotPanel / TimeSlotDrawer / TimeSlotSheet | Existing slot selection UI |
| BookingDetailSheet | Existing booking detail + message thread |
| BookingConfirmDialog | Existing confirmation dialog |
| MessageBanner | Existing unread message banner |
| InstructorSelector | Existing instructor toggle pills |

### 3.4 Interaction Design

| Interaction | Behavior | REQ |
|-------------|----------|-----|
| Instructor clicks "View Calendar" in availability manager | Opens AvailabilityCalendar modal or navigates to new route `/private-sessions/availability-calendar` | REQ-001 |
| Toggle Weekly/Monthly view in AvailabilityCalendar | Switches between WeeklyGridView and MonthlyAvailabilityView, preserves selected date | REQ-001 |
| Click empty slot in Weekly Grid | Opens "Add Availability" dialog with day/time pre-filled | REQ-001 |
| Click existing availability block | Shows popover with Edit/Delete options | REQ-001 |
| Click [Confirm] on pending booking in dashboard | Calls confirm_booking() RPC, updates booking status to confirmed, auto-declines competing requests, shows success toast | REQ-005 |
| Click [Decline] on pending booking in dashboard | Opens optional reason dialog, calls decline_booking() RPC, frees slot, shows success toast | REQ-005 |
| Student views monthly calendar with pending booking | Sees yellow triangle indicator on date, slot list shows "Pending" badge, cannot book overlapping slots | REQ-003 |
| Instructor confirms booking while student views calendar | Student sees slot change from yellow (pending) to blue (confirmed) in real-time via Supabase Realtime | REQ-003 |
| Student clicks "View" on booking in dashboard card | Opens BookingDetailSheet with full booking info + message thread | REQ-006 |
| Student pages through months on booking calendar | Fetches slots for new month, updates calendar, preserves instructor selection | REQ-002 |

### 3.5 States and Feedback

**Calendar Loading States:**
- Skeleton loader for calendar while fetching availability/bookings
- Empty state: "No availability set" for instructors, "No available slots" for students

**Dashboard Loading States:**
- Skeleton cards for pending bookings and student bookings while fetching

**Booking Status Badges (REQ-003, REQ-006):**
- **Pending:** Yellow badge, text "Pending", tooltip "Awaiting instructor confirmation"
- **Confirmed:** Green badge, text "Confirmed", tooltip "Lesson confirmed"
- **Declined:** Red badge, text "Declined", tooltip "Instructor declined this request"
- **Expired:** Gray badge, text "Expired", tooltip "Request expired after 4 hours"
- **Cancelled:** Gray badge, text "Cancelled", tooltip shows cancellation reason

**Success/Error Toasts:**
- Confirm booking: "Booking confirmed! Sarah will receive a notification."
- Decline booking: "Booking declined. Slot is now available again."
- Add availability: "Availability added for Tuesdays 2-6pm"
- Error: "Failed to confirm booking: Time slot already taken"

---

## Phase 4: Technical Design

### 4.1 Architecture Decisions

| Decision | Choice | Rationale | REQ |
|----------|--------|-----------|-----|
| Weekly calendar view rendering | Client Component with custom 7-day grid | shadcn Calendar is optimized for month view. Custom 7-day grid gives full control over time block rendering | REQ-001 |
| Weekly calendar time granularity | 30-minute intervals from 6am to 10pm | Matches typical dance studio hours, balances detail vs. clutter | REQ-001 |
| Monthly availability view for instructors | Enhance existing MonthCalendar with overlay mode | Reuse existing calendar component, add new rendering mode for availability + bookings | REQ-001 |
| Pending bookings dashboard data source | Real-time subscription + initial fetch | Leverage existing Realtime infrastructure, ensure dashboard updates live | REQ-005 |
| Student bookings dashboard data source | Fetch on mount + Realtime subscription | Initial fetch for all bookings, Realtime for status updates | REQ-006 |
| Booking status visual indicators | Date modifiers + status badges | Extend existing MonthCalendar modifiers, add new badge component | REQ-003 |
| Calendar legend | Static component rendered above calendar | Clear, persistent legend ensures users understand color coding | REQ-002 |
| Dashboard route | Extend existing `/dashboard` page | Replace existing placeholder "Upcoming Bookings" and "Messages" cards with live data-driven cards. InstructorPendingBookingsCard replaces the bookings placeholder for instructor/owner roles. StudentBookingsCard replaces it for student roles. Conditional rendering based on role. | REQ-005, REQ-006 |
| Availability calendar route | New route `/private-sessions/availability-calendar` | Separate route avoids cluttering main booking UI, allows deep linking | REQ-001 |

### 4.2 Database Changes

**No new tables required.** All functionality uses existing tables:
- `instructor_availability`
- `availability_overrides`
- `private_lesson_bookings`
- `booking_messages`
- `booking_message_reads`

**No new RPC functions required.** All functionality uses existing functions:
- `get_available_slots()`
- `create_booking()`
- `confirm_booking()`
- `cancel_booking()`
- `decline_booking()`

**Optional View for Dashboard Optimization:**

```sql
-- Materialized view for instructor pending bookings summary (performance optimization)
CREATE MATERIALIZED VIEW instructor_pending_bookings_summary AS
SELECT
  b.instructor_id,
  COUNT(*) as pending_count,
  MAX(b.created_at) as latest_request_at
FROM private_lesson_bookings b
WHERE b.status = 'pending'
GROUP BY b.instructor_id;

CREATE UNIQUE INDEX idx_pending_summary_instructor ON instructor_pending_bookings_summary(instructor_id);

-- Refresh function (can be called from API or cron)
CREATE OR REPLACE FUNCTION refresh_pending_bookings_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY instructor_pending_bookings_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Note:** Materialized view is optional. For small studios (<1000 bookings), direct queries are sufficient.

### 4.3 API Changes

**New API Routes:**

```
GET /api/bookings/pending
  Auth: authenticated (instructor or owner)
  Query params: instructor_id? (optional, defaults to current member)
  Response: { data: BookingWithDetails[] }
  Purpose: Fetch pending bookings for instructor dashboard (REQ-005)

GET /api/bookings/upcoming
  Auth: authenticated (any role)
  Query params: member_id? (optional, defaults to current member)
  Response: { data: BookingWithDetails[] }
  Purpose: Fetch upcoming bookings for student dashboard (REQ-006)

GET /api/availability/calendar
  Auth: authenticated (instructor or owner)
  Authorization: Caller must be the instructor identified by instructor_id OR have owner role. Returns 403 otherwise.
  Query params: instructor_id, view=weekly|monthly, date (ISO date)
  Response: { availability: InstructorAvailability[], bookings: PrivateLessonBooking[], overrides: AvailabilityOverride[] }
  Purpose: Fetch all data for availability calendar view (REQ-001)
```

**No changes to existing API routes.** All existing endpoints remain unchanged.

### 4.4 Component Architecture

**New File Structure:**

```
app/src/app/private-sessions/
  availability-calendar/
    page.tsx                    -- Server Component: fetch initial data
    AvailabilityCalendar.tsx    -- "use client": orchestrates view toggle
    WeeklyGridView.tsx          -- "use client": 7-day x time block grid
    MonthlyAvailabilityView.tsx -- "use client": month calendar with overlay
    AddAvailabilityDialog.tsx   -- "use client": create availability slot
    EditAvailabilityPopover.tsx -- "use client": edit/delete existing slot

app/src/app/dashboard/
  page.tsx                      -- Updated: add instructor/student booking cards
  InstructorPendingBookingsCard.tsx -- "use client": pending requests list
  StudentBookingsCard.tsx       -- "use client": upcoming bookings list
  hooks/
    useInstructorBookings.ts    -- Realtime subscription for instructor bookings
    useStudentBookings.ts       -- Realtime subscription for student bookings

app/src/components/booking/
  BookingStatusBadge.tsx        -- Reusable status badge component
  CalendarLegend.tsx            -- Calendar color legend component
```

**Updated Files:**

```
app/src/app/private-sessions/
  MonthCalendar.tsx             -- Add pending booking modifiers
  InstructorAvailabilityManager.tsx -- Add "View Calendar" button
```

### 4.5 State Management

**AvailabilityCalendar State (New):**

```typescript
interface AvailabilityCalendarState {
  view: 'weekly' | 'monthly';
  selectedDate: Date;
  availability: InstructorAvailability[];
  bookings: PrivateLessonBooking[];
  overrides: AvailabilityOverride[];
  loading: boolean;
}

type AvailabilityCalendarAction =
  | { type: 'SET_VIEW'; view: 'weekly' | 'monthly' }
  | { type: 'SET_DATE'; date: Date }
  | { type: 'SET_DATA'; availability: InstructorAvailability[]; bookings: PrivateLessonBooking[]; overrides: AvailabilityOverride[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'AVAILABILITY_ADDED'; availability: InstructorAvailability }
  | { type: 'AVAILABILITY_REMOVED'; id: string }
  | { type: 'BOOKING_CHANGED'; booking: PrivateLessonBooking };
```

**Dashboard Booking State (New):**

```typescript
// Instructor pending bookings
interface InstructorBookingsState {
  pending: BookingWithDetails[];
  loading: boolean;
}

// Student bookings
interface StudentBookingsState {
  upcoming: BookingWithDetails[];
  loading: boolean;
}
```

### 4.6 Realtime Subscriptions

**New Subscriptions:**

```typescript
// hooks/useInstructorBookings.ts
const channel = supabase
  .channel(`instructor-bookings-${instructorId}`)
  .on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "private_lesson_bookings",
    filter: `instructor_id=eq.${instructorId}`,
  }, onBookingChange)
  .subscribe();

// hooks/useStudentBookings.ts
const channel = supabase
  .channel(`student-bookings-${memberId}`)
  .on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "private_lesson_bookings",
    filter: `member_id=eq.${memberId}`,
  }, onBookingChange)
  .subscribe();
```

**Existing Subscriptions:**

No changes to existing `useCalendarRealtime.ts` hook.

### 4.7 Responsive Design

**Weekly Grid View:**
- Desktop (1024px+): Full 7-day grid with 30-minute intervals
- Tablet (768px-1023px): 7-day grid with 1-hour intervals (collapsed)
- Mobile (375px-767px): Single-day scroll view, swipe to change day

**Dashboard Cards:**
- Desktop: 2-column grid (Pending Bookings | My Bookings)
- Tablet: 2-column grid (stacked for narrow tablets)
- Mobile: Single column, stacked cards

**Monthly Availability View:**
- All breakpoints use existing MonthCalendar responsive behavior

### 4.8 Dashboard Card Integration Strategy

**Approach: Conditional Replacement of Bookings Card + Preserve Messages Card**

The existing dashboard (`/dashboard/page.tsx`) has a 2-column grid with placeholder cards for "Messages" and "Upcoming Bookings". The integration strategy:

1. **Messages Card:** Keep unchanged. This placeholder is for the future community chat feature (not booking messages). Booking-specific messaging is accessed via BookingDetailSheet, not the dashboard Messages card.

2. **Upcoming Bookings Card:** Conditionally replace based on role:
   - **Instructors/Owners:** Replace with `InstructorPendingBookingsCard` — shows pending requests with confirm/decline actions, plus a link to view all bookings
   - **Students (member_full, member_limited):** Replace with `StudentBookingsCard` — shows upcoming bookings with status badges
   - **Guests/no bookings role:** Keep existing placeholder with "Book a private lesson" link

3. **Implementation Pattern:**
   ```tsx
   {hasRole('instructor') || hasRole('owner') ? (
     <InstructorPendingBookingsCard instructorId={member.id} />
   ) : hasRole('member_full') || hasRole('member_limited') ? (
     <StudentBookingsCard memberId={member.id} />
   ) : (
     <UpcomingBookingsPlaceholder /> // existing placeholder card
   )}
   ```

4. **Grid Layout:** Maintain existing 2-column grid. Messages card stays in the left column, booking card (whichever variant) stays in the right column.

5. **Members with both roles** (e.g., instructor + member_full): Show `InstructorPendingBookingsCard` (instructor role takes priority since they need to action pending requests).

### 4.9 Performance Optimizations

**API Response Size:**
- Pending bookings endpoint limits to 50 most recent
- Upcoming bookings endpoint limits to next 30 days
- Availability calendar fetches only selected week/month

**Caching:**
- SWR for dashboard data (revalidate on focus)
- Calendar data invalidates on booking change via Realtime

**Lazy Loading:**
- AvailabilityCalendar route code-split (dynamic import)
- Dashboard booking cards lazy-load if not initially visible

---

## Phase 5: API Contracts

### 5.1 New Endpoints

**GET `/api/bookings/pending`** — Fetch pending bookings for instructor dashboard

```
Auth: authenticated (instructor or owner)
Query params:
  - instructor_id? (UUID, optional, defaults to current member)

Response:
{
  data: [
    {
      id: "uuid",
      instructor_id: "uuid",
      member_id: "uuid",
      start_time: "2026-02-05T14:00:00-05:00",
      end_time: "2026-02-05T15:00:00-05:00",
      status: "pending",
      notes: "Focus on cross-body lead",
      created_at: "2026-02-05T10:30:00-05:00",
      member: {
        id: "uuid",
        display_name: "Sarah",
        full_name: "Sarah Martinez",
        avatar_url: "https://..."
      }
    }
  ]
}

Error:
  - 401 if not authenticated
  - 403 if not instructor/owner
  - 500 if database error

Implementation:
- Query private_lesson_bookings with status='pending'
- Filter by instructor_id (from query param or current member)
- Join with members table to get member info
- Order by created_at DESC
- Limit 50
```

**GET `/api/bookings/upcoming`** — Fetch upcoming bookings for student dashboard

```
Auth: authenticated (any role)
Query params:
  - member_id? (UUID, optional, defaults to current member)
  - limit? (number, default 10, max 50)

Response:
{
  data: [
    {
      id: "uuid",
      instructor_id: "uuid",
      member_id: "uuid",
      start_time: "2026-02-05T14:00:00-05:00",
      end_time: "2026-02-05T15:00:00-05:00",
      status: "confirmed",
      notes: "Cross-body styling",
      created_at: "2026-02-05T10:30:00-05:00",
      instructor: {
        id: "uuid",
        display_name: "Maria",
        full_name: "Maria Rodriguez",
        avatar_url: "https://..."
      }
    }
  ]
}

Error:
  - 401 if not authenticated
  - 403 if requesting another member's bookings (non-owner)
  - 500 if database error

Implementation:
- Query private_lesson_bookings
- Filter by member_id (from query param or current member)
- Filter start_time >= NOW()
- Exclude cancelled/expired/declined bookings (optional)
- Join with members table to get instructor info
- Order by start_time ASC
- Apply limit
```

**GET `/api/availability/calendar`** — Fetch all data for availability calendar view

```
Auth: authenticated (instructor or owner)
Authorization: Caller must be the instructor identified by instructor_id OR have owner role. Returns 403 otherwise.
Query params:
  - instructor_id (UUID, required)
  - view ('weekly' | 'monthly', required)
  - date (ISO date string YYYY-MM-DD, required)

Response:
{
  availability: [
    {
      id: "uuid",
      instructor_id: "uuid",
      day_of_week: 2,
      start_time: "14:00:00",
      end_time: "18:00:00",
      slot_duration_minutes: 60,
      is_active: true,
      effective_from: "2026-01-01",
      effective_until: null,
      created_at: "2026-02-01T12:00:00Z",
      updated_at: "2026-02-01T12:00:00Z"
    }
  ],
  bookings: [
    {
      id: "uuid",
      instructor_id: "uuid",
      member_id: "uuid",
      start_time: "2026-02-05T14:00:00-05:00",
      end_time: "2026-02-05T15:00:00-05:00",
      status: "confirmed",
      ...
    }
  ],
  overrides: [
    {
      id: "uuid",
      instructor_id: "uuid",
      override_date: "2026-02-14",
      start_time: null,
      end_time: null,
      is_available: false,
      reason: "Valentine's Day - Studio closed"
    }
  ]
}

Error:
  - 400 if missing required params
  - 401 if not authenticated
  - 403 if not instructor/owner
  - 500 if database error

Implementation:
- Validate view and date params
- Determine date range based on view:
  - weekly: start of week to end of week for given date
  - monthly: start of month to end of month for given date
- Fetch instructor_availability for instructor_id
- Fetch private_lesson_bookings for instructor_id within date range
- Fetch availability_overrides for instructor_id within date range
- Return all three arrays
```

### 5.1.1 Standard Error Response Format

All three new endpoints use the same error response shape, consistent with existing API routes:

```
{
  error: string  // Human-readable error message (e.g., "Unauthorized", "Not an instructor or owner", "Missing required param: instructor_id")
}

HTTP status codes:
  - 400: Bad Request (missing/invalid query params)
  - 401: Unauthorized (not authenticated)
  - 403: Forbidden (insufficient role or not the requested resource owner)
  - 500: Internal Server Error (database or unexpected error)
```

### 5.2 Existing Endpoints (No Changes)

All existing endpoints remain unchanged. See [original design](./private-lesson-booking.md#6-api-contracts) for full reference.

---

## Phase 6: Edge Cases

### 6.1 Instructor Availability Calendar (REQ-001)

| Scenario | Likelihood | Impact | Solution |
|----------|-----------|--------|----------|
| Instructor toggles weekly/monthly view rapidly | Occasional | Minor | Debounce view toggle (300ms), cancel in-flight fetch on view change |
| Instructor adds availability that overlaps existing | Occasional | Moderate | API validates on insert, shows error toast: "This time overlaps with existing availability" |
| Instructor deletes availability with confirmed bookings | Rare | High | API prevents deletion, shows error: "Cannot delete — 3 confirmed bookings exist. Cancel bookings first." |
| Weekly grid renders with 100+ availability blocks | Rare | Moderate | Paginate week view, show warning if >50 blocks in week |

### 6.2 Instructor Pending Bookings Dashboard (REQ-005)

| Scenario | Likelihood | Impact | Solution |
|----------|-----------|--------|----------|
| Two instructors try to confirm overlapping pending bookings | Rare | Moderate | First to confirm wins (GIST constraint), second gets error toast: "Another booking was confirmed for this time. Refresh to see updates." |
| Instructor confirms booking that member just cancelled | Rare | Minor | confirm_booking() checks booking status, returns error: "Booking is no longer pending" |
| Dashboard shows pending booking for slot that was just filled | Occasional | Minor | Realtime subscription updates dashboard immediately when any booking status changes |
| Instructor has 50+ pending bookings | Rare | Moderate | Dashboard limits to 10 most recent, shows "View All (50)" link to full list page |
| Instructor confirms booking in dashboard while viewing it in calendar | Occasional | Minor | Realtime updates both views simultaneously |

### 6.3 Student Booking Calendar (REQ-002, REQ-003)

| Scenario | Likelihood | Impact | Solution |
|----------|-----------|--------|----------|
| Student pages through months rapidly | Frequent | Minor | Debounce month change (300ms), cancel in-flight fetch on page change |
| Student sees "open slot" but gets "already booked" error | Occasional | Moderate | Slot was confirmed by instructor between page load and booking attempt. Show error toast: "This slot was just booked. Refreshing calendar..." Auto-refetch slots. |
| Student has pending booking but slot still shows as "available" | Frequent (by design) | None | Multiple pending bookings allowed per slot until confirmation. Calendar shows yellow indicator for user's own pending bookings only. |
| Student's pending booking expires (4-hour rule) while viewing calendar | Occasional | Minor | Realtime subscription updates booking status to "expired", yellow indicator disappears, slot becomes green again |

### 6.4 Student Bookings Dashboard (REQ-006)

| Scenario | Likelihood | Impact | Solution |
|----------|-----------|--------|----------|
| Student has 100+ bookings (historical + upcoming) | Rare | Moderate | Dashboard shows only upcoming bookings (start_time >= NOW()), limits to 10, "View All" link to full list |
| Dashboard shows "Confirmed" but slot is actually "Cancelled" (race condition) | Rare | Minor | Realtime subscription updates booking status immediately when instructor cancels |
| Student clicks "View" on booking that was just deleted | Rare | Minor | BookingDetailSheet checks if booking exists, shows error: "Booking not found" |

### 6.5 Real-Time Updates (REQ-003)

| Scenario | Likelihood | Impact | Solution |
|----------|-----------|--------|----------|
| Realtime connection drops during booking confirmation | Occasional | Moderate | Supabase client auto-reconnects. On reconnect, refetch dashboard data (both instructor and student). Show reconnection toast. |
| Instructor confirms booking while student's device is offline | Occasional | Moderate | When student reconnects, Realtime delivers missed events. If too many missed events (>100), trigger full refetch. |
| Booking status changes multiple times rapidly (pending → confirmed → cancelled) | Rare | Minor | Realtime delivers events in order. State reducer applies transitions sequentially. Each transition triggers UI update. |

### 6.6 Permissions & Authorization (REQ-005, REQ-006)

| Scenario | Likelihood | Impact | Solution |
|----------|-----------|--------|----------|
| Member promoted to instructor mid-session | Rare | Minor | Dashboard fetches member roles on mount. Refresh page to see instructor dashboard features. |
| Instructor demoted to member mid-session | Rare | Minor | API checks role on every request. Subsequent requests to instructor-only endpoints return 403. UI shows error toast. |
| Guest user tries to access dashboard | Occasional | Minor | Dashboard page checks auth on mount, redirects to /login if not authenticated |

### 6.7 Data Integrity

| Scenario | Likelihood | Impact | Solution |
|----------|-----------|--------|----------|
| Dashboard fetches bookings with deleted instructor/member | Rare | Moderate | API left joins with members table, returns null for missing instructor/member. UI shows "Unknown" fallback. |
| Availability calendar fetches data for date 10 years in future | Rare | Minor | API validates date range, limits to +/- 1 year from today. Shows error toast if out of range. |

---

## Phase 7: Acceptance Criteria

### 7.1 REQ-001: Instructor Availability Scheduling

**Given** an instructor is logged in  
**When** they click "View Calendar" in the Availability Manager  
**Then** the Availability Calendar page opens showing their current availability

**Given** an instructor is on the Availability Calendar page  
**When** they click the "Weekly View" toggle  
**Then** the calendar switches to a 7-day grid showing time blocks from 6am to 10pm

**Given** an instructor is viewing the Weekly Grid  
**When** they click an empty time slot  
**Then** an "Add Availability" dialog opens with the day and time pre-filled

**Given** an instructor adds recurring availability (Tue 2-6pm)  
**When** they save the availability  
**Then** the weekly grid shows green blocks for Tuesdays 2-6pm

**Given** an instructor is on the Availability Calendar page  
**When** they click the "Monthly View" toggle  
**Then** the calendar switches to a full month view with green dots on days with availability

**Given** an instructor is viewing the Monthly View  
**When** they click a date with availability  
**Then** a popover shows all availability blocks and bookings for that day

**Given** an instructor clicks an existing availability block  
**When** they select "Delete"  
**Then** the block is removed and the calendar updates immediately

**Given** an instructor tries to delete availability with confirmed bookings  
**When** they attempt deletion  
**Then** they see an error: "Cannot delete — N confirmed bookings exist. Cancel bookings first."

### 7.2 REQ-002: Student Booking Calendar with Month Paging

**Given** a student is on the Private Sessions page  
**When** they view the booking calendar  
**Then** the calendar shows only dates with available (bookable) slots as green dots

**Given** a student is viewing the booking calendar  
**When** they click the "<<" (previous month) button  
**Then** the calendar pages to the previous month and fetches new slot data

**Given** a student is viewing the booking calendar  
**When** they click the ">>" (next month) button  
**Then** the calendar pages to the next month and fetches new slot data

**Given** a student is viewing a future month (e.g., March)  
**When** the slots load for that month  
**Then** only dates with available slots show green dots, dates without slots are disabled

**Given** a student has no bookings or pending requests  
**When** they view the calendar  
**Then** they see only green dots (available slots), no yellow or blue indicators

**Given** a student switches between instructors  
**When** the instructor changes  
**Then** the calendar updates to show only the selected instructor's available slots

### 7.3 REQ-003: Booking Confirmation Workflow

**Given** a student requests a booking  
**When** the booking is created as pending  
**Then** the slot immediately shows a yellow triangle indicator on the calendar

**Given** a student is viewing the calendar with a pending booking  
**When** they click the date with the pending booking  
**Then** the time slot panel shows the slot with a "Pending" status badge

**Given** a pending booking exists  
**When** the instructor confirms the booking  
**Then** the slot changes from yellow (pending) to blue (confirmed) in real-time for the student

**Given** a pending booking exists  
**When** the instructor declines the booking  
**Then** the slot's yellow indicator disappears and the slot becomes available again

**Given** a student has a pending booking  
**When** another student tries to book the same slot  
**Then** both students can create pending bookings (multiple pending requests allowed)

**Given** an instructor confirms one of multiple pending bookings for a slot  
**When** the confirmation is processed  
**Then** the other pending bookings are auto-declined

**Given** a student views a pending booking on the calendar  
**When** the booking expires (4-hour rule)  
**Then** the yellow indicator disappears and the slot becomes available in real-time

### 7.4 REQ-004: Student-Instructor Messaging

**Given** a booking exists  
**When** either the student or instructor sends a message  
**Then** the message appears in the booking's message thread immediately

**Given** a booking has unread messages  
**When** the recipient views the calendar  
**Then** a preview banner appears above the calendar showing the latest message

**Given** a student or instructor views a booking with messages  
**When** they open the BookingDetailSheet  
**Then** all messages are displayed in chronological order with sender names

**Given** a booking participant sends a message  
**When** the message is sent  
**Then** the other participant sees a notification via Realtime within 2 seconds

**Note:** Messaging is already fully implemented. This REQ validates existing functionality.

### 7.5 REQ-005: Instructor Dashboard Shows Pending Bookings

**Given** an instructor is logged in  
**When** they navigate to the Dashboard  
**Then** they see a "Pending Booking Requests" card showing all pending bookings

**Given** an instructor has 3 pending bookings  
**When** they view the dashboard card  
**Then** the card shows a count badge "[3]" and lists all 3 requests

**Given** a pending booking request is shown on the dashboard  
**When** the instructor clicks [Confirm]  
**Then** the booking status changes to "confirmed", the request is removed from the list, and the count badge decreases

**Given** a pending booking request is shown on the dashboard  
**When** the instructor clicks [Decline]  
**Then** an optional reason dialog appears

**Given** the instructor declines a booking with a reason  
**When** they submit the decline  
**Then** the booking status changes to "declined", the request is removed from the list, and the student sees the reason

**Given** an instructor has no pending bookings  
**When** they view the dashboard  
**Then** the card shows "No pending requests" and a "View All Bookings" link

**Given** an instructor is viewing the dashboard  
**When** a new booking request is created  
**Then** the pending bookings card updates in real-time to show the new request

**Given** an instructor confirms a booking from the dashboard  
**When** the confirmation succeeds  
**Then** a success toast appears: "Booking confirmed!"

### 7.6 REQ-006: Student Dashboard Shows Booking Status

**Given** a student is logged in  
**When** they navigate to the Dashboard  
**Then** they see a "My Bookings" card showing all upcoming bookings

**Given** a student has upcoming bookings with different statuses  
**When** they view the dashboard card  
**Then** each booking shows the correct status badge (Pending, Confirmed, Declined, etc.)

**Given** a student views a booking with status "Pending"  
**When** they see the status badge  
**Then** the badge is yellow and shows text "Pending"

**Given** a student views a booking with status "Confirmed"  
**When** they see the status badge  
**Then** the badge is green and shows text "Confirmed"

**Given** a student views a booking with status "Declined"  
**When** they see the status badge  
**Then** the badge is red and shows text "Declined"

**Given** a student clicks "View" on a booking in the dashboard  
**When** the BookingDetailSheet opens  
**Then** they see full booking details, message thread, and cancel button

**Given** a student has no upcoming bookings  
**When** they view the dashboard  
**Then** the card shows "No upcoming lessons" and a "Book New Lesson" link

**Given** a student is viewing the dashboard  
**When** an instructor confirms their pending booking  
**Then** the booking's status badge changes from yellow (Pending) to green (Confirmed) in real-time

**Given** a student is viewing the dashboard  
**When** an instructor declines their pending booking  
**Then** the booking's status badge changes to red (Declined) and shows the decline reason

### 7.7 Non-Functional Requirements

**Performance:**
- Availability calendar loads initial data in < 2 seconds
- Dashboard pending bookings card loads in < 1 second
- Dashboard student bookings card loads in < 1 second
- Real-time updates (confirm/decline) visible within 2 seconds
- Month paging updates calendar in < 500ms

**Responsive Design:**
- All new components work on mobile (375px), tablet (768px), and desktop (1024px+)
- Weekly grid view adapts to single-day scroll view on mobile
- Dashboard cards stack vertically on mobile

**Accessibility:**
- All new interactive elements are keyboard accessible
- Status badges have ARIA labels
- Calendar legend is screen-reader friendly
- Focus states are visible on all interactive elements

**Browser Support:**
- Works on latest Chrome, Firefox, Safari, Edge
- Graceful degradation for older browsers (no Realtime in IE11)

**Error Handling:**
- All API errors show user-friendly toast messages
- Network failures trigger retry with exponential backoff
- Realtime connection drops trigger auto-reconnect + refetch

### 7.8 Definition of Done

**For REQ-001 (Instructor Availability Scheduling):**
1. Weekly calendar view renders correctly with time blocks
2. Monthly calendar view shows availability + bookings overlay
3. Toggle between views works smoothly
4. Add/edit/delete availability actions work
5. All acceptance criteria pass
6. Code reviewed and approved
7. Deployed to preview environment
8. Tested on mobile device

**For REQ-002 (Student Booking Calendar with Month Paging):**
1. Monthly calendar shows only available slots as green dots
2. Month paging (<<, >>) works correctly
3. Slots fetch for new month in < 500ms
4. All acceptance criteria pass
5. Code reviewed and approved
6. Deployed to preview environment
7. Tested on mobile device

**For REQ-003 (Booking Confirmation Workflow):**
1. Pending bookings show yellow indicators
2. Confirmed bookings show blue indicators
3. Real-time status updates work
4. Auto-decline of competing requests works
5. All acceptance criteria pass
6. Code reviewed and approved
7. Deployed to preview environment
8. Tested on mobile device

**For REQ-004 (Student-Instructor Messaging):**
1. Existing messaging functionality validated
2. No regressions introduced by new features
3. Message preview banner works correctly
4. All acceptance criteria pass

**For REQ-005 (Instructor Dashboard Pending Bookings):**
1. Dashboard card shows pending bookings
2. Confirm/decline actions work
3. Real-time updates work
4. Count badge accurate
5. All acceptance criteria pass
6. Code reviewed and approved
7. Deployed to preview environment
8. Tested on mobile device

**For REQ-006 (Student Dashboard Booking Status):**
1. Dashboard card shows all upcoming bookings
2. Status badges render correctly
3. Real-time status updates work
4. "View" button opens BookingDetailSheet
5. All acceptance criteria pass
6. Code reviewed and approved
7. Deployed to preview environment
8. Tested on mobile device

**Overall:**
1. All 6 REQs implemented and tested
2. No regressions in existing features
3. Performance benchmarks met
4. Accessibility audit passed
5. Owner sign-off received
6. Deployed to production

---

## Implementation Roadmap

### Phase A: Foundation (REQ-003 enhancements)
1. Add BookingStatusBadge component
2. Add CalendarLegend component
3. Update MonthCalendar to show pending booking indicators (yellow triangles)
4. Test real-time status updates with pending → confirmed → declined transitions

### Phase B: Instructor Availability Calendar (REQ-001)
1. Create `/private-sessions/availability-calendar` route
2. Implement AvailabilityCalendar orchestration component
3. **Spike: WeeklyGridView prototype** — Build a minimal version of the 7-day time block grid first to validate rendering approach, mobile single-day scroll behavior, and time block click-to-add interaction before full implementation
4. Implement WeeklyGridView with time block rendering (build on spike: grid layout, drag-to-create optional, responsive mobile→single-day)
5. Implement MonthlyAvailabilityView with overlay
6. Implement AddAvailabilityDialog and EditAvailabilityPopover
7. Add "View Calendar" button to InstructorAvailabilityManager
8. Implement `/api/availability/calendar` endpoint (with authorization check: caller must be the instructor or have owner role)
9. Add Realtime subscriptions for availability changes
10. Test weekly/monthly toggle and data synchronization

### Phase C: Instructor Dashboard (REQ-005)
1. Implement InstructorPendingBookingsCard component
2. Implement `/api/bookings/pending` endpoint
3. Implement useInstructorBookings hook with Realtime
4. Update Dashboard page to show card for instructors
5. Test confirm/decline actions and real-time updates
6. Test count badge accuracy

### Phase D: Student Dashboard (REQ-006)
1. Implement StudentBookingsCard component
2. Implement `/api/bookings/upcoming` endpoint
3. Implement useStudentBookings hook with Realtime
4. Update Dashboard page to show card for students
5. Test status badge rendering for all statuses
6. Test real-time status updates from instructor actions

### Phase E: Student Calendar Enhancements (REQ-002)
1. Validate month paging functionality (already exists)
2. Add visual tests for pending vs. confirmed vs. available indicators
3. Test instructor switching with month paging
4. Optimize slot fetching performance

### Phase F: Polish & Testing
1. Comprehensive end-to-end testing of all REQs
2. Performance testing (load times, real-time latency)
3. Accessibility audit
4. Mobile device testing
5. Error handling validation
6. Edge case testing
7. Owner walkthrough and sign-off

---

## Summary of Changes

### What's New

**UI Components:**
- AvailabilityCalendar (weekly/monthly view toggle)
- WeeklyGridView (7-day time block grid)
- MonthlyAvailabilityView (month calendar with availability overlay)
- InstructorPendingBookingsCard (dashboard card for pending requests)
- StudentBookingsCard (dashboard card for upcoming bookings)
- BookingStatusBadge (reusable status badge)
- CalendarLegend (color-coded legend)

**API Endpoints:**
- `GET /api/bookings/pending` (instructor pending bookings)
- `GET /api/bookings/upcoming` (student upcoming bookings)
- `GET /api/availability/calendar` (availability calendar data)

**Features:**
- Weekly calendar view for instructor availability management (REQ-001)
- Monthly calendar view with availability + bookings overlay (REQ-001)
- Instructor dashboard card showing pending bookings with confirm/decline (REQ-005)
- Student dashboard card showing upcoming bookings with status badges (REQ-006)
- Visual indicators for pending bookings on student calendar (REQ-003)
- Month paging validation (REQ-002)
- Real-time status updates for all workflows (REQ-003)

### What's Unchanged

**Existing functionality that remains the same:**
- All database tables and RPC functions
- Student booking flow (instructor selector → calendar → slot selection → confirm dialog)
- Booking messaging (fully functional, no changes needed)
- Instructor availability manager (add/edit/delete availability via dialog)
- Realtime infrastructure (Supabase Realtime subscriptions)
- Mobile-responsive design principles
- Auth & role-based access control

### What's Enhanced

**Existing components with additions:**
- MonthCalendar: Add pending booking indicators (yellow triangles)
- Dashboard page: Add instructor and student booking cards
- InstructorAvailabilityManager: Add "View Calendar" button

---

## References

- [Original Private Lesson Booking Design](./private-lesson-booking.md)
- [Database Schema](../database-schema.md)
- [Auth & Roles](../auth-and-roles.md)
- [Calendar Architecture](./calendar-architecture.md) (reference only)
- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [shadcn/ui Components](https://ui.shadcn.com)
- [date-fns Documentation](https://date-fns.org)

---

**Document Status:** Complete
**Design Review:** Reviewed (3 rounds) — APPROVED
**Implementation:** Not Started
**Last Updated:** 2026-02-06
