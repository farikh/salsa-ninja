# Meeting Prep: Salsa Ninja Website Roadmap

**Date:** Weekend of Feb 8-9, 2026
**Duration:** ~2 hours
**Goal:** Share his vision, demo what's built, align on next steps

---

## Suggested Meeting Agenda

### 1. His Vision First (30-40 min)

Let him talk. Take notes. Key questions to ask:

- What's not working about the current Wix site + Telegram setup?
- What does he wish he could do that he can't today?
- Who are his ideal members? What's the journey from stranger → regular?
- What's his biggest operational headache? (scheduling, payments, communication?)
- Does he want to replace Telegram, or complement it?
- How does he handle payments today? (Cash, Zelle, Square, etc.)
- What's his budget/timeline expectation?

### 2. Demo the Live Site (20 min)

#### Public Pages (on his phone)
- Landing page → clean, mobile-first, real info
- Schedule page → class grid, all 5 pricing tiers, bootcamp callout
- Bootcamp page → full course details, curriculum, payment options
- Events page → next monthly social with ticket link
- Shoes page → affiliate links with his discount code
- Contact → real map, hours, click-to-call

**Talking point:** "Everything you see here is live and real. Your address, hours, pricing, affiliate links — all working."

#### Private Lesson Booking (the wow factor)
- Show instructor availability calendar
- Walk through: pick instructor → see times → book a slot
- Show the messaging thread between student and instructor
- Show instructor side: confirm/decline, manage availability
- Show on mobile — fully responsive

**Talking point:** "Your instructors set their availability, students book directly, and they message each other right here. No back-and-forth texts."

#### Auth & Dashboard
- Magic link login — "no passwords to forget"
- Dashboard with role badges
- Admin member management

**Talking point:** "Members log in with one tap. No passwords. You can manage roles from the admin panel."

### 3. Show the Development Process (15 min)

#### How he submits requests
- Show the GitHub Issue forms (pull up on his phone)
- Feature Request, Bug Report, Content Update, Feedback
- "You fill this out, I see it immediately"

#### How we communicate
- Slack channels: feedback, deployments, reviews
- "When I deploy something, you get a notification"
- "When something needs your approval, you get pinged"

#### How we track progress
- GitHub Projects board: Ideas → In Progress → Review → Done
- "You can see everything at a glance"

#### Voice-to-issue (vision)
- "Eventually, you just record a voice message in Slack, and AI turns it into a ticket automatically"

### 4. Roadmap Discussion (30 min)

Frame as business value, not technical phases:

#### Live Today
| Feature | Value |
|---------|-------|
| Public website | Replaces Wix — professional, mobile-first |
| Private lesson booking | Students book directly, no text coordination |
| Member auth | Magic link, invite-only, multi-role |
| Admin dashboard | Manage members, assign roles |

#### Next (Weeks)
| Feature | Value |
|---------|-------|
| Group class schedule management | Admin controls the schedule from the site |
| Google Calendar sync | Instructors see bookings on their calendar |
| QR code check-in | Scan at the door → attendance tracked |

#### Soon (1-2 Months)
| Feature | Value |
|---------|-------|
| Stripe payments | Subscriptions, drop-ins, event tickets — all online |
| Event management | RSVP, capacity limits, waitlist — built into the site |
| Attendance tracking | Know who's coming, who's dropping off |

#### Later (3-6 Months)
| Feature | Value |
|---------|-------|
| Video library | Class recordings, tutorials, progress tracking |
| Community chat | Replace Telegram with built-in messaging |
| Billing dashboard | Invoices, receipts, subscription management |
| Spanish support | English + Spanish for broader reach |

#### Future
| Feature | Value |
|---------|-------|
| Mobile app (PWA) | "Add to home screen" experience |
| Referral program | Members invite friends, track conversions |
| Full Telegram migration | Move everything under one roof |

### 5. Align on Priorities (15 min)

Key questions to close with:

- "Of everything I showed you, what excites you most?"
- "What would make the biggest difference for your business right now?"
- "Are there things I didn't mention that you'd want?"
- "How do you want to handle content updates? (You do it, I do it, mix?)"
- "What's your timeline for going live / replacing Wix?"

---

## Cost Comparison (if it comes up)

| Members | This Platform | Circle.so | Heartbeat |
|---------|--------------|-----------|-----------|
| 25 | ~$9/mo | $105/mo | $99/mo |
| 50 | ~$18/mo | $120/mo | $125/mo |
| 100 | ~$63/mo | $120/mo | $125/mo |
| 250 | ~$140/mo | $165/mo | $180/mo |

Breakdown: Vercel (free→$20) + Supabase (free→$25) + Stripe fees (~3%)

---

## Things to Collect From the Owner

Ask to get these during or after the meeting:

- [ ] Real instructor names and bios (for the home page)
- [ ] Studio photos (classes, instructors, events, space)
- [ ] Real testimonials or permission to collect from students
- [ ] Verified stats (students trained, years, events, rating)
- [ ] His preferences on dresscode themes for socials
- [ ] Confirmation on pricing tiers (do the 5 tiers match what he charges?)
- [ ] Whether he wants to keep the Square payment link or switch to Stripe
- [ ] Social media accounts to link (Instagram handle confirmed?)
- [ ] Any upcoming events or workshops to add
- [ ] Preferred Slack workspace name

---

## Demo Checklist (Before the Meeting)

- [ ] Open the Vercel site on your phone — test all pages load
- [ ] Test the login flow (magic link) — make sure email sends
- [ ] Have the GitHub Issues page bookmarked to show the forms
- [ ] Have the Slack workspace created (even empty) to show the vision
- [ ] Prepare a QR code for the join link (if invite flow is ready)
- [ ] Charge your phone
