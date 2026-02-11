---
id: REQ-012
title: "Bug: Role removal error — FOR UPDATE with aggregate functions"
status: pending
created_at: 2026-02-11T18:30:00Z
bead_id: app-03a
priority: P1
---

# Bug: Role removal error — FOR UPDATE with aggregate functions

## What

Removing a role (e.g. Guest) from a user in the Member Management admin page throws the error: "FOR UPDATE is not allowed with aggregate functions". The role is not removed.

## Context

- This is a Supabase RLS policy or query issue
- The error appears in a browser alert dialog when clicking the X button on a role badge in the "Manage Roles" modal
- The member management page is at `/dashboard/members`

## Acceptance Criteria

- [ ] Admin can remove any role from a user without errors
- [ ] Role removal is reflected immediately in the UI
- [ ] No `FOR UPDATE` errors from Supabase queries
