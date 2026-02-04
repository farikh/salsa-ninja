# Salsa Ninja - Project Overview

## Goal

Replace the existing Wix website with a modern community platform built on Next.js. The platform combines a public website, invite-only member portal, and admin tools into a single application.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Hosting | Vercel |
| Payments | Stripe |
| CMS | Sanity |
| Video Storage | Cloudflare R2 |
| Push Notifications | OneSignal |
| Email | Resend |
| i18n | next-intl |

## Project Structure

- **Workspace root:** `C:\Development\Projects\_Claude Code\website\salsa ninja`
- **Next.js project:** `./app/` (all npm commands run from here)
- **Dev server:** `http://localhost:3000` via `npm run dev`
- **Docs:** `./docs/`

## Core Pages

### Public (no auth)
- `/` - Landing page (hero, CTAs, class highlights, testimonials)
- `/about` - Studio story, instructor profiles
- `/pricing` - Subscription plans (monthly, annual, drop-in)
- `/schedule` - Calendly embed (`https://calendly.com/tafari-k-higgs/30min`)
- `/contact` - Contact info, Google Maps embed, contact form
- `/join` - Invite-only registration entry point

### Member Portal (auth required)
- `/dashboard` - Upcoming events, announcements, homework videos
- `/calendar` - Event calendar with RSVP
- `/chat` - Channel messaging + DMs
- `/videos` - Class video library with search
- `/settings` - Account & profile management

### Admin (owner/instructor)
- `/admin` - Dashboard, event/video/member management, invites

## Development Phases

| Phase | Focus |
|-------|-------|
| 0 - Demo | Auth, basic UI, member dashboard, deploy |
| 1 - Core | Calendar, events, payments, basic chat |
| 2 - Content | Video library, search, admin panel |
| 3 - Growth | Referrals, PWA, polish |
| 4 - i18n | Multi-language (EN/ES), native app prep |

## Current Status

- Next.js project initialized with Tailwind CSS
- Basic Navbar, Footer, and Layout components created
- Placeholder pages exist for Home, Schedule, Pricing, About, Contact
- Calendly embed integrated on /schedule
- **Next:** Populate pages with content, apply styling, begin Phase 0 platform work
