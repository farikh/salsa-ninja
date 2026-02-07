# Design Action

> **Trigger:** `do work design <feature>`, `do work architect <system>`, or Route C triage from the work action.

This action handles two design processes depending on the nature of the work:

- **Architecture Design Process** (4 phases) — for schema, infrastructure, system-level work
- **Feature Design Process** (7 phases) — for new user-facing features

---

## Routing

| Signal | Process |
|--------|---------|
| User says "design feature X" or "plan feature X" | Feature Design |
| User says "architect X" or "design architecture for X" | Architecture Design |
| Route C-Feature (from triage) | Feature Design |
| Route C-Architecture (from triage) | Architecture Design |
| Ambiguous | Ask: "Is this a new user-facing feature, or architectural/infrastructure work?" |

---

## Architecture Design Process

**Use for:** Schema changes, infrastructure, API design, system-level work, complex refactors.

### Phase 1: Research

1. **Create a parent bead** describing the architecture to be designed:
   ```bash
   cd app && bd create "Design <feature> architecture" -d "What and why" -p 2
   ```

2. **Search GitHub** for existing open-source projects, libraries, schemas, and tested patterns. Look for projects with real stars, recent commits, and production usage. Create child beads for each research area.

3. **Run research agents in parallel** when research tasks are independent. Use background agents to maximize throughput.

4. **Document findings** in `docs/research/` — create a solution analysis and consolidated research findings doc.

### Phase 2: Architecture Design

5. **Cross-reference existing specs** before designing. Read:
   - `docs/specs/database-schema.md`
   - `docs/specs/auth-and-roles.md`
   - Any related feature specs

6. **Build a complete architecture document** in `docs/specs/features/`. "Complete" means:
   - Database schema (tables, indexes, constraints)
   - Database functions and triggers
   - Row Level Security policies with validation triggers
   - Realtime/integration patterns
   - UI component tree and page structure
   - Implementation phases
   - Cost projection

7. **All docs must be cross-referenced** — research docs link to architecture, architecture links back to research and existing specs.

### Phase 3: Iterative Review

8. **Run the review loop** — see [processes/review-loop.md](../processes/review-loop.md).
   - Reviewer reads architecture doc AND all relevant existing specs
   - Focus on: schema correctness, RLS security gaps, FK mismatches, missing policies, consistency with existing conventions, implementation feasibility
   - Create child beads for CRITICAL/HIGH issues, fix, re-review until clean

### Phase 4: Wrap-Up

9. **Capture deferred questions** — open design decisions that don't block implementation get recorded as a separate bead with children (one per question), at P3 priority.

10. **Update the architecture doc status** to "Reviewed" with the number of review rounds passed.

11. **Update CLAUDE.md** — add the new architecture doc to the Documentation Index.

12. **Close the parent bead** with a summary of deliverables and review rounds.

---

## Feature Design Process

**Use for:** New user-facing features. All 7 phases below. Depth varies by complexity, but skipping phases leads to rework.

### Phase 1: Discovery

- **Who** is affected? (specific user type)
- **What** problem do they face?
- **What is the impact?**
- **What does success look like?**
- Research competitors and industry UX patterns
- Identify constraints (budget, timeline, technical, legal)

### Phase 2: User Stories

Format: **As a** [type of user], **I want** [goal] **so that** [benefit].

Cover all user types: Owner, Instructor, Full Member, Limited Member, Guest.

Prioritize using MoSCoW: Must Have, Should Have, Could Have, Won't Have.

### Phase 3: UI/UX Design

- User flow diagrams (entry → decision → success/error → exit)
- Wireframes: Desktop (1024px+) and Mobile (375px)
- Empty, loading, error, and success states
- Component inventory (check shadcn/ui first)
- Interaction design (hover, click, transitions, notifications)

### Phase 4: Technical Design

- Architecture decisions (SSR vs CSR, state management, real-time)
- Database changes (DDL, indexes, RLS, migrations)
- Third-party integrations
- Performance considerations

### Phase 5: API Contracts

- Endpoint specifications (method, path, auth, params, response, errors)
- Request/response examples for every endpoint
- Standard error codes (400, 401, 403, 404, 500)

### Phase 6: Edge Cases

Categories: empty states, boundary conditions, concurrency, network failures, permission changes, data integrity, browser/device.

For each: scenario, likelihood, impact, solution, test plan.

Security: input validation (SQLi, XSS), authorization bypass, rate limiting, data exposure.

### Phase 7: Acceptance Criteria

Format: **Given** [precondition], **When** [action], **Then** [expected result].

Definition of Done:
1. All acceptance criteria pass
2. Code is reviewed (self-review minimum)
3. Deployed to staging/preview
4. Tested on mobile device
5. Owner sign-off (major features)

---

## After Design Completes

If this design was triggered by Route C triage from the work action:
1. The design doc becomes the source of truth for implementation
2. Return to the work action to begin execution using [dev-workflow](../processes/dev-workflow.md)
3. The REQ file links to the design doc for traceability
