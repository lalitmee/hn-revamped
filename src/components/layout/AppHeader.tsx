'use client';

import React from 'react';
import { FeedType, LayoutMode } from '@/types/hn';
import {
  TimeTravelPopover,
  TimeTravelPreset,
} from '@/components/modals/TimeTravelPopover';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassSegmentedControl } from '@/components/ui/GlassSegmentedControl';

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
}) => {
  return (
    <header
      style={{
        backgroundColor:
          'color-mix(in srgb, var(--bg-surface-1) 86%, transparent)',
        borderColor: 'var(--border-subtle)',
      }}
      className="sticky top-0 z-40 backdrop-blur-xl border-b px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0"
    >
      {/* Left: Brand + Gliding Feed Category Segmented Pill */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2.5 pr-1 shrink-0">
          <div className="liquid-glass-primary w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm">
            Y
          </div>
          <span className="font-bold text-base tracking-tight hidden sm:inline">
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

      {/* Right: Uniform Liquid Glass Toolbar Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <TimeTravelPopover
          activePreset={timeTravelPreset}
          onSelectPreset={onSelectTimeTravel}
        />

        <GlassButton
          icon="search"
          shortcut="⌘K"
          onClick={onOpenSearch}
          title="Search Hacker News (⌘K or /)"
        >
          <span className="hidden md:inline">Search</span>
        </GlassButton>

        <GlassButton
          variant={isAppearanceOpen ? 'primary' : 'glass'}
          icon="palette"
          iconAccent={!isAppearanceOpen}
          onClick={onOpenAppearance}
          title="Theme, Typography & Filter Studio (t)"
        >
          <span className="hidden sm:inline">Appearance</span>
        </GlassButton>

        {/* Icon-Only Gliding Split ⇄ Zen Switcher */}
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

        <GlassButton
          variant="icon"
          icon="keyboard"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (?)"
          aria-label="Keyboard Shortcuts"
        />
      </div>
    </header>
  );
};
