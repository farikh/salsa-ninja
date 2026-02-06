---
id: REQ-003
title: Booking confirmation workflow
status: done
claimed_at: 2026-02-06T17:10:00Z
completed_at: 2026-02-06T17:12:00Z
created_at: 2026-02-06T16:00:00Z
user_request: UR-001
related: [REQ-002, REQ-004, REQ-005, REQ-006]
batch: private-lesson-overhaul
bead_id: app-47y.3
bead_parent: app-47y
---

# Booking Confirmation Workflow

## What

Implement a confirmation workflow for private lesson bookings. When a student books a slot, it goes to "pending" state. The instructor can confirm or reject. While pending, the slot is blocked on the calendar. The appointment is only considered "booked" after instructor confirmation.

## Detailed Requirements

- When a student books a slot, the booking status is "pending" (not confirmed)
- The pending booking blocks that time slot on the calendar — it is NOT available for other students
- Instructor receives the booking request on their dashboard (REQ-005) for confirmation
- If instructor confirms → status becomes "confirmed" / "booked"
- If instructor rejects → status becomes "rejected", time slot becomes available again
- If student cancels the request → status becomes "cancelled", time slot becomes available again
- While pending, the student sees "Pending" status on their dashboard (REQ-006)
- The time slot is only truly "available on the calendar" if: student cancels OR instructor rejects

## Constraints

- Must work with existing bookings table and API routes
- Status transitions must be atomic (no race conditions)
- Evolve existing booking status system

## Dependencies

- Depends on: REQ-002 (bookings must exist)
- Blocks: REQ-004 (messaging happens after booking), REQ-005 (instructor dashboard needs status), REQ-006 (student dashboard needs status)

## Full Context

See [user-requests/UR-001/input.md](./user-requests/UR-001/input.md) for complete verbatim input.

---
*Source: See UR-001/input.md for full verbatim input*
