# Chat Solution Analysis

> **Date:** 2026-02-03
> **Status:** Research complete, architecture design pending
> **Decision:** Build on Supabase Realtime using tested open-source patterns

---

## Context

The original chat spec (`docs/specs/features/chat.md`) calls for Supabase Realtime with custom-built everything. This research evaluated whether to use Supabase DIY, Matrix/Element, or a commercial/open-source alternative.

## Options Evaluated

### Matrix/Element — Rejected

- **matrix-react-sdk** was archived Oct 2024. No replacement React component library exists.
- **matrix-js-sdk** (v40.1.0) is active but protocol-only — zero UI components.
- **Hydrogen SDK / Chatterbox** — effectively abandoned since 2023.
- **matrix-rust-sdk WASM** — only crypto layer works in browsers. Full SDK not browser-ready.
- Running Synapse requires a separate VPS ($10-40/mo), its own PostgreSQL, reverse proxy, and TLS.
- Auth bridging with Supabase is unproven (Supabase OIDC server is still beta).
- Federation and E2E encryption are unnecessary for a private 50-200 member community.

**Bottom line:** Same UI build effort as Supabase DIY, plus a second server and untested auth bridge.

### Commercial SDKs — Noted as Fallback

| SDK | Cost (200 users) | Verdict |
|-----|-------------------|---------|
| Stream Chat | Free (Maker) or $99-499/mo | Best feature set. Maker tier requires <5 team, <$10K revenue. |
| CometChat | ~$109/mo | Complete features + voice/video. |
| Ably Chat | ~$10/mo | Affordable but partial features (no threads, moderation, search). |
| TalkJS | $279/mo | Too expensive for small community. |
| Sendbird | $399/mo | Too expensive for small community. |

**Fallback plan:** If Supabase DIY scope becomes unmanageable, migrate to Stream Chat with Maker account. Auth bridge is straightforward (mint JWT in API route).

### Self-Hosted Platforms — Rejected

| Platform | Issue |
|----------|-------|
| Rocket.Chat | Requires separate VPS + MongoDB. Neither Vercel nor Supabase can host it. Adds third infrastructure layer. |
| Mattermost | Not embeddable (disables iframe by default). No React SDK. |
| Zulip | Not embeddable. No widgets or React SDK. |

### Supabase Realtime DIY — Selected

Build chat on the existing Supabase stack using tested open-source patterns. No new infrastructure. Unified auth, database, and data model.

---

## Open-Source Pattern Sources

### Schema & Backend Patterns

| Project | GitHub | Stars | License | Stack | Key Value |
|---------|--------|-------|---------|-------|-----------|
| **Cord** | getcord/cord | 105 | Apache-2.0 | TypeScript, React, **PostgreSQL**, S3 | Former paid product. Production-tested PostgreSQL schema for threads, reactions, mentions, notifications, presence. Directly portable to Supabase. |
| **Valkyrie** | sentrionic/Valkyrie | 330 | MIT | Go, React, **PostgreSQL**, Redis, S3 | Clean Discord-like schema. Friend system, notifications, kick/ban moderation. E2E tests. |
| **Mattermost** (schema only) | mattermost/mattermost | 35K | Mixed | React+Redux, **PostgreSQL** | Enterprise-grade PostgreSQL schema for channels, threads, reactions, permissions. Reference quality. |
| **Supabase Slack Clone** | supabase/supabase (examples) | 75K | Apache-2.0 | Next.js, Supabase | Canonical RLS policies for chat. Basic channels + messages + profiles. Starting point for Supabase-specific patterns. |

### Next.js Integration Patterns

| Project | GitHub | Stars | Stack | Key Value |
|---------|--------|-------|-------|-----------|
| **Discord Clone (Antonio pattern)** | nayak-nirmalya/discord-clone | 45 | Next.js 13, Prisma, shadcn/ui, Tailwind, Socket.io | Closest stack match. Prisma schema translates ~1:1 to Supabase PostgreSQL. Swap Prisma for Supabase client, Socket.io for Supabase Realtime, Clerk for Supabase Auth. |
| **Discordant** (extended) | kendevco/discordant | 15 | Same + extensions | Extended version with additional features. Last updated 2025-06. |

### UI Component Libraries

| Library | GitHub | Stars | License | Key Value |
|---------|--------|-------|---------|-----------|
| **chatscope/chat-ui-kit-react** | chatscope/chat-ui-kit-react | 1.7K | MIT | MessageList, MessageInput, ConversationList, TypingIndicator, Sidebar, ChatContainer. Solves hard UI problems (scroll, contenteditable, responsive). |
| **chatscope/use-chat** | chatscope/use-chat | 161 | MIT | Headless state management hook. `IChatService` interface you implement for Supabase. |
| **react-chat-elements** | Detaysoft/react-chat-elements | 1.4K | MIT | Widest message type variety (text, photo, video, file, location, meeting). Active (Jan 2026). |
| **RocketChat/fuselage** | RocketChat/fuselage | 146 | MIT | Production design system. Monorepo: tokens, hooks, components, forms as separate packages. |

### Architecture & Feature Patterns (Study, Don't Copy)

| Project | Key Pattern to Study |
|---------|---------------------|
| **stream-chat-react** (GetStream) | Provider/consumer architecture for swappable UI. Thread component design. Reaction system. Channel list with filters/sorting. |
| **Tinode** (tinode/chat) | WebSocket protocol design. Granular per-topic access control. Client-side message caching and sync. |
| **Revolt** (revolt.js) | Reactive state model for real-time updates. Permission system. Server/channel/message hierarchy in TypeScript. |
| **Spectrum** (archived, withspectrum/spectrum) | Threaded conversations as default (not afterthought). Community moderation patterns. |
| **Zulip** | Topic-based threading model (messages have both channel AND topic). |

---

## Proposed Build Approach

```
UI Layer:        chatscope/chat-ui-kit-react (MIT, drop-in)
                 OR custom shadcn/ui components (matches existing stack)

State/Logic:     Borrow Cord's provider/consumer patterns
                 + chatscope/use-chat for headless state management

Schema:          Cord's PostgreSQL migrations (threads, reactions, mentions)
                 + Valkyrie's schema (friends, notifications, channels)
                 + Supabase Slack Clone's RLS policies

Real-time:       Supabase Realtime
                 - Broadcast: typing indicators, ephemeral events
                 - Presence: online/offline status
                 - Postgres Changes: message inserts/updates/deletes

Integration:     Discord Clone pattern for Next.js App Router routing
                 + Supabase Auth (existing)
                 + Supabase Storage for media uploads
```

### What We Build vs What We Borrow

| Layer | Build | Borrow From |
|-------|-------|-------------|
| PostgreSQL schema (channels, messages, threads, reactions) | Adapt | Cord, Valkyrie, Mattermost |
| RLS policies | Write | Supabase Slack Clone |
| Next.js routes and pages | Build | Discord Clone pattern |
| Message rendering components | Choose | chatscope or custom shadcn/ui |
| Typing indicators | Wire up | Supabase Broadcast + chatscope/use-chat |
| Presence (online/offline) | Wire up | Supabase Presence API |
| File/media uploads | Build | Valkyrie's S3 pattern, adapted for Supabase Storage |
| Moderation tools | Build | Valkyrie's kick/ban patterns |
| Infinite scroll / pagination | Choose | chatscope (built-in) or tanstack/query (Discord Clone pattern) |
| Thread UI | Build | Study stream-chat-react's Thread component |
| Reaction system | Build | Study Cord's schema + stream-chat-react's UI |

---

## Open Questions

1. **UI library choice:** chatscope (proven, MIT, drop-in) vs custom shadcn/ui components (matches existing design system, more work). Need to evaluate chatscope's visual compatibility with our Tailwind/shadcn design.
2. **Threading model:** Simple reply-to (like current spec's `reply_to_id`) vs Zulip-style topics vs Discord-style thread channels? Each has different schema and UX implications.
3. **Read receipts:** Per-message or per-channel last-read marker? Per-message is expensive at scale. Per-channel is simpler and sufficient for 50-200 users.
4. **Message search:** PostgreSQL full-text search (GIN index) should be sufficient at this scale. Confirm no need for Elasticsearch/Typesense.
5. **Media handling:** Use Supabase Storage directly or Cloudflare R2 (already in stack for video library)? Unify or keep separate?
6. **Notification system:** In-app only or also email/push for DMs and mentions? If push, need a service (Novu, Knock, or custom).
7. **Reactions data model:** Separate table (message_id, user_id, emoji) vs JSONB column on messages? Separate table is cleaner for queries and RLS.
8. **Channel types:** How do segment-restricted bootcamp channels work technically? Tag-based RLS policies? Channel membership table?
9. **Message editing/deletion:** Soft delete (mark as deleted, show "message was deleted") or hard delete? Edit history?
10. **Rate limiting:** Prevent spam. Server-side rate limiting on message inserts via Supabase Edge Functions or RLS?

## Additional Research Needed

- [ ] Pull and review Cord's actual PostgreSQL schema and migrations
- [ ] Pull and review Valkyrie's PostgreSQL schema
- [ ] Review the Discord Clone's Prisma schema for channel/message/member models
- [ ] Evaluate chatscope components visually against our design system
- [ ] Prototype Supabase Realtime Broadcast for typing indicators (latency, reliability)
- [ ] Research Supabase Presence API limits (max concurrent connections on our plan)
- [ ] Investigate Supabase Edge Functions for server-side chat logic (rate limiting, moderation hooks)

---

## References

- Cord: https://github.com/getcord/cord
- Valkyrie: https://github.com/sentrionic/Valkyrie
- Mattermost: https://github.com/mattermost/mattermost
- Discord Clone: https://github.com/nayak-nirmalya/discord-clone
- chatscope UI: https://github.com/chatscope/chat-ui-kit-react
- chatscope hooks: https://github.com/chatscope/use-chat
- react-chat-elements: https://github.com/Detaysoft/react-chat-elements
- Supabase Slack Clone: https://github.com/supabase/supabase/tree/master/examples/slack-clone
- Supabase Realtime Chat UI: https://supabase.com/ui/docs/nextjs/realtime-chat
- Stream Chat React (study only): https://github.com/GetStream/stream-chat-react
- Tinode: https://github.com/tinode/chat
- Revolt.js: https://github.com/revoltchat/revolt.js
