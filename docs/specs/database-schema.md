# Database Schema

## Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     members      │       │      roles       │       │       tags       │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │──────▶│ id (PK)          │       │ id (PK)          │
│ user_id (FK)     │       │ name             │       │ name             │
│ role_id (FK)     │───────│ permissions      │       │ color            │
│ email            │       └──────────────────┘       │ type             │
│ full_name        │                                  └────────┬─────────┘
│ display_name     │                                           │
│ avatar_url       │       ┌──────────────────┐               │
│ phone            │       │   member_tags    │               │
│ preferred_lang   │       ├──────────────────┤               │
│ stripe_customer  │◀──────│ member_id (FK)   │───────────────┘
│ subscription_*   │       │ tag_id (FK)      │
│ referral_code    │       │ assigned_at      │
│ referred_by      │       └──────────────────┘
│ created_at       │
└────────┬─────────┘
         │
         │ 1:M
         ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     events       │       │   event_rsvps    │       │   event_series   │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │◀──────│ event_id (FK)    │       │ id (PK)          │
│ series_id (FK)   │───────│ member_id (FK)   │       │ title            │
│ title            │       │ status           │       │ recurrence_rule  │
│ description      │       │ waitlist_pos     │       │ start_date       │
│ event_type       │       │ attended         │       │ end_date         │
│ source           │       │ paid_at          │       └──────────────────┘
│ start_time       │       │ created_at       │
│ end_time         │       └──────────────────┘
│ location         │
│ capacity         │
│ price            │
│ visibility       │
│ visibility_tags  │
│ instructor_id    │
│ submitted_by     │
│ approval_status  │
│ created_at       │
└────────┬─────────┘
         │
         │ 1:M
         ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     videos       │       │   video_tags     │       │ video_progress   │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │◀──────│ video_id (FK)    │       │ video_id (FK)    │
│ title            │       │ tag (text)       │       │ member_id (FK)   │
│ description      │       └──────────────────┘       │ watched          │
│ video_url        │                                  │ watch_seconds    │
│ thumbnail_url    │◀─────────────────────────────────│ bookmarked       │
│ duration_seconds │                                  │ practiced        │
│ event_id (FK)    │                                  │ last_watched_at  │
│ instructor_id    │                                  └──────────────────┘
│ dance_style      │
│ difficulty       │
│ video_type       │
│ visibility       │
│ visibility_tags  │
│ uploaded_by      │
│ created_at       │
└──────────────────┘

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    channels      │       │    messages      │       │ direct_messages  │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │◀──────│ channel_id (FK)  │       │ id (PK)          │
│ name             │       │ sender_id (FK)   │       │ sender_id (FK)   │
│ description      │       │ content          │       │ recipient_id(FK) │
│ type             │       │ media_url        │       │ content          │
│ visibility       │       │ media_type       │       │ media_url        │
│ visibility_tags  │       │ reply_to_id      │       │ read_at          │
│ created_at       │       │ created_at       │       │ created_at       │
└──────────────────┘       └──────────────────┘       └──────────────────┘

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  announcements   │       │    referrals     │       │ member_credits   │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │       │ id (PK)          │
│ title            │       │ referrer_id (FK) │       │ member_id (FK)   │
│ body             │       │ referee_id (FK)  │       │ amount           │
│ image_url        │       │ code             │       │ source           │
│ target_tags      │       │ status           │       │ applied_invoice  │
│ published_at     │       │ referrer_reward  │       │ created_at       │
│ created_by       │       │ referee_discount │       │ applied_at       │
│ created_at       │       │ converted_at     │       └──────────────────┘
└──────────────────┘       └──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│    documents     │       │ analytics_events │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ title            │       │ event_type       │
│ file_url         │       │ member_id (FK)   │
│ file_type        │       │ metadata (JSONB) │
│ event_id (FK)    │       │ created_at       │
│ visibility       │       └──────────────────┘
│ visibility_tags  │
│ uploaded_by      │
│ created_at       │
└──────────────────┘
```

## Complete SQL Schema

```sql
-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('owner', 'instructor', 'member_full', 'member_limited', 'guest');
CREATE TYPE subscription_tier AS ENUM ('monthly', 'annual', 'drop_in', 'trial');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'none');
CREATE TYPE event_type AS ENUM ('class', 'workshop', 'bootcamp', 'studio_social', 'community');
CREATE TYPE event_source AS ENUM ('staff', 'member');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE rsvp_status AS ENUM ('going', 'maybe', 'not_going', 'waitlist');
CREATE TYPE visibility_level AS ENUM ('public', 'all_members', 'segment', 'attendees');
CREATE TYPE dance_style AS ENUM ('salsa_on1', 'salsa_on2', 'bachata', 'cha_cha', 'merengue', 'kizomba', 'other');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced', 'all_levels');
CREATE TYPE video_type AS ENUM ('full_class', 'breakdown', 'drill', 'combo', 'social_clip', 'promo');
CREATE TYPE channel_type AS ENUM ('public', 'segment', 'direct');
CREATE TYPE referral_status AS ENUM ('clicked', 'signed_up', 'converted', 'credited');
CREATE TYPE credit_source AS ENUM ('referral', 'promotion', 'manual', 'refund');
CREATE TYPE tag_type AS ENUM ('bootcamp', 'level', 'custom');
CREATE TYPE preferred_language AS ENUM ('en', 'es');

-- ============================================================
-- ROLES TABLE
-- ============================================================
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name user_role UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default roles
INSERT INTO roles (name, display_name, permissions) VALUES
  ('owner', 'Owner', '{
    "admin": true,
    "manage_instructors": true,
    "manage_members": true,
    "upload_videos": true,
    "create_events": true,
    "post_announcements": true,
    "view_revenue": true,
    "moderate_chat": true,
    "full_chat": true,
    "video_library": true,
    "rsvp": true
  }'),
  ('instructor', 'Instructor', '{
    "upload_videos": true,
    "create_events": true,
    "post_announcements": false,
    "view_attendance": true,
    "moderate_chat": true,
    "full_chat": true,
    "video_library": true,
    "rsvp": true
  }'),
  ('member_full', 'Member', '{
    "full_chat": true,
    "video_library": true,
    "rsvp": true,
    "submit_community_event": true
  }'),
  ('member_limited', 'Limited Member', '{
    "limited_chat": true,
    "rsvp": true
  }'),
  ('guest', 'Guest', '{
    "view_schedule": true,
    "purchase": true
  }');

-- ============================================================
-- MEMBERS TABLE
-- ============================================================
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) NOT NULL,

  -- Profile
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  preferred_language preferred_language DEFAULT 'en',
  bio TEXT,
  dance_experience TEXT,

  -- Stripe
  stripe_customer_id TEXT UNIQUE,
  subscription_tier subscription_tier,
  subscription_status subscription_status DEFAULT 'none',
  subscription_id TEXT,
  subscription_expires_at TIMESTAMPTZ,

  -- Referral
  referral_code TEXT UNIQUE NOT NULL DEFAULT SUBSTR(MD5(RANDOM()::TEXT), 1, 8),
  referred_by UUID REFERENCES members(id),

  -- Tracking
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_referral_code ON members(referral_code);
CREATE INDEX idx_members_stripe_customer ON members(stripe_customer_id);

-- ============================================================
-- TAGS TABLE
-- ============================================================
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  type tag_type DEFAULT 'custom',
  description TEXT,
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MEMBER_TAGS (Junction Table)
-- ============================================================
CREATE TABLE member_tags (
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES members(id),
  PRIMARY KEY (member_id, tag_id)
);

CREATE INDEX idx_member_tags_member ON member_tags(member_id);
CREATE INDEX idx_member_tags_tag ON member_tags(tag_id);

-- ============================================================
-- EVENT_SERIES TABLE (for recurring events)
-- ============================================================
CREATE TABLE event_series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  recurrence_rule TEXT NOT NULL,  -- iCal RRULE format
  start_date DATE NOT NULL,
  end_date DATE,
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVENTS TABLE
-- ============================================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  series_id UUID REFERENCES event_series(id) ON DELETE SET NULL,

  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL,
  source event_source NOT NULL DEFAULT 'staff',

  -- Time & Location
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',
  location TEXT,
  location_url TEXT,

  -- Capacity & Pricing
  capacity INT,
  price DECIMAL(10, 2) DEFAULT 0,
  stripe_price_id TEXT,

  -- Visibility
  visibility visibility_level DEFAULT 'all_members',
  visibility_tags UUID[] DEFAULT '{}',

  -- Staff
  instructor_id UUID REFERENCES members(id),

  -- Member submissions
  submitted_by UUID REFERENCES members(id),
  approval_status approval_status DEFAULT 'approved',
  external_url TEXT,

  -- Metadata
  dance_style dance_style,
  difficulty difficulty_level,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_instructor ON events(instructor_id);

-- ============================================================
-- EVENT_RSVPS TABLE
-- ============================================================
CREATE TABLE event_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  status rsvp_status NOT NULL DEFAULT 'going',
  waitlist_position INT,
  attended BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,

  -- Payment
  stripe_payment_intent TEXT,
  paid_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(event_id, member_id)
);

CREATE INDEX idx_event_rsvps_event ON event_rsvps(event_id);
CREATE INDEX idx_event_rsvps_member ON event_rsvps(member_id);

-- ============================================================
-- VIDEOS TABLE
-- ============================================================
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic info
  title TEXT NOT NULL,
  description TEXT,

  -- Media
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INT,
  file_size_bytes BIGINT,

  -- Classification
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  instructor_id UUID REFERENCES members(id),
  dance_style dance_style,
  difficulty difficulty_level,
  video_type video_type DEFAULT 'full_class',

  -- Visibility
  visibility visibility_level DEFAULT 'all_members',
  visibility_tags UUID[] DEFAULT '{}',

  -- Metadata
  uploaded_by UUID REFERENCES members(id),
  processing_status TEXT DEFAULT 'ready',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_videos_event ON videos(event_id);
CREATE INDEX idx_videos_instructor ON videos(instructor_id);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);

-- Full-text search index
CREATE INDEX idx_videos_search ON videos USING GIN (
  to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, ''))
);

-- ============================================================
-- VIDEO_TAGS TABLE
-- ============================================================
CREATE TABLE video_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_video_tags_video ON video_tags(video_id);
CREATE INDEX idx_video_tags_tag ON video_tags(tag);
CREATE INDEX idx_video_tags_search ON video_tags USING GIN (tag gin_trgm_ops);

-- ============================================================
-- VIDEO_PROGRESS TABLE
-- ============================================================
CREATE TABLE video_progress (
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  watched BOOLEAN DEFAULT FALSE,
  watch_time_seconds INT DEFAULT 0,
  bookmarked BOOLEAN DEFAULT FALSE,
  practiced BOOLEAN DEFAULT FALSE,
  last_watched_at TIMESTAMPTZ,
  PRIMARY KEY (video_id, member_id)
);

CREATE INDEX idx_video_progress_member ON video_progress(member_id);

-- ============================================================
-- DOCUMENTS TABLE
-- ============================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes BIGINT,

  event_id UUID REFERENCES events(id) ON DELETE SET NULL,

  visibility visibility_level DEFAULT 'all_members',
  visibility_tags UUID[] DEFAULT '{}',

  uploaded_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHANNELS TABLE
-- ============================================================
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type channel_type NOT NULL DEFAULT 'public',

  visibility visibility_level DEFAULT 'all_members',
  visibility_tags UUID[] DEFAULT '{}',

  is_archived BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default channels
INSERT INTO channels (name, description, type, visibility) VALUES
  ('general', 'General discussion for all members', 'public', 'all_members'),
  ('events', 'Event announcements and discussions', 'public', 'all_members'),
  ('socials', 'Share social dance events around town', 'public', 'all_members'),
  ('practice-partners', 'Find partners to practice with', 'public', 'all_members');

-- ============================================================
-- MESSAGES TABLE
-- ============================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES members(id) ON DELETE SET NULL,

  content TEXT,
  media_url TEXT,
  media_type TEXT,

  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_channel ON messages(channel_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(channel_id, created_at DESC);

-- Full-text search on messages
CREATE INDEX idx_messages_search ON messages USING GIN (
  to_tsvector('english', COALESCE(content, ''))
);

-- ============================================================
-- DIRECT_MESSAGES TABLE
-- ============================================================
CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES members(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES members(id) ON DELETE SET NULL,

  content TEXT,
  media_url TEXT,
  media_type TEXT,

  read_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dm_sender ON direct_messages(sender_id);
CREATE INDEX idx_dm_recipient ON direct_messages(recipient_id);
CREATE INDEX idx_dm_conversation ON direct_messages(
  LEAST(sender_id, recipient_id),
  GREATEST(sender_id, recipient_id),
  created_at DESC
);

-- ============================================================
-- ANNOUNCEMENTS TABLE
-- ============================================================
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,

  target_tags UUID[] DEFAULT '{}',

  is_pinned BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  created_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_announcements_published ON announcements(published_at DESC);

-- ============================================================
-- REFERRALS TABLE
-- ============================================================
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES members(id) ON DELETE SET NULL,
  referee_id UUID REFERENCES members(id) ON DELETE SET NULL,
  code TEXT NOT NULL,

  status referral_status NOT NULL DEFAULT 'clicked',
  referrer_reward DECIMAL(10, 2),
  referee_discount DECIMAL(10, 2),

  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  signed_up_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  credited_at TIMESTAMPTZ
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_code ON referrals(code);

-- ============================================================
-- MEMBER_CREDITS TABLE
-- ============================================================
CREATE TABLE member_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  source credit_source NOT NULL,
  description TEXT,

  applied_to_invoice TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  applied_at TIMESTAMPTZ
);

CREATE INDEX idx_member_credits_member ON member_credits(member_id);

-- ============================================================
-- ANALYTICS_EVENTS TABLE
-- ============================================================
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_member ON analytics_events(member_id);
CREATE INDEX idx_analytics_created ON analytics_events(created_at DESC);

-- ============================================================
-- INVITE_CODES TABLE
-- ============================================================
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL DEFAULT SUBSTR(MD5(RANDOM()::TEXT), 1, 8),
  created_by UUID REFERENCES members(id),

  max_uses INT DEFAULT 1,
  used_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,

  source TEXT,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invite_codes_code ON invite_codes(code);
```

## Helper Functions

```sql
-- Get current member ID
CREATE OR REPLACE FUNCTION get_current_member_id()
RETURNS UUID AS $$
  SELECT id FROM members WHERE user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if current user is staff
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM members m
    JOIN roles r ON m.role_id = r.id
    WHERE m.user_id = auth.uid()
    AND r.name IN ('owner', 'instructor')
  )
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if current user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid()
    AND subscription_status = 'active'
    AND subscription_tier IN ('monthly', 'annual')
  )
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if user has any of the specified tags
CREATE OR REPLACE FUNCTION has_any_tag(tag_ids UUID[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM member_tags mt
    JOIN members m ON mt.member_id = m.id
    WHERE m.user_id = auth.uid()
    AND mt.tag_id = ANY(tag_ids)
  )
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if user attended an event
CREATE OR REPLACE FUNCTION attended_event(p_event_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM event_rsvps er
    JOIN members m ON er.member_id = m.id
    WHERE m.user_id = auth.uid()
    AND er.event_id = p_event_id
    AND er.status = 'going'
  )
$$ LANGUAGE SQL SECURITY DEFINER;
```

## Row Level Security Policies

```sql
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_credits ENABLE ROW LEVEL SECURITY;

-- Members policies
CREATE POLICY "Members can view other members" ON members
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Members can update own profile" ON members
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Staff can manage members" ON members
  FOR ALL USING (is_staff());

-- Events policies
CREATE POLICY "View approved events" ON events
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND (
      visibility = 'public'
      OR visibility = 'all_members'
      OR (visibility = 'segment' AND has_any_tag(visibility_tags))
    )
    AND (approval_status = 'approved' OR submitted_by = get_current_member_id())
  );

CREATE POLICY "Staff can manage events" ON events
  FOR ALL USING (is_staff());

-- Videos policies
CREATE POLICY "View authorized videos" ON videos
  FOR SELECT USING (
    is_staff()
    OR (
      has_active_subscription()
      AND (
        visibility = 'all_members'
        OR (visibility = 'segment' AND has_any_tag(visibility_tags))
        OR (visibility = 'attendees' AND attended_event(event_id))
      )
    )
  );

CREATE POLICY "Staff can manage videos" ON videos
  FOR ALL USING (is_staff());

-- Messages policies
CREATE POLICY "View channel messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM channels c
      WHERE c.id = messages.channel_id
      AND (
        c.visibility = 'all_members'
        OR (c.visibility = 'segment' AND has_any_tag(c.visibility_tags))
        OR is_staff()
      )
    )
    AND (has_active_subscription() OR is_staff())
  );

CREATE POLICY "Send channel messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = get_current_member_id()
    AND (has_active_subscription() OR is_staff())
  );

-- DM policies
CREATE POLICY "View own DMs" ON direct_messages
  FOR SELECT USING (
    sender_id = get_current_member_id()
    OR recipient_id = get_current_member_id()
  );

CREATE POLICY "Send DMs" ON direct_messages
  FOR INSERT WITH CHECK (
    sender_id = get_current_member_id()
    AND (has_active_subscription() OR is_staff())
  );
```

## Triggers

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-assign role based on subscription
CREATE OR REPLACE FUNCTION auto_assign_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_status = 'active' AND NEW.subscription_tier IN ('monthly', 'annual') THEN
    SELECT id INTO NEW.role_id FROM roles WHERE name = 'member_full';
  ELSIF NEW.subscription_status = 'active' AND NEW.subscription_tier = 'drop_in' THEN
    SELECT id INTO NEW.role_id FROM roles WHERE name = 'member_limited';
  ELSIF NEW.role_id IS NULL THEN
    SELECT id INTO NEW.role_id FROM roles WHERE name = 'guest';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_assign_member_role
  BEFORE INSERT OR UPDATE OF subscription_status, subscription_tier ON members
  FOR EACH ROW EXECUTE FUNCTION auto_assign_role();
```

## Views

```sql
CREATE OR REPLACE VIEW member_profiles AS
SELECT
  m.*,
  r.name as role_name,
  r.permissions,
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

CREATE OR REPLACE VIEW upcoming_events AS
SELECT
  e.*,
  m.display_name as instructor_name,
  m.avatar_url as instructor_avatar,
  (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND status = 'going') as rsvp_count,
  (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND status = 'waitlist') as waitlist_count
FROM events e
LEFT JOIN members m ON e.instructor_id = m.id
WHERE e.start_time > NOW()
AND e.approval_status = 'approved'
ORDER BY e.start_time ASC;
```
