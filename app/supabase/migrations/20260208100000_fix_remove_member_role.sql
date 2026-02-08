-- ============================================================
-- Fix: remove_member_role() — FOR UPDATE not allowed with aggregates
-- ============================================================
-- PostgreSQL does not allow FOR UPDATE with aggregate functions.
-- Fix: lock the rows first with a CTE, then count them.

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

  -- Lock rows first, then count (FOR UPDATE cannot be used with aggregates)
  WITH locked_roles AS (
    SELECT member_id, role_id
    FROM member_roles
    WHERE member_id = p_member_id
    FOR UPDATE
  )
  SELECT COUNT(*) INTO v_role_count FROM locked_roles;

  -- Don't allow removing the last role (everyone needs at least guest)
  IF v_role_count <= 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot remove the last role. Member must have at least one role.');
  END IF;

  -- Remove the role (within the same transaction as the lock)
  DELETE FROM member_roles WHERE member_id = p_member_id AND role_id = v_role_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
