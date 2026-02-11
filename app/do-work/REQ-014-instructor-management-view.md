---
id: REQ-014
title: "Instructor Private Sessions shows booking page instead of management view"
status: pending
created_at: 2026-02-11T18:30:00Z
bead_id: app-k63
priority: P1
---

# Instructor Private Sessions shows booking page instead of management view

## What

When an instructor navigates to the Private Sessions tab, they see "Book a Session" with the student booking flow (instructor picker, calendar, time slots). Instructors should see a management view — their upcoming bookings with accept/cancel/reschedule actions.

## Context

- Instructors manage sessions, they don't book them
- The Private Lessons tab currently renders the same booking component for all roles
- Need role-based conditional rendering: students see booking flow, instructors see management view

## Acceptance Criteria

- [ ] Instructors see a list of their upcoming bookings (not a booking calendar)
- [ ] Students still see the booking flow as before
- [ ] The instructor view shows booking details: student name, date/time, status
