# Authentication & Authorization

## Auth Flow Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION FLOWS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. QR CODE SIGNUP (New Member)                                             │
│     Scan QR → /join?ref=SOURCE → Enter Email → Magic Link → Profile         │
│     → Choose Plan → Stripe Checkout → Dashboard                             │
│                                                                              │
│  2. REFERRAL SIGNUP                                                         │
│     Click Link → /join?ref=MEMBER_CODE → Same flow as QR                    │
│     → Track referral → Apply discount → Credit referrer on conversion       │
│                                                                              │
│  3. RETURNING MEMBER LOGIN                                                  │
│     /login → Enter Email → Magic Link → Email Click → Dashboard             │
│                                                                              │
│  4. INVITE-ONLY (No public registration)                                    │
│     Must have: QR code, referral link, or direct invite from owner          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Role-Based Access Matrix

| Feature | Owner | Instructor | Full | Limited | Guest |
|---------|-------|------------|------|---------|-------|
| **Admin Panel** | Yes | Partial | No | No | No |
| Manage instructors | Yes | No | No | No | No |
| View revenue | Yes | No | No | No | No |
| Upload videos | Yes | Yes | No | No | No |
| Create events | Yes | Yes | No | No | No |
| Post announcements | Yes | Partial | No | No | No |
| **Member Portal** | | | | | |
| Dashboard | Yes | Yes | Yes | Partial | No |
| Full calendar | Yes | Yes | Yes | Yes | Partial |
| RSVP to events | Yes | Yes | Yes | Yes | No |
| Video library | Yes | Yes | Yes | No | No |
| Full chat access | Yes | Yes | Yes | No | No |
| Limited chat | Yes | Yes | Yes | Yes | No |
| Direct messages | Yes | Yes | Yes | No | No |
| Submit community event | Yes | Yes | Yes | No | No |
| **Payments** | | | | | |
| Purchase subscription | No | No | No | Yes | Yes |
| Manage billing | Yes | Yes | Yes | Yes | No |
