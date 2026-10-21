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

export const ACCENT_PRESETS: { id: string; label: string; color: string }[] = [
  { id: 'tangerine', label: 'HN Tangerine', color: '#F97316' },
  { id: 'blue', label: 'Google Blue', color: '#3B82F6' },
  { id: 'emerald', label: 'Emerald Mint', color: '#10B981' },
  { id: 'violet', label: 'Royal Violet', color: '#8B5CF6' },
  { id: 'rose', label: 'Rose Coral', color: '#F43F5E' },
  { id: 'amber', label: 'Amber Gold', color: '#F59E0B' },
  { id: 'cyan', label: 'Cyan Teal', color: '#06B6D4' },
  { id: 'indigo', label: 'Electric Indigo', color: '#6366F1' },
];

export const DEFAULT_PREFERENCES: UserPreferences = {
  themeId: 'obsidian-slate',
  themeMode: 'system',
  lightThemeId: 'warm-paper',
  darkThemeId: 'obsidian-slate',
  customAccent: null,
  fontFamily: 'sans',
  fontSize: 16,
  lineHeight: 1.65,
  lineWidth: '65ch',
  layoutMode: 'split',
  hideReadStories: false,
  mutedKeywords: [],
  mutedDomains: [],
};

export function resolveActiveThemeId(
  prefs: UserPreferences,
  systemPrefersDark: boolean
): ThemeId {
  const mode = prefs.themeMode ?? 'dark';
  const lightId = prefs.lightThemeId ?? 'warm-paper';
  const darkId = prefs.darkThemeId ?? 'obsidian-slate';

  if (mode === 'light') {
    return THEMES[ prefs.themeId ]?.mode === 'light' ? prefs.themeId : lightId;
  }
  if (mode === 'dark') {
    return THEMES[ prefs.themeId ]?.mode === 'dark' ? prefs.themeId : darkId;
  }
  return systemPrefersDark ? darkId : lightId;
}

export function getThemeCssVars(
  themeId: ThemeId,
  customAccent?: string | null
): Record<string, string> {
  const theme = THEMES[themeId] ?? THEMES['obsidian-slate'];
  const effectiveAccent =
    customAccent && /^#[0-9A-Fa-f]{6}$/.test(customAccent)
      ? customAccent
      : theme.colors.accent;
  return {
    '--bg-canvas': theme.colors.bgCanvas,
    '--bg-surface-1': theme.colors.bgSurface1,
    '--bg-surface-2': theme.colors.bgSurface2,
    '--bg-surface-active': theme.colors.bgSurfaceActive,
    '--text-primary': theme.colors.textPrimary,
    '--text-secondary': theme.colors.textSecondary,
    '--text-muted': theme.colors.textMuted,
    '--accent': effectiveAccent,
    '--link-unvisited': theme.colors.linkUnvisited,
    '--link-visited': theme.colors.linkVisited,
    '--border-subtle': theme.colors.borderSubtle,
  };
}
