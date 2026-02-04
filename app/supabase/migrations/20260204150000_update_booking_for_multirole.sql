-- ============================================================
-- Update Booking RPC Functions for Multi-Role Support
-- ============================================================
-- Updates create_booking, confirm_booking, cancel_booking, and
-- decline_booking to check roles via member_roles table (with
-- fallback to legacy role_id for backward compatibility).
-- ============================================================

-- Helper function to check if a member has a specific role (checking both systems)
CREATE OR REPLACE FUNCTION member_has_role(p_member_id UUID, p_role_names user_role[])
RETURNS BOOLEAN AS $$
BEGIN
  -- Check new member_roles table first
  IF EXISTS (
    SELECT 1 FROM member_roles mr
    JOIN roles r ON mr.role_id = r.id
    WHERE mr.member_id = p_member_id
    AND r.name = ANY(p_role_names)
  ) THEN
    RETURN TRUE;
  END IF;

  -- Fallback: check legacy role_id on members table
  IF EXISTS (
    SELECT 1 FROM members m
    JOIN roles r ON m.role_id = r.id
    WHERE m.id = p_member_id
    AND r.name = ANY(p_role_names)
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current member's ID and check if they have certain roles
CREATE OR REPLACE FUNCTION get_current_member_with_roles()
RETURNS TABLE (member_id UUID, is_instructor BOOLEAN, is_admin BOOLEAN) AS $$
DECLARE
  v_member_id UUID;
BEGIN
  -- Get current member ID
  SELECT m.id INTO v_member_id
  FROM members m
  WHERE m.user_id = auth.uid();

  IF v_member_id IS NULL THEN
    RETURN;
  END IF;

  -- Return member ID with role flags
  RETURN QUERY SELECT
    v_member_id,
    member_has_role(v_member_id, ARRAY['instructor', 'owner']::user_role[]),
    member_has_role(v_member_id, ARRAY['owner']::user_role[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- UPDATE create_booking() - Multi-role support
-- ============================================================
CREATE OR REPLACE FUNCTION create_booking(
  p_instructor_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_member_id UUID;
  v_is_guest BOOLEAN;
  v_booking_id UUID;
BEGIN
  -- Resolve current user to member
  SELECT m.id INTO v_member_id
  FROM members m
  WHERE m.user_id = auth.uid();

  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check if guest (using multi-role check)
  -- Guests can have ONLY the guest role
  v_is_guest := NOT member_has_role(v_member_id, ARRAY['owner', 'instructor', 'member_full', 'member_limited']::user_role[]);

  IF v_is_guest THEN
    RETURN jsonb_build_object('success', false, 'error', 'Guests cannot book private lessons');
  END IF;

  -- Cannot book yourself
  IF v_member_id = p_instructor_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot book a lesson with yourself');
  END IF;

  -- Verify instructor exists and has instructor/owner role (multi-role check)
  IF NOT member_has_role(p_instructor_id, ARRAY['instructor', 'owner']::user_role[]) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Instructor not found');
  END IF;

  -- Verify slot is in the future
  IF p_start_time <= NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot book a slot in the past');
  END IF;

  -- Validate the requested time falls within instructor availability.
  IF NOT EXISTS (
    SELECT 1 FROM get_available_slots(p_instructor_id, p_start_time::DATE, p_start_time::DATE) gs
    WHERE gs.slot_start = p_start_time AND gs.slot_end = p_end_time
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Requested time is not an available slot');
  END IF;

  -- Best-effort check for existing confirmed booking
  IF EXISTS (
    SELECT 1 FROM private_lesson_bookings
    WHERE instructor_id = p_instructor_id
      AND status = 'confirmed'
      AND tstzrange(start_time, end_time) && tstzrange(p_start_time, p_end_time)
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This slot is already confirmed');
  END IF;

  INSERT INTO private_lesson_bookings (instructor_id, member_id, start_time, end_time, notes)
  VALUES (p_instructor_id, v_member_id, p_start_time, p_end_time, p_notes)
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object('success', true, 'booking_id', v_booking_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- UPDATE confirm_booking() - Multi-role support
-- ============================================================
CREATE OR REPLACE FUNCTION confirm_booking(
  p_booking_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_booking private_lesson_bookings%ROWTYPE;
  v_caller_member_id UUID;
  v_caller_is_admin BOOLEAN;
BEGIN
  -- Resolve caller
  SELECT m.id INTO v_caller_member_id
  FROM members m
  WHERE m.user_id = auth.uid();

  IF v_caller_member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check if caller is admin (multi-role)
  v_caller_is_admin := member_has_role(v_caller_member_id, ARRAY['owner']::user_role[]);

  -- Lock the row
  SELECT * INTO v_booking
  FROM private_lesson_bookings
  WHERE id = p_booking_id
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found or not pending');
  END IF;

  -- Verify caller is the booking's instructor or admin
  IF v_booking.instructor_id != v_caller_member_id AND NOT v_caller_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized to confirm this booking');
  END IF;

  -- Attempt to confirm — GIST exclusion constraint rejects if overlap
  BEGIN
    UPDATE private_lesson_bookings
    SET status = 'confirmed', updated_at = NOW()
    WHERE id = p_booking_id;
  EXCEPTION
    WHEN exclusion_violation THEN
      RETURN jsonb_build_object('success', false, 'error', 'Time slot already confirmed for another booking');
  END;

  -- Auto-decline other pending bookings for the same slot
  UPDATE private_lesson_bookings
  SET status = 'declined', updated_at = NOW()
  WHERE instructor_id = v_booking.instructor_id
    AND id != p_booking_id
    AND status = 'pending'
    AND tstzrange(start_time, end_time) && tstzrange(v_booking.start_time, v_booking.end_time);

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- UPDATE cancel_booking() - Multi-role support
-- ============================================================
CREATE OR REPLACE FUNCTION cancel_booking(
  p_booking_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_booking private_lesson_bookings%ROWTYPE;
  v_caller_member_id UUID;
  v_caller_is_admin BOOLEAN;
BEGIN
  -- Resolve caller
  SELECT m.id INTO v_caller_member_id
  FROM members m
  WHERE m.user_id = auth.uid();

  IF v_caller_member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check if caller is admin (multi-role)
  v_caller_is_admin := member_has_role(v_caller_member_id, ARRAY['owner']::user_role[]);

  SELECT * INTO v_booking
  FROM private_lesson_bookings
  WHERE id = p_booking_id
    AND status IN ('pending', 'confirmed')
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found or not cancellable');
  END IF;

  -- Case 1: Booking's instructor cancels (no time restriction)
  IF v_booking.instructor_id = v_caller_member_id THEN
    UPDATE private_lesson_bookings
    SET status = 'cancelled_by_instructor',
        cancelled_at = NOW(),
        cancelled_by = v_caller_member_id,
        cancellation_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_booking_id;

  -- Case 2: Admin cancels any booking (no time restriction)
  ELSIF v_caller_is_admin THEN
    UPDATE private_lesson_bookings
    SET status = 'cancelled_by_instructor',
        cancelled_at = NOW(),
        cancelled_by = v_caller_member_id,
        cancellation_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_booking_id;

  -- Case 3: Booking's member cancels
  ELSIF v_booking.member_id = v_caller_member_id THEN
    IF v_booking.status = 'confirmed'
       AND v_booking.start_time <= NOW() + INTERVAL '24 hours' THEN
      RETURN jsonb_build_object('success', false, 'error',
        'Cannot cancel within 24 hours of start time. Contact your instructor.');
    END IF;
    UPDATE private_lesson_bookings
    SET status = 'cancelled_by_member',
        cancelled_at = NOW(),
        cancelled_by = v_caller_member_id,
        cancellation_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_booking_id;

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized to cancel this booking');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- UPDATE decline_booking() - Multi-role support
-- ============================================================
CREATE OR REPLACE FUNCTION decline_booking(
  p_booking_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_booking private_lesson_bookings%ROWTYPE;
  v_caller_member_id UUID;
  v_caller_is_admin BOOLEAN;
BEGIN
  -- Resolve caller
  SELECT m.id INTO v_caller_member_id
  FROM members m
  WHERE m.user_id = auth.uid();

  IF v_caller_member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check if caller is admin (multi-role)
  v_caller_is_admin := member_has_role(v_caller_member_id, ARRAY['owner']::user_role[]);

  SELECT * INTO v_booking
  FROM private_lesson_bookings
  WHERE id = p_booking_id
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found or not pending');
  END IF;

  -- Only the booking's instructor or admin can decline
  IF v_booking.instructor_id != v_caller_member_id AND NOT v_caller_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized to decline this booking');
  END IF;

  UPDATE private_lesson_bookings
  SET status = 'declined',
      cancellation_reason = p_reason,
      updated_at = NOW()
  WHERE id = p_booking_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- UPDATE is_staff() to use member_has_role helper
-- ============================================================
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
DECLARE
  v_member_id UUID;
BEGIN
  SELECT m.id INTO v_member_id
  FROM members m
  WHERE m.user_id = auth.uid();

  IF v_member_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN member_has_role(v_member_id, ARRAY['owner', 'instructor']::user_role[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- UPDATE is_admin() to use member_has_role helper
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_member_id UUID;
BEGIN
  SELECT m.id INTO v_member_id
  FROM members m
  WHERE m.user_id = auth.uid();

  IF v_member_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN member_has_role(v_member_id, ARRAY['owner']::user_role[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- UPDATE is_instructor() to use member_has_role helper
-- ============================================================
CREATE OR REPLACE FUNCTION is_instructor()
RETURNS BOOLEAN AS $$
DECLARE
  v_member_id UUID;
BEGIN
  SELECT m.id INTO v_member_id
  FROM members m
  WHERE m.user_id = auth.uid();

  IF v_member_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN member_has_role(v_member_id, ARRAY['owner', 'instructor']::user_role[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
