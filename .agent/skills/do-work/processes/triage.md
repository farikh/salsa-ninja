# Triage Process

> **Referenced by:** [work action](../actions/work.md) Step 3

Triage determines the execution route for each request based on complexity assessment.

---

## Routes

### Route A — Simple (Direct Implementation)

**Criteria (any of):**
- Config value change
- Typo or copy fix
- Single-file, obvious change
- Request explicitly names the file and change
- No architectural decisions needed

**Pipeline:** Implement → build → commit

### Route B — Medium (Explore First)

**Criteria (any of):**
- Clear outcome but unknown file locations
- Bug fix needing investigation
- Feature addition to existing component
- Needs codebase context to implement correctly
- Touches 2-5 files

**Pipeline:** Explore → implement → review loop → commit

### Route C — Complex (Design Required)

**Criteria (any of):**
- New feature spanning multiple components
- Database schema changes
- New API endpoints
- Architectural decisions required
- Touches 5+ files or creates new modules
- Needs parallel agent work (worktrees)

**Pipeline:** Design process → dev-workflow → review loops → integration → commit

---

## Route C Sub-Classification

Route C has two sub-types that determine which design process is triggered:

| Sub-type | Trigger | Design process |
|----------|---------|---------------|
| **C-Feature** | New user-facing feature | [Feature Design (7 phases)](../actions/design.md#feature-design-process) |
| **C-Architecture** | Infrastructure, schema, system-level | [Architecture Design (4 phases)](../actions/design.md#architecture-design-process) |

**How to distinguish:**
- Does the request describe something a user will see or interact with? → C-Feature
- Is it about schema, RLS, APIs, system design, or infrastructure? → C-Architecture
- Complex refactor with no new feature → C-Architecture (lighter-weight)

---

## Priority Inference

When creating beads from REQs, assign priority based on content:

| Content signal | Priority |
|---------------|----------|
| Critical bug / data loss / security issue | P1 |
| Bug fix (non-critical) | P2 |
| New feature / feature blocker | P2 |
| Enhancement / refactor | P3 |
| Nice-to-have / cosmetic | P4 |
| Default (unclear) | P2 |

User can override: "do work add <task> priority high"

---

## Triage Documentation

After triage, append to the REQ file:

```markdown
## Triage

**Route: [A|B|C]** - [Simple|Medium|Complex]

**Reasoning:** [One sentence explaining why this route was chosen]

**Planning:** [Required | Not required]
```

Update REQ frontmatter: `route: A` (or B or C)
