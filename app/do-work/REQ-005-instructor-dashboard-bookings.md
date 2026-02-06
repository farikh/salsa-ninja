---
id: REQ-005
title: Instructor dashboard booking management
status: done
claimed_at: 2026-02-06T17:15:00Z
completed_at: 2026-02-06T17:20:00Z
created_at: 2026-02-06T16:00:00Z
user_request: UR-001
related: [REQ-003, REQ-004, REQ-006]
batch: private-lesson-overhaul
bead_id: app-47y.5
bead_parent: app-47y
---

# Instructor Dashboard Booking Management

## What

When a class is booked, the booking appears on the instructor's dashboard for confirmation. Instructor can confirm or reject booking requests from their dashboard.

## Detailed Requirements

- Pending booking requests appear prominently on the instructor dashboard
- Each pending booking shows: student name, requested date/time, lesson details
- Instructor can "Confirm" or "Reject" each booking
- Confirmed bookings move to an "Upcoming Lessons" section
- Rejected bookings are removed and the slot opens back up
- Instructor can access the message thread for each booking (REQ-004)

## Constraints

- Must integrate with existing dashboard page structure
- Only instructors and owners see booking management
- Evolve existing dashboard, don't replace it

## Dependencies

- Depends on: REQ-003 (confirmation workflow must exist)

## Full Context

See [user-requests/UR-001/input.md](./user-requests/UR-001/input.md) for complete verbatim input.

---
*Source: See UR-001/input.md for full verbatim input*
