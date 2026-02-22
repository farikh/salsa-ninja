-- =============================================
-- Seed super admin (Tafari)
-- The super admin's auth user must already exist
-- =============================================

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'tafari.k.higgs@gmail.com'
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    INSERT INTO super_admins (user_id, email, full_name, role)
    VALUES (admin_user_id, 'tafari.k.higgs@gmail.com', 'Tafari Higgs', 'super_admin')
    ON CONFLICT (user_id) DO NOTHING;
    RAISE NOTICE 'Super admin created for user: %', admin_user_id;
  ELSE
    RAISE WARNING 'User tafari.k.higgs@gmail.com not found in auth.users. Run this after first login.';
  END IF;
END $$;
