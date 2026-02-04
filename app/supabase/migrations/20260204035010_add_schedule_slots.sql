-- Weekly class schedule grid
CREATE TABLE schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  class_name TEXT NOT NULL,
  class_level TEXT,
  color_key TEXT DEFAULT 'intermediate',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(day, time_slot)
);

-- RLS: public read, staff write
ALTER TABLE schedule_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view schedule"
  ON schedule_slots FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage schedule"
  ON schedule_slots FOR ALL
  USING (is_staff())
  WITH CHECK (is_staff());

-- Seed with current schedule data
INSERT INTO schedule_slots (day, time_slot, class_name, class_level, color_key) VALUES
  ('Monday', '6P-7P', 'Absolute Beginners Salsa On 1 Bootcamp', 'Bootcamp', 'bootcamp'),
  ('Monday', '7P-8P', 'L.A. Salsa On 1', 'LVL 1-2 Shine & Partner', 'intermediate'),
  ('Monday', '8P-9P', 'Bachata', 'Open Level', 'openLevel'),
  ('Monday', '9P-10P', 'Absolute Beginners Salsa On 1 Bootcamp', 'Bootcamp', 'bootcamp'),
  ('Tuesday', '7P-8P', 'Salsa On 2', 'LVL 1&2 Shine & Partner', 'intermediate'),
  ('Tuesday', '8P-9P', 'Salsa Caleña', 'Level 1 & 2', 'bootcamp'),
  ('Tuesday', '9P-10P', 'Team Training', '9PM-11PM', 'team'),
  ('Tuesday', '10P-11P', 'Team Training', 'Continued', 'team'),
  ('Wednesday', '6P-7P', 'Absolute Beginners Salsa On 1 Bootcamp', 'Bootcamp', 'bootcamp'),
  ('Wednesday', '7P-8P', 'L.A. Salsa On 1', 'LVL 2-3 Shine & Partner', 'intermediate'),
  ('Wednesday', '8P-9P', 'Bachata', 'Open Levels', 'openLevel'),
  ('Wednesday', '9P-10P', 'Absolute Beginners Salsa On 1 Bootcamp', 'Bootcamp', 'bootcamp'),
  ('Thursday', '7P-8P', 'Salsa On 1', 'Freestyle Fusion', 'intermediate'),
  ('Thursday', '8P-9P', 'Salsa On 2', 'Level 2-3 Partnerwork', 'openLevel'),
  ('Thursday', '9P-10P', 'Team Training', '9PM-11PM', 'team'),
  ('Thursday', '10P-11P', 'Team Training', 'Continued', 'team');
