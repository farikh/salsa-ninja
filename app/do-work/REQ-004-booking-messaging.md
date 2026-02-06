---
id: REQ-004
title: Student-instructor messaging on bookings
status: done
claimed_at: 2026-02-06T17:12:00Z
completed_at: 2026-02-06T17:14:00Z
created_at: 2026-02-06T16:00:00Z
user_request: UR-001
related: [REQ-003, REQ-005, REQ-006]
batch: private-lesson-overhaul
bead_id: app-47y.4
bead_parent: app-47y
---

# Student-Instructor Messaging on Bookings

## What

Once a class is booked, the student should be able to message the instructor and vice-versa. Messages are scoped to the specific booking/appointment.

## Detailed Requirements

- After a booking is created (any status: pending, confirmed), both student and instructor can exchange messages
- Messages are tied to the specific booking (not a general chat)
- Both parties can see the message thread from their dashboard
- Simple text messaging (no need for rich media initially)
- Real-time or near-real-time delivery

## Constraints

- Scoped to individual bookings, not general chat
- Must work with existing booking_messages table and API if they exist
- Keep implementation simple — this is booking-specific communication, not a full chat system

## Dependencies

- Depends on: REQ-003 (bookings must exist with the confirmation workflow)

## Builder Guidance

- Certainty level: Firm on the need for messaging. Exploratory on real-time vs polling.
- Scope cues: Keep it simple — just text messages tied to bookings

## Full Context

See [user-requests/UR-001/input.md](./user-requests/UR-001/input.md) for complete verbatim input.

---
*Source: See UR-001/input.md for full verbatim input*
