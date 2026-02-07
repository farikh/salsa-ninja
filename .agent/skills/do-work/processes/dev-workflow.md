# Development Workflow

> **Referenced by:** [work action](../actions/work.md) (Route C execution)
>
> **Trigger:** When executing a Route C request that has a completed design doc.

Follow this process end-to-end without waiting for confirmation between steps.

---

## Phase 1: Bead Planning

1. **Read the design/architecture doc** for the requested feature.
2. **Check existing beads** — run `cd app && bd search "<feature name>"` and `bd list` to see if implementation tasks already exist.
3. **Create missing beads.** For each discrete implementation task:
   - Create **child beads** under the REQ's bead (`--parent <req-bead-id>`)
   - Set **priorities** reflecting implementation order (P1 = foundational, P2 = depends on P1, etc.)
   - Set **dependencies**: `cd app && bd dep <blocker-id> --blocks <blocked-id>`
4. **Identify parallelizable work.** Group tasks that touch **different files** and have no dependency links. Tasks touching the same files must be sequential.

---

## Phase 2: Branch & Worktree Setup

5. **Create a feature branch** from master:
   ```bash
   git checkout -b feature/<feature-name> master
   ```
6. **For parallel agent work, create worktrees** — one per independent task group:
   ```bash
   cd app && bd worktree create <task-group-name> --branch feature/<feature-name>-<task-group>
   ```
7. **Sequential tasks** run in the main worktree on the feature branch. Only create additional worktrees when agents will genuinely work in parallel on non-overlapping files.

---

## Phase 3: Implementation

8. **For each task (or parallel task group), launch a dev agent.** Each dev agent must:
   - Read the architecture/design doc **before writing any code**
   - Read any existing code in files it will modify
   - Read [reference/conventions.md](../reference/conventions.md) for project standards
   - Mark its bead `in_progress`: `cd app && bd update <id> -s in_progress`
   - Implement the task
   - Run `cd app && npm run build` and fix any errors before declaring done
   - Close its bead: `cd app && bd close <id> -r "Description of what was implemented"`
9. **Launch multiple dev agents in parallel** (via Task tool) for independent task groups. Sequential tasks run one at a time in dependency order.

---

## Phase 4: Code Review Loop

10. **After a dev agent completes, run the [review loop](./review-loop.md).**
    - Reviewer reads the design doc and all changed/created files
    - Creates child beads for CRITICAL/HIGH issues
    - Dev agent fixes issues, re-review until clean

---

## Phase 5: Integration

11. **Merge worktree branches** back into the feature branch:
    ```bash
    git merge feature/<feature-name>-<task-group>
    ```
    Resolve any merge conflicts. Repeat for each worktree branch.
12. **Remove worktrees** after successful merge:
    ```bash
    cd app && bd worktree remove <task-group-name>
    git branch -d feature/<feature-name>-<task-group>
    ```
13. **Run integration review** — launch a review agent that:
    - Reads the full design doc
    - Reads ALL files changed across the feature branch (`git diff master...HEAD --name-only`)
    - Checks cross-cutting concerns: shared state, imports, route conflicts, schema consistency, RLS policy coverage
    - Creates beads for CRITICAL/HIGH integration issues
14. **Fix integration issues** — same review loop.

---

## Phase 5.5: Intent Verification

15. **Read the originating UR input.md** that spawned this work.
16. **Compare** what was implemented against the original request:
    - Requirements coverage
    - UX detail preservation
    - Intent signal fidelity
17. If Critical gaps found: create new REQ files + beads and loop back to Phase 3. Maximum 2 verification loops before escalating to user.
18. If no Critical gaps: proceed to Ship.

---

## Phase 6: Ship

19. **Build verification:**
    ```bash
    cd app && npm run build
    ```
    Must pass with zero errors.
20. **Dev server smoke test:**
    ```bash
    cd app && npm run dev
    ```
    Verify the feature works end-to-end.
21. **Commit and push:**
    ```bash
    git add <specific-files>
    git commit -m "feat: <feature description>"
    git push -u origin feature/<feature-name>
    ```
22. **Clean up** — verify all beads for this feature are closed.

---

## Rules

- **Design doc is the source of truth.** All implementation must match. If deviation needed, note in a bead and flag to user.
- **No code without a bead.** Every file change traces back to a bead.
- **Build must pass before review.** Dev agents run `npm run build` before handing off.
- **Worktrees are ephemeral.** Create for parallel work, merge back, delete. Never leave stale worktrees.
- **File overlap = sequential.** If two tasks modify the same file, they cannot run in parallel.
