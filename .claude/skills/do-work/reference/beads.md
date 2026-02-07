# Beads CLI Reference

> Persistent task tracking that survives session resets. All commands run from `app/` directory.

---

## Quick Reference

```bash
cd app && bd list                          # View all tasks
cd app && bd list -s open                  # Open tasks only
cd app && bd create "Title" -d "Why" -p N  # Create task (N = 1-5 priority)
cd app && bd close app-xyz -r "Done"       # Close task
cd app && bd update app-xyz -s in_progress # Update status
cd app && bd show app-xyz                  # View details
cd app && bd search "keyword"              # Search tasks
```

---

## Creating Tasks

### Basic Task

```bash
cd app && bd create "Task title" --description="What and why" -p N
```

Priority: 1 = highest, 5 = lowest. P0 used for CRITICAL review issues.

### Child Tasks

```bash
# Create parent
cd app && bd create "Build auth system" -d "Overall task" -p 1
# Output: app-abc

# Create children
cd app && bd create "Build login page" -d "Step 1" -p 1 --parent app-abc
cd app && bd create "Build middleware" -d "Step 2" -p 1 --parent app-abc
```

### Dependencies

```bash
cd app && bd dep <blocker-id> --blocks <blocked-id>
```

---

## Task Lifecycle

```
open → in_progress → closed
```

```bash
cd app && bd update app-xyz -s in_progress  # Starting work
cd app && bd update app-xyz -s open         # Paused/blocked
cd app && bd close app-xyz -r "Reason"      # Completed
```

---

## Worktrees

```bash
cd app && bd worktree create <name> --branch feature/<branch>
cd app && bd worktree remove <name>
```

Worktrees share the same beads database automatically.
