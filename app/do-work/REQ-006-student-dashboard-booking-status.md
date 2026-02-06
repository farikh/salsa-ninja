---
id: REQ-006
title: Student dashboard booking status
status: done
claimed_at: 2026-02-06T17:15:00Z
completed_at: 2026-02-06T17:20:00Z
created_at: 2026-02-06T16:00:00Z
user_request: UR-001
related: [REQ-003, REQ-004, REQ-005]
batch: private-lesson-overhaul
bead_id: app-47y.6
bead_parent: app-47y
---

# Student Dashboard Booking Status

## What

The appointment and its status (pending/confirmed/rejected/cancelled) appears on the student's dashboard. Students can see all their bookings and current status.

## Detailed Requirements

- Student dashboard shows all their private lesson bookings
- Each booking displays: instructor name, date/time, status (pending/confirmed/rejected/cancelled)
- Pending bookings are clearly marked as "Pending Confirmation"
- Confirmed bookings show as "Booked" with a link to message the instructor (REQ-004)
- Student can cancel a pending request (which frees the slot)
- Clean integration with the existing "Upcoming Bookings" card on the dashboard

## Constraints

- Must work with existing dashboard layout
- All members (not just students) should see their own bookings
- Evolve existing "Upcoming Bookings" placeholder on dashboard

## Dependencies

- Depends on: REQ-003 (booking status workflow must exist)

## Full Context

See [user-requests/UR-001/input.md](./user-requests/UR-001/input.md) for complete verbatim input.

---
*Source: See UR-001/input.md for full verbatim input*
