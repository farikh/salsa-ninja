---
id: REQ-009
title: "Phase C: Booking Flow Redesign"
status: pending
created_at: 2026-02-10T17:00:00Z
user_request: UR-002
bead_id: app-vjv.3
bead_parent: app-vjv
related: [REQ-007, REQ-008, REQ-010, REQ-011]
---

# Phase C: Booking Flow Redesign

## What

Redesign the private lesson booking flow with multiple entry points, optional booking notes, decline-with-alternatives, and first-time student discovery prompts.

## Context

- PRD: `docs/specs/unified-experience-prd.md` (Section 7)
- Currently students must navigate to `/private-sessions` — disconnected from rest of app
- No way to ask questions before committing to a booking
- Enhanced instructor cards (bio, specialties, Send Inquiry / View Availability buttons) — no dedicated profile pages
- Blocked by: Phase B (REQ-008)

## Requirements (from PRD)

- **US-11:** Start booking from schedule, profile card, or conversation
- **US-12:** Optional note when requesting booking
- **US-13:** Declined bookings show suggested alternatives
- **US-14:** Instructor can decline with message and suggest alternatives
- **US-15:** First-time students see "Try a Private Lesson" prompt
