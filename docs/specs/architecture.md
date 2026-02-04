# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Web Browser │  │  PWA (iOS)   │  │ PWA (Android)│  │ Native (v2)  │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
└─────────┼─────────────────┼─────────────────┼─────────────────┼─────────────┘
          │                 │                 │                 │
          └─────────────────┴────────┬────────┴─────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VERCEL                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Next.js Application                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│  │  │ Public Site │  │   Members   │  │    Admin    │  │    API     │  │   │
│  │  │   /         │  │  /dashboard │  │   /admin    │  │   /api/*   │  │   │
│  │  │   /about    │  │  /calendar  │  │   /admin/*  │  │            │  │   │
│  │  │   /pricing  │  │  /chat      │  │             │  │            │  │   │
│  │  │   /join     │  │  /videos    │  │             │  │            │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
          ▼                          ▼                          ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│    SUPABASE     │      │     STRIPE      │      │   CLOUDFLARE    │
│  ┌───────────┐  │      │                 │      │      R2         │
│  │ PostgreSQL│  │      │  - Checkout     │      │                 │
│  │ + RLS     │  │      │  - Subscriptions│      │  - Videos       │
│  ├───────────┤  │      │  - Portal       │      │  - Documents    │
│  │   Auth    │  │      │  - Webhooks     │      │  - Media        │
│  ├───────────┤  │      │                 │      │                 │
│  │ Realtime  │  │      └─────────────────┘      └─────────────────┘
│  ├───────────┤  │                │
│  │  Storage  │  │                │ Webhooks
│  ├───────────┤  │                │
│  │Edge Funcs │◄─┼────────────────┘
│  └───────────┘  │
└─────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL SERVICES                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   OneSignal  │  │    Resend    │  │    Sanity    │  │  (Analytics) │    │
│  │  Push Notif  │  │    Email     │  │     CMS      │  │   Future     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Request Flow Examples

**Public page load:**
```
Browser → Vercel Edge → Next.js SSR → Sanity CMS → Render HTML
```

**Authenticated member action:**
```
Browser → Vercel → Next.js API Route → Verify Supabase JWT → Query PostgreSQL → Return JSON
```

**Real-time chat:**
```
Browser → Supabase Realtime (WebSocket) → PostgreSQL INSERT trigger → Broadcast to channel subscribers
```

**Video upload:**
```
Admin → Next.js API → Presigned URL from R2 → Direct upload to R2 → Store metadata in PostgreSQL
```

**Payment flow:**
```
Member → Stripe Checkout → Stripe webhook → Supabase Edge Function → Update member status
```
