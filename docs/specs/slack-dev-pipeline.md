# Slack-Driven Development Pipeline

> **Status:** Design Complete
> **Date:** 2026-02-07
> **Related:** [Architecture](./architecture.md) | [Deployment](./deployment.md) | [Auth & Roles](./auth-and-roles.md)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Roles & Permissions](#2-roles--permissions)
3. [Bug Fix Workflow](#3-bug-fix-workflow)
4. [Feature Development Workflow](#4-feature-development-workflow)
5. [Backlog Management](#5-backlog-management)
6. [System Architecture](#6-system-architecture)
7. [Slack App Design](#7-slack-app-design)
8. [GitHub Actions Workflows](#8-github-actions-workflows)
9. [Bug Reporting Tool](#9-bug-reporting-tool)
10. [Staging & Production Flow](#10-staging--production-flow)
11. [Cost Analysis](#11-cost-analysis)
12. [Implementation Plan](#12-implementation-plan)

---

## 1. Overview

A Slack-centered pipeline that handles bug fixes and feature development for the Salsa Ninja platform. All work originates from Slack, flows through Claude Code for triage/design/implementation, and completes with Vercel preview deployments reviewed and approved within Slack threads.

### Design Principles

- **Slack is the command center** — all reporting, review, and approval happens in Slack
- **Human-in-the-loop** — the architect decides how every piece of work gets executed
- **Permissions enforced** — who can report, route, and approve are distinct roles
- **Source transparency** — every feature and bug traces back to who requested it and when
- **Hybrid execution** — work runs in the cloud (Claude Code GitHub Action) or locally (architect's full Claude Code setup) based on the architect's decision

### Billing Model

| Activity | Billing Source |
|----------|---------------|
| Triage, analysis, design conversations in Slack | Claude Max subscription |
| Cloud-automated implementation (GitHub Action) | Anthropic API (pay-per-use) |
| Local implementation (architect's machine) | Claude Max subscription |
| Slack app, GitHub, Vercel previews | Free |

---

## 2. Roles & Permissions

### Role Definitions

| Role | Description | Slack User IDs |
|------|-------------|----------------|
| **Architect** | Technical lead, sole decision-maker for routing and execution. Full control over the pipeline. | `U_TAFARI_ID` |
| **Owner** | Primary stakeholder. Business decisions, feature prioritization, production approval authority. | `U_OWNER_ID` |
| **Member** | Anyone else in the Slack workspace. Can report bugs and suggest features. | `*` (all others) |

### Permission Matrix

| Action | Architect | Owner | Member |
|--------|:---------:|:-----:|:------:|
| Report bugs | Yes | Yes | Yes |
| Suggest features | Yes | Yes | Yes |
| Route work (Auto / Local / Later) | **Yes** | No | No |
| Approve staging for production | **Yes** | **Yes** | No |
| Request changes on staging | **Yes** | **Yes** | No |
| Promote community feature from backlog | **Yes** | No | No |
| View all bug/feature cards | Yes | Yes | Yes |

### Permission Enforcement

Permissions are enforced in the Slack Bolt app at the button-click handler level. Unauthorized clicks receive an **ephemeral message** (visible only to the clicker) explaining who has permission. The architect is notified via DM when items await routing.

```javascript
const ROLES = {
  architect: ['U_TAFARI_ID'],
  owner:     ['U_OWNER_ID'],
  member:    '*'
};

const PERMISSIONS = {
  route_work:            ['architect'],
  approve_production:    ['architect', 'owner'],
  request_changes:       ['architect', 'owner'],
  promote_from_backlog:  ['architect'],
  report_bug:            ['architect', 'owner', 'member'],
  suggest_feature:       ['architect', 'owner', 'member']
};
```

---

## 3. Bug Fix Workflow

### Flow Diagram

```
Anyone in Slack
      |
      v
  /bug command or Userback widget
      |
      v
  Slack Bolt app opens Block Kit modal:
    - Title, Description, URL, Severity, Screenshots
      |
      v
  Bolt app posts structured report to #bugs
  Adds :bug: emoji
      |
      v
  Claude (Max/Slack) reads report in thread:
    - Analyzes root cause
    - Identifies affected files
    - Estimates complexity
    - Posts analysis as threaded reply
      |
      v
  Bolt app posts routing card:
  ┌───────────────────────────────────────┐
  |  Bug #47: Calendar RSVP broken        |
  |  Reported by: @maria                  |
  |  Severity: High                       |
  |  Claude's analysis: stale event ID... |
  |  Files: Calendar.tsx                  |
  |                                       |
  |  [Auto] [Local] [Later]              |
  |  Locked to @tafari                    |
  └───────────────────────────────────────┘
      |
      +-- Architect clicks [Auto] ---------> Cloud path (see 3.1)
      |
      +-- Architect clicks [Local] --------> Local path (see 3.2)
      |
      +-- Architect clicks [Later] --------> Backlogged (see Section 5)
```

### 3.1 Cloud Path (Auto)

```
Bolt app creates GitHub Issue:
  - Title: [Bug] Calendar RSVP broken
  - Labels: bug, claude, auto
  - Body: Full bug report + Claude's analysis + screenshot links
  - Linked Slack thread URL
      |
      v
GitHub Actions triggers (on issue with "claude" label):
  - Runs anthropics/claude-code-action@v1
  - Claude reads issue, implements fix, creates PR
      |
      v
Vercel auto-deploys preview from PR branch
      |
      v
GitHub Action grabs preview URL, calls Slack webhook
      |
      v
Bolt app posts staging card in original thread:
  ┌───────────────────────────────────────┐
  |  Staging: Bug #47                     |
  |  Preview: https://preview-bug-47...   |
  |  Changes: Fixed stale event ID in     |
  |  Calendar RSVP onClick handler        |
  |  PR: #83                              |
  |                                       |
  |  [Ship] [Needs Work]                  |
  |  Locked to @tafari or @owner          |
  └───────────────────────────────────────┘
      |
      +-- [Ship] clicked -------> PR merged, Vercel deploys to prod, :tada:
      |
      +-- [Needs Work] clicked -> Comment modal opens, feedback posted
                                   to GitHub Issue, Claude iterates,
                                   new staging deployed, cycle repeats
```

### 3.2 Local Path

```
Bolt app creates GitHub Issue:
  - Title: [Bug] Calendar RSVP broken
  - Labels: bug, local
  - Body: Full bug report + Claude's analysis + screenshot links
      |
      v
Bolt app posts to thread:
  "Ready for local dev. Run:
   do work 'Fix calendar RSVP - see issue #47'"
      |
      v
Architect runs locally with full setup:
  - Plugins, agent teams, MCP servers, agent-browser
  - Pushes branch when ready
      |
      v
Vercel auto-deploys preview from PR branch
      |
      v
Same staging review card posted to Slack thread
Same [Ship] / [Needs Work] cycle
```

---

## 4. Feature Development Workflow

### Flow Diagram

```
Anyone in Slack
      |
      v
  /feature command or message in #features
      |
      v
  Bolt app opens Block Kit modal:
    - Title, Description, User story, Priority
      |
      v
  Bolt app checks submitter role:
      |
      +-- Owner or Architect -----> Full triage card (see 4.1)
      |
      +-- Member -----------------> Auto-backlogged (see 4.2)
```

### 4.1 Owner/Architect Feature Request

```
Bolt app posts to #features:
  ┌───────────────────────────────────────┐
  |  Feature: Private lesson booking v2   |
  |  Requested by: @owner (owner)         |
  |  Priority: High                       |
  |  Description: ...                     |
  └───────────────────────────────────────┘
      |
      v
Claude (Max/Slack) engages in thread:
  - Asks clarifying questions
  - User responds in thread
  - Back-and-forth until requirements are clear
      |
      v
Claude produces design:
  - Mermaid flow diagrams
  - Wireframes / screen descriptions
  - Component architecture
  - Database changes
  - API contracts
  - Posted as threaded reply
      |
      v
Design review:
  ┌───────────────────────────────────────┐
  |  Design: Private lesson booking v2    |
  |  Mermaid diagram: [attached]          |
  |  Scope: 4 new files, 2 modified      |
  |  DB changes: 1 new table, 2 altered  |
  |                                       |
  |  [Approve Design] [Revise]           |
  |  Locked to @tafari                    |
  └───────────────────────────────────────┘
      |
      +-- [Approve Design] -> Routing card appears:
      |                       [Auto] [Local] [Later]
      |
      +-- [Revise] ---------> Comment modal, Claude iterates
```

### 4.2 Community Feature Request (from Members)

```
Bolt app posts to #features:
  ┌───────────────────────────────────────┐
  |  Feature: Student progress dashboard  |
  |  Requested by: @carlos (member)       |
  |  Priority: —                          |
  |  Description: ...                     |
  |                                       |
  |  Backlogged (community suggestion)    |
  |  [Promote]                            |
  |  Locked to @tafari                    |
  └───────────────────────────────────────┘
      |
      v
GitHub Issue created:
  - Labels: feature, community-suggestion, backlog
  - Added to GitHub Project "Community Backlog" column
      |
      v
When architect clicks [Promote]:
  - Label changed to feature, promoted
  - Claude begins design conversation in thread
  - Same flow as 4.1 from design phase onward
```

### Design Output Requirements

All Claude-generated designs must include:

1. **Mermaid flow diagram** — user interaction flows, state transitions, or data flow
2. **Screen descriptions** — what each page/component looks like, key UI elements
3. **Component list** — new and modified files with brief description of changes
4. **Database changes** — new tables, columns, migrations (if any)
5. **API contracts** — new or modified endpoints with request/response shapes
6. **Edge cases** — known gotchas, error states, boundary conditions

---

## 5. Backlog Management

### GitHub Projects Board

```
┌─────────────┬──────────────┬──────────────┬──────────────┬──────────┐
│  Community  │   Backlog    │  In Design   │   In Dev     │   Done   │
│  Backlog    │              │              │              │          │
├─────────────┼──────────────┼──────────────┼──────────────┼──────────┤
│ Member      │ Owner/Arch   │ Claude doing │ Auto or      │ Merged & │
│ suggestions │ features &   │ design work  │ local dev    │ deployed │
│ awaiting    │ bugs parked  │              │ in progress  │          │
│ promotion   │ for later    │              │              │          │
└─────────────┴──────────────┴──────────────┴──────────────┴──────────┘
```

### Labels

| Label | Applied When |
|-------|-------------|
| `bug` | Bug report |
| `feature` | Feature request |
| `claude` | Routed for cloud automation |
| `local` | Routed for local development |
| `backlog` | Parked for later |
| `community-suggestion` | Feature from a member (not owner/architect) |
| `owner-request` | Feature from the owner |
| `design-needed` | Awaiting design phase |
| `design-approved` | Design reviewed and approved |
| `in-review` | Staging deployed, awaiting approval |
| `promoted` | Community feature promoted by architect |

### Automation Rules (GitHub Projects)

- Issue created with `claude` label → auto-add to "In Dev" column
- Issue created with `local` label → auto-add to "In Dev" column
- Issue created with `backlog` label → auto-add to "Backlog" column
- Issue created with `community-suggestion` label → auto-add to "Community Backlog" column
- PR linked to issue → move issue to "In Dev" (if not already)
- PR merged → move issue to "Done"

---

## 6. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            SLACK WORKSPACE                              │
│                                                                         │
│  #bugs          #features         #dev-pipeline        DMs              │
│  ┌──────────┐   ┌──────────┐     ┌──────────────┐    ┌──────────┐     │
│  │ Bug      │   │ Feature  │     │ Status        │    │ Notifs   │     │
│  │ reports  │   │ requests │     │ updates       │    │ to arch  │     │
│  │ + triage │   │ + design │     │ + deploy logs │    │          │     │
│  └────┬─────┘   └────┬─────┘     └───────┬──────┘    └──────────┘     │
│       │              │                    │                             │
└───────┼──────────────┼────────────────────┼─────────────────────────────┘
        │              │                    │
        └──────────┬───┘                    │
                   │                        │
                   ▼                        │
        ┌─────────────────┐                 │
        │  Slack Bolt App │ ◄───────────────┘
        │  (Node.js)      │
        │  Socket Mode    │
        │                 │
        │  - /bug form    │
        │  - /feature form│
        │  - Permissions  │
        │  - Buttons      │
        │  - GitHub API   │
        │  - Slack API    │
        └────────┬────────┘
                 │
        ┌────────┴────────────────────────────────┐
        │                                          │
        ▼                                          ▼
┌───────────────┐                          ┌─────────────┐
│    GITHUB     │                          │   CLAUDE    │
│               │                          │   (Slack)   │
│  Issues       │                          │             │
│  + Projects   │                          │  Max sub    │
│  + Actions    │                          │  Triage     │
│  + PRs        │                          │  Design     │
│               │                          │  Q&A        │
└───────┬───────┘                          └─────────────┘
        │
        ├── [claude label] ──► GitHub Actions
        │                      claude-code-action@v1
        │                      (API billing)
        │                           │
        │                      Creates PR
        │                           │
        ├── [local label] ◄── Architect pushes from local
        │                           │
        │                           ▼
        │                    ┌─────────────┐
        └───────────────────►│   VERCEL    │
                             │             │
                             │  Preview    │──► Staging URL
                             │  deploy     │    posted to Slack
                             │             │
                             │  Prod       │──► On PR merge
                             │  deploy     │
                             └─────────────┘
```

### Components

| Component | Technology | Hosting | Cost |
|-----------|-----------|---------|------|
| Slack Bolt App | Node.js + @slack/bolt + Socket Mode | Railway / Render / Fly.io | Free-$5/mo |
| Claude (Slack conversations) | Claude Code in Slack | Anthropic infrastructure | Max subscription |
| Claude (Cloud automation) | claude-code-action@v1 | GitHub-hosted runners | API pay-per-use |
| Claude (Local dev) | Claude Code CLI | Architect's machine | Max subscription |
| Issue tracking | GitHub Issues + Projects | GitHub | Free |
| CI/CD triggers | GitHub Actions | GitHub | Free (2,000 min/mo) |
| Preview deploys | Vercel | Vercel | Free (included) |
| Production deploys | Vercel | Vercel | Existing plan |
| Bug capture widget | Userback | Userback SaaS | Free tier |

---

## 7. Slack App Design

### App Configuration

- **Name:** Salsa Ninja Dev Bot
- **Socket Mode:** Enabled (no public endpoint required)
- **Slash Commands:** `/bug`, `/feature`
- **Interactivity:** Enabled (modals + button callbacks)
- **Event Subscriptions:** `message.channels`, `reaction_added`, `app_mention`

### Required Scopes

```
chat:write          Post messages and threaded replies
commands            Register slash commands
reactions:read      Detect emoji reactions
reactions:write     Add status emoji to messages
files:read          Access uploaded screenshots from forms
channels:history    Read messages for event subscriptions
groups:history      Read private channel messages
im:write            Send DM notifications to architect
users:read          Resolve user IDs to names/roles
```

### Slash Commands

#### `/bug` — Open Bug Report Form

Modal fields:
| Field | Type | Required |
|-------|------|----------|
| Title | `plain_text_input` | Yes |
| Description | `plain_text_input` (multiline) | Yes |
| Page URL | `url_text_input` | Yes |
| Severity | `static_select` (Critical, High, Medium, Low) | Yes |
| Steps to Reproduce | `plain_text_input` (multiline) | No |
| Screenshots | `file_input` (jpg, png, gif, webp; max 5) | No |

#### `/feature` — Open Feature Request Form

Modal fields:
| Field | Type | Required |
|-------|------|----------|
| Title | `plain_text_input` | Yes |
| Description | `plain_text_input` (multiline) | Yes |
| User Story | `plain_text_input` (multiline, placeholder: "As a ___, I want to ___") | No |
| Priority | `static_select` (High, Medium, Low, Nice-to-have) | No |
| Reference Screenshots | `file_input` (jpg, png, gif, webp; max 5) | No |

### Interactive Message Templates

#### Routing Card (bugs and owner features)

```json
{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*:bug: Bug #47: Calendar RSVP broken*\nReported by: <@U_MARIA_ID>\nSeverity: High\n\n*Claude's analysis:* Stale event ID reference in onClick handler after calendar navigation...\n*Files:* `app/components/Calendar.tsx`"
      }
    },
    {
      "type": "actions",
      "block_id": "route_actions",
      "elements": [
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "Auto" },
          "style": "primary",
          "action_id": "route_auto",
          "value": "bug-47"
        },
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "Local" },
          "action_id": "route_local",
          "value": "bug-47"
        },
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "Later" },
          "action_id": "route_later",
          "value": "bug-47"
        }
      ]
    },
    {
      "type": "context",
      "elements": [
        { "type": "mrkdwn", "text": ":lock: Only <@U_TAFARI_ID> can route" }
      ]
    }
  ]
}
```

#### Staging Review Card

```json
{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*:rocket: Staging Ready: Bug #47*\n<https://preview-bug-47.vercel.app|Preview Link>\n\nFixed stale event ID reference in Calendar RSVP onClick handler.\nPR: <https://github.com/org/repo/pull/83|#83>"
      }
    },
    {
      "type": "actions",
      "block_id": "review_actions",
      "elements": [
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "Ship" },
          "style": "primary",
          "action_id": "approve_ship",
          "value": "bug-47|pr-83"
        },
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "Needs Work" },
          "style": "danger",
          "action_id": "request_changes",
          "value": "bug-47|pr-83"
        }
      ]
    },
    {
      "type": "context",
      "elements": [
        { "type": "mrkdwn", "text": ":lock: Only <@U_TAFARI_ID> or <@U_OWNER_ID> can approve" }
      ]
    }
  ]
}
```

#### Community Feature Card (auto-backlogged)

```json
{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*:sparkles: Feature Suggestion: Student progress dashboard*\nFrom: <@U_CARLOS_ID> (member)\n\nDescription: ..."
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": ":card_index_dividers: _Backlogged — community suggestion_"
      }
    },
    {
      "type": "actions",
      "block_id": "backlog_actions",
      "elements": [
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "Promote" },
          "action_id": "promote_feature",
          "value": "feature-52"
        }
      ]
    },
    {
      "type": "context",
      "elements": [
        { "type": "mrkdwn", "text": ":lock: Only <@U_TAFARI_ID> can promote" }
      ]
    }
  ]
}
```

### Notification DMs to Architect

The Bolt app sends DM notifications when items need attention:

| Event | DM Message |
|-------|-----------|
| New bug reported | "@maria reported a bug: Calendar RSVP broken (High). Awaiting routing in #bugs." |
| New owner feature | "@owner requested a feature: Private lesson booking v2. Awaiting routing in #features." |
| New community feature | "@carlos suggested a feature: Student dashboard. Auto-backlogged in #features." |
| Staging ready | "Staging deployed for Bug #47. Awaiting review in #bugs." |
| Changes requested | "@owner requested changes on Bug #47 staging. See thread in #bugs." |

### Emoji Status Tracking

| Status | Emoji | Applied By |
|--------|-------|-----------|
| Reported | :bug: or :sparkles: | Bolt app (on submission) |
| In Progress | :construction: | Bolt app (on route_auto or route_local) |
| Staged | :rocket: | Bolt app (on staging deploy) |
| Approved | :white_check_mark: | Bolt app (on Ship click) |
| Deployed | :tada: | Bolt app (on production deploy) |
| Changes Requested | :leftwards_arrow_with_hook: | Bolt app (on Needs Work click) |
| Backlogged | :card_index_dividers: | Bolt app (on Later click or community feature) |

---

## 8. GitHub Actions Workflows

### claude-auto.yml — Cloud Implementation

```yaml
name: Claude Auto Implementation
on:
  issues:
    types: [opened, labeled]

jobs:
  implement:
    if: contains(github.event.issue.labels.*.name, 'claude')
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      - name: Run Claude Code
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            Read this issue carefully and implement the requested changes.
            Follow all conventions in CLAUDE.md.
            Create all necessary code changes.
            Run linting before committing.
          claude_args: "--max-turns 20 --model claude-sonnet-4-5-20250929"

  notify-slack:
    needs: implement
    runs-on: ubuntu-latest
    if: success()
    steps:
      - name: Get Vercel Preview URL
        uses: zentered/vercel-preview-url@v1.1.9
        id: vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        with:
          vercel_project_id: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Notify Slack
        env:
          SLACK_WEBHOOK: ${{ secrets.SLACK_STAGING_WEBHOOK }}
        run: |
          curl -X POST "$SLACK_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"issue_number\": ${{ github.event.issue.number }}, \"preview_url\": \"${{ steps.vercel.outputs.preview_url }}\", \"pr_url\": \"pending\"}"
```

### notify-staging.yml — Staging URL Notification

```yaml
name: Notify Staging Ready
on:
  deployment_status:

jobs:
  notify:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    steps:
      - name: Post to Slack
        env:
          SLACK_WEBHOOK: ${{ secrets.SLACK_STAGING_WEBHOOK }}
          DEPLOY_URL: ${{ github.event.deployment_status.target_url }}
        run: |
          curl -X POST "$SLACK_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"preview_url\": \"$DEPLOY_URL\", \"ref\": \"${{ github.event.deployment.ref }}\"}"
```

---

## 9. Bug Reporting Tool

### Recommended: Userback

- **Widget** embedded on the Salsa Ninja site via script tag in `app/layout.tsx`
- **Browser extension** available for team members
- **Free tier:** 2 users, unlimited feedback, 7-day data retention
- **Captures:** Screenshot + annotation, console errors, browser info, URL, screen size
- **Slack integration:** Native — posts to #bugs with screenshot and metadata

### Setup

1. Create Userback account at userback.io
2. Add widget script to `app/layout.tsx` (production only)
3. Configure Slack integration → route to #bugs channel
4. Install browser extension for architect and owner

### Alternative: FeedbackPlus (Open Source)

If zero vendor dependency is preferred:
- npm package `feedbackplus` embedded in the app
- Screenshot capture + annotation dialog
- Wire submission to a Next.js API route → Slack webhook
- Full control, zero cost, requires ~50 lines of integration code

---

## 10. Staging & Production Flow

### Preview Deployments

Vercel automatically deploys a preview for every PR branch. Preview URLs follow the pattern:

```
https://{project}-{branch}-{team}.vercel.app
```

### Production Deployment

Production deploys when a PR is merged to `master`. The flow:

1. Architect or Owner clicks [Ship] in Slack
2. Bolt app merges the PR via GitHub API (`PUT /repos/{owner}/{repo}/pulls/{pr}/merge`)
3. Vercel detects merge to master → deploys to production
4. Bolt app adds :tada: emoji and posts confirmation in thread
5. GitHub Issue auto-closed (via "Fixes #N" in PR description)

### Rollback

If a production deploy has issues:
1. Revert via Vercel dashboard (instant rollback to previous deployment)
2. Or revert the merge commit on master

---

## 11. Cost Analysis

### Monthly Estimates (Small Team)

| Component | Cost | Notes |
|-----------|------|-------|
| Claude Max subscription | $100-200/mo | Slack conversations + local dev |
| Claude API (cloud tasks) | $6-60/mo | ~10-30 auto-routed tasks at $0.50-5 each |
| Slack | Free | Free plan (10 integrations, 90-day history) |
| Slack Bolt app hosting | $0-5/mo | Railway free tier or cheap VPS |
| GitHub | Free | Issues, Projects, Actions (2,000 min/mo) |
| Vercel | Existing plan | Preview deploys included |
| Userback | Free | Free tier (2 users, 7-day retention) |
| **Total additional** | **~$6-65/mo** | On top of existing Max + Vercel |

### Scaling Considerations

- **Slack Pro** ($7.25/user/mo) if 90-day message history becomes a limitation
- **Userback paid** ($7/seat/mo) if 7-day retention or 2-user limit is exceeded
- **GitHub Team** ($4/user/mo) only if private repos need advanced features

---

## 12. Implementation Plan

### Phase 1: Foundation

1. Create Slack app (salsa-ninja-dev-bot) with Socket Mode
2. Register `/bug` and `/feature` slash commands
3. Build Block Kit modals for both forms
4. Implement permission checking middleware
5. Deploy Bolt app to Railway/Render

### Phase 2: GitHub Integration

6. Implement GitHub Issue creation from Slack form submissions
7. Set up GitHub Project board (Community Backlog, Backlog, In Design, In Dev, Done)
8. Configure project automation rules (label-based column assignment)
9. Install GitHub for Slack app, subscribe to repo events

### Phase 3: Cloud Automation

10. Create `.github/workflows/claude-auto.yml`
11. Add secrets: `ANTHROPIC_API_KEY`, `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `SLACK_STAGING_WEBHOOK`
12. Create `.github/workflows/notify-staging.yml`
13. Test end-to-end: `/bug` → auto → PR → staging → Ship → production

### Phase 4: Bug Capture Widget

14. Set up Userback account and Slack integration
15. Add widget to `app/layout.tsx` (production only, behind env flag)
16. Test: Userback report → Slack #bugs → routing

### Phase 5: Feature Design Flow

17. Implement Claude (Max/Slack) design conversation flow
18. Add design review card with Approve/Revise buttons
19. Implement community feature auto-backlog + Promote flow
20. Test end-to-end: `/feature` → design → approve → route → implement → ship

### Environment Variables Required

```bash
# Slack App
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
SLACK_SIGNING_SECRET=...

# GitHub
GITHUB_TOKEN=ghp_...          # For creating issues and merging PRs

# Role Configuration
ARCHITECT_SLACK_ID=U_TAFARI_ID
OWNER_SLACK_ID=U_OWNER_ID

# Webhooks
SLACK_BUGS_CHANNEL_ID=C...
SLACK_FEATURES_CHANNEL_ID=C...

# GitHub Actions Secrets (set in repo settings)
ANTHROPIC_API_KEY=sk-ant-...
VERCEL_TOKEN=...
VERCEL_PROJECT_ID=prj_...
SLACK_STAGING_WEBHOOK=https://hooks.slack.com/...
```
