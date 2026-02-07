# Work Action

> **Part of the do-work skill (Salsa Ninja fork).** Invoked when routing determines the user wants to process the queue.
>
> This action replaces the upstream work action with beads-integrated, priority-ordered orchestration that uses iterative review loops.

---

## Overview

Process all pending requests in priority order (not FIFO). For each request: triage complexity, execute the appropriate pipeline, review, commit, archive. Loop until the queue is empty.

```
┌─ Pick next (priority-ordered, unblocked) ─┐
│                                            │
│  Triage → Route A/B/C                     │
│  Execute (per route)                      │
│  Review (Route B/C)                       │
│  Commit                                   │
│  Archive                                  │
│                                            │
└─── More pending? Loop. Otherwise verify. ──┘
```

---

## Pre-Flight Check

Before starting the loop:

1. **Check for `app/do-work/` directory.** If it doesn't exist, there's nothing to process.
2. **List pending REQ files** in `app/do-work/` (files matching `REQ-*.md`).
3. If no pending REQs: "Queue is empty. Use `do work <task>` to add requests."
4. **Read beads** for priority ordering:
   ```bash
   cd app && bd list -s open
   ```
5. Report: "Found N pending requests. Starting work loop."

---

## Step 1: Select Next Request

**Priority-ordered selection (not FIFO):**

1. Run `cd app && bd list -s open` to get open beads with priorities and dependencies
2. Filter to beads that have matching REQ files in `app/do-work/` (via `bead_id` in REQ frontmatter)
3. Select: highest priority (lowest P number), unblocked (no open `blockedBy` beads)
4. Ties broken by REQ number (lower number first)

If no unblocked items remain but blocked items exist, report the blocking chain and ask the user how to proceed.

---

## Step 2: Claim Request

1. Read the REQ file
2. Update the bead:
   ```bash
   cd app && bd update <bead-id> -s in_progress
   ```
3. Update REQ frontmatter:
   ```yaml
   status: claimed
   claimed_at: <ISO timestamp>
   ```

---

## Step 3: Triage

Read [processes/triage.md](../processes/triage.md) and apply the triage criteria.

Determine: **Route A** (simple), **Route B** (medium), or **Route C** (complex).

For Route C, also determine sub-type: **C-Feature** or **C-Architecture**.

Update REQ frontmatter with `route: A` (or B or C). Append the Triage section to the REQ file (living log).

---

## Step 4: Execute (Per Route)

### Route A — Direct Implementation

1. Read [reference/conventions.md](../reference/conventions.md) for project standards
2. Implement the change directly
3. Run `cd app && npm run build` and fix any errors
4. Append `## Implementation Summary` to REQ file

### Route B — Explore + Implement + Review

1. **Explore:** Read relevant codebase files. Read [reference/conventions.md](../reference/conventions.md). Append `## Exploration` to REQ file.
2. **Implement:** Make the changes.
3. **Build:** Run `cd app && npm run build` and fix errors.
4. **Review:** Run the [review loop](../processes/review-loop.md). Create child beads for CRITICAL/HIGH issues. Fix and re-review until clean.
5. Append `## Implementation Summary` to REQ file.

### Route C — Full Development Workflow

1. **Design:** Hand off to the [design action](./design.md).
   - C-Feature → Feature Design Process (7 phases)
   - C-Architecture → Architecture Design Process (4 phases)
   - The design doc becomes the implementation source of truth
2. **Execute:** Follow the [dev-workflow](../processes/dev-workflow.md) end-to-end:
   - Bead planning (decompose into child beads with dependencies)
   - Branch & worktree setup (if parallelizable)
   - Implementation (parallel agents if applicable)
   - Code review loops
   - Integration review (if worktrees used)
   - Intent verification
3. Append `## Implementation Summary` to REQ file.

---

## Step 5: Commit

**Route A and B — One commit per REQ:**

```bash
git add -A
git commit -m "$(cat <<'EOF'
[REQ-NNN] <title> (Route A|B)

Implements: do-work/archive/REQ-NNN.md

- <bullet summary of changes>

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Route C — Feature branch commit model:**

Follows [dev-workflow](../processes/dev-workflow.md) Phase 6 commit conventions. The feature may have multiple commits on its branch.

**Commit rules:**
- ONE commit per Route A/B request
- Stage everything with `git add -A`
- No pre-commit hook bypass — if hooks fail, fix and retry
- Failed requests get committed too (status: failed documents the attempt)

---

## Step 6: Archive

1. Update REQ frontmatter:
   ```yaml
   status: completed
   completed_at: <ISO timestamp>
   commit: <hash>
   ```

2. Close the bead:
   ```bash
   cd app && bd close <bead-id> -r "<implementation summary>"
   ```

3. Move REQ to archive:
   ```bash
   mv app/do-work/REQ-NNN.md app/do-work/archive/
   ```

4. Check if all REQs in the UR are complete:
   - Read `app/do-work/user-requests/UR-NNN/input.md` → `requests` array
   - If ALL complete: move UR folder to archive, close parent bead
   - If not all: leave UR in `user-requests/`, continue

**On failure:**
- Update REQ: `status: failed`, `error: "<description>"`
- Keep bead open with error note
- Move REQ to archive (failed items are archived too)
- Continue to next request

---

## Step 7: Loop or Exit

1. Re-check `app/do-work/` for pending `REQ-*.md` files (fresh check, not cached)
2. If found: report progress, return to Step 1
3. If empty: run [cleanup action](./cleanup.md), then run [verify action](./verify.md) (optional — offer to user), then report final summary

---

## Progress Reporting

Keep the user informed:

```
Processing REQ-003 "Dark Mode" ...
  Triage: Complex (Route C-Feature)
  Design...       [done] → docs/specs/features/dark-mode.md
  Planning...     [done] → 4 child beads created
  Implementing... [done]
  Reviewing...    [done] → R1: 1H fixed, R2: clean
  Committing...   [done] → abc1234

Processing REQ-004 "Fix login crash" ...
  Triage: Simple (Route A)
  Implementing... [done]
  Committing...   [done] → def5678

All 2 requests completed:
  - REQ-003 (Route C) → abc1234
  - REQ-004 (Route A) → def5678
```

---

## Error Handling

| Failure | Action |
|---------|--------|
| Design fails (Route C) | Mark REQ failed, continue to next |
| Explore fails (Route B/C) | Proceed to implementation with reduced context |
| Implementation fails | Mark REQ failed, preserve plan/exploration in REQ file |
| Tests/build fail repeatedly | After 3 attempts, mark failed with details |
| Review loop exceeds 5 rounds | Escalate to user |
| Commit fails | Report error, continue (changes uncommitted but archived) |
| Unrecoverable error | Stop loop, report clearly, leave queue intact |

---

## Orchestrator Checklist

```
□ Step 1: Query beads for next priority-unblocked item
□ Step 2: Update bead to in_progress, update REQ frontmatter
□ Step 3: Triage → Route A/B/C, append Triage section to REQ
□ Step 4: Execute per route (A: direct, B: explore+review, C: full dev-workflow)
□ Step 4: Append living log sections (Exploration, Plan, Implementation Summary)
□ Step 5: Git commit (Route A/B: one per REQ, Route C: feature branch model)
□ Step 6: Update REQ completed, close bead, move to archive
□ Step 6: Check UR completion → archive UR folder if all done
□ Step 7: Re-check queue, loop or exit
□ Step 7: On exit: cleanup, offer verify, report summary
```
