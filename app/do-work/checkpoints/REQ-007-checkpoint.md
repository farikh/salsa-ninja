---
req_id: REQ-007
ur_id: UR-002
last_updated: 2026-02-10T19:30:00Z
current_phase: plan
phase_status: complete
---

# Checkpoint: REQ-007 — Phase A: Unified Schedule View

## Completed Phases

### PRD Phase
- **Status:** complete (shared PRD for all 5 phases)
- **Artifact:** `docs/specs/unified-experience-prd.md`
- **Review rounds:** 1 (user-reviewed)
- **Cross-ref rounds:** N/A (UR → PRD was user-driven)
- **Key decisions:**
  - Dashboard stays as home page; My Schedule is one tap away
  - Student ↔ Instructor DMs only (expandable later)
  - 72-hour inquiry auto-close
  - Enhanced instructor cards (no profile pages)
  - Owner gets filterable master schedule (Phase E)

### Plan/Design Phase
- **Status:** complete
- **Artifact:** `docs/specs/features/unified-schedule.md`
- **Review rounds:** 5
- **Cross-ref rounds:** 1 (PASSED — 24/24 items covered)
- **Key decisions:**
  - Indigo for all bookings (deviates from PRD red/blue — avoids EVENT_TYPE_COLORS conflict)
  - Yellow (not amber) for pending bookings (avoids workshop amber conflict)
  - Fork existing view components (don't modify — protects /calendar route)
  - Extract useCalendarNavigation from CalendarShell (shared between both calendars)
  - Client-side unread flag via /api/bookings/unread (reuses existing endpoint)
  - New useScheduleRealtime hook (role-agnostic, replaces instructor-only useCalendarRealtime)
  - Filter out event_type==='private_lesson' in merge function to avoid CalendarEventType conflict

### Dev Phase
- **Status:** not_started
- **Tasks completed:** 0/TBD
- **Current task:** None — awaiting dev workflow start

## Open Beads

- app-vjv.1 (in_progress) — Phase A: Unified Schedule View
- app-vjv.2 (pending) — Phase B: Communication Layer
- app-vjv.3 (pending) — Phase C: Booking Flow Redesign
- app-vjv.4 (pending) — Phase D: Instructor Command Center
- app-vjv.5 (pending) — Phase E: Owner Master Schedule & Notifications

## Backward Gates Triggered

None

## Context for Next Session

Phase A design is complete and reviewed (5 rounds + phase gate passed). The design doc at `docs/specs/features/unified-schedule.md` specifies all components, hooks, types, API contracts, and acceptance criteria for the unified schedule view. Next step is to begin the dev workflow: create implementation tasks from the design doc, then build in priority order. The design calls for ~10 new components, 4 new hooks, 1 API enhancement, and 1 new route.
