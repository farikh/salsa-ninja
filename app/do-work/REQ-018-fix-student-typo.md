---
id: REQ-018
title: "Fix 'Stuent' typo — should be 'Student'"
status: completed
created_at: 2026-02-11T18:30:00Z
completed_at: 2026-02-11T18:45:00Z
bead_id: app-tpr
priority: P1
route: A
---

# Fix 'Stuent' typo — should be 'Student'

## Triage

**Route: A** — Investigation task

**Reasoning:** Single typo investigation — need to find where the string comes from.

## Investigation

The code at `src/app/(site)/dashboard/page.tsx:91` uses `member.display_name || member.full_name`. The role labels map is correct (`member_full: 'Student'`). The "(Stuent)" text is part of the `display_name` field in the database — the test account has "Fari (Stuent)" stored as the display name. This is a **database data issue**, not a code bug.

**Resolution:** The display_name for the student test account needs to be corrected in Supabase. No code changes required.

## Acceptance Criteria

- [x] Confirmed code role mapping is correct: `member_full: 'Student'`
- [ ] Database display_name for student test account needs manual correction in Supabase
