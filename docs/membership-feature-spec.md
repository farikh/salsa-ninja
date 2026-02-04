# Membership Feature Specification

**Feature:** Basic Membership System | **Version:** 1.0 | **Date:** February 3, 2026 | **Status:** Ready for Development

The foundational feature of the platform. Handles registration (invite-only), authentication (magic link), role-based access, subscription management, profiles, and admin member tools. All other features depend on this.

## Problem Summary

The studio currently uses Telegram where anyone can join and scammers infiltrate. There's no way to verify members, control access by tier, collect payments, or manage the community professionally. This feature creates a secure, invite-only system with automatic role management tied to subscriptions.

## Specification Documents

Read only the documents relevant to your current task.

| Document | Contents |
|----------|----------|
| [User Stories](specs/membership/user-stories.md) | Registration, auth, role/access, profile, and owner stories (MoSCoW prioritized) |
| [UI Wireframes](specs/membership/ui-wireframes.md) | User flows (signup, login), screen wireframes (mobile + desktop), component inventory, UI states |
| [Technical Design](specs/membership/technical-design.md) | Architecture decisions, file structure, TypeScript types, middleware, security |
| [API Contracts](specs/membership/api-contracts.md) | Endpoint specs with request/response examples (signup, login, members, admin invites) |
| [Edge Cases & Acceptance Criteria](specs/membership/edge-cases.md) | Edge cases by category, acceptance checklists, non-functional requirements, open questions |
