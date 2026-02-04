# Private Lesson Booking — Feature Design

> **Status:** Reviewed (3 rounds)
> **Date:** 2026-02-04
> **Bead:** app-2u2
> **Related:** [Database Schema](../database-schema.md) | [Auth & Roles](../auth-and-roles.md) | [Calendar Architecture](./calendar-architecture.md) (reference only — this design is intentionally smaller in scope)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Problem Statement](#2-problem-statement)
3. [User Stories](#3-user-stories)
4. [UI/UX Design](#4-uiux-design)
5. [Technical Design](#5-technical-design)
6. [API Contracts](#6-api-contracts)
7. [Edge Cases](#7-edge-cases)
8. [Acceptance Criteria](#8-acceptance-criteria)

---

## 1. Overview

A focused booking system that lets members request private lessons with instructors by selecting from available time slots on a calendar. Instructors set their availability and confirm/decline requests. Each booking includes a lightweight message thread for coordination between the member and instructor.

### What This Feature Does

- Instructors define recurring weekly availability and block specific dates
- Members browse a calendar, toggle between instructors, and request open slots
- Instructors confirm or decline booking requests
- Both parties exchange plain-text notes tied to each booking
- Bookings with unread messages glow on the calendar with a preview banner
- The entire UI updates in real-time via Supabase Realtime

### What This Feature Does NOT Do

- No payments (Stripe integration is a future phase)
- No Google Calendar sync
- No QR check-in or attendance tracking
- No waitlists or capacity management
- No recurring event series generation
- No notification emails (in-app only for now)

---

## 2. Problem Statement

- **Who:** Members wanting private lessons, instructors managing their schedules
- **What:** No way to browse instructor availability or request lessons through the platform. Booking currently happens via DM, text, or in-person — leading to double-bookings, missed requests, and no record of lesson history.
- **Impact:** Lost revenue from missed booking opportunities. Instructors juggle multiple communication channels. Members don't know when instructors are free.
- **Success:** Members can see real-time availability and book in under 30 seconds. Instructors manage all requests from one screen. Zero double-bookings.

---

## 3. User Stories

### Must Have

| ID | Role | Story | Benefit |
|----|------|-------|---------|
| U1 | Instructor | I want to set my recurring weekly availability (e.g., Tue 2-6pm, Thu 10am-2pm) | So members can see when I teach |
| U2 | Instructor | I want to block specific dates (vacation, sick day) | So members can't book when I'm unavailable |
| U3 | Instructor | I want to see pending booking requests and confirm or decline them | So I control my schedule |
| U4 | Member | I want to toggle between instructors and see their availability on a calendar | So I can find a time that works |
| U5 | Member | I want to select an open time slot to request a booking | So I can book a private lesson |
| U6 | Member | I want to see the status of my bookings (pending, confirmed, declined) | So I know where things stand |
| U7 | Member | I want to cancel a booking up to 24 hours before the start time | So I can free the slot if I can't make it |
| U8 | Both | I want to send notes about a booking (e.g., "focus on cross-body lead") | So we can coordinate lesson content |
| U9 | Both | I want to see a glow indicator when a booking has unread messages | So I don't miss important notes |
| U10 | Both | I want the calendar to update in real-time when bookings change | So I always see current availability |

### Should Have

| ID | Role | Story | Benefit |
|----|------|-------|---------|
| S1 | Instructor | I want pending requests to auto-expire after 4 hours | So stale requests don't pile up |
| S2 | Member | I want to see a message preview banner above the calendar | So I notice new messages immediately |
| S3 | Owner | I want to see all bookings across all instructors | So I have full visibility into lesson scheduling |

### Could Have

| ID | Role | Story | Benefit |
|----|------|-------|---------|
| C1 | Instructor | I want to set different slot durations (45min, 60min, 90min) | So I can offer flexible lesson lengths |
| C2 | Member | I want to filter availability by lesson duration | So I can find slots that match my needs |

### Won't Have (This Time)

- Stripe payments for bookings
- Google Calendar sync
- Email/push notifications
- Recurring lesson packages
- Instructor-to-instructor booking

---

## 4. UI/UX Design

### 4.1 User Flows

#### Member Booking Flow

```
Calendar page → Select instructor (avatar pills)
  → Calendar updates to show availability
  → Click available date
  → Side panel/drawer shows time slots
  → Click slot → Confirmation dialog
  → Confirm → Booking created (pending)
  → Instructor confirms → Status updates to confirmed (real-time)
```

#### Instructor Confirmation Flow

```
Calendar page → See pending bookings (pulsing indicator)
  → Click pending booking
  → Side panel shows booking details + message thread
  → Click Confirm or Decline
  → Member sees status update (real-time)
```

#### Messaging Flow

```
Calendar page → See glowing booking slot (unread messages)
  → See preview banner above calendar ("Maria: Can we focus on...")
  → Click booking slot or banner [View]
  → Side panel opens with message thread
  → Type and send message
  → Other party sees glow + banner update (real-time)
```

### 4.2 Wireframes

#### Desktop Layout (1024px+)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Private Lessons                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ 💬 Maria (Thu Jan 15, 2pm): "Can we focus on cross-body…"  │    │
│  │                                              [View] [Dismiss]│    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌──────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐                 │
│  │[Ava] │ │  [Ava]   │ │  [Ava]   │ │   [Ava]    │                 │
│  │ All  │ │  Maria   │ │  Carlos  │ │  Jennifer  │                 │
│  └──────┘ └──────────┘ └──────────┘ └────────────┘                 │
│                                                                      │
│  ┌─────────────────────────────┐   ┌───────────────────────────┐    │
│  │      << February 2026 >>    │   │  Thu, Feb 5               │    │
│  │  Mon  Tue  Wed  Thu  Fri    │   │                           │    │
│  │   2    3●   4    5●   6     │   │  ┌─────────────────────┐  │    │
│  │   9   10●  11   12●  13    │   │  │ 2:00 PM - 3:00 PM   │  │    │
│  │  16   17●  18   19●  20    │   │  │ Available            │  │    │
│  │  23   24●  25   26●  27    │   │  └─────────────────────┘  │    │
│  │                             │   │  ┌─────────────────────┐  │    │
│  │  ● = available              │   │  │ 3:00 PM - 4:00 PM   │  │    │
│  │  ◉ = booked (yours)        │   │  │ ◉ Confirmed          │  │    │
│  │  🔴 = has unread message    │   │  └─────────────────────┘  │    │
│  └─────────────────────────────┘   │  ┌─────────────────────┐  │    │
│                                    │  │ 4:00 PM - 5:00 PM   │  │    │
│                                    │  │ Available            │  │    │
│                                    │  └─────────────────────┘  │    │
│                                    │  ┌─────────────────────┐  │    │
│                                    │  │ 5:00 PM - 6:00 PM   │  │    │
│                                    │  │ Available            │  │    │
│                                    │  └─────────────────────┘  │    │
│                                    └───────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

#### Mobile Layout (375px)

```
┌─────────────────────────┐
│ Private Lessons          │
├─────────────────────────┤
│ 💬 Maria: "Can we…"     │
│            [View]        │
├─────────────────────────┤
│ ◀ [Maria] [Carlos] ▶    │  ← horizontal scroll
├─────────────────────────┤
│    << February 2026 >>   │
│  M   T   W   T   F      │
│  2   3●  4   5●  6      │
│  9  10● 11  12● 13      │
│ 16  17● 18  19● 20      │
│ 23  24● 25  26● 27      │
└─────────────────────────┘
         │ tap date
         ▼
┌─────────────────────────┐
│ ═══════  (drag handle)   │  ← Drawer (bottom sheet)
│ Thu, Feb 5               │
│                          │
│ ┌──────────────────────┐ │
│ │ 2:00 PM - 3:00 PM   │ │
│ │ Available        [→] │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ 3:00 PM - 4:00 PM   │ │
│ │ ◉ Confirmed      [→] │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ 4:00 PM - 5:00 PM   │ │
│ │ Available        [→] │ │
│ └──────────────────────┘ │
└─────────────────────────┘
```

#### Booking Detail / Message Thread (Sheet)

```
┌───────────────────────────────┐
│ ← Back         Private Lesson  │
├───────────────────────────────┤
│ Salsa On2 with Maria          │
│ Thu Feb 5, 2:00 - 3:00 PM    │
│ Status: ● Confirmed           │
│                    [Cancel]    │
├───────────────────────────────┤
│                                │
│  Maria (Feb 3, 3:15 PM)       │
│  ┌─────────────────────────┐  │
│  │ Can we focus on cross-  │  │
│  │ body lead this week?    │  │
│  └─────────────────────────┘  │
│                                │
│       You (Feb 3, 4:02 PM)    │
│  ┌─────────────────────────┐  │
│  │ Absolutely! I'll prep   │  │
│  │ some drills for that.   │  │
│  └─────────────────────────┘  │
│                                │
│  Maria (Feb 4, 10:30 AM)      │
│  ┌─────────────────────────┐  │
│  │ Perfect, see you then!  │  │
│  └─────────────────────────┘  │
│                                │
├───────────────────────────────┤
│ ┌───────────────────────┐  ➤  │
│ │ Type a message...      │     │
│ └───────────────────────┘     │
└───────────────────────────────┘
```

### 4.3 Component Inventory

| Component | Source | Role |
|-----------|--------|------|
| Calendar | shadcn/ui (react-day-picker) | Month grid with custom day rendering |
| Card | shadcn/ui | Containers for calendar panel, slot list, message banner |
| Dialog | shadcn/ui | Booking confirmation (desktop) |
| Drawer | shadcn/ui (Vaul) | Time slot panel (mobile) |
| Sheet | shadcn/ui | Booking detail + message thread (desktop side panel) |
| ToggleGroup | shadcn/ui | Instructor selector (single-select pills) |
| Avatar | shadcn/ui | Instructor photos |
| Badge | shadcn/ui | Status indicators (pending, confirmed) |
| ScrollArea | shadcn/ui | Horizontal scroll for instructor pills, message thread |
| Skeleton | shadcn/ui | Loading states |
| Textarea | shadcn/ui | Message input |
| Button | shadcn/ui | Send, confirm, decline, cancel actions |

### 4.4 Interaction Design

| Interaction | Behavior |
|-------------|----------|
| Switch instructor | Calendar reactively updates; Realtime subscription reconnects for new instructor |
| Click available date | Desktop: time slot panel appears to the right. Mobile: bottom drawer slides up |
| Click available slot | Confirmation dialog: "Request lesson with [Instructor] on [Date] at [Time]?" |
| Confirm request | Booking created as pending. Slot shows "Pending" indicator. Instructor sees request in real-time |
| Instructor confirms | Slot turns to "Confirmed" for both parties in real-time |
| Instructor declines | Slot freed. Member sees "Declined" notification in real-time |
| Booking has unread message | Slot cell gets `animate-glow` (pulsing box-shadow). Banner appears above calendar |
| Click glowing slot or banner | Sheet opens with booking detail + message thread. Messages marked as read. Glow clears |
| Send message | Message appears instantly for sender. Recipient sees glow + banner in real-time |
| Cancel booking | Confirmation dialog. On confirm: status → cancelled, slot freed, other party notified |

### 4.5 Glow Animation

Custom Tailwind v4 animation in `globals.css`:

```css
@theme inline {
  --animate-glow: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 2px var(--color-primary), 0 0 4px rgba(239, 68, 68, 0.2);
  }
  50% {
    box-shadow: 0 0 8px var(--color-primary), 0 0 16px rgba(239, 68, 68, 0.3);
  }
}
```

Applied with `motion-safe:animate-glow` to respect `prefers-reduced-motion`.

---

## 5. Technical Design

### 5.1 Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Calendar page rendering | Server Component fetches initial data, Client Component for interactivity | Fast initial load + real-time updates |
| State management | `useReducer` in `CalendarView` | Multiple related state pieces updated by Realtime events |
| Real-time | Supabase Realtime (Postgres Changes) | Built-in, no extra infrastructure. Single channel with multiple `.on()` listeners |
| Booking slot visibility | Multiple pending requests allowed per slot | Cal.com model — lock on confirmation, not on request. Better UX for small studio |
| Double-booking prevention | GIST exclusion constraint on confirmed bookings | Database-level guarantee. Pending bookings are not constrained |
| Instructor selector | ToggleGroup + Avatar pills in ScrollArea | All instructors visible, accessible, single-select semantics |
| Detail panel | Sheet (desktop) / Drawer (mobile) | Non-modal interaction, keeps calendar visible |
| Messaging | Dedicated `booking_messages` table | Clean separation from DMs. Lean schema. Independent RLS |
| Unread tracking | `booking_message_reads` with `last_read_at` per booking per member | Binary "has unread?" is all the glow needs. Tiny table, single upsert to mark read |

### 5.2 Database Changes

#### New Extension

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

#### New Enums

```sql
CREATE TYPE booking_status AS ENUM (
  'pending',
  'confirmed',
  'declined',
  'expired',
  'cancelled_by_member',
  'cancelled_by_instructor',
  'completed',
  'no_show'
);
```

#### New Tables

**`instructor_availability`** — Recurring weekly time windows

```sql
CREATE TABLE instructor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INT NOT NULL DEFAULT 60,
  is_active BOOLEAN DEFAULT TRUE,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE, -- NULL = indefinite
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_time_range CHECK (start_time < end_time),
  UNIQUE (instructor_id, day_of_week, start_time)
);

CREATE INDEX idx_instructor_avail_instructor
  ON instructor_availability(instructor_id);
```

**`availability_overrides`** — Date-specific blocks or extra availability

```sql
CREATE TABLE availability_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  start_time TIME,           -- NULL = entire day blocked
  end_time TIME,
  is_available BOOLEAN NOT NULL DEFAULT FALSE, -- false=blocked, true=extra
  reason TEXT,
  slot_duration_minutes INT DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (instructor_id, override_date, start_time)
);

CREATE INDEX idx_avail_overrides_instructor
  ON availability_overrides(instructor_id, override_date);
```

**`private_lesson_bookings`** — Individual lesson bookings

```sql
CREATE TABLE private_lesson_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES members(id),
  member_id UUID NOT NULL REFERENCES members(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  notes TEXT, -- optional note submitted at booking time

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES members(id),
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_booking_time CHECK (end_time > start_time),

  -- Database-level double-booking prevention (confirmed bookings only)
  CONSTRAINT no_instructor_overlap EXCLUDE USING GIST (
    instructor_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  ) WHERE (status = 'confirmed')
);

CREATE INDEX idx_bookings_instructor ON private_lesson_bookings(instructor_id);
CREATE INDEX idx_bookings_member ON private_lesson_bookings(member_id);
CREATE INDEX idx_bookings_start ON private_lesson_bookings(start_time);
CREATE INDEX idx_bookings_status ON private_lesson_bookings(status);
```

**`booking_messages`** — Per-booking message thread

```sql
CREATE TABLE booking_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES private_lesson_bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES members(id),
  -- NOTE: No ON DELETE CASCADE/SET NULL. Member deletion is blocked by
  -- private_lesson_bookings FK (intentional — admin must cancel bookings first).
  -- Messages are always tied to an existing member.
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_booking_messages_booking
  ON booking_messages(booking_id, created_at ASC);
CREATE INDEX idx_booking_messages_sender
  ON booking_messages(sender_id);

-- Required for Realtime `in` filter on non-PK column
ALTER TABLE booking_messages REPLICA IDENTITY FULL;
```

**`booking_message_reads`** — Unread tracking per booking per member

```sql
CREATE TABLE booking_message_reads (
  booking_id UUID NOT NULL REFERENCES private_lesson_bookings(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (booking_id, member_id)
);
```

#### Triggers

```sql
-- updated_at trigger for new tables
CREATE TRIGGER instructor_availability_updated_at
  BEFORE UPDATE ON instructor_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER private_lesson_bookings_updated_at
  BEFORE UPDATE ON private_lesson_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enforce valid booking status transitions
CREATE OR REPLACE FUNCTION check_booking_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status = 'pending' AND NEW.status IN (
        'confirmed', 'declined', 'expired', 'cancelled_by_member', 'cancelled_by_instructor'))
  OR (OLD.status = 'confirmed' AND NEW.status IN (
        'completed', 'cancelled_by_member', 'cancelled_by_instructor', 'no_show'))
  THEN
    RETURN NEW;
  ELSE
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_booking_transition
  BEFORE UPDATE OF status ON private_lesson_bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_booking_transition();
```

### 5.3 Database Functions

**`get_available_slots()`** — Generate concrete time slots from availability rules

```sql
CREATE OR REPLACE FUNCTION get_available_slots(
  p_instructor_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  slot_start TIMESTAMPTZ,
  slot_end TIMESTAMPTZ
) AS $$
BEGIN
  -- NOTE: Single-timezone assumption. All TIME values in instructor_availability
  -- and all AT TIME ZONE conversions assume 'America/New_York'.
  -- For multi-timezone support, add a timezone column to instructor_availability.

  RETURN QUERY
  WITH date_series AS (
    SELECT d::DATE AS day
    FROM generate_series(p_start_date::TIMESTAMP, p_end_date::TIMESTAMP, '1 day') d
  ),
  -- Availability windows (one row per instructor_availability rule per matching day)
  avail_windows AS (
    SELECT
      ds.day,
      ia.start_time AS win_start,
      ia.end_time AS win_end,
      ia.slot_duration_minutes
    FROM date_series ds
    CROSS JOIN instructor_availability ia
    WHERE ia.instructor_id = p_instructor_id
      AND ia.is_active = TRUE
      AND EXTRACT(dow FROM ds.day) = ia.day_of_week
      AND ds.day >= ia.effective_from
      AND (ia.effective_until IS NULL OR ds.day <= ia.effective_until)
      -- Exclude days blocked by overrides (full-day block)
      AND NOT EXISTS (
        SELECT 1 FROM availability_overrides ao
        WHERE ao.instructor_id = p_instructor_id
          AND ao.override_date = ds.day
          AND ao.is_available = FALSE
          AND ao.start_time IS NULL
      )
  ),
  -- Expand each availability window into individual slots using generate_series
  weekly_slots AS (
    SELECT
      (aw.day + slot_time) AT TIME ZONE 'America/New_York' AS slot_start,
      (aw.day + slot_time + (aw.slot_duration_minutes || ' minutes')::INTERVAL)
        AT TIME ZONE 'America/New_York' AS slot_end
    FROM avail_windows aw
    CROSS JOIN LATERAL generate_series(
      aw.win_start,
      aw.win_end - (aw.slot_duration_minutes || ' minutes')::INTERVAL,
      (aw.slot_duration_minutes || ' minutes')::INTERVAL
    ) AS slot_time
    -- Exclude individual slots blocked by time-specific overrides
    WHERE NOT EXISTS (
      SELECT 1 FROM availability_overrides ao
      WHERE ao.instructor_id = p_instructor_id
        AND ao.override_date = aw.day
        AND ao.is_available = FALSE
        AND ao.start_time IS NOT NULL
        AND slot_time >= ao.start_time
        AND slot_time < ao.end_time
    )
  ),
  -- Extra availability from overrides (also expanded into slots)
  extras AS (
    SELECT
      (ao.override_date + slot_time) AT TIME ZONE 'America/New_York' AS slot_start,
      (ao.override_date + slot_time + (ao.slot_duration_minutes || ' minutes')::INTERVAL)
        AT TIME ZONE 'America/New_York' AS slot_end
    FROM availability_overrides ao
    CROSS JOIN LATERAL generate_series(
      ao.start_time,
      ao.end_time - (ao.slot_duration_minutes || ' minutes')::INTERVAL,
      (ao.slot_duration_minutes || ' minutes')::INTERVAL
    ) AS slot_time
    WHERE ao.instructor_id = p_instructor_id
      AND ao.is_available = TRUE
      AND ao.override_date BETWEEN p_start_date AND p_end_date
      AND ao.start_time IS NOT NULL
  ),
  all_slots AS (
    SELECT slot_start, slot_end FROM weekly_slots
    UNION ALL
    SELECT slot_start, slot_end FROM extras
  )
  -- Exclude slots that overlap with CONFIRMED bookings only.
  -- Pending bookings do NOT block slots (multiple pending requests allowed per slot).
  SELECT s.slot_start, s.slot_end
  FROM all_slots s
  WHERE NOT EXISTS (
    SELECT 1 FROM private_lesson_bookings b
    WHERE b.instructor_id = p_instructor_id
      AND b.status = 'confirmed'
      AND tstzrange(b.start_time, b.end_time) && tstzrange(s.slot_start, s.slot_end)
  )
  -- Only future slots
  AND s.slot_start > NOW()
  ORDER BY s.slot_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**`create_booking()`** — Member creates a pending booking request (SECURITY DEFINER bypasses RLS)

```sql
CREATE OR REPLACE FUNCTION create_booking(
  p_instructor_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_member_id UUID;
  v_role TEXT;
  v_booking_id UUID;
BEGIN
  -- Resolve current user to member
  SELECT m.id, r.name INTO v_member_id, v_role
  FROM members m JOIN roles r ON m.role_id = r.id
  WHERE m.user_id = auth.uid();

  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Guests cannot book
  IF v_role = 'guest' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Guests cannot book private lessons');
  END IF;

  -- Cannot book yourself
  IF v_member_id = p_instructor_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot book a lesson with yourself');
  END IF;

  -- Verify instructor exists and has instructor/owner role
  IF NOT EXISTS (
    SELECT 1 FROM members m JOIN roles r ON m.role_id = r.id
    WHERE m.id = p_instructor_id AND r.name IN ('instructor', 'owner')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Instructor not found');
  END IF;

  -- Verify slot is in the future
  IF p_start_time <= NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot book a slot in the past');
  END IF;

  -- Validate the requested time falls within instructor availability.
  -- The slot must match an output row from get_available_slots().
  IF NOT EXISTS (
    SELECT 1 FROM get_available_slots(p_instructor_id, p_start_time::DATE, p_start_time::DATE) gs
    WHERE gs.slot_start = p_start_time AND gs.slot_end = p_end_time
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Requested time is not an available slot');
  END IF;

  -- Best-effort check for existing confirmed booking (soft UX guard).
  -- NOTE: This is a TOCTOU check — between this SELECT and the INSERT below,
  -- another transaction could confirm a booking for this slot. This is acceptable
  -- because pending bookings are intentionally allowed alongside confirmed ones.
  -- The real guard is the GIST exclusion constraint enforced at confirm_booking() time.
  IF EXISTS (
    SELECT 1 FROM private_lesson_bookings
    WHERE instructor_id = p_instructor_id
      AND status = 'confirmed'
      AND tstzrange(start_time, end_time) && tstzrange(p_start_time, p_end_time)
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This slot is already confirmed');
  END IF;

  INSERT INTO private_lesson_bookings (instructor_id, member_id, start_time, end_time, notes)
  VALUES (p_instructor_id, v_member_id, p_start_time, p_end_time, p_notes)
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object('success', true, 'booking_id', v_booking_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**`confirm_booking()`** — Atomic confirmation with auto-decline of competing requests

```sql
CREATE OR REPLACE FUNCTION confirm_booking(
  p_booking_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_booking private_lesson_bookings%ROWTYPE;
  v_caller_member_id UUID;
  v_caller_role TEXT;
BEGIN
  -- Resolve caller from auth.uid() (not caller-supplied)
  SELECT m.id, r.name INTO v_caller_member_id, v_caller_role
  FROM members m JOIN roles r ON m.role_id = r.id
  WHERE m.user_id = auth.uid();

  -- Lock the row
  SELECT * INTO v_booking
  FROM private_lesson_bookings
  WHERE id = p_booking_id
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found or not pending');
  END IF;

  -- Verify caller is the booking's instructor or the owner
  IF v_booking.instructor_id != v_caller_member_id AND v_caller_role != 'owner' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized to confirm this booking');
  END IF;

  -- Attempt to confirm — GIST exclusion constraint rejects if overlap
  BEGIN
    UPDATE private_lesson_bookings
    SET status = 'confirmed', updated_at = NOW()
    WHERE id = p_booking_id;
  EXCEPTION
    WHEN exclusion_violation THEN
      RETURN jsonb_build_object('success', false, 'error', 'Time slot already confirmed for another booking');
  END;

  -- Auto-decline other pending bookings for the same instructor + overlapping time
  UPDATE private_lesson_bookings
  SET status = 'declined', updated_at = NOW()
  WHERE instructor_id = v_booking.instructor_id
    AND id != p_booking_id
    AND status = 'pending'
    AND tstzrange(start_time, end_time) && tstzrange(v_booking.start_time, v_booking.end_time);

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**`cancel_booking()`** — Enforces 24-hour rule for members

```sql
CREATE OR REPLACE FUNCTION cancel_booking(
  p_booking_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_booking private_lesson_bookings%ROWTYPE;
  v_caller_member_id UUID;
  v_caller_role TEXT;
BEGIN
  -- Resolve caller from auth.uid() (not caller-supplied)
  SELECT m.id, r.name INTO v_caller_member_id, v_caller_role
  FROM members m JOIN roles r ON m.role_id = r.id
  WHERE m.user_id = auth.uid();

  SELECT * INTO v_booking
  FROM private_lesson_bookings
  WHERE id = p_booking_id
    AND status IN ('pending', 'confirmed')
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found or not cancellable');
  END IF;

  -- Case 1: Booking's instructor cancels (no time restriction)
  -- Checked first so instructor-as-member falls through to Case 3 correctly
  IF v_booking.instructor_id = v_caller_member_id THEN
    UPDATE private_lesson_bookings
    SET status = 'cancelled_by_instructor',
        cancelled_at = NOW(),
        cancelled_by = v_caller_member_id,
        cancellation_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_booking_id;

  -- Case 2: Owner cancels any booking (no time restriction)
  ELSIF v_caller_role = 'owner' THEN
    UPDATE private_lesson_bookings
    SET status = 'cancelled_by_instructor',
        cancelled_at = NOW(),
        cancelled_by = v_caller_member_id,
        cancellation_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_booking_id;

  -- Case 3: Booking's member cancels (any role — includes instructors booking with other instructors)
  -- Pending bookings: always cancellable (withdraw the request)
  -- Confirmed bookings: enforce 24-hour rule
  ELSIF v_booking.member_id = v_caller_member_id THEN
    IF v_booking.status = 'confirmed'
       AND v_booking.start_time <= NOW() + INTERVAL '24 hours' THEN
      RETURN jsonb_build_object('success', false, 'error',
        'Cannot cancel within 24 hours of start time. Contact your instructor.');
    END IF;
    UPDATE private_lesson_bookings
    SET status = 'cancelled_by_member',
        cancelled_at = NOW(),
        cancelled_by = v_caller_member_id,
        cancellation_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_booking_id;

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized to cancel this booking');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**`decline_booking()`** — Instructor or owner declines a pending request

```sql
CREATE OR REPLACE FUNCTION decline_booking(
  p_booking_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_booking private_lesson_bookings%ROWTYPE;
  v_caller_member_id UUID;
  v_caller_role TEXT;
BEGIN
  -- Resolve caller from auth.uid()
  SELECT m.id, r.name INTO v_caller_member_id, v_caller_role
  FROM members m JOIN roles r ON m.role_id = r.id
  WHERE m.user_id = auth.uid();

  SELECT * INTO v_booking
  FROM private_lesson_bookings
  WHERE id = p_booking_id
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found or not pending');
  END IF;

  -- Only the booking's instructor or owner can decline
  IF v_booking.instructor_id != v_caller_member_id AND v_caller_role != 'owner' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized to decline this booking');
  END IF;

  UPDATE private_lesson_bookings
  SET status = 'declined',
      cancellation_reason = p_reason,
      updated_at = NOW()
  WHERE id = p_booking_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Auto-Expiry Cron** — Expires stale pending bookings after 4 hours

API route called by Vercel Cron every 15 minutes:

```
// vercel.json
{ "crons": [{ "path": "/api/cron/expire-bookings", "schedule": "*/15 * * * *" }] }
```

```typescript
// app/api/cron/expire-bookings/route.ts
// Secured via CRON_SECRET env var (Vercel injects automatically for cron routes)
export async function GET(request: Request) {
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createServiceRoleClient(); // service_role bypasses RLS

  const { data, error } = await supabase
    .from('private_lesson_bookings')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('status', 'pending')
    .lt('created_at', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
    .select('id');

  return Response.json({ expired: data?.length ?? 0, error });
}
```

> **Note:** Vercel Hobby plan supports cron jobs with a minimum 1/day interval. The 15-minute schedule requires Vercel Pro ($20/mo). Alternatively, use Supabase `pg_cron` extension if available on your plan.

### 5.4 RLS Policies

```sql
ALTER TABLE instructor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_lesson_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_message_reads ENABLE ROW LEVEL SECURITY;

-- instructor_availability: anyone authenticated can read
CREATE POLICY "Anyone can view availability" ON instructor_availability
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Instructors manage own availability, owner manages all
CREATE POLICY "Instructors manage own availability" ON instructor_availability
  FOR ALL USING (
    instructor_id = get_current_member_id()
    OR EXISTS (
      SELECT 1 FROM members m JOIN roles r ON m.role_id = r.id
      WHERE m.user_id = auth.uid() AND r.name = 'owner'
    )
  );

-- availability_overrides: anyone authenticated can read dates
CREATE POLICY "Anyone can view overrides" ON availability_overrides
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Instructors manage own overrides, owner manages all
CREATE POLICY "Instructors manage own overrides" ON availability_overrides
  FOR ALL USING (
    instructor_id = get_current_member_id()
    OR EXISTS (
      SELECT 1 FROM members m JOIN roles r ON m.role_id = r.id
      WHERE m.user_id = auth.uid() AND r.name = 'owner'
    )
  );

-- private_lesson_bookings: participants see own bookings, staff see all
CREATE POLICY "View own bookings" ON private_lesson_bookings
  FOR SELECT USING (
    member_id = get_current_member_id()
    OR instructor_id = get_current_member_id()
    OR is_staff()
  );

-- Members create bookings via RPC (confirm/cancel also via RPC)
-- Direct INSERT/UPDATE is intentionally blocked for members.
CREATE POLICY "Staff manage bookings" ON private_lesson_bookings
  FOR ALL USING (is_staff());

-- booking_messages: booking participants can read and send
CREATE POLICY "Booking participants view messages" ON booking_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM private_lesson_bookings b
      WHERE b.id = booking_messages.booking_id
      AND (b.member_id = get_current_member_id()
           OR b.instructor_id = get_current_member_id())
    )
    OR is_staff()
  );

CREATE POLICY "Booking participants send messages" ON booking_messages
  FOR INSERT WITH CHECK (
    sender_id = get_current_member_id()
    AND EXISTS (
      SELECT 1 FROM private_lesson_bookings b
      WHERE b.id = booking_messages.booking_id
      AND (b.member_id = get_current_member_id()
           OR b.instructor_id = get_current_member_id())
    )
  );

-- booking_message_reads: members manage own read markers
CREATE POLICY "Members manage own read markers" ON booking_message_reads
  FOR ALL USING (member_id = get_current_member_id());
```

### 5.5 Supabase Realtime

**Single channel with multiple listeners**, filtered by instructor when applicable:

```typescript
// hooks/useCalendarRealtime.ts
const channel = supabase
  .channel(`calendar-${instructorId}`)
  .on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "private_lesson_bookings",
    filter: `instructor_id=eq.${instructorId}`,
  }, onBookingChange)
  .on("postgres_changes", {
    event: "INSERT",
    schema: "public",
    table: "booking_messages",
    filter: `booking_id=in.(${activeBookingIds.join(",")})`,
  }, onNewMessage)
  .subscribe();
```

When instructor selection changes, the old channel is torn down and a new one created via `useEffect` cleanup.

**Replication required:** Enable replication for `private_lesson_bookings`, `booking_messages`, `instructor_availability`, and `availability_overrides` in Supabase Dashboard → Database → Replication.

### 5.6 Component Architecture

```
app/(member)/calendar/
  page.tsx                     -- Server Component: fetch initial data
  CalendarView.tsx             -- "use client": orchestrates state via useReducer
  InstructorSelector.tsx       -- "use client": ToggleGroup + Avatar pills
  MonthCalendar.tsx            -- "use client": shadcn Calendar + custom DayButton
  TimeSlotPanel.tsx            -- "use client": slot list for selected date
  TimeSlotDrawer.tsx           -- "use client": Drawer wrapper (mobile)
  TimeSlotSheet.tsx            -- "use client": Sheet wrapper (desktop)
  MessageBanner.tsx            -- "use client": unread message preview banner
  BookingDetailSheet.tsx       -- "use client": booking info + message thread
  BookingConfirmDialog.tsx     -- "use client": confirm booking request
  hooks/
    useCalendarRealtime.ts     -- Supabase Realtime subscriptions
    useCalendarState.ts        -- useReducer for calendar state
    useBookingMessages.ts      -- Realtime for booking messages
```

**Data flow:**
1. `page.tsx` fetches instructors + current month events via Supabase server client
2. Passes `initialData` as props to `CalendarView`
3. `CalendarView` initializes `useCalendarState` reducer and connects Realtime hooks
4. Instructor change → new data fetch + Realtime reconnection
5. Reducer derives `availableDates`, `bookedDates`, `unreadDates` modifiers for Calendar
6. Date click → opens `TimeSlotSheet` (desktop) or `TimeSlotDrawer` (mobile)
7. Slot click → `BookingConfirmDialog`
8. Booking slot with messages → `BookingDetailSheet` with thread

### 5.7 Dependencies

| Package | Purpose | Install |
|---------|---------|---------|
| react-day-picker | Calendar grid (via shadcn Calendar) | Auto with `npx shadcn@latest add calendar` |
| date-fns | Date manipulation (peer dep of react-day-picker) | Auto with calendar |
| vaul | Bottom drawer (via shadcn Drawer) | Auto with `npx shadcn@latest add drawer` |

No new npm packages beyond shadcn/ui component dependencies.

---

## 6. API Contracts

### 6.1 Availability Management (Instructor/Admin)

**GET `/api/availability/:instructorId`**
```
Auth: authenticated
Response: { weekly: InstructorAvailability[], overrides: AvailabilityOverride[] }
```

**POST `/api/availability`**
```
Auth: own instructor or owner (RLS enforced)
Body: { instructor_id, day_of_week, start_time, end_time, slot_duration_minutes }
Response: { data: InstructorAvailability }
Error: 403 if not authorized, 409 if duplicate slot
```

**DELETE `/api/availability/:id`**
```
Auth: own instructor or owner (RLS enforced)
Response: { success: true }
Side effect: auto-declines pending bookings whose slots no longer exist
```

**POST `/api/availability/overrides`**
```
Auth: own instructor or owner (RLS enforced)
Body: { instructor_id, override_date, start_time?, end_time?, is_available, reason? }
Response: { data: AvailabilityOverride }
```

**DELETE `/api/availability/overrides/:id`**
```
Auth: own instructor or owner (RLS enforced)
Response: { success: true }
```

### 6.2 Slots (Read-Only)

**GET `/api/slots/:instructorId?start=DATE&end=DATE`**
```
Auth: authenticated (member_full, member_limited, instructor, owner)
Response: { slots: { slot_start: string, slot_end: string }[] }
Calls: get_available_slots() RPC
```

### 6.3 Bookings

**POST `/api/bookings`**
```
Auth: authenticated (not guest)
Body: { instructor_id, start_time, end_time, notes? }
Calls: create_booking() RPC (SECURITY DEFINER — resolves member from auth.uid())
Response: { success: true, booking_id: UUID }
Error: 403 if guest, 409 if slot already confirmed
```

**POST `/api/bookings/:id/confirm`**
```
Auth: instructor (must be booking's instructor) or owner
Response: { success: true }
Calls: confirm_booking() RPC
Error: 409 if slot already confirmed for another booking
```

**POST `/api/bookings/:id/decline`**
```
Auth: booking's instructor or owner (resolved via auth.uid() inside RPC)
Body: { reason? }
Calls: decline_booking() RPC (SECURITY DEFINER)
Response: { success: true }
```

**POST `/api/bookings/:id/cancel`**
```
Auth: booking participant (resolved via auth.uid() inside RPC)
Body: { reason? }
Calls: cancel_booking() RPC (SECURITY DEFINER — resolves caller from auth.uid())
Error: 403 if member cancelling confirmed booking within 24-hour window
Note: Pending bookings can always be cancelled by the requesting member
```

**GET `/api/bookings?instructor_id=UUID&start=DATE&end=DATE`**
```
Auth: authenticated
Response: { data: Booking[] }
Note: RLS filters to own bookings for members, all for staff
```

### 6.4 Booking Messages

**GET `/api/bookings/:id/messages`**
```
Auth: booking participant or staff
Response: { messages: BookingMessage[], hasUnread: boolean }
Side effect: upserts booking_message_reads.last_read_at
```

**POST `/api/bookings/:id/messages`**
```
Auth: booking participant
Body: { content: string }
Response: { data: BookingMessage }
Error: 400 if content > 2000 chars
```

**GET `/api/bookings/unread`**
```
Auth: authenticated
Response: { unread: { booking_id, latest_message, latest_message_at, sender_name }[] }
Used by: MessageBanner component
```

### 6.5 Instructors List

**GET `/api/instructors`**
```
Auth: authenticated
Response: { instructors: { id, display_name, avatar_url }[] }
Note: Returns members with instructor or owner role
```

---

## 7. Edge Cases

### 7.1 Concurrency

| Scenario | Likelihood | Impact | Solution |
|----------|-----------|--------|----------|
| Two members book the same slot simultaneously | Occasional | Moderate | Both create pending bookings. Instructor confirms one; `confirm_booking()` auto-declines the other. GIST constraint prevents double-confirm. |
| Instructor confirms while member cancels | Rare | Minor | `FOR UPDATE` lock serializes the operations. Whichever runs first wins. |
| Two instructors try to confirm the same booking | N/A | N/A | Bookings have one instructor. This can't happen. |

### 7.2 Timing

| Scenario | Likelihood | Impact | Solution |
|----------|-----------|--------|----------|
| Member tries to cancel at exactly 24 hours before | Occasional | Minor | Database uses `>` comparison (strict). At exactly 24 hours, cancellation is blocked. |
| Pending booking sits for days (instructor ignores) | Occasional | Moderate | 4-hour auto-expiry via cron. Member gets clear feedback. |
| Member books a slot in the past (clock drift) | Rare | Minor | `get_available_slots()` filters `slot_start > NOW()`. API also validates. |

### 7.3 Data Integrity

| Scenario | Likelihood | Impact | Solution |
|----------|-----------|--------|----------|
| Member account deleted with active bookings | Rare | Moderate | `ON DELETE CASCADE` on booking_messages. Bookings use `REFERENCES members(id)` without CASCADE — deletion blocked if bookings exist. Admin must cancel bookings first. |
| Instructor removes availability with pending bookings | Occasional | Moderate | API route auto-declines pending bookings whose slots no longer exist when availability is removed. |
| Message sent to completed/cancelled booking | Frequent | Minor | Allowed by design. Members may want to discuss a past lesson. |

### 7.4 Network / Browser

| Scenario | Likelihood | Impact | Solution |
|----------|-----------|--------|----------|
| Realtime connection drops | Occasional | Moderate | Supabase client auto-reconnects. On reconnect, refetch current month data to catch missed events. |
| Slow network: double-click on book button | Frequent | Minor | Disable button on click. API is idempotent (check for existing pending booking before creating). |
| User opens calendar in two tabs | Occasional | Minor | Both tabs subscribe to Realtime. State stays in sync. |

### 7.5 Permission

| Scenario | Likelihood | Impact | Solution |
|----------|-----------|--------|----------|
| Guest tries to book | Occasional | Minor | API checks role. Returns 403. UI hides booking action for guests. |
| Member tries to book themselves (is also instructor) | Rare | Minor | Allowed — an instructor could book a lesson with another instructor. Self-booking (same person as both instructor and member) blocked by API check. |
| Subscription expires mid-booking | Rare | Minor | Existing confirmed bookings remain valid. New bookings check role at creation time. |

---

## 8. Acceptance Criteria

### Functional

**Instructor Availability**
- Given an instructor is logged in, when they set weekly availability for Tuesday 2-6pm, then members see Tuesday slots on the calendar
- Given an instructor blocks Feb 14, when a member views that instructor's February calendar, then Feb 14 shows no available slots
- Given an instructor has availability set, when they delete a time window, then pending bookings for deleted slots are auto-declined

**Member Booking**
- Given a member views the calendar, when they switch instructors via the selector, then the calendar updates to show that instructor's availability within 500ms
- Given a member clicks an available date, when the time slot panel opens, then all available slots for that date are listed
- Given a member selects a slot and confirms, when the booking is created, then it appears as "Pending" on the calendar immediately
- Given a member has a confirmed booking > 24 hours away, when they click Cancel, then the booking is cancelled and the slot is freed
- Given a member has a confirmed booking < 24 hours away, when they try to cancel, then they see "Contact your instructor" and cancellation is blocked

**Instructor Confirmation**
- Given an instructor has a pending request, when they click Confirm, then the booking status changes to "Confirmed" and the member sees the update in real-time
- Given an instructor declines a request, when the decline is processed, then the slot becomes available again and the member is notified
- Given two pending requests for the same slot, when the instructor confirms one, then the other is auto-declined

**Messaging**
- Given a booking exists, when either party sends a message, then the other party sees a glow on the booking slot within 2 seconds
- Given a booking has unread messages, when the member views the calendar, then a preview banner appears above the calendar
- Given a user clicks a glowing booking slot, when the message thread opens, then all messages are displayed and the glow clears

### Non-Functional

- Calendar page loads initial data in < 2 seconds
- Instructor switching updates calendar in < 500ms
- Real-time updates (bookings, messages) visible within 2 seconds
- Works on mobile 375px width
- Keyboard accessible (arrow keys navigate calendar, Enter selects, Escape closes panels)
- No console errors in normal operation

### Definition of Done

1. All acceptance criteria pass
2. Code reviewed
3. Deployed to preview
4. Tested on mobile device
5. Owner sign-off
