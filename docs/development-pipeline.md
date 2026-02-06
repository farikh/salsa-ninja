# Development Pipeline

## Branch Strategy

```
master (production — live site)
  └── staging (owner review — persistent preview URL)
       └── feature/xyz (individual features — auto-preview per PR)
```

| Branch | Purpose | Vercel Environment | URL |
|--------|---------|-------------------|-----|
| `master` | Live production site | Production | Your custom domain |
| `staging` | Owner review before go-live | Preview | Auto-generated stable URL |
| `feature/*` | Individual feature development | Preview | Auto-generated per PR |

## Workflow: Idea to Production

### 1. Capture (Backlog)
- Owner submits via GitHub Issue form or Slack message
- Issue lands on Project Board → **Ideas** column
- Dev triages: adds labels, sets priority, moves to **Next Up**

### 2. Build (Development)
```bash
# Create feature branch from staging
git checkout staging
git pull origin staging
git checkout -b feature/calendar-mvp

# Build the feature...

# Push and create PR targeting staging
git push -u origin feature/calendar-mvp
gh pr create --base staging --title "Add calendar MVP"
```
- Vercel auto-deploys a preview for the PR
- Dev tests on the preview URL
- Move issue to **In Progress** on the board

### 3. Review (Staging)
```bash
# Merge PR into staging
gh pr merge --squash

# Staging branch auto-deploys to the stable staging URL
```
- Add `ready-for-review` label → Slack pings owner
- Owner reviews on the staging URL (phone + desktop)
- Owner gives feedback in Slack or GitHub comments
- Iterate until owner approves

### 4. Ship (Production)
```bash
# Create PR from staging to master
gh pr create --base master --head staging --title "Release: calendar MVP"

# After owner approval, merge to master
gh pr merge --squash
```
- Vercel auto-deploys to production
- Slack #deployments notifies: "Production deployment started"
- Move issue to **Done** on the board

### 5. Verify
- Quick check on production URL
- Owner gets a "it's live!" message in Slack

---

## Environment Variables

Each environment can have different Supabase configs:

| Environment | Supabase | Purpose |
|-------------|----------|---------|
| Production (`master`) | Production project | Real member data |
| Preview (`staging` + PRs) | Same project OR separate dev project | Testing |

For now, using the same Supabase project is fine. When the member base grows,
consider a separate Supabase project for staging to avoid touching real data.

---

## Vercel Configuration

Vercel auto-detects branches. No extra config needed beyond what's already in
`vercel.json`. Every push to any branch gets a deployment.

To set a stable staging URL alias:
1. Go to Vercel Dashboard → Project Settings → Domains
2. Add `staging.yourdomain.com` (or use the auto-generated Vercel URL)
3. Assign it to the `staging` branch

---

## Quick Commands Reference

```bash
# Start a new feature
git checkout staging && git pull && git checkout -b feature/my-feature

# Push and create PR for review
git push -u origin feature/my-feature
gh pr create --base staging

# Request owner review
gh pr edit --add-label "ready-for-review"

# Ship to production (after staging approval)
git checkout staging && git pull
gh pr create --base master --head staging --title "Release: description"

# After approval
gh pr merge --squash
```
