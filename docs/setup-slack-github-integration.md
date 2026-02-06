# Slack + GitHub Integration Setup Guide

## Overview

This sets up a communication pipeline where the studio owner can:
- Get Slack notifications when deployments go live
- Get pinged in Slack when something needs their review
- Submit feature requests, bug reports, and content changes via simple GitHub forms
- Track progress on a visual kanban board

---

## Step 1: Create Slack Workspace & Channels

Create a Slack workspace (or use an existing one) with these channels:

| Channel | Purpose | Who's in it |
|---------|---------|-------------|
| `#salsa-ninja-general` | General discussion, decisions, meeting notes | Everyone |
| `#salsa-ninja-feedback` | Auto-posts when new issues/requests are submitted | Everyone |
| `#salsa-ninja-deployments` | Auto-posts when site is deployed or preview is ready | Everyone |
| `#salsa-ninja-reviews` | Pings when owner review is needed | Everyone |

---

## Step 2: Set Up Slack Incoming Webhooks

1. Go to https://api.slack.com/apps
2. Click **Create New App** → **From scratch**
3. Name it `Salsa Ninja Bot`, select your workspace
4. Go to **Incoming Webhooks** → Toggle **ON**
5. Click **Add New Webhook to Workspace** for each channel:

| Webhook | Channel | Secret Name |
|---------|---------|-------------|
| Webhook 1 | `#salsa-ninja-feedback` | `SLACK_WEBHOOK_FEEDBACK` |
| Webhook 2 | `#salsa-ninja-deployments` | `SLACK_WEBHOOK_DEPLOYMENTS` |
| Webhook 3 | `#salsa-ninja-reviews` | `SLACK_WEBHOOK_REVIEWS` |

6. Copy each webhook URL

---

## Step 3: Add Webhook URLs to GitHub Secrets

1. Go to https://github.com/farikh/salsa-ninja/settings/secrets/actions
2. Click **New repository secret** for each:
   - Name: `SLACK_WEBHOOK_FEEDBACK` → paste webhook URL for #feedback
   - Name: `SLACK_WEBHOOK_DEPLOYMENTS` → paste webhook URL for #deployments
   - Name: `SLACK_WEBHOOK_REVIEWS` → paste webhook URL for #reviews

---

## Step 4: Install GitHub + Slack App (Optional but Recommended)

The official GitHub for Slack app adds interactive features:

1. In Slack, go to **Apps** → search **GitHub**
2. Install the **GitHub** app
3. In any channel, type: `/github subscribe farikh/salsa-ninja`
4. This gives you:
   - Issue and PR notifications directly in Slack
   - Ability to close/comment on issues from Slack
   - Deployment status updates
   - `/github open farikh/salsa-ninja` to quickly create issues from Slack

### Recommended subscriptions per channel:

```
# In #salsa-ninja-feedback:
/github subscribe farikh/salsa-ninja issues comments

# In #salsa-ninja-deployments:
/github subscribe farikh/salsa-ninja deployments pulls

# In #salsa-ninja-reviews:
/github subscribe farikh/salsa-ninja reviews
```

---

## Step 5: Set Up GitHub Projects Board

1. Go to https://github.com/farikh/salsa-ninja/projects
2. Create a new project → **Board** view
3. Set up columns:

| Column | What goes here |
|--------|---------------|
| **Ideas** | New requests from the owner, brainstorming |
| **Next Up** | Prioritized and ready to work on |
| **In Progress** | Currently being built |
| **Review** | Staging preview ready — waiting for owner feedback |
| **Done** | Approved and live on production |

4. Enable **Auto-add** rule: automatically add new issues to the "Ideas" column
5. Share the board URL with the owner — it's a visual way to see progress

---

## How It All Works Together

### Owner wants a change:
```
Owner fills out form on GitHub (or types in Slack)
    → Issue created with labels
    → Slack #feedback gets notified
    → Dev picks it up, moves to "In Progress"
    → Dev creates branch, builds feature
    → PR created → Vercel generates preview URL
    → Slack #deployments notifies: "Preview ready"
    → Dev labels PR "ready-for-review"
    → Slack #reviews pings owner: "Your review needed!"
    → Owner clicks preview link, checks it out
    → Owner approves (thumbs up in Slack or GitHub)
    → Dev merges to main
    → Slack #deployments: "Production deployment started"
    → Live on the real site
```

### Owner finds a bug:
```
Owner goes to GitHub → "Bug Report" form
    → Fills in what happened + screenshot
    → Slack #feedback: "New bug submitted"
    → Dev triages and fixes
    → Same review cycle as above
```

### Quick feedback:
```
Owner posts in #salsa-ninja-general
    → Dev picks it up
    → Creates GitHub issue if it's actionable
    → Tracks it on the board
```

---

## For the Owner: Quick Reference

### How to submit a request:
1. Go to: https://github.com/farikh/salsa-ninja/issues/new/choose
2. Pick a template:
   - **Feature Request** — "I want the site to..."
   - **Bug Report** — "Something isn't working..."
   - **Content Update** — "Change the text/images on..."
   - **General Feedback** — "Here's what I think..."
3. Fill in the form and submit

### How to check progress:
- **Slack channels** — notifications come to you automatically
- **Project board** — visual kanban showing everything in flight

### How to review changes:
- When you get a message in `#salsa-ninja-reviews`, click the preview link
- Check it on your phone and laptop
- Reply in Slack or leave a comment on GitHub
- Say "looks good" or describe what to change

---

## Slack Workflow Automations (Bonus)

### Create issues from Slack messages
With Slack Workflow Builder (available on paid plans):

1. Create a workflow triggered by emoji reaction (e.g., :ticket:)
2. When someone reacts with :ticket: on a message, the workflow:
   - Collects the message text
   - Posts to the GitHub API to create an issue
   - Replies in thread: "Issue created! [link]"

### Weekly digest
Set up a scheduled workflow that posts every Monday:
- Summary of what shipped last week
- What's in progress this week
- Any items waiting for review

This can be done with a GitHub Action on a cron schedule posting to Slack.
