-- ============================================================
-- Multi-Role Support Migration
-- ============================================================
-- Changes the system from single role (role_id on members) to
-- multiple roles (member_roles junction table).
-- ============================================================

-- ============================================================
-- 1. CREATE MEMBER_ROLES JUNCTION TABLE
-- ============================================================
CREATE TABLE member_roles (
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES members(id) ON DELETE SET NULL,
  PRIMARY KEY (member_id, role_id)
);

CREATE INDEX idx_member_roles_member ON member_roles(member_id);
CREATE INDEX idx_member_roles_role ON member_roles(role_id);

-- Enable RLS
ALTER TABLE member_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view member roles" ON member_roles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage member roles" ON member_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM members m
      JOIN roles r ON m.role_id = r.id
      WHERE m.user_id = auth.uid()
      AND r.name = 'owner'
    )
    OR
    EXISTS (
      SELECT 1 FROM member_roles mr
      JOIN members m ON mr.member_id = m.id
      JOIN roles r ON mr.role_id = r.id
      WHERE m.user_id = auth.uid()
      AND r.name = 'owner'
    )
  );

-- ============================================================
-- 2. MIGRATE EXISTING ROLE DATA
-- ============================================================
-- Copy existing role_id from members to member_roles
INSERT INTO member_roles (member_id, role_id, assigned_at)
SELECT id, role_id, created_at
FROM members
WHERE role_id IS NOT NULL;

-- ============================================================
-- 3. UPDATE HELPER FUNCTIONS
-- ============================================================

-- Update is_staff() to check member_roles table
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM member_roles mr
    JOIN members m ON mr.member_id = m.id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid()
    AND r.name IN ('owner', 'instructor')
  )
$$ LANGUAGE SQL SECURITY DEFINER;

-- New function: check if user has a specific role
CREATE OR REPLACE FUNCTION has_role(role_name user_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM member_roles mr
    JOIN members m ON mr.member_id = m.id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid()
    AND r.name = role_name
  )
$$ LANGUAGE SQL SECURITY DEFINER;

-- New function: check if user is admin (owner)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM member_roles mr
    JOIN members m ON mr.member_id = m.id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid()
    AND r.name = 'owner'
  )
$$ LANGUAGE SQL SECURITY DEFINER;

-- New function: check if user is instructor
CREATE OR REPLACE FUNCTION is_instructor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM member_roles mr
    JOIN members m ON mr.member_id = m.id
    JOIN roles r ON mr.role_id = r.id
    WHERE m.user_id = auth.uid()
    AND r.name IN ('owner', 'instructor')
  )
$$ LANGUAGE SQL SECURITY DEFINER;

-- New function: get all roles for current user
CREATE OR REPLACE FUNCTION get_current_user_roles()
RETURNS TABLE (role_name user_role, permissions JSONB) AS $$
  SELECT r.name, r.permissions
  FROM member_roles mr
  JOIN members m ON mr.member_id = m.id
  JOIN roles r ON mr.role_id = r.id
  WHERE m.user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================================
-- 4. UPDATE AUTO_ASSIGN_ROLE TRIGGER
-- ============================================================
-- Instead of setting role_id, insert into member_roles

CREATE OR REPLACE FUNCTION auto_assign_role()
RETURNS TRIGGER AS $$
DECLARE
  v_role_id UUID;
  v_guest_role_id UUID;
BEGIN
  -- Get guest role ID
  SELECT id INTO v_guest_role_id FROM roles WHERE name = 'guest';

  -- Determine role based on subscription
  IF NEW.subscription_status = 'active' AND NEW.subscription_tier IN ('monthly', 'annual') THEN
    SELECT id INTO v_role_id FROM roles WHERE name = 'member_full';
  ELSIF NEW.subscription_status = 'active' AND NEW.subscription_tier = 'drop_in' THEN
    SELECT id INTO v_role_id FROM roles WHERE name = 'member_limited';
  ELSE
    v_role_id := v_guest_role_id;
  END IF;

  -- For new members (INSERT), ensure they have at least guest role
  IF TG_OP = 'INSERT' THEN
    -- Set role_id for backward compatibility
    IF NEW.role_id IS NULL THEN
      NEW.role_id := v_role_id;
    END IF;
    -- Insert into member_roles (done in a separate trigger after insert)
  END IF;

  -- For updates, update subscription-based role in member_roles
  IF TG_OP = 'UPDATE' AND (OLD.subscription_status IS DISTINCT FROM NEW.subscription_status
      OR OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier) THEN
    -- Remove old subscription-based roles (member_full, member_limited, guest)
    DELETE FROM member_roles
    WHERE member_id = NEW.id
    AND role_id IN (
      SELECT id FROM roles WHERE name IN ('member_full', 'member_limited', 'guest')
    );
    -- Add new subscription-based role
    INSERT INTO member_roles (member_id, role_id)
    VALUES (NEW.id, v_role_id)
    ON CONFLICT (member_id, role_id) DO NOTHING;
    -- Update role_id for backward compatibility
    NEW.role_id := v_role_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- New trigger to add member_roles entry after member insert
CREATE OR REPLACE FUNCTION add_initial_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the role to member_roles table
  INSERT INTO member_roles (member_id, role_id)
  VALUES (NEW.id, NEW.role_id)
  ON CONFLICT (member_id, role_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_member_initial_role
  AFTER INSERT ON members
  FOR EACH ROW EXECUTE FUNCTION add_initial_role();

-- ============================================================
-- 5. UPDATE VIEWS
-- ============================================================

-- Update member_profiles view to include all roles
CREATE OR REPLACE VIEW member_profiles AS
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

-- ============================================================
-- 6. API FUNCTIONS FOR ROLE MANAGEMENT
-- ============================================================

-- Function to add a role to a member (admin only)
CREATE OR REPLACE FUNCTION add_member_role(
  p_member_id UUID,
  p_role_name user_role
) RETURNS JSONB AS $$
DECLARE
  v_role_id UUID;
  v_admin_member_id UUID;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only administrators can manage roles');
  END IF;

  -- Get admin's member_id for assigned_by
  SELECT id INTO v_admin_member_id FROM members WHERE user_id = auth.uid();

  -- Get the role ID
  SELECT id INTO v_role_id FROM roles WHERE name = p_role_name;
  IF v_role_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Role not found');
  END IF;

  -- Check if member exists
  IF NOT EXISTS (SELECT 1 FROM members WHERE id = p_member_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member not found');
  END IF;

  -- Add the role
  INSERT INTO member_roles (member_id, role_id, assigned_by)
  VALUES (p_member_id, v_role_id, v_admin_member_id)
  ON CONFLICT (member_id, role_id) DO NOTHING;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove a role from a member (admin only)
CREATE OR REPLACE FUNCTION remove_member_role(
  p_member_id UUID,
  p_role_name user_role
) RETURNS JSONB AS $$
DECLARE
  v_role_id UUID;
  v_role_count INT;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only administrators can manage roles');
  END IF;

  -- Get the role ID
  SELECT id INTO v_role_id FROM roles WHERE name = p_role_name;
  IF v_role_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Role not found');
  END IF;

  -- Lock member's roles and count them atomically to prevent race conditions
  SELECT COUNT(*) INTO v_role_count
  FROM member_roles
  WHERE member_id = p_member_id
  FOR UPDATE;

  -- Don't allow removing the last role (everyone needs at least guest)
  IF v_role_count <= 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot remove the last role. Member must have at least one role.');
  END IF;

  -- Remove the role (within the same transaction as the lock)
  DELETE FROM member_roles WHERE member_id = p_member_id AND role_id = v_role_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all members with their roles (admin only)
CREATE OR REPLACE FUNCTION get_members_with_roles(
  p_search TEXT DEFAULT NULL,
  p_role_filter user_role DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  member_id UUID,
  email TEXT,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  roles user_role[],
  created_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can view all members';
  END IF;

  RETURN QUERY
  SELECT
    m.id as member_id,
    m.email,
    m.full_name,
    m.display_name,
    m.avatar_url,
    ARRAY_AGG(DISTINCT r.name ORDER BY r.name) as roles,
    m.created_at,
    m.last_login_at
  FROM members m
  LEFT JOIN member_roles mr ON m.id = mr.member_id
  LEFT JOIN roles r ON mr.role_id = r.id
  WHERE
    (p_search IS NULL OR
      m.full_name ILIKE '%' || p_search || '%' OR
      m.email ILIKE '%' || p_search || '%' OR
      m.display_name ILIKE '%' || p_search || '%')
    AND (p_role_filter IS NULL OR EXISTS (
      SELECT 1 FROM member_roles mr2
      JOIN roles r2 ON mr2.role_id = r2.id
      WHERE mr2.member_id = m.id AND r2.name = p_role_filter
    ))
  GROUP BY m.id
  ORDER BY m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. UPDATE RLS POLICIES FOR INSTRUCTOR AVAILABILITY
-- ============================================================

-- Drop and recreate the availability policies to use is_instructor()
DROP POLICY IF EXISTS "Instructors manage own availability" ON instructor_availability;
CREATE POLICY "Instructors manage own availability" ON instructor_availability
  FOR ALL USING (
    instructor_id = get_current_member_id()
    OR is_admin()
  );

DROP POLICY IF EXISTS "Instructors manage own overrides" ON availability_overrides;
CREATE POLICY "Instructors manage own overrides" ON availability_overrides
  FOR ALL USING (
    instructor_id = get_current_member_id()
    OR is_admin()
  );
