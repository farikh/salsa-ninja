# Salsa Ninja - Site Structure for Refactoring

## Current Platform
- **Platform:** Wix (Thunderbolt renderer)
- **Site Revision:** 381

## Page Structure

```
/                     - Homepage (Salsa Ninja Dance Academy)
/contact              - Contact Info
/on-demand            - On-Demand Video Classes
/register             - Registration & Waiver
/shoesandapparel      - Shoes & Apparel Shop
```

## Recommended Next.js Route Structure

```
src/app/
├── page.tsx              # Homepage
├── layout.tsx            # Root layout with nav/footer
├── globals.css           # Global styles
├── contact/
│   └── page.tsx          # Contact page
├── classes/
│   └── page.tsx          # Class schedule & info
├── on-demand/
│   └── page.tsx          # On-demand video library
├── register/
│   └── page.tsx          # Registration & waiver
├── shop/
│   └── page.tsx          # Shoes & apparel
├── about/
│   └── page.tsx          # About / instructors
└── pricing/
    └── page.tsx          # Pricing packages
```

## Key Features to Implement

1. **Homepage**
   - Hero section with call-to-action
   - $5 first class promotion
   - Location highlight (Sunrise, FL)
   - Class type overview (Salsa, Bachata)

2. **Class Schedule**
   - Weekly schedule display
   - Calendly or similar booking integration
   - Class level indicators

3. **On-Demand**
   - Video library with categories
   - Skill level filtering
   - Video player integration

4. **Registration**
   - Online registration form
   - Waiver/liability form
   - Payment integration

5. **Shop**
   - Product catalog (dance shoes, apparel)
   - Shopping cart
   - Checkout flow

6. **Contact**
   - Contact form
   - Map embed
   - Hours display
   - Phone/email links

## Design Notes

- Current site has a professional dance studio aesthetic
- Likely uses dance imagery and action shots
- Should support dark/light modes
- Mobile-responsive required
