# Calendar & Scheduling Research Findings

> **Date:** 2026-02-03
> **Bead:** app-5cn (Design calendar & scheduling architecture)
> **Status:** Research complete
> **Related:** [Calendar Feature Spec](../specs/features/calendar.md) | [Database Schema](../specs/database-schema.md)

---

## Research Summary

Six research tasks were conducted in parallel to inform the calendar and scheduling architecture design. This document captures findings from all six. The results cover UI libraries, recurring event patterns, private lesson booking, Google Calendar integration, RSVP/waitlist logic, and QR check-in/attendance tracking.

---

## 1. Calendar UI Libraries (app-5cn.1)

Evaluated libraries for React/Next.js calendar with Month/Week/Day/List views and Tailwind/shadcn compatibility.

| Library | Stars | License | Tailwind Compatible | Recommendation |
|---------|-------|---------|---------------------|----------------|
| FullCalendar (@fullcalendar/react) | 8,638 | MIT | Requires CSS customization | Industry standard, extensive API, all views. Premium plugins (timeline, resource) are paid. |
| react-big-calendar | ~8K | MIT | Moderate (CSS overrides needed) | Good community, less actively maintained than FullCalendar |
| @schedule-x/react | Newer | MIT | Built for modern React | Promising but less mature |
| lramos33/big-calendar | 861 | MIT | shadcn/ui native | Built specifically with shadcn/ui + Tailwind, best visual fit |
| yassir-jeraidi/full-calendar | 331 | MIT | shadcn/ui native | Recent, shadcn-based, active development |
| shadcn-ui-big-calendar (list-jonas) | 197 | MIT | shadcn/ui native | shadcn wrapper around react-big-calendar |
| Cal.com | 40,024 | AGPLv3 | N/A | Full scheduling platform, not extractable as UI component. AGPLv3 license is viral. |

### Decision

Use **`lramos33/big-calendar`** as primary reference -- it is built natively with shadcn/ui and Tailwind CSS, matching our stack exactly. Use FullCalendar docs as the API/behavior reference for what features to implement. Do not use Cal.com due to AGPLv3 license.

---

## 2. RRULE & Recurring Events (app-5cn.2)

### Library

`rrule` (rrule.js) v2.8.1 with Luxon for timezone support. ~800K weekly npm downloads. TypeScript. `RRuleSet` supports EXDATE/RDATE.

### Instance Pattern

**Materialized instances** (not hybrid, not computed). The `event_series` table stores RRULE + defaults, and individual `events` rows are generated from it.

**Rationale:** RSVPs, attendance, payments, and capacity all require a real `events` row. Data volume is tiny (~200 instances/month for a dance studio). Avoids on-the-fly expansion complexity.

### Exception Handling

- **Cancellations:** `cancelled_at` column on `events`, EXDATE on `event_series`
- **Single-instance modifications:** `is_exception = TRUE` flag, preserved during regeneration
- **Series modifications ("this and forward"):** Split into two `event_series` records

### Schema Additions on `event_series`

`timezone`, `default_start_time`, `default_end_time`, `default_instructor_id`, `default_location`, `default_capacity`, `event_type`, `exdates`

### Schema Additions on `events`

`is_exception`, `cancelled_at`, `original_start_time`

### Timezone & DST

Store as TIMESTAMPTZ (UTC) in PostgreSQL. Use rrule + Luxon for expansion with `tzid` parameter. Wall-clock time stays constant across DST transitions.

---

## 3. Private Lesson Booking (app-5cn.3)

**Decision: Build custom on Supabase, not embed or fork Cal.com.**

Cal.com (AGPLv3) is too complex and license-risky. Scope is small (3 instructors).

### Key Schema

- **`instructor_availability`** -- Recurring rules (day_of_week + time ranges) with `effective_from`/`effective_until`
- **`availability_overrides`** -- One-off blocked dates / extra availability
- **`private_lesson_bookings`** -- Separate from `events` table, with GIST exclusion constraint for double-booking prevention

### Availability Algorithm

PostgreSQL `get_available_slots()` function using `generate_series` to expand recurring rules, exclude overrides, exclude existing bookings via `tstzrange` overlap check.

### Double-Booking Prevention

```sql
EXCLUDE USING GIST (
  instructor_id WITH =,
  tstzrange(start_time, end_time) WITH &&
) WHERE (status NOT IN ('cancelled'))
```

Database-level guarantee -- no application-layer race conditions possible.

### Booking Flow

Member selects slot -> Stripe Checkout -> webhook fires -> INSERT booking with `status='confirmed'` (atomic with conflict check).

---

## 4. Google Calendar Integration (app-5cn.4)

### Authentication

OAuth2 per instructor (not service account). Service accounts cannot write to personal Gmail calendars.

### Sync Direction

One-way push (app -> Google Calendar). No two-way sync -- the app is the source of truth.

### Token Storage

Separate `google_oauth_tokens` table with no public RLS policies. Access only via `service_role` key in API routes.

### Token Refresh

Include `expiry_date` in `setCredentials()`, listen for `tokens` event, persist back to Supabase.

### iCal Export

`ical-generator` npm package. Serve `.ics` feeds via route handler. Authenticate via per-member opaque UUID token in URL.

### npm Packages

`googleapis`, `ical-generator`

### Schema Additions

- `google_oauth_tokens` table
- `google_event_id TEXT` on events
- `ical_token UUID` on members

### API Routes

| Route | Purpose |
|-------|---------|
| `/api/calendar/connect` | Initiate OAuth flow |
| `/api/calendar/callback` | Handle OAuth callback |
| `/api/calendar/sync` | Push events to Google Calendar |
| `/api/calendar/disconnect` | Revoke tokens and clean up |
| `/api/calendar/ical/[token]` | Serve iCal feed for subscribers |

---

## 5. RSVP, Capacity & Waitlist (app-5cn.5)

### Atomic RSVP

`rsvp_to_event()` SECURITY DEFINER function with `SELECT FOR UPDATE` on events row. Returns JSONB with status (`going`, `waitlist`, `pending_payment`).

### Waitlist Auto-Promotion

Database trigger (AFTER UPDATE) on `event_rsvps`. When someone leaves a confirmed spot, the first waitlisted person is promoted. Trigger uses `WHEN` clause for efficient filtering.

### Waitlist Position

Sparse numbering internally, `ROW_NUMBER()` for gap-free display positions.

### Paid Events

Reserve-then-pay with Stripe Checkout Session expiration (30 min). Confirm via `checkout.session.completed` webhook. Expire via `checkout.session.expired` webhook + safety-net cron job.

### Schema Additions

- `pending_payment` enum value added to `rsvp_status`
- `stripe_checkout_session` and `payment_expires_at` columns on `event_rsvps`
- `notification_queue` table for async notification delivery via pg_net

---

## 6. QR Check-In & Attendance (app-5cn.6)

### QR Generation

`qrcode.react` (SVG mode, error correction level H for posters).

### Primary Flow (Member Self-Check-In)

QR encodes HMAC-signed URL. Member scans with phone camera (no in-app scanner needed), opens URL, authenticated check-in. Time-window enforcement (30 min before/after `start_time`).

### Walk-In Flow (Instructor Scans Member)

Instructor scans member's profile QR using `@yudiel/react-qr-scanner` (dynamic import, `ssr: false`).

### Schema

New `check_ins` table + `checkin_method` enum (`qr_self`, `qr_instructor`, `manual`, `studio_qr`). Trigger syncs back to `event_rsvps.attended`. Separate from RSVP to handle walk-ins who had no RSVP.

### Studio-Wide QR

Fixed URL with daily HMAC token. Server resolves current event via time-window query. Handles multiple simultaneous classes with a picker UI.

### Security

- HMAC-SHA256 signed URLs (date-scoped)
- Supabase auth required
- Time-window enforcement
- No database token storage needed

### npm Packages

`qrcode.react`, `@yudiel/react-qr-scanner`
