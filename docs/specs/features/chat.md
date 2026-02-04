# Feature Spec: Chat System

## Channels

- **Public channels:** General, Events, Socials, Practice Partners
- **Segment-restricted channels:** Bootcamp cohorts (tag-based visibility)
- **Direct messages:** 1:1 between members

## Features

- Real-time messaging via Supabase Realtime (WebSocket)
- Media sharing (photos, videos)
- Reactions
- Message search (full-text via PostgreSQL GIN index)
- Reply threading (reply_to_id)
- Moderation tools (staff can moderate)

## Access Control

- **Full chat:** owner, instructor, member_full
- **Limited chat:** member_limited (restricted channels only)
- **No chat:** guest

## Real-time Flow

```
Browser → Supabase Realtime (WebSocket) → PostgreSQL INSERT trigger → Broadcast to channel subscribers
```

## Related Specs

- Database tables: `channels`, `messages`, `direct_messages` — see `specs/database-schema.md`
- API routes: `/api/chat/*` — see `specs/api-endpoints.md`
- Roles: chat permissions per role — see `specs/auth-and-roles.md`
