# Capture Action

> **Part of the do-work skill (Salsa Ninja fork).** Invoked when routing determines the user is adding a request.
>
> This action wraps the upstream [do action](./do.md). Read **this file first** — it delegates to do.md for capture logic, then adds beads integration in Step 2. Do not read do.md independently.

---

## Step 1: Capture (Upstream Logic)

Follow the full capture process defined in [do.md](./do.md). This creates:
- A UR folder at `do-work/user-requests/UR-NNN/` with `input.md`
- One or more REQ files at `do-work/REQ-NNN.md`

> **CRITICAL PATH OVERRIDE — read before opening do.md:**
>
> The upstream do.md assumes `do-work/` is at the project root. In this fork, **all `do-work/` paths are relative to `app/`**. The directory lives at `app/do-work/`, not the project root.
>
> When do.md says `do-work/user-requests/`, read it as `app/do-work/user-requests/`.
> When do.md says `do-work/REQ-NNN.md`, read it as `app/do-work/REQ-NNN.md`.
> When do.md says `do-work/archive/`, read it as `app/do-work/archive/`.
>
> Also: do.md references `do-work/working/` — **this directory does not exist** in this fork. Skip any instructions involving `working/`. REQ files stay in `app/do-work/` (the queue) until archived.

Read [do.md](./do.md) now and execute its capture process completely, applying the path override above. Then return here for Step 2.

---

## Step 2: Create Beads (Immediately After Capture)

After UR and REQ files are created, create corresponding beads. This is NOT a separate step the user invokes — it happens as part of the same capture flow.

### 2.1 Check for Duplicates in Beads

Before creating beads, check if matching beads already exist:

```bash
cd app && bd search "<keywords from REQ title>"
```

If a matching open bead exists, link the REQ to it via `bead_id` in frontmatter instead of creating a duplicate.

### 2.2 Create Parent Bead for UR

```bash
cd app && bd create "UR-NNN: <one-line summary of user request>" \
  -d "<first 200 chars of verbatim input>" \
  -p 2
```

### 2.3 Create Child Beads for Each REQ

For each REQ file created:

```bash
cd app && bd create "<REQ title>" \
  -d "<REQ what/context summary>" \
  -p <inferred priority> \
  --parent <ur-bead-id>
```

**Priority inference** — see [processes/triage.md](../processes/triage.md#priority-inference):
- Critical bug / security → P1
- Bug fix / new feature → P2
- Enhancement / refactor → P3
- Nice-to-have → P4
- Default → P2

### 2.4 Detect Dependencies

Analyze REQ content for ordering constraints:
- Schema/migration changes block API routes
- API routes block UI components that call them
- Shared types/utilities block consumers
- REQs with `related` fields may have dependencies

Wire dependencies:
```bash
cd app && bd dep <blocker-bead> --blocks <blocked-bead>
```

### 2.5 Write Bead IDs to REQ Frontmatter

Update each REQ file's YAML frontmatter:

```yaml
bead_id: app-xyz
bead_parent: app-abc
```

---

## Step 3: Report to User

After both capture and bead creation:

```
Captured N requests from UR-NNN:
  - REQ-001: <title> (P2, app-xyz)
  - REQ-002: <title> (P1, app-abc)
  - REQ-003: <title> (P3, app-def, blocked by REQ-001)

Beads created with priorities and dependencies.
Say "go" or "do work run" to start processing.
```

If the request was complex, suggest verification:
```
This was a complex capture. Consider running "do work verify" to check coverage.
```
