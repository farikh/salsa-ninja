# Styled-JSX Hydration Bug — Post-Mortem

**Date:** 2026-02-07
**Severity:** High — broke all component-level CSS in real browsers
**Time to resolve:** ~3 hours (should have been ~15 minutes)

---

## Symptom

Styles appeared completely broken in Chrome and Edge on localhost (navbar unstyled, footer layout collapsed, oversized elements). The site looked correct on Vercel production and in Playwright/agent-browser headless testing.

## Root Cause

Three components used `<style jsx>` (styled-jsx) for CSS:
- `src/components/Navbar.tsx`
- `src/components/Footer.tsx`
- `src/app/(site)/page.tsx`

Styled-jsx works by adding a **scoping hash** (e.g., `jsx-19aa8adc4d5101ba`) to both HTML elements and CSS selectors. During React hydration in Next.js 16 (App Router), the hashes were **stripped from elements on the client** while remaining in the CSS selectors. This caused all styled-jsx CSS rules to stop matching.

Example from the hydration error:
```
Server: className="jsx-19aa8adc4d5101ba fiery-desktop-nav"
Client: className="fiery-desktop-nav"
```

The CSS selector `.fiery-desktop-nav.jsx-19aa8adc4d5101ba` no longer matched the element, so `display: flex` was never applied to the navbar — links collapsed, mobile button appeared, layout broke.

## Why It Was Hard to Find

1. **Agent-browser (Playwright) masked the issue** — its Chromium rendered everything correctly, leading us to believe the server was serving correct CSS
2. **Vercel production worked fine** — production builds bake in styled-jsx hashes consistently
3. **We chased the wrong suspects** — Turbopack vs Webpack, DNS resolution, antivirus, Windows proxy, Chrome extensions, service workers, CSS file loading, dual lockfile issues
4. **Wipe + restore didn't help** — the bug was in committed source code, not in caches or generated files
5. **The console error was the answer** — the React hydration mismatch warning in Chrome DevTools console contained the exact diff showing the `jsx-*` classes being stripped

## Fix

Moved all styled-jsx CSS to `globals.css` as regular CSS classes. The class names were already unique (`fiery-*`, `main-footer`, etc.) so scoping was unnecessary. Removed all `<style jsx>` blocks from components.

## Rules Going Forward

### Never use styled-jsx in this project

- **DO:** Use Tailwind CSS utilities, `globals.css` for custom classes, or CSS Modules
- **DON'T:** Use `<style jsx>`, `<style jsx global>`, or any styled-jsx API
- Styled-jsx has known hydration issues with React Server Components and Next.js App Router

### Troubleshooting "broken styles" checklist

When styles look wrong in the browser:

1. **Check browser DevTools Console FIRST** — hydration mismatch errors are the #1 cause of style issues in Next.js App Router
2. **Compare server HTML vs client DOM** — look for class name differences (View Source vs Inspect Element)
3. **Don't trust agent-browser alone** — always verify in the user's actual browser; Playwright can mask hydration issues
4. **Check for styled-jsx** — run `grep -r "style jsx" src/` and migrate any found to globals.css or Tailwind
5. **Only then** investigate caching, build tools, network issues, etc.

### Recovering `.env.local` after a wipe

The `.env.local` file is gitignored. If the `app/` directory is deleted:
```bash
cd app
npx vercel link --yes --project salsa-ninja
# This pulls env vars and creates .env.local automatically
```

**Important:** The Vercel project name is `salsa-ninja`, NOT `app`.
