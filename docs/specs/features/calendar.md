# Feature Spec: Calendar & Events

**Calendar Views:** Month, Week, Day, List

**Event Types:** Class, Workshop, Bootcamp, Studio Social, Community

## Features

- RSVP with capacity limits
- Waitlist with auto-notification
- Recurring events (weekly classes) via iCal RRULE
- Member-submitted community events (require approval)
- Visibility controls (all members, segment, attendees)
- iCal export

## Related Specs

- Database tables: `events`, `event_rsvps`, `event_series` — see `specs/database-schema.md`
- API routes: `/api/events/*` — see `specs/api-endpoints.md`
- Auth: event visibility uses tag-based segmentation — see `specs/auth-and-roles.md`
