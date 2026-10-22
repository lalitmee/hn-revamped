'use client';

import React, { useState } from 'react';
import {
  FontFamilyId,
  HNComment,
  HNStory,
  LineWidthOption,
  ThemeId,
  ThemeMode,
  UserPreferences,
} from '@/types/hn';
import {
  ACCENT_PRESETS,
  DEFAULT_PREFERENCES,
  FONT_FAMILIES,
  THEMES,
} from '@/lib/themes';
import { GlassSegmentedControl } from '@/components/ui/GlassSegmentedControl';
import { GlassSlider } from '@/components/ui/GlassSlider';
import { GlassSwitch } from '@/components/ui/GlassSwitch';
import { GlassButton } from '@/components/ui/GlassButton';
import { StoryPillRow } from '@/components/feed/StoryPillRow';
import { CommentNode } from '@/components/detail/CommentNode';

interface AppearanceModalProps {
  isOpen: boolean;
  preferences: UserPreferences;
  onUpdate: (prefs: UserPreferences) => void;
  onClose: () => void;
}

type StudioTab = 'themes' | 'typography' | 'filters';

const PREVIEW_SELECTED_STORY: HNStory = {
  id: 42001,
  title: 'Show HN: High-Performance GPU Terminal Written in Rust',
  cleanTitle: 'High-Performance GPU Terminal Written in Rust',
  url: 'https://github.com/example/gpu-term',
  domain: 'github.com',
  points: 412,
  user: 'systems_craft',
  time: Math.floor(Date.now() / 1000) - 7200,
  commentsCount: 164,
  badges: [
    { type: 'show', label: 'Show HN', icon: 'rocket_launch' },
    { type: 'github', label: 'GitHub', icon: 'code' },
  ],
  type: 'story',
};

const PREVIEW_SECONDARY_STORY: HNStory = {
  id: 42002,
  title: 'Why SQLite In-Memory Snapshots Are Faster Than You Expect',
  cleanTitle: 'Why SQLite In-Memory Snapshots Are Faster Than You Expect',
  url: 'https://sqlite.org/snapshots',
  domain: 'sqlite.org',
  points: 198,
  user: 'db_internals',
  time: Math.floor(Date.now() / 1000) - 14400,
  commentsCount: 82,
  badges: [],
  type: 'story',
};

const PREVIEW_COMMENT: HNComment = {
  id: 99001,
  user: 'systems_craft',
  time: Math.floor(Date.now() / 1000) - 5400,
  text: `<p>We moved glyph rasterization off the main thread and saw frame times drop below <code>0.4ms</code> on 120Hz displays. Full benchmarks are in <a href="https://example.com/benchmarks">https://example.com/benchmarks</a>.</p><blockquote><p>Zero layout jitter even under heavy stdout streaming.</p></blockquote>`,
  totalDescendants: 1,
  children: [
    {
      id: 99002,
      user: 'wayland_dev',
      time: Math.floor(Date.now() / 1000) - 3600,
      text: '<p>Impressive! Does this also fix fractional scaling blur on multi-DPI setups?</p>',
      totalDescendants: 0,
      children: [],
    },
  ],
};

export const AppearanceModal: React.FC<AppearanceModalProps> = ({
  isOpen,
  preferences,
  onUpdate,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('themes');
  const [keywordInput, setKeywordInput] = useState('');
  const [domainInput, setDomainInput] = useState('');

  if (!isOpen) return null;

  const readerThemes = Object.values(THEMES).filter(
    (t) => t.category === 'reader'
  );
  const codeThemes = Object.values(THEMES).filter((t) => t.category === 'code');

  const currentMode: ThemeMode = preferences.themeMode ?? 'system';
  const lightThemeId: ThemeId = preferences.lightThemeId ?? 'warm-paper';
  const darkThemeId: ThemeId = preferences.darkThemeId ?? 'obsidian-slate';

  const handleSelectPalette = (id: ThemeId) => {
    const picked = THEMES[id];
    if (picked.mode === 'light') {
      onUpdate({
        ...preferences,
        themeId: id,
        lightThemeId: id,
        themeMode: 'light',
      });
    } else {
      onUpdate({
        ...preferences,
        themeId: id,
        darkThemeId: id,
        themeMode: 'dark',
      });
    }
  };

  const handleSelectMode = (mode: ThemeMode) => {
    const nextThemeId =
      mode === 'light'
        ? lightThemeId
        : mode === 'dark'
          ? darkThemeId
          : preferences.themeId;
    onUpdate({
      ...preferences,
      themeMode: mode,
      themeId: nextThemeId,
    });
  };

  const filterBadgeCount =
    preferences.mutedKeywords.length + preferences.mutedDomains.length;

  const isThemesModified =
    preferences.themeMode !== DEFAULT_PREFERENCES.themeMode ||
    preferences.themeId !== DEFAULT_PREFERENCES.themeId ||
    preferences.lightThemeId !== DEFAULT_PREFERENCES.lightThemeId ||
    preferences.darkThemeId !== DEFAULT_PREFERENCES.darkThemeId ||
    preferences.customAccent !== DEFAULT_PREFERENCES.customAccent;

  const isTypographyModified =
    preferences.fontFamily !== DEFAULT_PREFERENCES.fontFamily ||
    preferences.fontSize !== DEFAULT_PREFERENCES.fontSize ||
    Math.abs(preferences.lineHeight - DEFAULT_PREFERENCES.lineHeight) > 0.001 ||
    preferences.lineWidth !== DEFAULT_PREFERENCES.lineWidth;

  const isFiltersModified =
    preferences.hideReadStories !== DEFAULT_PREFERENCES.hideReadStories ||
    preferences.mutedKeywords.length > 0 ||
    preferences.mutedDomains.length > 0;

  const isAnyModified =
    isThemesModified || isTypographyModified || isFiltersModified;

  const handleResetThemes = () => {
    onUpdate({
      ...preferences,
      themeId: DEFAULT_PREFERENCES.themeId,
      themeMode: DEFAULT_PREFERENCES.themeMode,
      lightThemeId: DEFAULT_PREFERENCES.lightThemeId,
      darkThemeId: DEFAULT_PREFERENCES.darkThemeId,
      customAccent: DEFAULT_PREFERENCES.customAccent,
    });
  };

  const handleResetTypography = () => {
    onUpdate({
      ...preferences,
      fontFamily: DEFAULT_PREFERENCES.fontFamily,
      fontSize: DEFAULT_PREFERENCES.fontSize,
      lineHeight: DEFAULT_PREFERENCES.lineHeight,
      lineWidth: DEFAULT_PREFERENCES.lineWidth,
    });
  };

  const handleResetFilters = () => {
    onUpdate({
      ...preferences,
      hideReadStories: DEFAULT_PREFERENCES.hideReadStories,
      mutedKeywords: [],
      mutedDomains: [],
    });
  };

  const handleResetAll = () => {
    onUpdate({
      ...DEFAULT_PREFERENCES,
      layoutMode: preferences.layoutMode,
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden animate-story-in">
      {/* Pinned / Sticky Top Studio Header Bar */}
      <div
        style={{
          backgroundColor:
            'color-mix(in srgb, var(--bg-canvas) 88%, transparent)',
          borderColor: 'var(--border-subtle)',
        }}
        className="shrink-0 z-20 backdrop-blur-xl border-b"
      >
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-8 xl:px-10 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <GlassButton
              icon="arrow_back"
              iconAccent
              onClick={onClose}
              title="Return to stories (Esc or t)"
            >
              Back to Feed
            </GlassButton>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2">
                <span
                  style={{ color: 'var(--accent)' }}
                  className="material-symbols-rounded text-[22px]"
                >
                  palette
                </span>
                <span>Appearance, Typography &amp; Filter Studio</span>
              </h1>
              <p
                style={{ color: 'var(--text-muted)' }}
                className="text-xs mt-0.5"
              >
                Customize your reading surfaces, Material 3 accent color,
                typography measure, and feed filters with live preview
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <GlassSegmentedControl<StudioTab>
              value={activeTab}
              onChange={setActiveTab}
              items={[
                { id: 'themes', label: 'Themes & Colors', icon: 'palette' },
                {
                  id: 'typography',
                  label: 'Typography & Layout',
                  icon: 'text_fields',
                },
                {
                  id: 'filters',
                  label: 'Feed Filters',
                  icon: 'tune',
                  badge: filterBadgeCount || undefined,
                },
              ]}
            />

            <button
              type="button"
              disabled={!isAnyModified}
              onClick={handleResetAll}
              title={
                isAnyModified
                  ? 'Reset all themes, typography, and feed filters to factory defaults'
                  : 'All studio settings are already at factory defaults'
              }
              style={{
                color: isAnyModified ? 'var(--accent)' : 'var(--text-muted)',
                borderColor: isAnyModified
                  ? 'color-mix(in srgb, var(--accent) 35%, var(--border-subtle))'
                  : 'var(--border-subtle)',
              }}
              className={`liquid-glass h-9 px-3.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold border transition-all ${
                isAnyModified
                  ? 'cursor-pointer hover:brightness-110 active:scale-95'
                  : 'opacity-45 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-rounded text-[16px]">
                restart_alt
              </span>
              <span>Reset All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Independently Scrollable Studio Body */}
      <div className="custom-scrollbar flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-8 xl:px-10 py-6">
          {/* Spacious 12-Column Split Studio: Controls (Left 7 cols) + Sticky Live Preview (Right 5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT 7 COLUMNS: Studio Controls */}
            <div className="lg:col-span-7 space-y-6">
              {/* TAB 1: THEMES & ACCENT COLORS */}
              {activeTab === 'themes' && (
                <div className="space-y-6 animate-story-in">
                  {/* Per-Section Header & Reset Bar */}
                  <div className="flex items-center justify-between gap-3 px-1">
                    <div>
                      <h2 className="text-sm font-bold">
                        Themes &amp; Color Palette
                      </h2>
                      <p
                        style={{ color: 'var(--text-muted)' }}
                        className="text-xs"
                      >
                        Default: System mode (
                        {
                          THEMES[
                            DEFAULT_PREFERENCES.lightThemeId ?? 'warm-paper'
                          ].name
                        }{' '}
                        /{' '}
                        {
                          THEMES[
                            DEFAULT_PREFERENCES.darkThemeId ?? 'obsidian-slate'
                          ].name
                        }
                        ) with theme accent
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!isThemesModified}
                      onClick={handleResetThemes}
                      style={{
                        color: isThemesModified
                          ? 'var(--accent)'
                          : 'var(--text-muted)',
                      }}
                      className={`liquid-glass h-8 px-3 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold transition-all ${
                        isThemesModified
                          ? 'cursor-pointer hover:brightness-110 active:scale-95'
                          : 'opacity-45 cursor-not-allowed'
                      }`}
                    >
                      <span className="material-symbols-rounded text-[15px]">
                        history
                      </span>
                      <span>Reset Themes</span>
                    </button>
                  </div>

                  {/* Color Mode + Accent Color Row */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* Color Scheme Mode */}
                    <div className="liquid-glass p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-bold">
                          Color Scheme Mode
                        </div>
                        <div
                          style={{ color: 'var(--text-muted)' }}
                          className="text-xs mt-1"
                        >
                          Auto-sync with your OS or lock to your preferred Light
                          ({THEMES[lightThemeId].name}) or Dark (
                          {THEMES[darkThemeId].name}) preset
                        </div>
                      </div>
                      <GlassSegmentedControl<ThemeMode>
                        size="sm"
                        value={currentMode}
                        onChange={handleSelectMode}
                        items={[
                          { id: 'light', label: 'Light', icon: 'light_mode' },
                          { id: 'system', label: 'System', icon: 'contrast' },
                          { id: 'dark', label: 'Dark', icon: 'dark_mode' },
                        ]}
                      />
                    </div>

                    {/* Primary Accent Color Picker */}
                    <div className="liquid-glass p-5 rounded-3xl space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-bold">
                            Primary Accent Color
                          </div>
                          <div
                            style={{ color: 'var(--text-muted)' }}
                            className="text-xs mt-1"
                          >
                            Select a Material 3 swatch, pick any custom hex
                            color, or use the theme default
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            onUpdate({ ...preferences, customAccent: null })
                          }
                          style={{
                            backgroundColor: !preferences.customAccent
                              ? 'var(--accent)'
                              : 'color-mix(in srgb, var(--text-primary) 8%, transparent)',
                            color: !preferences.customAccent
                              ? '#ffffff'
                              : 'var(--text-secondary)',
                          }}
                          className="px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Theme Default (
                          {THEMES[preferences.themeId]?.colors.accent})
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        {ACCENT_PRESETS.map((preset) => {
                          const isActive =
                            preferences.customAccent?.toLowerCase() ===
                            preset.color.toLowerCase();
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              title={`${preset.label} (${preset.color})`}
                              aria-label={preset.label}
                              onClick={() =>
                                onUpdate({
                                  ...preferences,
                                  customAccent: preset.color,
                                })
                              }
                              style={{
                                backgroundColor: preset.color,
                                boxShadow: isActive
                                  ? `0 0 0 3px var(--bg-surface-2), 0 0 0 5px ${preset.color}`
                                  : undefined,
                              }}
                              className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                            >
                              {isActive && (
                                <span className="material-symbols-rounded text-white text-[17px] font-bold">
                                  check
                                </span>
                              )}
                            </button>
                          );
                        })}

                        {/* Custom Color Picker Pill */}
                        <label
                          title="Pick any custom accent color"
                          style={{
                            backgroundColor:
                              'color-mix(in srgb, var(--text-primary) 8%, transparent)',
                            borderColor: preferences.customAccent
                              ? 'var(--accent)'
                              : 'var(--border-subtle)',
                          }}
                          className="relative inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full border text-xs font-semibold cursor-pointer hover:brightness-105 ml-auto"
                        >
                          <span
                            style={{
                              backgroundColor:
                                preferences.customAccent ??
                                THEMES[preferences.themeId]?.colors.accent,
                            }}
                            className="w-4 h-4 rounded-full shrink-0 border border-black/15"
                          />
                          <span className="font-mono uppercase leading-none">
                            {preferences.customAccent ?? 'Custom'}
                          </span>
                          <span
                            style={{ color: 'var(--text-secondary)' }}
                            className="material-symbols-rounded text-[15px]"
                          >
                            edit
                          </span>
                          <input
                            type="color"
                            aria-label="Custom accent color picker"
                            value={
                              preferences.customAccent ??
                              THEMES[preferences.themeId]?.colors.accent ??
                              '#F97316'
                            }
                            onChange={(e) =>
                              onUpdate({
                                ...preferences,
                                customAccent: e.target.value.toUpperCase(),
                              })
                            }
                            className="sr-only"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* E-Book & Editorial Reader Themes */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        style={{ color: 'var(--accent)' }}
                        className="material-symbols-rounded text-[18px]"
                      >
                        menu_book
                      </span>
                      <h2
                        style={{ color: 'var(--text-secondary)' }}
                        className="text-xs font-bold uppercase tracking-wider"
                      >
                        E-Book &amp; Editorial Reader Themes (6)
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                      {readerThemes.map((t) => {
                        const isSelected = preferences.themeId === t.id;
                        const isPreferredPair =
                          (t.mode === 'light' && lightThemeId === t.id) ||
                          (t.mode === 'dark' && darkThemeId === t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleSelectPalette(t.id as ThemeId)}
                            style={{
                              backgroundColor: t.colors.bgCanvas,
                              color: t.colors.textPrimary,
                              borderColor: isSelected
                                ? 'var(--accent)'
                                : t.colors.borderSubtle,
                              boxShadow: isSelected
                                ? '0 0 0 2px var(--accent), 0 10px 24px -6px rgba(0,0,0,0.22)'
                                : '0 2px 8px -2px rgba(0,0,0,0.08)',
                              backfaceVisibility: 'hidden',
                              transition:
                                'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 260ms cubic-bezier(0.22, 1, 0.36, 1), border-color 220ms ease',
                            }}
                            className="p-4 rounded-2xl border text-left cursor-pointer hover:-translate-y-0.5 active:translate-y-0 flex flex-col justify-between gap-3 focus:outline-none"
                          >
                            <div className="flex items-start justify-between gap-2 w-full">
                              <div className="min-w-0">
                                <div className="text-sm font-bold truncate">
                                  {t.name}
                                </div>
                                <div
                                  style={{ color: t.colors.textMuted }}
                                  className="text-[11px] mt-0.5 truncate"
                                >
                                  {t.inspiration}
                                </div>
                              </div>

                              {/* Palette Swatch Dots */}
                              <div className="flex items-center -space-x-1.5 shrink-0">
                                <span
                                  style={{
                                    backgroundColor: t.colors.bgSurface2,
                                  }}
                                  className="w-4 h-4 rounded-full border border-black/20"
                                  title="Surface"
                                />
                                <span
                                  style={{ backgroundColor: t.colors.accent }}
                                  className="w-4 h-4 rounded-full border border-black/20"
                                  title="Primary Accent"
                                />
                                <span
                                  style={{
                                    backgroundColor: t.colors.linkUnvisited,
                                  }}
                                  className="w-4 h-4 rounded-full border border-black/20"
                                  title="Unvisited Link"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-1.5 pt-1">
                              <span
                                style={{
                                  backgroundColor: t.colors.bgSurface2,
                                  color: t.colors.textSecondary,
                                }}
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase whitespace-nowrap shrink-0"
                              >
                                {t.mode === 'light'
                                  ? 'Light Surface'
                                  : 'Dark Surface'}
                              </span>

                              {isSelected ? (
                                <span
                                  style={{
                                    backgroundColor: 'var(--accent)',
                                    color: '#fff',
                                  }}
                                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap shrink-0"
                                >
                                  Active
                                </span>
                              ) : isPreferredPair ? (
                                <span
                                  style={{
                                    backgroundColor: t.colors.bgSurface2,
                                    color: t.colors.accent,
                                  }}
                                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap shrink-0"
                                >
                                  {t.mode === 'light'
                                    ? 'Light Default'
                                    : 'Dark Default'}
                                </span>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Developer & Code Editor Themes */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        style={{ color: 'var(--accent)' }}
                        className="material-symbols-rounded text-[18px]"
                      >
                        terminal
                      </span>
                      <h2
                        style={{ color: 'var(--text-secondary)' }}
                        className="text-xs font-bold uppercase tracking-wider"
                      >
                        Developer &amp; Code Editor Themes (5)
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                      {codeThemes.map((t) => {
                        const isSelected = preferences.themeId === t.id;
                        const isPreferredPair =
                          (t.mode === 'light' && lightThemeId === t.id) ||
                          (t.mode === 'dark' && darkThemeId === t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleSelectPalette(t.id as ThemeId)}
                            style={{
                              backgroundColor: t.colors.bgCanvas,
                              color: t.colors.textPrimary,
                              borderColor: isSelected
                                ? 'var(--accent)'
                                : t.colors.borderSubtle,
                              boxShadow: isSelected
                                ? '0 0 0 2px var(--accent), 0 10px 24px -6px rgba(0,0,0,0.22)'
                                : '0 2px 8px -2px rgba(0,0,0,0.08)',
                              backfaceVisibility: 'hidden',
                              transition:
                                'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 260ms cubic-bezier(0.22, 1, 0.36, 1), border-color 220ms ease',
                            }}
                            className="p-4 rounded-2xl border text-left cursor-pointer hover:-translate-y-0.5 active:translate-y-0 flex flex-col justify-between gap-3 focus:outline-none"
                          >
                            <div className="flex items-start justify-between gap-2 w-full">
                              <div className="min-w-0">
                                <div className="text-sm font-bold truncate">
                                  {t.name}
                                </div>
                                <div
                                  style={{ color: t.colors.textMuted }}
                                  className="text-[11px] mt-0.5 truncate"
                                >
                                  {t.inspiration}
                                </div>
                              </div>

                              <div className="flex items-center -space-x-1.5 shrink-0">
                                <span
                                  style={{
                                    backgroundColor: t.colors.bgSurface2,
                                  }}
                                  className="w-4 h-4 rounded-full border border-black/20"
                                />
                                <span
                                  style={{ backgroundColor: t.colors.accent }}
                                  className="w-4 h-4 rounded-full border border-black/20"
                                />
                                <span
                                  style={{
                                    backgroundColor: t.colors.linkUnvisited,
                                  }}
                                  className="w-4 h-4 rounded-full border border-black/20"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-1.5 pt-1">
                              <span
                                style={{
                                  backgroundColor: t.colors.bgSurface2,
                                  color: t.colors.textSecondary,
                                }}
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase whitespace-nowrap shrink-0"
                              >
                                {t.mode === 'light'
                                  ? 'Light Surface'
                                  : 'Dark Surface'}
                              </span>

                              {isSelected ? (
                                <span
                                  style={{
                                    backgroundColor: 'var(--accent)',
                                    color: '#fff',
                                  }}
                                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap shrink-0"
                                >
                                  Active
                                </span>
                              ) : isPreferredPair ? (
                                <span
                                  style={{
                                    backgroundColor: t.colors.bgSurface2,
                                    color: t.colors.accent,
                                  }}
                                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap shrink-0"
                                >
                                  {t.mode === 'light'
                                    ? 'Light Default'
                                    : 'Dark Default'}
                                </span>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TYPOGRAPHY & LAYOUT */}
              {activeTab === 'typography' && (
                <div className="space-y-6 animate-story-in">
                  {/* Per-Section Header & Reset Bar */}
                  <div className="flex items-center justify-between gap-3 px-1">
                    <div>
                      <h2 className="text-sm font-bold">
                        Typography &amp; Reading Measure
                      </h2>
                      <p
                        style={{ color: 'var(--text-muted)' }}
                        className="text-xs"
                      >
                        Default:{' '}
                        {FONT_FAMILIES[DEFAULT_PREFERENCES.fontFamily].label} ·{' '}
                        {DEFAULT_PREFERENCES.fontSize}px ·{' '}
                        {DEFAULT_PREFERENCES.lineHeight}× ·{' '}
                        {DEFAULT_PREFERENCES.lineWidth}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!isTypographyModified}
                      onClick={handleResetTypography}
                      style={{
                        color: isTypographyModified
                          ? 'var(--accent)'
                          : 'var(--text-muted)',
                      }}
                      className={`liquid-glass h-8 px-3 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold transition-all ${
                        isTypographyModified
                          ? 'cursor-pointer hover:brightness-110 active:scale-95'
                          : 'opacity-45 cursor-not-allowed'
                      }`}
                    >
                      <span className="material-symbols-rounded text-[15px]">
                        history
                      </span>
                      <span>Reset Typography</span>
                    </button>
                  </div>

                  <div>
                    <label
                      style={{ color: 'var(--text-secondary)' }}
                      className="block text-xs font-bold uppercase tracking-wider mb-3"
                    >
                      Font Family
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {(Object.keys(FONT_FAMILIES) as FontFamilyId[]).map(
                        (fid) => {
                          const isActive = preferences.fontFamily === fid;
                          return (
                            <button
                              key={fid}
                              type="button"
                              onClick={() =>
                                onUpdate({ ...preferences, fontFamily: fid })
                              }
                              style={{
                                fontFamily: FONT_FAMILIES[fid].cssValue,
                                color: isActive
                                  ? '#ffffff'
                                  : 'var(--text-primary)',
                              }}
                              className={`p-4 rounded-2xl text-left cursor-pointer transition-all ${
                                isActive
                                  ? 'liquid-glass-primary font-bold'
                                  : 'liquid-glass font-medium'
                              }`}
                            >
                              <div className="text-base">
                                {FONT_FAMILIES[fid].label}
                              </div>
                              <div className="text-xs opacity-80 mt-1">
                                The quick brown fox jumps over 123 lazy dogs.
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Sliders for Font Size & Line Height */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <GlassSlider
                      label="Font Size"
                      valueLabel={`${preferences.fontSize}px`}
                      value={preferences.fontSize}
                      min={13}
                      max={22}
                      step={1}
                      onChange={(val) =>
                        onUpdate({ ...preferences, fontSize: val })
                      }
                    />

                    <GlassSlider
                      label="Line Spacing"
                      valueLabel={`${preferences.lineHeight.toFixed(2)}×`}
                      value={preferences.lineHeight}
                      min={1.35}
                      max={1.9}
                      step={0.05}
                      onChange={(val) =>
                        onUpdate({ ...preferences, lineHeight: val })
                      }
                    />
                  </div>

                  {/* Reading Line Width */}
                  <div className="liquid-glass p-5 rounded-3xl space-y-3">
                    <div>
                      <div className="text-sm font-bold">
                        Reading Line Width (Measure)
                      </div>
                      <div
                        style={{ color: 'var(--text-muted)' }}
                        className="text-xs mt-0.5"
                      >
                        Controls maximum character column width for comments and
                        Article Reader View
                      </div>
                    </div>
                    <GlassSegmentedControl<LineWidthOption>
                      fullWidth
                      value={preferences.lineWidth}
                      onChange={(w) =>
                        onUpdate({ ...preferences, lineWidth: w })
                      }
                      items={[
                        { id: '55ch', label: 'Compact (55ch)' },
                        { id: '65ch', label: 'Optimal (65ch)' },
                        { id: '75ch', label: 'Wide (75ch)' },
                        { id: 'full', label: 'Full Width' },
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: FEED FILTERS */}
              {activeTab === 'filters' && (
                <div className="space-y-5 animate-story-in">
                  {/* Per-Section Header & Reset Bar */}
                  <div className="flex items-center justify-between gap-3 px-1">
                    <div>
                      <h2 className="text-sm font-bold">
                        Feed Visibility &amp; Muted Filters
                      </h2>
                      <p
                        style={{ color: 'var(--text-muted)' }}
                        className="text-xs"
                      >
                        Control read-story visibility and keyword/domain mutes
                        independently of your visual theme
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!isFiltersModified}
                      onClick={handleResetFilters}
                      style={{
                        color: isFiltersModified
                          ? 'var(--accent)'
                          : 'var(--text-muted)',
                      }}
                      className={`liquid-glass h-8 px-3 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold transition-all ${
                        isFiltersModified
                          ? 'cursor-pointer hover:brightness-110 active:scale-95'
                          : 'opacity-45 cursor-not-allowed'
                      }`}
                    >
                      <span className="material-symbols-rounded text-[15px]">
                        history
                      </span>
                      <span>Reset Filters</span>
                    </button>
                  </div>

                  <GlassSwitch
                    label="Auto-hide already read stories"
                    description="Automatically hide stories from the feed once you have opened them"
                    checked={preferences.hideReadStories}
                    onChange={(checked) =>
                      onUpdate({ ...preferences, hideReadStories: checked })
                    }
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Muted Keywords */}
                    <div className="liquid-glass p-5 rounded-3xl space-y-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-bold">
                            Muted Keywords
                          </div>
                          <div
                            style={{ color: 'var(--text-muted)' }}
                            className="text-xs mt-0.5"
                          >
                            Stories with titles containing these words will be
                            hidden from your feed.
                          </div>
                        </div>
                        {preferences.mutedKeywords.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdate({ ...preferences, mutedKeywords: [] })
                            }
                            style={{ color: 'var(--accent)' }}
                            className="text-xs font-semibold shrink-0 cursor-pointer hover:underline"
                          >
                            Clear all
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const clean = keywordInput.trim();
                              if (
                                clean &&
                                !preferences.mutedKeywords.includes(clean)
                              ) {
                                onUpdate({
                                  ...preferences,
                                  mutedKeywords: [
                                    ...preferences.mutedKeywords,
                                    clean,
                                  ],
                                });
                                setKeywordInput('');
                              }
                            }
                          }}
                          placeholder="e.g. crypto, layoff, nft..."
                          style={{
                            backgroundColor: 'var(--bg-canvas)',
                            borderColor: 'var(--border-subtle)',
                          }}
                          className="flex-1 px-3.5 py-2 rounded-full border text-xs focus:outline-none"
                        />
                        <GlassButton
                          variant="primary"
                          icon="add"
                          onClick={() => {
                            const clean = keywordInput.trim();
                            if (
                              clean &&
                              !preferences.mutedKeywords.includes(clean)
                            ) {
                              onUpdate({
                                ...preferences,
                                mutedKeywords: [
                                  ...preferences.mutedKeywords,
                                  clean,
                                ],
                              });
                              setKeywordInput('');
                            }
                          }}
                        >
                          Add
                        </GlassButton>
                      </div>

                      {preferences.mutedKeywords.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {preferences.mutedKeywords.map((kw) => (
                            <span
                              key={kw}
                              style={{ backgroundColor: 'var(--bg-canvas)' }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                            >
                              <span>{kw}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdate({
                                    ...preferences,
                                    mutedKeywords:
                                      preferences.mutedKeywords.filter(
                                        (k) => k !== kw
                                      ),
                                  })
                                }
                                className="material-symbols-rounded text-[14px] cursor-pointer hover:text-red-400"
                              >
                                close
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div
                          style={{ color: 'var(--text-muted)' }}
                          className="text-xs italic"
                        >
                          No muted keywords configured.
                        </div>
                      )}
                    </div>

                    {/* Muted Domains */}
                    <div className="liquid-glass p-5 rounded-3xl space-y-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-bold">Muted Domains</div>
                          <div
                            style={{ color: 'var(--text-muted)' }}
                            className="text-xs mt-0.5"
                          >
                            Hide links originating from specific websites.
                          </div>
                        </div>
                        {preferences.mutedDomains.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdate({ ...preferences, mutedDomains: [] })
                            }
                            style={{ color: 'var(--accent)' }}
                            className="text-xs font-semibold shrink-0 cursor-pointer hover:underline"
                          >
                            Clear all
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={domainInput}
                          onChange={(e) => setDomainInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const clean = domainInput.trim();
                              if (
                                clean &&
                                !preferences.mutedDomains.includes(clean)
                              ) {
                                onUpdate({
                                  ...preferences,
                                  mutedDomains: [
                                    ...preferences.mutedDomains,
                                    clean,
                                  ],
                                });
                                setDomainInput('');
                              }
                            }
                          }}
                          placeholder="e.g. medium.com, x.com..."
                          style={{
                            backgroundColor: 'var(--bg-canvas)',
                            borderColor: 'var(--border-subtle)',
                          }}
                          className="flex-1 px-3.5 py-2 rounded-full border text-xs focus:outline-none"
                        />
                        <GlassButton
                          variant="primary"
                          icon="add"
                          onClick={() => {
                            const clean = domainInput.trim();
                            if (
                              clean &&
                              !preferences.mutedDomains.includes(clean)
                            ) {
                              onUpdate({
                                ...preferences,
                                mutedDomains: [
                                  ...preferences.mutedDomains,
                                  clean,
                                ],
                              });
                              setDomainInput('');
                            }
                          }}
                        >
                          Add
                        </GlassButton>
                      </div>

                      {preferences.mutedDomains.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {preferences.mutedDomains.map((dom) => (
                            <span
                              key={dom}
                              style={{ backgroundColor: 'var(--bg-canvas)' }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                            >
                              <span>{dom}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdate({
                                    ...preferences,
                                    mutedDomains:
                                      preferences.mutedDomains.filter(
                                        (d) => d !== dom
                                      ),
                                  })
                                }
                                className="material-symbols-rounded text-[14px] cursor-pointer hover:text-red-400"
                              >
                                close
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div
                          style={{ color: 'var(--text-muted)' }}
                          className="text-xs italic"
                        >
                          No muted domains configured.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT 5 COLUMNS: Sticky Live Interactive HN Preview */}
            <aside className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
              <div className="flex items-center justify-between px-1">
                <span
                  style={{ color: 'var(--text-secondary)' }}
                  className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <span
                    style={{ color: 'var(--accent)' }}
                    className="material-symbols-rounded text-[16px]"
                  >
                    visibility
                  </span>
                  Live Workspace Preview
                </span>
                <span
                  style={{ color: 'var(--text-muted)' }}
                  className="text-xs font-medium"
                >
                  {THEMES[preferences.themeId]?.name} · {preferences.fontSize}px
                </span>
              </div>

              {/* Live Selected & Unselected Story Pill Preview */}
              <div className="space-y-2.5">
                <StoryPillRow
                  story={PREVIEW_SELECTED_STORY}
                  index={1}
                  isSelected={true}
                  isRead={false}
                  newCommentsDelta={0}
                  isBookmarked={true}
                  onSelect={() => {}}
                  onToggleBookmark={(s, e) => e.stopPropagation()}
                />

                <StoryPillRow
                  story={PREVIEW_SECONDARY_STORY}
                  index={2}
                  isSelected={false}
                  isRead={true}
                  newCommentsDelta={14}
                  isBookmarked={false}
                  onSelect={() => {}}
                  onToggleBookmark={(s, e) => e.stopPropagation()}
                />
              </div>

              {/* Live Discussion Thread & Prose Typography Preview */}
              <div
                style={{
                  backgroundColor: 'var(--bg-surface-1)',
                  borderColor: 'var(--border-subtle)',
                }}
                className="p-5 rounded-3xl border space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    style={{ color: 'var(--text-muted)' }}
                    className="text-[11px] font-bold uppercase tracking-wider"
                  >
                    Comment Thread &amp; Prose Preview
                  </span>
                  <span
                    style={{
                      backgroundColor:
                        'color-mix(in srgb, var(--accent) 16%, transparent)',
                      color: 'var(--accent)',
                    }}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                  >
                    {FONT_FAMILIES[preferences.fontFamily].label}
                  </span>
                </div>

                <CommentNode
                  comment={PREVIEW_COMMENT}
                  depth={0}
                  maxAllowedDepth={2}
                  storyAuthor="systems_craft"
                  collapseMode="expanded"
                />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};
