---
id: REQ-017
title: "Hide My Enrollment card for instructor-only users"
status: pending
created_at: 2026-02-11T18:30:00Z
bead_id: app-372
priority: P1
---

# Hide My Enrollment card for instructor-only users

## What

The instructor dashboard shows a "My Enrollment" card with subscription plan details (e.g. "5 Classes — 5 classes per month — $100/mo"). This should only appear if the user also has a student role. Pure instructors should not see enrollment info.

## Context

- The dashboard renders the same cards for all authenticated users
- Need role-based conditional rendering of the enrollment card
- A user with both instructor AND student roles should still see it

## Acceptance Criteria

- [ ] Users with only instructor role do not see "My Enrollment" card
- [ ] Users with both instructor and student roles still see it
- [ ] No empty space left where the card was hidden
