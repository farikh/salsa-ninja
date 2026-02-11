---
id: REQ-015
title: "Add accept/cancel/reschedule buttons to instructor booking list"
status: pending
created_at: 2026-02-11T18:30:00Z
bead_id: app-23o
priority: P1
---

# Add accept/cancel/reschedule buttons to instructor booking list

## What

Instructor booking list items (on dashboard Upcoming Bookings card and Private Sessions management view) need action buttons:
- **Accept** (for pending bookings) — confirms the booking
- **Cancel** — cancels the booking
- **Reschedule** — allows proposing a new time

Each action should optionally allow adding a message to the student.

## Context

- Currently bookings are listed as read-only with status badges
- Pending bookings need instructor approval — there's no way to approve them currently
- This is tightly related to REQ-014 (instructor management view)

## Acceptance Criteria

- [ ] Pending bookings show an "Accept" button
- [ ] All bookings show "Cancel" and "Reschedule" options
- [ ] Each action opens a confirmation with optional message field
- [ ] Actions update the booking status in the database
- [ ] Student is notified of status changes
