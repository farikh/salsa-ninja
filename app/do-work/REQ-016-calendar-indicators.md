---
id: REQ-016
title: "Calendar indicators missing on instructor private lessons view"
status: pending
created_at: 2026-02-11T18:30:00Z
bead_id: app-8sk
priority: P1
---

# Calendar indicators missing on instructor private lessons view

## What

The availability calendar on the instructor Private Lessons tab does not show green/red/amber dot indicators for available, booked, or unread dates. The calendar legend shows "Available", "Booked", "Unread" but no dates have colored indicators.

## Context

- The calendar component renders but all dates appear plain
- The indicators may depend on availability data that isn't being fetched for the instructor's own schedule
- The student booking view may have a different data source

## Acceptance Criteria

- [ ] Calendar dates with availability show green indicator
- [ ] Calendar dates with bookings show red indicator
- [ ] Calendar dates with unread messages show amber indicator
- [ ] Legend matches the actual indicator colors
