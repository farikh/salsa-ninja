# Chat System Architecture

> **Bead:** app-5gx (Design chat architecture)
> **Status:** Reviewed — 5 review rounds passed, no CRITICAL or HIGH issues remaining
> **Date:** 2026-02-03
> **Research:** [Research Findings](../../research/chat-research-findings.md) | [Solution Analysis](../../research/chat-solution-analysis.md)
> **Original Spec:** [Chat Feature Spec](chat.md)

---

## 1. Overview

Real-time community chat for 50-200 dance studio members. Built on the existing Supabase stack (PostgreSQL, Auth, Realtime, Storage) with custom shadcn/ui components. No additional infrastructure.

### Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App (Vercel)                     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Chat Pages   │  │ Chat         │  │ API Routes       │  │
│  │ /chat        │  │ Components   │  │ /api/chat/*      │  │
│  │ /chat/[id]   │  │ (shadcn/ui)  │  │ /api/cron/digest │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────────┘  │
│         │                 │                  │              │
│  ┌──────┴─────────────────┴──────────────────┴───────────┐  │
│  │              Supabase Client (@supabase/ssr)          │  │
│  └──────┬──────────────┬───────────────┬────────────────┘   │
└─────────┼──────────────┼───────────────┼────────────────────┘
          │              │               │
┌─────────┼──────────────┼───────────────┼────────────────────┐
│         ▼              ▼               ▼     Supabase       │
│  ┌────────────┐ ┌────────────┐ ┌─────────────┐             │
│  │ PostgreSQL │ │  Realtime  │ │   Storage   │             │
│  │  (Tables,  │ │ Broadcast  │ │  (Media     │             │
│  │  RLS,      │ │ Presence   │ │  Uploads)   │             │
│  │  Functions)│ │            │ │             │             │
│  └────────────┘ └────────────┘ └─────────────┘             │
│                                                             │
│  ┌────────────────┐  ┌──────────────────────────────┐      │
│  │ Edge Functions │  │ Database Webhooks             │      │
│  │ (Notifications)│◀─│ (INSERT on messages/DMs)      │      │
│  └───────┬────────┘  └──────────────────────────────┘      │
│          │                                                  │
└──────────┼──────────────────────────────────────────────────┘
           ▼
    ┌────────────┐
    │   Resend   │
    │  (Email)   │
    └────────────┘
```

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Message delivery | Broadcast + DB persist | Broadcast is fast but no delivery guarantee; DB ensures reliability |
| Threading | Simple `reply_to_id` | WhatsApp-style; zero schema changes; migration path to threads later |
| UI components | Custom shadcn/ui | Visual consistency; Tailwind-native; chatscope SCSS incompatible |
| Read tracking | Per-channel `last_read_at` | Matches Slack/Discord; 1 row per user per channel |
| Notifications | Email via Edge Functions + Resend | Universal; free tier sufficient; well-documented pattern |
| Typing indicators | Broadcast (ephemeral) | No persistence needed; throttle at 3s |
| Presence | Supabase Presence API | CRDT-based; no DB writes per heartbeat |
| Media storage | Supabase Storage | Already in stack; RLS-compatible |

---

## 2. Database Schema

### 2.1 Modified Tables

#### messages (enhanced from existing spec)

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES members(id) ON DELETE SET NULL,
    content JSONB NOT NULL,                    -- Structured content (see 2.4)
    plain_text TEXT,                            -- Plain text extraction for search
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    reply_count INT NOT NULL DEFAULT 0,        -- Maintained by trigger
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,                    -- Soft delete (null = not deleted)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Core query indexes
CREATE INDEX idx_messages_channel_created ON messages(channel_id, created_at DESC);
CREATE INDEX idx_messages_reply_to ON messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- Full-text search
CREATE INDEX idx_messages_search ON messages USING GIN (to_tsvector('english', plain_text));
```

**Changes from original spec:**
- `content` changed from TEXT to JSONB (structured rich text with mentions)
- Added `plain_text` for full-text search extraction
- Added `reply_count` (trigger-maintained)
- Changed `is_deleted` boolean to `deleted_at` timestamp (soft delete with timing)
- Added `edited_at` timestamp
- Removed `media_url` and `media_type` (moved to `message_attachments`)

#### direct_messages (enhanced)

```sql
CREATE TABLE direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    content JSONB NOT NULL,
    plain_text TEXT,
    reply_to_id UUID REFERENCES direct_messages(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,                       -- Per-message read receipt (DMs only)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dm_conversation ON direct_messages(
    LEAST(sender_id, recipient_id),
    GREATEST(sender_id, recipient_id),
    created_at DESC
);
CREATE INDEX idx_dm_recipient_unread ON direct_messages(recipient_id)
    WHERE read_at IS NULL;

-- Functional index for conversation_hash lookups (used by Storage RLS)
CREATE INDEX idx_dm_conversation_hash ON direct_messages(
    md5(LEAST(sender_id::text, recipient_id::text)
     || GREATEST(sender_id::text, recipient_id::text))
);
```

### 2.2 New Tables

```sql
-- Channel membership and read tracking
CREATE TABLE channel_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    mention_count INT NOT NULL DEFAULT 0,
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    role TEXT NOT NULL DEFAULT 'member'
        CHECK (role IN ('member', 'moderator', 'admin')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (channel_id, user_id)
);

CREATE INDEX idx_channel_members_user ON channel_members(user_id);
CREATE INDEX idx_channel_members_channel ON channel_members(channel_id);

-- Message reactions
CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,                        -- Unicode emoji or shortcode
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (message_id, user_id, emoji)        -- One reaction type per user per message
);

CREATE INDEX idx_reactions_message ON message_reactions(message_id);

-- Message attachments (files, images, links)
CREATE TABLE message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    dm_id UUID REFERENCES direct_messages(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('image', 'file', 'video', 'audio', 'link')),
    url TEXT NOT NULL,                          -- Supabase Storage URL or external link
    filename TEXT,
    file_size INT,
    mime_type TEXT,
    metadata JSONB DEFAULT '{}',               -- Dimensions, duration, link preview data
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (message_id IS NOT NULL OR dm_id IS NOT NULL)
);

CREATE INDEX idx_attachments_message ON message_attachments(message_id)
    WHERE message_id IS NOT NULL;
CREATE INDEX idx_attachments_dm ON message_attachments(dm_id)
    WHERE dm_id IS NOT NULL;

-- Notification preferences
CREATE TABLE notification_preferences (
    member_id UUID PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
    dm_notifications TEXT NOT NULL DEFAULT 'immediate'
        CHECK (dm_notifications IN ('immediate', 'digest', 'off')),
    mention_notifications TEXT NOT NULL DEFAULT 'immediate'
        CHECK (mention_notifications IN ('immediate', 'digest', 'off')),
    channel_notifications TEXT NOT NULL DEFAULT 'off'
        CHECK (channel_notifications IN ('digest', 'off')),
    digest_frequency TEXT NOT NULL DEFAULT '15min'
        CHECK (digest_frequency IN ('15min', 'hourly', 'daily')),
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    quiet_hours_timezone TEXT DEFAULT 'America/New_York',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Muted channels
CREATE TABLE muted_channels (
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    muted_until TIMESTAMPTZ,                   -- NULL = indefinitely muted
    PRIMARY KEY (member_id, channel_id)
);
```

### 2.3 Database Functions and Triggers

```sql
-- Reply count trigger (handles INSERT, DELETE, and soft-delete via UPDATE)
CREATE OR REPLACE FUNCTION update_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.reply_to_id IS NOT NULL THEN
        UPDATE messages SET reply_count = reply_count + 1 WHERE id = NEW.reply_to_id;
    ELSIF TG_OP = 'DELETE' AND OLD.reply_to_id IS NOT NULL THEN
        UPDATE messages SET reply_count = reply_count - 1 WHERE id = OLD.reply_to_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.reply_to_id IS NOT NULL THEN
        -- Soft delete: decrement parent reply_count
        IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
            UPDATE messages SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = NEW.reply_to_id;
        -- Un-delete (restore): increment parent reply_count
        ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
            UPDATE messages SET reply_count = reply_count + 1 WHERE id = NEW.reply_to_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_reply_count
    AFTER INSERT OR DELETE OR UPDATE OF deleted_at ON messages
    FOR EACH ROW EXECUTE FUNCTION update_reply_count();

-- Column-level validation for message updates (enforces C2 security)
-- Prevents unauthorized column changes via RLS UPDATE policies.
CREATE OR REPLACE FUNCTION validate_message_update()
RETURNS TRIGGER AS $$
DECLARE
    is_owner BOOLEAN;
    is_mod BOOLEAN;
BEGIN
    is_owner := (OLD.sender_id = get_current_member_id());
    is_mod := EXISTS (
        SELECT 1 FROM channel_members cm
        WHERE cm.channel_id = OLD.channel_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('moderator', 'admin')
    );

    -- Non-owners (moderators) can only soft-delete
    IF NOT is_owner THEN
        IF NEW.content IS DISTINCT FROM OLD.content
            OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
            OR NEW.channel_id IS DISTINCT FROM OLD.channel_id
            OR NEW.reply_to_id IS DISTINCT FROM OLD.reply_to_id
            OR NEW.is_edited IS DISTINCT FROM OLD.is_edited
            OR NEW.edited_at IS DISTINCT FROM OLD.edited_at THEN
            RAISE EXCEPTION 'Moderators can only soft-delete messages';
        END IF;
    END IF;

    -- Owners can edit content or soft-delete, but not change structural fields
    IF is_owner THEN
        IF NEW.sender_id IS DISTINCT FROM OLD.sender_id
            OR NEW.channel_id IS DISTINCT FROM OLD.channel_id
            OR NEW.reply_to_id IS DISTINCT FROM OLD.reply_to_id THEN
            RAISE EXCEPTION 'Cannot change message sender, channel, or reply target';
        END IF;
        -- Auto-set edit tracking when content changes
        IF NEW.content IS DISTINCT FROM OLD.content AND NEW.deleted_at IS NULL THEN
            NEW.is_edited := TRUE;
            NEW.edited_at := NOW();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_validate_update
    BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION validate_message_update();

-- Column-level validation for channel_members updates
-- Prevents non-admin members from escalating their own role or changing structural fields.
CREATE OR REPLACE FUNCTION validate_channel_member_update()
RETURNS TRIGGER AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    is_admin := is_staff();  -- SECURITY DEFINER helper, see database-schema.md

    -- Non-admins can only update read state and notification preferences
    IF NOT is_admin THEN
        IF NEW.role IS DISTINCT FROM OLD.role
            OR NEW.channel_id IS DISTINCT FROM OLD.channel_id
            OR NEW.user_id IS DISTINCT FROM OLD.user_id
            OR NEW.joined_at IS DISTINCT FROM OLD.joined_at THEN
            RAISE EXCEPTION 'Only admins can change channel membership role or structural fields';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER channel_members_validate_update
    BEFORE UPDATE ON channel_members
    FOR EACH ROW EXECUTE FUNCTION validate_channel_member_update();

-- Column-level validation for DM updates
-- Recipients can only update read_at. Senders can update content/deleted_at.
CREATE OR REPLACE FUNCTION validate_dm_update()
RETURNS TRIGGER AS $$
DECLARE
    is_sender BOOLEAN;
BEGIN
    is_sender := (OLD.sender_id = get_current_member_id());

    -- Prevent anyone from changing structural fields
    IF NEW.sender_id IS DISTINCT FROM OLD.sender_id
        OR NEW.recipient_id IS DISTINCT FROM OLD.recipient_id
        OR NEW.reply_to_id IS DISTINCT FROM OLD.reply_to_id THEN
        RAISE EXCEPTION 'Cannot change DM sender, recipient, or reply target';
    END IF;

    -- Recipients can only update read_at
    IF NOT is_sender THEN
        IF NEW.content IS DISTINCT FROM OLD.content
            OR NEW.plain_text IS DISTINCT FROM OLD.plain_text
            OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
            RAISE EXCEPTION 'Recipients can only mark DMs as read';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dm_validate_update
    BEFORE UPDATE ON direct_messages
    FOR EACH ROW EXECUTE FUNCTION validate_dm_update();

-- Get unread counts for sidebar (excludes user's own messages)
-- Uses auth.uid() internally — no user_id parameter to prevent unauthorized access.
CREATE OR REPLACE FUNCTION get_unread_counts()
RETURNS TABLE(channel_id UUID, unread_count BIGINT, mention_count INT)
LANGUAGE sql STABLE SECURITY INVOKER AS $$
    SELECT cm.channel_id,
        COUNT(m.id) AS unread_count,
        cm.mention_count
    FROM channel_members cm
    LEFT JOIN messages m
        ON m.channel_id = cm.channel_id
        AND m.created_at > cm.last_read_at
        AND m.deleted_at IS NULL
        AND m.sender_id != get_current_member_id()
    WHERE cm.user_id = auth.uid()
    GROUP BY cm.channel_id, cm.mention_count;
$$;

-- Mark channel as read (uses auth.uid() — caller can only mark their own channels)
CREATE OR REPLACE FUNCTION mark_channel_read(p_channel_id UUID)
RETURNS VOID LANGUAGE sql SECURITY INVOKER AS $$
    UPDATE channel_members
    SET last_read_at = NOW(), mention_count = 0
    WHERE user_id = auth.uid() AND channel_id = p_channel_id;
$$;

-- Mark all channels as read (uses auth.uid() — caller can only mark their own)
CREATE OR REPLACE FUNCTION mark_all_read()
RETURNS VOID LANGUAGE sql SECURITY INVOKER AS $$
    UPDATE channel_members
    SET last_read_at = NOW(), mention_count = 0
    WHERE user_id = auth.uid();
$$;

-- Extract plain text from JSONB content (for search indexing)
-- Handles malformed content gracefully via exception handler.
CREATE OR REPLACE FUNCTION extract_plain_text(content JSONB)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    result TEXT := '';
    node JSONB;
BEGIN
    IF content IS NULL THEN RETURN ''; END IF;

    FOR node IN SELECT * FROM jsonb_array_elements(content) LOOP
        IF node->>'text' IS NOT NULL THEN
            result := result || ' ' || (node->>'text');
        END IF;
        IF node->'children' IS NOT NULL THEN
            result := result || ' ' || extract_plain_text(node->'children');
        END IF;
    END LOOP;

    RETURN TRIM(result);
EXCEPTION WHEN OTHERS THEN
    RETURN '';
END;
$$;

-- Auto-extract plain_text on message insert/update
CREATE OR REPLACE FUNCTION messages_extract_text()
RETURNS TRIGGER AS $$
BEGIN
    NEW.plain_text := extract_plain_text(NEW.content);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_plain_text
    BEFORE INSERT OR UPDATE OF content ON messages
    FOR EACH ROW EXECUTE FUNCTION messages_extract_text();
```

### 2.4 Message Content Format

Messages use structured JSONB content for rich text with mentions:

```json
[
  {
    "type": "p",
    "children": [
      { "text": "Hey " },
      {
        "type": "mention",
        "userId": "uuid-here",
        "children": [{ "text": "@Maria" }]
      },
      { "text": ", are you coming to bachata practice Saturday?" }
    ]
  }
]
```

**Supported node types:**
- `p` — Paragraph (block)
- `mention` — User mention (inline, contains `userId`)
- Text leaf — `{ "text": "..." }` with optional `bold`, `italic`, `code` flags

Mentions are extracted from the JSONB tree by the notification Edge Function for @mention alerts.

### 2.5 Row Level Security

> **Dual-identity model:** Chat tables use two FK patterns intentionally:
>
> | Pattern | Tables | FK Target | RLS Check | Why |
> |---------|--------|-----------|-----------|-----|
> | `auth.uid()` | `channel_members`, `message_reactions` | `auth.users(id)` | `auth.uid()` | Access control tables checked in every message RLS policy — `auth.uid()` avoids a subquery per evaluation |
> | `get_current_member_id()` | `messages`, `direct_messages`, `notification_preferences`, `muted_channels` | `members(id)` | `get_current_member_id()` | Content/profile tables — joined to `members` for display name/avatar |
>
> **Invariant:** Every chat-enabled user MUST have both an `auth.users` row and a `members` row with a 1:1 mapping. Both rows are created atomically during the registration flow (see `auth-and-roles.md`).
>
> **Required schema prerequisite:** `members.user_id` MUST have a UNIQUE constraint:
> ```sql
> ALTER TABLE members ADD CONSTRAINT members_user_id_unique UNIQUE (user_id);
> ```
> Without this, `get_current_member_id()` could return multiple rows, breaking all chat RLS policies. See `database-schema.md` for the function definition.

```sql
-- Enable RLS on all chat tables
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE muted_channels ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- MESSAGES (sender_id → members.id, use get_current_member_id())
-- ============================================================

-- Messages: read if member of channel
CREATE POLICY "Channel members can read messages"
    ON messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM channel_members cm
        WHERE cm.channel_id = messages.channel_id
        AND cm.user_id = auth.uid()
    ));

-- Messages: insert if member of channel
CREATE POLICY "Channel members can send messages"
    ON messages FOR INSERT
    WITH CHECK (
        sender_id = get_current_member_id()
        AND EXISTS (
            SELECT 1 FROM channel_members cm
            WHERE cm.channel_id = messages.channel_id
            AND cm.user_id = auth.uid()
        )
    );

-- Messages: owners can edit content, anyone allowed can soft delete.
-- Column-level restrictions enforced by validate_message_update() trigger (see 2.3).
CREATE POLICY "Users can update own messages"
    ON messages FOR UPDATE
    USING (sender_id = get_current_member_id())
    WITH CHECK (sender_id = get_current_member_id());

CREATE POLICY "Moderators can update messages in their channels"
    ON messages FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM channel_members cm
        WHERE cm.channel_id = messages.channel_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('moderator', 'admin')
    ));

-- ============================================================
-- DIRECT MESSAGES (sender_id/recipient_id → members.id)
-- ============================================================

CREATE POLICY "DM participants can read"
    ON direct_messages FOR SELECT
    USING (
        sender_id = get_current_member_id()
        OR recipient_id = get_current_member_id()
    );

CREATE POLICY "Users can send DMs"
    ON direct_messages FOR INSERT
    WITH CHECK (
        sender_id = get_current_member_id()
        AND sender_id != recipient_id  -- Prevent self-DMs
    );

-- Sender can edit content or soft-delete own DMs
CREATE POLICY "Senders can update own DMs"
    ON direct_messages FOR UPDATE
    USING (sender_id = get_current_member_id())
    WITH CHECK (sender_id = get_current_member_id());

-- Recipient can mark DMs as read (update read_at)
CREATE POLICY "Recipients can mark DMs read"
    ON direct_messages FOR UPDATE
    USING (recipient_id = get_current_member_id())
    WITH CHECK (recipient_id = get_current_member_id());

-- ============================================================
-- CHANNEL MEMBERS (user_id → auth.users.id, use auth.uid())
-- ============================================================

-- Co-members of the same channel can see each other (needed for member lists, presence)
CREATE POLICY "Channel co-members can see each other"
    ON channel_members FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM channel_members my
        WHERE my.user_id = auth.uid()
        AND my.channel_id = channel_members.channel_id
    ));

-- Users can update their own read state (column scope enforced by trigger below)
CREATE POLICY "Users update own read state"
    ON channel_members FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admins can update any channel member (role changes, etc.)
CREATE POLICY "Admins update channel members"
    ON channel_members FOR UPDATE
    USING (is_staff());

-- Admins can manage channel memberships
CREATE POLICY "Admins manage channel members"
    ON channel_members FOR INSERT
    WITH CHECK (is_staff());

CREATE POLICY "Admins can remove channel members"
    ON channel_members FOR DELETE
    USING (
        is_staff()                    -- Admins can remove anyone
        OR user_id = auth.uid()       -- Users can leave channels themselves
    );

-- ============================================================
-- REACTIONS (user_id → auth.users.id)
-- ============================================================

CREATE POLICY "Channel members can read reactions"
    ON message_reactions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM messages m
        JOIN channel_members cm ON cm.channel_id = m.channel_id
        WHERE m.id = message_reactions.message_id
        AND cm.user_id = auth.uid()
    ));

-- Add reaction: must be channel member
CREATE POLICY "Channel members can add reactions"
    ON message_reactions FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM messages m
            JOIN channel_members cm ON cm.channel_id = m.channel_id
            WHERE m.id = message_reactions.message_id
            AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove own reactions"
    ON message_reactions FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================
-- NOTIFICATION PREFERENCES (member_id → members.id)
-- ============================================================

CREATE POLICY "Users manage own notification preferences"
    ON notification_preferences FOR ALL
    USING (member_id = get_current_member_id());

-- ============================================================
-- MUTED CHANNELS (member_id → members.id)
-- ============================================================

CREATE POLICY "Users manage own muted channels"
    ON muted_channels FOR ALL
    USING (member_id = get_current_member_id());

-- ============================================================
-- ATTACHMENTS
-- ============================================================

-- Read: if can read the parent message
CREATE POLICY "Read attachments with message access"
    ON message_attachments FOR SELECT
    USING (
        (message_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM messages m
            JOIN channel_members cm ON cm.channel_id = m.channel_id
            WHERE m.id = message_attachments.message_id
            AND cm.user_id = auth.uid()
        ))
        OR
        (dm_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM direct_messages dm
            WHERE dm.id = message_attachments.dm_id
            AND (dm.sender_id = get_current_member_id()
                 OR dm.recipient_id = get_current_member_id())
        ))
    );

-- Insert: if sender of the parent message
CREATE POLICY "Users can add attachments to own messages"
    ON message_attachments FOR INSERT
    WITH CHECK (
        (message_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM messages m
            WHERE m.id = message_attachments.message_id
            AND m.sender_id = get_current_member_id()
        ))
        OR
        (dm_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM direct_messages dm
            WHERE dm.id = message_attachments.dm_id
            AND dm.sender_id = get_current_member_id()
        ))
    );
```

---

## 3. Realtime Integration

### 3.1 Message Flow

```
User types message
    │
    ├── 1. INSERT into messages table (persistence)
    │
    ├── 2. Broadcast to channel:{channel_id} (instant delivery)
    │       payload: { message, sender }
    │
    └── 3. Database Webhook fires (async)
            └── Edge Function: check recipients, send email if offline
```

**Client subscription pattern:**

```typescript
// Subscribe to a channel's messages
const channel = supabase.channel(`chat:${channelId}`)

// Receive broadcast messages (instant)
channel.on('broadcast', { event: 'new_message' }, (payload) => {
  addMessage(payload.message)
})

// Track presence (online users)
channel.on('presence', { event: 'sync' }, () => {
  setOnlineUsers(channel.presenceState())
})

channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await channel.track({ userId: currentUser.id })
  }
})
```

**Sending a message:**

```typescript
async function sendMessage(channelId: string, content: MessageContent) {
  // 1. Persist to database
  const { data: message } = await supabase
    .from('messages')
    .insert({ channel_id: channelId, sender_id: currentUser.id, content })
    .select()
    .single()

  // 2. Broadcast for instant delivery
  await supabase.channel(`chat:${channelId}`).send({
    type: 'broadcast',
    event: 'new_message',
    payload: { message }
  })
}
```

### 3.2 Reconnection Logic

On WebSocket reconnect, fetch missed messages. Client-side deduplication prevents
duplicates between broadcast-received messages and DB-fetched catch-up messages:

```typescript
// Deduplication: track known message IDs to prevent duplicates
const knownMessageIds = new Set<string>()

function addMessage(message: Message) {
  if (knownMessageIds.has(message.id)) return  // Skip duplicates
  knownMessageIds.add(message.id)
  // ... add to state
}

async function handleReconnect(channelId: string, lastMessageTimestamp: string) {
  const { data: missedMessages } = await supabase
    .from('messages')
    .select('*, sender:members(display_name, avatar_url)')
    .eq('channel_id', channelId)
    .gt('created_at', lastMessageTimestamp)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  missedMessages?.forEach(addMessage)  // addMessage deduplicates automatically
}
```

### 3.3 Typing Indicators

```typescript
const typingChannel = supabase.channel(`typing:${channelId}`)

// Send typing event (throttled to 1 per 3 seconds)
const sendTyping = throttle(() => {
  typingChannel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { userId: currentUser.id, displayName: currentUser.displayName }
  })
}, 3000)

// Listen for typing events
typingChannel.on('broadcast', { event: 'typing' }, ({ payload }) => {
  setTypingUsers(prev => ({ ...prev, [payload.userId]: Date.now() }))
  // Auto-clear after 4 seconds (must exceed throttle interval of 3s to avoid flicker)
  setTimeout(() => {
    setTypingUsers(prev => {
      const next = { ...prev }
      if (Date.now() - next[payload.userId] >= 4000) delete next[payload.userId]
      return next
    })
  }, 4000)
})
```

---

## 4. UI Component Architecture

### 4.1 Page Structure

```
/chat                    → Channel list + selected channel
/chat/channel/[id]       → Channel messages (mobile: full screen)
/chat/dm/[userId]        → Direct message conversation
/chat/settings           → Notification preferences
```

### 4.2 Component Tree

```
ChatLayout
├── ChatSidebar
│   ├── ChannelList
│   │   ├── ChannelItem (name, unread badge, mute indicator)
│   │   └── CreateChannelButton (admin only)
│   ├── DMList
│   │   ├── DMItem (avatar, name, last message preview, unread dot)
│   │   └── NewDMButton
│   └── OnlineUsersList (presence-driven)
│
├── ChatMain
│   ├── ChatHeader (channel/DM name, member count, search)
│   ├── MessageList
│   │   ├── UnreadDivider ("X unread messages")
│   │   ├── DateSeparator
│   │   ├── MessageBubble
│   │   │   ├── Avatar
│   │   │   ├── SenderName
│   │   │   ├── ReplyPreview (if reply_to_id set)
│   │   │   ├── MessageContent (renders JSONB nodes)
│   │   │   ├── AttachmentPreview (images, files)
│   │   │   ├── ReactionBar (emoji reactions)
│   │   │   ├── ReplyCount ("3 replies")
│   │   │   └── MessageActions (reply, react, edit, delete)
│   │   └── TypingIndicator
│   └── MessageInput
│       ├── ReplyingTo (shows reply context when active)
│       ├── TextArea (auto-resize, mention autocomplete)
│       ├── AttachmentButton (file/image upload)
│       └── SendButton
│
└── MobileNav (bottom tabs: channels, DMs, settings)
```

### 4.3 Responsive Behavior

- **Desktop (lg+):** Two-column layout — sidebar + chat main
- **Tablet (md):** Collapsible sidebar, chat main fills width
- **Mobile (< md):** Single column — channel list OR message view (not both). Back button to return to list.

---

## 5. Notification Pipeline

### 5.1 DM Notifications (Immediate)

```
direct_messages INSERT
    → Database Webhook (pg_net)
    → Edge Function: notify-dm
        1. Fetch recipient's notification_preferences
        2. Skip if dm_notifications = 'off'
        3. Skip if quiet hours active
        4. Skip if recipient is online (check Presence)
        5. Send email via Resend API
```

### 5.2 @Mention Notifications (Batched)

```
Vercel Cron (every 15 min) → /api/cron/notification-digest
    1. Query pending_mentions since last run
    2. Group by recipient
    3. For each recipient:
       a. Check notification_preferences
       b. Check muted_channels
       c. Compile digest email
       d. Send via Resend API
    4. Update last_digest_sent_at
```

### 5.3 Mention Extraction

The Edge Function extracts mentions from JSONB content:

```typescript
function extractMentions(content: MessageContent): string[] {
  const mentions: string[] = []
  function walk(nodes: MessageNode[]) {
    for (const node of nodes) {
      if (node.type === 'mention' && node.userId) {
        mentions.push(node.userId)
      }
      if (node.children) walk(node.children)
    }
  }
  walk(content)
  return mentions
}
```

---

## 6. Media Handling

### 6.1 Upload Flow

```
User selects file → Client validates (type, size)
    → Upload to Supabase Storage (bucket: chat-attachments)
    → Insert message with content
    → Insert message_attachment row with storage URL
```

### 6.2 Storage Bucket Configuration

```
Bucket: chat-attachments
├── channels/{channel_id}/{message_id}/{filename}
└── dms/{conversation_hash}/{message_id}/{filename}

Max file size: 10MB (images), 25MB (files)
Allowed types: image/*, application/pdf, .doc, .docx, .xls, .xlsx
```

### 6.3 RLS on Storage

Storage paths encode the channel/DM context for RLS validation:
- Channel files: `channels/{channel_id}/{message_id}/{filename}`
- DM files: `dms/{conversation_hash}/{message_id}/{filename}`

The `conversation_hash` is computed as `md5(LEAST(sender_id, recipient_id) || GREATEST(sender_id, recipient_id))` using `members.id` values, ensuring both participants resolve to the same path.

```sql
-- Helper: check if current user is a participant in a DM conversation by hash
CREATE OR REPLACE FUNCTION is_dm_participant(conv_hash TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY INVOKER AS $$
    SELECT EXISTS (
        SELECT 1 FROM direct_messages dm
        WHERE (dm.sender_id = get_current_member_id()
               OR dm.recipient_id = get_current_member_id())
        AND md5(LEAST(dm.sender_id::text, dm.recipient_id::text)
             || GREATEST(dm.sender_id::text, dm.recipient_id::text)) = conv_hash
        LIMIT 1
    );
$$;

-- Upload: must be member of the target channel or participant in the DM
CREATE POLICY "Upload chat attachment"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'chat-attachments'
        AND auth.role() = 'authenticated'
        AND (
            -- Channel uploads: validate membership via path
            ((storage.foldername(name))[1] = 'channels' AND EXISTS (
                SELECT 1 FROM channel_members cm
                WHERE cm.user_id = auth.uid()
                AND cm.channel_id = (storage.foldername(name))[2]::uuid
            ))
            -- DM uploads: validate participant via conversation hash in path
            OR ((storage.foldername(name))[1] = 'dms'
                AND is_dm_participant((storage.foldername(name))[2]))
        )
    );

-- Read: must be member of the channel or participant in the DM
CREATE POLICY "Read chat attachment"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'chat-attachments'
        AND auth.role() = 'authenticated'
        AND (
            ((storage.foldername(name))[1] = 'channels' AND EXISTS (
                SELECT 1 FROM channel_members cm
                WHERE cm.user_id = auth.uid()
                AND cm.channel_id = (storage.foldername(name))[2]::uuid
            ))
            OR ((storage.foldername(name))[1] = 'dms'
                AND is_dm_participant((storage.foldername(name))[2]))
        )
    );

-- Delete: only admins can clean up attachments
CREATE POLICY "Admins can delete attachments"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'chat-attachments'
        AND is_staff()
    );
```

---

## 7. Search

### 7.1 Full-Text Search

PostgreSQL GIN index on `plain_text` column (auto-extracted from JSONB content via trigger).

```sql
-- Search messages in a channel
SELECT m.*, sender.display_name, sender.avatar_url,
    ts_rank(to_tsvector('english', m.plain_text), query) AS rank
FROM messages m
JOIN members sender ON m.sender_id = sender.id,
    plainto_tsquery('english', :search_term) query
WHERE m.channel_id = :channel_id
    AND m.deleted_at IS NULL
    AND to_tsvector('english', m.plain_text) @@ query
ORDER BY rank DESC
LIMIT 20;
```

### 7.2 Global Search (across channels user belongs to)

```sql
SELECT m.*, c.name AS channel_name, sender.display_name
FROM messages m
JOIN channels c ON m.channel_id = c.id
JOIN members sender ON m.sender_id = sender.id
JOIN channel_members cm ON cm.channel_id = m.channel_id AND cm.user_id = :user_id,
    plainto_tsquery('english', :search_term) query
WHERE m.deleted_at IS NULL
    AND to_tsvector('english', m.plain_text) @@ query
ORDER BY m.created_at DESC
LIMIT 20;
```

---

## 8. Moderation

### 8.1 Capabilities by Role

| Action | member | moderator | admin/owner |
|--------|--------|-----------|-------------|
| Send messages | Yes | Yes | Yes |
| Edit own messages | Yes | Yes | Yes |
| Delete own messages | Yes (soft) | Yes (soft) | Yes (soft) |
| Delete others' messages | No | Yes (own channels) | Yes (all) |
| Mute members in channel | No | Yes | Yes |
| Ban from channel | No | No | Yes |
| Create channels | No | No | Yes |

### 8.2 Soft Delete

Messages are never hard-deleted. `deleted_at` is set, and the UI shows "This message was deleted" placeholder. Content is retained for moderation review.

### 8.3 Channel Enrollment & Role-Based Access

The `channel_members` table is the sole access control mechanism for chat. Enrollment rules:

| Channel Type | `member_full` | `member_limited` | `guest` |
|-------------|---------------|-------------------|---------|
| Public (General, Events, Socials, Practice Partners) | Auto-enrolled on registration | Auto-enrolled on registration | No access |
| Segment-restricted (Bootcamp cohorts) | Enrolled if user has matching tag | No access | No access |
| Admin-only | Enrolled by owner/instructor | No access | No access |

**Auto-enrollment:** When a member is created or their role changes, a database trigger (or admin action) inserts rows into `channel_members` for all public channels. Segment-restricted channels are managed by admin when assigning tags.

**Enforcement:** The `channel_members` INSERT policy restricts membership management to `owner` and `instructor` roles. The `member_limited` vs `member_full` distinction is enforced at enrollment time (which channels they're added to), not at query time. Once enrolled, both roles have the same per-channel capabilities.

---

## 9. Implementation Phases

### Phase 1: Core Chat
- Channel list and basic messaging
- Real-time delivery (Broadcast + DB persist)
- Channel membership and access control (RLS)
- Message input with send
- Auto-scroll and infinite scroll pagination

### Phase 2: DMs & Enhanced Messaging
- DM conversations (1:1 messaging)
- Reply-to with quoted preview
- Reactions (emoji picker + reaction bar)
- Message editing and soft delete
- Image/file attachments via Supabase Storage
- Typing indicators (Broadcast)
- Online presence (Presence API)

### Phase 3: Read Tracking & Notifications
- Unread counts per channel (sidebar badges)
- Jump-to-first-unread on channel open
- Mark as read / Mark all as read
- DM email notifications (Edge Function + Resend)
- @mention detection and digest emails (Vercel Cron)
- Notification preferences UI

### Phase 4: Polish
- Message search (full-text)
- Moderation tools (delete, mute)
- Mobile-responsive layout
- Muted channels

---

## 10. Cost Projection

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| Supabase Pro | $25 | Base plan |
| Realtime messages | $25-125 | Overage at $2.50/1M messages |
| Resend | $0-20 | Free tier (3K/mo) or Pro ($20/mo, 50K/mo) |
| Supabase Storage | ~$1-5 | 100MB-1GB media uploads |
| Edge Function invocations | $0 | Included in Pro plan (2M/mo); DM + digest triggers well within limit |
| **Total** | **$51-175/mo** | |

---

## 11. Open Items

- [ ] Finalize message content node types (do we need `bullet`, `code`, `link`?)
- [ ] Decide on emoji picker library (emoji-mart, or custom subset)
- [ ] DM conversation grouping: use `LEAST/GREATEST` pattern or separate conversations table?
- [ ] Image compression/thumbnailing before Storage upload (client-side or Edge Function?)
- [ ] Implement `mention_count` increment trigger or Edge Function handler
- [x] ~~Channel creation rules~~ → Admin-only (see 8.3)
- [x] ~~Segment-restricted channels~~ → `channel_members` table is the access control (see 8.3)
- [x] ~~Rate limiting~~ → Phase 1 requirement (see below)

### 11.1 Rate Limiting (Phase 1 Requirement)

Enforce per-user message rate limits to prevent spam and quota exhaustion:

```sql
-- Rate limit: max 10 messages per 10 seconds per user per channel
CREATE OR REPLACE FUNCTION check_message_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    recent_count INT;
BEGIN
    SELECT COUNT(*) INTO recent_count
    FROM messages
    WHERE sender_id = NEW.sender_id
        AND channel_id = NEW.channel_id
        AND created_at > NOW() - INTERVAL '10 seconds';

    IF recent_count >= 10 THEN
        RAISE EXCEPTION 'Rate limit exceeded: max 10 messages per 10 seconds';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_rate_limit
    BEFORE INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION check_message_rate_limit();

-- Rate limit DMs: max 20 DMs per 60 seconds per sender (across all recipients)
-- Prevents DM spam and notification email flooding.
CREATE OR REPLACE FUNCTION check_dm_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    recent_count INT;
BEGIN
    SELECT COUNT(*) INTO recent_count
    FROM direct_messages
    WHERE sender_id = NEW.sender_id
        AND created_at > NOW() - INTERVAL '60 seconds';

    IF recent_count >= 20 THEN
        RAISE EXCEPTION 'DM rate limit exceeded: max 20 messages per 60 seconds';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dm_rate_limit
    BEFORE INSERT ON direct_messages
    FOR EACH ROW EXECUTE FUNCTION check_dm_rate_limit();
```
