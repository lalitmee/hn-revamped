'use client';

import React, { useState } from 'react';
import { FontFamilyId, LineWidthOption, ThemeId, ThemeMode, UserPreferences } from '@/types/hn';
import { FONT_FAMILIES, THEMES } from '@/lib/themes';
import { GlassModal } from '@/components/ui/GlassModal';
import { GlassSegmentedControl } from '@/components/ui/GlassSegmentedControl';
import { GlassSlider } from '@/components/ui/GlassSlider';
import { GlassSwitch } from '@/components/ui/GlassSwitch';
import { GlassButton } from '@/components/ui/GlassButton';

interface AppearanceModalProps {
  isOpen: boolean;
  preferences: UserPreferences;
  onUpdate: (prefs: UserPreferences) => void;
  onClose: () => void;
}

type StudioTab = 'themes' | 'typography' | 'filters';

export const AppearanceModal: React.FC<AppearanceModalProps> = ({
  isOpen,
  preferences,
  onUpdate,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('themes');
  const [keywordInput, setKeywordInput] = useState('');
  const [domainInput, setDomainInput] = useState('');

  const readerThemes = Object.values(THEMES).filter((t) => t.category === 'reader');
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

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Appearance, Typography & Filter Studio"
      icon="palette"
      maxWidthClass="max-w-2xl"
    >
      <div className="p-6 space-y-6">
        {/* Top Segmented Studio Navigation */}
        <GlassSegmentedControl<StudioTab>
          fullWidth
          value={activeTab}
          onChange={setActiveTab}
          items={[
            { id: 'themes', label: 'Themes (11)', icon: 'palette' },
            { id: 'typography', label: 'Typography & Layout', icon: 'text_fields' },
            {
              id: 'filters',
              label: 'Feed Filters',
              icon: 'tune',
              badge:
                preferences.mutedKeywords.length + preferences.mutedDomains.length || undefined,
            },
          ]}
        />

        {/* TAB 1: THEMES */}
        {activeTab === 'themes' && (
          <div className="space-y-5">
            {/* Color Mode Switcher: Light / System / Dark */}
            <div className="liquid-glass p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Color Scheme Mode</div>
                <div style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5">
                  Auto-sync with OS or lock to your preferred Light ({THEMES[lightThemeId].name}) or Dark ({THEMES[darkThemeId].name}) palette
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

            <div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  style={{ color: 'var(--accent)' }}
                  className="material-symbols-rounded text-[18px]"
                >
                  menu_book
                </span>
                <h3
                  style={{ color: 'var(--text-secondary)' }}
                  className="text-xs font-bold uppercase tracking-wider"
                >
                  E-Book &amp; Editorial Reader Themes
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        borderColor: isSelected ? t.colors.accent : t.colors.borderSubtle,
                        boxShadow: isSelected
                          ? `0 0 0 2px ${t.colors.accent}, 0 8px 20px -4px rgba(0,0,0,0.25)`
                          : undefined,
                      }}
                      className="p-3.5 rounded-2xl border text-left cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold flex items-center gap-2 flex-wrap">
                          <span>{t.name}</span>
                          {isSelected ? (
                            <span
                              style={{
                                backgroundColor: t.colors.accent,
                                color: '#fff',
                              }}
                              className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase"
                            >
                              Active
                            </span>
                          ) : isPreferredPair ? (
                            <span
                              style={{
                                backgroundColor: t.colors.bgSurface2,
                                color: t.colors.textSecondary,
                              }}
                              className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase"
                            >
                              {t.mode === 'light' ? 'Light Default' : 'Dark Default'}
                            </span>
                          ) : null}
                        </div>
                        <div style={{ color: t.colors.textMuted }} className="text-xs mt-0.5">
                          {t.inspiration} · {t.mode === 'light' ? 'Light' : 'Dark'}
                        </div>
                      </div>

                      {/* Palette Swatch Dots */}
                      <div className="flex items-center -space-x-1.5 shrink-0">
                        <span
                          style={{ backgroundColor: t.colors.bgSurface2 }}
                          className="w-4 h-4 rounded-full border border-black/20"
                          title="Surface"
                        />
                        <span
                          style={{ backgroundColor: t.colors.accent }}
                          className="w-4 h-4 rounded-full border border-black/20"
                          title="Primary Accent"
                        />
                        <span
                          style={{ backgroundColor: t.colors.linkUnvisited }}
                          className="w-4 h-4 rounded-full border border-black/20"
                          title="Unvisited Link"
                        />
                        <span
                          style={{ backgroundColor: t.colors.linkVisited }}
                          className="w-4 h-4 rounded-full border border-black/20"
                          title="Visited Link"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  style={{ color: 'var(--accent)' }}
                  className="material-symbols-rounded text-[18px]"
                >
                  terminal
                </span>
                <h3
                  style={{ color: 'var(--text-secondary)' }}
                  className="text-xs font-bold uppercase tracking-wider"
                >
                  Developer &amp; Code Editor Themes
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        borderColor: isSelected ? t.colors.accent : t.colors.borderSubtle,
                        boxShadow: isSelected
                          ? `0 0 0 2px ${t.colors.accent}, 0 8px 20px -4px rgba(0,0,0,0.25)`
                          : undefined,
                      }}
                      className="p-3.5 rounded-2xl border text-left cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold flex items-center gap-2 flex-wrap">
                          <span>{t.name}</span>
                          {isSelected ? (
                            <span
                              style={{
                                backgroundColor: t.colors.accent,
                                color: '#fff',
                              }}
                              className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase"
                            >
                              Active
                            </span>
                          ) : isPreferredPair ? (
                            <span
                              style={{
                                backgroundColor: t.colors.bgSurface2,
                                color: t.colors.textSecondary,
                              }}
                              className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase"
                            >
                              {t.mode === 'light' ? 'Light Default' : 'Dark Default'}
                            </span>
                          ) : null}
                        </div>
                        <div style={{ color: t.colors.textMuted }} className="text-xs mt-0.5">
                          {t.inspiration} · {t.mode === 'light' ? 'Light' : 'Dark'}
                        </div>
                      </div>

                      <div className="flex items-center -space-x-1.5 shrink-0">
                        <span
                          style={{ backgroundColor: t.colors.bgSurface2 }}
                          className="w-4 h-4 rounded-full border border-black/20"
                        />
                        <span
                          style={{ backgroundColor: t.colors.accent }}
                          className="w-4 h-4 rounded-full border border-black/20"
                        />
                        <span
                          style={{ backgroundColor: t.colors.linkUnvisited }}
                          className="w-4 h-4 rounded-full border border-black/20"
                        />
                        <span
                          style={{ backgroundColor: t.colors.linkVisited }}
                          className="w-4 h-4 rounded-full border border-black/20"
                        />
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
          <div className="space-y-5">
            {/* Live Interactive Prose Preview */}
            <div className="liquid-glass p-4 rounded-2xl">
              <div
                style={{ color: 'var(--text-muted)' }}
                className="text-[11px] font-bold uppercase tracking-wider mb-2"
              >
                Live Reading Preview
              </div>
              <div className="hn-prose">
                <p>
                  Good typography makes technical discussions effortless to read. Check the{' '}
                  <a href="#preview-unvisited" onClick={(e) => e.preventDefault()} className="hn-external-link">
                    benchmark results
                  </a>{' '}
                  or jump to{' '}
                  <a href="#preview-internal" onClick={(e) => e.preventDefault()} className="hn-internal-link">
                    <span className="material-symbols-rounded hn-link-icon">forum</span>HN #42001
                  </a>
                  .
                </p>
              </div>
            </div>

            {/* Typeface Selection */}
            <div>
              <label
                style={{ color: 'var(--text-secondary)' }}
                className="block text-xs font-bold uppercase tracking-wider mb-2.5"
              >
                Font Family
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {(Object.keys(FONT_FAMILIES) as FontFamilyId[]).map((fid) => {
                  const isActive = preferences.fontFamily === fid;
                  return (
                    <button
                      key={fid}
                      type="button"
                      onClick={() => onUpdate({ ...preferences, fontFamily: fid })}
                      style={{
                        fontFamily: FONT_FAMILIES[fid].cssValue,
                        color: isActive ? '#ffffff' : 'var(--text-primary)',
                      }}
                      className={`p-3 rounded-2xl text-left cursor-pointer transition-all ${
                        isActive ? 'liquid-glass-primary font-bold' : 'liquid-glass font-medium'
                      }`}
                    >
                      <div className="text-sm">{FONT_FAMILIES[fid].label}</div>
                      <div className="text-[11px] opacity-75 mt-0.5">Aa Bb Cc 123</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Liquid Glass Sliders for Font Size & Line Height */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <GlassSlider
                label="Font Size"
                valueLabel={`${preferences.fontSize}px`}
                value={preferences.fontSize}
                min={14}
                max={22}
                step={1}
                onChange={(val) => onUpdate({ ...preferences, fontSize: val })}
              />

              <GlassSlider
                label="Line Spacing"
                valueLabel={`${preferences.lineHeight.toFixed(2)}×`}
                value={preferences.lineHeight}
                min={1.4}
                max={1.9}
                step={0.05}
                onChange={(val) => onUpdate({ ...preferences, lineHeight: val })}
              />
            </div>

            {/* Reading Line Width */}
            <div>
              <label
                style={{ color: 'var(--text-secondary)' }}
                className="block text-xs font-bold uppercase tracking-wider mb-2.5"
              >
                Reading Line Width (Measure)
              </label>
              <GlassSegmentedControl<LineWidthOption>
                fullWidth
                value={preferences.lineWidth}
                onChange={(w) => onUpdate({ ...preferences, lineWidth: w })}
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
          <div className="space-y-5">
            <GlassSwitch
              label="Auto-hide already read stories"
              description="Automatically hide stories from the feed once you have opened them"
              checked={preferences.hideReadStories}
              onChange={(checked) =>
                onUpdate({ ...preferences, hideReadStories: checked })
              }
            />

            {/* Muted Keywords */}
            <div className="liquid-glass p-4 rounded-2xl space-y-3">
              <div>
                <div className="text-sm font-semibold">Muted Keywords</div>
                <div style={{ color: 'var(--text-muted)' }} className="text-xs">
                  Stories with titles containing these words will be hidden from your feed.
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const clean = keywordInput.trim();
                      if (clean && !preferences.mutedKeywords.includes(clean)) {
                        onUpdate({
                          ...preferences,
                          mutedKeywords: [...preferences.mutedKeywords, clean],
                        });
                        setKeywordInput('');
                      }
                    }
                  }}
                  placeholder="e.g. crypto, layoff, nft..."
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--bg-canvas) 65%, transparent)',
                    borderColor: 'var(--border-subtle)',
                  }}
                  className="flex-1 px-3.5 py-2 rounded-xl border text-xs focus:outline-none"
                />
                <GlassButton
                  variant="primary"
                  icon="add"
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
                >
                  Add
                </GlassButton>
              </div>

              {preferences.mutedKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {preferences.mutedKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="liquid-glass inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdate({
                            ...preferences,
                            mutedKeywords: preferences.mutedKeywords.filter((k) => k !== kw),
                          })
                        }
                        className="material-symbols-rounded text-[14px] cursor-pointer hover:text-red-400"
                      >
                        close
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Muted Domains */}
            <div className="liquid-glass p-4 rounded-2xl space-y-3">
              <div>
                <div className="text-sm font-semibold">Muted Domains</div>
                <div style={{ color: 'var(--text-muted)' }} className="text-xs">
                  Hide links originating from specific websites.
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const clean = domainInput.trim();
                      if (clean && !preferences.mutedDomains.includes(clean)) {
                        onUpdate({
                          ...preferences,
                          mutedDomains: [...preferences.mutedDomains, clean],
                        });
                        setDomainInput('');
                      }
                    }
                  }}
                  placeholder="e.g. medium.com, x.com..."
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--bg-canvas) 65%, transparent)',
                    borderColor: 'var(--border-subtle)',
                  }}
                  className="flex-1 px-3.5 py-2 rounded-xl border text-xs focus:outline-none"
                />
                <GlassButton
                  variant="primary"
                  icon="add"
                  onClick={() => {
                    const clean = domainInput.trim();
                    if (clean && !preferences.mutedDomains.includes(clean)) {
                      onUpdate({
                        ...preferences,
                        mutedDomains: [...preferences.mutedDomains, clean],
                      });
                      setDomainInput('');
                    }
                  }}
                >
                  Add
                </GlassButton>
              </div>

              {preferences.mutedDomains.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {preferences.mutedDomains.map((dom) => (
                    <span
                      key={dom}
                      className="liquid-glass inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                    >
                      <span>{dom}</span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdate({
                            ...preferences,
                            mutedDomains: preferences.mutedDomains.filter((d) => d !== dom),
                          })
                        }
                        className="material-symbols-rounded text-[14px] cursor-pointer hover:text-red-400"
                      >
                        close
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </GlassModal>
  );
};
