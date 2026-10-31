'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { FeedType, LayoutMode } from '@/types/hn';
import {
  TimeTravelPopover,
  TimeTravelPreset,
} from '@/components/modals/TimeTravelPopover';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassSegmentedControl } from '@/components/ui/GlassSegmentedControl';
import { MobileBottomSheet } from '@/components/ui/MobileBottomSheet';

interface AppHeaderProps {
  activeFeed: FeedType;
  onSelectFeed: (feed: FeedType) => void;
  layoutMode: LayoutMode;
  onToggleLayoutMode: () => void;
  timeTravelPreset: TimeTravelPreset;
  onSelectTimeTravel: (preset: TimeTravelPreset) => void;
  onOpenSearch: () => void;
  isAppearanceOpen?: boolean;
  onOpenAppearance: () => void;
  onOpenShortcuts: () => void;
  savedCount: number;
  isStoryOpen: boolean;
  onBackToFeed: () => void;
  onBackFromAppearance: () => void;
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
  isAppearanceOpen = false,
  onOpenAppearance,
  onOpenShortcuts,
  savedCount,
  isStoryOpen,
  onBackToFeed,
  onBackFromAppearance,
}) => {
  const [isFeedSheetOpen, setIsFeedSheetOpen] = useState(false);
  const feedTriggerRef = useRef<HTMLButtonElement>(null);
  const backActionVisible = isStoryOpen || isAppearanceOpen;
  const previousBackActionRef = useRef(backActionVisible);
  const [logoBackAnimation, setLogoBackAnimation] = useState<
    'enter' | 'exit' | null
  >(null);
  const activeFeedTab = FEED_TABS.find((tab) => tab.id === activeFeed)!;

  useLayoutEffect(() => {
    if (previousBackActionRef.current === backActionVisible) return;
    previousBackActionRef.current = backActionVisible;
    setLogoBackAnimation(backActionVisible ? 'enter' : 'exit');
  }, [backActionVisible]);

  return (
    <header
      style={{
        backgroundColor:
          'color-mix(in srgb, var(--bg-surface-1) 86%, transparent)',
        borderColor: 'var(--border-subtle)',
      }}
      className="sticky top-0 z-40 backdrop-blur-xl border-b px-2.5 sm:px-4 py-2.5 flex items-center gap-2 shrink-0 min-w-0"
    >
      {(isStoryOpen || isAppearanceOpen) && (
        <button
          type="button"
          onClick={isStoryOpen ? onBackToFeed : onBackFromAppearance}
          aria-label={isStoryOpen ? 'Back to feed' : 'Back from appearance'}
          className="liquid-glass lg:hidden w-10 h-10 rounded-full shrink-0 inline-flex items-center justify-center"
        >
          <span
            aria-hidden="true"
            className="material-symbols-rounded text-[22px]"
          >
            arrow_back
          </span>
        </button>
      )}
      <div
        aria-label="HN Revamped"
        className={`liquid-glass-primary lg:hidden w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-black text-sm ${
          logoBackAnimation
            ? `mobile-header-logo-back-${logoBackAnimation}`
            : ''
        }`}
      >
        Y
      </div>
      {!isStoryOpen && !isAppearanceOpen && (
        <button
          ref={feedTriggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isFeedSheetOpen}
          onClick={() => setIsFeedSheetOpen(true)}
          className="liquid-glass lg:hidden h-10 rounded-full px-2.5 inline-flex items-center gap-1 text-xs font-semibold shrink-0"
        >
          <span
            aria-hidden="true"
            className="material-symbols-rounded text-[19px]"
            style={{ color: 'var(--accent)' }}
          >
            {activeFeedTab.icon}
          </span>
          <span>{activeFeedTab.label}</span>
          <span
            aria-hidden="true"
            className="material-symbols-rounded text-[16px]"
          >
            expand_more
          </span>
        </button>
      )}
      <div className="hidden lg:flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2.5 pr-1 shrink-0">
          <div className="liquid-glass-primary w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm">
            Y
          </div>
          <span className="font-bold text-base tracking-tight">
            HN Revamped
          </span>
        </div>
        <nav aria-label="Story Feeds">
          <GlassSegmentedControl
            size="sm"
            value={activeFeed}
            onChange={onSelectFeed}
            items={FEED_TABS.map((tab) => ({
              id: tab.id,
              label: tab.label,
              icon: tab.icon,
              badge:
                tab.id === 'saved' && savedCount > 0 ? savedCount : undefined,
            }))}
          />
        </nav>
      </div>
      <div className="ml-auto flex items-center justify-end gap-1.5 sm:gap-2 min-w-0">
        <button
          type="button"
          aria-label="Search Hacker News"
          onClick={onOpenSearch}
          className="liquid-glass lg:hidden w-10 h-10 rounded-full shrink-0 inline-flex items-center justify-center"
        >
          <span
            aria-hidden="true"
            className="material-symbols-rounded text-[23px]"
          >
            search
          </span>
        </button>
        <div className="hidden lg:block">
          <GlassButton
            icon="search"
            shortcut="⌘K"
            onClick={onOpenSearch}
            title="Search Hacker News (⌘K or /)"
          >
            Search
          </GlassButton>
        </div>
        <div className="hidden lg:block">
          <TimeTravelPopover
            activePreset={timeTravelPreset}
            onSelectPreset={onSelectTimeTravel}
          />
        </div>
        <div className="lg:hidden">
          <TimeTravelPopover
            mobileSheet
            activePreset={timeTravelPreset}
            onSelectPreset={onSelectTimeTravel}
          />
        </div>
        <div className="hidden lg:block">
          <GlassButton
            variant={isAppearanceOpen ? 'primary' : 'glass'}
            icon="palette"
            iconAccent={!isAppearanceOpen}
            onClick={onOpenAppearance}
            title="Theme, Typography & Filter Studio (t)"
          >
            Appearance
          </GlassButton>
        </div>
        <button
          type="button"
          aria-label="Appearance settings"
          title="Appearance settings"
          onClick={onOpenAppearance}
          className="liquid-glass lg:hidden w-10 h-10 rounded-full shrink-0 inline-flex items-center justify-center"
        >
          <span
            aria-hidden="true"
            className="material-symbols-rounded text-[20px]"
            style={{ color: isAppearanceOpen ? 'var(--accent)' : undefined }}
          >
            settings
          </span>
        </button>
        <div className="hidden lg:block">
          <GlassSegmentedControl
            size="sm"
            value={layoutMode}
            onChange={(mode) => {
              if (mode !== layoutMode) onToggleLayoutMode();
            }}
            items={[
              {
                id: 'split',
                icon: 'vertical_split',
                title: 'Split-Pane Mode (z)',
              },
              {
                id: 'zen',
                icon: 'width_normal',
                title: 'Centered Zen Mode (z)',
              },
            ]}
          />
        </div>
        <div className="hidden lg:block">
          <GlassButton
            variant="icon"
            icon="keyboard"
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts (?)"
            aria-label="Keyboard Shortcuts"
          />
        </div>
      </div>
      <MobileBottomSheet
        isOpen={isFeedSheetOpen}
        onClose={() => setIsFeedSheetOpen(false)}
        title="Choose a feed"
        ariaLabel="Choose a story feed"
        triggerRef={feedTriggerRef}
      >
        {FEED_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-current={tab.id === activeFeed ? 'true' : undefined}
            onClick={() => {
              onSelectFeed(tab.id);
              setIsFeedSheetOpen(false);
            }}
            className="w-full min-h-12 px-4 rounded-xl flex items-center gap-3 text-left font-medium"
            style={{
              backgroundColor:
                tab.id === activeFeed ? 'var(--bg-surface-active)' : undefined,
              color:
                tab.id === activeFeed ? 'var(--accent)' : 'var(--text-primary)',
            }}
          >
            <span aria-hidden="true" className="material-symbols-rounded">
              {tab.icon}
            </span>
            <span>{tab.label}</span>
            {tab.id === 'saved' && savedCount > 0 && (
              <span className="text-xs">{savedCount}</span>
            )}
            {tab.id === activeFeed && (
              <span
                aria-hidden="true"
                className="material-symbols-rounded ml-auto"
              >
                check
              </span>
            )}
          </button>
        ))}
      </MobileBottomSheet>
    </header>
  );
};
