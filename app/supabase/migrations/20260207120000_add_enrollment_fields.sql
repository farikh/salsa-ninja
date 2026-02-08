-- ============================================================
-- Add enrollment plan and boot camp fields to members table
-- ============================================================

-- Enrollment plan: which class package the member is on
ALTER TABLE members ADD COLUMN IF NOT EXISTS enrollment_plan TEXT DEFAULT 'classes_5'
  CHECK (enrollment_plan IN ('classes_5', 'classes_8', 'unlimited'));

-- Boot camp enrollment toggle
ALTER TABLE members ADD COLUMN IF NOT EXISTS bootcamp_enrolled BOOLEAN DEFAULT FALSE;

-- Recreate member_profiles view to include new fields.
-- NOTE: This view is also recreated in 20260204140000_multi_role_support.sql.
-- The view uses m.* so new columns on members are automatically included,
-- but we recreate to be explicit. Must match the definition in the latest
-- migration that touches this view.
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
