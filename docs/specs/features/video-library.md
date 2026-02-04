# Feature Spec: Video Library

## Structure

- Organized by class date, style, level
- Linked to calendar events
- Searchable by keywords (tags)

## Features

- Full-text search ("suzie q", "cross body lead")
- Filter by style, level, instructor, date
- Homework view (videos from attended classes)
- Progress tracking (watched, bookmarked, practiced)
- Visibility controls (all members, bootcamp only, attendees only)

## Video Types

`full_class`, `breakdown`, `drill`, `combo`, `social_clip`, `promo`

## Storage

Videos stored in Cloudflare R2 (cheapest storage, free egress). Metadata in PostgreSQL.

Upload flow:
```
Admin → Next.js API → Presigned URL from R2 → Direct upload to R2 → Store metadata in PostgreSQL
```

## Related Specs

- Database tables: `videos`, `video_tags`, `video_progress` — see `specs/database-schema.md`
- API routes: `/api/videos/*` — see `specs/api-endpoints.md`
- Storage config: Cloudflare R2 — see `specs/deployment.md`
