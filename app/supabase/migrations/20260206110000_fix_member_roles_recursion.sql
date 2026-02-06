-- Fix infinite recursion in member_roles RLS policy
-- The add_initial_role() and auto_assign_role() trigger functions need
-- SECURITY DEFINER to bypass RLS when inserting into member_roles.
-- Without this, the "Admins can manage member roles" policy queries
-- member_roles itself, causing infinite recursion on INSERT.

-- Recreate add_initial_role with SECURITY DEFINER
CREATE OR REPLACE FUNCTION add_initial_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO member_roles (member_id, role_id)
  VALUES (NEW.id, NEW.role_id)
  ON CONFLICT (member_id, role_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate auto_assign_role with SECURITY DEFINER
CREATE OR REPLACE FUNCTION auto_assign_role()
RETURNS TRIGGER AS $$
DECLARE
  v_role_id UUID;
  v_guest_role_id UUID;
BEGIN
  SELECT id INTO v_guest_role_id FROM roles WHERE name = 'guest';

  IF NEW.subscription_status = 'active' AND NEW.subscription_tier IN ('monthly', 'annual') THEN
    SELECT id INTO v_role_id FROM roles WHERE name = 'member_full';
  ELSIF NEW.subscription_status = 'active' AND NEW.subscription_tier = 'drop_in' THEN
    SELECT id INTO v_role_id FROM roles WHERE name = 'member_limited';
  ELSE
    v_role_id := v_guest_role_id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role_id IS NULL THEN
      NEW.role_id := v_role_id;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND (OLD.subscription_status IS DISTINCT FROM NEW.subscription_status
      OR OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier) THEN
    DELETE FROM member_roles
    WHERE member_id = NEW.id
    AND role_id IN (
      SELECT id FROM roles WHERE name IN ('member_full', 'member_limited', 'guest')
    );
    INSERT INTO member_roles (member_id, role_id)
    VALUES (NEW.id, v_role_id)
    ON CONFLICT (member_id, role_id) DO NOTHING;
    NEW.role_id := v_role_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
