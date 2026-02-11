---
id: REQ-008
title: "Phase B: Communication Layer"
status: pending
created_at: 2026-02-10T17:00:00Z
user_request: UR-002
bead_id: app-vjv.2
bead_parent: app-vjv
related: [REQ-007, REQ-009, REQ-010, REQ-011]
---

# Phase B: Communication Layer

## What

Replace booking-only messaging with a broader communication system supporting three conversation types: inquiries (pre-booking), booking threads, and direct messages (student ↔ instructor only).

## Context

- PRD: `docs/specs/unified-experience-prd.md` (Section 6)
- Currently messaging only exists inside booking threads
- No way to contact an instructor without first creating a booking
- DMs limited to student ↔ instructor (expandable later)
- Unanswered inquiries auto-close after 72 hours
- Blocked by: Phase A (REQ-007)

## Requirements (from PRD)

- **US-6:** Student can message instructor before booking
- **US-7:** Instructor sees all conversations in one inbox
- **US-8:** Inquiry transitions to booking without losing conversation history
- **US-9:** In-app notifications for new messages
- **US-10:** Visual distinction between conversation types
