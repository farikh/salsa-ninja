# Calendar & Scheduling Architecture

Comprehensive architecture document for the Calendar & Scheduling feature of the Salsa Ninja dance studio platform. This feature spans Roadmap Phases 0, 1, 2, and 5.

> **Status:** Reviewed (3 rounds). Round 1: 1 CRITICAL + 7 HIGH fixed. Round 2: 2 HIGH fixed. Round 3: Clean pass.

**Related specs:**
- [Database Schema](../database-schema.md) -- existing tables, enums, helper functions
- [Auth & Roles](../auth-and-roles.md) -- role matrix, auth flows
- [API Endpoints](../api-endpoints.md) -- existing route tree
- [Calendar Feature Spec](./calendar.md) -- high-level feature requirements

---

## Table of Contents

1. [Overview & Scope](#1-overview--scope)
2. [Enhanced Database Schema](#2-enhanced-database-schema)
3. [Database Functions & Triggers](#3-database-functions--triggers)
4. [RLS Policies](#4-rls-policies)
5. [Recurring Events Architecture](#5-recurring-events-architecture)
6. [Private Lesson Booking Flow](#6-private-lesson-booking-flow)
7. [RSVP, Capacity & Waitlist System](#7-rsvp-capacity--waitlist-system)
8. [QR Check-In & Attendance](#8-qr-check-in--attendance)
9. [Google Calendar & iCal Integration](#9-google-calendar--ical-integration)
10. [UI Component Architecture](#10-ui-component-architecture)
11. [API Route Architecture](#11-api-route-architecture)
12. [npm Dependencies](#12-npm-dependencies)
13. [Implementation Phases](#13-implementation-phases)
14. [Cost Projections](#14-cost-projections)
15. [Open Questions (Deferred)](#15-open-questions-deferred)

---

## 1. Overview & Scope

The calendar system serves as the central scheduling hub for the studio, covering recurring class schedules, one-off events, private lesson bookings, attendance tracking, and external calendar integrations.

### Phase-to-Feature Mapping

| Phase | Features | Dependencies |
|-------|----------|--------------|
| **Phase 0 -- Demo** | Class schedule management, recurring event series, event announcements (display only), basic calendar views (month/week/day/list) | `event_series` enhancements, `events` modifications, recurring event generation |
| **Phase 1 -- Core** | Private lesson scheduling, instructor availability (3 instructors), Google Calendar integration, booking flow, lesson payments (Stripe) | `instructor_availability`, `availability_overrides`, `private_lesson_bookings`, `google_oauth_tokens` tables; Stripe Checkout |
| **Phase 2 -- Content** | Group class check-in/attendance, QR code registration (studio-wide + per-class), class enrollment self-management | `check_ins` table, `checkin_method` enum, HMAC-signed QR tokens |
| **Phase 5 -- Events** | Integrated event management, RSVP with capacity/waitlist auto-promotion, event payments, notification queue | `rsvp_to_event()` RPC, `promote_from_waitlist()` trigger, `notification_queue`, paid event flow |

### Data Flow Overview

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Admin UI       │     │   Member UI      │     │   Public Site    │
│  (create/edit)   │     │  (RSVP/book/     │     │  (/schedule)     │
│                  │     │   check-in)      │     │                  │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                        │                         │
         ▼                        ▼                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Next.js API Routes                              │
│  /api/events  /api/series  /api/bookings  /api/checkin  /api/cal   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    Supabase     │ │     Stripe      │ │  Google Calendar │
│  PostgreSQL     │ │  Checkout +     │ │  API (OAuth2)    │
│  + RLS + RPCs   │ │  Webhooks       │ │  One-way push    │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 2. Enhanced Database Schema

All modifications and new tables required for the calendar system. Existing tables from [database-schema.md](../database-schema.md) are modified in-place; new tables are created alongside them.

### 2.1 New Enums

```sql
-- Check-in method for attendance tracking (Phase 2)
CREATE TYPE checkin_method AS ENUM (
  'qr_self',         -- Member scans per-class QR code
  'qr_instructor',   -- Instructor scans member's personal QR
  'manual',          -- Instructor manually marks attendance
  'studio_qr'        -- Member scans studio-wide QR (time-window resolution)
);

-- Add pending_payment to existing rsvp_status enum (Phase 5)
ALTER TYPE rsvp_status ADD VALUE 'pending_payment';
```

### 2.2 Modified `event_series` Table

Adds default values for generated event instances so series carry full template data.

```sql
ALTER TABLE event_series
  ADD COLUMN timezone TEXT DEFAULT 'America/New_York',
  ADD COLUMN default_start_time TIME NOT NULL DEFAULT '19:00',
  ADD COLUMN default_end_time TIME NOT NULL DEFAULT '20:00',
  ADD COLUMN default_duration INTERVAL,
  ADD COLUMN event_type event_type NOT NULL DEFAULT 'class',
  ADD COLUMN default_instructor_id UUID REFERENCES members(id),
  ADD COLUMN default_location TEXT,
  ADD COLUMN default_location_url TEXT,
  ADD COLUMN default_capacity INT,
  ADD COLUMN default_price DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN default_dance_style dance_style,
  ADD COLUMN default_difficulty difficulty_level,
  ADD COLUMN default_visibility visibility_level DEFAULT 'all_members',
  ADD COLUMN default_visibility_tags UUID[] DEFAULT '{}',
  ADD COLUMN exdates TIMESTAMPTZ[] DEFAULT '{}',
  ADD COLUMN generation_window_months INT DEFAULT 3,
  ADD COLUMN description TEXT;
```

**Column notes:**
- `exdates` -- array of excluded dates (cancelled single instances), synced with iCal EXDATE
- `generation_window_months` -- how far ahead to materialize event instances (default 3 months)
- `default_duration` -- derived from start/end time but stored for convenience; `NULL` means use start/end

### 2.3 Modified `events` Table

Adds exception tracking and Google Calendar sync fields.

```sql
ALTER TABLE events
  ADD COLUMN is_exception BOOLEAN DEFAULT FALSE,
  ADD COLUMN cancelled_at TIMESTAMPTZ,
  ADD COLUMN original_start_time TIMESTAMPTZ,
  ADD COLUMN google_event_id TEXT;

CREATE INDEX idx_events_series ON events(series_id);
CREATE INDEX idx_events_google_event ON events(google_event_id) WHERE google_event_id IS NOT NULL;
CREATE INDEX idx_events_cancelled ON events(cancelled_at) WHERE cancelled_at IS NOT NULL;
```

**Column notes:**
- `is_exception` -- `TRUE` when this instance was individually modified from the series template
- `cancelled_at` -- non-null means cancelled; instance preserved in DB for audit, added to series `exdates`
- `original_start_time` -- stores the originally-generated start time before rescheduling (for exception tracking)
- `google_event_id` -- the Google Calendar event ID for two-way reference

### 2.4 Modified `event_rsvps` Table

Adds Stripe checkout tracking for paid events.

```sql
ALTER TABLE event_rsvps
  ADD COLUMN stripe_checkout_session TEXT,
  ADD COLUMN payment_expires_at TIMESTAMPTZ;

CREATE INDEX idx_event_rsvps_pending ON event_rsvps(payment_expires_at)
  WHERE status = 'pending_payment' AND payment_expires_at IS NOT NULL;
```

### 2.5 Modified `members` Table

Adds iCal subscription token.

```sql
ALTER TABLE members
  ADD COLUMN ical_token UUID DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX idx_members_ical_token ON members(ical_token);
```

### 2.6 New Table: `instructor_availability`

Defines recurring weekly availability slots for instructors (Phase 1).

```sql
CREATE TABLE instructor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Schedule
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INT NOT NULL DEFAULT 60,

  -- Lifecycle
  is_active BOOLEAN DEFAULT TRUE,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,  -- NULL = no end date

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_effective_range CHECK (effective_until IS NULL OR effective_until >= effective_from),
  UNIQUE(instructor_id, day_of_week, start_time)
);

CREATE INDEX idx_availability_instructor ON instructor_availability(instructor_id);
CREATE INDEX idx_availability_active ON instructor_availability(instructor_id)
  WHERE is_active = TRUE;
```

### 2.7 New Table: `availability_overrides`

One-off date overrides for instructor availability (block a day, add extra hours).

```sql
CREATE TABLE availability_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  override_date DATE NOT NULL,
  start_time TIME,           -- NULL when is_available=FALSE (blocking whole day)
  end_time TIME,             -- NULL when is_available=FALSE
  is_available BOOLEAN DEFAULT FALSE,  -- FALSE=blocked, TRUE=extra availability
  slot_duration_minutes INT DEFAULT 60,  -- Slot duration for extra availability
  reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_override_time CHECK (
    (is_available = FALSE) OR (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  ),
  UNIQUE(instructor_id, override_date, start_time)
);

CREATE INDEX idx_overrides_instructor_date ON availability_overrides(instructor_id, override_date);
```

### 2.8 New Table: `private_lesson_bookings`

Tracks private lesson reservations with double-booking prevention (Phase 1).

```sql
-- Required for the GIST exclusion constraint on TIMESTAMPTZ ranges
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE private_lesson_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,

  -- Time
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'confirmed', 'cancelled', 'completed', 'no_show')),

  -- Stripe
  stripe_checkout_session TEXT,
  stripe_payment_intent TEXT,
  amount_paid DECIMAL(10,2),
  paid_at TIMESTAMPTZ,

  -- Google Calendar
  gcal_event_id TEXT,

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES members(id),
  cancellation_reason TEXT,
  refund_amount DECIMAL(10,2),
  refund_id TEXT,

  -- Notes
  member_notes TEXT,
  instructor_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_booking_time CHECK (end_time > start_time),

  -- CRITICAL: Prevent double-booking per instructor using range exclusion
  -- Two confirmed bookings for the same instructor cannot overlap in time
  EXCLUDE USING GIST (
    instructor_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  ) WHERE (status IN ('pending_payment', 'confirmed'))
);

CREATE INDEX idx_bookings_instructor ON private_lesson_bookings(instructor_id, start_time);
CREATE INDEX idx_bookings_member ON private_lesson_bookings(member_id, start_time);
CREATE INDEX idx_bookings_status ON private_lesson_bookings(status) WHERE status IN ('pending_payment', 'confirmed');
CREATE INDEX idx_bookings_stripe_session ON private_lesson_bookings(stripe_checkout_session)
  WHERE stripe_checkout_session IS NOT NULL;
```

**GIST exclusion constraint note:** The `EXCLUDE USING GIST` constraint is a PostgreSQL feature that atomically prevents any two rows from having the same `instructor_id` AND overlapping time ranges, but only when `status` is `pending_payment` or `confirmed`. This is the strongest possible guard against double-booking -- it operates at the database level and cannot be defeated by race conditions.

> **Refinement from research:** The initial research (calendar-research-findings.md Section 3) used `WHERE (status NOT IN ('cancelled'))`, which would also protect `completed` and `no_show` rows from overlap. The architecture refines this to `WHERE (status IN ('pending_payment', 'confirmed'))` because `completed` and `no_show` bookings are historical records and should not block new bookings at the same time slot. This is intentional.

### 2.9 New Table: `google_oauth_tokens`

Stores Google OAuth2 tokens for instructor calendar sync (Phase 1). Service-role access only.

```sql
CREATE TABLE google_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expiry_date BIGINT NOT NULL,        -- Unix timestamp (ms) of access_token expiry
  scope TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(member_id)
);

-- RLS enabled but NO public policies -- only service_role can access
ALTER TABLE google_oauth_tokens ENABLE ROW LEVEL SECURITY;
-- No CREATE POLICY statements -- intentionally locked to service_role
```

### 2.10 New Table: `check_ins`

Records individual attendance check-ins (Phase 2). Separate from `event_rsvps.attended` to capture method, time, and who performed the check-in.

```sql
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  method checkin_method NOT NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_by UUID REFERENCES members(id),  -- NULL for self-check-in, instructor ID for scan/manual

  -- For studio-wide QR: was the event inferred from time window?
  event_inferred BOOLEAN DEFAULT FALSE,

  -- Extensible metadata (device info, location, etc.)
  metadata JSONB DEFAULT '{}',

  UNIQUE(event_id, member_id)
);

CREATE INDEX idx_checkins_event ON check_ins(event_id);
CREATE INDEX idx_checkins_member ON check_ins(member_id);
CREATE INDEX idx_checkins_time ON check_ins(checked_in_at DESC);
```

### 2.11 New Table: `notification_queue`

Async notification queue processed by Edge Functions or cron (Phase 5).

```sql
CREATE TABLE notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL,      -- 'waitlist_promoted', 'rsvp_confirmed', 'event_reminder', etc.
  payload JSONB NOT NULL DEFAULT '{}',

  processed_at TIMESTAMPTZ,      -- NULL = unprocessed
  error TEXT,                     -- Error message if processing failed
  retry_count INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_unprocessed ON notification_queue(created_at)
  WHERE processed_at IS NULL;
CREATE INDEX idx_notifications_member ON notification_queue(member_id);
```

### 2.12 Complete ERD (Calendar Tables)

```
┌───────────────────────┐       ┌──────────────────────┐
│    event_series       │1─────M│       events         │
├───────────────────────┤       ├──────────────────────┤
│ id (PK)               │       │ id (PK)              │
│ title                 │       │ series_id (FK)       │
│ recurrence_rule       │       │ title                │
│ start_date, end_date  │       │ event_type           │
│ timezone              │       │ start_time, end_time │
│ default_start_time    │       │ is_exception         │
│ default_end_time      │       │ cancelled_at         │
│ default_instructor_id │       │ original_start_time  │
│ default_capacity      │       │ google_event_id      │
│ default_price         │       │ capacity, price      │
│ exdates[]             │       │ instructor_id (FK)   │
│ generation_window     │       └───────────┬──────────┘
└───────────────────────┘                   │
                                    ┌───────┴───────┐
                                    │               │
                              ┌─────▼─────┐   ┌────▼─────┐
                              │event_rsvps│   │ check_ins │
                              ├───────────┤   ├──────────┤
                              │ event_id  │   │ event_id │
                              │ member_id │   │ member_id│
                              │ status    │   │ method   │
                              │ waitlist_ │   │ checked_ │
                              │  position │   │  in_at   │
                              │ stripe_   │   │ checked_ │
                              │  checkout │   │  in_by   │
                              │ payment_  │   └──────────┘
                              │  expires  │
                              └───────────┘

┌──────────────────────────┐    ┌──────────────────────────┐
│ instructor_availability  │    │  availability_overrides   │
├──────────────────────────┤    ├──────────────────────────┤
│ id (PK)                  │    │ id (PK)                  │
│ instructor_id (FK)       │    │ instructor_id (FK)       │
│ day_of_week (0-6)        │    │ override_date            │
│ start_time, end_time     │    │ start_time, end_time     │
│ slot_duration_minutes    │    │ is_available             │
│ is_active                │    │ reason                   │
│ effective_from/until     │    └──────────────────────────┘
└──────────────────────────┘

┌──────────────────────────┐    ┌──────────────────────────┐
│ private_lesson_bookings  │    │   google_oauth_tokens    │
├──────────────────────────┤    ├──────────────────────────┤
│ id (PK)                  │    │ id (PK)                  │
│ instructor_id (FK)       │    │ member_id (FK, UNIQUE)   │
│ member_id (FK)           │    │ access_token             │
│ start_time, end_time     │    │ refresh_token            │
│ status                   │    │ expiry_date              │
│ stripe_* fields          │    │ scope                    │
│ gcal_event_id            │    └──────────────────────────┘
│ cancellation fields      │
│ EXCLUDE GIST (no overlap)│    ┌──────────────────────────┐
└──────────────────────────┘    │    notification_queue     │
                                ├──────────────────────────┤
                                │ id (PK)                  │
                                │ member_id (FK)           │
                                │ event_type               │
                                │ payload (JSONB)          │
                                │ processed_at             │
                                └──────────────────────────┘
```

---

## 3. Database Functions & Triggers

### 3.1 `rsvp_to_event()` -- Atomic RSVP with Capacity Check

Handles going, maybe, waitlist, and pending_payment states atomically. Uses `SELECT FOR UPDATE` to prevent race conditions on capacity.

```sql
CREATE OR REPLACE FUNCTION rsvp_to_event(
  p_event_id UUID,
  p_member_id UUID
)
RETURNS TABLE(
  rsvp_id UUID,
  status rsvp_status,
  waitlist_position INT,
  requires_payment BOOLEAN,
  stripe_checkout_session TEXT
) AS $$
DECLARE
  v_event RECORD;
  v_existing RECORD;
  v_going_count INT;
  v_result RECORD;
  v_member_role TEXT;
BEGIN
  -- Verify caller is not a guest (guests cannot RSVP per role matrix)
  SELECT r.name INTO v_member_role
  FROM members m JOIN roles r ON m.role_id = r.id
  WHERE m.id = p_member_id;

  IF v_member_role IS NULL OR v_member_role = 'guest' THEN
    RAISE EXCEPTION 'Guests cannot RSVP to events';
  END IF;

  -- Lock the event row to prevent concurrent capacity races
  SELECT e.capacity, e.price, e.start_time
  INTO v_event
  FROM events e
  WHERE e.id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found: %', p_event_id;
  END IF;

  -- Check if event is in the past
  IF v_event.start_time < NOW() THEN
    RAISE EXCEPTION 'Cannot RSVP to past events';
  END IF;

  -- Check for existing RSVP
  SELECT * INTO v_existing
  FROM event_rsvps
  WHERE event_id = p_event_id AND member_id = p_member_id;

  IF v_existing IS NOT NULL AND v_existing.status IN ('going', 'pending_payment') THEN
    RAISE EXCEPTION 'Already RSVPd to this event';
  END IF;

  -- Count current confirmed attendees
  SELECT COUNT(*) INTO v_going_count
  FROM event_rsvps
  WHERE event_id = p_event_id AND status IN ('going', 'pending_payment');

  -- Determine RSVP status
  IF v_event.capacity IS NOT NULL AND v_going_count >= v_event.capacity THEN
    -- Waitlisted
    INSERT INTO event_rsvps (event_id, member_id, status, waitlist_position)
    VALUES (
      p_event_id,
      p_member_id,
      'waitlist',
      COALESCE(
        (SELECT MAX(waitlist_position) FROM event_rsvps
         WHERE event_id = p_event_id AND status = 'waitlist'),
        0
      ) + 1
    )
    ON CONFLICT (event_id, member_id)
    DO UPDATE SET
      status = 'waitlist',
      waitlist_position = EXCLUDED.waitlist_position,
      updated_at = NOW()
    RETURNING id, status, waitlist_position
    INTO v_result;

    RETURN QUERY SELECT v_result.id, v_result.status, v_result.waitlist_position, FALSE, NULL::TEXT;
    RETURN;

  ELSIF v_event.price IS NOT NULL AND v_event.price > 0 THEN
    -- Paid event: reserve spot with pending_payment
    INSERT INTO event_rsvps (event_id, member_id, status, payment_expires_at)
    VALUES (
      p_event_id,
      p_member_id,
      'pending_payment',
      NOW() + INTERVAL '30 minutes'
    )
    ON CONFLICT (event_id, member_id)
    DO UPDATE SET
      status = 'pending_payment',
      payment_expires_at = NOW() + INTERVAL '30 minutes',
      updated_at = NOW()
    RETURNING id, status, waitlist_position
    INTO v_result;

    RETURN QUERY SELECT v_result.id, v_result.status, v_result.waitlist_position, TRUE, NULL::TEXT;
    RETURN;

  ELSE
    -- Free event with capacity: confirmed immediately
    INSERT INTO event_rsvps (event_id, member_id, status)
    VALUES (p_event_id, p_member_id, 'going')
    ON CONFLICT (event_id, member_id)
    DO UPDATE SET
      status = 'going',
      waitlist_position = NULL,
      updated_at = NOW()
    RETURNING id, status, waitlist_position
    INTO v_result;

    RETURN QUERY SELECT v_result.id, v_result.status, v_result.waitlist_position, FALSE, NULL::TEXT;
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.2 `promote_from_waitlist()` -- Auto-Promotion Trigger

When a going/pending_payment RSVP is cancelled, automatically promote the first person on the waitlist.

```sql
CREATE OR REPLACE FUNCTION promote_from_waitlist()
RETURNS TRIGGER AS $$
DECLARE
  v_event RECORD;
  v_going_count INT;
  v_next_waitlisted RECORD;
BEGIN
  -- Only fire when status changes away from going/pending_payment
  -- Note: 'cancelled' is not in rsvp_status enum. Cancellations use 'not_going'.
  IF OLD.status IN ('going', 'pending_payment') AND NEW.status = 'not_going' THEN

    -- Get event capacity
    SELECT capacity, price INTO v_event
    FROM events WHERE id = NEW.event_id;

    -- Count current confirmed attendees
    SELECT COUNT(*) INTO v_going_count
    FROM event_rsvps
    WHERE event_id = NEW.event_id AND status IN ('going', 'pending_payment');

    -- If there's now space AND there are waitlisted members
    IF v_event.capacity IS NULL OR v_going_count < v_event.capacity THEN
      -- Get the next person on the waitlist (lowest position)
      SELECT * INTO v_next_waitlisted
      FROM event_rsvps
      WHERE event_id = NEW.event_id AND status = 'waitlist'
      ORDER BY waitlist_position ASC
      LIMIT 1
      FOR UPDATE;

      IF FOUND THEN
        IF v_event.price IS NOT NULL AND v_event.price > 0 THEN
          -- Paid event: move to pending_payment
          UPDATE event_rsvps
          SET status = 'pending_payment',
              waitlist_position = NULL,
              payment_expires_at = NOW() + INTERVAL '30 minutes',
              updated_at = NOW()
          WHERE id = v_next_waitlisted.id;
        ELSE
          -- Free event: promote directly to going
          UPDATE event_rsvps
          SET status = 'going',
              waitlist_position = NULL,
              updated_at = NOW()
          WHERE id = v_next_waitlisted.id;
        END IF;

        -- Queue notification for promoted member
        INSERT INTO notification_queue (member_id, event_type, payload)
        VALUES (
          v_next_waitlisted.member_id,
          'waitlist_promoted',
          jsonb_build_object(
            'event_id', NEW.event_id,
            'rsvp_id', v_next_waitlisted.id,
            'requires_payment', (v_event.price IS NOT NULL AND v_event.price > 0)
          )
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_promote_from_waitlist
  AFTER UPDATE OF status ON event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION promote_from_waitlist();
```

### 3.3 `confirm_rsvp_payment()` -- Stripe Webhook Handler

Called from the Stripe webhook handler when `checkout.session.completed` fires for an event RSVP.

```sql
CREATE OR REPLACE FUNCTION confirm_rsvp_payment(
  p_checkout_session_id TEXT,
  p_payment_intent TEXT
)
RETURNS UUID AS $$
DECLARE
  v_rsvp_id UUID;
BEGIN
  UPDATE event_rsvps
  SET status = 'going',
      stripe_payment_intent = p_payment_intent,
      paid_at = NOW(),
      payment_expires_at = NULL,
      updated_at = NOW()
  WHERE stripe_checkout_session = p_checkout_session_id
    AND status = 'pending_payment'
  RETURNING id INTO v_rsvp_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending RSVP found for checkout session: %', p_checkout_session_id;
  END IF;

  RETURN v_rsvp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.4 `expire_rsvp_payment()` -- Payment Expiry Handler

Called by Stripe `checkout.session.expired` webhook or the safety-net cron job.

```sql
CREATE OR REPLACE FUNCTION expire_rsvp_payment(
  p_checkout_session_id TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE event_rsvps
  SET status = 'not_going',
      stripe_checkout_session = NULL,
      payment_expires_at = NULL,
      updated_at = NOW()
  WHERE stripe_checkout_session = p_checkout_session_id
    AND status = 'pending_payment';

  -- The UPDATE above will trigger trg_promote_from_waitlist if applicable
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.5 `get_available_slots()` -- Instructor Availability Expansion

Returns concrete available time slots for a date range by expanding weekly availability, subtracting overrides and existing bookings.

```sql
CREATE OR REPLACE FUNCTION get_available_slots(
  p_instructor_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  slot_date DATE,
  slot_start TIME,
  slot_end TIME,
  duration_minutes INT
) AS $$
BEGIN
  RETURN QUERY
  WITH
  -- Generate all dates in range
  date_range AS (
    SELECT d::DATE AS day
    FROM generate_series(p_start_date::TIMESTAMP, p_end_date::TIMESTAMP, '1 day') d
  ),

  -- Expand weekly availability into concrete slots
  weekly_slots AS (
    SELECT
      dr.day,
      ia.start_time AS slot_start,
      -- Generate sub-slots based on slot_duration_minutes
      (ia.start_time + (slot_offset * (ia.slot_duration_minutes || ' minutes')::INTERVAL))::TIME AS sub_start,
      (ia.start_time + ((slot_offset + 1) * (ia.slot_duration_minutes || ' minutes')::INTERVAL))::TIME AS sub_end,
      ia.slot_duration_minutes
    FROM date_range dr
    JOIN instructor_availability ia
      ON ia.instructor_id = p_instructor_id
      AND ia.day_of_week = EXTRACT(DOW FROM dr.day)
      AND ia.is_active = TRUE
      AND dr.day >= ia.effective_from
      AND (ia.effective_until IS NULL OR dr.day <= ia.effective_until)
    CROSS JOIN generate_series(
      0,
      -- Number of slots that fit in the window
      FLOOR(EXTRACT(EPOCH FROM (ia.end_time - ia.start_time)) / (ia.slot_duration_minutes * 60))::INT - 1
    ) AS slot_offset
  ),

  -- Get blocked dates/times
  blocked AS (
    SELECT override_date, start_time AS block_start, end_time AS block_end
    FROM availability_overrides
    WHERE instructor_id = p_instructor_id
      AND is_available = FALSE
      AND override_date BETWEEN p_start_date AND p_end_date
  ),

  -- Get extra availability
  extras AS (
    SELECT
      ao.override_date AS day,
      (ao.start_time + (slot_offset * (ao.slot_duration_minutes || ' minutes')::INTERVAL))::TIME AS sub_start,
      (ao.start_time + ((slot_offset + 1) * (ao.slot_duration_minutes || ' minutes')::INTERVAL))::TIME AS sub_end,
      ao.slot_duration_minutes
    FROM availability_overrides ao
    CROSS JOIN generate_series(
      0,
      FLOOR(EXTRACT(EPOCH FROM (ao.end_time - ao.start_time)) / (ao.slot_duration_minutes * 60))::INT - 1
    ) AS slot_offset
    WHERE ao.instructor_id = p_instructor_id
      AND ao.is_available = TRUE
      AND ao.override_date BETWEEN p_start_date AND p_end_date
  ),

  -- Existing confirmed bookings
  -- NOTE: Single-timezone assumption. All instructor_availability TIME values
  -- and this conversion assume America/New_York. If the studio expands to
  -- multiple timezones, add a timezone column to instructor_availability and
  -- parameterize this conversion.
  booked AS (
    SELECT
      (start_time AT TIME ZONE 'America/New_York')::DATE AS booking_date,
      (start_time AT TIME ZONE 'America/New_York')::TIME AS booking_start,
      (end_time AT TIME ZONE 'America/New_York')::TIME AS booking_end
    FROM private_lesson_bookings
    WHERE instructor_id = p_instructor_id
      AND status IN ('pending_payment', 'confirmed')
      AND start_time::DATE BETWEEN p_start_date AND p_end_date
  ),

  -- Combine weekly slots + extras, minus blocks and bookings
  available AS (
    -- Weekly slots not blocked
    SELECT ws.day, ws.sub_start, ws.sub_end, ws.slot_duration_minutes
    FROM weekly_slots ws
    WHERE NOT EXISTS (
      SELECT 1 FROM blocked b
      WHERE b.override_date = ws.day
        AND (b.block_start IS NULL OR (ws.sub_start, ws.sub_end) OVERLAPS (b.block_start, b.block_end))
    )
    AND NOT EXISTS (
      SELECT 1 FROM booked bk
      WHERE bk.booking_date = ws.day
        AND (ws.sub_start, ws.sub_end) OVERLAPS (bk.booking_start, bk.booking_end)
    )

    UNION ALL

    -- Extra availability not booked
    SELECT ex.day, ex.sub_start, ex.sub_end, ex.slot_duration_minutes
    FROM extras ex
    WHERE NOT EXISTS (
      SELECT 1 FROM booked bk
      WHERE bk.booking_date = ex.day
        AND (ex.sub_start, ex.sub_end) OVERLAPS (bk.booking_start, bk.booking_end)
    )
  )

  SELECT a.day, a.sub_start, a.sub_end, a.slot_duration_minutes
  FROM available a
  WHERE a.day > CURRENT_DATE OR (a.day = CURRENT_DATE AND a.sub_start > CURRENT_TIME)
  ORDER BY a.day, a.sub_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.6 `generate_series_events()` -- Recurring Event Expansion

Materializes event instances from a series template. Called from application code (Next.js API route or Vercel Cron) rather than purely in-database, because RRULE parsing with timezone awareness is best handled by the `rrule` npm package. The database function inserts the pre-computed dates.

```sql
CREATE OR REPLACE FUNCTION generate_series_events(
  p_series_id UUID,
  p_dates TIMESTAMPTZ[],
  p_end_times TIMESTAMPTZ[]
)
RETURNS INT AS $$
DECLARE
  v_series RECORD;
  v_count INT := 0;
  i INT;
BEGIN
  SELECT * INTO v_series FROM event_series WHERE id = p_series_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Series not found: %', p_series_id;
  END IF;

  FOR i IN 1..array_length(p_dates, 1) LOOP
    -- Skip if event already exists for this series+start_time
    -- Skip if date is in exdates
    IF NOT EXISTS (
      SELECT 1 FROM events
      WHERE series_id = p_series_id AND start_time = p_dates[i]
    )
    AND NOT (p_dates[i] = ANY(v_series.exdates))
    THEN
      INSERT INTO events (
        series_id, title, description, event_type, source,
        start_time, end_time, timezone, location, location_url,
        capacity, price, stripe_price_id, visibility, visibility_tags,
        instructor_id, dance_style, difficulty
      ) VALUES (
        p_series_id,
        v_series.title,
        v_series.description,
        v_series.event_type,
        'staff',
        p_dates[i],
        p_end_times[i],
        v_series.timezone,
        v_series.default_location,
        v_series.default_location_url,
        v_series.default_capacity,
        v_series.default_price,
        NULL,  -- stripe_price_id: recurring events use inline price_data in Stripe Checkout
               -- rather than pre-created Price objects, since each instance may be
               -- individually priced or cancelled. Set per-event if needed.
        v_series.default_visibility,
        v_series.default_visibility_tags,
        v_series.default_instructor_id,
        v_series.default_dance_style,
        v_series.default_difficulty
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.7 `sync_rsvp_attendance()` -- Check-In to RSVP Sync

When a check-in is recorded, sync the `attended` flag and `checked_in_at` back to `event_rsvps`.

```sql
CREATE OR REPLACE FUNCTION sync_rsvp_attendance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the matching RSVP record
  UPDATE event_rsvps
  SET attended = TRUE,
      checked_in_at = NEW.checked_in_at,
      updated_at = NOW()
  WHERE event_id = NEW.event_id
    AND member_id = NEW.member_id;

  -- If no RSVP exists (walk-in), create one
  IF NOT FOUND THEN
    INSERT INTO event_rsvps (event_id, member_id, status, attended, checked_in_at)
    VALUES (NEW.event_id, NEW.member_id, 'going', TRUE, NEW.checked_in_at)
    ON CONFLICT (event_id, member_id) DO UPDATE
    SET attended = TRUE,
        checked_in_at = EXCLUDED.checked_in_at,
        updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_attendance
  AFTER INSERT ON check_ins
  FOR EACH ROW
  EXECUTE FUNCTION sync_rsvp_attendance();
```

### 3.8 Views

#### `event_waitlist` -- Gap-Free Waitlist Display

```sql
CREATE OR REPLACE VIEW event_waitlist AS
SELECT
  er.id,
  er.event_id,
  er.member_id,
  m.display_name,
  m.avatar_url,
  ROW_NUMBER() OVER (
    PARTITION BY er.event_id
    ORDER BY er.created_at ASC
  ) AS display_position,
  er.created_at AS joined_waitlist_at
FROM event_rsvps er
JOIN members m ON er.member_id = m.id
WHERE er.status = 'waitlist'
ORDER BY er.event_id, display_position;
```

#### Enhanced `upcoming_events` View

The existing `upcoming_events` view (see [database-schema.md](../database-schema.md)) is enhanced with additional computed fields:

> **Migration note:** This `CREATE OR REPLACE VIEW` supersedes the simpler `upcoming_events` definition in `database-schema.md`. The base schema definition should be updated to match this enhanced version (or removed) to prevent accidental overwrites if the base migration runs after this one. This view depends on: `cancelled_at` column on `events` (Section 2.3), `check_ins` table (Section 2.10), and `event_series` table enhancements (Section 2.2).

```sql
CREATE OR REPLACE VIEW upcoming_events AS
SELECT
  e.*,
  m.display_name AS instructor_name,
  m.avatar_url AS instructor_avatar,
  (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND status = 'going') AS rsvp_count,
  (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND status = 'waitlist') AS waitlist_count,
  (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND status = 'pending_payment') AS pending_count,
  (SELECT COUNT(*) FROM check_ins WHERE event_id = e.id) AS checkin_count,
  CASE
    WHEN e.capacity IS NULL THEN FALSE
    WHEN (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND status IN ('going', 'pending_payment')) >= e.capacity THEN TRUE
    ELSE FALSE
  END AS is_full,
  es.recurrence_rule AS series_recurrence_rule,
  es.title AS series_title
FROM events e
LEFT JOIN members m ON e.instructor_id = m.id
LEFT JOIN event_series es ON e.series_id = es.id
WHERE e.start_time > NOW()
  AND e.approval_status = 'approved'
  AND e.cancelled_at IS NULL
ORDER BY e.start_time ASC;
```

### 3.9 `updated_at` Triggers for New Tables

Attach the existing `update_updated_at()` trigger (defined in `database-schema.md`) to new tables that have `updated_at` columns and are likely to be updated.

```sql
CREATE TRIGGER instructor_availability_updated_at
  BEFORE UPDATE ON instructor_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER private_lesson_bookings_updated_at
  BEFORE UPDATE ON private_lesson_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

Note: `availability_overrides` and `check_ins` do not need this trigger -- overrides are typically replaced (delete + insert) rather than updated, and check-ins are append-only.

### 3.10 Cross-References

- **`update_reply_count()` trigger** -- documented in the chat architecture spec; the same trigger pattern (AFTER INSERT on a table, updating a count on a parent) is reused in the waitlist promotion trigger.
- **`get_unread_counts()`** -- documented in the chat architecture spec; referenced here for the notification queue pattern but not duplicated.

---

## 4. RLS Policies

All new tables have RLS enabled. Policies follow the same helper-function pattern as the existing schema (see [auth-and-roles.md](../auth-and-roles.md)).

### 4.1 `instructor_availability`

```sql
ALTER TABLE instructor_availability ENABLE ROW LEVEL SECURITY;

-- Members can view active instructor availability (needed for booking UI)
CREATE POLICY "Members can view active availability"
  ON instructor_availability
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND is_active = TRUE
  );

-- Staff can manage all availability
CREATE POLICY "Staff can manage availability"
  ON instructor_availability
  FOR ALL
  USING (is_staff());
```

### 4.2 `availability_overrides`

```sql
ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;

-- Staff only: full CRUD
CREATE POLICY "Staff can manage overrides"
  ON availability_overrides
  FOR ALL
  USING (is_staff());

-- Members can view overrides (needed to see blocked dates in booking UI)
CREATE POLICY "Members can view overrides"
  ON availability_overrides
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

### 4.3 `private_lesson_bookings`

```sql
ALTER TABLE private_lesson_bookings ENABLE ROW LEVEL SECURITY;

-- Members can view their own bookings
CREATE POLICY "Members view own bookings"
  ON private_lesson_bookings
  FOR SELECT
  USING (member_id = get_current_member_id());

-- Staff can view all bookings
CREATE POLICY "Staff view all bookings"
  ON private_lesson_bookings
  FOR SELECT
  USING (is_staff());

-- Staff can manage all bookings
CREATE POLICY "Staff manage bookings"
  ON private_lesson_bookings
  FOR ALL
  USING (is_staff());

-- Members can insert own bookings via RPC (application-level validation)
-- Inserts are handled through rpc/API routes, not direct table access
-- The rpc function runs as SECURITY DEFINER
```

### 4.4 `event_rsvps` (Existing Table -- RLS Note)

The existing `event_rsvps` table in `database-schema.md` has SELECT and staff-only ALL policies. Member RSVP operations (insert, update, cancel) are **exclusively** performed through the `rsvp_to_event()` and `expire_rsvp_payment()` `SECURITY DEFINER` functions, which bypass RLS. Direct INSERT/UPDATE by members is intentionally blocked by the absence of member INSERT/UPDATE policies. This is the correct security model -- the RPC functions enforce all business rules (capacity checks, payment validation, waitlist positioning) atomically.

### 4.5 `google_oauth_tokens`

```sql
-- Already enabled above in table definition
-- NO public policies -- only service_role can read/write
-- All access goes through Edge Functions or API routes with service_role key
```

### 4.6 `check_ins`

```sql
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- Members can view their own check-ins
CREATE POLICY "Members view own check-ins"
  ON check_ins
  FOR SELECT
  USING (member_id = get_current_member_id());

-- Staff can view all check-ins
CREATE POLICY "Staff view all check-ins"
  ON check_ins
  FOR SELECT
  USING (is_staff());

-- Members can self-check-in (qr_self and studio_qr methods only)
CREATE POLICY "Members self-check-in"
  ON check_ins
  FOR INSERT
  WITH CHECK (
    member_id = get_current_member_id()
    AND method IN ('qr_self', 'studio_qr')
    AND checked_in_by IS NULL
  );

-- Staff can insert any check-in (manual, qr_instructor)
CREATE POLICY "Staff manage check-ins"
  ON check_ins
  FOR ALL
  USING (is_staff());
```

### 4.7 `notification_queue`

```sql
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- No direct public access. Processed by:
-- 1. Database triggers (SECURITY DEFINER functions)
-- 2. Supabase Edge Functions (service_role key)
-- 3. Vercel Cron jobs (service_role key)
```

---

## 5. Recurring Events Architecture

### 5.1 Storage Model

Recurring events use a **materialized instance** pattern:

1. **Series template** stored in `event_series` with an iCal `RRULE` string (e.g., `FREQ=WEEKLY;BYDAY=TU,TH;UNTIL=20250630`)
2. **Concrete instances** materialized in the `events` table with `series_id` FK
3. **Excluded dates** tracked in `event_series.exdates[]` (cancelled single instances)
4. **Exceptions** tracked via `events.is_exception = TRUE` (individually modified instances)

This pattern is chosen over virtual expansion because:
- Each instance can have its own RSVP records, check-ins, modifications
- Google Calendar sync needs concrete event IDs
- Waitlist/capacity tracking requires per-instance state
- Query performance is better (no runtime expansion)

### 5.2 RRULE Expansion (Application Side)

RRULE parsing and timezone-aware date expansion happens in Next.js using the `rrule` npm package combined with Luxon for timezone handling.

```typescript
// lib/calendar/recurrence.ts
import { RRule, RRuleSet } from 'rrule';
import { DateTime } from 'luxon';

interface SeriesTemplate {
  id: string;
  recurrence_rule: string;
  start_date: string;
  end_date: string | null;
  timezone: string;
  default_start_time: string; // HH:MM:SS
  default_end_time: string;   // HH:MM:SS
  exdates: string[];          // ISO timestamps
}

/**
 * Expand a series template into concrete start/end timestamps.
 * Uses wall-clock time preservation to handle DST transitions.
 */
export function expandSeries(
  series: SeriesTemplate,
  windowStart: Date,
  windowEnd: Date,
): { starts: Date[]; ends: Date[] } {
  const rruleSet = new RRuleSet();

  // Parse the RRULE
  const rule = RRule.fromString(series.recurrence_rule);
  rruleSet.rrule(rule);

  // Add exclusion dates
  for (const exdate of series.exdates) {
    rruleSet.exdate(new Date(exdate));
  }

  // Get occurrence dates (UTC, date-only from RRULE)
  const occurrences = rruleSet.between(windowStart, windowEnd, true);

  const starts: Date[] = [];
  const ends: Date[] = [];

  for (const occ of occurrences) {
    // Parse wall-clock time in the series timezone
    // This preserves the intended local time across DST boundaries
    const [startH, startM] = series.default_start_time.split(':').map(Number);
    const [endH, endM] = series.default_end_time.split(':').map(Number);

    const localStart = DateTime.fromObject(
      {
        year: occ.getUTCFullYear(),
        month: occ.getUTCMonth() + 1,
        day: occ.getUTCDate(),
        hour: startH,
        minute: startM,
      },
      { zone: series.timezone },
    );

    const localEnd = DateTime.fromObject(
      {
        year: occ.getUTCFullYear(),
        month: occ.getUTCMonth() + 1,
        day: occ.getUTCDate(),
        hour: endH,
        minute: endM,
      },
      { zone: series.timezone },
    );

    starts.push(localStart.toJSDate());
    ends.push(localEnd.toJSDate());
  }

  return { starts, ends };
}
```

### 5.3 Generation Window & Cron

Events are materialized 3 months ahead (configurable per series via `generation_window_months`). A Vercel Cron job runs weekly to extend the window.

```typescript
// app/api/cron/generate-events/route.ts
// Vercel cron: runs every Monday at 3:00 AM ET
// vercel.json: { "crons": [{ "path": "/api/cron/generate-events", "schedule": "0 8 * * 1" }] }

import { createClient } from '@supabase/supabase-js';
import { expandSeries } from '@/lib/calendar/recurrence';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Get all active series
  const { data: seriesList } = await supabase
    .from('event_series')
    .select('*')
    .or('end_date.is.null,end_date.gte.' + new Date().toISOString().split('T')[0]);

  let totalGenerated = 0;

  for (const series of seriesList ?? []) {
    const windowEnd = new Date();
    windowEnd.setMonth(windowEnd.getMonth() + (series.generation_window_months || 3));

    const { starts, ends } = expandSeries(series, new Date(), windowEnd);

    if (starts.length > 0) {
      const { data } = await supabase.rpc('generate_series_events', {
        p_series_id: series.id,
        p_dates: starts.map((d) => d.toISOString()),
        p_end_times: ends.map((d) => d.toISOString()),
      });

      totalGenerated += (data as number) ?? 0;
    }
  }

  return Response.json({ generated: totalGenerated });
}
```

### 5.4 Exception Handling

| Scenario | Action |
|----------|--------|
| **Cancel single instance** | Set `events.cancelled_at = NOW()`, append to `event_series.exdates[]`. Instance preserved for audit. |
| **Modify single instance** | Set `events.is_exception = TRUE`, store `original_start_time`. Modify fields as needed. Future generation skips this slot. |
| **Cancel entire series** | Set `event_series.end_date = CURRENT_DATE`. Optionally cancel future generated instances. |
| **Modify series template** | Update `event_series` defaults. Regeneration only creates new instances; existing ones are untouched. Admin can choose "apply to all future" which updates existing non-exception instances. |
| **Split series** | Clone `event_series`, set `end_date` on original, `start_date` on clone. Reassign future `events.series_id` to clone. |

### 5.5 Timezone & DST Handling

All timestamps are stored as `TIMESTAMPTZ` (UTC in PostgreSQL). Wall-clock time is preserved using `event_series.default_start_time` (TIME, no timezone) combined with `event_series.timezone` (IANA zone name).

**DST transition example:**
- Series: "Tuesday Salsa On1, 7:00 PM ET"
- Before DST (EST, UTC-5): stored as `2025-03-04T00:00:00Z` (midnight UTC = 7 PM ET)
- After DST (EDT, UTC-4): stored as `2025-03-11T23:00:00Z` (11 PM UTC = 7 PM ET)
- Luxon's `DateTime.fromObject` with zone handles this automatically

---

## 6. Private Lesson Booking Flow

### 6.1 System Overview

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Admin sets  │    │ Member browses│    │ Stripe       │    │ Google Cal   │
│  instructor  │───▶│ slots, picks │───▶│ Checkout     │───▶│ push event   │
│  availability│    │ time + pays  │    │ confirms     │    │ to instructor│
└─────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### 6.2 Instructor Availability Management (Admin UI)

Staff set weekly availability rules per instructor:

```typescript
// Example: Instructor available Tue/Thu 2-6 PM, 60-min slots
const availability = [
  {
    instructor_id: 'uuid-instructor-1',
    day_of_week: 2,  // Tuesday
    start_time: '14:00',
    end_time: '18:00',
    slot_duration_minutes: 60,
    effective_from: '2025-01-01',
  },
  {
    instructor_id: 'uuid-instructor-1',
    day_of_week: 4,  // Thursday
    start_time: '14:00',
    end_time: '18:00',
    slot_duration_minutes: 60,
    effective_from: '2025-01-01',
  },
];
```

Overrides handle exceptions:

```typescript
// Block a specific date (instructor vacation)
const override = {
  instructor_id: 'uuid-instructor-1',
  override_date: '2025-02-14',
  is_available: false,
  reason: 'Valentine Day event',
};

// Add extra availability (Saturday workshop)
const extraSlots = {
  instructor_id: 'uuid-instructor-1',
  override_date: '2025-03-01',
  start_time: '10:00',
  end_time: '14:00',
  is_available: true,
  reason: 'Extra Saturday hours',
};
```

### 6.3 Member Booking UI

1. Member selects an instructor from a dropdown (3 instructors initially)
2. Date picker shows available dates (dates with at least one open slot highlighted)
3. Time slots displayed as cards: available (green), booked (grayed out)
4. Member selects slot, optionally adds notes
5. Click "Book & Pay" opens Stripe Checkout

### 6.4 Booking Flow Sequence

```
Member                    API Route                  Stripe                    DB
  │                         │                         │                        │
  │ POST /api/bookings      │                         │                        │
  │ {instructor, time}      │                         │                        │
  │────────────────────────▶│                         │                        │
  │                         │ Validate slot available  │                        │
  │                         │─────────────────────────────────────────────────▶│
  │                         │◀─────────────────────────────────────────────────│
  │                         │                         │                        │
  │                         │ Create Checkout Session  │                        │
  │                         │────────────────────────▶│                        │
  │                         │◀────────────────────────│                        │
  │                         │                         │                        │
  │                         │ INSERT pending_payment   │                        │
  │                         │─────────────────────────────────────────────────▶│
  │                         │◀─────────────────────────────────────────────────│
  │                         │                         │                        │
  │ Redirect to Stripe      │                         │                        │
  │◀────────────────────────│                         │                        │
  │                         │                         │                        │
  │ Complete payment         │                         │                        │
  │─────────────────────────────────────────────────▶│                        │
  │                         │                         │                        │
  │                         │ Webhook: session.completed                       │
  │                         │◀────────────────────────│                        │
  │                         │                         │                        │
  │                         │ UPDATE status=confirmed  │                        │
  │                         │─────────────────────────────────────────────────▶│
  │                         │                         │                        │
  │                         │ Push to Google Calendar   │                       │
  │                         │────────────────────────▶ (Google)                │
  │                         │                         │                        │
  │ Redirect to success     │                         │                        │
  │◀────────────────────────│                         │                        │
```

### 6.5 Double-Booking Prevention

Three layers of protection:

1. **Application-level:** `get_available_slots()` RPC excludes already-booked times
2. **Database-level:** `EXCLUDE USING GIST` constraint prevents overlapping ranges for the same instructor at `INSERT` time. If two concurrent requests try to book the same slot, one will fail with a constraint violation.
3. **Stripe session:** Pending bookings hold the slot for 30 minutes. If payment is not completed, the booking is cleaned up by webhook or cron.

### 6.6 Booking Status State Machine

```
                 ┌──────────────────┐
                 │  pending_payment │
                 └────────┬─────────┘
                          │
              ┌───────────┼───────────┐
              │ payment   │ payment   │ payment
              │ completed │ expired   │ failed
              ▼           ▼           │
        ┌───────────┐  (deleted)      │
        │ confirmed │                 │
        └─────┬─────┘                 │
              │                       │
    ┌─────────┼──────────┐            │
    │         │          │            │
    ▼         ▼          ▼            ▼
┌─────────┐ ┌─────┐  ┌───────┐  ┌─────────┐
│completed│ │no_  │  │cancel-│  │ (row     │
│         │ │show │  │  led  │  │  removed)│
└─────────┘ └─────┘  └───────┘  └─────────┘
```

### 6.7 Cancellation & Refund Logic

```typescript
// app/api/bookings/[id]/cancel/route.ts
interface CancellationPolicy {
  // Full refund if cancelled > 48 hours before lesson
  fullRefundWindowHours: 48;
  // 50% refund if cancelled 24-48 hours before
  partialRefundWindowHours: 24;
  partialRefundPercent: 50;
  // No refund if cancelled < 24 hours before
}
```

---

## 7. RSVP, Capacity & Waitlist System

### 7.1 RSVP Flow (Free Events)

```
Member clicks "RSVP"
  │
  ├─ Capacity available? ── YES ──▶ status = 'going' ──▶ Done
  │
  └─ No capacity? ──▶ status = 'waitlist', position = N ──▶ Wait for promotion
```

### 7.2 RSVP Flow (Paid Events)

```
Member clicks "RSVP"
  │
  ├─ Capacity available?
  │    │
  │    ├─ YES ──▶ status = 'pending_payment'
  │    │           payment_expires_at = NOW + 30min
  │    │           ──▶ Redirect to Stripe Checkout
  │    │                │
  │    │                ├─ Payment complete ──▶ status = 'going', paid_at = NOW
  │    │                │
  │    │                └─ Payment expired ──▶ status = 'not_going'
  │    │                                       ──▶ trg_promote_from_waitlist fires
  │    │
  │    └─ NO ──▶ status = 'waitlist', position = N
  │
  └─ Promoted from waitlist (paid event):
       status = 'pending_payment', payment_expires_at = NOW + 30min
       ──▶ Notification sent ──▶ Member has 30 min to pay
```

### 7.3 Stripe Checkout Integration

```typescript
// app/api/events/[id]/rsvp/route.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createServerClient(/* ... */);
  const memberId = await getCurrentMemberId(supabase);

  // Call the atomic RSVP function
  const { data: rsvp, error } = await supabase.rpc('rsvp_to_event', {
    p_event_id: params.id,
    p_member_id: memberId,
  });

  if (error) throw error;

  if (rsvp[0].requires_payment) {
    // Create Stripe Checkout Session
    const event = await supabase
      .from('events')
      .select('title, price')
      .eq('id', params.id)
      .single();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: event.data!.title },
            unit_amount: Math.round(event.data!.price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'event_rsvp',
        event_id: params.id,
        rsvp_id: rsvp[0].rsvp_id,
        member_id: memberId,
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
      success_url: `${process.env.NEXT_PUBLIC_URL}/calendar/${params.id}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/calendar/${params.id}?payment=cancelled`,
    });

    // Store checkout session ID on the RSVP
    await supabase
      .from('event_rsvps')
      .update({ stripe_checkout_session: session.id })
      .eq('id', rsvp[0].rsvp_id);

    return Response.json({ checkout_url: session.url });
  }

  return Response.json({ status: rsvp[0].status });
}
```

### 7.4 Stripe Webhook Handlers

```typescript
// app/api/payments/webhook/route.ts (extend existing handler)

case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session;

  if (session.metadata?.type === 'event_rsvp') {
    await supabaseAdmin.rpc('confirm_rsvp_payment', {
      p_checkout_session_id: session.id,
      p_payment_intent: session.payment_intent as string,
    });
  }

  if (session.metadata?.type === 'private_lesson') {
    await supabaseAdmin
      .from('private_lesson_bookings')
      .update({
        status: 'confirmed',
        stripe_payment_intent: session.payment_intent as string,
        amount_paid: session.amount_total! / 100,
        paid_at: new Date().toISOString(),
      })
      .eq('stripe_checkout_session', session.id);

    // Push to Google Calendar
    await pushBookingToGoogleCalendar(session.metadata.booking_id);
  }
  break;
}

case 'checkout.session.expired': {
  const session = event.data.object as Stripe.Checkout.Session;

  if (session.metadata?.type === 'event_rsvp') {
    await supabaseAdmin.rpc('expire_rsvp_payment', {
      p_checkout_session_id: session.id,
    });
  }

  if (session.metadata?.type === 'private_lesson') {
    await supabaseAdmin
      .from('private_lesson_bookings')
      .delete()
      .eq('stripe_checkout_session', session.id)
      .eq('status', 'pending_payment');
  }
  break;
}
```

### 7.5 Safety-Net Cron for Missed Webhooks

A cron job runs every 15 minutes to expire any pending RSVPs whose `payment_expires_at` has passed but were not cleaned up by webhooks (network issues, webhook failures).

```typescript
// app/api/cron/expire-payments/route.ts
// Vercel cron: { "path": "/api/cron/expire-payments", "schedule": "*/15 * * * *" }

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Expire stale RSVP payments
  const { data: expiredRsvps } = await supabase
    .from('event_rsvps')
    .select('id, stripe_checkout_session')
    .eq('status', 'pending_payment')
    .lt('payment_expires_at', new Date().toISOString());

  for (const rsvp of expiredRsvps ?? []) {
    if (rsvp.stripe_checkout_session) {
      await supabase.rpc('expire_rsvp_payment', {
        p_checkout_session_id: rsvp.stripe_checkout_session,
      });
    } else {
      // Fallback: if checkout session was never stored (e.g., Stripe API failure),
      // directly release the capacity hold to prevent permanent slot consumption.
      await supabase
        .from('event_rsvps')
        .update({ status: 'not_going', updated_at: new Date().toISOString() })
        .eq('id', rsvp.id);
    }
  }

  // Expire stale booking payments
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  await supabase
    .from('private_lesson_bookings')
    .delete()
    .eq('status', 'pending_payment')
    .lt('created_at', thirtyMinAgo);

  return Response.json({
    expired_rsvps: expiredRsvps?.length ?? 0,
  });
}
```

---

## 8. QR Check-In & Attendance

### 8.1 QR Code Generation

QR codes are rendered using `qrcode.react` (SVG mode, error correction level H for reliability).

**Per-class QR code** (displayed on projector/screen during class):
```typescript
// lib/calendar/checkin.ts
import crypto from 'crypto';

const CHECKIN_SECRET = process.env.CHECKIN_HMAC_SECRET!;

/**
 * Generate a date-scoped HMAC token for a per-class check-in QR.
 * Token changes daily to prevent reuse.
 */
export function generateCheckinToken(eventId: string, date: string): string {
  return crypto
    .createHmac('sha256', CHECKIN_SECRET)
    .update(`${eventId}:${date}`)
    .digest('hex')
    .substring(0, 16);
}

/**
 * Verify a check-in token
 */
export function verifyCheckinToken(
  eventId: string,
  date: string,
  token: string,
): boolean {
  const expected = generateCheckinToken(eventId, date);
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expected),
  );
}

/**
 * Build the check-in URL embedded in the QR code
 */
export function buildCheckinUrl(eventId: string): string {
  const today = new Date().toISOString().split('T')[0];
  const token = generateCheckinToken(eventId, today);
  return `${process.env.NEXT_PUBLIC_URL}/checkin/${eventId}?t=${token}&d=${today}`;
}
```

**Studio-wide QR code** (permanent poster at studio entrance):
```typescript
export function buildStudioCheckinUrl(): string {
  const today = new Date().toISOString().split('T')[0];
  const token = crypto
    .createHmac('sha256', CHECKIN_SECRET)
    .update(`studio:${today}`)
    .digest('hex')
    .substring(0, 16);
  return `${process.env.NEXT_PUBLIC_URL}/checkin/studio?t=${token}&d=${today}`;
}
```

### 8.2 Check-In Flows

#### Flow A: Member Scans Per-Class QR (Primary)

```
Projector/Screen              Member's Phone              Server
  │                              │                          │
  │  QR code displayed           │                          │
  │  (per-class, date-scoped)    │                          │
  │                              │                          │
  │◀── scan with camera ────────│                          │
  │                              │                          │
  │  Opens /checkin/:eventId     │                          │
  │  ?t=HMAC_TOKEN&d=DATE       │                          │
  │                              │                          │
  │                              │ Auth check (logged in?)   │
  │                              │─────────────────────────▶│
  │                              │                          │
  │                              │ Verify HMAC token        │
  │                              │ Check time window        │
  │                              │ (event start -30m to +2h)│
  │                              │                          │
  │                              │ INSERT check_ins         │
  │                              │ (method=qr_self)         │
  │                              │─────────────────────────▶│
  │                              │                          │
  │                              │ Success confirmation      │
  │                              │◀─────────────────────────│
```

#### Flow B: Instructor Scans Member QR (Walk-In)

```
Member shows personal QR        Instructor's Phone          Server
  │                              │                          │
  │  Member QR = member ID       │                          │
  │  (from /settings or app)     │                          │
  │                              │                          │
  │──── show QR ────────────────▶│                          │
  │                              │ Scan with @yudiel/       │
  │                              │ react-qr-scanner         │
  │                              │                          │
  │                              │ POST /api/checkin/scan   │
  │                              │ {member_id, event_id}    │
  │                              │─────────────────────────▶│
  │                              │                          │
  │                              │ INSERT check_ins         │
  │                              │ (method=qr_instructor,   │
  │                              │  checked_in_by=instr_id) │
  │                              │                          │
  │                              │ Success                  │
  │                              │◀─────────────────────────│
```

#### Flow C: Studio-Wide QR (Time-Window Resolution)

```
Studio Entrance Poster          Member's Phone              Server
  │                              │                          │
  │  Studio QR (daily token)     │                          │
  │                              │                          │
  │◀── scan ────────────────────│                          │
  │                              │                          │
  │  Opens /checkin/studio       │                          │
  │  ?t=HMAC_TOKEN&d=DATE       │                          │
  │                              │                          │
  │                              │ Verify HMAC token        │
  │                              │ Find current event:      │
  │                              │   SELECT * FROM events   │
  │                              │   WHERE start_time       │
  │                              │     BETWEEN NOW()-30min  │
  │                              │     AND NOW()+2h         │
  │                              │   ORDER BY start_time    │
  │                              │   LIMIT 1                │
  │                              │─────────────────────────▶│
  │                              │                          │
  │                              │ INSERT check_ins         │
  │                              │ (method=studio_qr,       │
  │                              │  event_inferred=TRUE)    │
  │                              │                          │
  │                              │ If multiple events:      │
  │                              │ show picker              │
  │                              │◀─────────────────────────│
```

### 8.3 Security Model

| Layer | Protection |
|-------|-----------|
| **HMAC token** | Date-scoped, prevents QR reuse across days. Uses `crypto.timingSafeEqual` for comparison. |
| **Auth required** | Member must be logged in. Unauthenticated scans redirect to `/login?redirect=/checkin/...` |
| **Time window** | Check-in only accepted within `[event.start_time - 30 min, event.start_time + 2 hours]` |
| **One-per-event** | `UNIQUE(event_id, member_id)` constraint on `check_ins` table |
| **Method tracking** | `checkin_method` enum records how each check-in was performed for audit |

### 8.4 Attendance Sync

The `trg_sync_attendance` trigger (Section 3.7) automatically updates `event_rsvps.attended = TRUE` and `checked_in_at` whenever a `check_ins` row is inserted. If the member did not previously RSVP (walk-in), a new RSVP record is created with `status = 'going'` and `attended = TRUE`.

---

## 9. Google Calendar & iCal Integration

### 9.1 Google Calendar OAuth2 (Per-Instructor)

Each instructor can connect their Google Calendar for automatic event sync. Tokens are stored in `google_oauth_tokens` (service_role only -- never exposed to client).

#### Connect Flow

```typescript
// app/api/calendar/connect/route.ts
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_URL}/api/calendar/callback`,
);

export async function GET(request: Request) {
  // Verify caller is staff
  const supabase = createServerClient(/* ... */);
  if (!(await isStaff(supabase))) {
    return new Response('Forbidden', { status: 403 });
  }

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent',
    state: (await getCurrentMemberId(supabase)),
  });

  return Response.redirect(url);
}
```

#### Callback Handler

```typescript
// app/api/calendar/callback/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const memberId = searchParams.get('state');

  const { tokens } = await oauth2Client.getToken(code!);

  // Store with service_role (bypasses RLS)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  await supabaseAdmin.from('google_oauth_tokens').upsert({
    member_id: memberId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
    scope: tokens.scope,
  });

  return Response.redirect(`${process.env.NEXT_PUBLIC_URL}/admin/settings?gcal=connected`);
}
```

### 9.2 One-Way Push on Event/Booking CRUD

Events and bookings are pushed to Google Calendar on create/update/delete. The sync is one-way (Salsa Ninja -> Google Calendar) to avoid conflict resolution complexity.

```typescript
// lib/calendar/google-sync.ts
import { google, calendar_v3 } from 'googleapis';

async function getAuthenticatedCalendar(
  instructorId: string,
): Promise<calendar_v3.Calendar | null> {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: tokens } = await supabaseAdmin
    .from('google_oauth_tokens')
    .select('*')
    .eq('member_id', instructorId)
    .single();

  if (!tokens) return null;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  });

  // Handle token refresh
  oauth2Client.on('tokens', async (newTokens) => {
    await supabaseAdmin
      .from('google_oauth_tokens')
      .update({
        access_token: newTokens.access_token,
        expiry_date: newTokens.expiry_date,
        updated_at: new Date().toISOString(),
      })
      .eq('member_id', instructorId);
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function pushEventToGoogleCalendar(
  event: EventRecord,
  instructorId: string,
): Promise<string | null> {
  const calendar = await getAuthenticatedCalendar(instructorId);
  if (!calendar) return null;

  const gcalEvent: calendar_v3.Schema$Event = {
    summary: event.title,
    description: event.description,
    location: event.location,
    start: {
      dateTime: event.start_time,
      timeZone: event.timezone || 'America/New_York',
    },
    end: {
      dateTime: event.end_time,
      timeZone: event.timezone || 'America/New_York',
    },
  };

  if (event.google_event_id) {
    // Update existing
    const res = await calendar.events.update({
      calendarId: 'primary',
      eventId: event.google_event_id,
      requestBody: gcalEvent,
    });
    return res.data.id!;
  } else {
    // Create new
    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: gcalEvent,
    });
    return res.data.id!;
  }
}

export async function deleteGoogleCalendarEvent(
  googleEventId: string,
  instructorId: string,
): Promise<void> {
  const calendar = await getAuthenticatedCalendar(instructorId);
  if (!calendar) return;

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: googleEventId,
  });
}

export async function pushBookingToGoogleCalendar(
  bookingId: string,
): Promise<void> {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: booking } = await supabaseAdmin
    .from('private_lesson_bookings')
    .select('*, instructor:members!instructor_id(display_name), student:members!member_id(display_name)')
    .eq('id', bookingId)
    .single();

  if (!booking) return;

  const calendar = await getAuthenticatedCalendar(booking.instructor_id);
  if (!calendar) return;

  const gcalEvent: calendar_v3.Schema$Event = {
    summary: `Private Lesson: ${booking.student.display_name}`,
    description: booking.member_notes || '',
    start: {
      dateTime: booking.start_time,
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: booking.end_time,
      timeZone: 'America/New_York',
    },
  };

  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: gcalEvent,
  });

  await supabaseAdmin
    .from('private_lesson_bookings')
    .update({ gcal_event_id: res.data.id })
    .eq('id', bookingId);
}
```

### 9.3 iCal Subscription Feeds

Members can subscribe to their events via an iCal URL (works with Apple Calendar, Google Calendar, Outlook).

```typescript
// app/api/calendar/ical/[token]/route.ts
import ical, { ICalCalendarMethod } from 'ical-generator';

export async function GET(
  request: Request,
  { params }: { params: { token: string } },
) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Look up member by opaque iCal token
  const { data: member } = await supabaseAdmin
    .from('members')
    .select('id')
    .eq('ical_token', params.token)
    .single();

  if (!member) {
    return new Response('Not Found', { status: 404 });
  }

  // Get member's RSVPd events (going + waitlist) for the next 6 months
  const sixMonthsAhead = new Date();
  sixMonthsAhead.setMonth(sixMonthsAhead.getMonth() + 6);

  const { data: rsvps } = await supabaseAdmin
    .from('event_rsvps')
    .select('status, events(*)')
    .eq('member_id', member.id)
    .in('status', ['going', 'waitlist', 'pending_payment'])
    .gte('events.start_time', new Date().toISOString())
    .lte('events.start_time', sixMonthsAhead.toISOString());

  // Get private lesson bookings
  const { data: bookings } = await supabaseAdmin
    .from('private_lesson_bookings')
    .select('*, instructor:members!instructor_id(display_name)')
    .eq('member_id', member.id)
    .in('status', ['confirmed'])
    .gte('start_time', new Date().toISOString());

  // Build iCal feed
  const calendar = ical({
    name: 'Salsa Ninja',
    timezone: 'America/New_York',
    method: ICalCalendarMethod.PUBLISH,
    prodId: '//Salsa Ninja//Calendar//EN',
  });

  for (const rsvp of rsvps ?? []) {
    const event = rsvp.events as any;
    if (!event) continue;

    calendar.createEvent({
      id: event.id,
      start: new Date(event.start_time),
      end: new Date(event.end_time),
      summary: rsvp.status === 'waitlist'
        ? `[Waitlist] ${event.title}`
        : event.title,
      description: event.description || '',
      location: event.location || '',
      url: `${process.env.NEXT_PUBLIC_URL}/calendar/${event.id}`,
    });
  }

  for (const booking of bookings ?? []) {
    calendar.createEvent({
      id: booking.id,
      start: new Date(booking.start_time),
      end: new Date(booking.end_time),
      summary: `Private Lesson with ${booking.instructor.display_name}`,
      description: booking.member_notes || '',
    });
  }

  return new Response(calendar.toString(), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="salsa-ninja.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
```

**iCal token security:** Each member has a unique `ical_token` UUID. The URL looks like `/api/calendar/ical/a1b2c3d4-...` and does not require authentication (so calendar apps can poll it). The token is opaque and unguessable. Members can regenerate their token from Settings if it is compromised.

---

## 10. UI Component Architecture

### 10.1 Calendar View Components

The calendar UI is built on patterns from [`lramos33/big-calendar`](https://github.com/lramos33/big-calendar) (shadcn/ui native calendar), adapted for the studio's needs.

```
components/calendar/
├── CalendarView.tsx              # Main container with view switching
├── CalendarHeader.tsx            # Month/week navigation, view switcher, filters
├── ViewSwitcher.tsx              # Month | Week | Day | List toggle
├── views/
│   ├── MonthView.tsx             # Grid layout with event dots/chips
│   ├── WeekView.tsx              # 7-column time grid
│   ├── DayView.tsx               # Single-column time grid
│   └── ListView.tsx              # Chronological card list
├── EventCard.tsx                 # Compact event display (in grid/list)
├── EventDetailModal.tsx          # Full event details (sheet/dialog)
├── RSVPButton.tsx                # RSVP action with status feedback
├── WaitlistIndicator.tsx         # "3rd on waitlist" badge
├── CapacityBadge.tsx             # "12/20 spots" display
├── EventColorKey.tsx             # Legend for event type colors
├── filters/
│   ├── EventTypeFilter.tsx       # Filter by class/workshop/social/etc.
│   ├── InstructorFilter.tsx      # Filter by instructor
│   └── DanceStyleFilter.tsx      # Filter by dance style
├── booking/
│   ├── BookingSlotPicker.tsx     # Date + time slot selection for private lessons
│   ├── InstructorSelect.tsx      # Instructor dropdown with availability preview
│   └── BookingConfirmation.tsx   # Summary before Stripe redirect
├── checkin/
│   ├── QRCheckInPage.tsx         # /checkin/:eventId page
│   ├── QRDisplay.tsx             # QR code display for projector/print
│   ├── QRScanner.tsx             # Instructor scanning interface
│   └── CheckInSuccess.tsx        # Confirmation animation
└── attendance/
    ├── AttendanceList.tsx         # Per-event attendance roster (staff)
    ├── AttendanceHistory.tsx      # Per-member attendance timeline
    └── AttendanceStats.tsx        # Analytics charts (staff)
```

### 10.2 Event Color Coding

| Event Type | Color | Tailwind Class |
|-----------|-------|----------------|
| Class | Blue | `bg-blue-500` |
| Workshop | Purple | `bg-purple-500` |
| Bootcamp | Red (primary) | `bg-red-500` |
| Studio Social | Amber (secondary) | `bg-amber-500` |
| Community | Green | `bg-green-500` |

### 10.3 Responsive Breakpoints

Following the project convention (mobile-first):

| Breakpoint | Calendar Default View |
|-----------|----------------------|
| `< sm (640px)` | List view (cards) |
| `sm-md (640-768px)` | List or 3-day view |
| `md-lg (768-1024px)` | Week view (scrollable) |
| `lg+ (1024px+)` | Month view with event chips |

### 10.4 Key Interactions

| Component | Interaction | Result |
|-----------|-------------|--------|
| `EventCard` | Click | Opens `EventDetailModal` |
| `RSVPButton` | Click (free) | Immediate RSVP, optimistic UI |
| `RSVPButton` | Click (paid) | Redirect to Stripe Checkout |
| `RSVPButton` | Click (full) | Join waitlist with position display |
| `BookingSlotPicker` | Select slot | Highlights selection, enables "Book" |
| `QRCheckInPage` | Page load | Auto-check-in if token valid |
| `AttendanceList` | Toggle member | Manual check-in/un-check-in |

---

## 11. API Route Architecture

Extends the existing `/api/events/*` routes defined in [api-endpoints.md](../api-endpoints.md) with new route groups.

```
/api
├── /events                                    # Existing (enhanced)
│   ├── GET  /                                 # List events (with filters: type, instructor, style, date range)
│   ├── POST /                                 # Create event (staff)
│   ├── GET  /:id                              # Event details + RSVP count + user's RSVP status
│   ├── PATCH /:id                             # Update event (staff)
│   ├── POST /:id/rsvp                         # RSVP (calls rsvp_to_event RPC)
│   ├── DELETE /:id/rsvp                       # Cancel RSVP
│   └── POST /community                        # Submit community event (member)
│
├── /series                                    # NEW (Phase 0)
│   ├── GET  /                                 # List event series (staff)
│   ├── POST /                                 # Create series + generate initial events
│   ├── PATCH /:id                             # Update series template
│   ├── DELETE /:id                            # Delete series + optionally cancel future events
│   └── POST /:id/generate                     # Regenerate events for series
│
├── /bookings                                  # NEW (Phase 1)
│   ├── GET  /                                 # My bookings / all bookings (staff)
│   ├── POST /                                 # Create booking → Stripe Checkout
│   ├── GET  /:id                              # Booking details
│   ├── PATCH /:id/cancel                      # Cancel booking (with refund logic)
│   └── PATCH /:id/reschedule                  # Reschedule booking
│
├── /availability                              # NEW (Phase 1)
│   ├── GET  /:instructorId                    # Get instructor's availability rules
│   ├── GET  /:instructorId/slots              # Get concrete available slots for date range
│   ├── POST /                                 # Set availability rules (staff)
│   ├── PATCH /:id                             # Update availability rule
│   └── POST /override                         # Create date override (block/add)
│
├── /checkin                                   # NEW (Phase 2)
│   ├── POST /event/:eventId                   # Member self-check-in (per-class QR)
│   ├── POST /studio                           # Member self-check-in (studio-wide QR)
│   ├── POST /scan                             # Instructor scans member QR
│   └── GET  /verify/:eventId                  # Verify check-in token (pre-flight)
│
├── /attendance                                # NEW (Phase 2)
│   ├── GET  /event/:eventId                   # Attendance list for event (staff)
│   ├── GET  /member/:memberId                 # Attendance history for member
│   └── GET  /stats                            # Attendance analytics (staff)
│
├── /calendar                                  # NEW (Phase 1)
│   ├── GET  /connect                          # Initiate Google OAuth for instructor
│   ├── GET  /callback                         # Handle Google OAuth callback
│   ├── POST /sync                             # Manually push event to Google Calendar
│   ├── POST /disconnect                       # Remove Google Calendar connection
│   └── GET  /ical/:token                      # Serve iCal subscription feed
│
├── /payments                                  # Existing (extended)
│   ├── POST /checkout                         # Create Stripe checkout (subscriptions)
│   ├── GET  /portal                           # Get Stripe portal URL
│   └── POST /webhook                          # Stripe webhook handler (extended for events + bookings)
│
└── /cron                                      # NEW (internal, Vercel Cron)
    ├── GET /generate-events                   # Weekly: extend recurring event window
    └── GET /expire-payments                   # Every 15 min: clean up stale pending payments
```

### Route Auth Matrix

| Route Group | Owner | Instructor | Full Member | Limited Member | Guest |
|-------------|-------|------------|-------------|----------------|-------|
| `GET /events` | All | All | Visibility-filtered | Visibility-filtered | Public only |
| `POST /events` | Yes | Yes | No | No | No |
| `POST /events/:id/rsvp` | Yes | Yes | Yes | Yes | No |
| `GET /series` | Yes | Yes | No | No | No |
| `POST /series` | Yes | Yes | No | No | No |
| `GET /bookings` | All | Own+assigned | Own | Own | No |
| `POST /bookings` | Yes | Yes | Yes | Yes | No |
| `GET /availability/:id` | Yes | Yes | Yes | Yes | No |
| `POST /availability` | Yes | Yes | No | No | No |
| `POST /checkin/*` | Yes | Yes | Yes | Yes | No |
| `GET /attendance/*` | Yes | Yes | No | No | No |
| `GET /calendar/connect` | Yes | Yes | No | No | No |
| `GET /calendar/ical/:token` | No auth (token-based) | | | | |
| `GET /cron/*` | Cron secret only | | | | |

---

## 12. npm Dependencies

All dependencies are MIT-licensed and free to use.

```
Package                      Version   Purpose                              Phase
─────────────────────────────────────────────────────────────────────────────────
rrule                        ^2.8.1    RRULE parsing and date expansion     0
luxon                        ^3.4.4    Timezone-aware date manipulation     0
@types/luxon                 ^3.4.2    TypeScript types for Luxon           0
googleapis                   ^131.0.0  Google Calendar API client           1
ical-generator               ^7.1.0    iCal feed generation                 1
qrcode.react                 ^3.1.0    QR code SVG rendering                2
@yudiel/react-qr-scanner     ^2.0.0    Camera-based QR scanning             2
```

**Already included in project (via Next.js / existing deps):**
- `stripe` -- Stripe Node.js SDK
- `@supabase/supabase-js` -- Supabase client
- `crypto` -- Node.js built-in (HMAC for QR tokens)

---

## 13. Implementation Phases

### Phase 0 -- Demo (Class Schedule Display)

**Goal:** Display the class schedule with basic calendar views. No interactivity beyond viewing.

| Task | Tables/Functions | Dependencies |
|------|------------------|-------------|
| Extend `event_series` schema | `ALTER TABLE event_series ADD COLUMN ...` | -- |
| Extend `events` schema | `ALTER TABLE events ADD COLUMN ...` | -- |
| Implement RRULE expansion (`lib/calendar/recurrence.ts`) | -- | `rrule`, `luxon` |
| Create `generate_series_events()` DB function | -- | Extended schemas |
| Build Vercel Cron for event generation | `/api/cron/generate-events` | RRULE expansion |
| Create API: `GET /api/events` with filters | -- | Extended schemas |
| Create API: `GET/POST/PATCH/DELETE /api/series` | -- | Extended schemas |
| Build `CalendarView` component with Month/Week/Day/List | -- | Events API |
| Build `EventCard`, `EventDetailModal` | -- | CalendarView |
| Build `CalendarHeader`, `ViewSwitcher`, filters | -- | CalendarView |
| Seed initial class schedule (3 recurring weekly series) | -- | Series API |

### Phase 1 -- Core (Private Lessons & Payments)

**Goal:** Instructors offer private lessons; members book and pay via Stripe.

| Task | Tables/Functions | Dependencies |
|------|------------------|-------------|
| Create `instructor_availability` table + RLS | Table + policies | Phase 0 |
| Create `availability_overrides` table + RLS | Table + policies | Phase 0 |
| Create `private_lesson_bookings` table + RLS | Table + GIST constraint | Phase 0 |
| Create `google_oauth_tokens` table | Table (service_role only) | Phase 0 |
| Create `get_available_slots()` DB function | -- | Availability tables |
| Build API: `/api/availability/*` | Routes | Availability tables |
| Build API: `/api/bookings/*` | Routes | Bookings table, Stripe |
| Build `BookingSlotPicker`, `InstructorSelect` components | -- | Availability API |
| Extend Stripe webhook for `private_lesson` type | -- | Bookings API |
| Implement Google Calendar OAuth connect/callback | `/api/calendar/connect`, `/callback` | `googleapis` |
| Implement Google Calendar push on booking confirmation | `pushBookingToGoogleCalendar()` | OAuth tokens |
| Add `ical_token` to `members` table | Schema migration | -- |
| Build iCal subscription feed | `/api/calendar/ical/:token` | `ical-generator` |
| Cancellation/refund logic | `/api/bookings/:id/cancel` | Stripe |

### Phase 2 -- Content (Check-In & Attendance)

**Goal:** Members check in to classes via QR codes; staff view attendance data.

| Task | Tables/Functions | Dependencies |
|------|------------------|-------------|
| Create `checkin_method` enum | -- | -- |
| Create `check_ins` table + RLS | Table + policies | Phase 0 events |
| Create `sync_rsvp_attendance()` trigger | Trigger on `check_ins` | `check_ins` + `event_rsvps` |
| Implement HMAC check-in tokens | `lib/calendar/checkin.ts` | -- |
| Build API: `/api/checkin/*` | Routes | Check-ins table |
| Build API: `/api/attendance/*` | Routes | Check-ins table |
| Build `QRDisplay` component (projector) | -- | `qrcode.react` |
| Build `QRCheckInPage` (member phone) | `/checkin/:eventId` page | Check-in API |
| Build `QRScanner` (instructor phone) | -- | `@yudiel/react-qr-scanner` |
| Build `AttendanceList`, `AttendanceHistory`, `AttendanceStats` | -- | Attendance API |
| Studio-wide QR flow with time-window resolution | -- | Check-in API |

### Phase 5 -- Events (RSVP, Capacity, Waitlist, Event Payments)

**Goal:** Full event management with RSVP, waitlist auto-promotion, and paid events.

| Task | Tables/Functions | Dependencies |
|------|------------------|-------------|
| Add `pending_payment` to `rsvp_status` enum | `ALTER TYPE` | -- |
| Add `stripe_checkout_session`, `payment_expires_at` to `event_rsvps` | Schema migration | -- |
| Create `notification_queue` table + RLS | Table + policies | -- |
| Create `rsvp_to_event()` DB function | -- | Extended `event_rsvps` |
| Create `promote_from_waitlist()` trigger | Trigger on `event_rsvps` | `notification_queue` |
| Create `confirm_rsvp_payment()` DB function | -- | Stripe integration |
| Create `expire_rsvp_payment()` DB function | -- | Cron job |
| Build API: `POST /api/events/:id/rsvp`, `DELETE /api/events/:id/rsvp` | Routes | RSVP functions |
| Extend Stripe webhook for `event_rsvp` type | -- | RSVP functions |
| Build safety-net cron for expired payments | `/api/cron/expire-payments` | `notification_queue` |
| Build `RSVPButton`, `WaitlistIndicator`, `CapacityBadge` components | -- | RSVP API |
| Create `event_waitlist` view | -- | `event_rsvps` |
| Enhance `upcoming_events` view | -- | All calendar tables |
| Notification processing (Edge Function or cron) | -- | `notification_queue` |

---

## 14. Cost Projections

| Service | Cost | Notes |
|---------|------|-------|
| **Supabase Pro** | $25/mo | Sufficient for all tables, functions, RLS, Realtime. 8 GB database, 250 MB file storage, 500K edge function invocations. |
| **Google Calendar API** | Free | Within default quota (1M queries/day). OAuth2 consent screen in "Testing" mode (limited to 100 users) is fine for 3 instructors. |
| **Stripe** | 2.9% + 30c/txn | Standard pricing. No monthly fee. Only charged on actual payments (private lessons, paid events). |
| **Vercel** | Free tier | Hobby plan includes cron jobs (1/day minimum interval). Pro plan ($20/mo) if sub-minute cron needed. Weekly event generation and 15-min payment expiry crons fit within Pro limits. |
| **npm packages** | Free | All MIT-licensed. No runtime costs. |

**Total incremental cost:** $25/mo (Supabase Pro) + Stripe transaction fees. Google Calendar API and npm packages are free. Vercel cron may require Pro ($20/mo) for the 15-minute payment expiry cron.

---

## 15. Open Questions (Deferred)

These questions are intentionally deferred to be resolved during implementation when more context is available.

1. **Community event recurrence:** Should community-submitted events support recurring patterns? Current recommendation: No -- keep community events as one-off to reduce moderation complexity. Revisit if demand emerges.

2. **Private lesson cancellation policy:** Should the refund policy be time-based (e.g., full refund > 48h, partial 24-48h, none < 24h) or always refundable? Current recommendation: Time-based with the 48/24 hour thresholds documented in Section 6.7. Final policy to be confirmed by studio owner.

3. **Studio-wide QR rotation:** Should the studio-wide QR code rotate daily (HMAC with date) or be permanent? Current recommendation: Daily rotation via date-scoped HMAC. The QR poster content stays the same but the URL redirects through a date-stamped endpoint. This prevents sharing screenshots to fake attendance.

4. **Instructor all-day blocking:** Should instructors be able to block time for all-day events (conferences, vacations)? Current recommendation: Yes, via `availability_overrides` with `is_available = FALSE` and `start_time = NULL` / `end_time = NULL` for whole-day blocks. The schema supports this.

5. **Back-to-back class check-in overlap:** How should the system handle check-ins when two classes are scheduled consecutively (e.g., 7:00-8:00 Salsa, 8:00-9:00 Bachata) and a member arrives at 7:50? Current recommendation: The check-in time window of `[start - 30min, start + 2h]` means the 7:50 check-in falls within the window for both classes. For per-class QR, this is not an issue (each class has its own QR). For studio-wide QR, the system should present a class picker when multiple events fall within the window.

---

*Last updated: 2026-02-04*
*Cross-references: [database-schema.md](../database-schema.md) | [auth-and-roles.md](../auth-and-roles.md) | [api-endpoints.md](../api-endpoints.md) | [calendar.md](./calendar.md)*
