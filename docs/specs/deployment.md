# Deployment & Operations

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
CLOUDFLARE_R2_BUCKET=

# Other
ONESIGNAL_APP_ID=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

## Supabase Setup

1. Create project at supabase.com
2. Run schema migration (see `specs/database-schema.md`)
3. Configure Auth (Email provider, magic link)
4. Enable Realtime for messages table

## Stripe Setup

1. Create products (Monthly, Annual, Drop-in)
2. Configure Customer Portal
3. Set up webhooks

## Vercel Deployment

1. Connect GitHub repo
2. Set environment variables
3. Configure domains
4. Enable automatic deployments

## Cost Projections

### Monthly Operating Costs

| Members | Vercel | Supabase | R2 Storage | Stripe Fees | Total |
|---------|--------|----------|------------|-------------|-------|
| 25 | $0 | $0 | $1 | ~$8 | ~$9 |
| 50 | $0 | $0 | $3 | ~$15 | ~$18 |
| 100 | $0 | $25 | $8 | ~$30 | ~$63 |
| 250 | $20 | $25 | $20 | ~$75 | ~$140 |
| 500 | $20 | $25 | $40 | ~$150 | ~$235 |

### Comparison to SaaS Platforms

| Platform | 50 Members | 100 Members | 250 Members |
|----------|------------|-------------|-------------|
| Custom Build | ~$18/mo | ~$63/mo | ~$140/mo |
| Circle | ~$105/mo | ~$120/mo | ~$165/mo |
| Heartbeat | ~$55/mo | ~$125/mo | ~$180/mo |
