# Salsa Ninja — Development Roadmap

> **Principle:** Front-load features that are low in complexity and high in utility. Each phase builds toward the next, with revenue-critical features prioritized early.

---

## Phase 0 — Foundation + Group Classes

Establish the platform, auth, and day-to-day class schedule management.

- Auth (magic link sign up/login, invite-only)
- Public pages (landing, about, pricing, contact)
- Member dashboard
- Class schedule management (create, edit, recurring)
- Event announcements (display only, 3rd party managed)
- Simple invite link registration
- Admin: schedule management
- Deploy to Vercel

## Phase 1 — Private Lessons & Payments

Enable private lesson booking and the first revenue flow through the platform.

- Private lesson scheduling (open-source library)
- Instructor availability management (3 instructors)
- Private lesson booking flow
- Google Calendar integration (push bookings to instructor calendars)
- Light messaging to coaches (1:1 only, not full chat)
- Lesson payments (Stripe)
- Admin: instructor availability, lesson management

## Phase 2 — Class Operations

Operational tools for managing group classes day-to-day.

- Group class check-in / attendance tracking
- QR code registration (studio-wide + per-class)
- Class enrollment self-management
- Class capacity & waitlist management

## Phase 3 — Enrollment & Member Dashboard

Give members visibility into their enrollment, balances, and history.

- Enrollment tier visibility (current plan, status)
- Private lesson balance (remaining from purchased blocks)
- Attendance history
- Video library (class recordings, homework)
- Admin: member enrollment overview

## Phase 4 — Unified Payments & Billing

Consolidate all payment flows into a single integrated system.

- Full Stripe integration (subscriptions, drop-ins, event tickets)
- Billing history, receipts, invoices
- Member self-service plan changes
- Admin: financial reporting, plan management

## Phase 5 — Event Integration

Replace 3rd party event management with an integrated solution.

- Integrated event management (replace 3rd party)
- RSVP, capacity, waitlist
- Event payments (tied to unified billing)

## Phase 6 — Community (Foundation)

Stand up core messaging infrastructure. Run parallel with Telegram.

- Channel list and basic messaging (real-time via Supabase Broadcast + DB persist)
- Channel membership and access control (RLS)
- Auto-enrollment for public channels (General, Events, Socials, Practice Partners)
- Message input, auto-scroll, infinite scroll pagination
- DM conversations (1:1 messaging)
- Reply-to with quoted preview
- Typing indicators and online presence
- Notifications system
- Run parallel with Telegram

## Phase 7 — Community (Full)

Complete the community platform and migrate off Telegram.

- Reactions (emoji picker + reaction bar)
- Message editing and soft delete
- Image/file attachments (Supabase Storage)
- Unread counts per channel (sidebar badges)
- Jump-to-first-unread, mark as read
- DM email notifications (Edge Function + Resend)
- @mention detection and digest emails (Vercel Cron)
- Notification preferences UI
- Full-text message search
- Moderation tools (delete, mute, ban)
- Segment-restricted channels (bootcamp cohorts)
- Complete Telegram migration

## Phase 8 — Growth & Polish

Expand reach and refine the experience.

- Referral system
- PWA (progressive web app)
- i18n (English + Spanish via next-intl)
- Native app prep
