# Iterative Review Loop

> **Referenced by:** [work action](../actions/work.md) (Route B/C), [design action](../actions/design.md)

The review loop ensures quality through iterative CRITICAL/HIGH issue classification, fix, and re-review cycles.

---

## When to Use

| Context | Trigger |
|---------|---------|
| Code implementation (Route B/C) | After implementation, before commit |
| Architecture design | After writing architecture doc |
| Feature design | After writing feature design doc |
| Integration review | After merging worktree branches |

---

## Process

### Step 1: Launch Review Agent

Spawn a review agent with this information:
- Path to the artifact being reviewed (code files, design doc, etc.)
- Paths to cross-reference specs (database-schema.md, auth-and-roles.md, related specs)
- List of all previously fixed issues (so it doesn't repeat them)
- Instruction: "Focus ONLY on CRITICAL and HIGH severity issues."

### Step 2: Classify Issues

The reviewer classifies every finding:

| Severity | Definition |
|----------|-----------|
| **CRITICAL** | Fundamentally broken, security vulnerability, data loss risk, contradicts existing schema/conventions in ways that would cause runtime failures |
| **HIGH** | Significant gap that would cause confusion, bugs, or require rework. Missing error handling at system boundaries. RLS policy gaps. |
| **MEDIUM** | Improvement opportunity. Inconsistency that won't cause failures. |
| **LOW** | Style, naming, documentation-only. |

### Step 3: Create Beads for Issues

For each CRITICAL and HIGH issue found:

```bash
cd app && bd create "[SEVERITY] Issue title" \
  -d "Description of the problem" \
  -p 0 \  # P0 for CRITICAL, P1 for HIGH
  --parent <task-bead-id>
```

### Step 4: Fix Issues

Fix all CRITICAL and HIGH issues. For each:
1. Mark the issue bead `in_progress`
2. Implement the fix
3. Run `cd app && npm run build` (if code change)
4. Close the issue bead with fix description

### Step 5: Re-Review

Launch the review agent again with:
- Same artifact paths
- Updated list of previously fixed issues (including this round)
- Instruction: "Do NOT repeat previously fixed issues. Verify fixes are correct. Check for NEW CRITICAL and HIGH issues only."

### Step 6: Loop or Exit

- If the reviewer finds new CRITICAL or HIGH issues → repeat Steps 3-5
- If zero CRITICAL and zero HIGH → review loop complete, proceed

---

## Review Agent Prompt Template

```
You are a review agent. Review the following artifact:

ARTIFACT: [path]

CROSS-REFERENCE SPECS:
- [path to database-schema.md]
- [path to auth-and-roles.md]
- [other relevant specs]

PREVIOUSLY FIXED ISSUES (DO NOT repeat these — verify they are correctly fixed):
[numbered list of previously fixed issues]

INSTRUCTIONS:
1. Read the artifact AND all cross-reference specs
2. Classify issues as CRITICAL, HIGH, MEDIUM, or LOW
3. Focus on: correctness, security (RLS, auth), consistency with existing
   conventions, edge cases, missing error handling at system boundaries
4. For code reviews: also check for OWASP top 10 vulnerabilities
5. If no CRITICAL or HIGH issues found, state: "No CRITICAL or HIGH issues found."

Return findings as:
- [SEVERITY] Title: Description
```

---

## Limits

- Maximum 5 review rounds per artifact. If still finding CRITICAL issues after 5 rounds, escalate to the user.
- MEDIUM and LOW issues are logged but do not block progression.
