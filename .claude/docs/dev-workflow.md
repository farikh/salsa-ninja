# Feature Development Workflow

> **DEPRECATED:** This file is superseded by the do-work skill. See:
> - `.agents/skills/do-work/processes/dev-workflow.md` (authoritative version)
> - `.agents/skills/do-work/actions/work.md` (orchestration)
>
> This file is retained for reference only. Do not follow these instructions directly.

> **Trigger:** When the user asks to "build", "implement", or "develop" a feature or feature set from a design doc.
>
> Follow this process end-to-end without waiting for confirmation between steps.

---

## Phase 1: Bead Planning

1. **Read the design/architecture doc** for the requested feature(s).
2. **Check existing beads** — run `bd search "<feature name>"` and `bd list` to see if implementation tasks already exist.
3. **Create missing beads.** For each feature or feature set:
   - Create a **parent bead** for the overall feature.
   - Create **child beads** for each discrete implementation task (`--parent <parent-id>`).
   - Set **priorities** reflecting implementation order (P1 = foundational, P2 = depends on P1, etc.).
   - Set **dependencies** with `bd dep <blocker-id> --blocks <blocked-id>` so tasks encode their execution order.
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
   Each worktree shares the same beads database automatically.
7. **Sequential tasks** run in the main worktree on the feature branch. Only create additional worktrees when agents will genuinely work in parallel on non-overlapping files.

---

## Phase 3: Implementation

8. **For each task (or parallel task group), launch a dev agent.** Each dev agent must:
   - Read the architecture/design doc **before writing any code**.
   - Read any existing code in files it will modify.
   - Mark its bead `in_progress`: `bd update <id> -s in_progress`
   - Implement the task.
   - Run `npm run build` (or lint/typecheck) and fix any errors before declaring done.
   - Mark its bead as done: `bd close <id> -r "Description of what was implemented"`
9. **Launch multiple dev agents in parallel** (via Task tool) for independent task groups. Sequential tasks run one at a time in dependency order.

---

## Phase 4: Code Review Loop

10. **After a dev agent completes its task(s), launch a review agent.** The review agent must:
    - Read the architecture/design doc for the feature.
    - Read all changed/created files.
    - Classify issues as CRITICAL, HIGH, MEDIUM, or LOW.
    - Focus on: correctness, security (RLS, auth), consistency with existing codebase conventions, edge cases, missing error handling at system boundaries.
    - **Create new child beads** for any CRITICAL or HIGH issues found, with severity in the title, linked as children of the task bead.
    - Update the original task bead with review comments if needed.
11. **Hand back to the original dev agent** to fix CRITICAL and HIGH issues. The dev agent:
    - Marks each fix bead `in_progress`, implements the fix, runs build, closes the bead.
12. **Review agent reviews again.** Must not repeat previously fixed issues. Must verify fixes are correct.
13. **Repeat steps 10-12** until a review round returns zero CRITICAL and zero HIGH issues for that agent's scope.

---

## Phase 5: Integration

14. **Merge worktree branches** back into the feature branch:
    ```bash
    # From the main worktree on the feature branch
    git merge feature/<feature-name>-<task-group>
    ```
    Resolve any merge conflicts. Repeat for each worktree branch.
15. **Remove worktrees** after successful merge:
    ```bash
    cd app && bd worktree remove <task-group-name>
    ```
    Also delete the merged branches:
    ```bash
    git branch -d feature/<feature-name>-<task-group>
    ```
16. **Run integration review.** Launch a review agent that:
    - Reads the full architecture/design doc.
    - Reads ALL files changed across the entire feature branch (`git diff master...HEAD --name-only`).
    - Checks cross-cutting concerns: shared state, imports, route conflicts, schema consistency, RLS policy coverage.
    - Creates beads for any CRITICAL/HIGH integration issues found.
17. **Fix integration issues** — same review loop as Phase 4 (fix, re-review, repeat until clean).

---

## Phase 6: Verification & Ship

18. **Build verification:**
    ```bash
    cd app && npm run build
    ```
    Must pass with zero errors.
19. **Dev server smoke test:**
    ```bash
    cd app && npm run dev
    ```
    Verify the feature works end-to-end — pages load, interactions function, no console errors.
20. **Commit and push:**
    ```bash
    git add <specific-files>
    git commit -m "feat: <feature description>"
    git push -u origin feature/<feature-name>
    ```
21. **Clean up** — verify all beads for this feature are closed. If any remain open, investigate and resolve or defer with explanation.

---

## Rules

- **Design doc is the source of truth.** All implementation must match the architecture doc. If a deviation is needed, note it in a bead and flag to the user.
- **No code without a bead.** Every file change traces back to a bead.
- **Build must pass before review.** Dev agents run `npm run build` before handing off. Reviewers reject if build is broken.
- **Worktrees are ephemeral.** Create for parallel work, merge back, delete. Never leave stale worktrees.
- **File overlap = sequential.** If two tasks modify the same file, they cannot run in parallel regardless of logical independence.

---

*Last Updated: 2026-02-04*
