# Cord (getcord/cord) Database Schema Reference

> Research compiled from the [getcord/cord](https://github.com/getcord/cord) open-source repository.
> Cord was a commercial chat/collaboration SDK that open-sourced its full codebase when the company shut down in August 2024.
> Source file: `database/schema/cord.sql` (1276 lines), plus Sequelize entity models in `server/src/entity/`.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Schema: Users](#users)
3. [Schema: Organizations (Groups/Channels)](#organizations)
4. [Schema: Pages (Location Context)](#pages)
5. [Schema: Threads](#threads)
6. [Schema: Thread Participants (Read Status)](#thread-participants)
7. [Schema: Messages](#messages)
8. [Schema: Message Attachments](#message-attachments)
9. [Schema: Message Reactions](#message-reactions)
10. [Schema: Message Mentions](#message-mentions)
11. [Schema: Files](#files)
12. [Schema: Notifications](#notifications)
13. [Schema: Email Notifications](#email-notifications)
14. [Schema: Message Notifications (Link Tracking)](#message-notifications)
15. [Schema: Message Link Previews](#message-link-previews)
16. [Schema: Permission Rules](#permission-rules)
17. [Schema: Sessions](#sessions)
18. [Schema: Email Subscriptions](#email-subscriptions)
19. [Schema: Page Visitors (Presence)](#page-visitors)
20. [Key Design Decisions](#key-design-decisions)
21. [Index Strategy Summary](#index-strategy-summary)
22. [Trigger & Function Summary](#triggers-and-functions)
23. [Presence & Typing (Redis-based)](#presence-and-typing)
24. [Notification Generation Flow](#notification-generation-flow)
25. [Permission / Access Control Patterns](#permission-and-access-control)

---

## Architecture Overview

- **Database**: PostgreSQL with `uuid-ossp` extension
- **ORM**: Sequelize (via sequelize-typescript)
- **Schema namespace**: `cord` (all tables live in the `cord` schema)
- **IDs**: All primary keys are UUID v4, auto-generated
- **Timestamps**: `timestamp with time zone`, defaulting to `CURRENT_TIMESTAMP`
- **Soft deletes**: Used for messages (`deletedTimestamp`), not for other entities
- **Metadata**: Extensible JSONB `metadata` column on users, orgs, threads, messages, notifications
- **Metadata constraint**: All metadata values must be flat (string, number, boolean) -- enforced via CHECK constraint using jsonpath: `CHECK (NOT "metadata" @? '$.*.type() ? (@ != "string" && @ != "number" && @ != "boolean")')`
- **Multi-tenancy**: Via `platformApplicationID` (UUID FK to `applications` table) on nearly every table
- **External IDs**: Most entities have an `externalID` text field for customer-facing identifiers, with a trigger that auto-generates `cord:<uuid>` if null
- **Real-time**: Presence and typing indicators use Redis (not PostgreSQL); PubSub for event broadcasting
- **File storage**: S3 buckets (configurable per-customer)

---

## Users

```sql
CREATE TYPE user_type AS enum ('person', 'bot');
CREATE TYPE user_state AS enum ('active', 'deleted');
CREATE TYPE profile_external_provider_type AS ENUM ('slack', 'platform');

CREATE TABLE users (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    "createdTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userType" user_type NOT NULL DEFAULT 'person',
    "admin" boolean NOT NULL DEFAULT FALSE,
    "state" user_state NOT NULL DEFAULT 'active',
    "name" text,
    "nameUpdatedTimestamp" timestamp with time zone,
    "screenName" text,
    "email" text,
    "profilePictureURL" text,
    "profilePictureURLUpdatedTimestamp" timestamp with time zone,
    "externalID" text NOT NULL,
    "externalProvider" profile_external_provider_type,
    "platformApplicationID" UUID REFERENCES applications(id) ON DELETE CASCADE,
    "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,

    CHECK(("name" IS NOT NULL) = ("nameUpdatedTimestamp" IS NOT NULL))
);
```

**Indexes:**
```sql
CREATE UNIQUE INDEX ON users ("platformApplicationID", "externalID")
    WHERE "platformApplicationID" IS NOT NULL;
CREATE INDEX ON users ("externalID") WHERE "externalProvider" = 'slack';
CREATE INDEX ON users ("email");
CREATE INDEX ON users USING gin("metadata");
CREATE INDEX ON users ("platformApplicationID", LOWER("name"));       -- mention search
CREATE INDEX ON users ("platformApplicationID", LOWER("screenName")); -- mention search
CREATE INDEX ON users ("platformApplicationID", "updatedTimestamp");   -- live queries
```

**Trigger:** Auto-updates `updatedTimestamp` on any row update.

**Key notes:**
- `state` enum supports soft-delete (`'deleted'`), not a hard delete
- `externalProvider` distinguishes Slack-synced users from platform (customer API) users
- `metadata` is customer-extensible JSONB with flat-value constraint
- Mention search is powered by lowercased name/screenName indexes

### User Preferences

```sql
CREATE TABLE user_preferences (
    "userID" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "key" text NOT NULL,
    "value" jsonb NOT NULL,
    PRIMARY KEY ("userID", "key")
);
```

---

## Organizations

Organizations (orgs) are the grouping mechanism -- equivalent to "channels" or "workspaces" in other systems.

```sql
CREATE TYPE org_state AS enum ('inactive', 'active');
CREATE TYPE org_external_provider_type AS ENUM ('slack', 'platform');

CREATE TABLE orgs (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    "externalID" text NOT NULL,
    "externalProvider" org_external_provider_type NOT NULL,
    "createdTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    state org_state NOT NULL,
    "externalAuthData" jsonb,
    "platformApplicationID" UUID REFERENCES applications(id) ON DELETE CASCADE,
    domain text,
    internal boolean NOT NULL DEFAULT false,
    "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "customSlackAppID" text,

    CHECK(("externalProvider" = 'platform') = ("platformApplicationID" IS NOT NULL))
);
```

**Indexes:**
```sql
CREATE INDEX ON orgs USING gin("metadata");
CREATE UNIQUE INDEX ON orgs("platformApplicationID", "externalID", "externalProvider")
    WHERE "platformApplicationID" IS NOT NULL;
CREATE UNIQUE INDEX ON orgs("externalProvider", "externalID", "customSlackAppID")
    WHERE "platformApplicationID" IS NULL;
CREATE UNIQUE INDEX ON orgs(id, "externalProvider");
```

### Org Members (User <-> Org membership)

```sql
CREATE TABLE org_members (
    "userID" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "orgID" uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    "platformApplicationID" uuid REFERENCES applications(id) ON DELETE CASCADE,
    "createdTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("orgID", "userID")
);
```

**Indexes:**
```sql
CREATE UNIQUE INDEX "org_members_orgID_userID_key" ON org_members USING btree ("userID", "orgID");
CREATE INDEX ON org_members ("platformApplicationID", "orgID");
```

**Trigger:** Auto-populates `platformApplicationID` from the org's `platformApplicationID` on insert.

### Org-Org Members (Nested Groups)

```sql
CREATE TABLE org_org_members (
    "childOrgID" uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    "parentOrgID" uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    "platformApplicationID" uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    "createdTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("platformApplicationID", "parentOrgID", "childOrgID")
);
```

**Trigger:** Cycle detection via recursive CTE -- prevents circular org membership.

### Linked Orgs / Linked Users

Tables for cross-platform linking (e.g., connecting a platform org to its Slack equivalent):
- `linked_orgs` -- maps a platform org to a Slack org
- `linked_users` -- maps a platform user to a Slack user (scoped to linked orgs)

---

## Pages

Pages represent a location/context where threads appear (e.g., a specific URL or view).

```sql
CREATE TABLE pages (
    "orgID" uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    "contextData" jsonb NOT NULL,  -- flat key-value object
    "contextHash" uuid NOT NULL,   -- deterministic hash of contextData
    PRIMARY KEY ("orgID", "contextHash")
);

CREATE INDEX ON pages USING gin("contextData");
```

**Key insight:** The `contextHash` is a UUID-formatted hash of the `contextData` JSON, used as a fast lookup key. The actual context data (e.g., `{"page": "/dashboard", "section": "metrics"}`) is stored alongside it for querying with GIN indexes.

---

## Threads

Threads are the top-level conversation containers. Messages belong to threads.

```sql
CREATE TYPE thread_support_status AS enum ('open', 'closed');

CREATE TABLE threads (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "orgID" uuid NOT NULL REFERENCES orgs("id") ON DELETE CASCADE,
    name text NOT NULL,
    "resolvedTimestamp" timestamp with time zone,
    "resolverUserID" uuid,
    "url" text NOT NULL,          -- URL where thread was initially created
    "supportStatus" thread_support_status,
    "createdTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pageContextHash" uuid NOT NULL,
    "platformApplicationID" UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    "externalID" text NOT NULL,
    "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "extraClassnames" text,

    UNIQUE ("platformApplicationID", "externalID"),
    UNIQUE ("orgID", "id"),
    FOREIGN KEY ("orgID", "pageContextHash") REFERENCES pages("orgID", "contextHash")
        ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY ("resolverUserID") REFERENCES users("id") ON DELETE SET NULL
);
```

**Indexes:**
```sql
CREATE INDEX ON threads ("resolverUserID");
CREATE INDEX ON threads ("platformApplicationID");
CREATE INDEX ON threads ("orgID", "pageContextHash");
CREATE INDEX ON threads USING gin("metadata");
```

**Key design:**
- Thread belongs to exactly ONE org
- Thread is anchored to a page via `pageContextHash`
- Resolution is tracked via `resolvedTimestamp` + `resolverUserID`
- The composite unique `("orgID", "id")` enables foreign keys that include orgID for partition-friendly referencing

### Preallocated Thread IDs

```sql
CREATE TABLE preallocated_thread_ids (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "platformApplicationID" UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    "externalID" text NOT NULL,
    UNIQUE ("platformApplicationID", "externalID")
);
```

Used to reserve thread IDs before the first message is created.

---

## Thread Participants

Tracks who is participating in a thread and their read state.

```sql
CREATE TABLE thread_participants (
    "threadID" uuid NOT NULL,
    "userID" uuid NOT NULL,
    "orgID" uuid NOT NULL,
    "lastSeenTimestamp" timestamp with time zone,            -- timestamp of last seen message
    "lastUnseenMessageTimestamp" timestamp with time zone,   -- when a new unseen message arrived
    "lastUnseenReactionTimestamp" timestamp with time zone,  -- when a new unseen reaction arrived
    subscribed boolean NOT NULL DEFAULT TRUE,
    PRIMARY KEY ("threadID", "orgID", "userID"),
    FOREIGN KEY ("orgID") REFERENCES orgs("id") ON DELETE CASCADE,
    FOREIGN KEY ("userID") REFERENCES users("id") ON DELETE CASCADE,
    FOREIGN KEY ("orgID", "threadID") REFERENCES threads("orgID", "id")
        ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);
```

**Indexes:**
```sql
CREATE INDEX ON thread_participants ("orgID", "userID", "threadID");
CREATE INDEX ON thread_participants ("threadID", "userID");
CREATE INDEX ON thread_participants ("userID");
```

**Key design:**
- Read status is tracked per-user per-thread via `lastSeenTimestamp`
- Unread detection: compare `lastSeenTimestamp` vs `lastUnseenMessageTimestamp`
- `subscribed` controls whether user receives notifications for this thread
- The primary key includes `orgID` because threads are org-scoped
- When a new message is created, the system marks the thread as having unseen content for all other participants by updating `lastUnseenMessageTimestamp`
- The message author's `lastSeenTimestamp` is updated immediately (they've seen their own message)

---

## Messages

```sql
CREATE TYPE imported_slack_message_type AS ENUM ('reply', 'supportBotReply');
CREATE TYPE message_type AS ENUM ('action_message', 'user_message');

CREATE TABLE messages (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    content jsonb NOT NULL,                    -- structured JSON (tree of MessageNode)
    "externalID" text NOT NULL,
    "sourceID" uuid NOT NULL,                  -- author user ID
    "orgID" uuid NOT NULL,
    "threadID" uuid NOT NULL,
    "platformApplicationID" uuid NOT NULL,
    url text,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "deletedTimestamp" timestamp with time zone,          -- soft delete
    "lastUpdatedTimestamp" timestamp with time zone,      -- edit tracking
    "importedSlackChannelID" text,
    "importedSlackMessageTS" text,
    "importedSlackMessageType" imported_slack_message_type,
    "importedSlackMessageThreadTS" text,
    "replyToEmailNotificationID" uuid,
    "iconURL" text,
    "translationKey" text,
    "type" message_type NOT NULL DEFAULT 'user_message',
    "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "extraClassnames" text,
    "skipLinkPreviews" boolean NOT NULL DEFAULT FALSE,

    -- Generated column for full-text search
    "contentTsVector" tsvector GENERATED ALWAYS AS (
        to_tsvector('english', jsonb_path_query_array(content, 'strict $.**.text'))
    ) STORED,

    CHECK (num_nulls("importedSlackChannelID", "importedSlackMessageTS", "importedSlackMessageType") IN (0, 3)),

    UNIQUE ("orgID", "id"),
    UNIQUE ("externalID", "platformApplicationID"),

    FOREIGN KEY ("orgID") REFERENCES orgs("id") ON DELETE CASCADE,
    FOREIGN KEY ("sourceID") REFERENCES users("id") ON DELETE CASCADE,
    FOREIGN KEY ("orgID", "threadID") REFERENCES threads("orgID", "id")
        ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY ("platformApplicationID") REFERENCES applications("id") ON DELETE CASCADE
);
```

**Indexes:**
```sql
CREATE UNIQUE INDEX thread_messages_imported_slack ON messages
    USING btree ("orgID", "threadID", "importedSlackChannelID", "importedSlackMessageTS")
    WHERE "importedSlackChannelID" IS NOT NULL;
CREATE INDEX ON messages ("threadID", "timestamp");       -- message ordering within thread
CREATE INDEX ON messages ("orgID", "sourceID");
CREATE INDEX ON messages ("sourceID");
CREATE INDEX ON messages USING gin("metadata");
CREATE INDEX ON messages USING gin("contentTsVector");    -- full-text search
CREATE INDEX ON messages ("platformApplicationID");
```

**Trigger:** Auto-generates `externalID` as `cord:<uuid>` if null on insert.

**Key design:**
- **Content is JSONB** -- a tree structure of `MessageNode` objects (paragraphs, mentions, text, etc.)
- **Full-text search** uses a generated `tsvector` column that extracts all `.text` fields from the JSON tree using `jsonb_path_query_array`
- **Soft delete** via `deletedTimestamp` (null = active, non-null = deleted)
- **Message types**: `user_message` (normal) vs `action_message` (system events like thread resolved)
- **No nested threading** -- messages are flat within a thread (no reply-to-message)
- The `sourceID` is the author (references users table)
- Edit tracking via `lastUpdatedTimestamp`

### Message Content Structure (JSONB)

The `content` field stores a tree of nodes:

```json
[
  {
    "type": "p",
    "children": [
      { "type": "mention", "user": { "id": "user-uuid" }, "children": [{"text": "@UserName"}] },
      { "text": " Can you take a look at this?" }
    ]
  }
]
```

Node types include: `p` (paragraph), `mention`, `assignee`, `link`, `quote`, `code`, `bullet`, `numbered_list`, `todo`, and text leaf nodes (no `type`, just `"text"` property).

A helper SQL function `cord.message_content_text(content jsonb)` recursively walks this tree and concatenates all text into a flat string.

---

## Message Attachments

```sql
CREATE TABLE message_attachments (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    "messageID" uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    type text NOT NULL,       -- 'file', 'annotation', 'screenshot'
    data jsonb NOT NULL,      -- type-specific payload
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ON message_attachments ("messageID");
```

**Attachment types and their `data` payloads:**
- **FILE**: `{ "fileID": "<uuid>" }` -- references the `files` table
- **SCREENSHOT**: `{ "screenshotFileID": "<uuid>", "blurredScreenshotFileID": "<uuid>" }`
- **ANNOTATION**: Contains screenshot references, location coordinates, highlighting config, labels

**Key design:** Attachments use a polymorphic pattern -- the `type` column determines the shape of the `data` JSONB. File references are stored as UUIDs inside the JSON (not as formal foreign keys).

---

## Message Reactions

```sql
CREATE TABLE message_reactions (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    "userID" uuid NOT NULL,
    "messageID" uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    "unicodeReaction" text NOT NULL CHECK (length("unicodeReaction") < 4096),
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userID") REFERENCES users("id") ON DELETE CASCADE,
    UNIQUE ("userID", "messageID", "unicodeReaction")
);

CREATE INDEX ON message_reactions ("messageID");
CREATE INDEX ON message_reactions ("userID");
```

**Key design:**
- **Separate table** (not JSONB) -- each reaction is its own row
- **One row per user per reaction per message** (enforced by unique constraint)
- Reaction content is stored as unicode text (emoji), not an enum
- Length limit is generous (4096 chars) as a fallback; frontend enforces stricter limits
- A user can add multiple different reactions to the same message, but not duplicate the same one

---

## Message Mentions

```sql
CREATE TABLE message_mentions (
    "userID" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "messageID" uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    "timestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("userID", "messageID")
);

CREATE INDEX ON message_mentions ("messageID", "userID");
CREATE INDEX ON message_mentions ("userID");
```

**Key design:**
- **Denormalized from message content** -- mentions are extracted from the JSONB content tree at write time and stored in this separate table for efficient querying
- Extraction: application code walks the `content` JSON tree, finds nodes with `type: "mention"`, extracts user IDs
- On message update, old mentions are deleted and new ones are re-created
- This enables queries like "find all messages mentioning user X" without JSON scanning

---

## Files

```sql
CREATE TABLE files (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    "userID" uuid NOT NULL,
    "platformApplicationID" uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    "mimeType" text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    name text,
    size integer DEFAULT 0,
    "s3Bucket" uuid,
    "uploadStatus" text NOT NULL DEFAULT 'uploading',
    FOREIGN KEY ("userID") REFERENCES users("id") ON DELETE CASCADE,
    FOREIGN KEY ("s3Bucket") REFERENCES s3_buckets("id") DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX ON files ("userID");
```

**Key design:**
- Files are uploaded to S3 (bucket is configurable per customer)
- `uploadStatus` tracks lifecycle: 'uploading', 'uploaded', 'failed', etc.
- Files are referenced from `message_attachments.data` JSONB (not a direct FK)
- Signed URLs are generated for download (24h expiry) or permanent proxy URLs

---

## Notifications

```sql
CREATE TYPE notification_read_status AS enum ('unread', 'read');
CREATE TYPE notification_type AS enum ('reply', 'reaction', 'external', 'thread_action');
CREATE TYPE thread_action_type AS enum ('resolve', 'unresolve');

CREATE TABLE notifications (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    "platformApplicationID" uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    "externalID" text NOT NULL,
    "recipientID" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "iconUrl" text,
    "type" notification_type NOT NULL,
    "aggregationKey" text,
    "readStatus" notification_read_status NOT NULL DEFAULT 'unread',
    "createdTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extraClassnames" text,
    "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,

    -- Type-specific columns (with CHECK constraints enforcing type-dependent nullability)
    "senderID" uuid REFERENCES users(id) ON DELETE CASCADE,
    "messageID" uuid REFERENCES messages(id) ON DELETE CASCADE,
    "replyActions" text[],
    "reactionID" uuid REFERENCES message_reactions(id) ON DELETE CASCADE,
    "threadID" uuid REFERENCES threads(id) ON DELETE CASCADE,
    "threadActionType" thread_action_type,
    "externalTemplate" text,
    "externalURL" text,

    UNIQUE("externalID", "platformApplicationID"),

    -- Type-dependent constraints:
    CHECK (("type"::text = 'external' OR "senderID" IS NOT NULL)),
    CHECK (("messageID" IS NULL) = ("type"::text = 'external')),
    CHECK (("replyActions" IS NOT NULL) = ("type"::text = 'reply')),
    CHECK (("reactionID" IS NOT NULL) = ("type"::text = 'reaction')),
    CHECK ("threadID" IS NOT NULL OR "type"::text != 'thread_action'),
    CHECK (("threadActionType" IS NOT NULL) = ("type"::text = 'thread_action')),
    CHECK (("externalTemplate" IS NOT NULL) = ("type"::text = 'external')),
    CHECK (("externalURL" IS NOT NULL) = ("type"::text = 'external'))
);
```

**Indexes:**
```sql
CREATE INDEX ON notifications ("recipientID");
CREATE INDEX ON notifications ("senderID") WHERE "senderID" IS NOT NULL;
CREATE INDEX ON notifications ("messageID") WHERE "messageID" IS NOT NULL;
CREATE INDEX ON notifications ("reactionID") WHERE "reactionID" IS NOT NULL;
CREATE INDEX ON notifications ("threadID") WHERE "threadID" IS NOT NULL;
CREATE INDEX ON notifications USING gin("metadata");
```

**Key design:**
- **Single table for all notification types** with type-discriminated columns
- CHECK constraints enforce that type-specific columns are populated correctly
- `aggregationKey` allows grouping related notifications (e.g., multiple reactions on same message)
- **Each row is a single notification event** (not aggregated) -- aggregation happens at query time
- Partial indexes (`WHERE ... IS NOT NULL`) keep index sizes small
- Notifications are generated in **application code** (not triggers) during the message creation pipeline

---

## Email Notifications

```sql
CREATE TABLE email_notifications (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    "userID" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "orgID" uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    "threadOrgID" uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    "threadID" uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    "email" text NOT NULL
);

CREATE UNIQUE INDEX ON email_notifications ("id", "threadID", "userID", "threadOrgID");
CREATE INDEX ON email_notifications ("threadID");
CREATE INDEX ON email_notifications ("userID");
CREATE INDEX ON email_notifications ("threadOrgID");
CREATE INDEX ON email_notifications ("orgID");
```

Tracks email notifications sent, allowing reply-to-email functionality (messages can reference `replyToEmailNotificationID`).

---

## Message Notifications (Link Tracking)

```sql
CREATE TYPE message_notifications_type AS ENUM (
    'slack', 'email', 'slackEmailMatched', 'sharedToSlackChannel', 'sharedToEmail'
);

CREATE TABLE message_notifications (
    id TEXT NOT NULL PRIMARY KEY,  -- nano ID (short, for URL params)
    "messageID" uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    type message_notifications_type NOT NULL,
    url text NOT NULL,
    location jsonb,               -- contextData
    "targetUserID" uuid REFERENCES users(id) ON DELETE CASCADE,
    "targetOrgID" uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    "timestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" jsonb NOT NULL DEFAULT '{}',
    "sharerUserID" uuid,
    "sharerOrgID" uuid
);

CREATE INDEX ON message_notifications ("messageID");
CREATE INDEX ON message_notifications ("targetOrgID", "targetUserID");
CREATE INDEX ON message_notifications ("targetUserID");
```

**Note:** Uses nano ID (text, not UUID) for shorter link tracking URLs.

---

## Message Link Previews

```sql
CREATE TABLE message_link_previews (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    "messageID" uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    "lastScrapedTimestamp" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "url" text NOT NULL,
    "url_hash" text,
    "img" text,
    "title" text,
    "description" text,
    "hidden" boolean NOT NULL DEFAULT FALSE,
    UNIQUE("messageID", "url")
);

CREATE INDEX ON message_link_previews ("messageID");
```

---

## Permission Rules

```sql
CREATE TYPE permission AS enum (
    'thread:read',
    'thread:send-message',
    'thread-participant:read',
    'message:read'
);

CREATE TABLE permission_rules (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    "platformApplicationID" uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    "resourceSelector" jsonpath NOT NULL,   -- matches against resource metadata
    "userSelector" jsonpath NOT NULL,        -- matches against user metadata/groups
    "permissions" permission[] NOT NULL      -- array of granted permissions
);

CREATE INDEX ON permission_rules ("platformApplicationID");
```

**Key design:**
- Permission rules use **JSONPath selectors** to match resources and users
- This is a flexible ABAC (attribute-based access control) system
- Rules are evaluated per-application; the `resourceSelector` and `userSelector` are applied against entity metadata
- Permissions are granular: read threads, send messages, read participants, read messages
- **No RLS** -- access control is enforced in application code using these rules + org membership checks

---

## Sessions

```sql
CREATE TABLE sessions (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    "applicationID" uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    "issuedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" timestamp with time zone
);

CREATE INDEX ON sessions ("applicationID");
```

---

## Email Subscriptions

```sql
CREATE TABLE email_subscription (
    "userID" uuid NOT NULL,
    "threadID" uuid NOT NULL,
    "subscribed" boolean NOT NULL DEFAULT FALSE,
    PRIMARY KEY ("userID", "threadID"),
    FOREIGN KEY ("userID") REFERENCES users("id") ON DELETE CASCADE,
    FOREIGN KEY ("threadID") REFERENCES threads("id") ON DELETE CASCADE
);

CREATE INDEX ON email_subscription ("threadID");
```

---

## Page Visitors

Tracks which users have visited which pages (for presence history / "who's been here").

```sql
CREATE TABLE page_visitors (
    "pageContextHash" uuid NOT NULL,
    "userID" uuid NOT NULL,
    "orgID" uuid NOT NULL,
    "lastPresentTimestamp" timestamp with time zone,
    PRIMARY KEY ("pageContextHash", "orgID", "userID"),
    FOREIGN KEY ("pageContextHash", "orgID") REFERENCES pages("contextHash", "orgID")
        ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY ("orgID") REFERENCES orgs("id") ON DELETE CASCADE,
    FOREIGN KEY ("userID") REFERENCES users("id") ON DELETE CASCADE
);

CREATE INDEX ON page_visitors ("orgID", "userID");
CREATE INDEX ON page_visitors ("userID");
```

---

## Key Design Decisions

### 1. Thread vs Message Relationship
- **Thread is the container.** Messages reference threads via `threadID`.
- Threads belong to exactly one org and one page context.
- Messages are **flat within a thread** -- there is no reply-to-message or nested threading.
- Thread resolution is tracked on the thread itself (`resolvedTimestamp`, `resolverUserID`).

### 2. Reaction Storage
- **Separate table** (`message_reactions`), not JSONB.
- One row per user per reaction per message.
- Reactions are unicode text (emoji), not an enum.
- Unique constraint prevents duplicate reactions from the same user.

### 3. Mention Extraction and Storage
- Mentions are **extracted from JSONB content at write time** and stored in `message_mentions` table.
- The content tree contains `{ "type": "mention", "user": { "id": "<uuid>" } }` nodes.
- Application code walks the tree with `getMentionedUserIDs()`, then creates rows in `message_mentions`.
- On message update: old mentions are deleted, new ones re-created.
- This denormalization enables efficient "messages mentioning user X" queries.

### 4. Notification Generation
- **Application code, not triggers.**
- When a new message is created, `executeNewMessageCreationTasks()` orchestrates:
  1. Create message attachments
  2. Create task assignments (if applicable)
  3. Extract and store mentions
  4. Determine notification recipients (via thread participation, page context, mentions)
  5. Subscribe mentioned users to the thread
  6. Create notification records via `NotificationMutator`
  7. Send outbound notifications (email, Slack)
  8. Publish real-time PubSub events
  9. Mark thread as seen for the message author
  10. Maybe unresolve the thread
  11. Schedule link preview generation
- Notification aggregation happens at **read time**, not write time.

### 5. Soft Delete vs Hard Delete
- **Messages use soft delete** (`deletedTimestamp` field, null = active).
- `MessageEntity.isDeleted()` checks if `deletedTimestamp` is not null.
- **Users use state-based soft delete** (`state` enum: 'active' | 'deleted').
- **All other entities use hard delete** (cascading via ON DELETE CASCADE).

### 6. Message Ordering and Pagination
- Messages are ordered by `"timestamp"` within a thread.
- Primary pagination index: `CREATE INDEX ON messages ("threadID", "timestamp")`.
- Cursor-based pagination using timestamp (keyset pagination).
- No explicit `order` or `sequence` column -- timestamp is the ordering key.

### 7. Multi-tenancy
- Every major table includes `platformApplicationID` (FK to `applications`).
- Queries are always scoped by application + org.
- No PostgreSQL Row Level Security (RLS) -- all access control is in application code.

### 8. Full-Text Search
- Generated column: `"contentTsVector" tsvector GENERATED ALWAYS AS (to_tsvector('english', jsonb_path_query_array(content, 'strict $.**.text'))) STORED`
- This extracts all `text` properties from the nested JSONB content and creates a searchable tsvector.
- GIN index on the tsvector column for fast search.
- Additionally, a PL/pgSQL helper function `message_content_text()` recursively extracts flat text from the content tree.

---

## Index Strategy Summary

### Pattern: Composite indexes for scoped queries
- `("platformApplicationID", "externalID")` on users, threads, orgs -- fast lookup by external ID within an app
- `("threadID", "timestamp")` on messages -- message ordering within thread
- `("orgID", "userID")` on thread_participants, org_members -- membership lookups

### Pattern: GIN indexes for JSONB
- `USING gin("metadata")` on users, orgs, threads, messages, notifications -- enables `@>` containment queries
- `USING gin("contentTsVector")` on messages -- full-text search
- `USING gin("contextData")` on pages -- location context queries

### Pattern: Partial indexes
- `WHERE "platformApplicationID" IS NOT NULL` on users -- only index platform users
- `WHERE "externalProvider" = 'slack'` on users -- only index Slack users
- `WHERE "senderID" IS NOT NULL` etc. on notifications -- sparse columns

### Pattern: Covering unique indexes
- `UNIQUE ("orgID", "id")` on threads and messages -- enables composite FK references
- `UNIQUE ("userID", "messageID", "unicodeReaction")` on reactions -- prevents duplicates

---

## Triggers and Functions

| Trigger | Table | Purpose |
|---------|-------|---------|
| `trigger_user_update_timestamp` | users | Auto-set `updatedTimestamp` on update |
| `add_message_external_id_trigger` | messages | Auto-generate `externalID` if null |
| `add_thread_external_id_trigger` | threads | Auto-generate `externalID` if null |
| `add_user_external_id_trigger` | users | Auto-generate `externalID` if null |
| `add_notification_external_id_trigger` | notifications | Auto-generate `externalID` if null |
| `add_org_member_app_id_trigger` | org_members | Populate `platformApplicationID` from org |
| `enforce_no_cycle` | org_org_members | Prevent circular org membership via recursive CTE |

### Helper Functions

| Function | Purpose |
|----------|---------|
| `cord.message_content_text(content jsonb)` | Recursively extracts flat text from JSONB message content tree |
| `cord.add_external_id_if_null()` | Generates `cord:<uuid>` external ID for null values |
| `cord.populate_app_id()` | Copies `platformApplicationID` from org to org_member |
| `cord.check_cycle()` | Recursive CTE cycle detection for org-org membership |
| `cord.user_update_timestamp()` | Sets `updatedTimestamp` to CURRENT_TIMESTAMP |
| `metrics_day(ts)` | Converts timestamp to metric day (starting at 6am UTC) |
| `gen_random_uuid()` | Compatibility wrapper for `uuid_generate_v4()` |

---

## Presence and Typing

**Not stored in PostgreSQL.** Both presence and typing indicators use **Redis**.

### Presence (context.ts)
- Stored as Redis key-value pairs with TTL
- Key format: `presenceContext/{orgID}/{externalUserID}/{locationJson}`
- Value: JSON-serialized location/context data
- TTL: `PAGE_PRESENCE_LOSS_TTL_SECONDS` (auto-expires when user leaves)
- Changes broadcast via PubSub `context-presence` events
- A sequence number (also in Redis) tracks ordering of presence changes
- `page_visitors` PostgreSQL table stores historical visit data (last present timestamp)

### Typing (typing.ts)
- Stored as Redis sorted sets, scored by timestamp
- Key: per-thread identifier
- Members: user IDs with timestamp scores
- TTL-based expiration: users older than TTL are considered no longer typing
- Changes broadcast via PubSub `thread-typing-users-updated` events
- Timeout callbacks check for expiration and notify subscribers

---

## Notification Generation Flow

When `executeNewMessageCreationTasks()` runs:

```
1. addNewMessageAttachments()
   - Creates message_attachments rows for files, screenshots, annotations

2. addNewMessageTasks() (if task input provided)
   - Creates task + task_assignees rows
   - Returns list of assigned user IDs

3. createMessageMentions()
   - Walks content JSONB tree, extracts mention nodes
   - Creates message_mentions rows
   - Returns list of mentioned user IDs

4. maybeNotifyReferencedUsers()
   a. Combines mentioned users + task assignees into reference set
   b. Determines all users to notify (thread participants + page visitors + referenced users)
   c. Subscribes referenced users to the thread (thread_participants)
   d. Updates lastUnseenMessageTimestamp for other participants
   e. Creates notification rows for each recipient
   f. Sends outbound notifications (email, Slack)

5. publishNewMessageEvents() [in transaction]
   - Publishes PubSub events: thread-message-added, thread-properties-updated

6. markThreadSeenForViewer() [in transaction]
   - Updates thread_participants.lastSeenTimestamp for the message author

7. maybeUnresolveThread()
   - If thread was resolved and new message arrives, clears resolvedTimestamp

8. scheduleGenerateLinkPreviews()
   - Queues async job to scrape URLs in message content and populate message_link_previews
```

---

## Permission and Access Control

Cord does **not** use PostgreSQL Row Level Security (RLS). Access control is implemented entirely in application code:

### Organization-Based Access
- The primary access boundary is **org membership** (`org_members` table)
- A user can only see threads/messages in orgs they belong to
- Thread queries always filter by the viewer's org memberships
- `ThreadEntity.belongsToViewerOrgs(viewer)` validates thread access

### Permission Rules (ABAC)
- The `permission_rules` table defines rules using **JSONPath selectors**
- `resourceSelector` matches against thread/message metadata
- `userSelector` matches against user metadata/group membership
- Permissions: `thread:read`, `thread:send-message`, `thread-participant:read`, `message:read`
- Rules are evaluated per-application at query time

### Notification Scoping
- Notification queries join against org membership to ensure users only see notifications from their orgs
- The fetch query includes: `WHERE org_members."userID" = :recipientID`

### Thread Participant Subscriptions
- `thread_participants.subscribed` controls notification delivery
- Users can unsubscribe from threads they're participating in
- `email_subscription` provides separate control for email notifications specifically

---

## Entity Relationship Summary

```
applications (multi-tenant app)
  |
  +-- orgs (groups/channels)
  |     +-- org_members (user <-> org)
  |     +-- pages (location contexts)
  |           +-- page_visitors (presence history)
  |           +-- threads
  |                 +-- thread_participants (read state, subscriptions)
  |                 +-- messages
  |                       +-- message_attachments (files, screenshots, annotations)
  |                       +-- message_reactions
  |                       +-- message_mentions
  |                       +-- message_link_previews
  |                       +-- message_notifications (link tracking)
  |
  +-- users
  |     +-- user_preferences
  |
  +-- notifications (all types: reply, reaction, external, thread_action)
  +-- email_notifications
  +-- email_subscription
  +-- permission_rules
  +-- files (S3 references)
  +-- sessions
```

---

## Slack-Specific Tables (for reference, not needed for our schema)

- `slack_channels` -- Slack channel metadata
- `slack_messages` -- Maps messages shared to Slack
- `slack_mirrored_threads` -- Threads mirrored to Slack channels
- `slack_mirrored_support_threads` -- Support threads mirrored to Slack

## Task-Related Tables (for reference)

- `tasks` -- Tasks attached to messages
- `task_assignees` -- User assignments to tasks
- `task_todos` -- Individual todo items within tasks
- `third_party_connections` -- Jira, Asana, Linear, Trello, Monday integrations
- `task_third_party_references` -- Links to external task trackers
- `task_third_party_subscriptions` -- Webhook subscriptions for task sync

---

## Source Files

| File | Purpose |
|------|---------|
| `database/schema/cord.sql` | Complete PostgreSQL schema (1276 lines) |
| `database/schema.sql` | Entry point, sets up `cord` schema, includes `cord.sql` |
| `database/migrations/` | 30 Sequelize migration files (Jan-Jul 2024) |
| `server/src/entity/` | 53 Sequelize entity directories |
| `server/src/entity/message/MessageEntity.ts` | Message model with content cleansing |
| `server/src/entity/thread/ThreadEntity.ts` | Thread model with org validation |
| `server/src/entity/thread_participant/ThreadParticipantEntity.ts` | Read state tracking |
| `server/src/entity/message_reaction/MessageReactionEntity.ts` | Reaction model |
| `server/src/entity/message_mention/MessageMentionEntity.ts` | Mention model |
| `server/src/entity/message_attachment/MessageAttachmentEntity.ts` | Polymorphic attachment model |
| `server/src/entity/notification/NotificationEntity.ts` | Notification model |
| `server/src/entity/file/FileEntity.ts` | File model with S3 URL generation |
| `server/src/entity/permission/PermisssionRuleEntity.ts` | ABAC permission rules |
| `server/src/message/executeMessageTasks.ts` | Message creation/update orchestration |
| `server/src/message/new_message_tasks/` | 9 task files for new message pipeline |
| `server/src/notifications/fetch.ts` | Notification query with aggregation |
| `server/src/presence/context.ts` | Redis-based presence management |
| `server/src/presence/typing.ts` | Redis-based typing indicators |
