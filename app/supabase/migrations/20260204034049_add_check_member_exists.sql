-- Function to check if a member exists by email
-- SECURITY DEFINER bypasses RLS so anon can call it from the login page
-- Only returns a boolean — no data exposure
CREATE OR REPLACE FUNCTION check_member_exists(check_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM members WHERE email = lower(check_email));
END;
$$;
