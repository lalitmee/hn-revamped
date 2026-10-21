import { describe, it, expect } from 'vitest';
import {
  THEMES,
  FONT_FAMILIES,
  getThemeCssVars,
  DEFAULT_PREFERENCES,
  resolveActiveThemeId,
} from '../themes';

describe('Multi-Source Theme Engine', () => {
  it('includes Bookerly and MonoLisa alongside standard font families', () => {
    expect(FONT_FAMILIES.bookerly.label).toBe('Kindle Bookerly');
    expect(FONT_FAMILIES.bookerly.cssValue).toContain('Bookerly');
    expect(FONT_FAMILIES.monolisa.label).toBe('MonoLisa Code');
    expect(FONT_FAMILIES.monolisa.cssValue).toContain('MonoLisa');
  });
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

  it('generates CSS variable map for a given theme and supports custom accent override', () => {
    const vars = getThemeCssVars('kindle-sepia');
    expect(vars['--bg-canvas']).toBe('#F4ECD8');
    expect(vars['--accent']).toBe('#B45309');
    expect(vars['--link-unvisited']).toBe('#0369A1');
    expect(vars['--link-visited']).toBe('#6D28D9');

    const customVars = getThemeCssVars('kindle-sepia', '#3B82F6');
    expect(customVars['--accent']).toBe('#3B82F6');
  });

  it('exports sensible default user preferences', () => {
    expect(DEFAULT_PREFERENCES.layoutMode).toBe('split');
    expect(DEFAULT_PREFERENCES.fontSize).toBe(16);
    expect(DEFAULT_PREFERENCES.lineWidth).toBe('65ch');
    expect(DEFAULT_PREFERENCES.themeMode).toBe('system');
  });

  it('resolves Light, Dark, and System theme modes accurately', () => {
    expect(
      resolveActiveThemeId(
        {
          ...DEFAULT_PREFERENCES,
          themeMode: 'system',
          lightThemeId: 'kindle-sepia',
          darkThemeId: 'catppuccin-mocha',
        },
        false
      )
    ).toBe('kindle-sepia');

    expect(
      resolveActiveThemeId(
        {
          ...DEFAULT_PREFERENCES,
          themeMode: 'system',
          lightThemeId: 'kindle-sepia',
          darkThemeId: 'catppuccin-mocha',
        },
        true
      )
    ).toBe('catppuccin-mocha');
  });
});
