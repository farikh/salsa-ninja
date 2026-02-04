# Salsa Studio Community Platform — Technical Specification

**Version:** 1.0 | **Date:** February 3, 2026 | **Status:** Ready for Development

A custom-built community platform for a salsa dance studio, replacing Wix (public website) and Telegram (member communication) with a unified, invite-only ecosystem.

## Core Value Propositions

- **Closed ecosystem** — Eliminates scammer infiltration from open platforms
- **Unified experience** — Single login for website, community, video library, payments
- **Owner-friendly** — Non-technical admin interface for daily management
- **Cost-effective** — ~$20-70/month vs $100+/month for equivalent SaaS platforms

## Specification Documents

Read only the documents relevant to your current task.

### Architecture & Infrastructure

| Document | Contents |
|----------|----------|
| [Architecture](specs/architecture.md) | System diagram, client/server topology, request flow examples |
| [Database Schema](specs/database-schema.md) | ERD, complete SQL (tables, enums, indexes, RLS policies, triggers, views, helper functions) |
| [Deployment](specs/deployment.md) | Environment variables, Supabase/Stripe/Vercel setup, cost projections |
| [Project Structure](specs/project-structure.md) | File/folder layout, quick start commands, dependency list |

### Auth, API & Roles

| Document | Contents |
|----------|----------|
| [Auth & Roles](specs/auth-and-roles.md) | Auth flows (QR, referral, magic link), role-based access matrix |
| [API Endpoints](specs/api-endpoints.md) | Complete API route tree (`/api/auth`, `/api/members`, `/api/events`, etc.) |

### Features

| Document | Contents |
|----------|----------|
| [Calendar & Events](specs/features/calendar.md) | Event types, RSVP, waitlist, recurring events, visibility |
| [Video Library](specs/features/video-library.md) | Search, filters, homework view, progress tracking, R2 storage |
| [Chat System](specs/features/chat.md) | Channels, DMs, real-time messaging, moderation |
| [Admin Panel](specs/features/admin.md) | Dashboard, event/video/member management, invites |

### Design

| Document | Contents |
|----------|----------|
| [UI Design](specs/ui-design.md) | shadcn/ui component library, color palette, responsive breakpoints |

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 14 (App Router) | AI-coding friendly, excellent docs, server components |
| Styling | Tailwind CSS + shadcn/ui | Rapid development, consistent design system |
| Backend | Supabase | PostgreSQL + Auth + Realtime + Storage in one |
| Hosting | Vercel | Zero-config deployments, generous free tier |
| Payments | Stripe | Industry standard, excellent API |
| CMS | Sanity | Owner-editable website content |
| Video Storage | Cloudflare R2 | Cheapest storage, free egress |
| Push Notifications | OneSignal | Generous free tier, PWA + native support |
| Email | Resend | Developer-friendly, free tier |
| i18n | next-intl | Type-safe translations |

## Development Phases

| Phase | Focus |
|-------|-------|
| 0 - Demo | Auth, basic UI, member dashboard, deploy |
| 1 - Core | Calendar, events, payments, basic chat |
| 2 - Content | Video library, search, admin panel |
| 3 - Growth | Referrals, PWA, polish |
| 4 - i18n | Multi-language (EN/ES), native app prep |
