---
id: REQ-002
title: Student booking calendar with month paging
status: done
claimed_at: 2026-02-06T17:05:00Z
completed_at: 2026-02-06T17:10:00Z
created_at: 2026-02-06T16:00:00Z
user_request: UR-001
related: [REQ-001, REQ-003]
batch: private-lesson-overhaul
bead_id: app-47y.2
bead_parent: app-47y
---

# Student Booking Calendar with Month Paging

## What

Display instructor availability on the book-a-class page so students can browse and book private lessons. Students should be able to page ahead to the end of the month to view and book future slots.

## Detailed Requirements

- Available time slots from REQ-001 should appear on the booking page
- Students can page forward through the current month to see all available slots
- Calendar shows only open (unbooked, not-pending) slots
- Slots that are pending confirmation (REQ-003) are NOT shown as available
- Student selects a slot and initiates a booking request
- Clean, intuitive calendar UI that works on mobile

## Constraints

- Must read from the same availability tables that REQ-001 writes to
- Slots blocked by pending bookings must not appear available
- Evolve existing booking calendar (CalendarView component), don't replace entirely

## Dependencies

- Depends on: REQ-001 (needs instructor availability slots to exist)
- Blocks: REQ-003 (booking confirmation needs bookings to exist)

## Full Context

See [user-requests/UR-001/input.md](./user-requests/UR-001/input.md) for complete verbatim input.

---
*Source: See UR-001/input.md for full verbatim input*
