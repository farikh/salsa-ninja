-- ============================================================
-- Migration 2: Multi-Tenant RLS Rewrite
-- ============================================================
-- Rewrites all helper functions to be tenant-scoped, drops ALL
-- existing RLS policies, and replaces them with tenant-scoped
-- versions that include super_admin bypass.
-- ============================================================

-- ============================================================
-- 1. REWRITE HELPER FUNCTIONS (TENANT-SCOPED)
-- ============================================================

-- Get current tenant ID from session context
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- is_super_admin: already created in migration 1, recreate for safety
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM super_admins
    WHERE user_id = auth.uid()
  )
$$ LANGUAGE SQL SECURITY DEFINER;

-- get_current_member_id: scoped by tenant
CREATE OR REPLACE FUNCTION get_current_member_id()
RETURNS UUID AS $$
  SELECT id FROM members
  WHERE user_id = auth.uid()
  AND tenant_id = get_current_tenant_id()
$$ LANGUAGE SQL SECURITY DEFINER;

-- is_staff: scoped by tenant via member_roles join
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
DECLARE
  v_member_id UUID;
BEGIN
  SELECT m.id INTO v_member_id
  FROM members m
  WHERE m.user_id = auth.uid()
  AND m.tenant_id = get_current_tenant_id();

  IF v_member_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN member_has_role(v_member_id, ARRAY['owner', 'instructor']::user_role[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- is_admin: scoped by tenant
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_member_id UUID;
BEGIN
  SELECT m.id INTO v_member_id
  FROM members m
  WHERE m.user_id = auth.uid()
  AND m.tenant_id = get_current_tenant_id();

  IF v_member_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN member_has_role(v_member_id, ARRAY['owner']::user_role[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- is_instructor: scoped by tenant
CREATE OR REPLACE FUNCTION is_instructor()
RETURNS BOOLEAN AS $$
DECLARE
  v_member_id UUID;
BEGIN
  SELECT m.id INTO v_member_id
  FROM members m
  WHERE m.user_id = auth.uid()
  AND m.tenant_id = get_current_tenant_id();

  IF v_member_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN member_has_role(v_member_id, ARRAY['owner', 'instructor']::user_role[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- has_role: scoped by tenant
CREATE OR REPLACE FUNCTION has_role(role_name user_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM member_roles mr
    JOIN members m ON mr.member_id = m.id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid()
    AND m.tenant_id = get_current_tenant_id()
    AND r.name = role_name
  )
$$ LANGUAGE SQL SECURITY DEFINER;

-- has_active_subscription: scoped by tenant
CREATE OR REPLACE FUNCTION has_active_subscription()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid()
    AND tenant_id = get_current_tenant_id()
    AND subscription_status = 'active'
    AND subscription_tier IN ('monthly', 'annual')
  )
$$ LANGUAGE SQL SECURITY DEFINER;

-- has_any_tag: scoped by tenant
CREATE OR REPLACE FUNCTION has_any_tag(tag_ids UUID[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM member_tags mt
    JOIN members m ON mt.member_id = m.id
    WHERE m.user_id = auth.uid()
    AND m.tenant_id = get_current_tenant_id()
    AND mt.tag_id = ANY(tag_ids)
  )
$$ LANGUAGE SQL SECURITY DEFINER;

-- attended_event: scoped by tenant
CREATE OR REPLACE FUNCTION attended_event(p_event_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM event_rsvps er
    JOIN members m ON er.member_id = m.id
    WHERE m.user_id = auth.uid()
    AND m.tenant_id = get_current_tenant_id()
    AND er.event_id = p_event_id
    AND er.status = 'going'
  )
$$ LANGUAGE SQL SECURITY DEFINER;

-- get_current_user_roles: scoped by tenant
CREATE OR REPLACE FUNCTION get_current_user_roles()
RETURNS TABLE (role_name user_role, permissions JSONB) AS $$
  SELECT r.name, r.permissions
  FROM member_roles mr
  JOIN members m ON mr.member_id = m.id
  JOIN roles r ON mr.role_id = r.id
  WHERE m.user_id = auth.uid()
  AND m.tenant_id = get_current_tenant_id()
$$ LANGUAGE SQL SECURITY DEFINER;

-- check_member_exists: scoped by tenant
CREATE OR REPLACE FUNCTION check_member_exists(check_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM members
    WHERE email = lower(check_email)
    AND tenant_id = get_current_tenant_id()
  );
END;
$$;

-- ============================================================
-- 2. DROP ALL EXISTING RLS POLICIES
-- ============================================================

-- members (from phase0_foundation.sql)
DROP POLICY IF EXISTS "Members can view other members" ON members;
DROP POLICY IF EXISTS "Members can update own profile" ON members;
DROP POLICY IF EXISTS "Staff can manage members" ON members;
DROP POLICY IF EXISTS "Service role can insert members" ON members;

-- invite_codes (from phase0_foundation.sql)
DROP POLICY IF EXISTS "Anyone can validate invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Staff can manage invite codes" ON invite_codes;

-- events (from phase0_foundation.sql)
DROP POLICY IF EXISTS "View approved events" ON events;
DROP POLICY IF EXISTS "Staff can manage events" ON events;

-- event_rsvps (no policies existed, but drop any just in case)
DROP POLICY IF EXISTS "Members can view event RSVPs" ON event_rsvps;
DROP POLICY IF EXISTS "Members can manage own RSVPs" ON event_rsvps;
DROP POLICY IF EXISTS "Staff can manage RSVPs" ON event_rsvps;

-- videos (from phase0_foundation.sql)
DROP POLICY IF EXISTS "View authorized videos" ON videos;
DROP POLICY IF EXISTS "Staff can manage videos" ON videos;

-- video_tags
DROP POLICY IF EXISTS "Anyone can view video tags" ON video_tags;
DROP POLICY IF EXISTS "Staff can manage video tags" ON video_tags;

-- video_progress
DROP POLICY IF EXISTS "Members can view own progress" ON video_progress;
DROP POLICY IF EXISTS "Members can manage own progress" ON video_progress;

-- documents
DROP POLICY IF EXISTS "View authorized documents" ON documents;
DROP POLICY IF EXISTS "Staff can manage documents" ON documents;

-- channels (from phase0_foundation.sql)
DROP POLICY IF EXISTS "Authenticated users can view channels" ON channels;

-- messages (from phase0_foundation.sql)
DROP POLICY IF EXISTS "View channel messages" ON messages;
DROP POLICY IF EXISTS "Send channel messages" ON messages;

-- direct_messages (from phase0_foundation.sql)
DROP POLICY IF EXISTS "View own DMs" ON direct_messages;
DROP POLICY IF EXISTS "Send DMs" ON direct_messages;

-- announcements (from phase0_foundation.sql)
DROP POLICY IF EXISTS "Authenticated users can view announcements" ON announcements;
DROP POLICY IF EXISTS "Staff can manage announcements" ON announcements;

-- tags (from phase0_foundation.sql)
DROP POLICY IF EXISTS "Authenticated users can view tags" ON tags;
DROP POLICY IF EXISTS "Staff can manage tags" ON tags;

-- member_tags (from phase0_foundation.sql)
DROP POLICY IF EXISTS "Authenticated users can view member tags" ON member_tags;
DROP POLICY IF EXISTS "Staff can manage member tags" ON member_tags;

-- member_roles (from multi_role_support.sql)
DROP POLICY IF EXISTS "Authenticated users can view member roles" ON member_roles;
DROP POLICY IF EXISTS "Admins can manage member roles" ON member_roles;

-- roles
DROP POLICY IF EXISTS "Anyone can view roles" ON roles;
DROP POLICY IF EXISTS "Staff can manage roles" ON roles;

-- event_series
DROP POLICY IF EXISTS "Staff can manage event series" ON event_series;
DROP POLICY IF EXISTS "Members can view event series" ON event_series;

-- referrals
DROP POLICY IF EXISTS "Members can view own referrals" ON referrals;
DROP POLICY IF EXISTS "Staff can manage referrals" ON referrals;

-- member_credits
DROP POLICY IF EXISTS "Members can view own credits" ON member_credits;
DROP POLICY IF EXISTS "Staff can manage credits" ON member_credits;

-- analytics_events
DROP POLICY IF EXISTS "Staff can view analytics" ON analytics_events;
DROP POLICY IF EXISTS "Staff can manage analytics" ON analytics_events;

-- schedule_slots (from add_schedule_slots.sql)
DROP POLICY IF EXISTS "Anyone can view schedule" ON schedule_slots;
DROP POLICY IF EXISTS "Staff can manage schedule" ON schedule_slots;

-- instructor_availability (from private_lesson_booking.sql, recreated in multi_role_support.sql)
DROP POLICY IF EXISTS "Anyone can view availability" ON instructor_availability;
DROP POLICY IF EXISTS "Instructors manage own availability" ON instructor_availability;

-- availability_overrides (from private_lesson_booking.sql, recreated in multi_role_support.sql)
DROP POLICY IF EXISTS "Anyone can view overrides" ON availability_overrides;
DROP POLICY IF EXISTS "Instructors manage own overrides" ON availability_overrides;

-- private_lesson_bookings (from private_lesson_booking.sql)
DROP POLICY IF EXISTS "View own bookings" ON private_lesson_bookings;
DROP POLICY IF EXISTS "Staff manage bookings" ON private_lesson_bookings;

-- booking_messages (from private_lesson_booking.sql)
DROP POLICY IF EXISTS "Booking participants view messages" ON booking_messages;
DROP POLICY IF EXISTS "Booking participants send messages" ON booking_messages;

-- booking_message_reads (from private_lesson_booking.sql)
DROP POLICY IF EXISTS "Members manage own read markers" ON booking_message_reads;

-- ============================================================
-- 3. ENABLE RLS ON TABLES THAT MIGHT NOT HAVE IT YET
-- ============================================================
-- These are idempotent — safe to re-run
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. CREATE TENANT-SCOPED RLS POLICIES
-- ============================================================
-- Pattern: is_super_admin() OR (tenant_id = get_current_tenant_id() AND [condition])

-- -------------------------------------------------------
-- MEMBERS
-- -------------------------------------------------------
CREATE POLICY "Members can view other members" ON members
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "Members can update own profile" ON members
  FOR UPDATE USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND user_id = auth.uid())
  );

CREATE POLICY "Staff can manage members" ON members
  FOR ALL USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND is_staff())
  );

CREATE POLICY "Service role can insert members" ON members
  FOR INSERT WITH CHECK (TRUE);

-- -------------------------------------------------------
-- ROLES
-- -------------------------------------------------------
CREATE POLICY "Anyone can view roles" ON roles
  FOR SELECT USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
    OR tenant_id IS NULL  -- global roles
  );

CREATE POLICY "Super admins manage roles" ON roles
  FOR ALL USING (is_super_admin());

-- -------------------------------------------------------
-- MEMBER_ROLES
-- -------------------------------------------------------
CREATE POLICY "Authenticated users can view member roles" ON member_roles
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "Admins can manage member roles" ON member_roles
  FOR ALL USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND is_admin())
  );

-- -------------------------------------------------------
-- TAGS
-- -------------------------------------------------------
CREATE POLICY "Authenticated users can view tags" ON tags
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "Staff can manage tags" ON tags
  FOR ALL USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND is_staff())
  );

-- -------------------------------------------------------
-- MEMBER_TAGS
-- -------------------------------------------------------
CREATE POLICY "Authenticated users can view member tags" ON member_tags
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "Staff can manage member tags" ON member_tags
  FOR ALL USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND is_staff())
  );

-- -------------------------------------------------------
-- EVENTS
-- -------------------------------------------------------
CREATE POLICY "View approved events" ON events
  FOR SELECT USING (
    is_super_admin()
    OR (
      tenant_id = get_current_tenant_id()
      AND auth.uid() IS NOT NULL
      AND (
        visibility = 'public'
        OR visibility = 'all_members'
        OR (visibility = 'segment' AND has_any_tag(visibility_tags))
      )
      AND (approval_status = 'approved' OR submitted_by = get_current_member_id())
    )
  );

CREATE POLICY "Staff can manage events" ON events
  FOR ALL USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND is_staff())
  );

-- -------------------------------------------------------
-- EVENT_SERIES
-- -------------------------------------------------------
CREATE POLICY "Members can view event series" ON event_series
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "Staff can manage event series" ON event_series
  FOR ALL USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND is_staff())
  );

-- -------------------------------------------------------
-- EVENT_RSVPS
-- -------------------------------------------------------
CREATE POLICY "Members can view event RSVPs" ON event_rsvps
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "Members can manage own RSVPs" ON event_rsvps
  FOR INSERT WITH CHECK (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND member_id = get_current_member_id())
  );

CREATE POLICY "Members can update own RSVPs" ON event_rsvps
  FOR UPDATE USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND member_id = get_current_member_id())
  );

CREATE POLICY "Staff can manage RSVPs" ON event_rsvps
  FOR ALL USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND is_staff())
  );

-- -------------------------------------------------------
-- SCHEDULE_SLOTS
-- -------------------------------------------------------
CREATE POLICY "Anyone can view schedule" ON schedule_slots
  FOR SELECT USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY "Staff can manage schedule" ON schedule_slots
  FOR ALL USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND is_staff())
  )
  WITH CHECK (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND is_staff())
  );

-- -------------------------------------------------------
-- PRIVATE_LESSON_BOOKINGS
-- -------------------------------------------------------
CREATE POLICY "View own bookings" ON private_lesson_bookings
  FOR SELECT USING (
    is_super_admin()
    OR (
      tenant_id = get_current_tenant_id()
      AND (
        member_id = get_current_member_id()
        OR instructor_id = get_current_member_id()
        OR is_staff()
      )
    )
  );

CREATE POLICY "Staff manage bookings" ON private_lesson_bookings
  FOR ALL USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND is_staff())
  );

-- -------------------------------------------------------
-- VIDEOS
-- -------------------------------------------------------
CREATE POLICY "View authorized videos" ON videos
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
            OR (visibility = 'attendees' AND attended_event(event_id))
          )
        )
      )
    )
  );

CREATE POLICY "Staff can manage videos" ON videos
  FOR ALL USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND is_staff())
  );

-- -------------------------------------------------------
-- VIDEO_TAGS
-- -------------------------------------------------------
CREATE POLICY "Anyone can view video tags" ON video_tags
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "Staff can manage video tags" ON video_tags
  FOR ALL USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND is_staff())
  );

-- -------------------------------------------------------
-- VIDEO_PROGRESS
-- -------------------------------------------------------
CREATE POLICY "Members can view own progress" ON video_progress
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND member_id = get_current_member_id())
  );

CREATE POLICY "Members can manage own progress" ON video_progress
  FOR ALL USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND member_id = get_current_member_id())
  );

-- -------------------------------------------------------
-- DOCUMENTS
-- -------------------------------------------------------
CREATE POLICY "View authorized documents" ON documents
  FOR SELECT USING (
    is_super_admin()
    OR (
      tenant_id = get_current_tenant_id()
      AND (
        is_staff()
        OR visibility = 'all_members'
        OR (visibility = 'segment' AND has_any_tag(visibility_tags))
      )
    )
  );

CREATE POLICY "Staff can manage documents" ON documents
  FOR ALL USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND is_staff())
  );

-- -------------------------------------------------------
-- CHANNELS
-- -------------------------------------------------------
CREATE POLICY "Authenticated users can view channels" ON channels
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "Staff can manage channels" ON channels
  FOR ALL USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND is_staff())
  );

-- -------------------------------------------------------
-- MESSAGES
-- -------------------------------------------------------
CREATE POLICY "View channel messages" ON messages
  FOR SELECT USING (
    is_super_admin()
    OR (
      tenant_id = get_current_tenant_id()
      AND EXISTS (
        SELECT 1 FROM channels c
        WHERE c.id = messages.channel_id
        AND c.tenant_id = get_current_tenant_id()
        AND (
          c.visibility = 'all_members'
          OR (c.visibility = 'segment' AND has_any_tag(c.visibility_tags))
          OR is_staff()
        )
      )
      AND (has_active_subscription() OR is_staff())
    )
  );

CREATE POLICY "Send channel messages" ON messages
  FOR INSERT WITH CHECK (
    is_super_admin()
    OR (
      tenant_id = get_current_tenant_id()
      AND sender_id = get_current_member_id()
      AND (has_active_subscription() OR is_staff())
    )
  );

-- -------------------------------------------------------
-- DIRECT_MESSAGES
-- -------------------------------------------------------
CREATE POLICY "View own DMs" ON direct_messages
  FOR SELECT USING (
    is_super_admin()
    OR (
      tenant_id = get_current_tenant_id()
      AND (
        sender_id = get_current_member_id()
        OR recipient_id = get_current_member_id()
      )
    )
  );

CREATE POLICY "Send DMs" ON direct_messages
  FOR INSERT WITH CHECK (
    is_super_admin()
    OR (
      tenant_id = get_current_tenant_id()
      AND sender_id = get_current_member_id()
      AND (has_active_subscription() OR is_staff())
    )
  );

-- -------------------------------------------------------
-- ANNOUNCEMENTS
-- -------------------------------------------------------
CREATE POLICY "Authenticated users can view announcements" ON announcements
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "Staff can manage announcements" ON announcements
  FOR ALL USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND is_staff())
  );

-- -------------------------------------------------------
-- REFERRALS
-- -------------------------------------------------------
CREATE POLICY "Members can view own referrals" ON referrals
  FOR SELECT USING (
    is_super_admin()
    OR (
      tenant_id = get_current_tenant_id()
      AND (
        referrer_id = get_current_member_id()
        OR referee_id = get_current_member_id()
        OR is_staff()
      )
    )
  );

CREATE POLICY "Staff can manage referrals" ON referrals
  FOR ALL USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND is_staff())
  );

-- -------------------------------------------------------
-- MEMBER_CREDITS
-- -------------------------------------------------------
CREATE POLICY "Members can view own credits" ON member_credits
  FOR SELECT USING (
    is_super_admin()
    OR (
      tenant_id = get_current_tenant_id()
      AND (member_id = get_current_member_id() OR is_staff())
    )
  );

CREATE POLICY "Staff can manage credits" ON member_credits
  FOR ALL USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND is_staff())
  );

-- -------------------------------------------------------
-- INVITE_CODES
-- -------------------------------------------------------
CREATE POLICY "Anyone can validate invite codes" ON invite_codes
  FOR SELECT USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY "Staff can manage invite codes" ON invite_codes
  FOR ALL USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND is_staff())
  );

-- -------------------------------------------------------
-- ANALYTICS_EVENTS
-- -------------------------------------------------------
CREATE POLICY "Staff can view analytics" ON analytics_events
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND is_staff())
  );

CREATE POLICY "Authenticated users can insert analytics" ON analytics_events
  FOR INSERT WITH CHECK (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

-- -------------------------------------------------------
-- INSTRUCTOR_AVAILABILITY
-- -------------------------------------------------------
CREATE POLICY "Anyone can view availability" ON instructor_availability
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "Instructors manage own availability" ON instructor_availability
  FOR ALL USING (
    is_super_admin()
    OR (
      tenant_id = get_current_tenant_id()
      AND (instructor_id = get_current_member_id() OR is_admin())
    )
  );

-- -------------------------------------------------------
-- AVAILABILITY_OVERRIDES
-- -------------------------------------------------------
CREATE POLICY "Anyone can view overrides" ON availability_overrides
  FOR SELECT USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "Instructors manage own overrides" ON availability_overrides
  FOR ALL USING (
    is_super_admin()
    OR (
      tenant_id = get_current_tenant_id()
      AND (instructor_id = get_current_member_id() OR is_admin())
    )
  );

-- -------------------------------------------------------
-- BOOKING_MESSAGES
-- -------------------------------------------------------
CREATE POLICY "Booking participants view messages" ON booking_messages
  FOR SELECT USING (
    is_super_admin()
    OR (
      tenant_id = get_current_tenant_id()
      AND (
        EXISTS (
          SELECT 1 FROM private_lesson_bookings b
          WHERE b.id = booking_messages.booking_id
          AND b.tenant_id = get_current_tenant_id()
          AND (b.member_id = get_current_member_id()
               OR b.instructor_id = get_current_member_id())
        )
        OR is_staff()
      )
    )
  );

CREATE POLICY "Booking participants send messages" ON booking_messages
  FOR INSERT WITH CHECK (
    is_super_admin()
    OR (
      tenant_id = get_current_tenant_id()
      AND sender_id = get_current_member_id()
      AND EXISTS (
        SELECT 1 FROM private_lesson_bookings b
        WHERE b.id = booking_messages.booking_id
        AND b.tenant_id = get_current_tenant_id()
        AND (b.member_id = get_current_member_id()
             OR b.instructor_id = get_current_member_id())
      )
    )
  );

-- -------------------------------------------------------
-- BOOKING_MESSAGE_READS
-- -------------------------------------------------------
CREATE POLICY "Members manage own read markers" ON booking_message_reads
  FOR ALL USING (
    is_super_admin()
    OR (tenant_id = get_current_tenant_id() AND member_id = get_current_member_id())
  );

-- ============================================================
-- 5. UPDATE MEMBER_PROFILES VIEW TO INCLUDE tenant_id
-- ============================================================

DROP VIEW IF EXISTS member_profiles;
CREATE VIEW member_profiles AS
SELECT
  m.*,
  r.name as role_name,
  r.permissions,
  (
    SELECT ARRAY_AGG(DISTINCT r2.name)
    FROM member_roles mr
    JOIN roles r2 ON mr.role_id = r2.id
    WHERE mr.member_id = m.id
  ) as all_roles,
  (
    SELECT COALESCE(SUM(amount), 0)
    FROM member_credits mc
    WHERE mc.member_id = m.id AND mc.applied_at IS NULL
  ) as available_credits,
  (
    SELECT ARRAY_AGG(t.name)
    FROM member_tags mt
    JOIN tags t ON mt.tag_id = t.id
    WHERE mt.member_id = m.id
  ) as tags
FROM members m
JOIN roles r ON m.role_id = r.id;

-- NOTE: tenant_id is now included via m.* since it's a column on members.
-- Queries should filter: WHERE tenant_id = get_current_tenant_id()

-- ============================================================
-- 6. UPDATE UPCOMING_EVENTS VIEW TO BE TENANT-AWARE
-- ============================================================

CREATE OR REPLACE VIEW upcoming_events AS
SELECT
  e.*,
  m.display_name as instructor_name,
  m.avatar_url as instructor_avatar,
  (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND status = 'going') as rsvp_count,
  (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND status = 'waitlist') as waitlist_count
FROM events e
LEFT JOIN members m ON e.instructor_id = m.id
WHERE e.start_time > NOW()
AND e.approval_status = 'approved'
ORDER BY e.start_time ASC;

-- NOTE: tenant_id is included via e.* since it's a column on events.
-- Queries should filter: WHERE tenant_id = get_current_tenant_id()
