# API Endpoints

## Route Structure

```
/api
├── /auth
│   ├── POST /signup          # QR/referral signup
│   ├── POST /login           # Request magic link
│   └── POST /logout          # Sign out
│
├── /members
│   ├── GET  /me              # Current member profile
│   ├── PATCH /me             # Update own profile
│   ├── GET  /                # List members (staff only)
│   └── PATCH /:id            # Update member (staff only)
│
├── /events
│   ├── GET  /                # List events
│   ├── POST /                # Create event (staff)
│   ├── GET  /:id             # Get event details
│   ├── PATCH /:id            # Update event (staff)
│   ├── POST /:id/rsvp        # RSVP to event
│   └── POST /community       # Submit community event
│
├── /videos
│   ├── GET  /                # List videos
│   ├── POST /                # Upload video (staff)
│   ├── GET  /:id             # Get video details
│   ├── POST /:id/progress    # Update watch progress
│   └── GET  /homework        # Videos for attended classes
│
├── /chat
│   ├── GET  /channels        # List accessible channels
│   ├── GET  /channels/:id    # Get channel messages
│   ├── POST /channels/:id    # Send message
│   └── GET  /dm/:memberId    # Get DM thread
│
├── /payments
│   ├── POST /checkout        # Create Stripe checkout
│   ├── GET  /portal          # Get Stripe portal URL
│   └── POST /webhook         # Stripe webhook handler
│
├── /referrals
│   ├── GET  /                # Get referral stats
│   └── GET  /link            # Get referral link/QR
│
├── /admin
│   ├── GET  /dashboard       # Dashboard data
│   ├── POST /invites         # Generate invite codes
│   └── POST /qr              # Generate QR code
│
├── /search
│   └── GET  /                # Global search
│
└── /upload
    ├── POST /video           # Presigned URL for video
    └── POST /image           # Presigned URL for image
```
