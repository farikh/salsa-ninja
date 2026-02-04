# Salsa Ninja — Dance Studio Community Platform

---

## STOP - BEADS BEFORE CODE

**Before writing ANY code or making ANY edits:**

```bash
cd app && bd create "Task title" --description="What and why" -p N
```

This is NOT optional. Beads first, always. See [Beads Usage](.claude/docs/beads-usage.md) for details.

---

## Quick Reference

- **App directory:** `./app/` (run all npm commands from here)
- **Dev server:** `cd app && npm run dev` → `http://localhost:3000`
- **Framework:** Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Payments:** Stripe | **Hosting:** Vercel | **Video:** Cloudflare R2

## Documentation Index

All docs live in `./docs/`. Each spec file is an **index** that references smaller sub-documents in `./docs/specs/`. Read only what's needed for the current task — avoid loading full specs when a sub-document will suffice.

### Project Context

| Doc | When to read |
|-----|-------------|
| [Project Overview](docs/project-overview.md) | Start of session or when you need goals, tech stack, pages, phases, current status |

### Specifications (Index Files)

These are lightweight index files. Open them to find links to the specific sub-document you need.

| Doc | When to read |
|-----|-------------|
| [Technical Spec](docs/salsa-studio-technical-spec.md) | When implementing any feature. Index links to: architecture, database schema, auth/roles, API endpoints, feature specs, UI design, deployment |
| [Membership Spec](docs/membership-feature-spec.md) | When building auth, registration, profiles, roles, subscriptions, or admin member management. Index links to: user stories, wireframes, technical design, API contracts, edge cases |

### Sub-Documents (Direct Access)

For targeted reads, go directly to the sub-document:

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
- `docs/specs/features/video-library.md` — Search, filters, progress, R2 storage
- `docs/specs/features/chat.md` — Channels, DMs, real-time, moderation
- `docs/specs/features/admin.md` — Dashboard, management, invites

**Membership Sub-Docs**
- `docs/specs/membership/user-stories.md` — All user stories by role
- `docs/specs/membership/ui-wireframes.md` — Flows, screens, components, states
- `docs/specs/membership/technical-design.md` — Architecture, types, middleware
- `docs/specs/membership/api-contracts.md` — Endpoint request/response examples
- `docs/specs/membership/edge-cases.md` — Edge cases, acceptance criteria

### Process & Workflow

| Doc | When to read |
|-----|-------------|
| [Feature Design Process](docs/feature-design-process.md) | Before designing any new feature. 7-phase process with templates and checklists. |
| [Beads Usage](.claude/docs/beads-usage.md) | Task tracking commands, lifecycle, parent/child patterns |

## Development Conventions

- **Beads before code:** Always create a bead before starting any task. See `.claude/docs/beads-usage.md`.
- **Feature design first:** Follow `docs/feature-design-process.md` before building new features.
- **Styling:** Tailwind CSS utilities. shadcn/ui components before custom ones.
- **Colors:** Primary red/coral `#ef4444`, secondary gold/amber `#f59e0b`, neutrals `#fafafa`–`#18181b`.
- **Auth:** Magic link only (no passwords). Invite-only via QR or referral link.
- **Roles:** owner, instructor, member_full, member_limited, guest. Enforced via middleware + Supabase RLS.
- **Responsive:** Mobile-first. sm 640px, md 768px, lg 1024px, xl 1280px.
- **i18n:** English + Spanish via next-intl (Phase 4).
