-- ============================================================
-- Migration 1: Multi-Tenant Schema
-- ============================================================
-- Creates tenant infrastructure (types, tables), adds tenant_id
-- to all existing tables, updates unique constraints, adds indexes,
-- enables RLS on new tables, and provides set_tenant_context RPC.
-- ============================================================

-- ============================================================
-- 1. NEW ENUM TYPES
-- ============================================================

CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'archived');
CREATE TYPE tenant_subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'none');
CREATE TYPE super_admin_role AS ENUM ('super_admin', 'platform_support');

-- ============================================================
-- 2. NEW TABLES
-- ============================================================

-- Themes (must exist before tenants FK)
CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  preview_image_url TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  custom_domain TEXT UNIQUE,
  theme_id UUID REFERENCES themes(id) ON DELETE SET NULL,
  status tenant_status NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status tenant_subscription_status NOT NULL DEFAULT 'none',
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at trigger for tenants
CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Super admins (platform-level users)
CREATE TABLE super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  role super_admin_role NOT NULL DEFAULT 'super_admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. ADD tenant_id TO ALL EXISTING TABLES (NULLABLE)
-- ============================================================
-- Nullable initially — a backfill migration will set values
-- and then ALTER to NOT NULL.

ALTER TABLE members ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE roles ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE member_roles ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE tags ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE member_tags ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE events ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE event_series ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE event_rsvps ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE schedule_slots ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE private_lesson_bookings ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE videos ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE video_tags ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE video_progress ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE documents ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE channels ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE direct_messages ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE announcements ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE referrals ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE member_credits ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE invite_codes ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE analytics_events ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Also add to booking-related tables for full tenant isolation
ALTER TABLE instructor_availability ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE availability_overrides ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE booking_messages ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE booking_message_reads ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- ============================================================
-- 4. INDEXES ON tenant_id
-- ============================================================

-- Simple tenant_id indexes
CREATE INDEX idx_members_tenant ON members(tenant_id);
CREATE INDEX idx_roles_tenant ON roles(tenant_id);
CREATE INDEX idx_member_roles_tenant ON member_roles(tenant_id);
CREATE INDEX idx_tags_tenant ON tags(tenant_id);
CREATE INDEX idx_member_tags_tenant ON member_tags(tenant_id);
CREATE INDEX idx_events_tenant ON events(tenant_id);
CREATE INDEX idx_event_series_tenant ON event_series(tenant_id);
CREATE INDEX idx_event_rsvps_tenant ON event_rsvps(tenant_id);
CREATE INDEX idx_schedule_slots_tenant ON schedule_slots(tenant_id);
CREATE INDEX idx_private_lesson_bookings_tenant ON private_lesson_bookings(tenant_id);
CREATE INDEX idx_videos_tenant ON videos(tenant_id);
CREATE INDEX idx_video_tags_tenant ON video_tags(tenant_id);
CREATE INDEX idx_video_progress_tenant ON video_progress(tenant_id);
CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_channels_tenant ON channels(tenant_id);
CREATE INDEX idx_messages_tenant ON messages(tenant_id);
CREATE INDEX idx_direct_messages_tenant ON direct_messages(tenant_id);
CREATE INDEX idx_announcements_tenant ON announcements(tenant_id);
CREATE INDEX idx_referrals_tenant ON referrals(tenant_id);
CREATE INDEX idx_member_credits_tenant ON member_credits(tenant_id);
CREATE INDEX idx_invite_codes_tenant ON invite_codes(tenant_id);
CREATE INDEX idx_analytics_events_tenant ON analytics_events(tenant_id);
CREATE INDEX idx_instructor_availability_tenant ON instructor_availability(tenant_id);
CREATE INDEX idx_availability_overrides_tenant ON availability_overrides(tenant_id);
CREATE INDEX idx_booking_messages_tenant ON booking_messages(tenant_id);
CREATE INDEX idx_booking_message_reads_tenant ON booking_message_reads(tenant_id);

-- Compound indexes for common query patterns
CREATE INDEX idx_members_tenant_user ON members(tenant_id, user_id);
CREATE INDEX idx_members_tenant_email ON members(tenant_id, email);
CREATE INDEX idx_events_tenant_start ON events(tenant_id, start_time);
CREATE INDEX idx_events_tenant_type ON events(tenant_id, event_type);
CREATE INDEX idx_messages_tenant_channel ON messages(tenant_id, channel_id, created_at DESC);
CREATE INDEX idx_videos_tenant_created ON videos(tenant_id, created_at DESC);
CREATE INDEX idx_analytics_tenant_type ON analytics_events(tenant_id, event_type);
CREATE INDEX idx_analytics_tenant_created ON analytics_events(tenant_id, created_at DESC);
CREATE INDEX idx_channels_tenant_name ON channels(tenant_id, name);
CREATE INDEX idx_schedule_slots_tenant_day ON schedule_slots(tenant_id, day);
CREATE INDEX idx_private_lesson_bookings_tenant_instructor ON private_lesson_bookings(tenant_id, instructor_id);
CREATE INDEX idx_private_lesson_bookings_tenant_start ON private_lesson_bookings(tenant_id, start_time);

-- Indexes on new tables
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_super_admins_user ON super_admins(user_id);
CREATE INDEX idx_themes_slug ON themes(slug);
CREATE INDEX idx_themes_active ON themes(is_active) WHERE is_active = TRUE;

-- ============================================================
-- 5. UPDATE UNIQUE CONSTRAINTS TO BE TENANT-SCOPED
-- ============================================================

-- members.email: drop old unique, add tenant-scoped
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_email_key;
ALTER TABLE members ADD CONSTRAINT members_tenant_email_unique UNIQUE (tenant_id, email);

-- members.referral_code: drop old unique, add tenant-scoped
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_referral_code_key;
ALTER TABLE members ADD CONSTRAINT members_tenant_referral_code_unique UNIQUE (tenant_id, referral_code);

-- invite_codes.code: drop old unique, add tenant-scoped
ALTER TABLE invite_codes DROP CONSTRAINT IF EXISTS invite_codes_code_key;
ALTER TABLE invite_codes ADD CONSTRAINT invite_codes_tenant_code_unique UNIQUE (tenant_id, code);

-- schedule_slots unique(day, time_slot): make tenant-scoped
ALTER TABLE schedule_slots DROP CONSTRAINT IF EXISTS schedule_slots_day_time_slot_key;
ALTER TABLE schedule_slots ADD CONSTRAINT schedule_slots_tenant_day_time_unique UNIQUE (tenant_id, day, time_slot);

-- tags.name: make tenant-scoped
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_name_key;
ALTER TABLE tags ADD CONSTRAINT tags_tenant_name_unique UNIQUE (tenant_id, name);

-- ============================================================
-- 6. RLS ON NEW TABLES
-- ============================================================

ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is a super admin (used before full RLS rewrite)
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM super_admins
    WHERE user_id = auth.uid()
  )
$$ LANGUAGE SQL SECURITY DEFINER;

-- Themes: public read, super admin full access
CREATE POLICY "Anyone can view active themes" ON themes
  FOR SELECT USING (TRUE);

CREATE POLICY "Super admins manage themes" ON themes
  FOR ALL USING (is_super_admin());

-- Tenants: members of tenant can read, super admin full access
CREATE POLICY "Tenant members can view own tenant" ON tenants
  FOR SELECT USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.tenant_id = tenants.id
    )
  );

CREATE POLICY "Super admins manage tenants" ON tenants
  FOR ALL USING (is_super_admin());

-- Super admins: only super admins can access
CREATE POLICY "Super admins view super admins" ON super_admins
  FOR SELECT USING (is_super_admin());

CREATE POLICY "Super admins manage super admins" ON super_admins
  FOR ALL USING (is_super_admin());

-- ============================================================
-- 7. SET TENANT CONTEXT RPC
-- ============================================================

CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', p_tenant_id::TEXT, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
