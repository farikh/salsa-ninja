---
id: UR-001
title: Private Lesson Scheduling & Booking System Overhaul
created_at: 2026-02-06T16:00:00Z
requests: [REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006]
word_count: 195
---

# Private Lesson Scheduling & Booking System Overhaul

## Summary

User wants a complete overhaul of the private lessons management page with weekly/monthly availability scheduling for instructors, a booking confirmation workflow, in-app messaging between student and instructor, and dashboard integration showing booking status.

## Extracted Requests

| ID | Title | Summary |
|----|-------|---------|
| REQ-001 | Instructor availability scheduling (weekly/monthly views) | Weekly and monthly calendar views for instructors to set recurring or one-time availability |
| REQ-002 | Student booking calendar with month paging | Available slots displayed on book-a-class page, students can page ahead to end of month |
| REQ-003 | Booking confirmation workflow | Instructor confirms/rejects bookings, pending state while waiting, calendar slot blocked during pending |
| REQ-004 | Student-instructor messaging on bookings | After booking, student and instructor can message each other about the appointment |
| REQ-005 | Instructor dashboard booking management | Bookings appear on instructor dashboard for confirmation with accept/reject actions |
| REQ-006 | Student dashboard booking status | Appointment and status (pending/confirmed/rejected) visible on student dashboard |

## Batch Constraints

- All features center around the private-sessions page and dashboard
- Booking confirmation flow must block the calendar slot while pending
- Messaging is scoped to individual bookings, not general chat
- The existing private lesson booking system and API routes should be evolved, not replaced

## Full Verbatim Input

couple of issues i'm noticing on the private lessons management page. 1. would love to have a selection that allows weekly or monthly availability scheduling. when weekly selected a weekly calendar becomes available for scheduling. when monthly selected, the current months calendar appears. user managing schedule can select recurring or one time. whatver time slots are scheduled should become available on the book a class page. students should be able to page ahead to the end of the month to book their schedules. once a class is booked the student should be able message the instructor and vice-versa. When a class is booked, the booking becomes available on the instructors dashboard for confirmation. If the instructor confirm, then appointment is considred booked. While the student is waiting for confirmation, the appointment may appear as pending. It is not available on the calendar unless the student cancels the request or the instructor rejects the request. The appointment and status appears on the students dashboard. Create beads under a master story for this development and begin review of the stories using the design agent with review loop.

---
*Captured: 2026-02-06T16:00:00Z*
