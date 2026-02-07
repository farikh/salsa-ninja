# Development Conventions

> Project-specific standards for the Salsa Ninja codebase. Read this before implementing any code changes.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Payments:** Stripe
- **Hosting:** Vercel
- **Video:** Cloudflare R2

## App Directory

All npm commands run from `app/`:
```bash
cd app && npm run dev    # Dev server → http://localhost:3000
cd app && npm run build  # Build verification
```

## Styling

- Tailwind CSS utilities. shadcn/ui components before custom ones.
- **Primary:** red/coral `#ef4444`
- **Secondary:** gold/amber `#f59e0b`
- **Neutrals:** `#fafafa` – `#18181b`

## Auth

- Magic link only (no passwords)
- Invite-only via QR or referral link

## Roles

owner, instructor, member_full, member_limited, guest

Enforced via middleware + Supabase RLS.

## Responsive

Mobile-first: sm 640px, md 768px, lg 1024px, xl 1280px.

## i18n

English + Spanish via next-intl (Phase 4).

## Key Conventions

- **GitHub before from-scratch:** Search GitHub for existing patterns before designing custom solutions. Adapt proven patterns. Document findings in `docs/research/`.
- **shadcn/ui first:** Check shadcn/ui component library before building custom UI.
- **Read before edit:** Never propose changes to code you haven't read.
- **No over-engineering:** Only make changes directly requested or clearly necessary. Don't add features, refactor, or "improve" beyond what was asked.
- **Security:** Avoid OWASP top 10 vulnerabilities. Validate at system boundaries.
