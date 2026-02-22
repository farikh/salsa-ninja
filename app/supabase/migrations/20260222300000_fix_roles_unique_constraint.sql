-- ============================================================
-- Fix: Make roles.name unique per tenant instead of globally
-- ============================================================
-- The original roles table had a global UNIQUE constraint on name
-- (from the user_role enum inline UNIQUE). With multi-tenancy,
-- each tenant needs its own set of roles with the same names.
-- ============================================================

ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_name_key;
ALTER TABLE roles ADD CONSTRAINT roles_tenant_name_unique UNIQUE (tenant_id, name);
