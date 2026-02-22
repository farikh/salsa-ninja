# Multi-Tenant Platform Conversion — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the single-studio Salsa Ninja app into a multi-tenant SaaS platform with complete data isolation, a theme library, and a super admin panel.

**Architecture:** Shared Supabase database with `tenant_id` column on every data table. Subdomain-based routing resolves tenant context. CSS-variable-driven theme system with 10 pre-built styles. Super admin panel at `admin.{domain}` for platform management.

**Tech Stack:** Next.js 16 (App Router), Supabase (PostgreSQL + Auth + RLS), Tailwind CSS v4, shadcn/ui, TypeScript, Stripe (platform billing)

**Design Doc:** `docs/plans/2026-02-22-multi-tenant-design.md`

---

## Workstream Overview

This plan is split into 6 workstreams (WS1–WS6) that map to separate git worktrees and agent assignments. Tasks within each workstream are sequential. Workstreams have the following dependencies:

```
WS1 (DB) ──────┬──> WS2 (Middleware)
               ├──> WS3 (Themes)      ← can start in parallel with WS1
               └──> WS4 (Super Admin)
WS2 + WS3 ────────> WS5 (App Refactor)
WS5 ───────────────> WS6 (Migration Script)
```

**Execution phases:**
- Phase 1: WS1 + WS3 in parallel
- Phase 2: WS2 + WS4 in parallel (after WS1 merges)
- Phase 3: WS5 (after WS1, WS2, WS3 merge)
- Phase 4: WS6 (after WS5 merges)

**Git branches:**
- `mt/ws1-database-migration`
- `mt/ws2-middleware-tenant-context`
- `mt/ws3-theme-library`
- `mt/ws4-super-admin-panel`
- `mt/ws5-app-refactor`
- `mt/ws6-migration-script`

---

## WS1: Database Migration (Schema + RLS)

**Agent:** `db-architect`
**Branch:** `mt/ws1-database-migration`
**Files:**
- Create: `app/supabase/migrations/20260222100000_multi_tenant_schema.sql`
- Create: `app/supabase/migrations/20260222100001_multi_tenant_rls.sql`
- Create: `app/supabase/migrations/20260222100002_seed_themes.sql`

### Task 1.1: Create new multi-tenant tables

**Files:**
- Create: `app/supabase/migrations/20260222100000_multi_tenant_schema.sql`

**Step 1: Write the migration SQL**

```sql
-- =============================================
-- Multi-Tenant Schema: tenants, themes, super_admins
-- =============================================

-- Tenant status enum
CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'archived');

-- Tenant subscription status enum
CREATE TYPE tenant_subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'none');

-- Super admin role enum
CREATE TYPE super_admin_role AS ENUM ('super_admin', 'platform_support');

-- Themes table (must exist before tenants references it)
CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  preview_image_url TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  custom_domain TEXT UNIQUE,
  theme_id UUID REFERENCES themes(id),
  status tenant_status NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status tenant_subscription_status NOT NULL DEFAULT 'none',
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Super admins table
CREATE TABLE super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role super_admin_role NOT NULL DEFAULT 'super_admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_themes_slug ON themes(slug);
CREATE INDEX idx_super_admins_user_id ON super_admins(user_id);

-- Updated_at trigger for tenants
CREATE OR REPLACE FUNCTION update_tenant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_tenant_updated_at();

-- Enable RLS on new tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Themes are readable by everyone (public showcase)
CREATE POLICY "themes_select_all" ON themes
  FOR SELECT USING (true);

-- Themes manageable by super admins only
CREATE POLICY "themes_manage_super_admin" ON themes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
  );

-- Tenants readable by their members or super admins
CREATE POLICY "tenants_select" ON tenants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid() AND tenant_id = tenants.id)
  );

-- Tenants manageable by super admins only
CREATE POLICY "tenants_manage_super_admin" ON tenants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
  );

-- Super admins table: only super admins can read/manage
CREATE POLICY "super_admins_select" ON super_admins
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid())
  );

CREATE POLICY "super_admins_manage" ON super_admins
  FOR ALL USING (
    EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid() AND sa.role = 'super_admin')
  );
```

**Step 2: Verify the migration file is valid SQL**

Run: `cd app && npx supabase db lint`
Expected: No syntax errors

**Step 3: Commit**

```bash
git add app/supabase/migrations/20260222100000_multi_tenant_schema.sql
git commit -m "feat(mt): add tenants, themes, super_admins tables"
```

---

### Task 1.2: Add tenant_id to all existing tables

**Files:**
- Append to: `app/supabase/migrations/20260222100000_multi_tenant_schema.sql`

**Step 1: Add tenant_id columns (NULLABLE initially for migration safety)**

Append to the migration file:

```sql
-- =============================================
-- Add tenant_id to all existing data tables
-- NULLABLE initially — backfill migration sets NOT NULL
-- =============================================

ALTER TABLE members ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE roles ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE member_roles ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE tags ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE member_tags ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE events ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE event_series ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE event_rsvps ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE schedule_slots ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE bookings ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE videos ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE video_tags ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE video_progress ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE documents ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE channels ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE messages ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE direct_messages ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE announcements ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE referrals ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE member_credits ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE invite_codes ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE analytics_events ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- Tenant-scoped indexes for query performance
CREATE INDEX idx_members_tenant ON members(tenant_id);
CREATE INDEX idx_members_tenant_user ON members(tenant_id, user_id);
CREATE INDEX idx_events_tenant ON events(tenant_id);
CREATE INDEX idx_events_tenant_start ON events(tenant_id, start_time);
CREATE INDEX idx_channels_tenant ON channels(tenant_id);
CREATE INDEX idx_messages_tenant ON messages(tenant_id);
CREATE INDEX idx_direct_messages_tenant ON direct_messages(tenant_id);
CREATE INDEX idx_videos_tenant ON videos(tenant_id);
CREATE INDEX idx_bookings_tenant ON bookings(tenant_id);
CREATE INDEX idx_schedule_slots_tenant ON schedule_slots(tenant_id);
CREATE INDEX idx_event_rsvps_tenant ON event_rsvps(tenant_id);
CREATE INDEX idx_tags_tenant ON tags(tenant_id);
CREATE INDEX idx_invite_codes_tenant ON invite_codes(tenant_id);
CREATE INDEX idx_announcements_tenant ON announcements(tenant_id);
CREATE INDEX idx_referrals_tenant ON referrals(tenant_id);
CREATE INDEX idx_analytics_events_tenant ON analytics_events(tenant_id);

-- Update unique constraints to be tenant-scoped
-- Drop old unique constraints and recreate as compound
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_email_key;
CREATE UNIQUE INDEX idx_members_tenant_email ON members(tenant_id, email);

ALTER TABLE members DROP CONSTRAINT IF EXISTS members_referral_code_key;
CREATE UNIQUE INDEX idx_members_tenant_referral ON members(tenant_id, referral_code);

ALTER TABLE invite_codes DROP CONSTRAINT IF EXISTS invite_codes_code_key;
CREATE UNIQUE INDEX idx_invite_codes_tenant_code ON invite_codes(tenant_id, code);
```

**Step 2: Commit**

```bash
git add app/supabase/migrations/20260222100000_multi_tenant_schema.sql
git commit -m "feat(mt): add tenant_id columns and indexes to all data tables"
```

---

### Task 1.3: Update RLS helper functions for tenant context

**Files:**
- Create: `app/supabase/migrations/20260222100001_multi_tenant_rls.sql`

**Step 1: Write tenant-aware helper functions**

```sql
-- =============================================
-- Multi-Tenant RLS Helper Functions
-- =============================================

-- Get current tenant_id from Postgres session variable
-- Set by middleware via supabase client config
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user is a super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM super_admins WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Get current member_id (tenant-scoped)
CREATE OR REPLACE FUNCTION get_current_member_id()
RETURNS UUID AS $$
  SELECT id FROM members
  WHERE user_id = auth.uid()
    AND tenant_id = get_current_tenant_id()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user is staff (owner or instructor) in current tenant
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM member_roles mr
    JOIN members m ON mr.member_id = m.id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid()
      AND m.tenant_id = get_current_tenant_id()
      AND r.name IN ('owner', 'instructor')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user is admin (owner) in current tenant
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM member_roles mr
    JOIN members m ON mr.member_id = m.id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid()
      AND m.tenant_id = get_current_tenant_id()
      AND r.name = 'owner'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user is an instructor in current tenant
CREATE OR REPLACE FUNCTION is_instructor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM member_roles mr
    JOIN members m ON mr.member_id = m.id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid()
      AND m.tenant_id = get_current_tenant_id()
      AND r.name = 'instructor'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user has a specific role in current tenant
CREATE OR REPLACE FUNCTION has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM member_roles mr
    JOIN members m ON mr.member_id = m.id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid()
      AND m.tenant_id = get_current_tenant_id()
      AND r.name = role_name
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user has active subscription in current tenant
CREATE OR REPLACE FUNCTION has_active_subscription()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid()
      AND tenant_id = get_current_tenant_id()
      AND subscription_status = 'active'
      AND subscription_tier IN ('monthly', 'annual')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user has any of the specified tags in current tenant
CREATE OR REPLACE FUNCTION has_any_tag(tag_ids UUID[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM member_tags mt
    JOIN members m ON mt.member_id = m.id
    WHERE m.user_id = auth.uid()
      AND m.tenant_id = get_current_tenant_id()
      AND mt.tag_id = ANY(tag_ids)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

**Step 2: Commit**

```bash
git add app/supabase/migrations/20260222100001_multi_tenant_rls.sql
git commit -m "feat(mt): rewrite all RLS helper functions with tenant scoping"
```

---

### Task 1.4: Rewrite all RLS policies with tenant isolation

**Files:**
- Append to: `app/supabase/migrations/20260222100001_multi_tenant_rls.sql`

**Step 1: Drop old policies and create tenant-aware replacements**

Append to the RLS migration file. This replaces every existing policy with a tenant-scoped version plus a super admin bypass.

```sql
-- =============================================
-- Replace all RLS policies with tenant-scoped versions
-- Pattern: tenant_id = get_current_tenant_id() OR is_super_admin()
-- =============================================

-- ---- MEMBERS ----
DROP POLICY IF EXISTS "Members can view other members" ON members;
DROP POLICY IF EXISTS "Members can update own profile" ON members;
DROP POLICY IF EXISTS "Staff can manage members" ON members;
DROP POLICY IF EXISTS "Service role can insert members" ON members;

CREATE POLICY "members_select" ON members
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "members_update_own" ON members
  FOR UPDATE USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND user_id = auth.uid())
  );

CREATE POLICY "members_manage_staff" ON members
  FOR ALL USING (
    is_super_admin() OR is_staff()
  ) WITH CHECK (
    is_super_admin()
    OR (is_staff() AND tenant_id = get_current_tenant_id())
  );

CREATE POLICY "members_insert_service" ON members
  FOR INSERT WITH CHECK (true);

-- ---- INVITE CODES ----
DROP POLICY IF EXISTS "Anyone can validate invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Staff can manage invite codes" ON invite_codes;

CREATE POLICY "invite_codes_select" ON invite_codes
  FOR SELECT USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY "invite_codes_manage" ON invite_codes
  FOR ALL USING (
    is_super_admin() OR is_staff()
  ) WITH CHECK (
    is_super_admin()
    OR (is_staff() AND tenant_id = get_current_tenant_id())
  );

-- ---- EVENTS ----
DROP POLICY IF EXISTS "View approved events" ON events;
DROP POLICY IF EXISTS "Staff can manage events" ON events;

CREATE POLICY "events_select" ON events
  FOR SELECT USING (
    is_super_admin()
    OR (
      tenant_id = get_current_tenant_id()
      AND (
        visibility = 'public'
        OR visibility = 'all_members'
        OR (visibility = 'segment' AND has_any_tag(visibility_tags))
        OR created_by = get_current_member_id()
      )
    )
  );

CREATE POLICY "events_manage" ON events
  FOR ALL USING (
    is_super_admin() OR is_staff()
  ) WITH CHECK (
    is_super_admin()
    OR (is_staff() AND tenant_id = get_current_tenant_id())
  );

-- ---- EVENT_RSVPS ----
DROP POLICY IF EXISTS "event_rsvps_select" ON event_rsvps;
DROP POLICY IF EXISTS "event_rsvps_manage" ON event_rsvps;

CREATE POLICY "event_rsvps_select" ON event_rsvps
  FOR SELECT USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY "event_rsvps_manage" ON event_rsvps
  FOR ALL USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND member_id = get_current_member_id())
    OR is_staff()
  );

-- ---- VIDEOS ----
DROP POLICY IF EXISTS "View authorized videos" ON videos;
DROP POLICY IF EXISTS "Staff can manage videos" ON videos;

CREATE POLICY "videos_select" ON videos
  FOR SELECT USING (
    is_super_admin()
    OR (
      tenant_id = get_current_tenant_id()
      AND (
        is_staff()
        OR (
          has_active_subscription()
          AND (
            visibility = 'all_members'
            OR (visibility = 'segment' AND has_any_tag(visibility_tags))
          )
        )
      )
    )
  );

CREATE POLICY "videos_manage" ON videos
  FOR ALL USING (
    is_super_admin() OR is_staff()
  ) WITH CHECK (
    is_super_admin()
    OR (is_staff() AND tenant_id = get_current_tenant_id())
  );

-- ---- VIDEO_PROGRESS ----
DROP POLICY IF EXISTS "video_progress_select" ON video_progress;
DROP POLICY IF EXISTS "video_progress_manage" ON video_progress;

CREATE POLICY "video_progress_select" ON video_progress
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND member_id = get_current_member_id())
  );

CREATE POLICY "video_progress_manage" ON video_progress
  FOR ALL USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND member_id = get_current_member_id())
  );

-- ---- CHANNELS ----
DROP POLICY IF EXISTS "channels_select" ON channels;
DROP POLICY IF EXISTS "channels_manage" ON channels;

CREATE POLICY "channels_select" ON channels
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "channels_manage" ON channels
  FOR ALL USING (
    is_super_admin() OR is_staff()
  ) WITH CHECK (
    is_super_admin()
    OR (is_staff() AND tenant_id = get_current_tenant_id())
  );

-- ---- MESSAGES ----
DROP POLICY IF EXISTS "View channel messages" ON messages;
DROP POLICY IF EXISTS "Send channel messages" ON messages;

CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND (has_active_subscription() OR is_staff()))
  );

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    is_super_admin()
    OR (
      tenant_id = get_current_tenant_id()
      AND sender_id = get_current_member_id()
      AND (has_active_subscription() OR is_staff())
    )
  );

-- ---- DIRECT MESSAGES ----
DROP POLICY IF EXISTS "View own DMs" ON direct_messages;
DROP POLICY IF EXISTS "Send DMs" ON direct_messages;

CREATE POLICY "dms_select" ON direct_messages
  FOR SELECT USING (
    is_super_admin()
    OR (
      tenant_id = get_current_tenant_id()
      AND (sender_id = get_current_member_id() OR recipient_id = get_current_member_id())
    )
  );

CREATE POLICY "dms_insert" ON direct_messages
  FOR INSERT WITH CHECK (
    is_super_admin()
    OR (
      tenant_id = get_current_tenant_id()
      AND sender_id = get_current_member_id()
    )
  );

-- ---- ANNOUNCEMENTS ----
DROP POLICY IF EXISTS "announcements_select" ON announcements;
DROP POLICY IF EXISTS "announcements_manage" ON announcements;

CREATE POLICY "announcements_select" ON announcements
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "announcements_manage" ON announcements
  FOR ALL USING (
    is_super_admin() OR is_staff()
  ) WITH CHECK (
    is_super_admin()
    OR (is_staff() AND tenant_id = get_current_tenant_id())
  );

-- ---- TAGS ----
DROP POLICY IF EXISTS "tags_select" ON tags;
DROP POLICY IF EXISTS "tags_manage" ON tags;

CREATE POLICY "tags_select" ON tags
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "tags_manage" ON tags
  FOR ALL USING (
    is_super_admin() OR is_staff()
  ) WITH CHECK (
    is_super_admin()
    OR (is_staff() AND tenant_id = get_current_tenant_id())
  );

-- ---- MEMBER_TAGS ----
DROP POLICY IF EXISTS "member_tags_select" ON member_tags;
DROP POLICY IF EXISTS "member_tags_manage" ON member_tags;

CREATE POLICY "member_tags_select" ON member_tags
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "member_tags_manage" ON member_tags
  FOR ALL USING (
    is_super_admin() OR is_staff()
  ) WITH CHECK (
    is_super_admin()
    OR (is_staff() AND tenant_id = get_current_tenant_id())
  );

-- ---- MEMBER_ROLES ----
DROP POLICY IF EXISTS "member_roles_select" ON member_roles;
DROP POLICY IF EXISTS "member_roles_manage" ON member_roles;

CREATE POLICY "member_roles_select" ON member_roles
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "member_roles_manage" ON member_roles
  FOR ALL USING (
    is_super_admin() OR is_staff()
  ) WITH CHECK (
    is_super_admin()
    OR (is_staff() AND tenant_id = get_current_tenant_id())
  );

-- ---- DOCUMENTS ----
DROP POLICY IF EXISTS "documents_select" ON documents;
DROP POLICY IF EXISTS "documents_manage" ON documents;

CREATE POLICY "documents_select" ON documents
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "documents_manage" ON documents
  FOR ALL USING (
    is_super_admin() OR is_staff()
  ) WITH CHECK (
    is_super_admin()
    OR (is_staff() AND tenant_id = get_current_tenant_id())
  );

-- ---- REFERRALS ----
DROP POLICY IF EXISTS "referrals_select" ON referrals;
DROP POLICY IF EXISTS "referrals_manage" ON referrals;

CREATE POLICY "referrals_select" ON referrals
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "referrals_manage" ON referrals
  FOR ALL USING (
    is_super_admin() OR is_staff()
  );

-- ---- MEMBER_CREDITS ----
DROP POLICY IF EXISTS "member_credits_select" ON member_credits;
DROP POLICY IF EXISTS "member_credits_manage" ON member_credits;

CREATE POLICY "member_credits_select" ON member_credits
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND member_id = get_current_member_id())
    OR is_staff()
  );

CREATE POLICY "member_credits_manage" ON member_credits
  FOR ALL USING (
    is_super_admin() OR is_staff()
  );

-- ---- SCHEDULE_SLOTS ----
DROP POLICY IF EXISTS "schedule_slots_select" ON schedule_slots;
DROP POLICY IF EXISTS "schedule_slots_manage" ON schedule_slots;

CREATE POLICY "schedule_slots_select" ON schedule_slots
  FOR SELECT USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY "schedule_slots_manage" ON schedule_slots
  FOR ALL USING (
    is_super_admin() OR is_staff()
  ) WITH CHECK (
    is_super_admin()
    OR (is_staff() AND tenant_id = get_current_tenant_id())
  );

-- ---- BOOKINGS ----
DROP POLICY IF EXISTS "bookings_select" ON bookings;
DROP POLICY IF EXISTS "bookings_manage" ON bookings;

CREATE POLICY "bookings_select" ON bookings
  FOR SELECT USING (
    is_super_admin()
    OR (
      tenant_id = get_current_tenant_id()
      AND (
        student_id = get_current_member_id()
        OR instructor_id = get_current_member_id()
        OR is_staff()
      )
    )
  );

CREATE POLICY "bookings_manage" ON bookings
  FOR ALL USING (
    is_super_admin()
    OR (
      tenant_id = get_current_tenant_id()
      AND (
        student_id = get_current_member_id()
        OR instructor_id = get_current_member_id()
        OR is_staff()
      )
    )
  );

-- ---- ROLES ----
-- Roles table is tenant-scoped (each studio can have custom roles in future)
DROP POLICY IF EXISTS "roles_select" ON roles;

CREATE POLICY "roles_select" ON roles
  FOR SELECT USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY "roles_manage" ON roles
  FOR ALL USING (
    is_super_admin()
  );

-- ---- EVENT_SERIES ----
CREATE POLICY "event_series_select" ON event_series
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "event_series_manage" ON event_series
  FOR ALL USING (
    is_super_admin() OR is_staff()
  ) WITH CHECK (
    is_super_admin()
    OR (is_staff() AND tenant_id = get_current_tenant_id())
  );

-- ---- VIDEO_TAGS ----
CREATE POLICY "video_tags_select" ON video_tags
  FOR SELECT USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY "video_tags_manage" ON video_tags
  FOR ALL USING (
    is_super_admin() OR is_staff()
  ) WITH CHECK (
    is_super_admin()
    OR (is_staff() AND tenant_id = get_current_tenant_id())
  );

-- ---- ANALYTICS_EVENTS ----
CREATE POLICY "analytics_events_select" ON analytics_events
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND is_staff())
  );

CREATE POLICY "analytics_events_insert" ON analytics_events
  FOR INSERT WITH CHECK (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );
```

**Step 2: Commit**

```bash
git add app/supabase/migrations/20260222100001_multi_tenant_rls.sql
git commit -m "feat(mt): replace all RLS policies with tenant-scoped versions"
```

---

### Task 1.5: Seed the 10 starter themes

**Files:**
- Create: `app/supabase/migrations/20260222100002_seed_themes.sql`

**Step 1: Write the theme seed data**

```sql
-- =============================================
-- Seed 10 starter themes
-- =============================================

INSERT INTO themes (name, slug, description, sort_order, config) VALUES

('Fuego', 'fuego', 'Bold and energetic — the original Salsa Ninja vibe', 1, '{
  "colors": {
    "background": "#0f0f0f",
    "foreground": "#ffffff",
    "primary": "#ef4444",
    "primary-foreground": "#ffffff",
    "secondary": "#1a1a1a",
    "secondary-foreground": "#ffffff",
    "accent": "#222222",
    "accent-foreground": "#ffffff",
    "muted": "#2a2a2a",
    "muted-foreground": "rgba(255,255,255,0.5)",
    "card": "#1a1a1a",
    "card-foreground": "#ffffff",
    "popover": "#1a1a1a",
    "popover-foreground": "#ffffff",
    "destructive": "#dc2626",
    "border": "rgba(255,255,255,0.06)",
    "input": "rgba(255,255,255,0.08)",
    "ring": "#ef4444",
    "sidebar": "#111111",
    "sidebar-foreground": "#ffffff",
    "sidebar-primary": "#ef4444",
    "sidebar-primary-foreground": "#ffffff",
    "sidebar-accent": "#222222",
    "sidebar-accent-foreground": "#ffffff",
    "sidebar-border": "rgba(255,255,255,0.06)",
    "sidebar-ring": "#ef4444",
    "chart-1": "#ef4444",
    "chart-2": "#f59e0b",
    "chart-3": "#f97316",
    "chart-4": "#fbbf24",
    "chart-5": "#fb923c"
  },
  "fonts": { "heading": "Inter", "body": "Inter" },
  "radius": "0.625rem",
  "style": { "mode": "dark", "sidebar": "dark", "buttons": "skewed", "cards": "gradient-border" },
  "custom": {
    "gradient": "linear-gradient(135deg, #ef4444, #f59e0b)",
    "gradient-h": "linear-gradient(135deg, #f59e0b, #ef4444)",
    "shadow-glow": "0 0 40px rgba(239,68,68,0.3)"
  }
}'::jsonb),

('Midnight Club', 'midnight-club', 'Dark and upscale nightlife atmosphere', 2, '{
  "colors": {
    "background": "#0c0a1a",
    "foreground": "#f0eef5",
    "primary": "#7c3aed",
    "primary-foreground": "#ffffff",
    "secondary": "#1a1730",
    "secondary-foreground": "#f0eef5",
    "accent": "#231f3a",
    "accent-foreground": "#f0eef5",
    "muted": "#2a2545",
    "muted-foreground": "rgba(240,238,245,0.5)",
    "card": "#1a1730",
    "card-foreground": "#f0eef5",
    "popover": "#1a1730",
    "popover-foreground": "#f0eef5",
    "destructive": "#dc2626",
    "border": "rgba(124,58,237,0.12)",
    "input": "rgba(124,58,237,0.1)",
    "ring": "#7c3aed",
    "sidebar": "#0c0a1a",
    "sidebar-foreground": "#f0eef5",
    "sidebar-primary": "#7c3aed",
    "sidebar-primary-foreground": "#ffffff",
    "sidebar-accent": "#231f3a",
    "sidebar-accent-foreground": "#f0eef5",
    "sidebar-border": "rgba(124,58,237,0.12)",
    "sidebar-ring": "#7c3aed",
    "chart-1": "#7c3aed",
    "chart-2": "#eab308",
    "chart-3": "#a855f7",
    "chart-4": "#facc15",
    "chart-5": "#c084fc"
  },
  "fonts": { "heading": "Inter", "body": "Inter" },
  "radius": "0.75rem",
  "style": { "mode": "dark", "sidebar": "dark", "buttons": "rounded", "cards": "shadow" }
}'::jsonb),

('Tropical Heat', 'tropical-heat', 'Caribbean warmth with coral and teal', 3, '{
  "colors": {
    "background": "#fefcfb",
    "foreground": "#1a1a1a",
    "primary": "#f97316",
    "primary-foreground": "#ffffff",
    "secondary": "#f0fdfa",
    "secondary-foreground": "#1a1a1a",
    "accent": "#ccfbf1",
    "accent-foreground": "#1a1a1a",
    "muted": "#f5f5f4",
    "muted-foreground": "#78716c",
    "card": "#ffffff",
    "card-foreground": "#1a1a1a",
    "popover": "#ffffff",
    "popover-foreground": "#1a1a1a",
    "destructive": "#dc2626",
    "border": "#e7e5e4",
    "input": "#e7e5e4",
    "ring": "#f97316",
    "sidebar": "#fff7ed",
    "sidebar-foreground": "#1a1a1a",
    "sidebar-primary": "#f97316",
    "sidebar-primary-foreground": "#ffffff",
    "sidebar-accent": "#fed7aa",
    "sidebar-accent-foreground": "#1a1a1a",
    "sidebar-border": "#e7e5e4",
    "sidebar-ring": "#f97316",
    "chart-1": "#f97316",
    "chart-2": "#14b8a6",
    "chart-3": "#fb923c",
    "chart-4": "#2dd4bf",
    "chart-5": "#fdba74"
  },
  "fonts": { "heading": "Inter", "body": "Inter" },
  "radius": "1rem",
  "style": { "mode": "light", "sidebar": "light", "buttons": "rounded", "cards": "shadow" }
}'::jsonb),

('Urban Groove', 'urban-groove', 'Street dance and hip-hop energy', 4, '{
  "colors": {
    "background": "#0f172a",
    "foreground": "#e2e8f0",
    "primary": "#475569",
    "primary-foreground": "#ffffff",
    "secondary": "#1e293b",
    "secondary-foreground": "#e2e8f0",
    "accent": "#334155",
    "accent-foreground": "#e2e8f0",
    "muted": "#1e293b",
    "muted-foreground": "#94a3b8",
    "card": "#1e293b",
    "card-foreground": "#e2e8f0",
    "popover": "#1e293b",
    "popover-foreground": "#e2e8f0",
    "destructive": "#dc2626",
    "border": "rgba(148,163,184,0.1)",
    "input": "rgba(148,163,184,0.1)",
    "ring": "#84cc16",
    "sidebar": "#0f172a",
    "sidebar-foreground": "#e2e8f0",
    "sidebar-primary": "#84cc16",
    "sidebar-primary-foreground": "#0f172a",
    "sidebar-accent": "#334155",
    "sidebar-accent-foreground": "#e2e8f0",
    "sidebar-border": "rgba(148,163,184,0.1)",
    "sidebar-ring": "#84cc16",
    "chart-1": "#84cc16",
    "chart-2": "#475569",
    "chart-3": "#a3e635",
    "chart-4": "#64748b",
    "chart-5": "#bef264"
  },
  "fonts": { "heading": "Inter", "body": "Inter" },
  "radius": "0.25rem",
  "style": { "mode": "dark", "sidebar": "dark", "buttons": "sharp", "cards": "flat" }
}'::jsonb),

('Elegante', 'elegante', 'Ballroom sophistication with navy and rose gold', 5, '{
  "colors": {
    "background": "#faf9f7",
    "foreground": "#1e3a5f",
    "primary": "#1e3a5f",
    "primary-foreground": "#ffffff",
    "secondary": "#f5f0eb",
    "secondary-foreground": "#1e3a5f",
    "accent": "#e8d5c4",
    "accent-foreground": "#1e3a5f",
    "muted": "#f5f0eb",
    "muted-foreground": "#6b7280",
    "card": "#ffffff",
    "card-foreground": "#1e3a5f",
    "popover": "#ffffff",
    "popover-foreground": "#1e3a5f",
    "destructive": "#dc2626",
    "border": "#e5ddd4",
    "input": "#e5ddd4",
    "ring": "#e8a87c",
    "sidebar": "#1e3a5f",
    "sidebar-foreground": "#f5f0eb",
    "sidebar-primary": "#e8a87c",
    "sidebar-primary-foreground": "#1e3a5f",
    "sidebar-accent": "#2a4a72",
    "sidebar-accent-foreground": "#f5f0eb",
    "sidebar-border": "rgba(232,168,124,0.2)",
    "sidebar-ring": "#e8a87c",
    "chart-1": "#1e3a5f",
    "chart-2": "#e8a87c",
    "chart-3": "#2a4a72",
    "chart-4": "#d4956a",
    "chart-5": "#3a5a82"
  },
  "fonts": { "heading": "Georgia", "body": "Inter" },
  "radius": "0.5rem",
  "style": { "mode": "light", "sidebar": "dark", "buttons": "rounded", "cards": "subtle-shadow" }
}'::jsonb),

('Neon Nights', 'neon-nights', 'Modern club with neon glows', 6, '{
  "colors": {
    "background": "#09090b",
    "foreground": "#fafafa",
    "primary": "#ec4899",
    "primary-foreground": "#ffffff",
    "secondary": "#18181b",
    "secondary-foreground": "#fafafa",
    "accent": "#27272a",
    "accent-foreground": "#fafafa",
    "muted": "#27272a",
    "muted-foreground": "rgba(250,250,250,0.5)",
    "card": "#18181b",
    "card-foreground": "#fafafa",
    "popover": "#18181b",
    "popover-foreground": "#fafafa",
    "destructive": "#dc2626",
    "border": "rgba(236,72,153,0.15)",
    "input": "rgba(236,72,153,0.1)",
    "ring": "#ec4899",
    "sidebar": "#09090b",
    "sidebar-foreground": "#fafafa",
    "sidebar-primary": "#ec4899",
    "sidebar-primary-foreground": "#ffffff",
    "sidebar-accent": "#27272a",
    "sidebar-accent-foreground": "#fafafa",
    "sidebar-border": "rgba(236,72,153,0.15)",
    "sidebar-ring": "#ec4899",
    "chart-1": "#ec4899",
    "chart-2": "#06b6d4",
    "chart-3": "#f472b6",
    "chart-4": "#22d3ee",
    "chart-5": "#fb7185"
  },
  "fonts": { "heading": "Inter", "body": "Inter" },
  "radius": "0.75rem",
  "style": { "mode": "dark", "sidebar": "dark", "buttons": "rounded", "cards": "neon-border" }
}'::jsonb),

('Earth & Rhythm', 'earth-rhythm', 'Afro-Latin organic warmth', 7, '{
  "colors": {
    "background": "#faf6f1",
    "foreground": "#292524",
    "primary": "#c2410c",
    "primary-foreground": "#ffffff",
    "secondary": "#f5f0eb",
    "secondary-foreground": "#292524",
    "accent": "#e7ddd0",
    "accent-foreground": "#292524",
    "muted": "#f5f0eb",
    "muted-foreground": "#78716c",
    "card": "#ffffff",
    "card-foreground": "#292524",
    "popover": "#ffffff",
    "popover-foreground": "#292524",
    "destructive": "#dc2626",
    "border": "#e7e0d8",
    "input": "#e7e0d8",
    "ring": "#c2410c",
    "sidebar": "#292524",
    "sidebar-foreground": "#faf6f1",
    "sidebar-primary": "#c2410c",
    "sidebar-primary-foreground": "#ffffff",
    "sidebar-accent": "#3a3533",
    "sidebar-accent-foreground": "#faf6f1",
    "sidebar-border": "rgba(194,65,12,0.15)",
    "sidebar-ring": "#c2410c",
    "chart-1": "#c2410c",
    "chart-2": "#65a30d",
    "chart-3": "#ea580c",
    "chart-4": "#84cc16",
    "chart-5": "#d97706"
  },
  "fonts": { "heading": "Georgia", "body": "Inter" },
  "radius": "0.75rem",
  "style": { "mode": "light", "sidebar": "dark", "buttons": "rounded", "cards": "warm-shadow" }
}'::jsonb),

('Ocean Breeze', 'ocean-breeze', 'Beach resort with ocean blue and sand', 8, '{
  "colors": {
    "background": "#f8fafc",
    "foreground": "#0f172a",
    "primary": "#0284c7",
    "primary-foreground": "#ffffff",
    "secondary": "#f0f9ff",
    "secondary-foreground": "#0f172a",
    "accent": "#e0f2fe",
    "accent-foreground": "#0f172a",
    "muted": "#f1f5f9",
    "muted-foreground": "#64748b",
    "card": "#ffffff",
    "card-foreground": "#0f172a",
    "popover": "#ffffff",
    "popover-foreground": "#0f172a",
    "destructive": "#dc2626",
    "border": "#e2e8f0",
    "input": "#e2e8f0",
    "ring": "#0284c7",
    "sidebar": "#0c4a6e",
    "sidebar-foreground": "#f0f9ff",
    "sidebar-primary": "#38bdf8",
    "sidebar-primary-foreground": "#0c4a6e",
    "sidebar-accent": "#0e5a84",
    "sidebar-accent-foreground": "#f0f9ff",
    "sidebar-border": "rgba(56,189,248,0.15)",
    "sidebar-ring": "#38bdf8",
    "chart-1": "#0284c7",
    "chart-2": "#d4a574",
    "chart-3": "#0ea5e9",
    "chart-4": "#c2956a",
    "chart-5": "#38bdf8"
  },
  "fonts": { "heading": "Inter", "body": "Inter" },
  "radius": "0.75rem",
  "style": { "mode": "light", "sidebar": "dark", "buttons": "rounded", "cards": "shadow" }
}'::jsonb),

('Minimalist', 'minimalist', 'Clean and modern monochrome studio', 9, '{
  "colors": {
    "background": "#ffffff",
    "foreground": "#18181b",
    "primary": "#18181b",
    "primary-foreground": "#fafafa",
    "secondary": "#f4f4f5",
    "secondary-foreground": "#18181b",
    "accent": "#f4f4f5",
    "accent-foreground": "#18181b",
    "muted": "#f4f4f5",
    "muted-foreground": "#71717a",
    "card": "#ffffff",
    "card-foreground": "#18181b",
    "popover": "#ffffff",
    "popover-foreground": "#18181b",
    "destructive": "#dc2626",
    "border": "#e4e4e7",
    "input": "#e4e4e7",
    "ring": "#18181b",
    "sidebar": "#fafafa",
    "sidebar-foreground": "#18181b",
    "sidebar-primary": "#18181b",
    "sidebar-primary-foreground": "#fafafa",
    "sidebar-accent": "#f4f4f5",
    "sidebar-accent-foreground": "#18181b",
    "sidebar-border": "#e4e4e7",
    "sidebar-ring": "#18181b",
    "chart-1": "#18181b",
    "chart-2": "#71717a",
    "chart-3": "#3f3f46",
    "chart-4": "#a1a1aa",
    "chart-5": "#52525b"
  },
  "fonts": { "heading": "Inter", "body": "Inter" },
  "radius": "0.375rem",
  "style": { "mode": "light", "sidebar": "light", "buttons": "rounded", "cards": "subtle-border" }
}'::jsonb),

('Festival', 'festival', 'Bright carnival energy with magenta and yellow', 10, '{
  "colors": {
    "background": "#fefce8",
    "foreground": "#1c1917",
    "primary": "#d946ef",
    "primary-foreground": "#ffffff",
    "secondary": "#fef9c3",
    "secondary-foreground": "#1c1917",
    "accent": "#fde68a",
    "accent-foreground": "#1c1917",
    "muted": "#fef9c3",
    "muted-foreground": "#78716c",
    "card": "#fffbeb",
    "card-foreground": "#1c1917",
    "popover": "#fffbeb",
    "popover-foreground": "#1c1917",
    "destructive": "#dc2626",
    "border": "#fde68a",
    "input": "#fde68a",
    "ring": "#d946ef",
    "sidebar": "#4a044e",
    "sidebar-foreground": "#fae8ff",
    "sidebar-primary": "#e879f9",
    "sidebar-primary-foreground": "#4a044e",
    "sidebar-accent": "#5b105f",
    "sidebar-accent-foreground": "#fae8ff",
    "sidebar-border": "rgba(232,121,249,0.2)",
    "sidebar-ring": "#e879f9",
    "chart-1": "#d946ef",
    "chart-2": "#facc15",
    "chart-3": "#e879f9",
    "chart-4": "#fde047",
    "chart-5": "#f0abfc"
  },
  "fonts": { "heading": "Inter", "body": "Inter" },
  "radius": "1rem",
  "style": { "mode": "light", "sidebar": "dark", "buttons": "rounded", "cards": "playful-shadow" }
}'::jsonb);
```

**Step 2: Commit**

```bash
git add app/supabase/migrations/20260222100002_seed_themes.sql
git commit -m "feat(mt): seed 10 starter themes with full JSONB configs"
```

---

### Task 1.6: Update the member_profiles view

**Files:**
- Append to: `app/supabase/migrations/20260222100001_multi_tenant_rls.sql`

**Step 1: Recreate the member_profiles view to include tenant_id**

The existing `member_profiles` view needs to expose `tenant_id` so downstream queries work:

```sql
-- Recreate member_profiles view with tenant_id
CREATE OR REPLACE VIEW member_profiles AS
SELECT
  m.id,
  m.user_id,
  m.tenant_id,
  m.email,
  m.full_name,
  m.display_name,
  m.avatar_url,
  m.phone,
  m.bio,
  m.dance_experience,
  m.preferred_language,
  m.stripe_customer_id,
  m.subscription_tier,
  m.subscription_status,
  m.subscription_id,
  m.subscription_expires_at,
  m.referral_code,
  m.referred_by,
  m.enrollment_plan,
  m.bootcamp_enrolled,
  m.last_login_at,
  m.created_at,
  m.updated_at,
  COALESCE(
    array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL),
    ARRAY[]::TEXT[]
  ) AS all_roles
FROM members m
LEFT JOIN member_roles mr ON m.id = mr.member_id
LEFT JOIN roles r ON mr.role_id = r.id
GROUP BY m.id;
```

**Step 2: Commit**

```bash
git add app/supabase/migrations/20260222100001_multi_tenant_rls.sql
git commit -m "feat(mt): update member_profiles view with tenant_id"
```

---

## WS2: Middleware & Tenant Context

**Agent:** `middleware-engineer`
**Branch:** `mt/ws2-middleware-tenant-context`
**Depends on:** WS1 merged to master

### Task 2.1: Create tenant resolution utility

**Files:**
- Create: `app/src/lib/tenant/resolve.ts`

**Step 1: Write the tenant resolution logic**

```typescript
import { createClient } from '@supabase/supabase-js'

export interface TenantInfo {
  id: string
  name: string
  slug: string
  custom_domain: string | null
  theme_id: string | null
  status: string
  settings: Record<string, unknown>
}

// In-memory cache for tenant lookups (per-process, cleared on redeploy)
const tenantCache = new Map<string, { tenant: TenantInfo | null; expires: number }>()
const CACHE_TTL_MS = 60_000 // 1 minute

function getCachedTenant(key: string): TenantInfo | null | undefined {
  const entry = tenantCache.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expires) {
    tenantCache.delete(key)
    return undefined
  }
  return entry.tenant
}

function setCachedTenant(key: string, tenant: TenantInfo | null) {
  tenantCache.set(key, { tenant, expires: Date.now() + CACHE_TTL_MS })
}

/**
 * Resolve tenant from hostname.
 * Uses service role client (no RLS) since this runs before auth.
 */
export async function resolveTenantFromHostname(hostname: string): Promise<TenantInfo | null> {
  const cached = getCachedTenant(hostname)
  if (cached !== undefined) return cached

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Check custom domain first
  const { data: byDomain } = await supabase
    .from('tenants')
    .select('id, name, slug, custom_domain, theme_id, status, settings')
    .eq('custom_domain', hostname)
    .eq('status', 'active')
    .single()

  if (byDomain) {
    setCachedTenant(hostname, byDomain)
    return byDomain
  }

  // Parse subdomain from hostname
  const slug = parseSubdomain(hostname)
  if (!slug) {
    setCachedTenant(hostname, null)
    return null
  }

  const { data: bySlug } = await supabase
    .from('tenants')
    .select('id, name, slug, custom_domain, theme_id, status, settings')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  setCachedTenant(hostname, bySlug)
  return bySlug
}

/**
 * Parse subdomain from hostname.
 * e.g. "salsa-ninja.dancestudio.com" -> "salsa-ninja"
 * e.g. "localhost:3000" -> null (use query param fallback)
 */
export function parseSubdomain(hostname: string): string | null {
  // Remove port
  const host = hostname.split(':')[0]

  // localhost: no subdomain parsing
  if (host === 'localhost' || host === '127.0.0.1') return null

  // e.g. salsa-ninja.localhost -> salsa-ninja
  if (host.endsWith('.localhost')) {
    return host.replace('.localhost', '')
  }

  const parts = host.split('.')
  // Need at least 3 parts: subdomain.domain.tld
  if (parts.length < 3) return null

  const subdomain = parts[0]

  // Skip "www" and "admin" subdomains
  if (subdomain === 'www') return null
  if (subdomain === 'admin') return null

  return subdomain
}

/**
 * Check if this hostname is the super admin domain.
 */
export function isSuperAdminDomain(hostname: string): boolean {
  const host = hostname.split(':')[0]
  if (host === 'admin.localhost') return true
  const parts = host.split('.')
  return parts[0] === 'admin'
}

/**
 * Check if this hostname is the root/marketing domain.
 */
export function isRootDomain(hostname: string): boolean {
  const host = hostname.split(':')[0]
  if (host === 'localhost') return true
  const parts = host.split('.')
  // domain.tld or www.domain.tld
  return parts.length <= 2 || (parts.length === 3 && parts[0] === 'www')
}
```

**Step 2: Commit**

```bash
git add app/src/lib/tenant/resolve.ts
git commit -m "feat(mt): add tenant resolution utility with caching"
```

---

### Task 2.2: Update Supabase middleware for tenant context

**Files:**
- Modify: `app/src/lib/supabase/middleware.ts`

**Step 1: Rewrite the session middleware to set tenant context**

Replace the entire content of `app/src/lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { resolveTenantFromHostname, isSuperAdminDomain, isRootDomain } from '@/lib/tenant/resolve'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const hostname = request.headers.get('host') || 'localhost'
  const pathname = request.nextUrl.pathname

  // --- Root domain: marketing site, no tenant context ---
  if (isRootDomain(hostname)) {
    // Root domain pages are always public
    return supabaseResponse
  }

  // --- Super admin domain ---
  if (isSuperAdminDomain(hostname)) {
    const superAdminPublicRoutes = ['/login', '/auth/callback']
    const isPublic = superAdminPublicRoutes.some(r => pathname.startsWith(r))

    if (!user && !isPublic) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // Set super admin flag in headers
    supabaseResponse.headers.set('x-super-admin', 'true')
    return supabaseResponse
  }

  // --- Tenant domain: resolve tenant ---
  // Check query param for local dev fallback
  const tenantSlugParam = request.nextUrl.searchParams.get('tenant')
  let tenantId: string | null = null
  let tenantSlug: string | null = null

  if (tenantSlugParam && hostname.split(':')[0] === 'localhost') {
    // Local dev: resolve by query param
    const tenant = await resolveTenantFromHostname(`${tenantSlugParam}.localhost`)
    if (tenant) {
      tenantId = tenant.id
      tenantSlug = tenant.slug
      supabaseResponse.headers.set('x-tenant-id', tenant.id)
      supabaseResponse.headers.set('x-tenant-slug', tenant.slug)
      supabaseResponse.headers.set('x-tenant-name', tenant.name)
      if (tenant.theme_id) supabaseResponse.headers.set('x-tenant-theme-id', tenant.theme_id)
    }
  } else {
    const tenant = await resolveTenantFromHostname(hostname)
    if (!tenant) {
      // Unknown subdomain/domain — show 404 or redirect to root
      const url = request.nextUrl.clone()
      url.hostname = hostname.split('.').slice(-2).join('.')
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    tenantId = tenant.id
    tenantSlug = tenant.slug
    supabaseResponse.headers.set('x-tenant-id', tenant.id)
    supabaseResponse.headers.set('x-tenant-slug', tenant.slug)
    supabaseResponse.headers.set('x-tenant-name', tenant.name)
    if (tenant.theme_id) supabaseResponse.headers.set('x-tenant-theme-id', tenant.theme_id)
  }

  if (!tenantId) {
    // Could not resolve tenant
    return supabaseResponse
  }

  // Public routes (no auth required)
  const publicRoutes = ['/', '/about', '/pricing', '/schedule', '/contact', '/login', '/join',
    '/private-sessions', '/events', '/bootcamp', '/shoes', '/roadmap']
  const isAuthCallback = pathname.startsWith('/auth/callback')
  const isApiRoute = pathname.startsWith('/api/')
  const isPublic = publicRoutes.includes(pathname) || isAuthCallback || isApiRoute

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

**Step 2: Commit**

```bash
git add app/src/lib/supabase/middleware.ts
git commit -m "feat(mt): rewrite middleware with tenant resolution and subdomain routing"
```

---

### Task 2.3: Update Supabase server client to set tenant context

**Files:**
- Modify: `app/src/lib/supabase/server.ts`

**Step 1: Add tenant context to server client**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  const headerStore = await headers()

  const tenantId = headerStore.get('x-tenant-id')

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll can fail in Server Components (read-only cookies)
          }
        },
      },
    }
  )

  // Set tenant context as Postgres session variable for RLS
  if (tenantId) {
    await client.rpc('set_tenant_context', { tenant_id: tenantId })
  }

  return client
}
```

**Step 2: Add the set_tenant_context RPC function**

Create a migration (or add to WS1 migration):

```sql
-- RPC function to set tenant context for the current session
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Step 3: Commit**

```bash
git add app/src/lib/supabase/server.ts
git commit -m "feat(mt): update server client to set tenant context via RPC"
```

---

### Task 2.4: Create TenantProvider React context

**Files:**
- Create: `app/src/lib/tenant/context.tsx`
- Create: `app/src/lib/tenant/types.ts`

**Step 1: Write the types**

```typescript
// app/src/lib/tenant/types.ts
export interface Tenant {
  id: string
  name: string
  slug: string
  custom_domain: string | null
  theme_id: string | null
  status: string
  settings: Record<string, unknown>
}

export interface ThemeConfig {
  colors: Record<string, string>
  fonts: { heading: string; body: string }
  radius: string
  style: Record<string, string>
  custom?: Record<string, string>
}
```

**Step 2: Write the context provider**

```typescript
// app/src/lib/tenant/context.tsx
'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Tenant, ThemeConfig } from './types'

interface TenantContextValue {
  tenant: Tenant | null
  theme: ThemeConfig | null
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  theme: null,
})

export function TenantProvider({
  tenant,
  theme,
  children,
}: {
  tenant: Tenant | null
  theme: ThemeConfig | null
  children: ReactNode
}) {
  return (
    <TenantContext.Provider value={{ tenant, theme }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  return useContext(TenantContext)
}
```

**Step 3: Commit**

```bash
git add app/src/lib/tenant/types.ts app/src/lib/tenant/context.tsx
git commit -m "feat(mt): add TenantProvider context and types"
```

---

### Task 2.5: Create getTenantFromHeaders server utility

**Files:**
- Create: `app/src/lib/tenant/server.ts`

**Step 1: Write the server-side tenant helper**

```typescript
// app/src/lib/tenant/server.ts
import { headers } from 'next/headers'
import { createServiceRoleClient } from '@/lib/supabase/service'
import type { Tenant, ThemeConfig } from './types'

export async function getTenantFromHeaders(): Promise<Tenant | null> {
  const headerStore = await headers()
  const id = headerStore.get('x-tenant-id')
  const slug = headerStore.get('x-tenant-slug')
  const name = headerStore.get('x-tenant-name')
  const themeId = headerStore.get('x-tenant-theme-id')

  if (!id || !slug || !name) return null

  return {
    id,
    name,
    slug,
    custom_domain: null,
    theme_id: themeId,
    status: 'active',
    settings: {},
  }
}

export async function getThemeConfig(themeId: string | null): Promise<ThemeConfig | null> {
  if (!themeId) return null

  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('themes')
    .select('config')
    .eq('id', themeId)
    .single()

  return data?.config as ThemeConfig | null
}
```

**Step 2: Commit**

```bash
git add app/src/lib/tenant/server.ts
git commit -m "feat(mt): add server-side tenant/theme helpers"
```

---

## WS3: Theme Library & 10 Styles

**Agent:** `theme-designer`
**Branch:** `mt/ws3-theme-library`
**Can start in parallel with WS1**

### Task 3.1: Create ThemeProvider component

**Files:**
- Create: `app/src/components/theme-provider.tsx`

**Step 1: Write the CSS variable injection component**

```typescript
'use client'

import type { ThemeConfig } from '@/lib/tenant/types'

export function ThemeStyleInjector({ config }: { config: ThemeConfig | null }) {
  if (!config) return null

  const cssVars = Object.entries(config.colors)
    .map(([key, value]) => `--${key}: ${value};`)
    .join('\n  ')

  const fontVars = config.fonts
    ? `--font-heading: '${config.fonts.heading}', sans-serif;\n  --font-body: '${config.fonts.body}', sans-serif;`
    : ''

  const radiusVar = config.radius ? `--radius: ${config.radius};` : ''

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root {\n  ${cssVars}\n  ${fontVars}\n  ${radiusVar}\n}`,
      }}
    />
  )
}
```

**Step 2: Commit**

```bash
git add app/src/components/theme-provider.tsx
git commit -m "feat(mt): add ThemeStyleInjector component for CSS variable injection"
```

---

### Task 3.2: Refactor globals.css for theme variable defaults

**Files:**
- Modify: `app/src/app/globals.css`

**Step 1: Replace hardcoded hex values in `:root` with comments marking them as theme defaults**

The `:root` block already uses CSS variables. The key change is:
- Keep the current values as **fallback defaults** (they're the Fuego theme)
- Ensure the `ThemeStyleInjector` can override them
- Replace any remaining hardcoded hex values in the rest of the file with `var()` references

Key hardcoded values to replace throughout the file:
- `#ef4444` → `var(--primary)` or `var(--red)`
- `#f59e0b` → `var(--primary-light)` or `var(--orange)`
- `#dc2626` → `var(--primary-dark)` or `var(--red-dark)`
- `rgba(239, 68, 68, ...)` → `var(--primary)` with opacity utilities
- `#0f0f0f` → `var(--background)`
- `#ffffff` → `var(--foreground)` or `var(--light)`
- `#111111` → `var(--dark)` or `var(--sidebar)`
- `#1a1a1a` → `var(--dark-2)` or `var(--card)`

This is a large but mechanical refactor. The agent should go through each CSS rule and replace raw hex values with the appropriate CSS variable.

**Step 2: Commit**

```bash
git add app/src/app/globals.css
git commit -m "refactor(mt): replace hardcoded colors with CSS variables for theme support"
```

---

### Task 3.3: Audit and fix hardcoded colors in components

**Files:**
- Search all `.tsx` files for hardcoded color values

**Step 1: Find all hardcoded colors**

Run: `cd app && grep -rn "#ef4444\|#f59e0b\|#dc2626\|#111111\|#1a1a1a\|#0f0f0f\|rgba(239" src/ --include="*.tsx" --include="*.ts"`

**Step 2: Replace with Tailwind classes or CSS variables**

For each match:
- Inline styles with hex → use `var(--primary)`, `var(--secondary)`, etc.
- Tailwind `bg-[#ef4444]` → `bg-primary`
- Tailwind `text-[#ef4444]` → `text-primary`

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor(mt): replace hardcoded color values in components with theme variables"
```

---

### Task 3.4: Build theme showcase page

**Files:**
- Create: `app/src/app/(standalone)/themes/page.tsx`

**Step 1: Build the public theme gallery page**

This page renders at the root domain `yourdomain.com/themes` showing all 10 themes in a grid with:
- Theme name and description
- Color swatches (primary, secondary, background, foreground)
- A mini preview card rendered with that theme's colors

The page fetches themes from the `themes` table (public SELECT policy allows this).

**Step 2: Commit**

```bash
git add app/src/app/\(standalone\)/themes/page.tsx
git commit -m "feat(mt): add public theme showcase page"
```

---

## WS4: Super Admin Panel

**Agent:** `admin-builder`
**Branch:** `mt/ws4-super-admin-panel`
**Depends on:** WS1 merged

### Task 4.1: Create super admin route group and layout

**Files:**
- Create: `app/src/app/(super-admin)/layout.tsx`
- Create: `app/src/app/(super-admin)/page.tsx` (dashboard)

**Step 1: Create the super admin layout**

A clean, minimal admin layout with a sidebar nav listing: Dashboard, Tenants, Themes, Admins, Billing, Settings. No tenant theming — uses a fixed admin color scheme.

**Step 2: Create the dashboard page**

Shows aggregate metrics: total tenants (by status), total students, MRR, active today, new signups (7d), and a tenant health table.

**Step 3: Commit**

```bash
git add app/src/app/\(super-admin\)/
git commit -m "feat(mt): add super admin layout and dashboard"
```

---

### Task 4.2: Create tenant CRUD pages

**Files:**
- Create: `app/src/app/(super-admin)/tenants/page.tsx` (list)
- Create: `app/src/app/(super-admin)/tenants/new/page.tsx` (create)
- Create: `app/src/app/(super-admin)/tenants/[id]/page.tsx` (detail/edit)

**Step 1: Tenant list page**

Table with: name, slug, custom domain, status, member count, theme, subscription status, created date. Filterable by status. Searchable.

**Step 2: Create tenant page**

Form: name (auto-slug), theme dropdown (with swatches), owner email. On submit: creates tenant record, creates auth user, creates member with owner role, sends magic link.

**Step 3: Tenant detail page**

Edit name, slug, custom domain, status. Change theme (with preview). View subscription. Quick stats. Suspend/archive actions.

**Step 4: Commit**

```bash
git add app/src/app/\(super-admin\)/tenants/
git commit -m "feat(mt): add tenant CRUD pages for super admin"
```

---

### Task 4.3: Create theme management pages

**Files:**
- Create: `app/src/app/(super-admin)/themes/page.tsx`
- Create: `app/src/app/(super-admin)/themes/[id]/page.tsx`

**Step 1: Theme list page**

Grid of all themes with: name, preview swatches, usage count (how many tenants), active status. "Assign to tenant" dropdown.

**Step 2: Theme edit page**

Color pickers for each token, font selectors, radius slider. Live preview pane showing a mock studio page with the selected colors.

**Step 3: Commit**

```bash
git add app/src/app/\(super-admin\)/themes/
git commit -m "feat(mt): add theme management pages for super admin"
```

---

### Task 4.4: Create admin management and auth

**Files:**
- Create: `app/src/app/(super-admin)/admins/page.tsx`
- Create: `app/src/app/(super-admin)/login/page.tsx`

**Step 1: Admin list page**

Table of super admins with: name, email, role, created date. Invite new admin button (enter email + role).

**Step 2: Super admin login page**

Simple magic link login page at `admin.yourdomain.com/login`. After auth, checks `super_admins` table — denies if not found.

**Step 3: Commit**

```bash
git add app/src/app/\(super-admin\)/admins/ app/src/app/\(super-admin\)/login/
git commit -m "feat(mt): add super admin management and login pages"
```

---

### Task 4.5: Create tenant drill-down views

**Files:**
- Create: `app/src/app/(super-admin)/tenants/[id]/members/page.tsx`
- Create: `app/src/app/(super-admin)/tenants/[id]/events/page.tsx`
- Create: `app/src/app/(super-admin)/tenants/[id]/messages/page.tsx`
- Create: `app/src/app/(super-admin)/tenants/[id]/analytics/page.tsx`

**Step 1: Implement drill-down views**

Each page queries with the tenant's ID (super admin bypass in RLS). Shows the same data the tenant owner would see but in a read-only admin wrapper.

**Step 2: Commit**

```bash
git add app/src/app/\(super-admin\)/tenants/\[id\]/
git commit -m "feat(mt): add tenant drill-down views for super admin"
```

---

## WS5: App Code Refactor

**Agent:** `app-refactorer`
**Branch:** `mt/ws5-app-refactor`
**Depends on:** WS1, WS2, WS3 merged

### Task 5.1: Update root layout with TenantProvider and ThemeProvider

**Files:**
- Modify: `app/src/app/layout.tsx`

**Step 1: Wrap the app with tenant and theme context**

```typescript
import type { Metadata } from "next"
import "./globals.css"
import { getTenantFromHeaders, getThemeConfig } from '@/lib/tenant/server'
import { TenantProvider } from '@/lib/tenant/context'
import { ThemeStyleInjector } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: "Dance Studio Platform",
  description: "Community platform for dance studios",
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const tenant = await getTenantFromHeaders()
  const theme = tenant?.theme_id ? await getThemeConfig(tenant.theme_id) : null

  return (
    <html lang="en">
      <head>
        <ThemeStyleInjector config={theme} />
      </head>
      <body>
        <TenantProvider tenant={tenant} theme={theme}>
          {children}
        </TenantProvider>
      </body>
    </html>
  )
}
```

**Step 2: Commit**

```bash
git add app/src/app/layout.tsx
git commit -m "feat(mt): integrate TenantProvider and ThemeStyleInjector in root layout"
```

---

### Task 5.2: Audit and scope all Supabase queries

**Files:**
- All files under `app/src/` that call `supabase.from()`

**Step 1: Find all query locations**

Run: `cd app && grep -rn "\.from(" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules`

**Step 2: For each query, verify tenant scoping**

Since RLS handles tenant filtering via `get_current_tenant_id()`, most SELECT queries should work automatically once the middleware sets the session variable. However, all INSERT/UPDATE operations must include `tenant_id` in the data.

For each `supabase.from('table').insert(...)`:
- Add `tenant_id` field from the tenant context
- Server components: get from headers
- Client components: get from TenantProvider context
- API routes: get from request headers

**Step 3: Commit per-file or per-feature area**

```bash
git commit -m "feat(mt): add tenant_id to all insert/update operations in [area]"
```

---

### Task 5.3: Update navigation and public pages for tenant context

**Files:**
- Components that render the studio name, logo, or branding
- Navigation components
- Footer component

**Step 1: Replace hardcoded "Salsa Ninja" references**

Any component that displays the studio name should read from `useTenant().tenant.name` (client) or `getTenantFromHeaders()` (server).

**Step 2: Update metadata**

Dynamic metadata based on tenant:
```typescript
export async function generateMetadata() {
  const tenant = await getTenantFromHeaders()
  return {
    title: tenant?.name || 'Dance Studio Platform',
  }
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(mt): replace hardcoded studio references with tenant-aware values"
```

---

## WS6: Migration Script & Data Backfill

**Agent:** `migration-runner`
**Branch:** `mt/ws6-migration-script`
**Depends on:** WS5 merged (everything in place)

### Task 6.1: Create the data backfill migration

**Files:**
- Create: `app/supabase/migrations/20260222200000_backfill_salsa_ninja_tenant.sql`

**Step 1: Write the backfill script**

```sql
-- =============================================
-- Backfill: Make Salsa Ninja tenant #1
-- This runs AFTER all schema changes are in place
-- =============================================

DO $$
DECLARE
  salsa_ninja_id UUID;
  fuego_id UUID;
BEGIN
  -- Get the Fuego theme ID
  SELECT id INTO fuego_id FROM themes WHERE slug = 'fuego';

  -- Create the Salsa Ninja tenant
  INSERT INTO tenants (name, slug, theme_id, status, settings)
  VALUES ('Salsa Ninja', 'salsa-ninja', fuego_id, 'active', '{"timezone": "America/New_York"}')
  RETURNING id INTO salsa_ninja_id;

  -- Backfill all existing data tables
  UPDATE members SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE roles SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE member_roles SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE tags SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE member_tags SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE events SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE event_series SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE event_rsvps SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE schedule_slots SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE bookings SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE videos SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE video_tags SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE video_progress SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE documents SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE channels SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE messages SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE direct_messages SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE announcements SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE referrals SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE member_credits SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE invite_codes SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE analytics_events SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;

  -- Now enforce NOT NULL
  ALTER TABLE members ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE roles ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE member_roles ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE tags ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE member_tags ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE events ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE event_series ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE event_rsvps ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE schedule_slots ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE bookings ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE videos ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE video_tags ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE video_progress ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE documents ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE channels ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE messages ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE direct_messages ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE announcements ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE referrals ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE member_credits ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE invite_codes ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE analytics_events ALTER COLUMN tenant_id SET NOT NULL;

  -- Set the tenant owner to the existing owner member
  UPDATE tenants
  SET owner_member_id = (
    SELECT m.id FROM members m
    JOIN member_roles mr ON m.id = mr.member_id
    JOIN roles r ON mr.role_id = r.id
    WHERE r.name = 'owner' AND m.tenant_id = salsa_ninja_id
    LIMIT 1
  )
  WHERE id = salsa_ninja_id;

  RAISE NOTICE 'Salsa Ninja tenant created with ID: %', salsa_ninja_id;
END $$;
```

**Step 2: Commit**

```bash
git add app/supabase/migrations/20260222200000_backfill_salsa_ninja_tenant.sql
git commit -m "feat(mt): add Salsa Ninja backfill migration — tenant #1"
```

---

### Task 6.2: Create super admin seed

**Files:**
- Create: `app/supabase/migrations/20260222200001_seed_super_admin.sql`

**Step 1: Write the super admin seed (parameterized)**

```sql
-- =============================================
-- Seed super admin (Tafari)
-- Run AFTER backfill, requires Tafari's auth.users ID
-- =============================================

-- The super admin's auth user must already exist in auth.users
-- (they log in via magic link at admin.yourdomain.com/login first)
-- This migration creates the super_admins record

-- NOTE: Replace the email below with the actual super admin email
-- The user_id will be looked up from auth.users

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'tafari.k.higgs@gmail.com'
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    INSERT INTO super_admins (user_id, email, full_name, role)
    VALUES (admin_user_id, 'tafari.k.higgs@gmail.com', 'Tafari Higgs', 'super_admin')
    ON CONFLICT (user_id) DO NOTHING;
    RAISE NOTICE 'Super admin created for user: %', admin_user_id;
  ELSE
    RAISE WARNING 'User tafari.k.higgs@gmail.com not found in auth.users. Super admin record not created — run manually after first login.';
  END IF;
END $$;
```

**Step 2: Commit**

```bash
git add app/supabase/migrations/20260222200001_seed_super_admin.sql
git commit -m "feat(mt): add super admin seed migration"
```

---

### Task 6.3: Verification checklist

After all migrations run and the app is deployed:

1. Visit `salsa-ninja.{domain}` — should load with Fuego theme
2. Log in as existing Salsa Ninja member — should see all their data
3. Check events page — only Salsa Ninja events visible
4. Check messages — only Salsa Ninja messages visible
5. Visit `admin.{domain}` — should show super admin login
6. Log in as Tafari — should see dashboard with Salsa Ninja tenant
7. Create a test tenant "Test Studio" with a different theme
8. Visit `test-studio.{domain}` — should load with selected theme, empty data
9. Log in as a new user at test studio — should have no Salsa Ninja data visible
10. Back at `salsa-ninja.{domain}` — test studio data should not appear

---

## Summary

| Workstream | Tasks | Branch | Agent |
|-----------|-------|--------|-------|
| WS1: Database | 1.1–1.6 | `mt/ws1-database-migration` | db-architect |
| WS2: Middleware | 2.1–2.5 | `mt/ws2-middleware-tenant-context` | middleware-engineer |
| WS3: Themes | 3.1–3.4 | `mt/ws3-theme-library` | theme-designer |
| WS4: Super Admin | 4.1–4.5 | `mt/ws4-super-admin-panel` | admin-builder |
| WS5: App Refactor | 5.1–5.3 | `mt/ws5-app-refactor` | app-refactorer |
| WS6: Migration | 6.1–6.3 | `mt/ws6-migration-script` | migration-runner |
