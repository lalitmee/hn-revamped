# Agent Operating Instructions (AGENTS.md)

Welcome to **HN Revamped**. This document defines the operating rules, technical constraints, and workflow protocols for AI coding agents and human contributors interacting with this repository.

---

## 1. Tooling & Environment Constraints

- **Package Manager:** Always use **`yarn`** (never `npm` or `pnpm`).
- **Lockfile Integrity:** `yarn.lock` is the canonical lockfile. Run `yarn install --frozen-lockfile` to install dependencies; never generate or restore `package-lock.json`.
- **Node.js Runtime:** Requires Node.js 20.x or newer.
- **Git Approvals:** Never commit, push, or tag changes without explicit user approval.
- **Commit Format:** Strictly use the **Conventional Commits** standard (e.g., `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `style:`).

---

## 2. Verification Protocol

Before submitting or asking to commit changes, agents must run and pass the following checks:

```bash
# 1. Format Check (Prettier)
yarn format:check

# 2. TypeScript Validation
yarn typecheck

# 3. Test Suite (Vitest)
yarn test

# 4. Production Build Verification
yarn build
```

- Run `yarn format` to automatically apply formatting to `src/` and Markdown files.
- All 21+ unit and integration tests must pass without regressions before committing.

---

## 3. Architecture & Data Boundaries

### 3.1 Client-Side Data Layer

- **Direct Client Fetching:** Front-page feeds (Top, New, Best, Ask, Show, Launch, Jobs) are fetched directly by the browser from `https://hacker-news.firebaseio.com/v0/`.
- **Algolia API Integration:** Instant search (`⌘K`), time-travel queries, and nested comment trees fetch directly from `https://hn.algolia.com/api/v1/`.
- **Hard Rule:** Never proxy standard Hacker News feed, search, or comment calls through Next.js server routes (`/api/*`). Client-to-API fetching keeps serverless compute at zero.

### 3.2 Client Persistence

- User preferences (themes, fonts, text size, collapse mode), reading history, and bookmarks must be stored exclusively in browser `localStorage`.
- Parsed reader articles must be cached in `sessionStorage` (`hn_reader_<url>`) to eliminate duplicate fetches during tab switching.

### 3.3 Serverless Reader Route (`src/app/api/reader/route.ts`)

- The `/api/reader` route is the **only** serverless function in the project.
- **Mandatory Duration Ceiling:** Keep `export const maxDuration = 10;` to respect Vercel Hobby limits.
- **Mandatory Edge CDN Caching:** All successful responses must return `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800` alongside `CDN-Cache-Control` and `Vercel-CDN-Cache-Control` to ensure duplicate hits are served from Vercel's Edge Network for free.
- **No Heavy Native Dependencies:** Do not import `jsdom` or `isomorphic-dompurify` in server-side routes. Use `linkedom` paired with `dompurify` for DOM extraction and sanitization to keep cold starts sub-50ms and memory usage low.

---

## 4. Vercel Deployment Rules

- **Configuration:** Managed via [`vercel.json`](vercel.json).
- **Production-Only Builds:** The `ignoreCommand` filter (`[ "$VERCEL_ENV" = "production" ] && exit 1 || exit 0`) ensures that only commits merged or pushed to `main` trigger Vercel builds. Preview branches and PRs must remain suppressed to protect monthly build quotas. Do not remove or alter this ignore filter.

---

## 5. Coding & UI Guidelines

- **Iconography:** Use Google Material Symbols Rounded (`material-symbols-rounded` class) exclusively.
- **Theming:** All 11 themes must supply required CSS variables: `--bg-canvas`, `--bg-surface-1`, `--bg-surface-2`, `--bg-surface-active`, `--text-primary`, `--text-secondary`, `--accent`, `--link-unvisited`, `--link-visited`, and `--border-subtle`.
- **Markdown Hygiene:** Leave at least 1 empty line between headings, paragraphs, and list items.
- **Worktree Convention:** All Git worktrees must be created in sibling directories using the relative path convention `../hn-revamped-worktrees/<worktree-name>`.
