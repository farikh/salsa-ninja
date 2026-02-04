# Membership: Technical Design

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth provider | Supabase Auth | Integrated with database, magic link support |
| Session storage | Supabase + Cookie | Secure, works with SSR |
| Password strategy | None (magic link) | Simpler UX, fewer security concerns |
| Role storage | Database | Flexible, auditable |
| Permission check | Middleware + RLS | Defense in depth |

## Key Files Structure

```
app/
├── (public)/
│   ├── page.tsx                 # Landing page
│   ├── login/page.tsx           # Login page
│   └── join/
│       ├── page.tsx             # Join entry (email)
│       ├── verify/page.tsx      # Check email message
│       ├── profile/page.tsx     # Profile setup
│       └── plan/page.tsx        # Plan selection
├── (member)/
│   ├── dashboard/page.tsx       # Member dashboard
│   ├── profile/page.tsx         # View/edit profile
│   └── settings/page.tsx        # Account settings
├── (admin)/
│   └── admin/
│       ├── page.tsx             # Admin dashboard
│       ├── members/page.tsx     # Members list
│       └── invites/page.tsx     # Invite management
├── auth/
│   └── callback/route.ts        # Magic link handler
└── api/
    ├── auth/
    │   ├── signup/route.ts
    │   ├── login/route.ts
    │   └── logout/route.ts
    ├── members/
    │   ├── route.ts             # GET all, POST new
    │   ├── me/route.ts          # GET/PATCH current
    │   └── [id]/route.ts        # GET/PATCH specific
    └── admin/
        └── invites/route.ts
```

## Type Definitions

```typescript
// types/membership.ts

export type UserRole =
  | 'owner'
  | 'instructor'
  | 'member_full'
  | 'member_limited'
  | 'guest';

export type SubscriptionTier =
  | 'monthly'
  | 'annual'
  | 'drop_in'
  | 'trial';

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'none';

export interface Member {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  preferred_language: 'en' | 'es';
  bio: string | null;
  dance_experience: string | null;
  stripe_customer_id: string | null;
  subscription_tier: SubscriptionTier | null;
  subscription_status: SubscriptionStatus;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberProfile extends Member {
  role_name: UserRole;
  permissions: Record<string, boolean>;
  available_credits: number;
  tags: string[] | null;
}
```

## Middleware

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const publicRoutes = ['/', '/about', '/pricing', '/login', '/join'];

const roleRoutes: Record<string, UserRole[]> = {
  '/admin': ['owner'],
  '/videos': ['owner', 'instructor', 'member_full'],
  '/chat': ['owner', 'instructor', 'member_full'],
};

export async function middleware(request: NextRequest) {
  // Create Supabase client
  // Check auth status
  // Redirect if not authenticated
  // Check role-based access
  // Return appropriate response
}
```

## Security

- **Passwords:** Not stored (magic link only)
- **Sessions:** HTTPOnly, Secure, SameSite=Lax, 7-day expiry
- **Rate Limits:** 5 login/hour, 10 signup/hour per IP
- **Input Validation:** Email RFC 5322, Name 1-100 chars, Bio sanitized
