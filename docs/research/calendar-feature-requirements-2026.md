# Calendar & Scheduling Feature Requirements Analysis

> **Date:** 2026-02-06
> **Bead:** app-hjb.2
> **Status:** Complete
> **Sources:** calendar.md, calendar-architecture.md, private-lesson-booking.md, private-lesson-booking-v2.md, calendar-research-findings.md, project-overview.md, database-schema.md, all current implementation files

---

## Table of Contents

1. [Event Types the Calendar Must Support](#1-event-types)
2. [Calendar Views Needed](#2-calendar-views)
3. [Instructor Availability Management](#3-instructor-availability)
4. [Student Booking Flows](#4-student-booking-flows)
5. [Booking Confirmation/Cancellation/Decline Workflows](#5-booking-workflows)
6. [Real-Time Features](#6-real-time-features)
7. [Role-Based Visibility Matrix](#7-role-based-visibility)
8. [Mobile-Specific Requirements](#8-mobile-requirements)
9. [Gap Analysis: Implemented vs Specified](#9-gap-analysis)
10. [Dashboard Integration Points](#10-dashboard-integration)
11. [Deferred Questions from app-5cn.10](#11-deferred-questions)

---

## 1. Event Types

The calendar system must support the following event types, defined by the `event_type` enum in the database schema:

| Event Type | Description | Who Creates | Recurring? | Capacity? | Paid? | Phase |
|------------|-------------|-------------|-----------|-----------|-------|-------|
| **class** | Regular group dance classes (salsa on1, on2, bachata, etc.) | Staff | Yes (weekly via RRULE) | Yes | Via subscription | 0 |
| **workshop** | Multi-session focused workshops or bootcamps | Staff | Can be | Yes | Yes (Stripe) | 1 |
| **bootcamp** | Beginner bootcamp series (6PM-7PM, 9PM-10PM sessions) | Staff | Yes (series) | Yes | Included in packages | 0 |
| **studio_social** | Studio-organized social dance events (2nd Friday monthly) | Staff | Optional | Yes | Yes ($15 pre-sale / $20 door) | 5 |
| **community** | Member-submitted social events around town | Members | No (one-off) | Optional | External | 5 |
| **private_lesson** | One-on-one lessons between instructor and member | Members (request) | No | N/A (1:1) | Packages ($95-$85/hr) | 1 |

### Additional Event Classifications

- **dance_style** enum: salsa_on1, salsa_on2, bachata, cha_cha, merengue, kizomba, other
- **difficulty_level** enum: beginner, intermediate, advanced, all_levels
- **visibility_level** enum: public, all_members, segment, attendees
- **approval_status** for community events: pending, approved, rejected

---

## 2. Calendar Views

### Views Required

| View | Roles | Purpose | Current Status |
|------|-------|---------|---------------|
| **Public Schedule Grid** (weekly) | All visitors | Static weekly class schedule (Mon-Thu grid, time slots) | IMPLEMENTED -- `schedule-grid.tsx`, editable by staff |
| **Month Calendar** (private lessons) | Members, Instructors, Owner | Browse instructor availability, book private lessons | IMPLEMENTED -- `MonthCalendar.tsx` via shadcn DayPicker |
| **Weekly Grid** (instructor availability) | Instructors, Owner | View/manage weekly availability blocks (7-day x time grid) | SPECIFIED in v2.md -- NOT IMPLEMENTED |
| **Monthly Availability** (instructor) | Instructors, Owner | Month view with availability + bookings overlay | SPECIFIED in v2.md -- NOT IMPLEMENTED |
| **Day/Agenda View** (group events) | All members | List of events on a single day | SPECIFIED in calendar.md -- NOT IMPLEMENTED |
| **List View** (events) | All members | Chronological list of upcoming events | SPECIFIED in calendar.md -- NOT IMPLEMENTED |

### View Assignments by Role

| Role | Public Schedule | Private Lesson Calendar | Instructor Weekly Grid | Instructor Monthly | Events Calendar |
|------|----------------|------------------------|----------------------|-------------------|----------------|
| Guest | Read-only | N/A | N/A | N/A | Read-only (public events) |
| member_limited | Read-only | Browse & book | N/A | N/A | RSVP |
| member_full | Read-only | Browse & book | N/A | N/A | RSVP + submit community |
| instructor | Edit | Browse & book (as student) | Full CRUD | Read/manage | Create events |
| owner | Edit | Browse & full visibility | All instructors | All instructors | Full CRUD |

### Calendar Library Decision

Research (app-5cn.1) selected `lramos33/big-calendar` as the primary reference (shadcn/ui + Tailwind native). FullCalendar docs are the API/behavior reference. Cal.com is excluded (AGPLv3 license).

---

## 3. Instructor Availability Management

### Currently Implemented

The following features are fully functional in the codebase:

**Database:**
- `instructor_availability` table -- recurring weekly time windows (day_of_week, start_time, end_time, slot_duration_minutes, effective_from/until)
- `availability_overrides` table -- date-specific blocks or extra availability
- `get_available_slots()` RPC -- expands recurring rules, subtracts overrides and confirmed bookings
- RLS policies: anyone authenticated can read, instructors manage own, owner manages all

**API Routes:**
- `GET /api/availability?instructor_id=UUID` -- fetch weekly availability
- `POST /api/availability` -- create new recurring availability
- `DELETE /api/availability/[id]` -- delete availability + auto-decline affected pending bookings
- `GET /api/availability/[id]` -- fetch availability + overrides for instructor
- `POST /api/availability/overrides` -- create date override
- `DELETE /api/availability/overrides/[id]` -- delete override
- `GET /api/availability/calendar` -- fetch availability + bookings + overrides for weekly/monthly view
- `GET /api/slots/[instructorId]?start=DATE&end=DATE` -- get available slots via RPC

**UI:**
- `InstructorAvailabilityManager.tsx` -- form-based UI for adding/removing weekly availability and overrides
- Instructor selector (avatar pills, ToggleGroup)

### Not Yet Implemented (from v2.md REQ-001)

- **Weekly Grid View** -- 7-day x time block visual calendar for instructors to see and manage availability
- **Monthly Availability View** -- month calendar with color-coded overlay (green=available, yellow=pending, red=confirmed)
- **View toggle** -- switch between weekly and monthly views
- **Click-to-add** -- click empty time slot in weekly grid to add availability
- **Edit/Delete popover** -- click existing block for edit/delete options
- **Availability Calendar route** -- `/private-sessions/availability-calendar`

### Availability Features Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Set recurring weekly availability | Implemented | API + form UI |
| Block specific dates (vacation, sick) | Implemented | Override with is_available=false |
| Add extra availability (one-off dates) | Implemented | Override with is_available=true |
| Slot duration configuration (45/60/90 min) | Implemented | slot_duration_minutes field, default 60 |
| Effective date ranges | Implemented | effective_from/effective_until on availability |
| Visual weekly grid calendar | Not Implemented | Specified in v2.md |
| Visual monthly overview | Not Implemented | Specified in v2.md |
| Auto-decline bookings when availability removed | Implemented | DELETE availability route handles this |

---

## 4. Student Booking Flows

### Current Implemented Flow (Step by Step)

1. **Navigate** to `/private-sessions`
2. **Auth check** -- if not logged in, show "Log In to Book" CTA
3. **View instructors** -- avatar pills showing all instructors (ToggleGroup, horizontal scroll)
4. **Select instructor** -- calendar updates to show that instructor's availability
5. **Browse month** -- MonthCalendar shows green dots on dates with available slots, blue dots on booked dates, red glow on dates with unread messages
6. **Page through months** -- `<<` / `>>` arrows, fetches new slots and bookings for new month
7. **Click available date** -- opens TimeSlotDrawer (mobile) or TimeSlotSheet (desktop) showing time slots for that date
8. **Select time slot** -- opens BookingConfirmDialog confirming instructor, date, time
9. **Confirm request** -- calls `create_booking()` RPC (creates pending booking)
10. **Wait for instructor** -- booking shows as "Pending" on calendar
11. **Instructor confirms/declines** -- status updates in real-time via Supabase Realtime

### Booking State Machine

```
pending --> confirmed (instructor confirms)
pending --> declined (instructor declines)
pending --> expired (4-hour auto-expiry cron)
pending --> cancelled_by_member (member withdraws request)
confirmed --> completed (lesson happens)
confirmed --> no_show (member doesn't show)
confirmed --> cancelled_by_member (24h+ before start)
confirmed --> cancelled_by_instructor (any time)
```

### Not Yet Implemented in Booking Flow

- **Stripe payment integration** -- currently bookings are free (pending -> confirmed without payment). Architecture spec defines full payment flow with Stripe Checkout + webhooks
- **Google Calendar sync** -- one-way push from app to Google Calendar after confirmation
- **Email/push notifications** -- notification_queue table designed but no notification delivery
- **Recurring lesson packages** -- no support for bulk lesson booking

---

## 5. Booking Confirmation/Cancellation/Decline Workflows

### Confirmation (Implemented)

- `POST /api/bookings/[id]/confirm` -> calls `confirm_booking()` RPC
- Only booking's instructor or owner can confirm
- GIST exclusion constraint prevents double-booking at database level
- Auto-declines other pending bookings for the same slot when one is confirmed
- Uses `SELECT FOR UPDATE` to prevent race conditions

### Cancellation (Implemented)

- `POST /api/bookings/[id]/cancel` -> calls `cancel_booking()` RPC
- **Member cancelling:** pending bookings always cancellable; confirmed bookings blocked within 24 hours of start time
- **Instructor cancelling:** no time restriction
- **Owner cancelling:** no time restriction
- Cancellation reason is optional
- Tracks who cancelled and when

### Decline (Implemented)

- `POST /api/bookings/[id]/decline` -> calls `decline_booking()` RPC
- Only booking's instructor or owner can decline
- Only applies to pending bookings
- Optional reason text

### Auto-Expiry (Specified, Partially Implemented)

- Stale pending bookings should expire after 4 hours
- Requires Vercel Cron route at `/api/cron/expire-bookings` running every 15 minutes
- **Cron route code is specified in private-lesson-booking.md but NOT in the codebase** -- needs implementation
- Note: 15-minute cron requires Vercel Pro ($20/mo)

### Status Transition Enforcement (Implemented)

- Database trigger `check_booking_transition()` validates allowed state transitions
- Prevents invalid transitions (e.g., directly from pending to completed)

---

## 6. Real-Time Features

### Currently Implemented

| Feature | Implementation | Scope |
|---------|---------------|-------|
| Booking status changes | Supabase Realtime (postgres_changes) on `private_lesson_bookings` filtered by instructor_id | Per-instructor channel |
| New booking messages | Supabase Realtime (INSERT) on `booking_messages` filtered by booking_id list | Active booking IDs |
| Unread message glow | CSS `animate-glow` keyframe animation on booking slots with unread messages | Calendar view |
| Message preview banner | `MessageBanner` component showing latest unread message above calendar | Calendar view |
| Auto-reconnect | Supabase client auto-reconnects; refetch data on reconnect | Calendar view |

### Realtime Infrastructure

- Hook: `useCalendarRealtime.ts` -- manages channel lifecycle per instructor
- Single channel with multiple `.on()` listeners
- Channel torn down and recreated when instructor selection changes
- Tables requiring REPLICA IDENTITY FULL: `booking_messages`
- Tables needing replication enabled: `private_lesson_bookings`, `booking_messages`, `instructor_availability`, `availability_overrides`

### Not Yet Implemented

| Feature | Specified In | Notes |
|---------|-------------|-------|
| Event RSVP real-time updates | calendar-architecture.md | Needed for group event RSVP counts |
| Waitlist position updates | calendar-architecture.md | When someone cancels, next person auto-promoted |
| Dashboard real-time updates | private-lesson-booking-v2.md | InstructorPendingBookingsCard and StudentBookingsCard need Realtime subscriptions |
| Attendance check-in updates | calendar-architecture.md | Real-time check-in count on events |
| Notification delivery | calendar-architecture.md | `notification_queue` table exists but no processing Edge Function |

---

## 7. Role-Based Visibility Matrix

### Private Lesson System

| Action | guest | member_limited | member_full | instructor | owner |
|--------|-------|---------------|-------------|------------|-------|
| View schedule page | Yes | Yes | Yes | Yes | Yes |
| View instructor availability | No | Yes | Yes | Yes | Yes |
| Browse available slots | No | Yes | Yes | Yes | Yes |
| Book private lesson | No | Yes | Yes | Yes (with other instructors) | Yes |
| View own bookings | N/A | Yes | Yes | Yes (both as instructor & member) | All bookings |
| Confirm/decline bookings | No | No | No | Own bookings only | All bookings |
| Cancel own booking | N/A | Yes (24h rule) | Yes (24h rule) | Yes (no time limit as instructor) | Yes (no time limit) |
| Manage own availability | N/A | No | No | Yes | Yes (all instructors) |
| Send booking messages | N/A | Yes (own bookings) | Yes (own bookings) | Yes (own bookings) | Yes (all) |
| View all bookings | No | No | No | No | Yes |
| Edit schedule grid | No | No | No | Yes | Yes |

### Group Event System (Specified, Not Fully Implemented)

| Action | guest | member_limited | member_full | instructor | owner |
|--------|-------|---------------|-------------|------------|-------|
| View public events | Yes | Yes | Yes | Yes | Yes |
| View member events | No | Yes | Yes | Yes | Yes |
| RSVP to events | No | Yes | Yes | Yes | Yes |
| Submit community events | No | No | Yes | Yes | Yes |
| Approve community events | No | No | No | No | Yes |
| Create staff events | No | No | No | Yes | Yes |
| Manage all events | No | No | No | No | Yes |
| Check in via QR | No | Yes | Yes | Yes | Yes |
| Manual check-in | No | No | No | Yes | Yes |

---

## 8. Mobile-Specific Requirements

### Currently Implemented

| Feature | Mobile Behavior | Breakpoint |
|---------|----------------|-----------|
| Schedule grid | Day tabs + stacked cards (horizontal tab bar for Mon-Thu) | `schedule-mobile` class (responsive CSS) |
| Instructor selector | Horizontal scroll with avatar pills | Built into ToggleGroup + ScrollArea |
| Month calendar | Full-width month grid | Responsive by default (shadcn Calendar) |
| Time slot selection | Bottom drawer (Vaul Drawer component) instead of side sheet | `<768px` via `useMediaQuery` |
| Booking detail | Full-screen sheet | Responsive Sheet |
| Message thread | Scrollable within sheet/drawer | ScrollArea |

### Specified but Not Implemented

| Feature | Mobile Behavior | Source |
|---------|----------------|--------|
| Weekly grid (instructor) | Single-day scroll view with swipe to change day | v2.md Section 4.7 |
| Dashboard cards | Single column stacked | v2.md Section 4.7 |
| Calendar legend | Compact version below calendar | v2.md |

### Mobile Design Targets

- **Minimum width:** 375px (iPhone SE)
- **Breakpoints:** sm 640px, md 768px, lg 1024px, xl 1280px
- **Touch targets:** minimum 44x44px for interactive elements
- **Keyboard:** arrow keys navigate calendar, Enter selects, Escape closes panels

---

## 9. Gap Analysis: Implemented vs Specified

### Fully Implemented

| Feature | Files |
|---------|-------|
| Instructor availability CRUD (weekly + overrides) | API routes: availability/*, DB: instructor_availability, availability_overrides |
| Private lesson booking flow (request, confirm, decline, cancel) | API routes: bookings/*, DB functions: create_booking, confirm_booking, cancel_booking, decline_booking |
| Month calendar with date indicators (available/booked/unread) | MonthCalendar.tsx, CalendarView.tsx |
| Time slot display + selection | TimeSlotPanel.tsx, TimeSlotDrawer.tsx, TimeSlotSheet.tsx |
| Booking detail sheet + message thread | BookingDetailSheet.tsx, BookingConfirmDialog.tsx |
| Booking messages (send, read, unread tracking) | API: bookings/[id]/messages, bookings/unread |
| Real-time booking status + message updates | useCalendarRealtime.ts hook |
| Instructor selector (avatar pills) | InstructorSelector.tsx |
| Message banner with unread preview | MessageBanner.tsx |
| Glow animation for unread bookings | globals.css `animate-glow` |
| Database-level double-booking prevention | GIST exclusion constraint on private_lesson_bookings |
| Status transition enforcement | check_booking_transition() trigger |
| Auto-decline on availability removal | DELETE /api/availability/[id] route logic |
| Dashboard with booking cards | DashboardBookings.tsx, DashboardMessages.tsx |
| TypeScript types for all booking entities | types/booking.ts |
| Public schedule grid (Mon-Thu, editable by staff) | schedule-grid.tsx, schedule/page.tsx |

### Partially Implemented

| Feature | What Exists | What's Missing |
|---------|-------------|---------------|
| Dashboard booking management | DashboardBookings shows bookings with real-time | Instructor-specific pending bookings card with confirm/decline actions (REQ-005 from v2.md) |
| Month paging | Works via CalendarView state | Visual indicators for pending bookings (yellow triangles, REQ-003) |
| Availability calendar endpoint | GET /api/availability/calendar implemented | No UI consuming it (WeeklyGridView, MonthlyAvailabilityView) |

### Not Implemented (Specified in Docs)

| Feature | Priority | Specified In | Notes |
|---------|----------|-------------|-------|
| **Instructor Weekly Grid View** | High | v2.md REQ-001 | 7-day x time block visual calendar |
| **Instructor Monthly Availability View** | High | v2.md REQ-001 | Month calendar with availability overlay |
| **Instructor Pending Bookings Dashboard Card** | High | v2.md REQ-005 | Dedicated card with confirm/decline inline |
| **Student Bookings Dashboard Card** | High | v2.md REQ-006 | Status badges (pending/confirmed/declined) |
| **BookingStatusBadge component** | High | v2.md | Reusable status indicator |
| **CalendarLegend component** | Medium | v2.md | Color-coded legend for calendar views |
| **Pending booking yellow indicators** | Medium | v2.md REQ-003 | Visual distinction for pending vs confirmed |
| **Auto-expiry cron job** | Medium | private-lesson-booking.md | Expire stale pending bookings after 4h |
| **Group event calendar** | Phase 5 | calendar.md | Month/Week/Day/List views for classes, workshops, socials |
| **RSVP with capacity + waitlist** | Phase 5 | calendar-architecture.md | rsvp_to_event() RPC, promote_from_waitlist() trigger |
| **Recurring event series management** | Phase 0 | calendar-architecture.md | event_series + RRULE expansion + cron generation |
| **QR check-in + attendance** | Phase 2 | calendar-architecture.md | qrcode.react, HMAC-signed URLs, check_ins table |
| **Google Calendar integration** | Phase 1 | calendar-architecture.md | OAuth2 per instructor, one-way push |
| **iCal export/subscribe** | Phase 1 | calendar-architecture.md | ical-generator, per-member UUID token URLs |
| **Stripe payment for private lessons** | Phase 1 | calendar-architecture.md | Checkout Sessions + webhooks |
| **Stripe payment for events** | Phase 5 | calendar-architecture.md | Reserve-then-pay with 30-min expiry |
| **Community event submission + approval** | Phase 5 | calendar.md | Members submit, owner approves |
| **Notification delivery** | Phase 5 | calendar-architecture.md | notification_queue processing via Edge Functions |

---

## 10. Dashboard Integration Points

### Current Dashboard (`/dashboard/page.tsx`)

The dashboard currently has:

| Section | Status | Details |
|---------|--------|---------|
| Welcome header + role labels | Implemented | Shows display_name, role badges |
| Quick Actions (staff only) | Implemented | Links to Manage Members (admin), Private Lessons (instructor) |
| **DashboardMessages** | Implemented | Shows unread booking messages with real-time updates |
| **DashboardBookings** | Implemented | Shows upcoming bookings (pending/confirmed) with real-time |
| My Enrollment | Implemented | Link to /schedule |
| Video Library | Placeholder | "Coming soon" badge |
| Upcoming Events | Implemented | UpcomingEventsWidget with event list |
| Announcements | Placeholder | "No announcements" |
| Profile summary | Implemented | Email, name, experience, member since |

### Dashboard Enhancements Needed (from v2.md)

| Enhancement | Role | REQ | Description |
|-------------|------|-----|-------------|
| InstructorPendingBookingsCard | Instructor/Owner | REQ-005 | Replace generic bookings card for instructors. Shows pending requests with one-click confirm/decline, count badge, member name + notes + time ago |
| StudentBookingsCard | member_full/member_limited | REQ-006 | Replace generic bookings card for students. Shows upcoming bookings with color-coded status badges, "View" to open detail sheet, "Rebook" for declined |
| Real-time pending count | Instructor | REQ-005 | Badge updates live when new requests arrive or are processed |
| Real-time status badges | Student | REQ-006 | Status changes from pending to confirmed/declined update in real-time |

### Integration Strategy (from v2.md Section 4.8)

- Conditional rendering based on role:
  - Instructor/Owner -> InstructorPendingBookingsCard
  - member_full/member_limited -> StudentBookingsCard
  - Guest -> placeholder with "Book a private lesson" link
- Messages card stays unchanged (separate from booking messages; for future chat feature)
- 2-column grid layout maintained; stacks to single column on mobile

### Future Dashboard Cards (Other Phases)

| Card | Phase | Description |
|------|-------|-------------|
| Upcoming Classes (RSVP'd) | Phase 5 | Shows classes the member has RSVP'd to |
| Attendance History | Phase 2 | Check-in records, attendance streak |
| Video Library | Phase 2 | Recent class recordings, bookmarks |
| Membership Status | Phase 3 | Subscription tier, renewal date, credits |

---

## 11. Deferred Questions from app-5cn.10

These open questions from the architecture review (calendar-architecture.md Section 15) still need resolution before or during implementation:

### 11.1 Community Event Recurrence

**Question:** Should community-submitted events support recurring patterns?

**Current Recommendation:** No -- keep community events as one-off to reduce moderation complexity.

**Status:** Unresolved. Recommend deferring until community events feature is built (Phase 5).

### 11.2 Private Lesson Cancellation Policy

**Question:** Should the refund policy be time-based (full refund >48h, 50% 24-48h, none <24h) or always refundable?

**Current Implementation:** 24-hour cancellation block for members on confirmed bookings. No refund logic since Stripe is not yet integrated.

**Status:** Partially resolved. The 24-hour block is enforced. Refund tiers need confirmation from studio owner before Stripe integration.

### 11.3 Studio-Wide QR Rotation

**Question:** Should the studio-wide QR code rotate daily (HMAC with date) or be permanent?

**Current Recommendation:** Daily rotation via date-scoped HMAC. Prevents sharing screenshots to fake attendance.

**Status:** Unresolved. Needs decision before Phase 2 QR implementation.

### 11.4 Instructor All-Day Blocking

**Question:** Should instructors be able to block entire days?

**Current Implementation:** Yes -- `availability_overrides` supports `is_available = FALSE` with `start_time = NULL` for whole-day blocks. The `get_available_slots()` function correctly handles this case.

**Status:** Resolved. Fully implemented.

### 11.5 Back-to-Back Class Check-In Overlap

**Question:** How should the system handle check-ins when two consecutive classes overlap in their time windows?

**Current Recommendation:** Per-class QR codes are unambiguous. For studio-wide QR, present a class picker when multiple events fall within the check-in window.

**Status:** Unresolved. Needs implementation detail during Phase 2.

### Additional Deferred Items Discovered During Analysis

#### 11.6 Schedule Grid vs Event Calendar Relationship

**Question:** The current `/schedule` page uses a static `schedule_slots` table (independent of the `events` or `event_series` tables). Should the public schedule grid be driven by `event_series` data once recurring events are implemented?

**Current State:** Two separate systems -- `schedule_slots` for the public weekly view, `events`/`event_series` for the member calendar. These should converge.

**Recommendation:** When recurring events (Phase 0) are implemented, migrate the static schedule grid to render from `event_series` data. This ensures a single source of truth for class schedules.

#### 11.7 Timezone Handling for Multi-Location

**Question:** The current system assumes `America/New_York` timezone throughout (hardcoded in `get_available_slots()`, instructor availability management). What happens if the studio opens a second location in another timezone?

**Current State:** Single timezone works for now (Sunrise, FL). The architecture spec notes this assumption and suggests adding a timezone column to `instructor_availability` for future multi-timezone support.

**Recommendation:** Accept single-timezone for now. Add timezone column when multi-location becomes a reality.

#### 11.8 Private Lesson Booking vs Group Event RSVP Data Model

**Question:** Private lessons use `private_lesson_bookings` (separate table with GIST constraint). Group events use `event_rsvps`. Should these converge?

**Current Architecture Decision:** Keep separate. Private lessons need instructor assignment, 1:1 semantics, GIST exclusion for double-booking prevention, and a different status machine. Group events need capacity, waitlist, and attendance tracking. The data models serve different purposes.

**Recommendation:** Maintain separation. The schema is correct as designed.

---

## Summary of Priorities

### Immediate (Calendar Redesign Scope)

1. **WeeklyGridView** for instructor availability management (REQ-001)
2. **MonthlyAvailabilityView** for instructor schedule overview (REQ-001)
3. **InstructorPendingBookingsCard** for dashboard (REQ-005)
4. **StudentBookingsCard** for dashboard (REQ-006)
5. **BookingStatusBadge** component (REQ-003, REQ-006)
6. **Pending booking indicators** on student calendar (REQ-003)
7. **Auto-expiry cron** for stale pending bookings

### Near-Term (Phase 0-1)

8. Recurring event series management (event_series + RRULE + cron)
9. Migrate public schedule grid to event_series data
10. Stripe payment integration for private lessons
11. Google Calendar one-way push

### Medium-Term (Phase 2)

12. QR check-in + attendance tracking
13. Group event RSVP with capacity + waitlist

### Long-Term (Phase 5)

14. Full event calendar (month/week/day/list views)
15. Community event submission + approval
16. Event payments (Stripe)
17. Notification delivery system

---

## Appendix: File Inventory

### Specification Documents

| File | Content |
|------|---------|
| `docs/specs/features/calendar.md` | High-level calendar feature spec (views, event types, RSVP, iCal) |
| `docs/specs/features/calendar-architecture.md` | Comprehensive architecture (schema, functions, RLS, UI, API, phases) |
| `docs/specs/features/private-lesson-booking.md` | Original private lesson design (3 review rounds, approved) |
| `docs/specs/features/private-lesson-booking-v2.md` | V2 design with availability calendar, dashboard cards, status indicators |
| `docs/research/calendar-research-findings.md` | Library evaluation, RRULE patterns, booking approach, Google Calendar, RSVP/waitlist, QR check-in |
| `docs/project-overview.md` | Tech stack, pages, development phases, current status |
| `docs/specs/database-schema.md` | Full SQL schema, ERD, enums, RLS, views |

### Implementation Files

| File | Content |
|------|---------|
| `app/src/app/(site)/schedule/page.tsx` | Public schedule page with weekly grid + pricing |
| `app/src/app/(site)/schedule/schedule-grid.tsx` | Interactive schedule grid (Mon-Thu, staff-editable) |
| `app/src/app/(site)/private-sessions/page.tsx` | Private sessions page (availability manager + booking calendar) |
| `app/src/app/(site)/private-sessions/CalendarView.tsx` | Main calendar orchestration (useReducer, Realtime, data fetching) |
| `app/src/app/(site)/dashboard/page.tsx` | Dashboard with booking cards, events, profile |
| `app/src/components/ui/calendar.tsx` | shadcn Calendar component (DayPicker wrapper) |
| `app/src/types/booking.ts` | TypeScript types for all booking entities |
| `app/src/app/api/availability/route.ts` | GET/POST instructor availability |
| `app/src/app/api/availability/[id]/route.ts` | GET (by instructor) / DELETE availability |
| `app/src/app/api/availability/calendar/route.ts` | GET availability calendar data (weekly/monthly) |
| `app/src/app/api/availability/overrides/route.ts` | POST override |
| `app/src/app/api/availability/overrides/[id]/route.ts` | DELETE override |
| `app/src/app/api/bookings/route.ts` | GET/POST bookings |
| `app/src/app/api/bookings/[id]/confirm/route.ts` | POST confirm booking |
| `app/src/app/api/bookings/[id]/cancel/route.ts` | POST cancel booking |
| `app/src/app/api/bookings/[id]/decline/route.ts` | POST decline booking |
| `app/src/app/api/bookings/[id]/messages/route.ts` | GET/POST booking messages |
| `app/src/app/api/bookings/unread/route.ts` | GET unread message summary |
| `app/src/app/api/slots/[instructorId]/route.ts` | GET available slots via RPC |
| `app/src/app/api/instructors/route.ts` | GET instructor list |

---

*Document Status: Complete*
*Last Updated: 2026-02-06*
