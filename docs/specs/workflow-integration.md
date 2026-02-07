# Unified Workflow Architecture: do-work + Beads

**Status:** Reviewed (2 rounds: R1 fixed 2C+5H, R2 verified 7/7 fixes, 0 new C/H)
**Bead:** app-e11
**Date:** 2026-02-04

---

## 1. Problem Statement

The current project workflow requires manual ceremony at every stage:

| Step | Current friction |
|------|-----------------|
| Task creation | Must run `bd create "Title" -d "desc" -p N` before any work |
| Sub-task decomposition | Must manually create parent + child beads with `--parent` |
| Dependency wiring | Must manually run `bd dep <blocker> --blocks <blocked>` |
| Status updates | Must manually `bd update -s in_progress` and `bd close -r "reason"` |
| Triage | No automatic complexity assessment; agent must decide ad-hoc |
| Verification | No post-completion check that output matches original intent |
| Archival | Closed beads sit in JSONL forever; no cleanup or audit trail |

**do-work** (github.com/bladnman/do-work) solves half of these problems with natural language capture, automatic triage, a work loop, verification, and archival. But it lacks priorities, dependencies, parent/child hierarchy, and worktree coordination — all things beads provides.

**Goal:** Merge both systems into a single pipeline where the user issues one or two natural-language commands and everything else is automated.

---

## 2. System Comparison

| Capability | Beads (`bd`) | do-work | Unified |
|------------|-------------|---------|---------|
| Natural language capture | No (CLI flags) | Yes (do action) | **do-work** |
| Structured task format | JSONL with fields | Markdown + YAML frontmatter | **Both** (synced) |
| Priority system | P1-P5 | None (FIFO) | **Beads** |
| Parent/child hierarchy | `--parent` flag | UR → REQ (flat) | **Beads** |
| Dependencies | `bd dep --blocks` | `related` array (informational) | **Beads** |
| Complexity triage | None | Route A/B/C | **do-work** |
| Work loop orchestration | None (manual) | Autonomous queue processing | **do-work** |
| Status tracking | open → in_progress → closed | pending → claimed → completed/failed | **Both** (synced) |
| Worktree coordination | `bd worktree` | None | **Beads** |
| Iterative code review | Dev-workflow Phase 4 | None (single test phase) | **Dev-workflow** |
| Post-completion verification | None | Verify action | **do-work** |
| Archival & cleanup | None | Archive folders + cleanup action | **do-work** |
| Living audit trail | Close reason only | REQ file grows with plan/explore/impl/test sections | **do-work** |
| Session persistence | JSONL survives resets | Markdown files survive resets | **Both** |
| Agent-agnostic | No (CLI-specific) | Yes (pure Markdown prompts) | N/A |

---

## 3. Architecture: Single Orchestrator Model

### 3.1 Design Principle — One Instruction Set, No Separate Bridge

Previous drafts proposed a "bridge layer" between do-work and beads. This was rejected because:
- Both systems are Markdown instructions read by the same agent — there are no event hooks, triggers, or atomicity guarantees between them.
- Two competing instruction sets (do-work action files vs. CLAUDE.md) create ambiguity about which the agent follows at each step.

**Resolution:** CLAUDE.md is the single orchestrator. do-work provides two capabilities used as discrete tools:
1. **Capture format** — UR/REQ file structure, deduplication, complexity assessment (from `do` action)
2. **Verification scoring** — Coverage comparison against original intent (from `verify` action)

do-work's `work` action (its own orchestration loop) is **NOT used**. CLAUDE.md's unified workflow handles triage, execution, review, and archival directly, reading from the REQ queue but following the existing dev-workflow and review processes.

### 3.2 Flow Diagram

```
┌───────────────────────────────────────────────┐
│  USER INPUT (natural language)                 │
│  "add dark mode, fix login bug, refactor cal"  │
├───────────────────────────────────────────────┤
│  STEP 1: CAPTURE (do-work `do` action)         │
│  Parse → deduplicate → create UR + REQ files   │
│  THEN immediately: create beads from REQs      │
│  (same instruction flow, no separate trigger)  │
├───────────────────────────────────────────────┤
│  STEP 2: TRIAGE (CLAUDE.md unified workflow)   │
│  Assess each REQ → Route A/B/C                │
│  Consult beads for priority ordering           │
├───────────────────────────────────────────────┤
│  STEP 3: EXECUTE (dev-workflow)                │
│  Route A: direct implementation                │
│  Route B: explore + build + review loop        │
│  Route C: full dev-workflow (worktrees, etc.)  │
├───────────────────────────────────────────────┤
│  STEP 4: VERIFY (do-work `verify` action)      │
│  Compare output to original UR input           │
│  Score coverage, flag gaps                     │
├───────────────────────────────────────────────┤
│  STEP 5: ARCHIVE (CLAUDE.md instructions)      │
│  Move REQs to archive/, close all beads        │
└───────────────────────────────────────────────┘
```

### 3.3 Source of Truth

| Concern | Source of truth | Other system's role |
|---------|----------------|-------------------|
| **Task state** (pending/in-progress/done) | **Beads** (JSONL) | REQ frontmatter mirrors state for human readability, but agent reads beads |
| **Task content** (what to build) | **REQ files** (Markdown) | Bead description stores summary, REQ file has full detail |
| **Priority & dependencies** | **Beads** (P1-P5, `bd dep`) | REQ files have no priority; agent consults beads for ordering |
| **Audit trail** (what was done) | **REQ files** (living logs) | Bead close reason stores summary; REQ has full plan/explore/impl/test record |
| **Original intent** | **UR input.md** (verbatim) | Verification reads UR, not beads |

This eliminates the dual state machine problem. Beads is authoritative for state. REQ files are authoritative for content and history.

---

## 4. Capture Step (Detailed)

The capture step is a single sequential flow — NOT a separate "bridge" that fires after do-work. The agent follows these instructions as one uninterrupted sequence within the same CLAUDE.md instruction context.

### 4.1 Step-by-Step Capture Flow

When the user provides work requests in natural language:

**Step 1 — Parse & Structure (do-work patterns):**
1. Parse user input for single vs. multiple requests
2. Check for duplicates against existing REQ files (queue and archive) and existing beads (`cd app && bd search "<keywords>"`)
3. Create UR folder with `input.md` preserving verbatim input
4. Create REQ files (one per discrete task) with YAML frontmatter

**Step 2 — Create Beads (immediate, same flow):**
5. Create a parent bead for the UR:
   ```bash
   cd app && bd create "UR-003: <summary>" -d "<verbatim from input.md>" -p 2
   ```
6. Create child beads for each REQ:
   ```bash
   cd app && bd create "<REQ title>" -d "<REQ body summary>" -p <inferred> --parent <ur-bead-id>
   ```
7. Write bead IDs back into REQ frontmatter:
   ```yaml
   bead_id: app-xyz
   bead_parent: app-abc
   ```

**Step 3 — Infer Priorities:**
8. Assign priorities based on REQ content analysis:
   - Critical bug / data loss / security → P1
   - Bug fix (non-critical) → P2
   - New feature / feature blocker → P2
   - Enhancement / refactor → P3
   - Nice-to-have / cosmetic → P4
   - Default if unclear → P2

**Step 4 — Detect Dependencies:**
9. Analyze REQ content for ordering constraints:
   - Schema/migration changes block API routes that use them
   - API routes block UI components that call them
   - Shared types/utilities block consumers
10. Wire dependencies via beads:
    ```bash
    cd app && bd dep <blocker-bead> --blocks <blocked-bead>
    ```

**Step 5 — Report to User:**
11. Summary: "Captured N requests from UR-XXX. Beads created with priorities. Run `do work run` to start."

### 4.2 Status Updates During Execution

Status is updated in beads only. REQ frontmatter is updated as a mirror for human readability, but the agent always reads beads for authoritative state.

| Event | Bead update | REQ frontmatter update |
|-------|------------|----------------------|
| Work begins on REQ | `cd app && bd update <id> -s in_progress` | `status: claimed`, `claimed_at: <timestamp>` |
| Work completed | `cd app && bd close <id> -r "<summary>"` | `status: completed`, `completed_at: <timestamp>`, `commit: <hash>` |
| Work failed | Keep bead open, add error note | `status: failed`, `error: "<description>"` |
| All REQs in UR completed | `cd app && bd close <parent-id> -r "All REQs complete"` | UR folder moved to archive |

### 4.3 Queue Ordering

The agent determines the next item to process by:

1. Run `cd app && bd list -s open` to get open beads with priorities and dependencies
2. Filter to beads that have matching REQ files in the `do-work/` queue
3. Select highest priority (lowest P number) unblocked item
4. Ties broken by REQ number (FIFO within same priority)

---

## 5. Unified Pipeline (End-to-End)

### Phase 1: Capture

**Trigger:** User says anything that implies new work (natural language).

**What happens:**
1. Agent follows do-work's `do` patterns to parse input into UR + REQ files
2. Agent creates corresponding beads (parent for UR, children for REQs) — same flow, no separate trigger
3. Agent infers priorities and dependencies
4. Agent writes bead IDs back into REQ frontmatter
5. Agent reports: "Captured N requests. Say `go` or `do work run` to start, or keep adding."

**User effort:** Say what you want. That's it.

### Phase 2: Triage & Plan

**Trigger:** User says "do work run" / "go" / "start".

**What happens:**
1. CLAUDE.md unified workflow starts (NOT do-work's `work` action)
2. Agent queries beads for next item (highest priority, unblocked) — see Section 4.3
3. Triage assigns complexity route based on do-work's assessment criteria:
   - **Route A (Simple):** Config changes, small fixes, typos → direct to implementation
   - **Route B (Medium):** Needs codebase exploration first → explore, then build + review loop
   - **Route C (Complex):** Needs design/planning → triggers existing CLAUDE.md design processes
4. Route C sub-classification:
   - **New user-facing feature** → triggers **Feature Design Process** (7 phases from `docs/feature-design-process.md`), preserving the existing "feature design first" convention
   - **Architectural/infrastructure work** → triggers **Architecture Design Process** (4 phases from CLAUDE.md)
   - **Complex refactor with no new feature** → triggers dev-workflow planning phase only (bead decomposition + dependency wiring)
5. Triage result written to REQ frontmatter (`route: A | B | C`) and bead is updated

### Phase 3: Execute

**What happens (per request):**

**Route A — One commit per REQ:**
1. Update bead to `in_progress`, update REQ frontmatter
2. Implement directly
3. Run `cd app && npm run build`, fix errors
4. Git commit (one atomic commit for this REQ)
5. Close bead, update REQ frontmatter, append implementation summary to REQ file

**Route B — One commit per REQ, with review:**
1. Update bead to `in_progress`, update REQ frontmatter
2. Explore codebase (read relevant files, understand context)
3. Append exploration notes to REQ file (living log)
4. Implement
5. Run `cd app && npm run build`, fix errors
6. **Code review loop** (from dev-workflow Phase 4): launch review agent, create child beads for CRITICAL/HIGH issues, fix, re-review until clean
7. Git commit (one atomic commit for this REQ)
8. Close bead, update REQ frontmatter, append implementation summary to REQ file

**Route C — Feature branch commit model (dev-workflow):**
1. Update bead to `in_progress`, update REQ frontmatter
2. **Full dev-workflow starting from Phase 1:** decompose into child beads with dependencies, create feature branch, set up worktrees if parallelizable, spawn dev agents, review loops, integration review
3. Build verification (`cd app && npm run build`)
4. Commit on feature branch following dev-workflow Phase 6 conventions
5. Close bead (and all child beads), update REQ frontmatter

**Note on commit granularity:** Route A and B produce one commit per REQ — these are small, self-contained changes. Route C follows the existing dev-workflow branching model — the REQ maps to a feature, and the feature may have multiple commits on its branch. This is intentionally different because Route C work is fundamentally different in scope.

**Parallelism:** When multiple unblocked items exist at the same priority level and they touch different files, spawn parallel agents with separate worktrees (using beads' worktree support). This applies within Route C (parallel sub-tasks) and across Route A/B items (parallel independent fixes).

### Phase 4: Verify

**Trigger:** Automatic after all REQs in the queue are processed.

**What happens:**
1. do-work `verify` action reads original UR input
2. Compares against what was actually implemented (reads git diffs, REQ implementation summaries)
3. Scores coverage:
   - Requirements coverage
   - UX detail preservation
   - Intent signal fidelity
   - Batch context (cross-request coherence)
4. Flags gaps as Critical / Important / Minor
5. If Critical gaps found: creates new REQ files + beads to address them, re-enters the work loop
6. If no Critical gaps: reports results to user

### Phase 5: Archive

**Trigger:** Automatic after verification passes.

**What happens:**
1. Agent consolidates completed UR folders into `archive/` (following do-work cleanup patterns)
2. Agent confirms all associated beads are closed
3. Any orphaned beads (no REQ match) are flagged for user review
4. Clean state: `do-work/` directory empty, all beads closed or explicitly deferred

---

## 6. Directory Structure

The `do-work/` directory lives inside `app/` alongside `.beads/`. This eliminates the path mismatch problem — all `bd` commands and all do-work file operations execute from the same working directory (`app/`).

```
salsa-ninja/
├── app/
│   ├── .beads/
│   │   └── issues.jsonl          # Beads tracking (unchanged)
│   ├── do-work/                  # NEW: do-work state directory
│   │   ├── REQ-001.md            # Pending requests (the queue)
│   │   ├── REQ-002.md
│   │   ├── user-requests/        # Verbatim user input + assets
│   │   │   └── UR-001/
│   │   │       ├── input.md
│   │   │       └── assets/
│   │   └── archive/              # Completed work (audit trail)
│   │       └── UR-001/
│   │           ├── input.md
│   │           ├── REQ-001-done.md   # Living log with full history
│   │           └── REQ-002-done.md
│   └── src/                      # Application code
├── docs/                         # Specs and research (unchanged)
└── CLAUDE.md                     # Unified orchestration instructions
```

**Note:** The `working/` subfolder from do-work's original design is removed. Since beads is the source of truth for status (Section 3.3), we don't need folder location to encode state. Pending REQs live in `do-work/` root. Completed REQs move directly to `archive/`. The agent reads beads to know what's in progress.

---

## 7. CLAUDE.md Changes

### 7.1 Replace "STOP - BEADS BEFORE CODE" Section

**Current:**
```
## STOP - BEADS BEFORE CODE
Before writing ANY code: bd create "Title" ...
```

**Proposed:**
```
## STOP - CAPTURE BEFORE CODE

Before writing ANY code or making ANY edits, work must be captured.

**Detection:** Check if `app/do-work/` directory exists.

**If `app/do-work/` exists (unified mode):**
Follow the Unified Workflow (Section 7.2 below). The agent captures work as
UR + REQ files, creates beads, and manages the full pipeline automatically.

**If `app/do-work/` does not exist (beads-only fallback):**
cd app && bd create "Task title" --description="What and why" -p N
See .claude/docs/beads-usage.md for details.
```

The detection is a simple directory existence check, not a runtime conditional that could silently fail. The agent checks once per session.

### 7.2 Add Unified Workflow Trigger

New section in CLAUDE.md:

```
## Unified Workflow

**Trigger:** When the user provides work requests in natural language — bugs, features,
refactors, or any combination.

1. **Capture** — Follow do-work `do` patterns. Creates UR + REQ files.
   Then immediately create beads from REQs (parent for UR, children for REQs).
   Infer priorities, detect dependencies.
2. **Work loop** — On "go"/"run"/"start": triage each REQ (Route A/B/C),
   process in priority order respecting dependencies.
   Route C uses full Architecture Design Process.
   All routes use dev-workflow review loops for code changes.
4. **Verify** — Compare output to original UR input. Flag gaps.
5. **Archive** — Consolidate completed work. Close all beads.
```

### 7.3 Extend Architecture Design Process

Add to Phase 1:
```
0. If this design was triggered by a Route C triage from the work loop,
   the REQ file is the starting point. Read it before creating research beads.
```

### 7.4 Extend Dev Workflow

Rename existing "Phase 6: Verification & Ship" to "Phase 6: Ship" (its current content is about build verification and committing, which is shipping). Add a new phase before it:

```
## Phase 5.5: Intent Verification

After integration review passes (Phase 5) but before shipping (Phase 6):
1. Read the originating UR input.md that spawned this work.
2. Compare what was implemented against the original request using do-work's
   verify scoring criteria: requirements coverage, UX detail preservation,
   intent signal fidelity, batch context coherence.
3. If Critical gaps found: create new REQ files + beads and loop back to Phase 3.
   Maximum 2 verification loops before escalating to user.
4. If no Critical gaps: proceed to Ship (Phase 6).
```

Note: This is named "Phase 5.5" (not "Phase 4.5") to avoid collision with the existing Phase 5 (Integration) and Phase 6 (Verification & Ship). The "5.5" makes it clear this sits between integration and shipping.

### 7.5 Preserve Feature Design Convention

The existing Development Conventions section in CLAUDE.md states: "Feature design first: Follow docs/feature-design-process.md before building new features." This convention is preserved in the unified workflow:

- Route C triage explicitly checks whether the request involves a **new user-facing feature**. If yes, the Feature Design Process (7 phases) is triggered, not just the Architecture Design Process.
- The Architecture Design Process is triggered for infrastructure, schema, or system-level work.
- This matches the existing convention — it is not downgraded to opt-in.

---

## 8. User Commands (Complete Reference)

After integration, the user's vocabulary becomes:

| What user says | What happens |
|---------------|-------------|
| `do work <natural language>` | Capture requests (UR + REQs + beads) |
| `do work run` / `go` / `start` | Process queue (triage → execute → review → verify → archive) |
| `do work verify` | Manual quality check against original input |
| `do work cleanup` | Manual archive consolidation |
| `bd list` | View all beads (priorities, dependencies, status) |
| `bd search "keyword"` | Find specific beads |
| `bd show app-xyz` | View bead details |

**Important:** `do work ...` commands are natural language instructions to the AI agent (said in chat or typed in the CLI prompt). They are NOT bash commands. `bd ...` commands are actual CLI executables run in the terminal.

**Commands the user no longer needs:**
- `bd create` (automatic via bridge)
- `bd update -s in_progress` (automatic on claim)
- `bd close -r "reason"` (automatic on completion)
- `bd dep --blocks` (automatic via bridge analysis)
- Manual triage decisions
- Manual agent coordination for Route A/B items

---

## 9. Installation & Setup

### 9.1 Install do-work Skill

```bash
npx skills add bladnman/do-work
```

This copies Markdown instruction files into the Claude Code skill directory.

### 9.2 Update CLAUDE.md

Apply the changes described in Section 7 (replace BEADS BEFORE CODE, add Unified Workflow trigger, extend design processes). These are instruction changes only — no code, no dependencies.

### 9.3 Initialize do-work Directory

```bash
cd app && mkdir -p do-work/user-requests do-work/archive
```

Note: No `working/` subdirectory. Beads tracks in-progress state (Section 3.3).

### 9.4 Add to .gitignore

```
# do-work queue state (archive committed for audit trail)
app/do-work/REQ-*.md
app/do-work/user-requests/
```

Archive is committed because it provides a persistent audit trail of what was requested, planned, and implemented. Queue state and verbatim user input are ephemeral.

---

## 10. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| **REQ/bead state drift**: REQ frontmatter says completed but bead still open (or vice versa) | MEDIUM | Beads is authoritative (Section 3.3). REQ frontmatter is a convenience mirror. Archive step validates both match before finalizing. |
| **Priority inference errors**: Agent assigns wrong priority | MEDIUM | User can override: "do work add <task> priority high". Default is P2 (conservative). Agent can re-triage if user disagrees. |
| **do-work upstream breaking changes**: Skill updates change REQ format or behavior | MEDIUM | We use do-work's file format and verification scoring, not its orchestration. Format changes are localized to capture step. Pin version if needed. |
| **Complexity triage misroute**: Route A applied to what should be Route C | MEDIUM | Review phase catches missing design. Verify phase catches incomplete implementation. User can override: "treat this as Route C." |
| **Verification loop**: Verify keeps finding gaps, creating infinite REQ/work cycles | MEDIUM | Maximum 2 verification loops (Section 7.4). After 2 rounds, escalate to user with gap report. |
| **Beads CLI overhead**: Many `bd` calls during capture | LOW | JSONL append is fast. Capture is a one-time batch, not a hot path. |
| **REQ file proliferation**: Lots of small Markdown files in repo | LOW | Archive consolidation keeps queue clean. Only archive is committed for audit trail. |

---

## 11. What This Does NOT Change

- **Architecture Design Process**: Unchanged. Route C triage feeds into it for architectural work.
- **Feature Design Process (7 phases)**: Unchanged and still mandatory for new user-facing features. Route C triage explicitly routes to it when the request is a new feature.
- **Dev Workflow (6 phases)**: Extended with intent verification (Phase 5.5), otherwise unchanged.
- **Development Conventions**: All unchanged (Tailwind, shadcn/ui, colors, auth, roles, responsive, i18n).
- **Beads CLI**: Still available for direct queries, manual overrides, and the beads-only fallback path.
- **Review Agent Prompt Template**: Unchanged.
- **"GitHub before from-scratch" convention**: Unchanged. Research phase still applies.

---

## 12. Migration Path

### Phase 1: Install & Test (No disruption)
1. Install do-work skill
2. Create `do-work/` directory
3. Add bridge instructions to CLAUDE.md
4. Test with a small task: "do work fix typo in README"
5. Verify: REQ created, bead created, work loop processes it, bead closes

### Phase 2: Adopt for New Work
1. Use `do work <task>` for all new requests
2. Keep `bd create` as fallback for direct bead creation (research tasks, deferred questions)
3. Existing open beads continue to be managed directly via `bd`

### Phase 3: Full Integration
1. Existing open beads that match incomplete features get linked to new REQs
2. "do work run" becomes the primary entry point
3. `bd create` reserved for manual overrides and edge cases

---

## 13. Open Questions

| # | Question | Recommendation |
|---|----------|---------------|
| 1 | Should REQ files be committed to git? | Yes for archive (audit trail), no for working state |
| 2 | Should do-work be forked or used upstream? | Use upstream. do-work provides capture format and verify scoring only. CLAUDE.md handles orchestration. Fork only if upstream changes break capture/verify patterns. |
| 3 | How to handle existing open beads (app-2r1.*) that predate do-work? | Continue managing directly via `bd`. Don't retroactively create REQs. |
| 4 | Should the verify action block shipping on Important (not just Critical) gaps? | No. Critical only blocks. Important gets logged as new REQs for future work. |
| 5 | Should Route C always trigger the full 7-phase Feature Design Process, or only the Architecture Design Process? | Resolved: Route C sub-classifies (Section 5, Phase 2). New user-facing features → Feature Design Process (7 phases). Architectural/infrastructure → Architecture Design Process (4 phases). Preserves existing convention. |

---

## 14. Things the User Might Be Missing

1. **Addendum workflow**: do-work has an elegant `addendum_to` pattern — if you want to add to an in-flight request, you create a new REQ linked to the original rather than modifying it. This prevents mid-flight corruption. Your current workflow has no equivalent; you'd edit a bead description or create an ad-hoc child.

2. **Verify as a regression net**: The verify action catches drift between what was asked and what was built. Your current workflow has code review but no intent review. This is especially valuable for batch requests where individual items can get lost.

3. **Living logs as documentation**: Each REQ file becomes a complete record (triage → plan → exploration → implementation → testing). Your beads only store a close reason. The REQ living log is a richer audit trail that could feed into future sessions.

4. **Duplicate detection**: do-work checks for duplicate requests across queue, working, and archive before creating new REQs. Your current workflow has no dedup — you could create the same bead twice across sessions.

5. **Screenshot/asset capture**: do-work's UR system preserves screenshots and assets alongside the verbatim input. If you're reporting visual bugs or UI changes, these get stored with the request and are available during implementation.

6. **Version management**: do-work has a built-in version check against upstream. As the skill evolves (it's at v0.9.5 with 14 releases in 8 days), you can stay current without manual tracking.

7. **Global vs project scope**: do-work can be installed globally (`-g` flag) so the same workflow applies across all your projects, not just this one. The bridge layer in CLAUDE.md would be project-specific, but the skill itself is portable.
