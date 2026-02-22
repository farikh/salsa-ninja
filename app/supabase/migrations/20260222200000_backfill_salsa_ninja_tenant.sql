-- =============================================
-- Backfill: Make Salsa Ninja tenant #1
-- Runs AFTER all schema changes are in place
-- =============================================

DO $$
DECLARE
  salsa_ninja_id UUID;
  fuego_id UUID;
BEGIN
  -- Get the Fuego theme ID
  SELECT id INTO fuego_id FROM themes WHERE slug = 'fuego';

  IF fuego_id IS NULL THEN
    RAISE EXCEPTION 'Fuego theme not found. Ensure seed_themes migration has run.';
  END IF;

  -- Create the Salsa Ninja tenant
  INSERT INTO tenants (name, slug, theme_id, status, settings)
  VALUES (
    'Salsa Ninja Dance Academy',
    'salsa-ninja',
    fuego_id,
    'active',
    '{"timezone": "America/New_York", "city": "Sunrise, FL"}'::jsonb
  )
  RETURNING id INTO salsa_ninja_id;

  RAISE NOTICE 'Created Salsa Ninja tenant with ID: %', salsa_ninja_id;

  -- =========================================================
  -- Backfill all 26 existing data tables with tenant_id
  -- =========================================================

  -- Core membership
  UPDATE members SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE roles SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE member_roles SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE tags SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE member_tags SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;

  -- Events & schedule
  UPDATE events SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE event_series SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE event_rsvps SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE schedule_slots SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;

  -- Private lesson booking (from 20260204100000_private_lesson_booking.sql)
  UPDATE private_lesson_bookings SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE instructor_availability SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE availability_overrides SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE booking_messages SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE booking_message_reads SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;

  -- Video library
  UPDATE videos SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE video_tags SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE video_progress SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;

  -- Documents
  UPDATE documents SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;

  -- Messaging
  UPDATE channels SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE messages SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE direct_messages SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE announcements SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;

  -- Referrals & credits
  UPDATE referrals SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE member_credits SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;

  -- Admin
  UPDATE invite_codes SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;
  UPDATE analytics_events SET tenant_id = salsa_ninja_id WHERE tenant_id IS NULL;

  -- =========================================================
  -- Enforce NOT NULL on all 26 tenant_id columns
  -- =========================================================

  -- Core membership
  ALTER TABLE members ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE roles ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE member_roles ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE tags ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE member_tags ALTER COLUMN tenant_id SET NOT NULL;

  -- Events & schedule
  ALTER TABLE events ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE event_series ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE event_rsvps ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE schedule_slots ALTER COLUMN tenant_id SET NOT NULL;

  -- Private lesson booking
  ALTER TABLE private_lesson_bookings ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE instructor_availability ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE availability_overrides ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE booking_messages ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE booking_message_reads ALTER COLUMN tenant_id SET NOT NULL;

  -- Video library
  ALTER TABLE videos ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE video_tags ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE video_progress ALTER COLUMN tenant_id SET NOT NULL;

  -- Documents
  ALTER TABLE documents ALTER COLUMN tenant_id SET NOT NULL;

  -- Messaging
  ALTER TABLE channels ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE messages ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE direct_messages ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE announcements ALTER COLUMN tenant_id SET NOT NULL;

  -- Referrals & credits
  ALTER TABLE referrals ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE member_credits ALTER COLUMN tenant_id SET NOT NULL;

  -- Admin
  ALTER TABLE invite_codes ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE analytics_events ALTER COLUMN tenant_id SET NOT NULL;

  RAISE NOTICE 'Backfill complete. All data assigned to Salsa Ninja tenant.';
END $$;
