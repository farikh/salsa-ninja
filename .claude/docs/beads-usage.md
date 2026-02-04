# Beads Task Tracking

> **Purpose**: Persistent task tracking that survives session resets.
>
> TodoWrite is session-only. Beads persists across sessions.

---

## Quick Reference

```bash
cd app && bd list                   # View tasks
cd app && bd create "Title" -d "Why" -p 1
cd app && bd close app-xyz -r "Done because..."
cd app && bd update app-xyz -s in_progress
```

---

## Creating Tasks

### Basic Task

```bash
cd app && bd create "Task title" --description="What and why" -p N
```

Where N = priority (1=highest, 5=lowest)

### Child Tasks (MANDATORY for Sub-Tasks)

**Always create child beads for sub-tasks.** This preserves work history.

```bash
# Create parent
bd create "Build auth system" -d "Overall task" -p 1
# Output: app-abc

# Create children
bd create "Build login page" -d "Step 1" -p 1 --parent app-abc
bd create "Build magic link handler" -d "Step 2" -p 1 --parent app-abc
bd create "Build middleware" -d "Step 3" -p 1 --parent app-abc
```

---

## Task Lifecycle

```
open → in_progress → closed
```

### Update Status

```bash
bd update app-xyz -s in_progress  # Starting work
bd update app-xyz -s open         # Paused/blocked
bd close app-xyz -r "Reason"      # Completed
```

---

## When to Use Beads

| Trigger | Action |
|---------|--------|
| Start new task | Create bead |
| User says "proceed" | Create bead FIRST, then proceed |
| Multi-step task | Create parent + child beads |
| Breaking down work | Create child beads with --parent |

---

## Common Commands

```bash
# List all tasks
bd list

# List open tasks only
bd list -s open

# View task details
bd show app-xyz

# Search tasks
bd search "keyword"
```

---

*Last Updated: 2026-02-03*
