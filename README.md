<div align="center">
  <img src="src/app/icon.svg" width="64" height="64" alt="HN Revamped logo">
  <h1>HN Revamped</h1>
  <p>A fast, Google Material-inspired modern web client for Hacker News featuring dual-pane reading, e-reader themes, front-page time travel, and a paragraph-synced audio reader.</p>

  <p>
    <a href="https://hn-revamped.vercel.app"><strong>View Live App »</strong></a>
  </p>
</div>

---

HN Revamped is an opinionated, distraction-free web client for Hacker News built with Next.js 15, React 19, and Tailwind CSS. It connects directly to the official Firebase and Algolia Hacker News APIs to provide real-time feed updates, instant search, full-depth nested comment trees, and reading utilities without tracking or third-party bloat.

## Features

### Adaptive Dual-Mode Workspace

- **Split-Pane Layout:** Continuous feed browsing on the left with instant inline previews of comment threads and readable articles on the right.
- **Zen Focus Mode:** One-click distraction-free reading pane that collapses the feed rail for deep comment reading and long-form articles.
- **Deep-Link State:** Clean URL synchronization (`?story=<id>`) with full browser history integration and Back/Forward navigation support.

### 11 E-Reader & Code Themes

- Comprehensive color palettes built with strict CSS variables to match ambient lighting environments:
  - **E-Reader:** Warm Paper, Kindle Sepia, Kobo Matte, Crisp Day.
  - **Developer:** Obsidian Slate, Catppuccin Mocha, Solarized Dark, Solarized Light, Nord Frost, Gruvbox Dark, OLED Midnight.
- Native CSS variable engine with persistent storage in `localStorage`.
- Configurable typography, adjustable base font sizing, and custom UI density.

### Unified Real-Time Data Engine

- **Direct Client Streaming:** Front-page feeds (Top, New, Best, Ask, Show, Launch, Jobs) streamed directly from the official Hacker News Firebase API.
- **Algolia Search & Nested Trees:** Single-request nested comment trees, instant search modal (`⌘K`), and Front-Page Time Travel presets (All-Time Top, 2024, 2023, 2020, 2015, 2010).

### In-App Article Reader

- Server-side article extraction powered by `@mozilla/readability` and `linkedom`.
- Strict HTML sanitization via `isomorphic-dompurify`.
- Built-in fallback cards for non-standard web media, including YouTube video players, GitHub repositories, and PDF documents.

### Paragraph-Synced Audio Reader (Web Speech TTS)

- In-browser text-to-speech player utilizing native `window.speechSynthesis`.
- Code-aware content parsing that skips `<pre>` syntax blocks and raw URLs to prevent unnatural playback.
- Paragraph stepper capsule with active text highlighting, auto-scroll, speed adjustment (1x to 2x), and OS voice selection.

### Comment Folding & Reading Management

- Color-coded comment depth indents with customizable thread collapse modes (Collapse Replies vs. Fold Thread).
- Visited story tracking with semantic link states.
- Client-side bookmarks and reading history stored locally on device.
- Full Vim-style keyboard shortcuts (`j`/`k`, `o`, `c`, `r`, `b`, `?`).

---

## Architecture & Edge Optimizations

```
                          ┌─────────────────────────┐
                          │   Visitor Web Browser   │
                          └────────────┬────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            │                          │                          │
            ▼                          ▼                          ▼
┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
│   HN Firebase API     │  │    HN Algolia API     │  │  Vercel Edge Network  │
│  (Real-Time Feeds)    │  │ (Search & Comments)   │  │   (Static Assets)     │
└───────────────────────┘  └───────────────────────┘  └───────────┬───────────┘
                                                                  │
                                                                  ▼
                                                      ┌───────────────────────┐
                                                      │  /api/reader Route    │
                                                      │  (Edge CDN Cached)    │
                                                      └───────────────────────┘
```

- **Zero-Compute Feeds:** All feed queries, pagination, search, and comment trees fetch directly from Firebase and Algolia from the client's browser, consuming zero server compute.
- **Edge CDN Caching:** The `/api/reader` endpoint serves extracted articles with `s-maxage=86400, stale-while-revalidate=604800` headers. Once an article is extracted, Vercel's Edge CDN caches the response globally to eliminate duplicate serverless function invocations.
- **Crawler Guard:** `public/robots.txt` disallows automated scraping on `/api/` to safeguard serverless quotas.

---

## Run Locally

### Prerequisites

- Node.js 20.x or newer
- Yarn 1.22+

### Installation

```bash
# Clone the repository
git clone https://github.com/lalitmee/hn-revamped.git
cd hn-revamped

# Install dependencies
yarn install --frozen-lockfile

# Start development server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Development Checks

Always verify tests, types, and production builds before committing changes:

```bash
# Run unit and integration tests (Vitest)
yarn test

# Validate TypeScript types
yarn typecheck

# Verify optimized production build
yarn build

# Run local production server
yarn start
```

---

## Keyboard Shortcuts

Press `?` anywhere in the app to display the keyboard shortcuts modal:

| Key               | Action                              |
| :---------------- | :---------------------------------- |
| `j` / `k`         | Navigate down / up story feed       |
| `Enter` / `Space` | Select and open story detail        |
| `o`               | Open external article in new tab    |
| `c`               | Focus Comments tab                  |
| `r`               | Focus Reader tab                    |
| `b`               | Toggle bookmark for selected story  |
| `z`               | Toggle Zen mode / Split-pane mode   |
| `⌘K` / `Ctrl+K`   | Open Algolia search & time-travel   |
| `?`               | Toggle shortcuts modal              |
| `Esc`             | Close active modal / return to feed |

---

## Project Documentation

- [Design Specification](docs/superpowers/specs/2026-10-22-hn-revamped-design.md)
- [Implementation Plan](docs/superpowers/plans/2026-10-22-hn-revamped.md)
- [Release Notes](docs/releases/0.1.0.md)

---

## License

No project-level license is currently provided. Public visibility does not grant permission to reuse or distribute the source. All rights reserved.
