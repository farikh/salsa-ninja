# Multi-Tenant Platform Conversion — Design Document

**Date:** 2026-02-22
**Status:** Approved
**Author:** Brainstorming session (Tafari + Claude)

---

## Overview

Convert Salsa Ninja from a single-studio application into a multi-tenant SaaS platform where multiple dance studios share the same infrastructure with complete data isolation. Salsa Ninja becomes tenant #1. A super admin (Tafari / employees) manages all tenants.

### Key Decisions

- **Tenant isolation:** Shared database with `tenant_id` column on every table
- **Tenant URLs:** Subdomain by default (`studio.yourdomain.com`) + optional custom domain
- **Tenant onboarding:** Admin-only provisioning (super admin creates tenants)
- **Branding:** Theme library with 10 pre-built styles, assignable per tenant via super admin
- **Billing:** Platform fee to studios (SaaS subscription via Stripe)
- **Cross-tenant visibility:** Super admin sees everything; students see only their current portal
- **Multi-studio students:** Treated as separate `members` records per tenant; same `auth.users` account can have multiple member profiles
- **Scope:** Full scaffolding + migrate Salsa Ninja as tenant #1

---

## Section 1: Data Model & Tenant Isolation

### New Tables

#### `tenants`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | text | "Salsa Ninja", "Bachata Kings" |
| slug | text UNIQUE | Used for subdomain: `salsa-ninja.yourdomain.com` |
| custom_domain | text UNIQUE NULL | Optional: `salsaninja.com` |
| owner_member_id | UUID FK → members | The studio owner |
| theme_id | UUID FK → themes | Currently assigned theme |
| status | enum | active, suspended, archived |
| stripe_customer_id | text | Platform billing (studio pays you) |
| stripe_subscription_id | text | Platform subscription |
| subscription_status | enum | active, trialing, past_due, canceled |
| settings | JSONB | Studio-specific config (timezone, language, etc.) |
| created_at / updated_at | timestamptz | |

#### `themes`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | text | "Midnight Salsa", "Tropical Heat", etc. |
| slug | text UNIQUE | URL-safe identifier |
| description | text | Short description for showcase |
| preview_image_url | text | Screenshot for the theme gallery |
| config | JSONB | Colors, fonts, border-radius, spacing, etc. |
| is_active | boolean | Available for assignment |
| sort_order | int | Display order in gallery |
| created_at | timestamptz | |

#### `super_admins`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → auth.users | |
| email | text | |
| full_name | text | |
| role | enum | super_admin, platform_support |
| created_at | timestamptz | |

### Changes to Existing Tables

Every table that holds studio data gets:

```sql
tenant_id UUID NOT NULL REFERENCES tenants(id)
```

**Tables affected (23):** `members`, `roles`, `member_roles`, `tags`, `member_tags`, `events`, `event_series`, `event_rsvps`, `schedule_slots`, `bookings`, `videos`, `video_tags`, `video_progress`, `documents`, `channels`, `messages`, `direct_messages`, `announcements`, `referrals`, `member_credits`, `invite_codes`, `analytics_events`

### Unique Constraint Changes

- `members.email` UNIQUE → `(tenant_id, email)` UNIQUE
- `members.referral_code` UNIQUE → `(tenant_id, referral_code)` UNIQUE
- `invite_codes.code` UNIQUE → `(tenant_id, code)` UNIQUE
- `tenants.slug` stays globally unique (it's a subdomain)

### RLS Policy Pattern

Every existing RLS policy gets wrapped with tenant isolation:

```sql
-- Before (current)
auth.uid() = user_id

-- After (multi-tenant)
auth.uid() = user_id AND tenant_id = get_current_tenant_id()
```

New helper functions:

```sql
get_current_tenant_id() → UUID
-- Reads from Postgres session variable set by middleware
-- SELECT current_setting('app.current_tenant_id', true)::UUID

get_current_member_id() → UUID
-- Updated to scope by tenant
-- SELECT id FROM members WHERE user_id = auth.uid() AND tenant_id = get_current_tenant_id()

is_super_admin() → BOOLEAN
-- Returns true if auth.uid() is in super_admins table
-- Super admin RLS policies allow cross-tenant access
```

### Auth & Multi-Studio Students

- A user in `auth.users` can have **multiple `members` records** — one per tenant
- Same email/Google account can exist in multiple studios
- Each `members` row has its own `tenant_id`, roles, subscription, profile
- Login flow determines tenant context based on the subdomain visited
- If a user visits `salsa-ninja.yourdomain.com`, their session is scoped to that tenant's member record

---

## Section 2: Middleware & Routing

### Subdomain Resolution Flow

```
Request arrives at salsa-ninja.yourdomain.com/dashboard
         |
         v
+-------------------------+
|  Next.js Middleware      |
|  1. Extract hostname     |
|  2. Parse subdomain OR   |
|     match custom_domain  |
|  3. Look up tenant       |
|     from DB/cache        |
+------------+------------+
             |
     +-------+-------+
     | Tenant found? |
     +-------+-------+
         No  |  Yes
         v   |   v
    Show 404 |  Set tenant context
    or landing|  in request headers
         page |  + cookies
              v
+-------------------------+
|  Auth Check              |
|  1. Is user logged in?   |
|  2. Do they have a       |
|     members record for   |
|     THIS tenant?         |
|  3. If not -> /join page |
|     scoped to tenant     |
+------------+------------+
             v
+-------------------------+
|  Route to page with      |
|  tenant_id in context    |
+-------------------------+
```

### Middleware Implementation

1. **Extract tenant from hostname** — parse subdomain or match `tenants.custom_domain`. Cache lookups in-memory.
2. **Set tenant context** — `x-tenant-id` header + `tenant_id` cookie + tenant metadata for layout.
3. **Tenant-scoped auth** — look up user's `members` record for this tenant. No record = redirect to `/join`.
4. **Super admin routing** — `admin.yourdomain.com` bypasses tenant resolution, checks `super_admins` table.

### Special Routes

| Route Pattern | Behavior |
|--------------|----------|
| `yourdomain.com` (root) | Marketing/landing page — theme showcase, platform info |
| `admin.yourdomain.com` | Super admin panel |
| `{slug}.yourdomain.com` | Tenant portal |
| `{slug}.yourdomain.com/login` | Login scoped to tenant |
| `{slug}.yourdomain.com/join` | Join/register scoped to tenant |
| Custom domain | Resolved via `tenants.custom_domain` lookup |

### Supabase Client Changes

Single Supabase project, single anon key. Every query adds tenant scoping:

```ts
const tenantId = getTenantFromContext()
supabase.from('events').select('*').eq('tenant_id', tenantId)
```

RLS enforces at DB level; application layer filters as defense-in-depth.

### Tenant Context Provider (React)

```tsx
<TenantProvider tenant={tenant} theme={theme}>
  <ThemeProvider config={theme.config}>
    {children}
  </ThemeProvider>
</TenantProvider>
```

### Local Development

- Query param fallback: `localhost:3000?tenant=salsa-ninja`
- Or `/etc/hosts` with `salsa-ninja.localhost`
- Middleware detects `localhost` and supports both

---

## Section 3: Theme Library System

### Theme Architecture

Each theme is a set of CSS custom properties stored as JSONB in `themes.config`. Applied at runtime via CSS variables on `<html>`. Maps directly to shadcn/ui's CSS variable system.

```json
{
  "colors": {
    "primary": "#ef4444",
    "primary-foreground": "#ffffff",
    "secondary": "#f59e0b",
    "secondary-foreground": "#18181b",
    "background": "#fafafa",
    "foreground": "#18181b",
    "card": "#ffffff",
    "card-foreground": "#18181b",
    "muted": "#f4f4f5",
    "muted-foreground": "#71717a",
    "accent": "#f4f4f5",
    "accent-foreground": "#18181b",
    "destructive": "#ef4444",
    "border": "#e4e4e7",
    "ring": "#ef4444"
  },
  "fonts": {
    "heading": "Inter",
    "body": "Inter"
  },
  "radius": "0.5rem",
  "style": {
    "sidebar": "dark",
    "buttons": "rounded",
    "cards": "shadow"
  }
}
```

### The 10 Starter Themes

| # | Name | Vibe | Primary | Secondary |
|---|------|------|---------|-----------|
| 1 | Fuego | Salsa Ninja's current look | Red #ef4444 | Amber #f59e0b |
| 2 | Midnight Club | Dark, upscale nightlife | Deep purple #7c3aed | Gold #eab308 |
| 3 | Tropical Heat | Caribbean, warm | Coral #f97316 | Teal #14b8a6 |
| 4 | Urban Groove | Street dance, hip-hop | Slate #475569 | Lime #84cc16 |
| 5 | Elegante | Ballroom, formal | Navy #1e3a5f | Rose gold #e8a87c |
| 6 | Neon Nights | Modern club | Hot pink #ec4899 | Cyan #06b6d4 |
| 7 | Earth & Rhythm | Afro-Latin, organic | Terracotta #c2410c | Sage #65a30d |
| 8 | Ocean Breeze | Beach, resort | Ocean blue #0284c7 | Sandy #d4a574 |
| 9 | Minimalist | Clean, modern studio | Black #18181b | White #fafafa |
| 10 | Festival | Bright, carnival | Magenta #d946ef | Yellow #facc15 |

### Theme Application

Server-side: root layout reads tenant's theme and injects CSS variables on `<html>`. No runtime JS for theme switching in tenant portal. Only super admin panel needs dynamic switching for preview.

### Theme Showcase Page

At `yourdomain.com/themes`:
- Grid of 10 theme cards with color swatches
- Click to open live preview with full mock studio page
- Serves as marketing and super admin reference

### Codebase Changes

1. `globals.css` — replace hardcoded HSL values with CSS variable defaults
2. `tailwind.config.ts` — minimal changes (already configured for CSS vars via shadcn)
3. `layout.tsx` — read theme from tenant context, inject CSS variables
4. Components — audit and fix any raw hex values (should use `bg-primary`, `text-foreground`, etc.)

---

## Section 4: Super Admin Panel

### Access Model

Separate route group `/(super-admin)` accessed via `admin.yourdomain.com`. Invisible to tenant users. Only `super_admins` table members can access.

### Page Structure

```
admin.yourdomain.com/
├── /                        → Dashboard (overview metrics)
├── /tenants                 → All tenants list
├── /tenants/new             → Create new tenant
├── /tenants/[id]            → Tenant detail / edit
├── /tenants/[id]/members    → Browse tenant's members
├── /tenants/[id]/events     → Browse tenant's events
├── /tenants/[id]/messages   → Browse tenant's messages
├── /tenants/[id]/analytics  → Tenant-specific analytics
├── /tenants/[id]/billing    → Tenant subscription / invoices
├── /themes                  → Theme library management
├── /themes/new              → Create new theme
├── /themes/[id]             → Edit theme
├── /themes/showcase         → Public-facing theme gallery preview
├── /admins                  → Manage super admin users
├── /billing                 → Platform-wide revenue / MRR
└── /settings                → Platform settings
```

### Dashboard Metrics

| Metric | Description |
|--------|-------------|
| Total tenants | Active / suspended / archived counts |
| Total students | Across all tenants |
| MRR | Monthly recurring revenue from tenant subscriptions |
| Active today | Users who logged in today, by tenant |
| New signups (7d) | Students who joined any tenant in last week |
| Tenant health | Table with member count, last activity, subscription status |

### Tenant Management

- **List:** table with name, slug, custom domain, status, member count, theme, subscription
- **Create:** enter name (auto-slug), assign theme, enter owner email, sends magic link
- **Detail:** edit settings, change theme with preview, manage subscription, quick stats
- **Drill-down:** view tenant's members/events/messages in read-only super admin wrapper
- **Impersonate:** "View as owner" button for support/debugging, tracked in audit logs

### Super Admin Roles

| Role | Can do |
|------|--------|
| super_admin | Everything — CRUD tenants, themes, admins, billing, impersonate |
| platform_support | View all data, impersonate, but no create/delete tenants or billing |

### RLS for Super Admin

```sql
CREATE POLICY "super_admin_full_access" ON <table>
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());
```

---

## Section 5: Migration Strategy

### Principle: Zero Downtime, Zero Data Loss

### Migration Sequence

1. **Create new tables** (additive, non-breaking): `tenants`, `themes`, `super_admins`
2. **Add `tenant_id` columns as NULLABLE** (non-breaking) to all 23 tables
3. **Create "Salsa Ninja" tenant record** with Fuego theme
4. **Backfill `tenant_id`** on all existing rows (in transaction, with count verification)
5. **Set `tenant_id` to NOT NULL** + add indexes (compound indexes for common queries)
6. **Update RLS policies** (swap to tenant-aware versions, keep old as `_backup`)
7. **Update helper functions** (`get_current_tenant_id`, `get_current_member_id`, etc.)
8. **Deploy app code** (middleware, providers, super admin panel)
9. **Verify** (all features work, RLS scoping correct, test tenant #2 shows isolation)
10. **Create super admin record** (Tafari)

### Rollback Plan

- Steps 1-4: fully reversible (drop columns, drop tables)
- Step 5+: keep old RLS policies as `_backup` until verified
- Migration scripts are idempotent

---

## Section 6: Development Execution Strategy

### Workstreams

```
WS1: Database Migration (schema + RLS)          — must land first
WS2: Middleware & Tenant Context                 — parallel with WS3, WS4
WS3: Theme Library & 10 Styles                   — parallel with WS2, WS4
WS4: Super Admin Panel                           — parallel with WS2, WS3
WS5: App Code Refactor (tenant-scope queries)    — after WS1-3 merge
WS6: Migration Script & Data Backfill            — after WS5 merge
```

### Workstream Details

**WS1: Database Migration**
- Create `tenants`, `themes`, `super_admins` tables
- Add `tenant_id` to all 23 existing tables
- Seed 10 theme configs
- Rewrite all RLS policies with tenant scoping
- Update all helper functions
- Update unique constraints to compound keys
- Add indexes

**WS2: Middleware & Tenant Context**
- Subdomain parsing in `middleware.ts`
- Custom domain lookup
- Tenant context via headers/cookies
- Supabase client changes (set `app.current_tenant_id`)
- `TenantProvider` React context
- Local dev support
- Tenant-scoped auth flow

**WS3: Theme Library & 10 Styles**
- `ThemeProvider` component (CSS variable injection)
- Refactor `globals.css` to CSS variable defaults
- Audit/fix hardcoded colors in components
- Design 10 theme configs (JSONB)
- Theme showcase page at root domain
- Live preview rendering

**WS4: Super Admin Panel**
- `(super-admin)` route group with layout
- Dashboard with cross-tenant metrics
- Tenant CRUD
- Tenant drill-down views
- Theme assignment UI with preview
- Admin management
- Impersonation mode
- Super admin auth flow

**WS5: App Code Refactor**
- Wrap root layout with `TenantProvider` + `ThemeProvider`
- Audit every Supabase query for `tenant_id` filtering
- Update all create operations to include `tenant_id`
- Update navigation to be tenant-aware
- Public pages pull from tenant config

**WS6: Migration Script & Data Backfill**
- Idempotent migration script (Salsa Ninja = tenant #1)
- Verification queries
- Create super admin record
- Rollback script
- Smoke test checklist

### Git Worktree Strategy

```
master
├── mt/ws1-database-migration
├── mt/ws2-middleware-tenant-context
├── mt/ws3-theme-library
├── mt/ws4-super-admin-panel
├── mt/ws5-app-refactor              (after WS1-3 merge)
└── mt/ws6-migration-script          (after WS5 merge)
```

**Merge order:** WS1 → WS2 → WS3 → WS4 → WS5 → WS6

### Agent Team Structure

| Agent | Workstream | Role |
|-------|-----------|------|
| db-architect | WS1 | Database migration + RLS |
| middleware-engineer | WS2 | Middleware + tenant context |
| theme-designer | WS3 | Theme library + 10 styles |
| admin-builder | WS4 | Super admin panel |
| app-refactorer | WS5 | Tenant-scope all app code |
| migration-runner | WS6 | Migration scripts + verification |

### Execution Phases

- **Phase 1 (parallel):** WS1 + WS3
- **Phase 2 (parallel):** WS2 + WS4 (after WS1 merges)
- **Phase 3 (sequential):** WS5 (needs WS1-3 merged)
- **Phase 4 (sequential):** WS6 (needs everything merged)
