# Project Structure

## File Layout

```
salsa-studio-platform/
├── app/
│   ├── (public)/           # Public routes (no auth)
│   │   ├── page.tsx        # Landing page
│   │   ├── about/
│   │   ├── pricing/
│   │   ├── schedule/
│   │   └── join/
│   ├── (auth)/             # Auth routes
│   │   ├── login/
│   │   └── signup/
│   ├── (member)/           # Protected member routes
│   │   ├── dashboard/
│   │   ├── calendar/
│   │   ├── chat/
│   │   ├── videos/
│   │   └── settings/
│   ├── (admin)/            # Admin routes
│   │   └── admin/
│   └── api/                # API routes
│       ├── auth/
│       ├── members/
│       ├── events/
│       ├── videos/
│       ├── chat/
│       └── payments/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Layout components
│   ├── forms/              # Form components
│   └── features/           # Feature-specific components
├── lib/
│   ├── supabase/           # Supabase client & utils
│   ├── stripe/             # Stripe utils
│   └── utils/              # General utilities
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript types
├── messages/               # i18n translations
│   ├── en.json
│   └── es.json
└── public/                 # Static assets
```

## Quick Start Commands

```bash
# Create Next.js project
npx create-next-app@latest salsa-studio --typescript --tailwind --eslint --app

# Install dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install stripe @stripe/stripe-js
npm install next-intl
npm install lucide-react
npm install date-fns

# Install shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog form input

# Run development
npm run dev

# Deploy to Vercel
vercel
```
