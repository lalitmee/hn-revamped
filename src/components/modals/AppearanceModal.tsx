'use client';

import React, { useState } from 'react';
import {
  CardDensity,
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
  text: `<p>We moved glyph rasterization off the main thread and saw frame times drop below <code>0.4ms</code> on 120Hz displays. Our layout architecture ensures consistent frame pacing and responsive rendering across diverse display densities and line lengths.</p><blockquote><p>Zero layout jitter even under heavy stdout streaming.</p></blockquote>`,
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
    preferences.lineWidth !== DEFAULT_PREFERENCES.lineWidth ||
    (preferences.cardDensity ?? 'comfortable') !==
      (DEFAULT_PREFERENCES.cardDensity ?? 'comfortable');

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
      cardDensity: DEFAULT_PREFERENCES.cardDensity,
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

  const lightThemes = Object.values(THEMES).filter((t) => t.mode === 'light');
  const darkThemes = Object.values(THEMES).filter((t) => t.mode === 'dark');

  const renderThemeTile = (t: (typeof THEMES)[ThemeId]) => {
    const isSelected = preferences.themeId === t.id;
    return (
      <button
        key={t.id}
        type="button"
        onClick={() => handleSelectPalette(t.id as ThemeId)}
        aria-pressed={isSelected}
        title={t.inspiration}
        style={{
          backgroundColor: t.colors.bgCanvas,
          color: t.colors.textPrimary,
          borderColor: isSelected ? 'var(--accent)' : t.colors.borderSubtle,
          boxShadow: isSelected ? '0 0 0 1px var(--accent)' : undefined,
        }}
        className="px-3 py-2.5 rounded-xl border text-left cursor-pointer flex items-center justify-between gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <span className="text-[13px] font-medium truncate">{t.name}</span>
        <span className="flex items-center -space-x-1 shrink-0">
          {[t.colors.bgSurface2, t.colors.accent, t.colors.linkUnvisited].map(
            (c, i) => (
              <span
                key={i}
                style={{ backgroundColor: c }}
                className="w-3 h-3 rounded-full border border-black/15"
              />
            )
          )}
        </span>
      </button>
    );
  };

  const resetLinkClass = (enabled: boolean) =>
    `liquid-glass h-8 px-3 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold transition-all ${
      enabled
        ? 'cursor-pointer active:scale-95'
        : 'opacity-40 cursor-not-allowed'
    }`;

  const sectionTitle = (
    title: string,
    enabled: boolean,
    onReset: () => void
  ) => (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base font-medium">{title}</h2>
      <button
        type="button"
        disabled={!enabled}
        onClick={onReset}
        style={{ color: enabled ? 'var(--accent)' : 'var(--text-muted)' }}
        className={resetLinkClass(enabled)}
      >
        <span className="material-symbols-rounded text-[15px]">history</span>
        Reset
      </button>
    </div>
  );

  const groupLabel = (text: string) => (
    <div
      style={{ color: 'var(--text-muted)' }}
      className="text-xs font-medium mb-2.5"
    >
      {text}
    </div>
  );

  const rowDivider = { borderColor: 'var(--border-subtle)' };

  const renderMuteList = (
    title: string,
    placeholder: string,
    input: string,
    setInput: (v: string) => void,
    items: string[],
    commit: (next: string[]) => void
  ) => {
    const add = () => {
      const clean = input.trim();
      if (clean && !items.includes(clean)) {
        commit([...items, clean]);
        setInput('');
      }
    };
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-medium">{title}</div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => commit([])}
              style={{ color: 'var(--accent)' }}
              className="liquid-glass h-7 px-3 rounded-full text-xs font-semibold cursor-pointer active:scale-95"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add();
            }}
            placeholder={placeholder}
            style={{
              backgroundColor: 'transparent',
              borderColor: 'var(--border-subtle)',
            }}
            className="flex-1 min-w-0 px-3.5 py-2 rounded-full border text-xs focus:outline-none focus:border-[var(--accent)]"
          />
          <GlassButton variant="primary" icon="add" onClick={add}>
            Add
          </GlassButton>
        </div>
        {items.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {items.map((item) => (
              <span
                key={item}
                style={{ backgroundColor: 'var(--bg-surface-2)' }}
                className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full text-xs"
              >
                <span>{item}</span>
                <button
                  type="button"
                  aria-label={`Remove ${item}`}
                  onClick={() => commit(items.filter((i) => i !== item))}
                  className="material-symbols-rounded text-[14px] cursor-pointer opacity-60 hover:opacity-100"
                >
                  close
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden animate-story-in">
      {/* Pinned Header */}
      <div
        style={{
          backgroundColor:
            'color-mix(in srgb, var(--bg-canvas) 88%, transparent)',
          borderColor: 'var(--border-subtle)',
        }}
        className="shrink-0 z-20 backdrop-blur-xl border-b"
      >
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-8 xl:px-10 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <GlassButton
              icon="arrow_back"
              onClick={onClose}
              title="Return to stories (Esc or t)"
            >
              Back
            </GlassButton>
            <h1 className="text-lg font-medium tracking-tight">Appearance</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <GlassSegmentedControl<StudioTab>
              value={activeTab}
              onChange={setActiveTab}
              items={[
                { id: 'themes', label: 'Theme', icon: 'palette' },
                { id: 'typography', label: 'Text', icon: 'text_fields' },
                {
                  id: 'filters',
                  label: 'Filters',
                  icon: 'tune',
                  badge: filterBadgeCount || undefined,
                },
              ]}
            />
            <button
              type="button"
              disabled={!isAnyModified}
              onClick={handleResetAll}
              title="Reset theme, text, and filters to defaults"
              style={{
                color: isAnyModified ? 'var(--accent)' : 'var(--text-muted)',
              }}
              className={resetLinkClass(isAnyModified)}
            >
              <span className="material-symbols-rounded text-[16px]">
                restart_alt
              </span>
              Reset all
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="custom-scrollbar flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-8 xl:px-10 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Controls */}
            <div className="lg:col-span-7">
              {activeTab === 'themes' && (
                <div className="space-y-8 animate-story-in">
                  {sectionTitle('Theme', isThemesModified, handleResetThemes)}

                  {/* Mode */}
                  <div
                    style={rowDivider}
                    className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b"
                  >
                    <div>
                      <div className="text-sm font-medium">Mode</div>
                      <div
                        style={{ color: 'var(--text-muted)' }}
                        className="text-xs mt-0.5"
                      >
                        {THEMES[lightThemeId].name} / {THEMES[darkThemeId].name}
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

                  {/* Accent */}
                  <div style={rowDivider} className="pb-6 border-b space-y-3">
                    <div className="text-sm font-medium">Accent color</div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {(() => {
                        const themeAccent =
                          THEMES[preferences.themeId]?.colors.accent;
                        const isDefault = !preferences.customAccent;
                        return (
                          <button
                            type="button"
                            title="Theme default"
                            aria-label="Theme default accent"
                            aria-pressed={isDefault}
                            onClick={() =>
                              onUpdate({ ...preferences, customAccent: null })
                            }
                            style={{
                              backgroundColor: themeAccent,
                              boxShadow: isDefault
                                ? `0 0 0 2px var(--bg-canvas), 0 0 0 4px ${themeAccent}`
                                : undefined,
                            }}
                            className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105 focus:outline-none"
                          >
                            <span className="material-symbols-rounded text-white text-[16px]">
                              {isDefault ? 'check' : 'auto_awesome'}
                            </span>
                          </button>
                        );
                      })()}
                      {ACCENT_PRESETS.map((preset) => {
                        const isActive =
                          preferences.customAccent?.toLowerCase() ===
                          preset.color.toLowerCase();
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            title={preset.label}
                            aria-label={preset.label}
                            aria-pressed={isActive}
                            onClick={() =>
                              onUpdate({
                                ...preferences,
                                customAccent: preset.color,
                              })
                            }
                            style={{
                              backgroundColor: preset.color,
                              boxShadow: isActive
                                ? `0 0 0 2px var(--bg-canvas), 0 0 0 4px ${preset.color}`
                                : undefined,
                            }}
                            className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105 focus:outline-none"
                          >
                            {isActive && (
                              <span className="material-symbols-rounded text-white text-[16px]">
                                check
                              </span>
                            )}
                          </button>
                        );
                      })}
                      <label
                        title="Custom color"
                        style={{ borderColor: 'var(--border-subtle)' }}
                        className="relative w-7 h-7 rounded-full border flex items-center justify-center cursor-pointer hover:bg-[var(--bg-surface-2)]"
                      >
                        <span
                          style={{ color: 'var(--text-secondary)' }}
                          className="material-symbols-rounded text-[16px]"
                        >
                          add
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

                  {/* Palettes */}
                  <div>
                    {groupLabel('Light')}
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5">
                      {lightThemes.map(renderThemeTile)}
                    </div>
                  </div>
                  <div>
                    {groupLabel('Dark')}
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5">
                      {darkThemes.map(renderThemeTile)}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'typography' && (
                <div className="space-y-8 animate-story-in">
                  {sectionTitle(
                    'Text',
                    isTypographyModified,
                    handleResetTypography
                  )}

                  <div>
                    {groupLabel('Font')}
                    <div className="grid grid-cols-2 gap-2.5">
                      {(Object.keys(FONT_FAMILIES) as FontFamilyId[]).map(
                        (fid) => {
                          const isActive = preferences.fontFamily === fid;
                          return (
                            <button
                              key={fid}
                              type="button"
                              aria-pressed={isActive}
                              onClick={() =>
                                onUpdate({ ...preferences, fontFamily: fid })
                              }
                              style={{
                                fontFamily: FONT_FAMILIES[fid].cssValue,
                                borderColor: isActive
                                  ? 'var(--accent)'
                                  : 'var(--border-subtle)',
                                boxShadow: isActive
                                  ? '0 0 0 1px var(--accent)'
                                  : undefined,
                              }}
                              className="px-4 py-3 rounded-xl border text-left text-sm cursor-pointer transition-colors hover:bg-[var(--bg-surface-2)]"
                            >
                              {FONT_FAMILIES[fid].label}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    <GlassSlider
                      label="Size"
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
                      label="Line spacing"
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

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">Reading width</div>
                      <div
                        style={{ color: 'var(--text-muted)' }}
                        className="text-xs mt-0.5"
                      >
                        Column width for comments and reader mode
                      </div>
                    </div>
                    <GlassSegmentedControl<LineWidthOption>
                      size="sm"
                      value={preferences.lineWidth}
                      onChange={(w) =>
                        onUpdate({ ...preferences, lineWidth: w })
                      }
                      items={[
                        {
                          id: '55ch',
                          label: 'Narrow',
                          icon: 'format_align_center',
                        },
                        { id: '65ch', label: 'Optimal', icon: 'width_normal' },
                        { id: '75ch', label: 'Wide', icon: 'width_wide' },
                        { id: 'full', label: 'Full', icon: 'width_full' },
                      ]}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">Card density</div>
                      <div
                        style={{ color: 'var(--text-muted)' }}
                        className="text-xs mt-0.5"
                      >
                        Compact feed rows and discussion cards
                      </div>
                    </div>
                    <GlassSegmentedControl<CardDensity>
                      size="sm"
                      value={preferences.cardDensity ?? 'comfortable'}
                      onChange={(d) =>
                        onUpdate({ ...preferences, cardDensity: d })
                      }
                      items={[
                        {
                          id: 'comfortable',
                          label: 'Comfortable',
                          icon: 'view_agenda',
                        },
                        {
                          id: 'compact',
                          label: 'Compact',
                          icon: 'view_headline',
                        },
                      ]}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'filters' && (
                <div className="space-y-8 animate-story-in">
                  {sectionTitle(
                    'Filters',
                    isFiltersModified,
                    handleResetFilters
                  )}

                  <GlassSwitch
                    label="Hide read stories"
                    description="Remove stories from the feed once opened"
                    checked={preferences.hideReadStories}
                    onChange={(checked) =>
                      onUpdate({ ...preferences, hideReadStories: checked })
                    }
                  />

                  {renderMuteList(
                    'Muted keywords',
                    'e.g. crypto, layoff',
                    keywordInput,
                    setKeywordInput,
                    preferences.mutedKeywords,
                    (next) => onUpdate({ ...preferences, mutedKeywords: next })
                  )}

                  {renderMuteList(
                    'Muted domains',
                    'e.g. medium.com',
                    domainInput,
                    setDomainInput,
                    preferences.mutedDomains,
                    (next) => onUpdate({ ...preferences, mutedDomains: next })
                  )}
                </div>
              )}
            </div>

            {/* Live Preview */}
            <aside className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
              <div
                style={{ color: 'var(--text-muted)' }}
                className="flex items-center justify-between text-xs font-medium"
              >
                <span>Preview</span>
                <span>
                  {THEMES[preferences.themeId]?.name} · {preferences.fontSize}
                  px
                </span>
              </div>

              <div className="space-y-2">
                <StoryPillRow
                  story={PREVIEW_SELECTED_STORY}
                  index={1}
                  isSelected={true}
                  compact={preferences.cardDensity === 'compact'}
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
                  compact={preferences.cardDensity === 'compact'}
                  isRead={true}
                  newCommentsDelta={14}
                  isBookmarked={false}
                  onSelect={() => {}}
                  onToggleBookmark={(s, e) => e.stopPropagation()}
                />
              </div>

              <div
                style={{ borderColor: 'var(--border-subtle)' }}
                className="p-5 rounded-2xl border space-y-3"
              >
                <div
                  style={{ color: 'var(--text-muted)' }}
                  className="flex items-center justify-between text-[11px] font-medium"
                >
                  <span>Comment discussion</span>
                  <span>
                    Width:{' '}
                    {preferences.lineWidth === 'full'
                      ? '100%'
                      : preferences.lineWidth}
                  </span>
                </div>
                <div
                  style={{
                    maxWidth:
                      preferences.lineWidth === 'full'
                        ? '100%'
                        : preferences.lineWidth,
                  }}
                  className="transition-[max-width] duration-200"
                >
                  <CommentNode
                    comment={PREVIEW_COMMENT}
                    depth={0}
                    maxAllowedDepth={2}
                    storyAuthor="systems_craft"
                    collapseMode="expanded"
                    compact={preferences.cardDensity === 'compact'}
                  />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};
