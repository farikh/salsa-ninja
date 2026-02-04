-- Private Lesson Booking Feature Migration
-- Design doc: docs/specs/features/private-lesson-booking.md

-- Enable btree_gist for exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Booking status enum
CREATE TYPE booking_status AS ENUM (
  'pending',
  'confirmed',
  'declined',
  'expired',
  'cancelled_by_member',
  'cancelled_by_instructor',
  'completed',
  'no_show'
);

-- ============================================================
-- TABLES
-- ============================================================

-- Recurring weekly availability windows per instructor
CREATE TABLE instructor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INT NOT NULL DEFAULT 60,
  is_active BOOLEAN DEFAULT TRUE,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE, -- NULL = indefinite
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_time_range CHECK (start_time < end_time),
  UNIQUE (instructor_id, day_of_week, start_time)
);

CREATE INDEX idx_instructor_avail_instructor
  ON instructor_availability(instructor_id);

-- Date-specific blocks or extra availability
CREATE TABLE availability_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  start_time TIME,           -- NULL = entire day blocked
  end_time TIME,
  is_available BOOLEAN NOT NULL DEFAULT FALSE, -- false=blocked, true=extra
  reason TEXT,
  slot_duration_minutes INT DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (instructor_id, override_date, start_time)
);

CREATE INDEX idx_avail_overrides_instructor
  ON availability_overrides(instructor_id, override_date);

-- Individual lesson bookings
CREATE TABLE private_lesson_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES members(id),
  member_id UUID NOT NULL REFERENCES members(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  notes TEXT, -- optional note submitted at booking time

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES members(id),
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_booking_time CHECK (end_time > start_time),

  -- Database-level double-booking prevention (confirmed bookings only)
  CONSTRAINT no_instructor_overlap EXCLUDE USING GIST (
    instructor_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  ) WHERE (status = 'confirmed')
);

CREATE INDEX idx_bookings_instructor ON private_lesson_bookings(instructor_id);
CREATE INDEX idx_bookings_member ON private_lesson_bookings(member_id);
CREATE INDEX idx_bookings_start ON private_lesson_bookings(start_time);
CREATE INDEX idx_bookings_status ON private_lesson_bookings(status);

-- Per-booking message thread
CREATE TABLE booking_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES private_lesson_bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES members(id),
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_booking_messages_booking
  ON booking_messages(booking_id, created_at ASC);
CREATE INDEX idx_booking_messages_sender
  ON booking_messages(sender_id);

-- Required for Realtime `in` filter on non-PK column
ALTER TABLE booking_messages REPLICA IDENTITY FULL;

-- Unread tracking per booking per member
CREATE TABLE booking_message_reads (
  booking_id UUID NOT NULL REFERENCES private_lesson_bookings(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (booking_id, member_id)
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- updated_at triggers
CREATE TRIGGER instructor_availability_updated_at
  BEFORE UPDATE ON instructor_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER private_lesson_bookings_updated_at
  BEFORE UPDATE ON private_lesson_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enforce valid booking status transitions
CREATE OR REPLACE FUNCTION check_booking_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status = 'pending' AND NEW.status IN (
        'confirmed', 'declined', 'expired', 'cancelled_by_member', 'cancelled_by_instructor'))
  OR (OLD.status = 'confirmed' AND NEW.status IN (
        'completed', 'cancelled_by_member', 'cancelled_by_instructor', 'no_show'))
  THEN
    RETURN NEW;
  ELSE
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_booking_transition
  BEFORE UPDATE OF status ON private_lesson_bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_booking_transition();

-- ============================================================
-- FUNCTIONS (SECURITY DEFINER — bypass RLS)
-- ============================================================

-- Generate concrete time slots from availability rules
CREATE OR REPLACE FUNCTION get_available_slots(
  p_instructor_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  slot_start TIMESTAMPTZ,
  slot_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT d::DATE AS day
    FROM generate_series(p_start_date::TIMESTAMP, p_end_date::TIMESTAMP, '1 day') d
  ),
  avail_windows AS (
    SELECT
      ds.day,
      ia.start_time AS win_start,
      ia.end_time AS win_end,
      ia.slot_duration_minutes
    FROM date_series ds
    CROSS JOIN instructor_availability ia
    WHERE ia.instructor_id = p_instructor_id
      AND ia.is_active = TRUE
      AND EXTRACT(dow FROM ds.day) = ia.day_of_week
      AND ds.day >= ia.effective_from
      AND (ia.effective_until IS NULL OR ds.day <= ia.effective_until)
      AND NOT EXISTS (
        SELECT 1 FROM availability_overrides ao
        WHERE ao.instructor_id = p_instructor_id
          AND ao.override_date = ds.day
          AND ao.is_available = FALSE
          AND ao.start_time IS NULL
      )
  ),
  weekly_slots AS (
    SELECT
      (aw.day + slot_time) AT TIME ZONE 'America/New_York' AS slot_start,
      (aw.day + slot_time + (aw.slot_duration_minutes || ' minutes')::INTERVAL)
        AT TIME ZONE 'America/New_York' AS slot_end
    FROM avail_windows aw
    CROSS JOIN LATERAL generate_series(
      aw.win_start,
      aw.win_end - (aw.slot_duration_minutes || ' minutes')::INTERVAL,
      (aw.slot_duration_minutes || ' minutes')::INTERVAL
    ) AS slot_time
    WHERE NOT EXISTS (
      SELECT 1 FROM availability_overrides ao
      WHERE ao.instructor_id = p_instructor_id
        AND ao.override_date = aw.day
        AND ao.is_available = FALSE
        AND ao.start_time IS NOT NULL
        AND slot_time >= ao.start_time
        AND slot_time < ao.end_time
    )
  ),
  extras AS (
    SELECT
      (ao.override_date + slot_time) AT TIME ZONE 'America/New_York' AS slot_start,
      (ao.override_date + slot_time + (ao.slot_duration_minutes || ' minutes')::INTERVAL)
        AT TIME ZONE 'America/New_York' AS slot_end
    FROM availability_overrides ao
    CROSS JOIN LATERAL generate_series(
      ao.start_time,
      ao.end_time - (ao.slot_duration_minutes || ' minutes')::INTERVAL,
      (ao.slot_duration_minutes || ' minutes')::INTERVAL
    ) AS slot_time
    WHERE ao.instructor_id = p_instructor_id
      AND ao.is_available = TRUE
      AND ao.override_date BETWEEN p_start_date AND p_end_date
      AND ao.start_time IS NOT NULL
  ),
  all_slots AS (
    SELECT slot_start, slot_end FROM weekly_slots
    UNION ALL
    SELECT slot_start, slot_end FROM extras
  )
  SELECT s.slot_start, s.slot_end
  FROM all_slots s
  WHERE NOT EXISTS (
    SELECT 1 FROM private_lesson_bookings b
    WHERE b.instructor_id = p_instructor_id
      AND b.status = 'confirmed'
      AND tstzrange(b.start_time, b.end_time) && tstzrange(s.slot_start, s.slot_end)
  )
  AND s.slot_start > NOW()
  ORDER BY s.slot_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Member creates a pending booking request
CREATE OR REPLACE FUNCTION create_booking(
  p_instructor_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_member_id UUID;
  v_role TEXT;
  v_booking_id UUID;
BEGIN
  SELECT m.id, r.name INTO v_member_id, v_role
  FROM members m JOIN roles r ON m.role_id = r.id
  WHERE m.user_id = auth.uid();

  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF v_role = 'guest' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Guests cannot book private lessons');
  END IF;

  IF v_member_id = p_instructor_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot book a lesson with yourself');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM members m JOIN roles r ON m.role_id = r.id
    WHERE m.id = p_instructor_id AND r.name IN ('instructor', 'owner')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Instructor not found');
  END IF;

  IF p_start_time <= NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot book a slot in the past');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM get_available_slots(p_instructor_id, p_start_time::DATE, p_start_time::DATE) gs
    WHERE gs.slot_start = p_start_time AND gs.slot_end = p_end_time
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Requested time is not an available slot');
  END IF;

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

-- Atomic confirmation with auto-decline of competing requests
CREATE OR REPLACE FUNCTION confirm_booking(
  p_booking_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_booking private_lesson_bookings%ROWTYPE;
  v_caller_member_id UUID;
  v_caller_role TEXT;
BEGIN
  SELECT m.id, r.name INTO v_caller_member_id, v_caller_role
  FROM members m JOIN roles r ON m.role_id = r.id
  WHERE m.user_id = auth.uid();

  SELECT * INTO v_booking
  FROM private_lesson_bookings
  WHERE id = p_booking_id
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found or not pending');
  END IF;

  IF v_booking.instructor_id != v_caller_member_id AND v_caller_role != 'owner' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized to confirm this booking');
  END IF;

  BEGIN
    UPDATE private_lesson_bookings
    SET status = 'confirmed', updated_at = NOW()
    WHERE id = p_booking_id;
  EXCEPTION
    WHEN exclusion_violation THEN
      RETURN jsonb_build_object('success', false, 'error', 'Time slot already confirmed for another booking');
  END;

  UPDATE private_lesson_bookings
  SET status = 'declined', updated_at = NOW()
  WHERE instructor_id = v_booking.instructor_id
    AND id != p_booking_id
    AND status = 'pending'
    AND tstzrange(start_time, end_time) && tstzrange(v_booking.start_time, v_booking.end_time);

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cancel booking with 24-hour rule for members
CREATE OR REPLACE FUNCTION cancel_booking(
  p_booking_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_booking private_lesson_bookings%ROWTYPE;
  v_caller_member_id UUID;
  v_caller_role TEXT;
BEGIN
  SELECT m.id, r.name INTO v_caller_member_id, v_caller_role
  FROM members m JOIN roles r ON m.role_id = r.id
  WHERE m.user_id = auth.uid();

  SELECT * INTO v_booking
  FROM private_lesson_bookings
  WHERE id = p_booking_id
    AND status IN ('pending', 'confirmed')
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found or not cancellable');
  END IF;

  IF v_booking.instructor_id = v_caller_member_id THEN
    UPDATE private_lesson_bookings
    SET status = 'cancelled_by_instructor',
        cancelled_at = NOW(),
        cancelled_by = v_caller_member_id,
        cancellation_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_booking_id;

  ELSIF v_caller_role = 'owner' THEN
    UPDATE private_lesson_bookings
    SET status = 'cancelled_by_instructor',
        cancelled_at = NOW(),
        cancelled_by = v_caller_member_id,
        cancellation_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_booking_id;

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

-- Decline a pending booking request
CREATE OR REPLACE FUNCTION decline_booking(
  p_booking_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_booking private_lesson_bookings%ROWTYPE;
  v_caller_member_id UUID;
  v_caller_role TEXT;
BEGIN
  SELECT m.id, r.name INTO v_caller_member_id, v_caller_role
  FROM members m JOIN roles r ON m.role_id = r.id
  WHERE m.user_id = auth.uid();

  SELECT * INTO v_booking
  FROM private_lesson_bookings
  WHERE id = p_booking_id
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found or not pending');
  END IF;

  IF v_booking.instructor_id != v_caller_member_id AND v_caller_role != 'owner' THEN
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
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE instructor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_lesson_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_message_reads ENABLE ROW LEVEL SECURITY;

-- instructor_availability: anyone authenticated can read
CREATE POLICY "Anyone can view availability" ON instructor_availability
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Instructors manage own availability, owner manages all
CREATE POLICY "Instructors manage own availability" ON instructor_availability
  FOR ALL USING (
    instructor_id = get_current_member_id()
    OR EXISTS (
      SELECT 1 FROM members m JOIN roles r ON m.role_id = r.id
      WHERE m.user_id = auth.uid() AND r.name = 'owner'
    )
  );

-- availability_overrides: anyone authenticated can read dates
CREATE POLICY "Anyone can view overrides" ON availability_overrides
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Instructors manage own overrides, owner manages all
CREATE POLICY "Instructors manage own overrides" ON availability_overrides
  FOR ALL USING (
    instructor_id = get_current_member_id()
    OR EXISTS (
      SELECT 1 FROM members m JOIN roles r ON m.role_id = r.id
      WHERE m.user_id = auth.uid() AND r.name = 'owner'
    )
  );

-- private_lesson_bookings: participants see own bookings, staff see all
CREATE POLICY "View own bookings" ON private_lesson_bookings
  FOR SELECT USING (
    member_id = get_current_member_id()
    OR instructor_id = get_current_member_id()
    OR is_staff()
  );

-- Direct INSERT/UPDATE blocked for members — use RPCs
CREATE POLICY "Staff manage bookings" ON private_lesson_bookings
  FOR ALL USING (is_staff());

-- booking_messages: booking participants can read
CREATE POLICY "Booking participants view messages" ON booking_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM private_lesson_bookings b
      WHERE b.id = booking_messages.booking_id
      AND (b.member_id = get_current_member_id()
           OR b.instructor_id = get_current_member_id())
    )
    OR is_staff()
  );

-- booking_messages: booking participants can send
CREATE POLICY "Booking participants send messages" ON booking_messages
  FOR INSERT WITH CHECK (
    sender_id = get_current_member_id()
    AND EXISTS (
      SELECT 1 FROM private_lesson_bookings b
      WHERE b.id = booking_messages.booking_id
      AND (b.member_id = get_current_member_id()
           OR b.instructor_id = get_current_member_id())
    )
  );

-- booking_message_reads: members manage own read markers
CREATE POLICY "Members manage own read markers" ON booking_message_reads
  FOR ALL USING (member_id = get_current_member_id());
