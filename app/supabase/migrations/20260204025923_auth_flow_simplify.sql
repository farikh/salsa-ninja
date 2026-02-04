-- Update auto_assign_role trigger to assign owner role for admin email
CREATE OR REPLACE FUNCTION auto_assign_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role_id IS NULL THEN
    IF NEW.email = 'tafari.k.higgs@gmail.com' THEN
      NEW.role_id := (SELECT id FROM roles WHERE name = 'owner');
    ELSE
      NEW.role_id := (SELECT id FROM roles WHERE name = 'guest');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
