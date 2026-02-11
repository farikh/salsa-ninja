---
id: REQ-007
title: "Phase A: Unified Schedule View"
status: claimed
claimed_at: 2026-02-10T17:30:00Z
route: C-Feature
design_doc: docs/specs/features/unified-schedule.md
created_at: 2026-02-10T17:00:00Z
user_request: UR-002
bead_id: app-vjv.1
bead_parent: app-vjv
related: [REQ-008, REQ-009, REQ-010, REQ-011]
---

# Phase A: Unified Schedule View

## What

Replace the fragmented `/private-sessions` and `/calendar` views with a single `/my-schedule` route for authenticated users. This unified calendar aggregates private lesson bookings and RSVP'd studio events into one color-coded view.

## Context

- PRD: `docs/specs/unified-experience-prd.md` (Section 5)
- Students currently navigate two separate calendars to see their commitments
- Instructors have no single view of their teaching + event schedule
- The public event calendar at `/calendar` remains unchanged for unauthenticated users
- Group classes remain a separate calendar
- Dashboard stays as the home page; My Schedule is one tap away

## Requirements (from PRD)

- **US-1:** Student sees all upcoming lessons and RSVP'd events in one calendar
- **US-2:** Instructor sees teaching schedule alongside events
- **US-3:** Tap any item to see details, message instructor, or manage booking
- **US-4:** Student can overlay instructor availability on their schedule for booking
- **US-5:** Switch between week/day/month/list views

## Calendar Item Types

| Type | Color | Source |
|------|-------|--------|
| Confirmed lesson (teaching) | Red | `private_lesson_bookings` |
| Confirmed lesson (attending) | Blue | `private_lesson_bookings` |
| Pending lesson request | Yellow/amber | `private_lesson_bookings` |
| RSVP'd event | Purple | `event_rsvps` |
| Available slot (browse mode) | Green | `instructor_availability` |

## Acceptance Criteria

- [ ] Authenticated users see `/my-schedule` as their primary calendar
- [ ] Calendar aggregates data from `private_lesson_bookings` and `event_rsvps`
- [ ] Items are color-coded by type
- [ ] Tapping an item opens a detail sheet with relevant actions
- [ ] Week view is the default; all four views are functional
- [ ] Realtime updates when bookings change status or new messages arrive
- [ ] Mobile: swipe between days in day view; bottom sheet for details
