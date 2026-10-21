# HN Revamped Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fast, Google Material-inspired modern web client for Hacker News featuring an Adaptive Dual-Mode Workspace (Split-Pane + Zen), 11 E-Reader & Code themes, semantic link states, color-coded collapsible comment threads, a built-in `@mozilla/readability` Article Reader View, `⌘K` Algolia search, Front-Page Time Travel, and full Vim-style keyboard navigation.

**Architecture:** Next.js App Router (TypeScript + Tailwind CSS) client backed by a unified Hacker News data layer combining the official HN Firebase API (for real-time story feeds) and the HN Algolia API (for single-request nested comment trees, instant search, and historical time-travel), plus a server-side `/api/reader` route using `@mozilla/readability` and `linkedom` for distraction-free article extraction.

**Tech Stack:** Next.js 15+ (App Router), React 19, TypeScript, Tailwind CSS, Google Material Symbols Rounded, `@mozilla/readability`, `linkedom`, `dompurify` / `isomorphic-dompurify`, `vitest`, `@testing-library/react`, `jsdom`, `yarn`.

## Global Constraints

- Package manager: **Always use `yarn`** (never `npm`).
- Git commits: **Do not commit or push changes without explicit user approval.**
- Iconography: Use **Google Material Symbols Rounded** (`material-symbols-rounded` class) across all UI controls.
- Theme & Link Tokens: All 11 themes (`warm-paper`, `kindle-sepia`, `kobo-matte`, `crisp-day`, `obsidian-slate`, `catppuccin-mocha`, `solarized-dark`, `solarized-light`, `nord-frost`, `gruvbox-dark`, `oled-midnight`) must define explicit `--bg-canvas`, `--bg-surface-1`, `--bg-surface-2`, `--bg-surface-active`, `--text-primary`, `--text-secondary`, `--accent`, `--link-unvisited`, `--link-visited`, and `--border-subtle` CSS variables.

---

### Task 1: Project Scaffolding, TypeScript Types & Multi-Source Theme Engine

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `vitest.config.ts`
- Create: `src/types/hn.ts`
- Create: `src/lib/themes.ts`
- Create: `src/lib/__tests__/themes.test.ts`

**Interfaces:**
- Produces:
  - `FeedType`, `LayoutMode`, `DetailTab`, `FontFamilyId`, `ThemeId`, `ThemeDefinition`, `HNStory`, `HNComment`, `ReaderArticle`, `ReadHistoryEntry`, `UserPreferences` in `src/types/hn.ts`
  - `THEMES: Record<ThemeId, ThemeDefinition>`, `DEFAULT_PREFERENCES: UserPreferences`, `getThemeCssVars(themeId: ThemeId): Record<string, string>` in `src/lib/themes.ts`

- [ ] **Step 1: Initialize `package.json`, TypeScript, Next.js, and Vitest configs**

Create `package.json`:

```json
{
  "name": "hn-revamped",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@mozilla/readability": "^0.5.0",
    "isomorphic-dompurify": "^2.16.0",
    "linkedom": "^0.18.5",
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.49",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `next.config.ts`:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

Create `postcss.config.mjs`:

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 2: Install dependencies with `yarn` and write the failing theme test**

Run: `yarn install`

Create `src/lib/__tests__/themes.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { THEMES, getThemeCssVars, DEFAULT_PREFERENCES } from '../themes';

describe('Multi-Source Theme Engine', () => {
  it('defines all 11 reader and code themes with complete semantic tokens', () => {
    const themeIds = Object.keys(THEMES);
    expect(themeIds).toHaveLength(11);
    expect(themeIds).toContain('warm-paper');
    expect(themeIds).toContain('kindle-sepia');
    expect(themeIds).toContain('kobo-matte');
    expect(themeIds).toContain('obsidian-slate');
    expect(themeIds).toContain('catppuccin-mocha');
    expect(themeIds).toContain('solarized-dark');
    expect(themeIds).toContain('nord-frost');
    expect(themeIds).toContain('gruvbox-dark');

    for (const theme of Object.values(THEMES)) {
      expect(theme.colors.bgCanvas).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.colors.linkUnvisited).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.colors.linkVisited).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.colors.linkUnvisited).not.toBe(theme.colors.linkVisited);
    }
  });

  it('generates CSS variable map for a given theme', () => {
    const vars = getThemeCssVars('kindle-sepia');
    expect(vars['--bg-canvas']).toBe('#F4ECD8');
    expect(vars['--link-unvisited']).toBe('#0369A1');
    expect(vars['--link-visited']).toBe('#6D28D9');
  });

  it('exports sensible default user preferences', () => {
    expect(DEFAULT_PREFERENCES.layoutMode).toBe('split');
    expect(DEFAULT_PREFERENCES.fontSize).toBe(16);
    expect(DEFAULT_PREFERENCES.lineWidth).toBe('65ch');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `yarn test src/lib/__tests__/themes.test.ts`
Expected: FAIL with module `../themes` not found.

- [ ] **Step 4: Implement `src/types/hn.ts` and `src/lib/themes.ts`**

Create `src/types/hn.ts`:

```typescript
export type FeedType = 'top' | 'new' | 'best' | 'ask' | 'show' | 'jobs' | 'saved';

export type LayoutMode = 'split' | 'zen';

export type DetailTab = 'comments' | 'reader';

export type FontFamilyId = 'sans' | 'serif' | 'hyperlegible' | 'mono';

export type LineWidthOption = '55ch' | '65ch' | '75ch' | 'full';

export type ThemeId =
  | 'warm-paper'
  | 'kindle-sepia'
  | 'kobo-matte'
  | 'crisp-day'
  | 'obsidian-slate'
  | 'catppuccin-mocha'
  | 'solarized-dark'
  | 'solarized-light'
  | 'nord-frost'
  | 'gruvbox-dark'
  | 'oled-midnight';

export interface ThemeColors {
  bgCanvas: string;
  bgSurface1: string;
  bgSurface2: string;
  bgSurfaceActive: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  linkUnvisited: string;
  linkVisited: string;
  borderSubtle: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  category: 'reader' | 'code';
  mode: 'light' | 'dark';
  inspiration: string;
  colors: ThemeColors;
}

export type StoryBadgeType = 'show' | 'ask' | 'launch' | 'pdf' | 'video' | 'github' | 'audio';

export interface StoryBadge {
  type: StoryBadgeType;
  label: string;
  icon: string;
}

export interface HNStory {
  id: number;
  title: string;
  cleanTitle: string;
  url?: string;
  domain?: string;
  text?: string;
  points: number;
  user: string;
  time: number;
  commentsCount: number;
  badges: StoryBadge[];
  type: 'story' | 'job' | 'ask' | 'poll';
}

export interface HNComment {
  id: number;
  user: string;
  time: number;
  text: string;
  points?: number | null;
  parentId?: number;
  children: HNComment[];
  totalDescendants: number;
  isDeadOrDeleted?: boolean;
}

export interface HNStoryWithComments extends HNStory {
  comments: HNComment[];
}

export interface ReaderArticle {
  url: string;
  title: string;
  byline?: string | null;
  siteName?: string | null;
  contentHtml: string;
  textContent: string;
  excerpt?: string | null;
  readingTimeMinutes: number;
  fallbackType?: 'youtube' | 'github' | 'pdf' | 'blocked';
  youtubeVideoId?: string;
  githubRepo?: { owner: string; repo: string };
}

export interface ReadHistoryEntry {
  storyId: number;
  lastVisitedAt: number;
  lastCommentCount: number;
}

export interface UserPreferences {
  themeId: ThemeId;
  fontFamily: FontFamilyId;
  fontSize: number;
  lineHeight: number;
  lineWidth: LineWidthOption;
  layoutMode: LayoutMode;
  hideReadStories: boolean;
  mutedKeywords: string[];
  mutedDomains: string[];
}
```

Create `src/lib/themes.ts`:

```typescript
import { ThemeDefinition, ThemeId, UserPreferences, FontFamilyId } from '@/types/hn';

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  'warm-paper': {
    id: 'warm-paper',
    name: 'Warm Paper',
    category: 'reader',
    mode: 'light',
    inspiration: 'Readwise & Instapaper',
    colors: {
      bgCanvas: '#FAF8F5',
      bgSurface1: '#F3EFEA',
      bgSurface2: '#EAE4DC',
      bgSurfaceActive: '#F5E8DC',
      textPrimary: '#1C1917',
      textSecondary: '#44403C',
      textMuted: '#78716C',
      accent: '#EA580C',
      linkUnvisited: '#0284C7',
      linkVisited: '#7C3AED',
      borderSubtle: '#E6E1DA',
    },
  },
  'kindle-sepia': {
    id: 'kindle-sepia',
    name: 'Kindle Sepia',
    category: 'reader',
    mode: 'light',
    inspiration: 'Amazon Kindle Warm',
    colors: {
      bgCanvas: '#F4ECD8',
      bgSurface1: '#EAE0C8',
      bgSurface2: '#DFD3B6',
      bgSurfaceActive: '#E8D5B5',
      textPrimary: '#3B2E1E',
      textSecondary: '#5C4934',
      textMuted: '#826A50',
      accent: '#B45309',
      linkUnvisited: '#0369A1',
      linkVisited: '#6D28D9',
      borderSubtle: '#DECBA4',
    },
  },
  'kobo-matte': {
    id: 'kobo-matte',
    name: 'Kobo E-Ink Matte',
    category: 'reader',
    mode: 'light',
    inspiration: 'E-Ink Paper Display',
    colors: {
      bgCanvas: '#E8E6E1',
      bgSurface1: '#DDDAD3',
      bgSurface2: '#D0CCC3',
      bgSurfaceActive: '#D8D0C5',
      textPrimary: '#1F1F1F',
      textSecondary: '#454545',
      textMuted: '#6B6B6B',
      accent: '#C2410C',
      linkUnvisited: '#1D4ED8',
      linkVisited: '#6D28D9',
      borderSubtle: '#C8C4BC',
    },
  },
  'crisp-day': {
    id: 'crisp-day',
    name: 'Google Crisp Day',
    category: 'reader',
    mode: 'light',
    inspiration: 'Google Material 3 Light',
    colors: {
      bgCanvas: '#F8FAFC',
      bgSurface1: '#FFFFFF',
      bgSurface2: '#F1F5F9',
      bgSurfaceActive: '#FFF7ED',
      textPrimary: '#0F172A',
      textSecondary: '#334155',
      textMuted: '#64748B',
      accent: '#EA580C',
      linkUnvisited: '#2563EB',
      linkVisited: '#7C3AED',
      borderSubtle: '#E2E8F0',
    },
  },
  'obsidian-slate': {
    id: 'obsidian-slate',
    name: 'Obsidian Slate',
    category: 'reader',
    mode: 'dark',
    inspiration: 'Material Dark & Linear',
    colors: {
      bgCanvas: '#0C0C0E',
      bgSurface1: '#16171B',
      bgSurface2: '#202228',
      bgSurfaceActive: '#261C16',
      textPrimary: '#F3F4F6',
      textSecondary: '#D1D5DB',
      textMuted: '#9CA3AF',
      accent: '#FB923C',
      linkUnvisited: '#60A5FA',
      linkVisited: '#A78BFA',
      borderSubtle: '#262932',
    },
  },
  'catppuccin-mocha': {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    category: 'code',
    mode: 'dark',
    inspiration: 'Catppuccin Code Theme',
    colors: {
      bgCanvas: '#1E1E2E',
      bgSurface1: '#181825',
      bgSurface2: '#313244',
      bgSurfaceActive: '#2D2738',
      textPrimary: '#CDD6F4',
      textSecondary: '#BAC2DE',
      textMuted: '#A6ADC8',
      accent: '#FAB387',
      linkUnvisited: '#89B4FA',
      linkVisited: '#CBA6F7',
      borderSubtle: '#313244',
    },
  },
  'solarized-dark': {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    category: 'code',
    mode: 'dark',
    inspiration: 'Ethan Schoonover Solarized',
    colors: {
      bgCanvas: '#002B36',
      bgSurface1: '#073642',
      bgSurface2: '#0D4452',
      bgSurfaceActive: '#133E4A',
      textPrimary: '#93A1A1',
      textSecondary: '#839496',
      textMuted: '#657B83',
      accent: '#CB4B16',
      linkUnvisited: '#268BD2',
      linkVisited: '#6C71C4',
      borderSubtle: '#0D4452',
    },
  },
  'solarized-light': {
    id: 'solarized-light',
    name: 'Solarized Light',
    category: 'code',
    mode: 'light',
    inspiration: 'Ethan Schoonover Solarized',
    colors: {
      bgCanvas: '#FDF6E3',
      bgSurface1: '#EEE8D5',
      bgSurface2: '#E4DEC8',
      bgSurfaceActive: '#EFE4CE',
      textPrimary: '#586E75',
      textSecondary: '#657B83',
      textMuted: '#93A1A1',
      accent: '#CB4B16',
      linkUnvisited: '#268BD2',
      linkVisited: '#6C71C4',
      borderSubtle: '#E1DBCA',
    },
  },
  'nord-frost': {
    id: 'nord-frost',
    name: 'Nord Frost',
    category: 'code',
    mode: 'dark',
    inspiration: 'Arctic Studio Nord',
    colors: {
      bgCanvas: '#2E3440',
      bgSurface1: '#3B4252',
      bgSurface2: '#434C5E',
      bgSurfaceActive: '#46424B',
      textPrimary: '#ECEFF4',
      textSecondary: '#D8DEE9',
      textMuted: '#9BA6B8',
      accent: '#D08770',
      linkUnvisited: '#88C0D0',
      linkVisited: '#B48EAD',
      borderSubtle: '#4C566A',
    },
  },
  'gruvbox-dark': {
    id: 'gruvbox-dark',
    name: 'Gruvbox Dark',
    category: 'code',
    mode: 'dark',
    inspiration: 'Retro Groove Code Theme',
    colors: {
      bgCanvas: '#282828',
      bgSurface1: '#32302F',
      bgSurface2: '#3C3836',
      bgSurfaceActive: '#42352B',
      textPrimary: '#EBDBB2',
      textSecondary: '#D5C4A1',
      textMuted: '#A89984',
      accent: '#FE8019',
      linkUnvisited: '#83A598',
      linkVisited: '#D3869B',
      borderSubtle: '#3C3836',
    },
  },
  'oled-midnight': {
    id: 'oled-midnight',
    name: 'True OLED Midnight',
    category: 'reader',
    mode: 'dark',
    inspiration: 'Pitch Black AMOLED',
    colors: {
      bgCanvas: '#000000',
      bgSurface1: '#0A0A0C',
      bgSurface2: '#141418',
      bgSurfaceActive: '#1F140E',
      textPrimary: '#FAFAFA',
      textSecondary: '#D4D4D8',
      textMuted: '#71717A',
      accent: '#F97316',
      linkUnvisited: '#38BDF8',
      linkVisited: '#C084FC',
      borderSubtle: '#1E1E24',
    },
  },
};

export const FONT_FAMILIES: Record<FontFamilyId, { label: string; cssValue: string }> = {
  sans: {
    label: 'Editorial Sans',
    cssValue: "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif",
  },
  serif: {
    label: 'Literary Serif',
    cssValue: "'Newsreader', 'Charter', 'Georgia', serif",
  },
  hyperlegible: {
    label: 'Hyperlegible',
    cssValue: "'Atkinson Hyperlegible', system-ui, sans-serif",
  },
  mono: {
    label: 'Developer Mono',
    cssValue: "'JetBrains Mono', 'Fira Code', monospace",
  },
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  themeId: 'obsidian-slate',
  fontFamily: 'sans',
  fontSize: 16,
  lineHeight: 1.65,
  lineWidth: '65ch',
  layoutMode: 'split',
  hideReadStories: false,
  mutedKeywords: [],
  mutedDomains: [],
};

export function getThemeCssVars(themeId: ThemeId): Record<string, string> {
  const theme = THEMES[themeId] ?? THEMES['obsidian-slate'];
  return {
    '--bg-canvas': theme.colors.bgCanvas,
    '--bg-surface-1': theme.colors.bgSurface1,
    '--bg-surface-2': theme.colors.bgSurface2,
    '--bg-surface-active': theme.colors.bgSurfaceActive,
    '--text-primary': theme.colors.textPrimary,
    '--text-secondary': theme.colors.textSecondary,
    '--text-muted': theme.colors.textMuted,
    '--accent': theme.colors.accent,
    '--link-unvisited': theme.colors.linkUnvisited,
    '--link-visited': theme.colors.linkVisited,
    '--border-subtle': theme.colors.borderSubtle,
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `yarn test src/lib/__tests__/themes.test.ts`
Expected: PASS (3 passed).

---

### Task 2: Unified Hacker News API Client, Smart Tag Detection & HTML Sanitizer

**Files:**
- Create: `src/lib/hn-api.ts`
- Create: `src/lib/html-sanitizer.ts`
- Create: `src/lib/__tests__/hn-api.test.ts`

**Interfaces:**
- Consumes: `HNStory`, `HNComment`, `HNStoryWithComments`, `FeedType`, `StoryBadge` from `src/types/hn.ts`
- Produces:
  - `extractDomain(url?: string): string | undefined`
  - `parseTitleAndBadges(rawTitle: string, url?: string): { cleanTitle: string; badges: StoryBadge[] }`
  - `fetchFeedStories(feed: FeedType, page?: number, pageSize?: number): Promise<HNStory[]>`
  - `fetchStoryWithComments(storyId: number): Promise<HNStoryWithComments>`
  - `searchHN(params: { query: string; tags?: string; sortBy?: 'relevance' | 'date'; numericFilters?: string }): Promise<HNStory[]>`
  - `fetchTimeTravelStories(startTimestampSec: number, endTimestampSec: number): Promise<HNStory[]>`
  - `formatCommentHtml(rawHtml: string): string`

- [ ] **Step 1: Write failing tests for title badge extraction, HTML sanitization, and Algolia tree normalization**

Create `src/lib/__tests__/hn-api.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  extractDomain,
  parseTitleAndBadges,
  normalizeAlgoliaCommentTree,
} from '../hn-api';
import { formatCommentHtml } from '../html-sanitizer';

describe('HN API Utilities & Sanitizer', () => {
  it('extracts clean domain names without www.', () => {
    expect(extractDomain('https://www.github.com/zed-industries/zed')).toBe('github.com');
    expect(extractDomain('https://sqlite.org/faster.html')).toBe('sqlite.org');
    expect(extractDomain(undefined)).toBeUndefined();
  });

  it('detects Show HN, Ask HN, PDF, Video, and GitHub badges and cleans title', () => {
    const res1 = parseTitleAndBadges(
      'Show HN: Zed 1.0 – Fast Code Editor [video]',
      'https://github.com/zed-industries/zed'
    );
    expect(res1.cleanTitle).toBe('Zed 1.0 – Fast Code Editor');
    expect(res1.badges.map((b) => b.type)).toEqual(['show', 'video', 'github']);

    const res2 = parseTitleAndBadges(
      'Ask HN: What is your favorite e-ink reader? (pdf)',
      'https://example.com/paper.pdf'
    );
    expect(res2.cleanTitle).toBe('What is your favorite e-ink reader?');
    expect(res2.badges.map((b) => b.type)).toEqual(['ask', 'pdf']);
  });

  it('normalizes nested Algolia comment tree and counts total descendants', () => {
    const rawChildren = [
      {
        id: 101,
        author: 'tptacek',
        created_at_i: 1700000000,
        text: '<p>Great work!</p>',
        children: [
          {
            id: 102,
            author: 'nathansobo',
            created_at_i: 1700000100,
            text: '<p>Thanks!</p>',
            children: [],
          },
        ],
      },
    ];
    const tree = normalizeAlgoliaCommentTree(rawChildren);
    expect(tree).toHaveLength(1);
    expect(tree[0].user).toBe('tptacek');
    expect(tree[0].totalDescendants).toBe(1);
    expect(tree[0].children[0].user).toBe('nathansobo');
  });

  it('rewrites internal HN item URLs and marks external links cleanly', () => {
    const raw =
      '<p>See <a href="https://news.ycombinator.com/item?id=410923">this thread</a> and <a href="https://zed.dev">Zed</a></p>';
    const formatted = formatCommentHtml(raw);
    expect(formatted).toContain('data-hn-item-id="410923"');
    expect(formatted).toContain('class="hn-internal-link"');
    expect(formatted).toContain('class="hn-external-link"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/lib/__tests__/hn-api.test.ts`
Expected: FAIL with module `../hn-api` not found.

- [ ] **Step 3: Implement `src/lib/html-sanitizer.ts` and `src/lib/hn-api.ts`**

Create `src/lib/html-sanitizer.ts`:

```typescript
import DOMPurify from 'isomorphic-dompurify';

const HN_ITEM_REGEX = /^https?:\/\/news\.ycombinator\.com\/item\?id=(\d+)/i;

export function formatCommentHtml(rawHtml: string): string {
  if (!rawHtml) return '';

  const clean = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['p', 'a', 'i', 'em', 'b', 'strong', 'pre', 'code', 'ul', 'ol', 'li', 'blockquote', 'br'],
    ALLOWED_ATTR: ['href', 'rel', 'target'],
  });

  return clean.replace(/<a\s+([^>]*?)href="([^"]+)"([^>]*)>(.*?)<\/a>/gi, (_match, pre, href, post, innerText) => {
    const decodedHref = href.replace(/&amp;/g, '&');
    const hnMatch = decodedHref.match(HN_ITEM_REGEX);

    if (hnMatch) {
      const itemId = hnMatch[1];
      return `<a href="?story=${itemId}" data-hn-item-id="${itemId}" class="hn-internal-link"><span class="material-symbols-rounded hn-link-icon">forum</span>HN #${itemId}</a>`;
    }

    return `<a ${pre}href="${decodedHref}" target="_blank" rel="noopener noreferrer" class="hn-external-link"${post}>${innerText}<span class="material-symbols-rounded hn-link-icon">north_east</span></a>`;
  });
}
```

Create `src/lib/hn-api.ts`:

```typescript
import { FeedType, HNComment, HNStory, HNStoryWithComments, StoryBadge } from '@/types/hn';

const FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0';
const ALGOLIA_BASE = 'https://hn.algolia.com/api/v1';

export function extractDomain(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return undefined;
  }
}

export function parseTitleAndBadges(
  rawTitle: string,
  url?: string
): { cleanTitle: string; badges: StoryBadge[] } {
  let title = (rawTitle || '').trim();
  const badges: StoryBadge[] = [];

  if (/^Show HN:\s*/i.test(title)) {
    badges.push({ type: 'show', label: 'Show HN', icon: 'rocket_launch' });
    title = title.replace(/^Show HN:\s*/i, '');
  } else if (/^Ask HN:\s*/i.test(title)) {
    badges.push({ type: 'ask', label: 'Ask HN', icon: 'help' });
    title = title.replace(/^Ask HN:\s*/i, '');
  } else if (/^Launch HN:\s*/i.test(title)) {
    badges.push({ type: 'launch', label: 'Launch HN', icon: 'flag' });
    title = title.replace(/^Launch HN:\s*/i, '');
  }

  if (/\s*[\[\(]pdf[\]\)]\s*$/i.test(title) || (url && /\.pdf($|\?)/i.test(url))) {
    badges.push({ type: 'pdf', label: 'PDF', icon: 'picture_as_pdf' });
    title = title.replace(/\s*[\[\(]pdf[\]\)]\s*$/i, '');
  }

  if (
    /\s*[\[\(]video[\]\)]\s*$/i.test(title) ||
    (url && /(youtube\.com\/watch|youtu\.be\/|vimeo\.com)/i.test(url))
  ) {
    badges.push({ type: 'video', label: 'Video', icon: 'play_circle' });
    title = title.replace(/\s*[\[\(]video[\]\)]\s*$/i, '');
  }

  if (url && /github\.com\/[^/]+\/[^/]+/i.test(url)) {
    badges.push({ type: 'github', label: 'GitHub', icon: 'code' });
  }

  return { cleanTitle: title.trim(), badges };
}

export interface AlgoliaRawNode {
  id: number;
  author?: string | null;
  created_at_i?: number;
  text?: string | null;
  points?: number | null;
  parent_id?: number;
  children?: AlgoliaRawNode[];
}

export function normalizeAlgoliaCommentTree(nodes: AlgoliaRawNode[] = []): HNComment[] {
  const result: HNComment[] = [];

  for (const node of nodes) {
    if (!node || (!node.text && (!node.children || node.children.length === 0))) {
      continue;
    }
    const children = normalizeAlgoliaCommentTree(node.children || []);
    const totalDescendants = children.reduce((acc, child) => acc + 1 + child.totalDescendants, 0);

    result.push({
      id: node.id,
      user: node.author || '[deleted]',
      time: node.created_at_i || Math.floor(Date.now() / 1000),
      text: node.text || '',
      points: node.points ?? null,
      parentId: node.parent_id,
      children,
      totalDescendants,
      isDeadOrDeleted: !node.author || !node.text,
    });
  }

  return result;
}

const FEED_ENDPOINTS: Record<Exclude<FeedType, 'saved'>, string> = {
  top: 'topstories',
  new: 'newstories',
  best: 'beststories',
  ask: 'askstories',
  show: 'showstories',
  jobs: 'jobstories',
};

export async function fetchStoryItem(id: number): Promise<HNStory | null> {
  try {
    const res = await fetch(`${FIREBASE_BASE}/item/${id}.json`);
    if (!res.ok) return null;
    const item = await res.json();
    if (!item || item.deleted || item.dead || !item.title) return null;

    const { cleanTitle, badges } = parseTitleAndBadges(item.title, item.url);
    return {
      id: item.id,
      title: item.title,
      cleanTitle,
      url: item.url,
      domain: extractDomain(item.url),
      text: item.text,
      points: item.score ?? 0,
      user: item.by ?? 'anonymous',
      time: item.time ?? Math.floor(Date.now() / 1000),
      commentsCount: item.descendants ?? 0,
      badges,
      type: item.type === 'job' ? 'job' : item.title.startsWith('Ask HN:') ? 'ask' : 'story',
    };
  } catch {
    return null;
  }
}

export async function fetchFeedStories(
  feed: FeedType,
  page = 1,
  pageSize = 30
): Promise<HNStory[]> {
  if (feed === 'saved') return [];
  const endpoint = FEED_ENDPOINTS[feed];
  const res = await fetch(`${FIREBASE_BASE}/${endpoint}.json`);
  if (!res.ok) throw new Error(`Failed to fetch ${feed} feed`);

  const ids: number[] = await res.json();
  const slice = ids.slice((page - 1) * pageSize, page * pageSize);
  const stories = await Promise.all(slice.map((id) => fetchStoryItem(id)));
  return stories.filter((s): s is HNStory => s !== null);
}

export async function fetchStoryWithComments(storyId: number): Promise<HNStoryWithComments> {
  const res = await fetch(`${ALGOLIA_BASE}/items/${storyId}`);
  if (res.ok) {
    const data = await res.json();
    const { cleanTitle, badges } = parseTitleAndBadges(data.title || '', data.url);
    const comments = normalizeAlgoliaCommentTree(data.children || []);
    return {
      id: data.id,
      title: data.title || '',
      cleanTitle,
      url: data.url || undefined,
      domain: extractDomain(data.url),
      text: data.text || undefined,
      points: data.points ?? 0,
      user: data.author || 'anonymous',
      time: data.created_at_i || Math.floor(Date.now() / 1000),
      commentsCount: comments.reduce((acc, c) => acc + 1 + c.totalDescendants, 0),
      badges,
      type: data.type === 'job' ? 'job' : 'story',
      comments,
    };
  }

  const fallbackStory = await fetchStoryItem(storyId);
  if (!fallbackStory) {
    throw new Error(`Story #${storyId} could not be loaded`);
  }
  return { ...fallbackStory, comments: [] };
}

interface AlgoliaHit {
  objectID: string;
  title?: string;
  story_title?: string;
  url?: string;
  story_url?: string;
  story_text?: string;
  points?: number;
  author?: string;
  created_at_i?: number;
  num_comments?: number;
}

function mapHitToStory(hit: AlgoliaHit): HNStory {
  const rawTitle = hit.title || hit.story_title || 'Untitled';
  const url = hit.url || hit.story_url || undefined;
  const { cleanTitle, badges } = parseTitleAndBadges(rawTitle, url);
  return {
    id: Number(hit.objectID),
    title: rawTitle,
    cleanTitle,
    url,
    domain: extractDomain(url),
    text: hit.story_text || undefined,
    points: hit.points ?? 0,
    user: hit.author || 'anonymous',
    time: hit.created_at_i || Math.floor(Date.now() / 1000),
    commentsCount: hit.num_comments ?? 0,
    badges,
    type: 'story',
  };
}

export async function searchHN(params: {
  query: string;
  tags?: string;
  sortBy?: 'relevance' | 'date';
  numericFilters?: string;
}): Promise<HNStory[]> {
  const endpoint = params.sortBy === 'date' ? 'search_by_date' : 'search';
  const url = new URL(`${ALGOLIA_BASE}/${endpoint}`);
  url.searchParams.set('query', params.query);
  url.searchParams.set('tags', params.tags || 'story');
  url.searchParams.set('hitsPerPage', '35');
  if (params.numericFilters) {
    url.searchParams.set('numericFilters', params.numericFilters);
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Algolia search failed');
  const data = await res.json();
  return (data.hits || []).map(mapHitToStory);
}

export async function fetchTimeTravelStories(
  startTimestampSec: number,
  endTimestampSec: number
): Promise<HNStory[]> {
  return searchHN({
    query: '',
    tags: 'story',
    sortBy: 'relevance',
    numericFilters: `created_at_i>${startTimestampSec},created_at_i<${endTimestampSec}`,
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/lib/__tests__/hn-api.test.ts`
Expected: PASS (4 passed).

---

### Task 3: Local-First Storage Service (Read History, Delta Comment Badges, Bookmarks & Muted Filters)

**Files:**
- Create: `src/lib/storage.ts`
- Create: `src/lib/__tests__/storage.test.ts`

**Interfaces:**
- Consumes: `HNStory`, `ReadHistoryEntry`, `UserPreferences` from `src/types/hn.ts`, `DEFAULT_PREFERENCES` from `src/lib/themes.ts`
- Produces:
  - `loadPreferences(): UserPreferences`
  - `savePreferences(prefs: UserPreferences): void`
  - `loadReadHistory(): Record<number, ReadHistoryEntry>`
  - `markStoryAsRead(storyId: number, currentCommentsCount: number): Record<number, ReadHistoryEntry>`
  - `getNewCommentsDelta(storyId: number, currentCommentsCount: number, history: Record<number, ReadHistoryEntry>): number`
  - `loadBookmarks(): HNStory[]`
  - `toggleBookmarkStory(story: HNStory): { bookmarks: HNStory[]; isBookmarked: boolean }`
  - `filterStories(stories: HNStory[], prefs: UserPreferences, history: Record<number, ReadHistoryEntry>): HNStory[]`

- [ ] **Step 1: Write failing tests for storage persistence, comment delta calculation, and story filtering**

Create `src/lib/__tests__/storage.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadPreferences,
  savePreferences,
  markStoryAsRead,
  getNewCommentsDelta,
  toggleBookmarkStory,
  filterStories,
} from '../storage';
import { DEFAULT_PREFERENCES } from '../themes';
import { HNStory } from '@/types/hn';

const sampleStory: HNStory = {
  id: 5001,
  title: 'Show HN: Fast Rust Compiler',
  cleanTitle: 'Fast Rust Compiler',
  url: 'https://github.com/example/rust-compiler',
  domain: 'github.com',
  points: 340,
  user: 'dev',
  time: 1700000000,
  commentsCount: 120,
  badges: [],
  type: 'story',
};

describe('Local Storage & Filtering Service', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists and loads user preferences', () => {
    expect(loadPreferences().themeId).toBe('obsidian-slate');
    savePreferences({ ...DEFAULT_PREFERENCES, themeId: 'kindle-sepia', fontSize: 18 });
    expect(loadPreferences().themeId).toBe('kindle-sepia');
    expect(loadPreferences().fontSize).toBe(18);
  });

  it('tracks read stories and calculates +N new comment deltas', () => {
    const history = markStoryAsRead(5001, 100);
    expect(history[5001].lastCommentCount).toBe(100);
    expect(getNewCommentsDelta(5001, 128, history)).toBe(28);
    expect(getNewCommentsDelta(5001, 95, history)).toBe(0);
    expect(getNewCommentsDelta(9999, 50, history)).toBe(0);
  });

  it('toggles story bookmarks cleanly', () => {
    const first = toggleBookmarkStory(sampleStory);
    expect(first.isBookmarked).toBe(true);
    expect(first.bookmarks).toHaveLength(1);

    const second = toggleBookmarkStory(sampleStory);
    expect(second.isBookmarked).toBe(false);
    expect(second.bookmarks).toHaveLength(0);
  });

  it('filters stories by muted keywords, muted domains, and hideReadStories', () => {
    const cryptoStory: HNStory = {
      ...sampleStory,
      id: 5002,
      title: 'Why Blockchain Token Failed',
      cleanTitle: 'Why Blockchain Token Failed',
      domain: 'spamcoin.io',
    };
    const history = markStoryAsRead(5001, 120);

    const filteredByKeyword = filterStories(
      [sampleStory, cryptoStory],
      { ...DEFAULT_PREFERENCES, mutedKeywords: ['blockchain'] },
      {}
    );
    expect(filteredByKeyword.map((s) => s.id)).toEqual([5001]);

    const filteredByRead = filterStories(
      [sampleStory, cryptoStory],
      { ...DEFAULT_PREFERENCES, hideReadStories: true },
      history
    );
    expect(filteredByRead.map((s) => s.id)).toEqual([5002]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/lib/__tests__/storage.test.ts`
Expected: FAIL with module `../storage` not found.

- [ ] **Step 3: Implement `src/lib/storage.ts`**

Create `src/lib/storage.ts`:

```typescript
import { HNStory, ReadHistoryEntry, UserPreferences } from '@/types/hn';
import { DEFAULT_PREFERENCES } from './themes';

const PREFS_KEY = 'hn_revamped_prefs_v1';
const HISTORY_KEY = 'hn_revamped_history_v1';
const BOOKMARKS_KEY = 'hn_revamped_bookmarks_v1';

export function loadPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: UserPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadReadHistory(): Record<number, ReadHistoryEntry> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function markStoryAsRead(
  storyId: number,
  currentCommentsCount: number
): Record<number, ReadHistoryEntry> {
  const history = loadReadHistory();
  history[storyId] = {
    storyId,
    lastVisitedAt: Date.now(),
    lastCommentCount: currentCommentsCount,
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // Ignore quota errors
    }
  }
  return history;
}

export function getNewCommentsDelta(
  storyId: number,
  currentCommentsCount: number,
  history: Record<number, ReadHistoryEntry>
): number {
  const entry = history[storyId];
  if (!entry) return 0;
  const delta = currentCommentsCount - entry.lastCommentCount;
  return delta > 0 ? delta : 0;
}

export function loadBookmarks(): HNStory[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleBookmarkStory(story: HNStory): {
  bookmarks: HNStory[];
  isBookmarked: boolean;
} {
  const current = loadBookmarks();
  const exists = current.some((b) => b.id === story.id);
  const next = exists ? current.filter((b) => b.id !== story.id) : [story, ...current];

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota errors
    }
  }
  return { bookmarks: next, isBookmarked: !exists };
}

export function filterStories(
  stories: HNStory[],
  prefs: UserPreferences,
  history: Record<number, ReadHistoryEntry>
): HNStory[] {
  const keywords = prefs.mutedKeywords.map((k) => k.toLowerCase().trim()).filter(Boolean);
  const domains = prefs.mutedDomains.map((d) => d.toLowerCase().trim()).filter(Boolean);

  return stories.filter((story) => {
    if (prefs.hideReadStories && history[story.id]) {
      return false;
    }
    if (story.domain && domains.some((d) => story.domain!.toLowerCase().includes(d))) {
      return false;
    }
    const lowerTitle = story.title.toLowerCase();
    if (keywords.some((kw) => lowerTitle.includes(kw))) {
      return false;
    }
    return true;
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/lib/__tests__/storage.test.ts`
Expected: PASS (4 passed).

---

### Task 4: Server-Side Article Reader View Extractor (`/api/reader`)

**Files:**
- Create: `src/lib/reader-extractor.ts`
- Create: `src/app/api/reader/route.ts`
- Create: `src/lib/__tests__/reader-extractor.test.ts`

**Interfaces:**
- Consumes: `ReaderArticle` from `src/types/hn.ts`
- Produces:
  - `detectSpecialUrlFallback(url: string): Partial<ReaderArticle> | null`
  - `extractArticleFromHtml(html: string, url: string): ReaderArticle`
  - `GET /api/reader?url=<encodedUrl>` returning `ReaderArticle` JSON

- [ ] **Step 1: Write failing tests for special URL detection (YouTube, GitHub, PDF) and `@mozilla/readability` HTML extraction**

Create `src/lib/__tests__/reader-extractor.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { detectSpecialUrlFallback, extractArticleFromHtml } from '../reader-extractor';

describe('Article Reader View Extractor', () => {
  it('detects YouTube, GitHub repo, and PDF URLs cleanly', () => {
    const yt = detectSpecialUrlFallback('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(yt?.fallbackType).toBe('youtube');
    expect(yt?.youtubeVideoId).toBe('dQw4w9WgXcQ');

    const gh = detectSpecialUrlFallback('https://github.com/zed-industries/zed');
    expect(gh?.fallbackType).toBe('github');
    expect(gh?.githubRepo).toEqual({ owner: 'zed-industries', repo: 'zed' });

    const pdf = detectSpecialUrlFallback('https://sqlite.org/paper.pdf');
    expect(pdf?.fallbackType).toBe('pdf');
  });

  it('extracts clean readable article content and computes reading time from HTML', () => {
    const sampleHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Why SQLite is Fast</title></head>
        <body>
          <nav>Menu Clutter</nav>
          <article>
            <h1>Why SQLite is Fast</h1>
            <p>SQLite runs in-process without network roundtrips, making queries execute in microseconds.</p>
            <p>By avoiding IPC overhead, hundreds of small queries complete faster than a single RPC call.</p>
          </article>
          <script>alert("xss")</script>
        </body>
      </html>
    `;
    const article = extractArticleFromHtml(sampleHtml, 'https://sqlite.org/fast.html');
    expect(article.title).toContain('Why SQLite is Fast');
    expect(article.contentHtml).toContain('without network roundtrips');
    expect(article.contentHtml).not.toContain('<script>');
    expect(article.readingTimeMinutes).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/lib/__tests__/reader-extractor.test.ts`
Expected: FAIL with module `../reader-extractor` not found.

- [ ] **Step 3: Implement `src/lib/reader-extractor.ts` and `src/app/api/reader/route.ts`**

Create `src/lib/reader-extractor.ts`:

```typescript
import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
import DOMPurify from 'isomorphic-dompurify';
import { ReaderArticle } from '@/types/hn';

export function detectSpecialUrlFallback(url: string): Partial<ReaderArticle> | null {
  try {
    const parsed = new URL(url);

    if (/\.pdf($|\?)/i.test(parsed.pathname)) {
      return {
        url,
        title: parsed.pathname.split('/').pop() || 'PDF Document',
        fallbackType: 'pdf',
        contentHtml: '',
        textContent: '',
        readingTimeMinutes: 1,
      };
    }

    if (parsed.hostname.includes('youtube.com') || parsed.hostname === 'youtu.be') {
      const videoId =
        parsed.hostname === 'youtu.be'
          ? parsed.pathname.slice(1)
          : parsed.searchParams.get('v');
      if (videoId) {
        return {
          url,
          title: 'YouTube Video',
          fallbackType: 'youtube',
          youtubeVideoId: videoId,
          contentHtml: '',
          textContent: '',
          readingTimeMinutes: 1,
        };
      }
    }

    if (parsed.hostname === 'github.com') {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return {
          url,
          title: `${parts[0]}/${parts[1]}`,
          fallbackType: 'github',
          githubRepo: { owner: parts[0], repo: parts[1] },
          contentHtml: '',
          textContent: '',
          readingTimeMinutes: 1,
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function extractArticleFromHtml(rawHtml: string, url: string): ReaderArticle {
  const { document } = parseHTML(rawHtml);

  // Resolve relative links and images
  const baseElements = document.querySelectorAll('a[href], img[src]');
  baseElements.forEach((el: Element) => {
    const href = el.getAttribute('href');
    if (href && !href.startsWith('#')) {
      try {
        el.setAttribute('href', new URL(href, url).toString());
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      } catch {
        // leave as is
      }
    }
    const src = el.getAttribute('src');
    if (src) {
      try {
        el.setAttribute('src', new URL(src, url).toString());
      } catch {
        // leave as is
      }
    }
  });

  const reader = new Readability(document as unknown as Document);
  const parsed = reader.parse();

  if (!parsed || !parsed.content) {
    return {
      url,
      title: document.title || url,
      contentHtml: '',
      textContent: '',
      readingTimeMinutes: 1,
      fallbackType: 'blocked',
    };
  }

  const sanitizedHtml = DOMPurify.sanitize(parsed.content, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li',
      'blockquote', 'pre', 'code', 'img', 'figure', 'figcaption',
      'strong', 'em', 'b', 'i', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'br'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel'],
  });

  const wordCount = (parsed.textContent || '').trim().split(/\s+/).filter(Boolean).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 220));

  return {
    url,
    title: parsed.title || document.title || url,
    byline: parsed.byline || null,
    siteName: parsed.siteName || null,
    contentHtml: sanitizedHtml,
    textContent: parsed.textContent || '',
    excerpt: parsed.excerpt || null,
    readingTimeMinutes,
  };
}
```

Create `src/app/api/reader/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { detectSpecialUrlFallback, extractArticleFromHtml } from '@/lib/reader-extractor';

function isSafePublicUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.endsWith('.local')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get('url');
  if (!targetUrl || !isSafePublicUrl(targetUrl)) {
    return NextResponse.json({ error: 'Invalid or unsupported URL' }, { status: 400 });
  }

  const special = detectSpecialUrlFallback(targetUrl);
  if (special) {
    return NextResponse.json(special);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7500);

  try {
    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HNRevampedReader/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({
        url: targetUrl,
        title: targetUrl,
        contentHtml: '',
        textContent: '',
        readingTimeMinutes: 1,
        fallbackType: 'blocked',
      });
    }

    const html = await res.text();
    const article = extractArticleFromHtml(html, targetUrl);
    return NextResponse.json(article);
  } catch {
    clearTimeout(timeout);
    return NextResponse.json({
      url: targetUrl,
      title: targetUrl,
      contentHtml: '',
      textContent: '',
      readingTimeMinutes: 1,
      fallbackType: 'blocked',
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/lib/__tests__/reader-extractor.test.ts`
Expected: PASS (2 passed).

---

### Task 5: Global Styles, Semantic Link CSS, Material Symbols & Structured Story Pill Row

**Files:**
- Create: `src/app/globals.css`
- Create: `src/components/feed/StoryPillRow.tsx`
- Create: `src/components/feed/StoryFeedPane.tsx`
- Create: `src/components/feed/__tests__/StoryPillRow.test.tsx`

**Interfaces:**
- Consumes: `HNStory`, `StoryBadge` from `src/types/hn.ts`
- Produces:
  - `StoryPillRow({ story, isSelected, isRead, newCommentsDelta, isBookmarked, onSelect, onToggleBookmark })`
  - `StoryFeedPane({ stories, loading, selectedStoryId, readHistory, bookmarkedIds, onSelectStory, onToggleBookmark, onLoadMore, hasMore })`

- [ ] **Step 1: Write failing test for `StoryPillRow`**

Create `src/components/feed/__tests__/StoryPillRow.test.tsx`:

```tsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StoryPillRow } from '../StoryPillRow';
import { HNStory } from '@/types/hn';

const mockStory: HNStory = {
  id: 42001,
  title: 'Show HN: Zed 1.0 – High-performance multiplayer code editor in Rust',
  cleanTitle: 'Zed 1.0 – High-performance multiplayer code editor in Rust',
  url: 'https://zed.dev/blog/zed-1-0',
  domain: 'zed.dev',
  points: 428,
  user: 'nathansobo',
  time: Math.floor(Date.now() / 1000) - 3600,
  commentsCount: 214,
  badges: [{ type: 'show', label: 'Show HN', icon: 'rocket_launch' }],
  type: 'story',
};

describe('StoryPillRow Component', () => {
  it('renders score pill, smart badges, clean title, domain, and +N new comments badge', () => {
    const onSelect = vi.fn();
    const onToggleBookmark = vi.fn();

    render(
      <StoryPillRow
        story={mockStory}
        index={1}
        isSelected={false}
        isRead={true}
        newCommentsDelta={18}
        isBookmarked={false}
        onSelect={onSelect}
        onToggleBookmark={onToggleBookmark}
      />
    );

    expect(screen.getByText('428')).toBeInTheDocument();
    expect(screen.getByText('Show HN')).toBeInTheDocument();
    expect(
      screen.getByText('Zed 1.0 – High-performance multiplayer code editor in Rust')
    ).toBeInTheDocument();
    expect(screen.getByText('zed.dev')).toBeInTheDocument();
    expect(screen.getByText('+18 new')).toBeInTheDocument();
    expect(screen.getByText('214')).toBeInTheDocument();

    fireEvent.click(
      screen.getByText('Zed 1.0 – High-performance multiplayer code editor in Rust')
    );
    expect(onSelect).toHaveBeenCalledWith(mockStory);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/components/feed/__tests__/StoryPillRow.test.tsx`
Expected: FAIL with `../StoryPillRow` not found.

- [ ] **Step 3: Implement `src/app/globals.css`, `src/components/feed/StoryPillRow.tsx`, and `src/components/feed/StoryFeedPane.tsx`**

Create `src/app/globals.css`:

```css
@import "tailwindcss";

:root {
  --bg-canvas: #0C0C0E;
  --bg-surface-1: #16171B;
  --bg-surface-2: #202228;
  --bg-surface-active: #261C16;
  --text-primary: #F3F4F6;
  --text-secondary: #D1D5DB;
  --text-muted: #9CA3AF;
  --accent: #FB923C;
  --link-unvisited: #60A5FA;
  --link-visited: #A78BFA;
  --border-subtle: #262932;
  --reader-font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
  --reader-font-size: 16px;
  --reader-line-height: 1.65;
  --reader-line-width: 65ch;
}

body {
  background-color: var(--bg-canvas);
  color: var(--text-primary);
  font-family: var(--reader-font-family);
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
}

.material-symbols-rounded {
  font-family: 'Material Symbols Rounded';
  font-weight: normal;
  font-style: normal;
  font-size: 20px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  font-variation-settings: 'FILL' 0, 'wght' 450, 'GRAD' 0, 'opsz' 20;
  user-select: none;
}

.material-symbols-rounded.filled {
  font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20;
}

/* Thoughtful Semantic Link Rules for Comments & Article Reader */
.hn-prose {
  font-family: var(--reader-font-family);
  font-size: var(--reader-font-size);
  line-height: var(--reader-line-height);
  max-width: var(--reader-line-width);
  color: var(--text-primary);
}

.hn-prose p {
  margin-bottom: 0.85em;
}

.hn-prose p:last-child {
  margin-bottom: 0;
}

.hn-prose a.hn-external-link,
.hn-article-body a {
  color: var(--link-unvisited);
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--link-unvisited) 40%, transparent);
  text-underline-offset: 3px;
  font-weight: 500;
  transition: color 0.15s ease, text-decoration-color 0.15s ease;
  word-break: break-word;
}

.hn-prose a.hn-external-link:visited,
.hn-article-body a:visited {
  color: var(--link-visited);
  text-decoration-color: color-mix(in srgb, var(--link-visited) 40%, transparent);
}

.hn-prose a.hn-external-link:hover,
.hn-article-body a:hover {
  text-decoration-color: currentColor;
}

.hn-prose a.hn-internal-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background-color: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--accent);
  padding: 1px 7px;
  border-radius: 6px;
  font-size: 0.88em;
  font-weight: 600;
  text-decoration: none;
}

.hn-prose .hn-link-icon {
  font-size: 13px;
  margin-left: 2px;
  vertical-align: middle;
}

.hn-prose pre,
.hn-article-body pre {
  background-color: var(--bg-surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 12px 16px;
  overflow-x: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.88em;
  margin: 0.9em 0;
}

.hn-prose code,
.hn-article-body code {
  font-family: 'JetBrains Mono', monospace;
  background-color: var(--bg-surface-2);
  padding: 2px 5px;
  border-radius: 5px;
  font-size: 0.88em;
}

.hn-prose blockquote,
.hn-article-body blockquote {
  border-left: 3px solid var(--accent);
  padding-left: 14px;
  margin: 0.8em 0;
  color: var(--text-secondary);
  font-style: italic;
}
```

Create `src/components/feed/StoryPillRow.tsx`:

```tsx
'use client';

import React from 'react';
import { HNStory } from '@/types/hn';

export function formatRelativeTime(unixSeconds: number): string {
  const diffSec = Math.max(1, Math.floor(Date.now() / 1000) - unixSeconds);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

interface StoryPillRowProps {
  story: HNStory;
  index: number;
  isSelected: boolean;
  isRead: boolean;
  newCommentsDelta: number;
  isBookmarked: boolean;
  onSelect: (story: HNStory) => void;
  onToggleBookmark: (story: HNStory, e: React.MouseEvent) => void;
}

export const StoryPillRow: React.FC<StoryPillRowProps> = ({
  story,
  index,
  isSelected,
  isRead,
  newCommentsDelta,
  isBookmarked,
  onSelect,
  onToggleBookmark,
}) => {
  const isHot = story.points >= 250;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect(story)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(story);
        }
      }}
      style={{
        backgroundColor: isSelected ? 'var(--bg-surface-active)' : 'var(--bg-surface-1)',
        borderColor: isSelected ? 'var(--accent)' : 'var(--border-subtle)',
        opacity: isRead && !isSelected ? 0.68 : 1,
      }}
      className="group relative flex items-center gap-4 rounded-2xl border p-4 transition-all duration-150 cursor-pointer hover:brightness-105"
    >
      {/* Left Zone: Score & Heat Pill */}
      <div
        style={{
          backgroundColor: isHot
            ? 'color-mix(in srgb, var(--accent) 18%, transparent)'
            : 'var(--bg-surface-2)',
          color: isRead && !isSelected ? 'var(--text-muted)' : 'var(--accent)',
        }}
        className="flex flex-col items-center justify-center min-w-[52px] h-[54px] rounded-xl font-bold shrink-0"
      >
        <span className="material-symbols-rounded text-[18px]">
          {isRead && !isSelected ? 'check' : 'keyboard_arrow_up'}
        </span>
        <span className="text-[13px] leading-tight">{story.points}</span>
      </div>

      {/* Center Zone: Badges, Clean Title & Thoughtful Metadata */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2 mb-1">
          <span
            style={{ color: 'var(--text-muted)' }}
            className="text-[11px] font-mono font-semibold"
          >
            #{index}
          </span>

          {story.badges.map((badge) => (
            <span
              key={badge.type}
              style={{
                backgroundColor: 'color-mix(in srgb, var(--link-unvisited) 15%, transparent)',
                color: 'var(--link-unvisited)',
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase"
            >
              <span className="material-symbols-rounded text-[13px]">{badge.icon}</span>
              {badge.label}
            </span>
          ))}

          {story.domain && (
            <span
              style={{ color: 'var(--text-secondary)' }}
              className="inline-flex items-center gap-1 text-[12.5px] font-medium truncate"
            >
              <span
                style={{ color: 'var(--link-unvisited)' }}
                className="material-symbols-rounded text-[14px]"
              >
                language
              </span>
              {story.domain}
            </span>
          )}
        </div>

        <h3
          style={{ color: 'var(--text-primary)' }}
          className="text-[17px] font-semibold leading-snug tracking-tight"
        >
          {story.cleanTitle}
        </h3>

        <div
          style={{ color: 'var(--text-muted)' }}
          className="flex items-center flex-wrap gap-3 mt-2 text-[12.5px]"
        >
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-rounded text-[14px]">person</span>
            <strong style={{ color: 'var(--text-secondary)' }} className="font-medium">
              {story.user}
            </strong>
          </span>

          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-rounded text-[14px]">schedule</span>
            {formatRelativeTime(story.time)}
          </span>

          {newCommentsDelta > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400">
              +{newCommentsDelta} new
            </span>
          )}
        </div>
      </div>

      {/* Right Zone: Bookmark & Comment Count Pill */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark story'}
          onClick={(e) => onToggleBookmark(story, e)}
          style={{ color: isBookmarked ? 'var(--accent)' : 'var(--text-muted)' }}
          className="p-2 rounded-xl hover:bg-white/5 transition-colors"
        >
          <span className={`material-symbols-rounded ${isBookmarked ? 'filled' : ''}`}>
            bookmark
          </span>
        </button>

        <div
          style={{
            backgroundColor: 'var(--bg-surface-2)',
            color: 'var(--text-primary)',
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold"
        >
          <span
            style={{ color: 'var(--text-muted)' }}
            className="material-symbols-rounded text-[17px]"
          >
            forum
          </span>
          <span>{story.commentsCount}</span>
        </div>
      </div>
    </article>
  );
};
```

Create `src/components/feed/StoryFeedPane.tsx`:

```tsx
'use client';

import React from 'react';
import { HNStory, ReadHistoryEntry } from '@/types/hn';
import { getNewCommentsDelta } from '@/lib/storage';
import { StoryPillRow } from './StoryPillRow';

interface StoryFeedPaneProps {
  stories: HNStory[];
  loading: boolean;
  selectedStoryId: number | null;
  readHistory: Record<number, ReadHistoryEntry>;
  bookmarkedIds: Set<number>;
  onSelectStory: (story: HNStory) => void;
  onToggleBookmark: (story: HNStory, e: React.MouseEvent) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export const StoryFeedPane: React.FC<StoryFeedPaneProps> = ({
  stories,
  loading,
  selectedStoryId,
  readHistory,
  bookmarkedIds,
  onSelectStory,
  onToggleBookmark,
  onLoadMore,
  hasMore,
}) => {
  if (loading && stories.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{ backgroundColor: 'var(--bg-surface-1)', borderColor: 'var(--border-subtle)' }}
            className="h-24 rounded-2xl border animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div
        style={{ color: 'var(--text-muted)' }}
        className="flex flex-col items-center justify-center py-20 px-6 text-center gap-2"
      >
        <span className="material-symbols-rounded text-[40px]">inbox</span>
        <p className="text-base font-medium">No stories match your current view or filters.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {stories.map((story, idx) => (
        <StoryPillRow
          key={story.id}
          story={story}
          index={idx + 1}
          isSelected={selectedStoryId === story.id}
          isRead={Boolean(readHistory[story.id])}
          newCommentsDelta={getNewCommentsDelta(story.id, story.commentsCount, readHistory)}
          isBookmarked={bookmarkedIds.has(story.id)}
          onSelect={onSelectStory}
          onToggleBookmark={onToggleBookmark}
        />
      ))}

      {hasMore && onLoadMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loading}
          style={{
            backgroundColor: 'var(--bg-surface-1)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
          className="mt-2 py-3 px-6 rounded-2xl border font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-110 transition cursor-pointer"
        >
          <span className="material-symbols-rounded">expand_more</span>
          {loading ? 'Loading more stories...' : 'Load More Stories'}
        </button>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/components/feed/__tests__/StoryPillRow.test.tsx`
Expected: PASS (1 passed).

---

### Task 6: Color-Coded Comment Tree, One-Click Bar Collapse & Detail Reader Pane

**Files:**
- Create: `src/components/detail/CommentNode.tsx`
- Create: `src/components/detail/CommentTree.tsx`
- Create: `src/components/detail/ArticleReaderView.tsx`
- Create: `src/components/detail/StoryDetailPane.tsx`
- Create: `src/components/detail/__tests__/CommentTree.test.tsx`

**Interfaces:**
- Consumes: `HNComment`, `HNStoryWithComments`, `ReaderArticle`, `DetailTab` from `src/types/hn.ts`, `formatCommentHtml` from `src/lib/html-sanitizer.ts`
- Produces:
  - `CommentNode` with 6-level cycling color guide bars (`#F97316`, `#3B82F6`, `#10B981`, `#8B5CF6`, `#F59E0B`, `#06B6D4`) and 1-click vertical bar collapse
  - `CommentTree` with "Collapse All Replies" toggle, in-thread keyword/author search filter, and root-comment jumper
  - `ArticleReaderView` with extracted clean HTML and YouTube/GitHub/PDF fallbacks
  - `StoryDetailPane` combining story header, Discussion tab, and Article Reader tab

- [ ] **Step 1: Write failing test for `CommentTree` (1-click bar collapse, Collapse All Replies, and OP badge)**

Create `src/components/detail/__tests__/CommentTree.test.tsx`:

```tsx
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CommentTree } from '../CommentTree';
import { HNComment } from '@/types/hn';

const sampleComments: HNComment[] = [
  {
    id: 901,
    user: 'tptacek',
    time: 1700000000,
    text: '<p>How does glyph caching work on Wayland?</p>',
    totalDescendants: 1,
    children: [
      {
        id: 902,
        user: 'nathansobo',
        time: 1700000200,
        text: '<p>We cache per-monitor DPI in blade.</p>',
        totalDescendants: 0,
        children: [],
      },
    ],
  },
];

describe('CommentTree & Color-Coded Collapse', () => {
  it('renders nested comments, highlights OP, and supports collapsing all replies', () => {
    render(<CommentTree comments={sampleComments} storyAuthor="nathansobo" />);

    expect(screen.getByText('tptacek')).toBeInTheDocument();
    expect(screen.getByText('nathansobo')).toBeInTheDocument();
    expect(screen.getByText('OP')).toBeInTheDocument();
    expect(screen.getByText(/We cache per-monitor DPI/)).toBeInTheDocument();

    // Click "Collapse Replies" button to view root comments only
    const collapseRepliesBtn = screen.getByRole('button', { name: /Collapse Replies/i });
    fireEvent.click(collapseRepliesBtn);

    expect(screen.queryByText(/We cache per-monitor DPI/)).not.toBeInTheDocument();
    expect(screen.getByText(/How does glyph caching work/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/components/detail/__tests__/CommentTree.test.tsx`
Expected: FAIL with `../CommentTree` not found.

- [ ] **Step 3: Implement `CommentNode.tsx`, `CommentTree.tsx`, `ArticleReaderView.tsx`, and `StoryDetailPane.tsx`**

Create `src/components/detail/CommentNode.tsx`:

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { HNComment } from '@/types/hn';
import { formatCommentHtml } from '@/lib/html-sanitizer';
import { formatRelativeTime } from '@/components/feed/StoryPillRow';

const DEPTH_COLORS = [
  '#F97316', // Depth 0: Orange
  '#3B82F6', // Depth 1: Blue
  '#10B981', // Depth 2: Emerald
  '#8B5CF6', // Depth 3: Violet
  '#F59E0B', // Depth 4: Amber
  '#06B6D4', // Depth 5+: Cyan
];

interface CommentNodeProps {
  comment: HNComment;
  depth: number;
  storyAuthor: string;
  collapseAllReplies: boolean;
  onInternalHnLinkClick?: (storyId: number) => void;
}

export const CommentNode: React.FC<CommentNodeProps> = ({
  comment,
  depth,
  storyAuthor,
  collapseAllReplies,
  onInternalHnLinkClick,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hideChildrenOnly, setHideChildrenOnly] = useState(false);

  useEffect(() => {
    setHideChildrenOnly(collapseAllReplies);
  }, [collapseAllReplies]);

  const guideColor = DEPTH_COLORS[depth % DEPTH_COLORS.length];
  const isOP = comment.user === storyAuthor;

  const plainSnippet = comment.text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90);

  if (isCollapsed) {
    return (
      <div
        onClick={() => setIsCollapsed(false)}
        style={{
          borderLeft: `3px solid ${guideColor}`,
          backgroundColor: 'var(--bg-surface-2)',
          color: 'var(--text-muted)',
        }}
        className="my-2 py-2 px-3.5 rounded-r-xl flex items-center justify-between gap-3 cursor-pointer hover:brightness-110 transition text-[13px]"
      >
        <div className="truncate">
          <strong style={{ color: 'var(--text-secondary)' }}>{comment.user}</strong>
          <span className="mx-1.5">•</span>
          <span>{formatRelativeTime(comment.time)}</span>
          <span className="mx-2 opacity-75 italic">&ldquo;{plainSnippet}...&rdquo;</span>
        </div>
        <span
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent) 16%, transparent)',
            color: 'var(--accent)',
          }}
          className="px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0"
        >
          +{1 + comment.totalDescendants}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${depth > 0 ? 'mt-3.5' : 'mt-5'}`}>
      <div className="flex">
        {/* Interactive Full-Height Color Guide Bar */}
        <button
          type="button"
          aria-label={`Collapse comment thread by ${comment.user}`}
          onClick={() => setIsCollapsed(true)}
          className="group/bar relative flex justify-center w-4 shrink-0 cursor-pointer focus:outline-none"
        >
          <span
            style={{ backgroundColor: guideColor }}
            className="w-[3px] h-full rounded-full opacity-80 group-hover/bar:w-[5px] group-hover/bar:opacity-100 transition-all"
          />
        </button>

        <div className="flex-1 min-w-0 pl-2">
          {/* Comment Header */}
          <div className="flex items-center gap-2 text-[13px] mb-1.5">
            <span
              style={{ color: isOP ? 'var(--accent)' : 'var(--text-primary)' }}
              className="font-semibold"
            >
              {comment.user}
            </span>

            {isOP && (
              <span
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent) 20%, transparent)',
                  color: 'var(--accent)',
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
              >
                OP
              </span>
            )}

            <span style={{ color: 'var(--text-muted)' }}>• {formatRelativeTime(comment.time)}</span>

            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              style={{ color: 'var(--text-muted)' }}
              className="ml-auto text-[11px] px-2 py-0.5 rounded hover:bg-white/5"
            >
              [–{comment.totalDescendants > 0 ? ` ${comment.totalDescendants}` : ''}]
            </button>
          </div>

          {/* Comment Prose Body */}
          <div
            className="hn-prose"
            onClick={(e) => {
              const target = (e.target as HTMLElement).closest('a[data-hn-item-id]');
              if (target && onInternalHnLinkClick) {
                e.preventDefault();
                const id = Number(target.getAttribute('data-hn-item-id'));
                if (id) onInternalHnLinkClick(id);
              }
            }}
            dangerouslySetInnerHTML={{ __html: formatCommentHtml(comment.text) }}
          />

          {/* Nested Replies or Collapsed Replies Pill */}
          {comment.children.length > 0 && (
            <div>
              {hideChildrenOnly ? (
                <button
                  type="button"
                  onClick={() => setHideChildrenOnly(false)}
                  style={{
                    backgroundColor: 'var(--bg-surface-2)',
                    color: 'var(--accent)',
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold cursor-pointer hover:brightness-110"
                >
                  <span className="material-symbols-rounded text-[15px]">unfold_more</span>
                  Show {comment.totalDescendants}{' '}
                  {comment.totalDescendants === 1 ? 'reply' : 'replies'}
                </button>
              ) : (
                comment.children.map((child) => (
                  <CommentNode
                    key={child.id}
                    comment={child}
                    depth={depth + 1}
                    storyAuthor={storyAuthor}
                    collapseAllReplies={false}
                    onInternalHnLinkClick={onInternalHnLinkClick}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

Create `src/components/detail/CommentTree.tsx`:

```tsx
'use client';

import React, { useState, useMemo } from 'react';
import { HNComment } from '@/types/hn';
import { CommentNode } from './CommentNode';

interface CommentTreeProps {
  comments: HNComment[];
  storyAuthor: string;
  onInternalHnLinkClick?: (storyId: number) => void;
}

function filterCommentNodes(nodes: HNComment[], query: string): HNComment[] {
  if (!query.trim()) return nodes;
  const q = query.toLowerCase();
  const filtered: HNComment[] = [];

  for (const node of nodes) {
    const childMatches = filterCommentNodes(node.children, query);
    const selfMatches =
      node.user.toLowerCase().includes(q) || node.text.toLowerCase().includes(q);
    if (selfMatches || childMatches.length > 0) {
      filtered.push({
        ...node,
        children: childMatches,
      });
    }
  }
  return filtered;
}

export const CommentTree: React.FC<CommentTreeProps> = ({
  comments,
  storyAuthor,
  onInternalHnLinkClick,
}) => {
  const [collapseAllReplies, setCollapseAllReplies] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const visibleComments = useMemo(
    () => filterCommentNodes(comments, searchQuery),
    [comments, searchQuery]
  );

  return (
    <div>
      {/* Thread Power Toolbar */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface-1)',
          borderColor: 'var(--border-subtle)',
        }}
        className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border mb-4"
      >
        <div
          style={{
            backgroundColor: 'var(--bg-surface-2)',
            borderColor: 'var(--border-subtle)',
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border flex-1 min-w-[200px]"
        >
          <span
            style={{ color: 'var(--text-muted)' }}
            className="material-symbols-rounded text-[18px]"
          >
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter thread by keyword or @author..."
            style={{ color: 'var(--text-primary)' }}
            className="bg-transparent text-sm focus:outline-none w-full"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ color: 'var(--text-muted)' }}
              className="material-symbols-rounded text-[16px]"
            >
              close
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCollapseAllReplies((prev) => !prev)}
          style={{
            backgroundColor: collapseAllReplies
              ? 'color-mix(in srgb, var(--accent) 18%, transparent)'
              : 'var(--bg-surface-2)',
            color: collapseAllReplies ? 'var(--accent)' : 'var(--text-secondary)',
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition"
        >
          <span className="material-symbols-rounded text-[16px]">
            {collapseAllReplies ? 'unfold_more' : 'unfold_less'}
          </span>
          {collapseAllReplies ? 'Expand Replies' : 'Collapse Replies'}
        </button>
      </div>

      {/* Root Comment Stream */}
      {visibleComments.length === 0 ? (
        <div
          style={{ color: 'var(--text-muted)' }}
          className="py-12 text-center text-sm"
        >
          No comments match your filter.
        </div>
      ) : (
        visibleComments.map((comment) => (
          <CommentNode
            key={comment.id}
            comment={comment}
            depth={0}
            storyAuthor={storyAuthor}
            collapseAllReplies={collapseAllReplies}
            onInternalHnLinkClick={onInternalHnLinkClick}
          />
        ))
      )}
    </div>
  );
};
```

Create `src/components/detail/ArticleReaderView.tsx`:

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { ReaderArticle } from '@/types/hn';

interface ArticleReaderViewProps {
  url?: string;
  storyTitle: string;
}

export const ArticleReaderView: React.FC<ArticleReaderViewProps> = ({ url, storyTitle }) => {
  const [article, setArticle] = useState<ReaderArticle | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) return;
    let active = true;
    setLoading(true);
    fetch(`/api/reader?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          setArticle(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setArticle({
            url,
            title: storyTitle,
            contentHtml: '',
            textContent: '',
            readingTimeMinutes: 1,
            fallbackType: 'blocked',
          });
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [url, storyTitle]);

  if (!url) {
    return (
      <div
        style={{ color: 'var(--text-muted)' }}
        className="py-16 text-center flex flex-col items-center gap-2"
      >
        <span className="material-symbols-rounded text-[36px]">forum</span>
        <p>This is a text-only Hacker News discussion without an external URL.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 py-6">
        <div
          style={{ backgroundColor: 'var(--bg-surface-2)' }}
          className="h-8 w-2/3 rounded-xl animate-pulse"
        />
        <div
          style={{ backgroundColor: 'var(--bg-surface-1)' }}
          className="h-64 w-full rounded-2xl animate-pulse"
        />
      </div>
    );
  }

  if (article?.fallbackType === 'youtube' && article.youtubeVideoId) {
    return (
      <div className="py-4">
        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${article.youtubeVideoId}`}
            title={storyTitle}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  if (!article || article.fallbackType || !article.contentHtml) {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-surface-1)',
          borderColor: 'var(--border-subtle)',
        }}
        className="p-8 rounded-2xl border text-center flex flex-col items-center gap-4 my-4"
      >
        <span
          style={{ color: 'var(--accent)' }}
          className="material-symbols-rounded text-[40px]"
        >
          open_in_new
        </span>
        <div>
          <h4 className="text-lg font-semibold mb-1">{storyTitle}</h4>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm max-w-md">
            This resource ({article?.fallbackType?.toUpperCase() || 'External Site'}) is best
            viewed directly in its original tab.
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm shadow hover:brightness-110 transition"
        >
          <span>Open Original Article</span>
          <span className="material-symbols-rounded text-[18px]">north_east</span>
        </a>
      </div>
    );
  }

  return (
    <article
      style={{
        backgroundColor: 'var(--bg-surface-1)',
        borderColor: 'var(--border-subtle)',
      }}
      className="p-6 md:p-8 rounded-2xl border my-2"
    >
      <div
        style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}
        className="flex flex-wrap items-center gap-4 text-xs pb-4 mb-6 border-b"
      >
        <span className="inline-flex items-center gap-1">
          <span className="material-symbols-rounded text-[16px]">schedule</span>
          {article.readingTimeMinutes} min read
        </span>
        {article.byline && <span>By {article.byline}</span>}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--link-unvisited)' }}
          className="ml-auto inline-flex items-center gap-1 font-semibold"
        >
          Original URL
          <span className="material-symbols-rounded text-[15px]">north_east</span>
        </a>
      </div>

      <div
        className="hn-prose hn-article-body space-y-4"
        dangerouslySetInnerHTML={{ __html: article.contentHtml }}
      />
    </article>
  );
};
```

Create `src/components/detail/StoryDetailPane.tsx`:

```tsx
'use client';

import React from 'react';
import { DetailTab, HNStoryWithComments } from '@/types/hn';
import { formatCommentHtml } from '@/lib/html-sanitizer';
import { formatRelativeTime } from '@/components/feed/StoryPillRow';
import { CommentTree } from './CommentTree';
import { ArticleReaderView } from './ArticleReaderView';

interface StoryDetailPaneProps {
  story: HNStoryWithComments | null;
  loading: boolean;
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onInternalHnLinkClick: (storyId: number) => void;
}

export const StoryDetailPane: React.FC<StoryDetailPaneProps> = ({
  story,
  loading,
  activeTab,
  onTabChange,
  isBookmarked,
  onToggleBookmark,
  onInternalHnLinkClick,
}) => {
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div
          style={{ backgroundColor: 'var(--bg-surface-1)' }}
          className="h-10 w-3/4 rounded-xl animate-pulse"
        />
        <div
          style={{ backgroundColor: 'var(--bg-surface-1)' }}
          className="h-32 w-full rounded-2xl animate-pulse"
        />
        <div
          style={{ backgroundColor: 'var(--bg-surface-1)' }}
          className="h-64 w-full rounded-2xl animate-pulse"
        />
      </div>
    );
  }

  if (!story) {
    return (
      <div
        style={{ color: 'var(--text-muted)' }}
        className="h-full flex flex-col items-center justify-center p-12 text-center gap-3"
      >
        <span className="material-symbols-rounded text-[48px] opacity-60">newspaper</span>
        <h3 style={{ color: 'var(--text-secondary)' }} className="text-lg font-semibold">
          Select a story to start reading
        </h3>
        <p className="text-sm max-w-sm">
          Use <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">j</kbd> /{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">k</kbd> to navigate
          stories, <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">r</kbd> for
          Reader View, or <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">z</kbd>{' '}
          for Zen Mode.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-7">
      {/* Top Action & Mode Bar */}
      <div
        style={{ borderColor: 'var(--border-subtle)' }}
        className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b"
      >
        <div
          style={{ backgroundColor: 'var(--bg-surface-1)', borderColor: 'var(--border-subtle)' }}
          className="inline-flex p-1 rounded-xl border"
        >
          <button
            type="button"
            onClick={() => onTabChange('comments')}
            style={{
              backgroundColor: activeTab === 'comments' ? 'var(--bg-surface-2)' : 'transparent',
              color: activeTab === 'comments' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition"
          >
            <span className="material-symbols-rounded text-[16px]">forum</span>
            Discussion ({story.commentsCount})
          </button>

          {story.url && (
            <button
              type="button"
              onClick={() => onTabChange('reader')}
              style={{
                backgroundColor: activeTab === 'reader' ? 'var(--bg-surface-2)' : 'transparent',
                color: activeTab === 'reader' ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition"
            >
              <span className="material-symbols-rounded text-[16px]">article</span>
              Reader View
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleBookmark}
            style={{
              backgroundColor: 'var(--bg-surface-1)',
              borderColor: 'var(--border-subtle)',
              color: isBookmarked ? 'var(--accent)' : 'var(--text-secondary)',
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer"
          >
            <span className={`material-symbols-rounded text-[16px] ${isBookmarked ? 'filled' : ''}`}>
              bookmark
            </span>
            {isBookmarked ? 'Saved' : 'Save'}
          </button>

          {story.url && (
            <a
              href={story.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: 'var(--bg-surface-1)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--link-unvisited)',
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold"
            >
              <span>Open Site</span>
              <span className="material-symbols-rounded text-[15px]">north_east</span>
            </a>
          )}
        </div>
      </div>

      {/* Story Title & Metadata Header */}
      <header className="mb-6">
        <h1
          style={{ color: 'var(--text-primary)' }}
          className="text-xl md:text-2xl font-bold leading-snug tracking-tight"
        >
          {story.cleanTitle}
        </h1>

        <div
          style={{ color: 'var(--text-muted)' }}
          className="flex flex-wrap items-center gap-3 mt-2.5 text-xs"
        >
          <span style={{ color: 'var(--accent)' }} className="font-bold">
            ▲ {story.points} points
          </span>
          <span>•</span>
          <span>by {story.user}</span>
          <span>•</span>
          <span>{formatRelativeTime(story.time)}</span>
          {story.domain && (
            <>
              <span>•</span>
              <span style={{ color: 'var(--link-unvisited)' }} className="font-medium">
                {story.domain}
              </span>
            </>
          )}
        </div>

        {story.text && (
          <div
            style={{
              backgroundColor: 'var(--bg-surface-1)',
              borderColor: 'var(--border-subtle)',
            }}
            className="mt-4 p-4 rounded-2xl border hn-prose"
            dangerouslySetInnerHTML={{ __html: formatCommentHtml(story.text) }}
          />
        )}
      </header>

      {/* Active Tab Content */}
      {activeTab === 'reader' ? (
        <ArticleReaderView url={story.url} storyTitle={story.cleanTitle} />
      ) : (
        <CommentTree
          comments={story.comments}
          storyAuthor={story.user}
          onInternalHnLinkClick={onInternalHnLinkClick}
        />
      )}
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/components/detail/__tests__/CommentTree.test.tsx`
Expected: PASS (1 passed).

---

### Task 7: Multi-Theme & Typography Studio Modal, `⌘K` Command Palette & Time-Travel Popover

**Files:**
- Create: `src/components/modals/AppearanceModal.tsx`
- Create: `src/components/modals/CommandPaletteModal.tsx`
- Create: `src/components/modals/TimeTravelPopover.tsx`
- Create: `src/components/modals/ShortcutsModal.tsx`

**Interfaces:**
- Consumes: `THEMES`, `FONT_FAMILIES` from `src/lib/themes.ts`, `searchHN` from `src/lib/hn-api.ts`, `UserPreferences`, `HNStory` from `src/types/hn.ts`
- Produces:
  - `AppearanceModal` for live switching between all 11 E-Reader & Code themes, 4 font families, font size (`14px–22px`), line width (`55ch–Full`), and muted keywords/domains
  - `CommandPaletteModal` (`⌘K` / `/`) for instant Algolia search and quick commands
  - `TimeTravelPopover` for browsing historical Front Pages (Yesterday, Last Week, Last Month, 1 Year Ago, Custom Date)
  - `ShortcutsModal` (`?`) for displaying the Vim keyboard shortcut reference

- [ ] **Step 1: Implement `AppearanceModal.tsx`, `CommandPaletteModal.tsx`, `TimeTravelPopover.tsx`, and `ShortcutsModal.tsx`**

Create `src/components/modals/AppearanceModal.tsx`:

```tsx
'use client';

import React, { useState } from 'react';
import { FontFamilyId, LineWidthOption, ThemeId, UserPreferences } from '@/types/hn';
import { FONT_FAMILIES, THEMES } from '@/lib/themes';

interface AppearanceModalProps {
  isOpen: boolean;
  preferences: UserPreferences;
  onUpdate: (prefs: UserPreferences) => void;
  onClose: () => void;
}

export const AppearanceModal: React.FC<AppearanceModalProps> = ({
  isOpen,
  preferences,
  onUpdate,
  onClose,
}) => {
  const [keywordInput, setKeywordInput] = useState('');

  if (!isOpen) return null;

  const readerThemes = Object.values(THEMES).filter((t) => t.category === 'reader');
  const codeThemes = Object.values(THEMES).filter((t) => t.category === 'code');

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-surface-1)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl border p-6 shadow-2xl space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--accent)' }} className="material-symbols-rounded">
              palette
            </span>
            <h2 className="text-lg font-bold">Theme, Typography &amp; Filter Studio</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 cursor-pointer"
          >
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        {/* E-Book & Reader Themes */}
        <div>
          <h3
            style={{ color: 'var(--text-muted)' }}
            className="text-xs font-bold uppercase tracking-wider mb-3"
          >
            E-Book &amp; Editorial Reader Themes (Kindle / Instapaper / Material)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {readerThemes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onUpdate({ ...preferences, themeId: t.id as ThemeId })}
                style={{
                  backgroundColor: t.colors.bgCanvas,
                  color: t.colors.textPrimary,
                  borderColor:
                    preferences.themeId === t.id ? t.colors.accent : t.colors.borderSubtle,
                }}
                className="p-3 rounded-2xl border-2 text-left cursor-pointer transition hover:scale-[1.01]"
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>{t.name}</span>
                  {preferences.themeId === t.id && (
                    <span style={{ color: t.colors.accent }}>●</span>
                  )}
                </div>
                <div style={{ color: t.colors.textMuted }} className="text-[10px] mt-1">
                  {t.inspiration}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Code Editor Themes */}
        <div>
          <h3
            style={{ color: 'var(--text-muted)' }}
            className="text-xs font-bold uppercase tracking-wider mb-3"
          >
            Developer &amp; Code Editor Themes
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {codeThemes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onUpdate({ ...preferences, themeId: t.id as ThemeId })}
                style={{
                  backgroundColor: t.colors.bgCanvas,
                  color: t.colors.textPrimary,
                  borderColor:
                    preferences.themeId === t.id ? t.colors.accent : t.colors.borderSubtle,
                }}
                className="p-3 rounded-2xl border-2 text-left cursor-pointer transition hover:scale-[1.01]"
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>{t.name}</span>
                  {preferences.themeId === t.id && (
                    <span style={{ color: t.colors.accent }}>●</span>
                  )}
                </div>
                <div style={{ color: t.colors.textMuted }} className="text-[10px] mt-1">
                  {t.inspiration}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Font Family & Size */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              style={{ color: 'var(--text-muted)' }}
              className="block text-xs font-bold uppercase tracking-wider mb-2"
            >
              Font Family
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(FONT_FAMILIES) as FontFamilyId[]).map((fid) => (
                <button
                  key={fid}
                  type="button"
                  onClick={() => onUpdate({ ...preferences, fontFamily: fid })}
                  style={{
                    backgroundColor:
                      preferences.fontFamily === fid
                        ? 'var(--bg-surface-active)'
                        : 'var(--bg-surface-2)',
                    borderColor:
                      preferences.fontFamily === fid ? 'var(--accent)' : 'var(--border-subtle)',
                  }}
                  className="px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
                >
                  {FONT_FAMILIES[fid].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              style={{ color: 'var(--text-muted)' }}
              className="block text-xs font-bold uppercase tracking-wider mb-2"
            >
              Reading Font Size ({preferences.fontSize}px) &amp; Measure
            </label>
            <input
              type="range"
              min={14}
              max={22}
              value={preferences.fontSize}
              onChange={(e) =>
                onUpdate({ ...preferences, fontSize: Number(e.target.value) })
              }
              className="w-full accent-orange-500 mb-3"
            />
            <div className="flex gap-1.5">
              {(['55ch', '65ch', '75ch', 'full'] as LineWidthOption[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onUpdate({ ...preferences, lineWidth: w })}
                  style={{
                    backgroundColor:
                      preferences.lineWidth === w ? 'var(--accent)' : 'var(--bg-surface-2)',
                    color: preferences.lineWidth === w ? '#fff' : 'var(--text-secondary)',
                  }}
                  className="flex-1 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feed Filtering & Muted Keywords */}
        <div
          style={{ borderColor: 'var(--border-subtle)' }}
          className="pt-4 border-t space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Auto-hide already read stories</span>
            <input
              type="checkbox"
              checked={preferences.hideReadStories}
              onChange={(e) =>
                onUpdate({ ...preferences, hideReadStories: e.target.checked })
              }
              className="h-4 w-4 accent-orange-500"
            />
          </div>

          <div>
            <label
              style={{ color: 'var(--text-muted)' }}
              className="block text-xs font-bold uppercase tracking-wider mb-2"
            >
              Muted Keywords (Hide matching titles)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Add keyword to mute..."
                style={{
                  backgroundColor: 'var(--bg-surface-2)',
                  borderColor: 'var(--border-subtle)',
                }}
                className="flex-1 px-3 py-1.5 rounded-xl border text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const clean = keywordInput.trim();
                  if (clean && !preferences.mutedKeywords.includes(clean)) {
                    onUpdate({
                      ...preferences,
                      mutedKeywords: [...preferences.mutedKeywords, clean],
                    });
                    setKeywordInput('');
                  }
                }}
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Add
              </button>
            </div>
            {preferences.mutedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {preferences.mutedKeywords.map((kw) => (
                  <span
                    key={kw}
                    style={{ backgroundColor: 'var(--bg-surface-2)' }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdate({
                          ...preferences,
                          mutedKeywords: preferences.mutedKeywords.filter((k) => k !== kw),
                        })
                      }
                      className="material-symbols-rounded text-[14px] cursor-pointer"
                    >
                      close
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

Create `src/components/modals/CommandPaletteModal.tsx`:

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { HNStory } from '@/types/hn';
import { searchHN } from '@/lib/hn-api';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStory: (story: HNStory) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectStory,
}) => {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance');
  const [results, setResults] = useState<HNStory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setLoading(true);
      searchHN({ query, sortBy })
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 240);
    return () => clearTimeout(timer);
  }, [query, sortBy, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-xs p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-surface-1)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
        className="w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden"
      >
        <div
          style={{ borderColor: 'var(--border-subtle)' }}
          className="flex items-center gap-3 p-4 border-b"
        >
          <span style={{ color: 'var(--accent)' }} className="material-symbols-rounded">
            search
          </span>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all Hacker News stories via Algolia..."
            className="flex-1 bg-transparent text-base focus:outline-none"
          />
          <div className="flex gap-1">
            {(['relevance', 'date'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSortBy(s)}
                style={{
                  backgroundColor: sortBy === s ? 'var(--accent)' : 'var(--bg-surface-2)',
                  color: sortBy === s ? '#fff' : 'var(--text-secondary)',
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold capitalize cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2">
          {loading && (
            <div style={{ color: 'var(--text-muted)' }} className="py-8 text-center text-sm">
              Searching Hacker News archive...
            </div>
          )}

          {!loading && results.map((story) => (
            <button
              key={story.id}
              type="button"
              onClick={() => {
                onSelectStory(story);
                onClose();
              }}
              style={{ backgroundColor: 'var(--bg-surface-2)' }}
              className="w-full text-left p-3 rounded-2xl flex items-center justify-between gap-4 hover:brightness-110 cursor-pointer"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{story.cleanTitle}</div>
                <div style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5">
                  ▲ {story.points} • by {story.user} {story.domain ? `• ${story.domain}` : ''}
                </div>
              </div>
              <span className="text-xs font-semibold shrink-0">💬 {story.commentsCount}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
```

Create `src/components/modals/TimeTravelPopover.tsx`:

```tsx
'use client';

import React from 'react';

export type TimeTravelPreset = 'live' | 'yesterday' | 'last-week' | 'last-month' | 'one-year-ago';

interface TimeTravelPopoverProps {
  activePreset: TimeTravelPreset;
  onSelectPreset: (preset: TimeTravelPreset) => void;
}

export const TimeTravelPopover: React.FC<TimeTravelPopoverProps> = ({
  activePreset,
  onSelectPreset,
}) => {
  const presets: { id: TimeTravelPreset; label: string }[] = [
    { id: 'live', label: 'Live Front Page' },
    { id: 'yesterday', label: 'Yesterday Top' },
    { id: 'last-week', label: 'Past 7 Days Top' },
    { id: 'last-month', label: 'Past 30 Days Top' },
    { id: 'one-year-ago', label: '1 Year Ago Today' },
  ];

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        style={{ color: 'var(--accent)' }}
        className="material-symbols-rounded text-[18px]"
      >
        history
      </span>
      <select
        aria-label="Time travel front page"
        value={activePreset}
        onChange={(e) => onSelectPreset(e.target.value as TimeTravelPreset)}
        style={{
          backgroundColor: 'var(--bg-surface-2)',
          color: 'var(--text-primary)',
          borderColor: 'var(--border-subtle)',
        }}
        className="px-2.5 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none cursor-pointer"
      >
        {presets.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
};
```

Create `src/components/modals/ShortcutsModal.tsx`:

```tsx
'use client';

import React from 'react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'j / k', desc: 'Select next / previous story in the feed' },
    { key: 'r', desc: 'Toggle between Discussion Comments and Article Reader View' },
    { key: 'z', desc: 'Toggle between Split-Pane Mode and Centered Zen Mode' },
    { key: 'b', desc: 'Bookmark / unbookmark the active story' },
    { key: 'o / Enter', desc: 'Open external story URL in a new tab' },
    { key: '/ or ⌘K', desc: 'Open Instant Algolia Search Modal' },
    { key: 't', desc: 'Open Theme & Typography Studio' },
    { key: '?', desc: 'Toggle Keyboard Shortcuts Help' },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-surface-1)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
        className="w-full max-w-md rounded-3xl border p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2">
            <span style={{ color: 'var(--accent)' }} className="material-symbols-rounded">
              keyboard
            </span>
            Keyboard Navigation
          </h2>
          <button type="button" onClick={onClose} className="material-symbols-rounded cursor-pointer">
            close
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              style={{ backgroundColor: 'var(--bg-surface-2)' }}
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs"
            >
              <span style={{ color: 'var(--text-secondary)' }}>{s.desc}</span>
              <kbd
                style={{ color: 'var(--accent)' }}
                className="font-mono font-bold px-2 py-0.5 rounded bg-black/20"
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

### Task 8: AppHeader, Adaptive Workspace Shell (Split-Pane + Zen), Keyboard Navigation & Full Verification

**Files:**
- Create: `src/components/layout/AppHeader.tsx`
- Create: `src/components/layout/WorkspaceShell.tsx`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

**Interfaces:**
- Consumes: All components and services from Tasks 1–7.
- Produces: Complete Next.js web application at `/`.

- [ ] **Step 1: Implement `AppHeader.tsx`, `WorkspaceShell.tsx`, `src/app/layout.tsx`, and `src/app/page.tsx`**

Create `src/components/layout/AppHeader.tsx`:

```tsx
'use client';

import React from 'react';
import { FeedType, LayoutMode } from '@/types/hn';
import { TimeTravelPopover, TimeTravelPreset } from '@/components/modals/TimeTravelPopover';

interface AppHeaderProps {
  activeFeed: FeedType;
  onSelectFeed: (feed: FeedType) => void;
  layoutMode: LayoutMode;
  onToggleLayoutMode: () => void;
  timeTravelPreset: TimeTravelPreset;
  onSelectTimeTravel: (preset: TimeTravelPreset) => void;
  onOpenSearch: () => void;
  onOpenAppearance: () => void;
  onOpenShortcuts: () => void;
  savedCount: number;
}

const FEED_TABS: { id: FeedType; label: string; icon: string }[] = [
  { id: 'top', label: 'Top', icon: 'local_fire_department' },
  { id: 'new', label: 'New', icon: 'bolt' },
  { id: 'best', label: 'Best', icon: 'workspace_premium' },
  { id: 'ask', label: 'Ask', icon: 'help' },
  { id: 'show', label: 'Show', icon: 'rocket_launch' },
  { id: 'jobs', label: 'Jobs', icon: 'work' },
  { id: 'saved', label: 'Saved', icon: 'bookmark' },
];

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeFeed,
  onSelectFeed,
  layoutMode,
  onToggleLayoutMode,
  timeTravelPreset,
  onSelectTimeTravel,
  onOpenSearch,
  onOpenAppearance,
  onOpenShortcuts,
  savedCount,
}) => {
  return (
    <header
      style={{
        backgroundColor: 'var(--bg-surface-1)',
        borderColor: 'var(--border-subtle)',
      }}
      className="sticky top-0 z-30 border-b px-4 py-2.5 flex flex-wrap items-center justify-between gap-3"
    >
      {/* Brand + Feed Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto">
        <div className="flex items-center gap-2 pr-2">
          <div
            style={{ backgroundColor: 'var(--accent)' }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-sm shadow"
          >
            Y
          </div>
          <span className="font-bold text-base tracking-tight hidden sm:inline">
            HN Revamped
          </span>
        </div>

        <nav className="flex items-center gap-1">
          {FEED_TABS.map((tab) => {
            const isActive = activeFeed === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectFeed(tab.id)}
                style={{
                  backgroundColor: isActive ? 'var(--bg-surface-active)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition hover:bg-white/5"
              >
                <span className={`material-symbols-rounded text-[16px] ${isActive ? 'filled' : ''}`}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.id === 'saved' && savedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10">
                    {savedCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Studio Controls */}
      <div className="flex items-center gap-2">
        <TimeTravelPopover
          activePreset={timeTravelPreset}
          onSelectPreset={onSelectTimeTravel}
        />

        <button
          type="button"
          onClick={onOpenSearch}
          style={{
            backgroundColor: 'var(--bg-surface-2)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer"
        >
          <span className="material-symbols-rounded text-[16px]">search</span>
          <span className="hidden md:inline">Search</span>
          <kbd className="text-[10px] font-mono opacity-75">⌘K</kbd>
        </button>

        <button
          type="button"
          onClick={onOpenAppearance}
          title="Theme & Typography Studio (t)"
          style={{
            backgroundColor: 'var(--bg-surface-2)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer"
        >
          <span style={{ color: 'var(--accent)' }} className="material-symbols-rounded text-[16px]">
            palette
          </span>
          <span className="hidden sm:inline">Appearance</span>
        </button>

        <button
          type="button"
          onClick={onToggleLayoutMode}
          title="Toggle Split-Pane / Zen Mode (z)"
          style={{
            backgroundColor: 'var(--bg-surface-2)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--accent)',
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer"
        >
          <span className="material-symbols-rounded text-[16px]">
            {layoutMode === 'split' ? 'vertical_split' : 'width_normal'}
          </span>
          <span className="hidden sm:inline">
            {layoutMode === 'split' ? 'Split' : 'Zen'}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (?)"
          style={{
            backgroundColor: 'var(--bg-surface-2)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-muted)',
          }}
          className="p-1.5 rounded-xl border cursor-pointer"
        >
          <span className="material-symbols-rounded text-[16px]">keyboard</span>
        </button>
      </div>
    </header>
  );
};
```

Create `src/components/layout/WorkspaceShell.tsx`:

```tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DetailTab,
  FeedType,
  HNStory,
  HNStoryWithComments,
  ReadHistoryEntry,
  UserPreferences,
} from '@/types/hn';
import { DEFAULT_PREFERENCES, FONT_FAMILIES, getThemeCssVars } from '@/lib/themes';
import {
  fetchFeedStories,
  fetchStoryWithComments,
  fetchTimeTravelStories,
} from '@/lib/hn-api';
import {
  filterStories,
  loadBookmarks,
  loadPreferences,
  loadReadHistory,
  markStoryAsRead,
  savePreferences,
  toggleBookmarkStory,
} from '@/lib/storage';
import { AppHeader } from './AppHeader';
import { StoryFeedPane } from '@/components/feed/StoryFeedPane';
import { StoryDetailPane } from '@/components/detail/StoryDetailPane';
import { AppearanceModal } from '@/components/modals/AppearanceModal';
import { CommandPaletteModal } from '@/components/modals/CommandPaletteModal';
import { ShortcutsModal } from '@/components/modals/ShortcutsModal';
import { TimeTravelPreset } from '@/components/modals/TimeTravelPopover';

export const WorkspaceShell: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [activeFeed, setActiveFeed] = useState<FeedType>('top');
  const [timeTravel, setTimeTravel] = useState<TimeTravelPreset>('live');
  const [stories, setStories] = useState<HNStory[]>([]);
  const [page, setPage] = useState(1);
  const [loadingFeed, setLoadingFeed] = useState(true);

  const [selectedStory, setSelectedStory] = useState<HNStoryWithComments | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('comments');

  const [readHistory, setReadHistory] = useState<Record<number, ReadHistoryEntry>>({});
  const [bookmarks, setBookmarks] = useState<HNStory[]>([]);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Hydrate local preferences, read history, and bookmarks
  useEffect(() => {
    setPreferences(loadPreferences());
    setReadHistory(loadReadHistory());
    setBookmarks(loadBookmarks());
  }, []);

  // Apply theme CSS variables and typography settings
  useEffect(() => {
    const vars = getThemeCssVars(preferences.themeId);
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.style.setProperty(
      '--reader-font-family',
      FONT_FAMILIES[preferences.fontFamily].cssValue
    );
    root.style.setProperty('--reader-font-size', `${preferences.fontSize}px`);
    root.style.setProperty('--reader-line-height', String(preferences.lineHeight));
    root.style.setProperty(
      '--reader-line-width',
      preferences.lineWidth === 'full' ? '100%' : preferences.lineWidth
    );
  }, [preferences]);

  const handleUpdatePreferences = useCallback((next: UserPreferences) => {
    setPreferences(next);
    savePreferences(next);
  }, []);

  // Load feed or time-travel stories
  useEffect(() => {
    let active = true;
    setLoadingFeed(true);

    if (activeFeed === 'saved') {
      setStories(loadBookmarks());
      setLoadingFeed(false);
      return;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    let loader: Promise<HNStory[]>;

    if (timeTravel !== 'live') {
      const day = 86400;
      const ranges: Record<Exclude<TimeTravelPreset, 'live'>, [number, number]> = {
        yesterday: [nowSec - 2 * day, nowSec - day],
        'last-week': [nowSec - 7 * day, nowSec],
        'last-month': [nowSec - 30 * day, nowSec],
        'one-year-ago': [nowSec - 366 * day, nowSec - 364 * day],
      };
      const [start, end] = ranges[timeTravel];
      loader = fetchTimeTravelStories(start, end);
    } else {
      loader = fetchFeedStories(activeFeed, 1, 30);
    }

    loader
      .then((items) => {
        if (!active) return;
        setStories(items);
        setPage(1);
        if (items.length > 0 && !selectedStory) {
          handleSelectStory(items[0]);
        }
      })
      .catch(() => {
        if (active) setStories([]);
      })
      .finally(() => {
        if (active) setLoadingFeed(false);
      });

    return () => {
      active = false;
    };
  }, [activeFeed, timeTravel]);

  const handleSelectStory = useCallback((story: HNStory) => {
    setLoadingDetail(true);
    const updatedHistory = markStoryAsRead(story.id, story.commentsCount);
    setReadHistory(updatedHistory);

    fetchStoryWithComments(story.id)
      .then((fullStory) => {
        setSelectedStory(fullStory);
      })
      .catch(() => {
        setSelectedStory({ ...story, comments: [] });
      })
      .finally(() => {
        setLoadingDetail(false);
      });
  }, []);

  const handleLoadMore = useCallback(() => {
    if (activeFeed === 'saved' || timeTravel !== 'live') return;
    const nextPage = page + 1;
    setLoadingFeed(true);
    fetchFeedStories(activeFeed, nextPage, 30)
      .then((more) => {
        setStories((prev) => [...prev, ...more]);
        setPage(nextPage);
      })
      .finally(() => setLoadingFeed(false));
  }, [activeFeed, page, timeTravel]);

  const visibleStories = useMemo(
    () => filterStories(stories, preferences, readHistory),
    [stories, preferences, readHistory]
  );

  const bookmarkedIds = useMemo(() => new Set(bookmarks.map((b) => b.id)), [bookmarks]);

  // Global Vim-style Keyboard Navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === 't') {
        e.preventDefault();
        setIsAppearanceOpen((prev) => !prev);
      } else if (e.key === 'z') {
        e.preventDefault();
        handleUpdatePreferences({
          ...preferences,
          layoutMode: preferences.layoutMode === 'split' ? 'zen' : 'split',
        });
      } else if (e.key === 'r' && selectedStory?.url) {
        e.preventDefault();
        setActiveTab((prev) => (prev === 'comments' ? 'reader' : 'comments'));
      } else if (e.key === 'b' && selectedStory) {
        e.preventDefault();
        const res = toggleBookmarkStory(selectedStory);
        setBookmarks(res.bookmarks);
      } else if (e.key === 'o' && selectedStory?.url) {
        e.preventDefault();
        window.open(selectedStory.url, '_blank', 'noopener,noreferrer');
      } else if (e.key === 'j' || e.key === 'k') {
        e.preventDefault();
        if (visibleStories.length === 0) return;
        const idx = visibleStories.findIndex((s) => s.id === selectedStory?.id);
        const nextIdx =
          e.key === 'j'
            ? Math.min(visibleStories.length - 1, idx + 1)
            : Math.max(0, idx - 1);
        handleSelectStory(visibleStories[nextIdx]);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [preferences, selectedStory, visibleStories, handleSelectStory, handleUpdatePreferences]);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader
        activeFeed={activeFeed}
        onSelectFeed={(f) => {
          setActiveFeed(f);
          setTimeTravel('live');
        }}
        layoutMode={preferences.layoutMode}
        onToggleLayoutMode={() =>
          handleUpdatePreferences({
            ...preferences,
            layoutMode: preferences.layoutMode === 'split' ? 'zen' : 'split',
          })
        }
        timeTravelPreset={timeTravel}
        onSelectTimeTravel={setTimeTravel}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAppearance={() => setIsAppearanceOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        savedCount={bookmarks.length}
      />

      {preferences.layoutMode === 'split' ? (
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 h-[calc(100vh-57px)] overflow-hidden">
          <section
            style={{ borderColor: 'var(--border-subtle)' }}
            className="lg:col-span-5 xl:col-span-5 border-r overflow-y-auto h-full"
          >
            <StoryFeedPane
              stories={visibleStories}
              loading={loadingFeed}
              selectedStoryId={selectedStory?.id ?? null}
              readHistory={readHistory}
              bookmarkedIds={bookmarkedIds}
              onSelectStory={handleSelectStory}
              onToggleBookmark={(story, e) => {
                e.stopPropagation();
                setBookmarks(toggleBookmarkStory(story).bookmarks);
              }}
              onLoadMore={handleLoadMore}
              hasMore={activeFeed !== 'saved' && timeTravel === 'live'}
            />
          </section>

          <section className="hidden lg:block lg:col-span-7 xl:col-span-7 overflow-y-auto h-full">
            <StoryDetailPane
              story={selectedStory}
              loading={loadingDetail}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isBookmarked={selectedStory ? bookmarkedIds.has(selectedStory.id) : false}
              onToggleBookmark={() => {
                if (!selectedStory) return;
                setBookmarks(toggleBookmarkStory(selectedStory).bookmarks);
              }}
              onInternalHnLinkClick={(id) =>
                handleSelectStory({
                  id,
                  title: `Story #${id}`,
                  cleanTitle: `Story #${id}`,
                  points: 0,
                  user: '',
                  time: Math.floor(Date.now() / 1000),
                  commentsCount: 0,
                  badges: [],
                  type: 'story',
                })
              }
            />
          </section>
        </main>
      ) : (
        <main className="flex-1 max-w-4xl w-full mx-auto py-4 px-2 sm:px-6">
          {selectedStory ? (
            <div>
              <button
                type="button"
                onClick={() => setSelectedStory(null)}
                style={{
                  backgroundColor: 'var(--bg-surface-1)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--accent)',
                }}
                className="ml-5 mb-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer"
              >
                <span className="material-symbols-rounded text-[16px]">arrow_back</span>
                Back to Story Feed
              </button>
              <StoryDetailPane
                story={selectedStory}
                loading={loadingDetail}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isBookmarked={bookmarkedIds.has(selectedStory.id)}
                onToggleBookmark={() =>
                  setBookmarks(toggleBookmarkStory(selectedStory).bookmarks)
                }
                onInternalHnLinkClick={(id) =>
                  handleSelectStory({
                    id,
                    title: `Story #${id}`,
                    cleanTitle: `Story #${id}`,
                    points: 0,
                    user: '',
                    time: Math.floor(Date.now() / 1000),
                    commentsCount: 0,
                    badges: [],
                    type: 'story',
                  })
                }
              />
            </div>
          ) : (
            <StoryFeedPane
              stories={visibleStories}
              loading={loadingFeed}
              selectedStoryId={null}
              readHistory={readHistory}
              bookmarkedIds={bookmarkedIds}
              onSelectStory={handleSelectStory}
              onToggleBookmark={(story, e) => {
                e.stopPropagation();
                setBookmarks(toggleBookmarkStory(story).bookmarks);
              }}
              onLoadMore={handleLoadMore}
              hasMore={activeFeed !== 'saved' && timeTravel === 'live'}
            />
          )}
        </main>
      )}

      <AppearanceModal
        isOpen={isAppearanceOpen}
        preferences={preferences}
        onUpdate={handleUpdatePreferences}
        onClose={() => setIsAppearanceOpen(false)}
      />

      <CommandPaletteModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectStory={handleSelectStory}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};
```

Create `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HN Revamped — Intelligent Hacker News Reader',
  description:
    'A fast, readable, Google Material-inspired Hacker News client with Split-Pane & Zen modes, E-Reader & Code themes, and built-in Article Reader View.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

Create `src/app/page.tsx`:

```tsx
import React from 'react';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';

export default function HomePage() {
  return <WorkspaceShell />;
}
```

- [ ] **Step 2: Run full test suite, TypeScript check, and Next.js production build**

Run: `yarn test && yarn typecheck && yarn build`
Expected: All Vitest unit/component tests PASS, `tsc --noEmit` exits 0, and `next build` succeeds cleanly.
