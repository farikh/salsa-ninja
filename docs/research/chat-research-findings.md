# Chat Feature Research Findings

> **Date:** 2026-02-03
> **Bead:** app-5gx (Design chat architecture)
> **Status:** Research complete
> **Related:** [Chat Architecture](../specs/features/chat-architecture.md) | [Chat Solution Analysis](chat-solution-analysis.md)

---

## Research Summary

Six research tasks were conducted in parallel to inform the chat architecture design. This document captures findings from all six. The comprehensive architecture document at `docs/specs/features/chat-architecture.md` synthesizes these into a buildable design.

---

## 1. Cord PostgreSQL Schema Review (app-5gx.1)

**Source:** [getcord/cord](https://github.com/getcord/cord) (Apache-2.0, formerly commercial)

### Key Schema Entities

Cord uses Sequelize ORM with PostgreSQL. Their core entities:

- **`threads`** — Container for conversations. Fields: `id`, `orgID`, `name`, `resolvedTimestamp`, `url`, `pageContextHash`, `metadata` (JSONB). Threads are page-anchored (collaboration comments, not channel chat).
- **`messages`** — Belong to a thread. Fields: `id`, `threadID` (FK), `orgID`, `content` (JSONB — structured tree format), `metadata` (JSONB), `timestamp`, `deletedTimestamp`, `iconURL`, `translationKey`, `type` (user_message | action_message). Soft delete via `deletedTimestamp`.
- **`message_reactions`** — Separate table: `messageID`, `userID`, `unicodeReaction` (text), `timestamp`. One row per reaction per user.
- **`message_attachments`** — Separate table: `id`, `messageID`, `type` (file, screenshot, url, custom), `data` (JSONB), `timestamp`.
- **`thread_participants`** — Tracks who is in a thread: `threadID`, `userID`, `lastSeenTimestamp`, `lastUnseenMessageTimestamp`, `subscribed` (boolean).
- **`notifications`** — `id`, `recipientID`, `type`, `senderID`, `iconUrl`, `readStatus`, `timestamp`, `extraClassnames`, `metadata` (JSONB). References to message/thread/reply IDs.

### Message Content Format

Cord stores message content as JSONB using a tree structure similar to Slate.js/ProseMirror:

```json
[
  {
    "type": "p",
    "children": [
      { "type": "mention", "user": { "id": "user456" }, "children": [{"text": "@Name"}] },
      { "text": " Can you take a look at this?" }
    ]
  }
]
```

Node types include: `p` (paragraph), `mention`, `assignee`, `bullet`, `numbered_list`, `quote`, `code`, `link`, `todo`, plus text leaf nodes.

### Key Design Patterns Worth Adopting

1. **Reactions as separate table** — Clean, queryable, supports RLS per-reaction
2. **Soft delete via timestamp** — `deletedTimestamp` instead of boolean, preserves exact deletion time
3. **JSONB content** — Rich text support with structured mentions (enables mention extraction for notifications)
4. **Attachments as separate table** — Polymorphic via `type` + `data` JSONB, flexible for files/URLs/custom
5. **Thread participants with subscription** — `subscribed` boolean lets users opt out of thread notifications
6. **Metadata JSONB** — Extensible without schema changes

### Patterns NOT to Adopt

- Thread-centric model (page-anchored comments) — our model is channel-centric
- Organization-scoped everything — we use role-based access via Supabase RLS
- Sequelize ORM — we use Supabase client directly

---

## 2. Chatscope Visual Fit Evaluation (app-5gx.2)

**Decision: Build custom shadcn/ui components (Option B)**

### Why chatscope was rejected

- Uses SCSS with ~400 variables — fundamentally incompatible with Tailwind utility-first approach
- No CSS custom properties API — cannot respond to shadcn/ui theme variable changes
- Overriding requires `!important` and targeting internal class names (`.cs-message--outgoing .cs-message__content`)
- Would look visually foreign next to other shadcn/ui components
- Adds bundle weight (SCSS framework on top of existing Tailwind)

### Why use-chat headless hooks were rejected

- Documentation incomplete
- Adds abstraction layer over Supabase Realtime with no clear benefit
- Supabase already provides subscription, presence, and broadcast primitives

### Recommended approach

Build custom chat components using shadcn/ui + Tailwind CSS, bootstrapped from:
1. **Supabase UI Realtime Chat** component (official, shadcn/ui-based) — starting point for core messaging
2. **shadcn-chat** (jakobhoeg/shadcn-chat, 1.6K stars, MIT) — reference for ChatBubble variants, auto-scroll patterns (unmaintained but freely copyable)
3. **stream-chat-react** — study Thread component architecture, reaction system, channel list patterns (proprietary, reference only)

### Components to build

| Component | Complexity | Bootstrap from |
|-----------|-----------|----------------|
| MessageList | Medium | Supabase UI Realtime Chat + shadcn ScrollArea |
| MessageBubble | Low-Medium | shadcn-chat ChatBubble |
| MessageInput | Medium | shadcn Textarea + Button |
| ConversationList | Medium | Custom with shadcn Card patterns |
| TypingIndicator | Low | Custom animated dots |
| ReplyPreview | Low | Custom quoted block |
| ReactionPicker | Medium | Custom emoji picker |
| MediaPreview | Medium | Custom with Supabase Storage |

---

## 3. Supabase Realtime Plan Limits (app-5gx.3)

### Pro Plan ($25/mo) — Sufficient for 200 users

| Metric | Limit (spend cap on) | Limit (spend cap off) |
|--------|---------------------|----------------------|
| Concurrent connections | 500 | 10,000 |
| Messages/second | 500 | 2,500 |
| Channel joins/second | 500 | 2,500 |
| Channels per connection | 100 | 100 |
| Broadcast max payload | 3,000 KB | 3,000 KB |
| Included messages/month | 5 million | 5 million |
| Connection overage | $10/1,000 | $10/1,000 |
| Message overage | $2.50/1M | $2.50/1M |

### Critical Architecture Decisions from Research

1. **Use Broadcast for message delivery** — Low latency (median 6ms, P95 28ms). Ephemeral (fire-and-forget).
2. **Persist messages to database** — Broadcast does NOT guarantee delivery. Always INSERT to PostgreSQL, then broadcast.
3. **Avoid Postgres Changes for high-throughput chat** — Single-threaded processing. Each INSERT triggers N RLS checks (one per subscriber). Use only for low-frequency admin events.
4. **Use Presence for online/typing** — CRDT-based, no database writes for heartbeats.
5. **Reconnection logic required** — On reconnect, fetch missed messages from database since last known timestamp.

### Cost Estimate

200 users, moderate activity: **$50-150/month** (Pro base + message overages).

### No Delivery Guarantee

From official Supabase docs: the server does not guarantee every message will be delivered. The hybrid pattern (database persistence + Broadcast for instant delivery) is mandatory.

---

## 4. Notification Strategy (app-5gx.4)

**Decision: Email via Supabase Edge Functions + Resend, phased approach**

### Recommended Architecture

```
Message INSERT → Database Webhook → Supabase Edge Function
                                      ├── Check: user online? (skip if yes)
                                      ├── Check: notification preferences
                                      ├── Check: channel muted?
                                      └── Resend API → Email to recipient
```

### Phased Implementation

| Phase | What | Trigger |
|-------|------|---------|
| 1 | In-app unread badges + Supabase Realtime live updates | Immediate |
| 2 | Immediate email for DMs (webhook → Edge Function → Resend) | On DM insert |
| 3 | @mention detection + 15-min digest emails (Vercel Cron) | Batched |
| 4 (optional) | Web Push for opted-in users | Future |

### Why Email

- Universal: every member has email (required for magic link auth)
- No permission prompts, no PWA installation, no app downloads
- Resend free tier covers 3,000 emails/month (sufficient for 200 users)
- Well-documented: official Supabase + Resend integration guide exists
- Edge Function invocations included in Supabase plan

### Why Not Web Push (yet)

- iOS requires PWA installed to Home Screen (iOS 16.4+) — significant friction for dance community members
- No official Supabase + Web Push example exists
- Can be added as progressive enhancement in Phase 4

### Schema Additions

```sql
CREATE TABLE notification_preferences (
  member_id UUID PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  dm_notifications TEXT DEFAULT 'immediate',        -- immediate | digest | off
  mention_notifications TEXT DEFAULT 'immediate',   -- immediate | digest | off
  channel_notifications TEXT DEFAULT 'digest',      -- digest | off
  digest_frequency TEXT DEFAULT '15min',            -- 15min | hourly | daily
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone TEXT DEFAULT 'America/New_York',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE muted_channels (
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  muted_until TIMESTAMPTZ,
  PRIMARY KEY (member_id, channel_id)
);
```

---

## 5. Threading Model (app-5gx.5)

**Decision: Model A — Simple `reply_to_id` (WhatsApp-style) with reply_count enhancement**

### Why Model A

1. **Zero schema changes** — `reply_to_id` already exists in the messages table
2. **Universal familiarity** — every member uses WhatsApp/iMessage, no learning curve
3. **Minimal Realtime overhead** — one subscription per channel, no thread subscription management
4. **Fastest to build** — 4-5 components vs 8-10 for Discord-style threads
5. **Appropriate for scale** — 50-200 users across 4 channels won't cause conversation tangling
6. **No decision fatigue** — no "should I reply or start a thread?" question

### Enhancement: Reply Count Indicator

```sql
ALTER TABLE messages ADD COLUMN reply_count INT DEFAULT 0;

CREATE INDEX idx_messages_reply_to ON messages(reply_to_id)
  WHERE reply_to_id IS NOT NULL;

-- Trigger to maintain reply_count
CREATE OR REPLACE FUNCTION update_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.reply_to_id IS NOT NULL THEN
    UPDATE messages SET reply_count = reply_count + 1 WHERE id = NEW.reply_to_id;
  ELSIF TG_OP = 'DELETE' AND OLD.reply_to_id IS NOT NULL THEN
    UPDATE messages SET reply_count = reply_count - 1 WHERE id = OLD.reply_to_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_reply_count
  AFTER INSERT OR DELETE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_reply_count();
```

### Migration Path to Discord-Style Threads (If Needed Later)

1. Add `threads` table with `parent_message_id`
2. Add `thread_id` column to messages
3. Migrate messages sharing the same `reply_to_id` into threads
4. `reply_count` column already provides the data foundation

### Query Pattern (fetch messages with reply previews)

```sql
SELECT m.*, sender.display_name, sender.avatar_url,
  parent.content AS reply_preview_content,
  parent_sender.display_name AS reply_preview_sender_name
FROM messages m
JOIN members sender ON m.sender_id = sender.id
LEFT JOIN messages parent ON m.reply_to_id = parent.id
LEFT JOIN members parent_sender ON parent.sender_id = parent_sender.id
WHERE m.channel_id = $1 AND m.is_deleted = FALSE
ORDER BY m.created_at DESC
LIMIT 50 OFFSET $2;
```

---

## 6. Offline & Catch-Up Behavior (app-5gx.6)

### Read Tracking

**Decision: Per-channel `last_read_at` marker (Slack/Discord/Mattermost pattern)**

One row per user per channel. At 200 users and 30 channels = 6,000 rows total. DMs keep per-message `read_at` (already in schema) for "seen" indicators.

### Schema

```sql
CREATE TABLE channel_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_read_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    mention_count INTEGER NOT NULL DEFAULT 0,
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (channel_id, user_id)
);

CREATE INDEX idx_channel_members_user_id ON channel_members(user_id);
CREATE INDEX idx_channel_members_channel_id ON channel_members(channel_id);
```

### Unread Counts

Computed on-the-fly via SQL function (sufficient at 50-200 users):

```sql
CREATE OR REPLACE FUNCTION get_unread_counts(p_user_id UUID)
RETURNS TABLE(channel_id UUID, unread_count BIGINT, mention_count INTEGER)
LANGUAGE sql STABLE AS $$
    SELECT cm.channel_id,
        COUNT(m.id) AS unread_count,
        cm.mention_count
    FROM channel_members cm
    LEFT JOIN messages m
        ON m.channel_id = cm.channel_id
        AND m.created_at > cm.last_read_at
    WHERE cm.user_id = p_user_id
    GROUP BY cm.channel_id, cm.mention_count;
$$;
```

### Jump-to-First-Unread

Anchor-based query with bidirectional pagination:
1. Find first unread message ID
2. Load 20 messages before + 30 after the anchor
3. Insert visual "X unread messages" divider
4. Auto-scroll only if user is at bottom; preserve position on history load

### Mark as Read / Mark All as Read

```sql
CREATE OR REPLACE FUNCTION mark_channel_read(p_user_id UUID, p_channel_id UUID)
RETURNS VOID LANGUAGE sql AS $$
    UPDATE channel_members
    SET last_read_message_id = (SELECT id FROM messages WHERE channel_id = p_channel_id ORDER BY created_at DESC LIMIT 1),
        last_read_at = NOW(), mention_count = 0
    WHERE user_id = p_user_id AND channel_id = p_channel_id;
$$;

CREATE OR REPLACE FUNCTION mark_all_channels_read(p_user_id UUID)
RETURNS VOID LANGUAGE sql AS $$
    UPDATE channel_members cm
    SET last_read_message_id = sub.latest_id, last_read_at = NOW(), mention_count = 0
    FROM (SELECT channel_id, MAX(id) AS latest_id FROM messages GROUP BY channel_id) sub
    WHERE cm.channel_id = sub.channel_id AND cm.user_id = p_user_id;
$$;
```

### Presence & Last Seen

- **Real-time online/offline**: Supabase Presence (in-memory CRDT, no database writes per heartbeat)
- **`last_seen_at`**: Updated only on disconnect or at 5-minute debounced interval
- **Background tab handling**: Set `worker: true` in Realtime config to use Web Worker for heartbeat

### Typing Indicators

- **Supabase Broadcast** (ephemeral, no persistence)
- Channel name convention: `typing:{channel_id}`
- Throttle outbound: max 1 event per 3 seconds
- Auto-clear: hide after 2 seconds of no new events
- Display: "X is typing..." / "X and Y are typing..." / "Several people are typing..."
