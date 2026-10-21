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
