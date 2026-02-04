# Membership: Edge Cases & Acceptance Criteria

## Edge Cases

### Registration

| Scenario | Solution |
|----------|----------|
| Email already exists | Redirect to login with message |
| Invalid email format | Client + server validation |
| Referral code doesn't exist | Ignore, proceed with signup |
| Verification link expires | Show message + resend option |
| Browser closed before profile complete | Allow completion on next login |

### Authentication

| Scenario | Solution |
|----------|----------|
| Session expires while using app | Prompt re-login, preserve page |
| Multiple login links requested | All valid until one used |
| Magic link clicked twice | Second shows "already used" |
| Email delivery delayed | "May take a few minutes" message |

### Subscription

| Scenario | Solution |
|----------|----------|
| Payment fails | Set past_due, email, grace period |
| Subscription expires | Downgrade to member_limited |
| User downgrades mid-billing | Keep access until period ends |

### Profile

| Scenario | Solution |
|----------|----------|
| Avatar too large | 2MB limit, client-side check |
| XSS in bio | Sanitize all inputs |
| Very long name | 100 char limit |

### Admin

| Scenario | Solution |
|----------|----------|
| Owner demotes themselves | Prevent; need 1 owner minimum |
| Delete member with subscription | Warn; cancel subscription first |

## Acceptance Criteria

### Registration
- [ ] QR code scan opens join page with tracking
- [ ] Email verification sent within 60 seconds
- [ ] Profile form captures name, photo, experience
- [ ] Plan selection shows monthly/annual options
- [ ] Existing email redirects to login

### Authentication
- [ ] Magic link logs user in
- [ ] Session persists for 7 days
- [ ] Logout clears session
- [ ] Expired links show clear message

### Role Access
- [ ] Full members access: dashboard, calendar, chat, videos
- [ ] Limited members see upgrade prompts
- [ ] Guests can only view plans
- [ ] Owner can access admin panel

### Profile
- [ ] Members can view and edit their profile
- [ ] Avatar upload works (under 2MB)
- [ ] Can view other members' public info
- [ ] Cannot see others' email/billing

### Admin
- [ ] Owner sees all members list
- [ ] Can search by name/email
- [ ] Can change member roles
- [ ] Can generate QR invite codes

### Non-Functional
- [ ] Pages load in under 2 seconds
- [ ] Works on 375px mobile width
- [ ] All forms keyboard navigable
- [ ] Rate limit: 5 login requests/hour/email

## Open Questions

| Question | Recommendation |
|----------|----------------|
| Social login in MVP? | No, add later |
| Session duration? | 7 days |
| Show locked features? | Yes, with upgrade prompt |
| Max avatar size? | 2MB |
| Rate limit for login? | 5 per hour per email |
