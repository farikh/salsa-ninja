---
id: REQ-001
title: Instructor availability scheduling (weekly/monthly views)
status: done
claimed_at: 2026-02-06T16:45:00Z
completed_at: 2026-02-06T17:00:00Z
created_at: 2026-02-06T16:00:00Z
user_request: UR-001
related: [REQ-002, REQ-003]
batch: private-lesson-overhaul
bead_id: app-47y.1
bead_parent: app-47y
---

# Instructor Availability Scheduling (Weekly/Monthly Views)

## What

Add a view-mode selector (weekly/monthly) to the private lessons management page for instructors. When weekly is selected, a weekly calendar appears for scheduling time slots. When monthly is selected, the current month's calendar appears. Instructors can mark time slots as recurring or one-time.

## Detailed Requirements

- Toggle/selector to switch between weekly and monthly calendar views
- Weekly view: 7-day grid with time slots, instructor clicks/drags to mark availability
- Monthly view: full month calendar, instructor clicks days and sets time slots within each day
- Each time slot can be marked as "recurring" (repeats weekly) or "one-time"
- Whatever time slots are scheduled should become available on the book-a-class page (REQ-002)
- Must work with the existing instructor availability system (instructor_availability, availability_overrides tables)
- Only instructors and owners can access this scheduling interface

## Constraints

- Evolve existing private-sessions page, don't replace it
- Must integrate with existing Supabase tables for availability
- Responsive design (mobile-friendly)

## Dependencies

- Blocks: REQ-002 (students need slots to exist before they can book)

## Builder Guidance

- Certainty level: Firm on the weekly/monthly toggle and recurring/one-time. Exploratory on exact calendar UI.
- Scope cues: User wants functional calendar UI, not overly complex

## Full Context

See [user-requests/UR-001/input.md](./user-requests/UR-001/input.md) for complete verbatim input.

## Triage

**Route: C-Feature** — Complex feature with new route, components, and API endpoint

**Reasoning:** Creates new page route, 5+ new components (WeeklyGridView, AvailabilityCalendar, MonthlyAvailabilityView, AddAvailabilityDialog, EditAvailabilityPopover), and a new API endpoint. Design already completed in `docs/specs/features/private-lesson-booking-v2.md` (Reviewed, 3 rounds).

**Planning:** Design complete — proceed to implementation per Phase B roadmap.

---
*Source: See UR-001/input.md for full verbatim input*
