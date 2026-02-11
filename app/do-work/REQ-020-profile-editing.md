---
id: REQ-020
title: "Add user profile editing (name, email, etc.)"
status: pending
created_at: 2026-02-11T18:30:00Z
bead_id: app-0rt
priority: P2
---

# Add user profile editing (name, email, etc.)

## What

Users have no way to modify their profile. Need an edit profile page or modal where users can update their display name, email, and other profile fields.

## Context

- The "Your Profile" section on the dashboard shows email but no edit button
- Profile data is stored in Supabase auth.users and a profiles table
- Need both UI and API endpoint for profile updates

## Acceptance Criteria

- [ ] Users can edit their display name
- [ ] Users can edit their email (with verification)
- [ ] Profile changes are saved to the database
- [ ] Success/error feedback shown after saving
