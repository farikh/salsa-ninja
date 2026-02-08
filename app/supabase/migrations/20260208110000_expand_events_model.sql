-- ============================================================
-- Expand events table with full event details
-- ============================================================

-- Music genre (e.g., "Live DJ Set", "Salsa Mix", etc.)
ALTER TABLE events ADD COLUMN IF NOT EXISTS music_genre TEXT;

-- Tags as text array (e.g., BYOB, Light Bites, Free Parking)
ALTER TABLE events ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Dress code
ALTER TABLE events ADD COLUMN IF NOT EXISTS dress_code TEXT;

-- Flyer image URL (stored in Supabase Storage or Cloudflare R2)
ALTER TABLE events ADD COLUMN IF NOT EXISTS flyer_url TEXT;

-- Whether ticket purchase is enabled for this event
ALTER TABLE events ADD COLUMN IF NOT EXISTS purchase_enabled BOOLEAN DEFAULT FALSE;

-- Purchase URL (external link like Square, Eventbrite, etc.)
ALTER TABLE events ADD COLUMN IF NOT EXISTS purchase_url TEXT;
