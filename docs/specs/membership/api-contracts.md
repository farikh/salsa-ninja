# Membership: API Contracts

## POST /api/auth/signup

**Request:**
```json
{
  "email": "john@example.com",
  "referral_code": "abc123",
  "invite_source": "qr-studio-jan"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

**Response (409 - Email exists):**
```json
{
  "success": false,
  "error": "email_exists",
  "message": "An account with this email already exists",
  "action": "login"
}
```

## POST /api/auth/login

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login link sent"
}
```

**Response (404):**
```json
{
  "success": false,
  "error": "not_found",
  "message": "No account found with this email"
}
```

## GET /api/members/me

**Response (200):**
```json
{
  "id": "uuid",
  "email": "john@example.com",
  "full_name": "John Rivera",
  "display_name": "John R.",
  "avatar_url": "https://...",
  "role_name": "member_full",
  "permissions": {
    "full_chat": true,
    "video_library": true
  },
  "subscription_tier": "monthly",
  "subscription_status": "active",
  "referral_code": "john-r-7x2k",
  "tags": ["bootcamp-jan-2026"]
}
```

## PATCH /api/members/me

**Request:**
```json
{
  "full_name": "John Rivera Jr.",
  "display_name": "Johnny",
  "bio": "Love salsa!",
  "preferred_language": "es"
}
```

**Response (200):**
```json
{
  "success": true,
  "member": { "...updated member..." }
}
```

## GET /api/members (Admin)

**Query Params:** `?search=john&role=member_full&limit=20&offset=0`

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "john@example.com",
      "full_name": "John Rivera",
      "role_name": "member_full",
      "subscription_status": "active",
      "created_at": "2026-01-15T10:30:00Z"
    }
  ],
  "total": 47,
  "limit": 20,
  "offset": 0
}
```

## POST /api/admin/invites

**Request:**
```json
{
  "count": 5,
  "max_uses": 1,
  "expires_in_hours": 48,
  "source": "qr-flyer-feb"
}
```

**Response (200):**
```json
{
  "invites": [
    {
      "code": "abc123",
      "url": "https://studio.com/join?ref=abc123",
      "qr_url": "https://studio.com/api/qr/abc123",
      "expires_at": "2026-02-05T10:30:00Z"
    }
  ]
}
```

## Email Templates

### Verification Email
**Subject:** Verify your email for [Studio Name]
- Welcome message + verify link (expires 1 hour)

### Login Email
**Subject:** Your login link for [Studio Name]
- Greeting + login link (expires 1 hour)
