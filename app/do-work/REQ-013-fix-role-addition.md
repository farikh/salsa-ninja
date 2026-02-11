---
id: REQ-013
title: "Bug: Adding new user roles not working"
status: pending
created_at: 2026-02-11T18:30:00Z
bead_id: app-wlo
priority: P1
---

# Bug: Adding new user roles not working

## What

In Member Management, clicking "+ Admin", "+ Instructor", or "+ Limited" to add a new role to a user does not work. The role is not added and no feedback is given.

## Context

- The "Manage Roles" modal shows available roles to add
- Clicking an add button does nothing visible
- Likely the same underlying Supabase RLS/query issue as role removal (REQ-012)

## Acceptance Criteria

- [ ] Admin can add any role to a user
- [ ] New role appears immediately in the UI after adding
- [ ] Appropriate feedback (success/error) is shown
