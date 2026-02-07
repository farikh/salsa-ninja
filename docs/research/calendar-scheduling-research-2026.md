# Calendar & Scheduling Research 2026

> **Date:** 2026-02-06
> **Bead:** app-hjb.1 (Research calendar/scheduling implementations)
> **Status:** Research complete
> **Related:** [Previous Research (2026-02-03)](./calendar-research-findings.md) | [Calendar Feature Spec](../specs/features/calendar.md) | [Calendar Architecture Spec](../specs/features/calendar-architecture.md)

---

## Executive Summary

This research evaluates React calendar/scheduling libraries, open-source scheduling systems, real-time update patterns, and mobile calendar UX for the Salsa Ninja dance studio platform. The platform requires: group class schedules (month/week/day/list views), private lesson booking with instructor availability, real-time updates via Supabase Realtime, and mobile-first responsive design.

**Top recommendation:** Build a custom calendar UI using shadcn/ui components (following `lramos33/big-calendar` as reference), with `@dnd-kit` for drag-and-drop interactions, `rrule` for recurrence, and Supabase Realtime for live updates. This aligns with the previous research decision and avoids heavy third-party calendar library lock-in.

---

## 1. React Calendar Libraries

### 1.1 FullCalendar (@fullcalendar/react)

| Metric | Value |
|--------|-------|
| **GitHub** | [fullcalendar/fullcalendar](https://github.com/fullcalendar/fullcalendar) |
| **Stars** | ~19,000 |
| **npm weekly downloads** | ~132,000 (fullcalendar); ~1M+ across all @fullcalendar/* packages |
| **Bundle size** | ~43 KB min+gzip (core + daygrid); grows with plugins |
| **Latest version** | 6.1.20 (Jan 2026) |
| **License** | MIT (standard); commercial license required for premium plugins |
| **Last updated** | Jan 2026 (actively maintained) |

**Key features:**
- 300+ configuration options, extensive plugin ecosystem
- Month/week/day/list/timeline/resource views
- Drag-and-drop event creation and movement
- Recurring events via RRule plugin
- Real React virtual DOM nodes (Fiber-compatible)
- Modular plugin architecture keeps bundle size manageable
- v8 planned Q4 2025 (infinite scroll, resource improvements); v9 planned Q1 2026 (swipe, composable React components)

**Pros for our use case:**
- Most feature-complete calendar library available
- Excellent documentation and large community
- Resource/timeline views useful for instructor scheduling
- Plugin system means we only bundle what we need

**Cons for our use case:**
- Premium plugins (resource timeline, scheduler) require paid license
- CSS customization to match Tailwind/shadcn aesthetic requires significant effort
- Heavy for a studio with only 3 instructors and ~200 events/month
- Opinionated styling conflicts with our design system
- Over-engineered for our scope

---

### 1.2 react-big-calendar

| Metric | Value |
|--------|-------|
| **GitHub** | [jquense/react-big-calendar](https://github.com/jquense/react-big-calendar) |
| **Stars** | ~8,600 |
| **npm weekly downloads** | ~500,000 |
| **Bundle size** | ~45 KB min+gzip (with localizer) |
| **Latest version** | 1.19.4 (Jun 2025) |
| **License** | MIT |
| **Last updated** | Jun 2025 |

**Key features:**
- Google Calendar / Outlook-style calendar component
- Month, week, work week, day, agenda views
- Drag-and-drop with addon (react-big-calendar/lib/addons/dragAndDrop)
- Multiple localizer support (Moment.js, Globalize, date-fns, Day.js)
- Customizable event rendering via component prop overrides
- Touch support via separate addon (react-big-calendar-touch-dnd)

**Pros for our use case:**
- Pure React, MIT licensed, large community
- Familiar Google Calendar-style UX
- Customizable components and renderers
- Good performance for moderate event counts

**Cons for our use case:**
- Less actively maintained (8-month gap to latest release)
- CSS override-heavy to match Tailwind/shadcn
- Performance degrades with high event counts or complex customizations
- Touch/mobile support requires separate addon
- No built-in resource/instructor view
- React 19 support is an open issue

---

### 1.3 Schedule-X (@schedule-x/react)

| Metric | Value |
|--------|-------|
| **GitHub** | [schedule-x/schedule-x](https://github.com/schedule-x/schedule-x) |
| **Stars** | ~2,500 (growing rapidly) |
| **npm weekly downloads** | ~15,000 (@schedule-x/calendar) |
| **Bundle size** | ~25 KB min+gzip (core) |
| **Latest version** | 4.0.1 (Feb 2026) |
| **License** | MIT |
| **Last updated** | Feb 2026 (very actively maintained) |

**Key features:**
- Modern alternative to FullCalendar and react-big-calendar
- Day, week, month views
- Drag-and-drop event rescheduling and resizing
- Built-in dark mode with toggle API
- i18n support out of the box
- Lightweight and performant
- Framework-agnostic core with React/Vue/Angular wrappers
- Requires temporal-polyfill dependency

**Pros for our use case:**
- Lightest bundle of all major calendar libraries
- Modern API design, actively maintained
- Dark mode built-in (matches our design flexibility needs)
- Clean, minimal aesthetic easier to customize with Tailwind

**Cons for our use case:**
- Smaller community and ecosystem
- Fewer examples and third-party resources
- No resource/timeline views yet
- Requires temporal-polyfill (Temporal API not yet standardized)
- Less battle-tested than FullCalendar or react-big-calendar

---

### 1.4 Cal.com / @calcom/atoms

| Metric | Value |
|--------|-------|
| **GitHub** | [calcom/cal.com](https://github.com/calcom/cal.com) |
| **Stars** | ~39,600 |
| **License** | AGPLv3 (viral copyleft) |
| **Last updated** | Feb 2026 (very actively maintained) |

**Key features:**
- Full scheduling infrastructure platform
- Cal Booker Atom: embeddable React scheduling component
- HIPAA, SOC2, GDPR compliant
- Availability management, booking flows, payment integration
- Platform API for custom integrations

**Pros for our use case:**
- Most complete scheduling solution available
- Atoms provide embeddable React components
- Handles complex availability, timezone, and booking logic
- Active development and large community

**Cons for our use case:**
- **AGPLv3 license is a dealbreaker** -- viral copyleft would require open-sourcing our entire codebase
- Massive codebase (full platform, not a library)
- Atoms are tightly coupled to Cal.com platform services
- Over-engineered for 3 instructors and a small studio
- Cannot self-host atoms independently from Cal.com infrastructure

**Verdict:** Do not use. AGPLv3 license is incompatible with our project. Previous research confirmed this decision.

---

### 1.5 lramos33/big-calendar (shadcn/ui Calendar)

| Metric | Value |
|--------|-------|
| **GitHub** | [lramos33/big-calendar](https://github.com/lramos33/big-calendar) |
| **Stars** | ~860 |
| **License** | MIT |
| **Last updated** | 2025 |

**Key features:**
- Built natively with shadcn/ui and Tailwind CSS
- Modern, responsive interface for managing events
- Month, week, day, and agenda views
- Clean integration with shadcn component library
- TypeScript throughout

**Pros for our use case:**
- **Best visual and architectural fit for our stack** (Next.js + shadcn/ui + Tailwind)
- No CSS override gymnastics needed
- Uses the same component primitives we already use
- Clean, readable codebase to fork/reference
- MIT licensed

**Cons for our use case:**
- Not an npm package (reference implementation, not a library)
- Smaller community
- Less feature-complete than FullCalendar
- Would require custom work for drag-and-drop, real-time, etc.

**Verdict:** Best reference implementation for our UI layer. Use as the starting point for our custom calendar components.

---

### 1.6 @dnd-kit (Drag-and-Drop Toolkit)

| Metric | Value |
|--------|-------|
| **GitHub** | [clauderic/dnd-kit](https://github.com/clauderic/dnd-kit) |
| **Stars** | ~16,200 |
| **npm weekly downloads** | ~5,400,000 (@dnd-kit/core) |
| **Bundle size** | ~12 KB min+gzip (@dnd-kit/core) |
| **License** | MIT |
| **Last updated** | 2025 |

**Key features:**
- Modular drag-and-drop primitives (useDraggable, useDroppable hooks)
- Touch, keyboard, mouse, and pointer event support
- Accessible by default (screen reader instructions, ARIA attributes, live region updates)
- Collision detection algorithms (rectangle, closest center, closest corners)
- Sortable preset for list reordering
- Extensible sensor system
- Zero dependencies on the core package

**Pros for our use case:**
- Industry standard for React drag-and-drop
- Native touch support critical for mobile calendar interactions
- Keyboard accessibility built-in
- Lightweight and composable
- Can be paired with any calendar UI (including our custom shadcn components)

**Cons for our use case:**
- Not calendar-specific -- requires custom integration work for time-slot snapping, event resizing, etc.
- Need to build calendar-specific collision detection and snap-to-grid behavior

**Verdict:** Use as the drag-and-drop layer for our custom calendar. Pair with shadcn/ui calendar components for event rescheduling and private lesson slot selection.

---

### 1.7 Other Notable Libraries

| Library | Notes |
|---------|-------|
| **Bryntum Scheduler** | Commercial only. Enterprise-grade with resource views, 45+ locales, virtual rendering. Pricing requires sales contact. Overkill and too expensive for our scale. |
| **DHTMLX Scheduler** | Commercial. Rich feature set but dated API. Not React-native. |
| **Syncfusion React Scheduler** | Commercial with community license. Feature-rich but heavy bundle. |
| **Mobiscroll** | Commercial. Excellent mobile UX and touch interactions. Responsive breakpoint system. Worth studying for mobile UX patterns even if we don't use the library. |
| **react-day-picker** | Lightweight date picker (not a full calendar). Used by shadcn/ui internally for date pickers. |
| **DevExtreme React Scheduler** | Commercial. Enterprise scheduling with appointments, resources, and recurrence. |

---

## 2. Open-Source Scheduling Systems

### 2.1 Dance Studio / Fitness Management Systems

| Project | Stack | Stars | Relevance |
|---------|-------|-------|-----------|
| [Deamoner/dance.studio](https://github.com/Deamoner/dance.studio) | React, Material-UI | Low | Basic dance studio website. No scheduling/booking features. Not useful as reference. |
| [mpaitgt/the-floor-is-yours](https://github.com/mpaitgt/tfiy) | React, Material UI, Node/Express | Low | Dance studio website. Desktop + mobile. No scheduling system. |
| [TritonSE/DT-Website](https://github.com/TritonSE/DT-Website) | React, HTML, CSS, Bootstrap | Low | Dance team website. Static content, no scheduling. |

**Finding:** No mature open-source dance studio management systems with scheduling exist in the React/Next.js ecosystem. The closest analogues are fitness/gym management systems (below).

### 2.2 Fitness / Gym Class Scheduling Systems

| Project | Stack | Relevance |
|---------|-------|-----------|
| [nguyenbry/fit](https://github.com/nguyenbry/fit) | Next.js App Router, Postgres, Supabase Auth, shadcn/ui | **High** -- Same stack as ours. Fitness tracker, not class scheduler, but good reference for Supabase + shadcn patterns. |
| GYM One | Open-source gym management | Moderate -- Has class scheduling but not React/Next.js based. |

### 2.3 Appointment Booking Systems (React/Next.js)

| Project | Stack | Stars | Relevance |
|---------|-------|-------|-----------|
| [adityayaduvanshi/Appointment-Booking-System](https://github.com/adityayaduvanshi/Appointment-Booking-System) | Next.js, React, TypeScript, MongoDB, Prisma, Tailwind | Moderate | Full booking flow with multiple user roles. MongoDB instead of Supabase. |
| [DariusGarcia/appointment-scheduler](https://github.com/DariusGarcia/appointment-scheduler) | Next.js | Low | Basic appointment booking. |
| [Firgrep/next-office-booking-app](https://github.com/Firgrep/next-office-booking-app) | Next.js, tRPC, NextAuth, Prisma (T3 stack) | Moderate | Office booking with T3 stack. Good architectural reference for booking flows. |
| [cosmicjs/appointment-scheduler](https://github.com/cosmicjs/appointment-scheduler) | React, Twilio, Cosmic | Low | Simple scheduler with SMS notifications. |

**Key takeaway:** No existing open-source project covers our exact needs (dance studio + Supabase + Next.js + real-time). We need to build custom, using these as architectural references where relevant.

---

## 3. Real-Time Calendar Patterns

### 3.1 Supabase Realtime for Calendar Updates

**Architecture pattern:**

```
                    +-----------------+
                    |   Supabase DB   |
                    |  (events table) |
                    +--------+--------+
                             |
                    Postgres Changes
                             |
                    +--------+--------+
                    | Supabase Realtime|
                    |   (WebSocket)   |
                    +--------+--------+
                             |
              +--------------+--------------+
              |              |              |
         Client A       Client B       Client C
     (Instructor)     (Member)      (Admin Dashboard)
```

**Implementation pattern:**

1. **Initial load:** Fetch current events with a standard Supabase query
2. **Subscribe:** Open a Realtime channel for `postgres_changes` on the events table
3. **Filter:** Use Realtime filters to scope updates (e.g., by date range or instructor)
4. **Update local state:** Merge incoming changes into React state/cache
5. **Cleanup:** Unsubscribe on component unmount

**Key code pattern (conceptual):**

```typescript
// Subscribe to event changes for a specific date range
const channel = supabase
  .channel('calendar-events')
  .on(
    'postgres_changes',
    {
      event: '*',           // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'events',
      filter: `start_time=gte.${startOfWeek}`
    },
    (payload) => {
      // Merge into local state
      handleRealtimeUpdate(payload)
    }
  )
  .subscribe()
```

**Important considerations:**
- Supabase Realtime requires RLS policies that allow SELECT for the subscribing user
- React strict mode can cause double subscriptions -- use refs to track subscription state
- Stale closure problem: use `useRef` to access current state inside subscription callbacks
- Limit subscription scope with filters to reduce unnecessary updates

### 3.2 Optimistic UI Updates

**Pattern for calendar interactions:**

1. **User action** (e.g., RSVP to class) -> Immediately update UI
2. **Server request** fires in background
3. **On success:** Confirm the optimistic state (no visible change)
4. **On failure:** Roll back to previous state, show error toast

**React 19 approach:**

```typescript
const [optimisticEvents, addOptimisticEvent] = useOptimistic(
  events,
  (state, newEvent) => [...state, { ...newEvent, pending: true }]
)
```

**When to use optimistic updates (our use cases):**
- RSVP confirmations (low conflict risk for non-full classes)
- Event detail updates by instructors
- Calendar view navigation (prefetch adjacent date ranges)

**When NOT to use optimistic updates:**
- Private lesson booking (conflict risk -- must verify server-side)
- Payment-dependent RSVPs (must wait for Stripe confirmation)
- Capacity-limited class RSVPs when near full (race condition risk)

### 3.3 Conflict Resolution for Double Bookings

**Database-level prevention (already designed in previous research):**

```sql
-- GIST exclusion constraint on private_lesson_bookings
EXCLUDE USING GIST (
  instructor_id WITH =,
  tstzrange(start_time, end_time) WITH &&
) WHERE (status NOT IN ('cancelled'))
```

**Application-level conflict handling:**

1. **Pessimistic locking for bookings:** Use `SELECT FOR UPDATE` in the `rsvp_to_event()` function
2. **Version checking:** Include an `updated_at` timestamp; reject stale updates
3. **Realtime conflict notification:** When a slot is booked by someone else, immediately notify other clients viewing that slot
4. **Graceful degradation:** Show "slot just taken" message with next available alternatives

---

## 4. Mobile Calendar Patterns

### 4.1 Responsive Design Approach

**Key statistics:** Over 60% of calendar interactions occur on mobile devices. For a dance studio app where members check schedules on-the-go, mobile may be 80%+.

**Mobile-first breakpoint strategy:**

| Breakpoint | View | Layout |
|------------|------|--------|
| < 640px (mobile) | Day/List view default | Single column, stacked events, bottom sheet for details |
| 640-768px (tablet portrait) | Week view (3-day) | Reduced columns, larger touch targets |
| 768-1024px (tablet landscape) | Week view (full) | Standard week grid |
| > 1024px (desktop) | Month view default | Full calendar grid with sidebar |

### 4.2 Touch-Friendly Interactions

**Minimum touch targets:** 44x44 pixels (Apple HIG / WCAG 2.5.8)

**Touch gesture mapping:**
- **Swipe left/right:** Navigate between days/weeks/months
- **Tap event:** Open event detail bottom sheet (not hover tooltip)
- **Long press event:** Enter drag mode for rescheduling (instructors only)
- **Pull to refresh:** Reload calendar data
- **Pinch to zoom:** Not recommended for calendar -- use view switching instead

### 4.3 Mobile-Specific UI Patterns

**Bottom sheet for event details:**
- Use shadcn/ui `Drawer` component (Vaul-based)
- Snap points: peek (event summary), half (full details), full (RSVP/booking form)
- Accessible dismiss via swipe-down or backdrop tap

**View switching:**
- Segmented control (shadcn `Tabs`) at top: Day | Week | Month | List
- Persist user's preferred view in localStorage
- Auto-switch to Day view on mobile if Month view is selected

**Floating action button (FAB):**
- "+" button for quick event creation (instructor/admin only)
- Position: bottom-right, above navigation bar
- Use shadcn/ui `Button` with fixed positioning

### 4.4 Performance on Mobile

- **Virtual scrolling** for list/agenda views with many events
- **Lazy load** event details (fetch on tap, not on render)
- **Skeleton loading** for calendar grid while fetching events
- **Date range windowing:** Only fetch events for visible date range + 1 buffer period on each side
- **Image optimization:** Use Next.js Image component for instructor avatars in event cards

---

## 5. Recommended Architecture for Salsa Ninja

### 5.1 Technology Stack Decision

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Calendar UI** | Custom shadcn/ui components (ref: lramos33/big-calendar) | Native Tailwind/shadcn fit, full control, MIT licensed |
| **Drag-and-drop** | @dnd-kit/core + @dnd-kit/sortable | Industry standard, accessible, touch-native, lightweight |
| **Recurrence** | rrule + Luxon | RFC 5545 compliant, timezone-aware, well-tested |
| **Date handling** | date-fns or Day.js | Lightweight, tree-shakable, no Moment.js bloat |
| **Real-time** | Supabase Realtime (postgres_changes) | Already in our stack, native integration |
| **State management** | React Query (TanStack Query) + useOptimistic | Caching, background refetching, optimistic updates |
| **Mobile bottom sheets** | Vaul (via shadcn Drawer) | Already in shadcn/ui, accessible, gesture-native |

### 5.2 Bundle Size Budget

| Package | Size (min+gzip) |
|---------|----------------|
| @dnd-kit/core | ~12 KB |
| @dnd-kit/sortable | ~4 KB |
| rrule | ~8 KB |
| date-fns (tree-shaken) | ~5-10 KB |
| Custom calendar components | ~15-20 KB |
| **Total calendar feature** | **~45-55 KB** |

Compare: FullCalendar core + daygrid + interaction + timegrid = ~80-100 KB min+gzip.

### 5.3 Why Not Use a Third-Party Calendar Library

1. **Styling mismatch:** FullCalendar and react-big-calendar both require extensive CSS overrides to match shadcn/ui aesthetics. This creates maintenance burden and visual inconsistency.
2. **Bundle weight:** Our custom approach is lighter than FullCalendar with comparable features for our scope.
3. **Control:** We need tight integration with Supabase Realtime, custom RSVP flows, and instructor availability -- none of which are native to any calendar library.
4. **Scope:** We have ~3 instructors, ~20 weekly classes, ~200 events/month. We don't need enterprise-grade calendar features.
5. **Previous decision confirmed:** The Feb 3 research reached the same conclusion. This updated research validates that decision with 2026 data.

---

## 6. Reference Implementations to Study

| What to study | Where | Why |
|---------------|-------|-----|
| Calendar UI components | [lramos33/big-calendar](https://github.com/lramos33/big-calendar) | shadcn/ui calendar views, event rendering, responsive layout |
| Drag-and-drop in calendars | [react-big-calendar DnD addon](https://github.com/jquense/react-big-calendar) | Event dragging, time-slot snapping patterns |
| Mobile calendar UX | [Mobiscroll demos](https://demo.mobiscroll.com/react/calendar/responsive) | Responsive breakpoints, touch patterns, bottom sheets |
| Booking flow | [Firgrep/next-office-booking-app](https://github.com/Firgrep/next-office-booking-app) | T3 stack booking patterns, slot selection UI |
| Supabase + shadcn patterns | [nguyenbry/fit](https://github.com/nguyenbry/fit) | Same stack integration patterns |
| Optimistic updates | [React docs: useOptimistic](https://react.dev/reference/react/useOptimistic) | Official React 19 optimistic update patterns |
| Supabase Realtime | [Supabase Realtime docs](https://supabase.com/docs/guides/realtime/postgres-changes) | Postgres changes subscription patterns |

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Custom calendar takes longer to build than using a library | Medium | Medium | Use lramos33/big-calendar as starting scaffold, not blank slate |
| Touch drag-and-drop is finicky on mobile | Medium | Low | Fallback to tap-to-select + confirm workflow on mobile (no drag required) |
| Supabase Realtime subscription management is complex | Low | Medium | Use a custom `useCalendarSubscription` hook to encapsulate all lifecycle logic |
| Performance with many concurrent calendar viewers | Low | Low | Our scale is small (~50 concurrent users max). Not a concern. |
| rrule edge cases with DST transitions | Low | High | Store all times as TIMESTAMPTZ, use Luxon for expansion with explicit tzid |

---

## Appendix: Library Comparison Matrix

| Feature | FullCalendar | react-big-calendar | Schedule-X | Custom (shadcn) |
|---------|-------------|-------------------|-----------|----------------|
| Month view | Yes | Yes | Yes | Build |
| Week view | Yes | Yes | Yes | Build |
| Day view | Yes | Yes | Yes | Build |
| List/Agenda view | Yes | Yes | No | Build |
| Resource view | Premium ($) | No | No | Build |
| Drag-and-drop | Yes | Addon | Yes | @dnd-kit |
| Touch support | Partial | Addon | Yes | @dnd-kit native |
| Dark mode | Manual CSS | Manual CSS | Built-in | Tailwind dark: |
| Tailwind compatible | CSS overrides | CSS overrides | Moderate | Native |
| shadcn/ui compatible | No | No | No | Native |
| Bundle size (min+gzip) | ~43-100 KB | ~45 KB | ~25 KB | ~45-55 KB |
| MIT license | Core only | Yes | Yes | Yes |
| npm weekly downloads | ~132K | ~500K | ~15K | N/A |
| GitHub stars | ~19K | ~8.6K | ~2.5K | N/A |
| Actively maintained | Yes | Moderate | Yes | N/A |
| React 19 support | Yes | Open issue | Yes | Yes |
