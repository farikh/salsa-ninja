---
name: do-work
description: Task queue - capture requests, triage, execute with review loops, verify, archive
argument-hint: run | (task to capture) | design | verify | cleanup | version
upstream: https://raw.githubusercontent.com/bladnman/do-work/main/SKILL.md
---

# Do-Work Skill (Salsa Ninja Fork)

A unified orchestration skill for the full development lifecycle: capture → triage → execute → review → verify → archive. Integrates with beads for task tracking, priorities, and dependencies.

> **Fork note:** Customized from [bladnman/do-work](https://github.com/bladnman/do-work) v0.9.5. Adds beads integration, iterative review loops, design processes, worktree coordination, and priority-based ordering.

---

## Index

### Actions (What the User Invokes)

| Action | File | Purpose |
|--------|------|---------|
| **Capture** | [actions/capture.md](./actions/capture.md) | Parse natural language → UR + REQ files + beads |
| **Work** | [actions/work.md](./actions/work.md) | Triage → execute → review loop → commit. Priority-ordered. |
| **Design** | [actions/design.md](./actions/design.md) | Architecture (4-phase) or Feature (7-phase) design process |
| **Verify** | [actions/verify.md](./actions/verify.md) | Compare implemented output against original UR intent |
| **Cleanup** | [actions/cleanup.md](./actions/cleanup.md) | Archive consolidation, bead orphan detection |
| **Version** | [actions/version.md](./actions/version.md) | Check version, display changelog |

### Processes (Referenced by Actions)

| Process | File | Used by |
|---------|------|---------|
| **Triage** | [processes/triage.md](./processes/triage.md) | Work action (Step 3) |
| **Review Loop** | [processes/review-loop.md](./processes/review-loop.md) | Work action (Route B/C), Design action |
| **Dev Workflow** | [processes/dev-workflow.md](./processes/dev-workflow.md) | Work action (Route C) |

### Reference (Looked Up as Needed)

| Reference | File | When to read |
|-----------|------|-------------|
| **Beads CLI** | [reference/beads.md](./reference/beads.md) | When creating/updating/closing beads |
| **File Formats** | [reference/file-formats.md](./reference/file-formats.md) | When creating UR/REQ files |
| **Conventions** | [reference/conventions.md](./reference/conventions.md) | When implementing code |

---

## Routing Decision

### Step 1: Parse the Input

Examine what follows "do work" — first match wins:

| Priority | Pattern | Example | Route |
|----------|---------|---------|-------|
| 1 | Empty or bare invocation | `do work` | → Ask: "Start the work loop?" |
| 2 | Action verbs | `do work run`, `go`, `start` | → [work](./actions/work.md) |
| 3 | Design keywords | `do work design calendar`, `architect` | → [design](./actions/design.md) |
| 4 | Verify keywords | `do work verify`, `check`, `evaluate` | → [verify](./actions/verify.md) |
| 5 | Cleanup keywords | `do work cleanup`, `tidy`, `consolidate` | → [cleanup](./actions/cleanup.md) |
| 6 | Version keywords | `do work version`, `update`, `changelog` | → [version](./actions/version.md) |
| 7 | Descriptive content | `do work add dark mode`, `fix login bug` | → [capture](./actions/capture.md) |

### Step 2: Preserve Payload

**Critical rule**: Never lose the user's content.

- **Single word** that matches a keyword → route to that action
- **Single word** that doesn't match → ask: "Add '{word}' as a request, or did you mean something else?"
- **Multi-word content** → route to capture (default)
- **Ambiguous** → ask: "Add this as a request, or start the work loop?" Accept minimal replies ("add" or "work")

### Action Verbs (→ Work)

run, go, start, begin, process, execute, build, continue, resume

### Design Verbs (→ Design)

design, architect, research, plan feature, build architecture

### Verify Verbs (→ Verify)

verify, check, evaluate, review requests, audit

### Cleanup Verbs (→ Cleanup)

cleanup, clean up, tidy, consolidate, organize archive

---

## Beads Integration Summary

This skill creates and manages beads automatically. The user never needs to run `bd create`, `bd update`, or `bd close` manually during the workflow.

| Event | Bead action |
|-------|------------|
| UR captured | Parent bead created |
| REQ captured | Child bead created (under UR parent) |
| Work begins on REQ | `bd update <id> -s in_progress` |
| Work completed | `bd close <id> -r "<summary>"` |
| All REQs in UR done | Parent bead closed |
| Review finds issue | Child bead created (severity in title) |
| Issue fixed | Fix bead closed |

Beads is the source of truth for task state. REQ frontmatter mirrors state for human readability. Agent reads beads for ordering and status.

---

## Source of Truth

| Concern | Authority |
|---------|-----------|
| Task state (pending/in-progress/done) | Beads (JSONL) |
| Task content (what to build) | REQ files (Markdown) |
| Priority & dependencies | Beads (P1-P5, `bd dep`) |
| Audit trail (what was done) | REQ files (living logs) |
| Original intent | UR input.md (verbatim) |
