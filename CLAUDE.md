# Salsa Ninja — Dance Studio Community Platform

---

## Workflow: do-work Skill

All orchestration — task capture, triage, execution, review, verification, archival — is managed by the **do-work skill** installed at `.agents/skills/do-work/`.

**Before writing ANY code or making ANY edits:**
- Say what you want in natural language → `do work <description>`
- The skill captures requests, creates beads, and manages the full pipeline

**To process the queue:** Say `do work run` or `go`

**Full skill reference:** Read [`.agents/skills/do-work/SKILL.md`](.agents/skills/do-work/SKILL.md) for routing, actions, processes, and reference docs.

**Fallback (if do-work is not installed):** Check if `.agents/skills/do-work/SKILL.md` exists. If not, use beads directly:
```bash
cd app && bd create "Task title" --description="What and why" -p N
```
See [Beads Usage](.claude/docs/beads-usage.md) for the standalone beads reference.

---

## Quick Reference

- **App directory:** `./app/` (run all npm commands from here)
- **Dev server:** `cd app && npm run dev` → `http://localhost:3000`
- **Framework:** Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Payments:** Stripe | **Hosting:** Vercel | **Video:** Cloudflare R2

---

## Documentation Index

All docs live in `./docs/`. Each spec file is an **index** that references smaller sub-documents in `./docs/specs/`. Read only what's needed for the current task.

### Project Context

| Doc | When to read |
|-----|-------------|
| [Project Overview](docs/project-overview.md) | Start of session or when you need goals, tech stack, pages, phases, current status |

### Specifications (Index Files)

| Doc | When to read |
|-----|-------------|
| [Technical Spec](docs/salsa-studio-technical-spec.md) | When implementing any feature. Links to: architecture, database schema, auth/roles, API endpoints, feature specs, UI design, deployment |
| [Membership Spec](docs/membership-feature-spec.md) | When building auth, registration, profiles, roles, subscriptions, or admin member management |

### Sub-Documents (Direct Access)

**Architecture & Infrastructure**
- `docs/specs/architecture.md` — System diagram, request flows
- `docs/specs/database-schema.md` — ERD, full SQL, RLS policies, triggers, views
- `docs/specs/deployment.md` — Env vars, setup guides, cost projections
- `docs/specs/project-structure.md` — File layout, quick start commands

**Auth, API & Roles**
- `docs/specs/auth-and-roles.md` — Auth flows, role-based access matrix
- `docs/specs/api-endpoints.md` — Full API route tree

**Feature Specs**
- `docs/specs/features/calendar.md` — Events, RSVP, waitlist, recurring
- `docs/specs/features/calendar-architecture.md` — Calendar architecture (Reviewed, 3 rounds)
- `docs/specs/features/private-lesson-booking.md` — Private lesson booking (Reviewed, 3 rounds)
- `docs/specs/features/video-library.md` — Search, filters, progress, R2 storage
- `docs/specs/features/chat.md` — Channels, DMs, real-time, moderation
- `docs/specs/features/admin.md` — Dashboard, management, invites

**Membership Sub-Docs**
- `docs/specs/membership/user-stories.md` — All user stories by role
- `docs/specs/membership/ui-wireframes.md` — Flows, screens, components, states
- `docs/specs/membership/technical-design.md` — Architecture, types, middleware
- `docs/specs/membership/api-contracts.md` — Endpoint request/response examples
- `docs/specs/membership/edge-cases.md` — Edge cases, acceptance criteria

### Research & Decisions

| Doc | When to read |
|-----|-------------|
| [Chat Solution Analysis](docs/research/chat-solution-analysis.md) | When working on chat feature |
| [Chat Research Findings](docs/research/chat-research-findings.md) | When implementing chat |
| [Calendar Research Findings](docs/research/calendar-research-findings.md) | When implementing calendar |

### Workflow & Process

| Doc | When to read |
|-----|-------------|
| [do-work Skill](.agents/skills/do-work/SKILL.md) | Full workflow reference: capture, work, design, verify, cleanup |
| [Workflow Integration Design](docs/specs/workflow-integration.md) | **Historical** — design rationale from pre-fork evaluation. The skill files are the authoritative reference. |

---

## Development Conventions

See [`.agents/skills/do-work/reference/conventions.md`](.agents/skills/do-work/reference/conventions.md) for the full reference. Summary:

- **Styling:** Tailwind CSS utilities. shadcn/ui components before custom ones.
- **Colors:** Primary red/coral `#ef4444`, secondary gold/amber `#f59e0b`, neutrals `#fafafa`–`#18181b`.
- **Auth:** Magic link only (no passwords). Invite-only via QR or referral link.
- **Roles:** owner, instructor, member_full, member_limited, guest. Enforced via middleware + Supabase RLS.
- **Responsive:** Mobile-first. sm 640px, md 768px, lg 1024px, xl 1280px.
- **i18n:** English + Spanish via next-intl (Phase 4).
