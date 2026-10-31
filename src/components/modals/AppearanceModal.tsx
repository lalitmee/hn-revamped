'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
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
import { MobileBottomSheet } from '@/components/ui/MobileBottomSheet';
import { hasUsedSwipe, recordSwipe } from '@/lib/storage';
interface AppearanceModalProps {
  isOpen: boolean;
  preferences: UserPreferences;
  onUpdate: (prefs: UserPreferences) => void;
  onClose: () => void;
}

type StudioTab = 'themes' | 'typography' | 'filters';

const LINE_WIDTH_OPTIONS: {
  id: LineWidthOption;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    id: '55ch',
    label: 'Narrow',
    icon: 'format_align_center',
    description: 'A compact reading column',
  },
  {
    id: '65ch',
    label: 'Optimal',
    icon: 'width_normal',
    description: 'Balanced for most screens',
  },
  {
    id: '75ch',
    label: 'Wide',
    icon: 'width_wide',
    description: 'More text per line',
  },
  {
    id: 'full',
    label: 'Full',
    icon: 'width_full',
    description: 'Use the available width',
  },
];

const STUDIO_TABS: {
  id: StudioTab;
  label: string;
  icon: string;
}[] = [
  { id: 'themes', label: 'Theme', icon: 'palette' },
  { id: 'typography', label: 'Text', icon: 'text_fields' },
  { id: 'filters', label: 'Filters', icon: 'tune' },
];

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
  const tablistRef = useRef<HTMLDivElement>(null);
  const tabIndicatorRef = useRef<HTMLSpanElement>(null);
  const tabButtonRefs = useRef<Partial<Record<StudioTab, HTMLButtonElement>>>(
    {}
  );
  const viewTransitionIdRef = useRef(0);
  const [isLightThemesSheetOpen, setIsLightThemesSheetOpen] = useState(false);
  const [isDarkThemesSheetOpen, setIsDarkThemesSheetOpen] = useState(false);
  const [isFontSheetOpen, setIsFontSheetOpen] = useState(false);
  const [isLineWidthSheetOpen, setIsLineWidthSheetOpen] = useState(false);
  const [isAccentSheetOpen, setIsAccentSheetOpen] = useState(false);
  const lightThemesTriggerRef = useRef<HTMLButtonElement>(null);
  const darkThemesTriggerRef = useRef<HTMLButtonElement>(null);
  const fontTriggerRef = useRef<HTMLButtonElement>(null);
  const lineWidthTriggerRef = useRef<HTMLButtonElement>(null);
  const accentTriggerRef = useRef<HTMLButtonElement>(null);
  const [keywordInput, setKeywordInput] = useState('');
  const [domainInput, setDomainInput] = useState('');

  useLayoutEffect(() => {
    const tablist = tablistRef.current;
    const indicator = tabIndicatorRef.current;
    if (!tablist || !indicator) return;

    const updateIndicator = () => {
      const activeButton = tabButtonRefs.current[activeTab];
      if (!activeButton) return;
      indicator.style.width = `${activeButton.offsetWidth}px`;
      indicator.style.transform = `translateX(${activeButton.offsetLeft}px)`;
    };

    updateIndicator();
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(updateIndicator);
    observer.observe(tablist);
    return () => observer.disconnect();
  }, [activeTab, isOpen]);

  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  useEffect(() => {
    setShowSwipeHint(!hasUsedSwipe('appearance'));
  }, []);

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

  const selectTab = (nextTab: StudioTab, animate = false) => {
    if (nextTab === activeTab) return;

    const isMobileViewport =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 639px)').matches;

    if (!animate || !isMobileViewport) {
      setActiveTab(nextTab);
      return;
    }

    const direction =
      STUDIO_TABS.findIndex((tab) => tab.id === nextTab) >
      STUDIO_TABS.findIndex((tab) => tab.id === activeTab)
        ? 'forward'
        : 'backward';
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const documentWithViewTransition = document as Document & {
      startViewTransition?: (callback: () => void) => {
        finished: Promise<unknown>;
      };
    };

    if (
      prefersReducedMotion ||
      !documentWithViewTransition.startViewTransition
    ) {
      setActiveTab(nextTab);
      return;
    }

    const transitionId = ++viewTransitionIdRef.current;
    document.documentElement.dataset.appearanceTabDirection = direction;

    try {
      const transition = documentWithViewTransition.startViewTransition(() => {
        flushSync(() => setActiveTab(nextTab));
      });
      const clearDirection = () => {
        if (viewTransitionIdRef.current === transitionId) {
          delete document.documentElement.dataset.appearanceTabDirection;
        }
      };
      void transition.finished.then(clearDirection, clearDirection);
    } catch {
      delete document.documentElement.dataset.appearanceTabDirection;
      setActiveTab(nextTab);
    }
  };

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentTab: StudioTab
  ) => {
    const currentIndex = STUDIO_TABS.findIndex((tab) => tab.id === currentTab);
    let nextIndex: number | undefined;

    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % STUDIO_TABS.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + STUDIO_TABS.length) % STUDIO_TABS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = STUDIO_TABS.length - 1;
    }

    if (nextIndex === undefined) return;

    event.preventDefault();
    const nextTab = STUDIO_TABS[nextIndex].id;
    tabButtonRefs.current[nextTab]?.focus();
    selectTab(nextTab, true);
  };

  const handlePanelTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest(
        'button, a, input, textarea, select, [role="switch"], [role="slider"], [contenteditable="true"]'
      )
    ) {
      swipeStartRef.current = null;
      return;
    }

    const touch = event.touches[0];
    swipeStartRef.current = touch
      ? { x: touch.clientX, y: touch.clientY }
      : null;
  };

  const handlePanelTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 56 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) {
      return;
    }

    const activeIndex = STUDIO_TABS.findIndex((tab) => tab.id === activeTab);
    const nextIndex = activeIndex + (deltaX < 0 ? 1 : -1);
    const nextTab = STUDIO_TABS[nextIndex];
    if (nextTab) {
      selectTab(nextTab.id, true);
      recordSwipe('appearance');
      setShowSwipeHint(false);
    }
  };

  const activeLineWidth = LINE_WIDTH_OPTIONS.find(
    (option) => option.id === preferences.lineWidth
  )!;

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
  const activeAccentPreset = ACCENT_PRESETS.find(
    (preset) =>
      preset.color.toLowerCase() === preferences.customAccent?.toLowerCase()
  );
  const currentAccentLabel = activeAccentPreset?.label ?? 'Custom color';
  const currentAccentColor = preferences.customAccent ?? '#FF6600';

  const renderThemeTile = (
    t: (typeof THEMES)[ThemeId],
    onSelect?: () => void,
    sheetRow = false,
    selectedThemeId = preferences.themeId
  ) => {
    const isSelected = selectedThemeId === t.id;
    return (
      <button
        key={t.id}
        type="button"
        onClick={() => {
          handleSelectPalette(t.id as ThemeId);
          onSelect?.();
        }}
        aria-pressed={isSelected}
        title={t.inspiration}
        style={{
          backgroundColor: t.colors.bgCanvas,
          color: t.colors.textPrimary,
          borderColor: isSelected ? 'var(--accent)' : t.colors.borderSubtle,
          boxShadow: isSelected ? '0 0 0 1px var(--accent)' : undefined,
        }}
        className={`w-full ${sheetRow ? 'min-h-14 px-4 gap-3 border' : 'px-3 py-2.5 gap-2 border'} rounded-xl text-left cursor-pointer flex items-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]`}
      >
        {sheetRow && (
          <span
            aria-hidden="true"
            className="material-symbols-rounded text-[18px] shrink-0"
            style={{ color: t.colors.accent }}
          >
            palette
          </span>
        )}
        <span
          className={`min-w-0 flex-1 ${sheetRow ? 'text-sm' : 'text-[13px]'} font-medium truncate`}
        >
          {t.name}
        </span>
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
        {sheetRow && isSelected && (
          <span aria-hidden="true" className="material-symbols-rounded">
            check
          </span>
        )}
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
    <div
      style={{ borderColor: 'var(--border-subtle)' }}
      className="flex items-center justify-between gap-3 py-4 sm:py-5 border-b"
    >
      <h2 className="text-base font-medium">{title}</h2>
      <button
        type="button"
        disabled={!enabled}
        onClick={onReset}
        aria-label={`Reset ${title.toLowerCase()} settings`}
        title={`Reset ${title.toLowerCase()} settings`}
        style={{ color: enabled ? 'var(--accent)' : 'var(--text-muted)' }}
        className={`${resetLinkClass(enabled)} max-sm:!w-9 max-sm:!h-9 max-sm:!p-0 max-sm:!justify-center`}
      >
        <span className="material-symbols-rounded text-[15px]">history</span>
        <span className="max-sm:hidden">Reset</span>
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
      <div
        style={{ borderColor: 'var(--border-subtle)' }}
        className="space-y-3 py-5 border-b"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-medium">{title}</div>
          {items.length > 0 && (
            <button
              type="button"
              aria-label={`Clear all ${title.toLowerCase()}`}
              title={`Clear all ${title.toLowerCase()}`}
              onClick={() => commit([])}
              style={{ color: 'var(--accent)' }}
              className="liquid-glass h-7 px-3 rounded-full text-xs font-semibold cursor-pointer active:scale-95 max-sm:!w-8 max-sm:!h-8 max-sm:!p-0 max-sm:inline-flex max-sm:items-center max-sm:justify-center"
            >
              <span className="hidden sm:inline">Clear all</span>
              <span
                aria-hidden="true"
                className="material-symbols-rounded hidden max-sm:inline text-[18px]"
              >
                delete_sweep
              </span>
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
          <div className="hidden sm:block">
            <GlassButton
              variant="primary"
              icon="add"
              onClick={add}
              aria-label={`Add ${title.toLowerCase()}`}
            >
              Add
            </GlassButton>
          </div>
          <div className="sm:hidden">
            <GlassButton
              variant="glass"
              icon="add"
              iconAccent
              onClick={add}
              aria-label={`Add ${title.toLowerCase()}`}
              className="!w-9 !h-9 !p-0 !justify-center"
            />
          </div>
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
                  aria-label={`Remove ${item} from ${title.toLowerCase()}`}
                  title={`Remove ${item}`}
                  onClick={() => commit(items.filter((i) => i !== item))}
                  className="w-7 h-7 shrink-0 inline-flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-surface-active)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  <span
                    aria-hidden="true"
                    className="material-symbols-rounded text-[14px]"
                  >
                    close
                  </span>
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
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-8 xl:px-10 pt-3 pb-0 sm:py-3 grid grid-cols-[1fr_auto] sm:grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2">
          <div className="col-start-1 row-start-1 flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              title="Return to stories (Esc or t)"
              aria-label="Return to stories"
              className="liquid-glass hidden sm:inline-flex sm:h-8 sm:px-3 rounded-full items-center justify-center gap-1.5"
            >
              <span className="material-symbols-rounded text-[18px]">
                arrow_back
              </span>
              <span className="hidden sm:inline text-xs font-semibold">
                Back
              </span>
            </button>
            <h1 className="text-lg font-medium tracking-tight">Appearance</h1>
          </div>

          <div
            role="tablist"
            aria-label="Appearance sections"
            aria-orientation="horizontal"
            ref={tablistRef}
            className="relative col-span-2 row-start-2 grid grid-cols-3 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:inline-flex sm:justify-self-center sm:items-center sm:gap-0.5 sm:rounded-full sm:border sm:border-transparent sm:bg-[var(--bg-surface-2)] sm:p-1"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <span
              ref={tabIndicatorRef}
              aria-hidden="true"
              className="appearance-tab-indicator pointer-events-none absolute z-0"
            />
            {STUDIO_TABS.map((tab) => {
              const isSelected = activeTab === tab.id;
              const tabName =
                tab.id === 'filters' && filterBadgeCount > 0
                  ? `Filters, ${filterBadgeCount} active filters`
                  : tab.label;
              return (
                <button
                  key={tab.id}
                  ref={(element) => {
                    tabButtonRefs.current[tab.id] = element ?? undefined;
                  }}
                  id={`appearance-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-label={tabName}
                  aria-selected={isSelected}
                  aria-controls="appearance-panel"
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => selectTab(tab.id, true)}
                  onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
                  className={`relative z-10 min-w-0 min-h-11 sm:min-h-8 px-1 sm:px-3 sm:py-1.5 border-b-2 border-transparent -mb-px sm:border-0 sm:mb-0 sm:rounded-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)] ${
                    isSelected
                      ? 'text-[var(--accent)] sm:text-white sm:font-bold'
                      : 'text-[var(--text-secondary)] hover:bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)]'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="material-symbols-rounded text-[16px]"
                  >
                    {tab.icon}
                  </span>
                  <span className="truncate">{tab.label}</span>
                  {tab.id === 'filters' && filterBadgeCount > 0 && (
                    <span
                      aria-hidden="true"
                      className={`min-w-4 h-4 px-1 rounded-full text-[9px] inline-flex items-center justify-center ${
                        isSelected
                          ? 'bg-[color-mix(in_srgb,var(--accent)_75%,white)] text-white'
                          : 'bg-[var(--accent)] text-white'
                      }`}
                    >
                      {filterBadgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            disabled={!isAnyModified}
            onClick={handleResetAll}
            title="Reset theme, text, and filters to defaults"
            aria-label="Reset all appearance settings"
            style={{
              color: isAnyModified ? 'var(--accent)' : 'var(--text-muted)',
            }}
            className={`${resetLinkClass(isAnyModified)} col-start-2 row-start-1 max-sm:!w-9 max-sm:!h-9 max-sm:!p-0 max-sm:!justify-center sm:col-start-3 sm:row-start-1`}
          >
            <span className="material-symbols-rounded text-[16px]">
              restart_alt
            </span>
            <span className="max-sm:hidden">Reset all</span>
          </button>
        </div>
      </div>
      <MobileBottomSheet
        isOpen={isLightThemesSheetOpen && isOpen}
        onClose={() => setIsLightThemesSheetOpen(false)}
        title="Light themes"
        ariaLabel="Choose a light theme"
        triggerRef={lightThemesTriggerRef}
      >
        {lightThemes.map((theme) =>
          renderThemeTile(theme, () => setIsLightThemesSheetOpen(false), true)
        )}
      </MobileBottomSheet>
      <MobileBottomSheet
        isOpen={isDarkThemesSheetOpen && isOpen}
        onClose={() => setIsDarkThemesSheetOpen(false)}
        title="Dark themes"
        ariaLabel="Choose a dark theme"
        triggerRef={darkThemesTriggerRef}
      >
        {darkThemes.map((theme) =>
          renderThemeTile(theme, () => setIsDarkThemesSheetOpen(false), true)
        )}
      </MobileBottomSheet>
      <MobileBottomSheet
        isOpen={isAccentSheetOpen && isOpen}
        onClose={() => setIsAccentSheetOpen(false)}
        title="Accent color"
        ariaLabel="Choose an accent color"
        triggerRef={accentTriggerRef}
      >
        {ACCENT_PRESETS.map((preset) => {
          const isSelected =
            preferences.customAccent?.toLowerCase() ===
            preset.color.toLowerCase();
          return (
            <button
              key={preset.id}
              type="button"
              aria-current={isSelected ? 'true' : undefined}
              onClick={() => {
                onUpdate({ ...preferences, customAccent: preset.color });
                setIsAccentSheetOpen(false);
              }}
              className="w-full min-h-12 px-4 rounded-xl flex items-center gap-3 text-left font-medium"
              style={{
                backgroundColor: isSelected
                  ? 'var(--bg-surface-active)'
                  : undefined,
                color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
              }}
            >
              <span
                aria-hidden="true"
                className="w-6 h-6 rounded-full border border-black/15"
                style={{ backgroundColor: preset.color }}
              />
              <span className="min-w-0 flex-1">{preset.label}</span>
              {isSelected && (
                <span aria-hidden="true" className="material-symbols-rounded">
                  check
                </span>
              )}
            </button>
          );
        })}
      </MobileBottomSheet>
      <MobileBottomSheet
        isOpen={isLineWidthSheetOpen && isOpen}
        onClose={() => setIsLineWidthSheetOpen(false)}
        title="Reading width"
        ariaLabel="Choose a reading width"
        triggerRef={lineWidthTriggerRef}
      >
        {LINE_WIDTH_OPTIONS.map((option) => {
          const isSelected = preferences.lineWidth === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-current={isSelected ? 'true' : undefined}
              onClick={() => {
                onUpdate({ ...preferences, lineWidth: option.id });
                setIsLineWidthSheetOpen(false);
              }}
              className="w-full min-h-12 px-4 rounded-xl flex items-center gap-3 text-left font-medium"
              style={{
                backgroundColor: isSelected
                  ? 'var(--bg-surface-active)'
                  : undefined,
                color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
              }}
            >
              <span aria-hidden="true" className="material-symbols-rounded">
                {option.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm">{option.label}</span>
                <span
                  className="block text-xs font-normal"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {option.description}
                </span>
              </span>
              {isSelected && (
                <span aria-hidden="true" className="material-symbols-rounded">
                  check
                </span>
              )}
            </button>
          );
        })}
      </MobileBottomSheet>
      <MobileBottomSheet
        isOpen={isFontSheetOpen && isOpen}
        onClose={() => setIsFontSheetOpen(false)}
        title="Choose a font"
        ariaLabel="Choose a font family"
        triggerRef={fontTriggerRef}
      >
        {(Object.keys(FONT_FAMILIES) as FontFamilyId[]).map((fontId) => {
          const isSelected = preferences.fontFamily === fontId;
          return (
            <button
              key={fontId}
              type="button"
              aria-current={isSelected ? 'true' : undefined}
              onClick={() => {
                onUpdate({ ...preferences, fontFamily: fontId });
                setIsFontSheetOpen(false);
              }}
              className="w-full min-h-12 px-4 rounded-xl flex items-center gap-3 text-left font-medium"
              style={{
                backgroundColor: isSelected
                  ? 'var(--bg-surface-active)'
                  : undefined,
                color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                fontFamily: FONT_FAMILIES[fontId].cssValue,
              }}
            >
              <span aria-hidden="true" className="text-lg font-semibold">
                Aa
              </span>
              <span>{FONT_FAMILIES[fontId].label}</span>
              {isSelected && (
                <span
                  aria-hidden="true"
                  className="material-symbols-rounded ml-auto"
                >
                  check
                </span>
              )}
            </button>
          );
        })}
      </MobileBottomSheet>

      {/* Scrollable Body */}
      <div className="custom-scrollbar flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="max-w-[1400px] w-full mx-auto px-3 sm:px-8 xl:px-10 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-14 items-start">
            {/* Controls */}
            <div className="lg:col-span-7">
              <div
                id="appearance-panel"
                role="tabpanel"
                aria-labelledby={`appearance-tab-${activeTab}`}
                tabIndex={0}
                onTouchStart={handlePanelTouchStart}
                onTouchEnd={handlePanelTouchEnd}
                onTouchCancel={() => {
                  swipeStartRef.current = null;
                }}
                className="appearance-tab-panel touch-pan-y outline-none"
              >
                {activeTab === 'themes' && (
                  <div className="appearance-tab-content">
                    {sectionTitle('Theme', isThemesModified, handleResetThemes)}

                    {/* Mode */}
                    <div
                      style={rowDivider}
                      className="flex flex-wrap items-center justify-between gap-3 py-5 border-b"
                    >
                      <div>
                        <div className="text-sm font-medium">Mode</div>
                        <div
                          style={{ color: 'var(--text-muted)' }}
                          className="text-xs mt-0.5"
                        >
                          {THEMES[lightThemeId].name} /{' '}
                          {THEMES[darkThemeId].name}
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <GlassSegmentedControl<ThemeMode>
                          size="sm"
                          value={currentMode}
                          onChange={handleSelectMode}
                          items={[
                            {
                              id: 'light',
                              label: 'Light',
                              icon: 'light_mode',
                            },
                            {
                              id: 'system',
                              label: 'System',
                              icon: 'contrast',
                            },
                            { id: 'dark', label: 'Dark', icon: 'dark_mode' },
                          ]}
                        />
                      </div>
                      <div className="sm:hidden">
                        <GlassSegmentedControl<ThemeMode>
                          size="sm"
                          value={currentMode}
                          onChange={handleSelectMode}
                          items={[
                            {
                              id: 'light',
                              icon: 'light_mode',
                              title: 'Light mode',
                            },
                            {
                              id: 'system',
                              icon: 'contrast',
                              title: 'System mode',
                            },
                            {
                              id: 'dark',
                              icon: 'dark_mode',
                              title: 'Dark mode',
                            },
                          ]}
                        />
                      </div>
                    </div>

                    {/* Accent */}
                    <div style={rowDivider} className="py-5 border-b space-y-3">
                      <div className="hidden sm:block text-sm font-medium">
                        Accent color
                      </div>
                      <div className="hidden sm:flex flex-wrap items-center gap-2.5">
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
                            value={currentAccentColor}
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
                      <div className="sm:hidden flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">
                            Accent color
                          </div>
                          <div
                            className="mt-0.5 truncate text-xs"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Choose an accent preset
                          </div>
                        </div>
                        <button
                          ref={accentTriggerRef}
                          type="button"
                          aria-haspopup="dialog"
                          aria-expanded={isAccentSheetOpen}
                          aria-label={`Choose accent color. Current: ${currentAccentLabel}`}
                          title={currentAccentLabel}
                          onClick={() => setIsAccentSheetOpen(true)}
                          className="liquid-glass min-h-11 max-w-[58%] shrink-0 px-3 rounded-xl inline-flex items-center gap-2 text-left text-xs font-medium"
                        >
                          <span
                            aria-hidden="true"
                            className="w-4 h-4 shrink-0 rounded-full border border-black/15"
                            style={{ backgroundColor: currentAccentColor }}
                          />
                          <span className="min-w-0 truncate">
                            {currentAccentLabel}
                          </span>
                          <span
                            aria-hidden="true"
                            className="material-symbols-rounded shrink-0 text-[17px]"
                          >
                            expand_more
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Mobile palette pickers */}
                    <div className="sm:hidden">
                      <div
                        className="flex items-center justify-between gap-3 py-5 border-b"
                        style={rowDivider}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">
                            Light appearance
                          </div>
                          <div
                            className="mt-0.5 truncate text-xs"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Choose a light theme
                          </div>
                        </div>
                        <button
                          ref={lightThemesTriggerRef}
                          type="button"
                          aria-haspopup="dialog"
                          aria-expanded={isLightThemesSheetOpen}
                          aria-label={`Choose light theme. Current: ${THEMES[lightThemeId].name}`}
                          title={THEMES[lightThemeId].name}
                          onClick={() => setIsLightThemesSheetOpen(true)}
                          className="liquid-glass min-h-11 max-w-[58%] shrink-0 px-3 rounded-xl inline-flex items-center gap-2 text-left text-xs font-medium"
                        >
                          <span
                            aria-hidden="true"
                            className="material-symbols-rounded shrink-0 text-[17px]"
                            style={{ color: 'var(--accent)' }}
                          >
                            light_mode
                          </span>
                          <span className="min-w-0 truncate">
                            {THEMES[lightThemeId].name}
                          </span>
                          <span
                            aria-hidden="true"
                            className="material-symbols-rounded shrink-0 text-[17px]"
                          >
                            expand_more
                          </span>
                        </button>
                      </div>
                      <div
                        className="flex items-center justify-between gap-3 py-5 border-b"
                        style={rowDivider}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">
                            Dark appearance
                          </div>
                          <div
                            className="mt-0.5 truncate text-xs"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Choose a dark theme
                          </div>
                        </div>
                        <button
                          ref={darkThemesTriggerRef}
                          type="button"
                          aria-haspopup="dialog"
                          aria-expanded={isDarkThemesSheetOpen}
                          aria-label={`Choose dark theme. Current: ${THEMES[darkThemeId].name}`}
                          title={THEMES[darkThemeId].name}
                          onClick={() => setIsDarkThemesSheetOpen(true)}
                          className="liquid-glass min-h-11 max-w-[58%] shrink-0 px-3 rounded-xl inline-flex items-center gap-2 text-left text-xs font-medium"
                        >
                          <span
                            aria-hidden="true"
                            className="material-symbols-rounded shrink-0 text-[17px]"
                            style={{ color: 'var(--accent)' }}
                          >
                            dark_mode
                          </span>
                          <span className="min-w-0 truncate">
                            {THEMES[darkThemeId].name}
                          </span>
                          <span
                            aria-hidden="true"
                            className="material-symbols-rounded shrink-0 text-[17px]"
                          >
                            expand_more
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Desktop palettes */}
                    <div
                      style={rowDivider}
                      className="hidden sm:block py-5 border-b"
                    >
                      {groupLabel('Light')}
                      <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5">
                        {lightThemes.map((theme) => renderThemeTile(theme))}
                      </div>
                    </div>
                    <div
                      style={rowDivider}
                      className="hidden sm:block py-5 border-b"
                    >
                      {groupLabel('Dark')}
                      <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5">
                        {darkThemes.map((theme) => renderThemeTile(theme))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'typography' && (
                  <div className="appearance-tab-content">
                    {sectionTitle(
                      'Text',
                      isTypographyModified,
                      handleResetTypography
                    )}

                    <div style={rowDivider} className="py-5 border-b">
                      <div className="sm:hidden flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">Font</div>
                          <div
                            className="mt-0.5 truncate text-xs"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Choose a reading typeface
                          </div>
                        </div>
                        <button
                          ref={fontTriggerRef}
                          type="button"
                          aria-haspopup="dialog"
                          aria-expanded={isFontSheetOpen}
                          aria-label={`Choose font. Current: ${FONT_FAMILIES[preferences.fontFamily].label}`}
                          title={FONT_FAMILIES[preferences.fontFamily].label}
                          onClick={() => setIsFontSheetOpen(true)}
                          className="liquid-glass min-h-11 max-w-[58%] shrink-0 px-3 rounded-xl inline-flex items-center gap-2 text-left text-xs font-medium"
                        >
                          <span
                            aria-hidden="true"
                            className="text-base font-semibold"
                            style={{
                              color: 'var(--accent)',
                              fontFamily:
                                FONT_FAMILIES[preferences.fontFamily].cssValue,
                            }}
                          >
                            Aa
                          </span>
                          <span className="min-w-0 truncate">
                            {FONT_FAMILIES[preferences.fontFamily].label}
                          </span>
                          <span
                            aria-hidden="true"
                            className="material-symbols-rounded shrink-0 text-[17px]"
                          >
                            expand_more
                          </span>
                        </button>
                      </div>
                      <div className="hidden sm:block">
                        {groupLabel('Font')}
                      </div>
                      <div className="hidden sm:grid grid-cols-2 gap-2.5">
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

                    <div
                      style={rowDivider}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 py-5 border-b"
                    >
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

                    <div
                      style={rowDivider}
                      className="flex flex-wrap items-center justify-between gap-3 py-5 border-b"
                    >
                      <div>
                        <div className="text-sm font-medium">Reading width</div>
                        <div
                          style={{ color: 'var(--text-muted)' }}
                          className="text-xs mt-0.5"
                        >
                          Column width for comments and reader mode
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <GlassSegmentedControl<LineWidthOption>
                          size="sm"
                          value={preferences.lineWidth}
                          onChange={(width) =>
                            onUpdate({ ...preferences, lineWidth: width })
                          }
                          items={LINE_WIDTH_OPTIONS}
                        />
                      </div>
                      <button
                        ref={lineWidthTriggerRef}
                        type="button"
                        aria-haspopup="dialog"
                        aria-expanded={isLineWidthSheetOpen}
                        aria-label={`Choose reading width. Current: ${activeLineWidth.label}`}
                        onClick={() => setIsLineWidthSheetOpen(true)}
                        className="liquid-glass sm:hidden min-h-11 px-3.5 rounded-xl inline-flex items-center gap-2 text-sm font-medium"
                      >
                        <span
                          className="material-symbols-rounded text-[17px]"
                          style={{ color: 'var(--accent)' }}
                        >
                          {activeLineWidth.icon}
                        </span>
                        <span>{activeLineWidth.label}</span>
                        <span
                          aria-hidden="true"
                          className="material-symbols-rounded text-[17px]"
                        >
                          expand_more
                        </span>
                      </button>
                    </div>

                    <div
                      style={rowDivider}
                      className="flex flex-wrap items-center justify-between gap-3 py-5 border-b"
                    >
                      <div>
                        <div className="text-sm font-medium">Card density</div>
                        <div
                          style={{ color: 'var(--text-muted)' }}
                          className="text-xs mt-0.5"
                        >
                          Compact feed rows and discussion cards
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <GlassSegmentedControl<CardDensity>
                          size="sm"
                          value={preferences.cardDensity ?? 'comfortable'}
                          onChange={(density) =>
                            onUpdate({ ...preferences, cardDensity: density })
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
                      <div className="sm:hidden">
                        <GlassSegmentedControl<CardDensity>
                          size="sm"
                          value={preferences.cardDensity ?? 'comfortable'}
                          onChange={(density) =>
                            onUpdate({ ...preferences, cardDensity: density })
                          }
                          items={[
                            {
                              id: 'comfortable',
                              icon: 'view_agenda',
                              title: 'Comfortable card density',
                            },
                            {
                              id: 'compact',
                              icon: 'view_headline',
                              title: 'Compact card density',
                            },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'filters' && (
                  <div className="appearance-tab-content">
                    {sectionTitle(
                      'Filters',
                      isFiltersModified,
                      handleResetFilters
                    )}

                    <div style={rowDivider} className="py-5 border-b">
                      <GlassSwitch
                        label="Hide read stories"
                        description="Remove stories from the feed once opened"
                        checked={preferences.hideReadStories}
                        onChange={(checked) =>
                          onUpdate({ ...preferences, hideReadStories: checked })
                        }
                      />
                    </div>

                    {renderMuteList(
                      'Muted keywords',
                      'e.g. crypto, layoff',
                      keywordInput,
                      setKeywordInput,
                      preferences.mutedKeywords,
                      (next) =>
                        onUpdate({ ...preferences, mutedKeywords: next })
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
            </div>

            {/* Live Preview */}
            <aside className="hidden sm:block lg:col-span-5 lg:sticky lg:top-6 space-y-4">
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
      {showSwipeHint && (
        <div className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-40 -translate-x-1/2 sm:hidden">
          <div className="swipe-hint-pill liquid-glass rounded-full h-8 px-3.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)] shadow-lg whitespace-nowrap">
            <span
              aria-hidden="true"
              className="swipe-hint-icon material-symbols-rounded text-[16px] text-[var(--accent)]"
            >
              swipe
            </span>
            <span>Swipe to switch sections</span>
          </div>
        </div>
      )}
    </div>
  );
};
