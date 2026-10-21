'use client';

import React from 'react';
import { FeedType, LayoutMode } from '@/types/hn';
import { TimeTravelPopover, TimeTravelPreset } from '@/components/modals/TimeTravelPopover';
import { GlassButton } from '@/components/ui/GlassButton';

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
        backgroundColor: 'color-mix(in srgb, var(--bg-surface-1) 82%, transparent)',
        borderColor: 'var(--border-subtle)',
      }}
      className="sticky top-0 z-30 backdrop-blur-xl border-b px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0"
    >
      {/* Left: Brand + Feed Category Pills */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2.5 pr-1 shrink-0">
          <div className="liquid-glass-primary w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm">
            Y
          </div>
          <span className="font-bold text-base tracking-tight hidden sm:inline">
            HN Revamped
          </span>
        </div>

        <nav className="liquid-glass p-1 rounded-2xl flex items-center gap-1">
          {FEED_TABS.map((tab) => {
            const isActive = activeFeed === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectFeed(tab.id)}
                style={{
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                }}
                className={`h-7 px-3 rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all select-none ${
                  isActive
                    ? 'liquid-glass-primary font-bold'
                    : 'hover:bg-white/5 font-semibold'
                }`}
              >
                <span
                  className={`material-symbols-rounded text-[15px] ${
                    isActive ? 'filled' : ''
                  }`}
                >
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.id === 'saved' && savedCount > 0 && (
                  <span
                    style={{
                      backgroundColor: isActive
                        ? 'rgba(255,255,255,0.25)'
                        : 'color-mix(in srgb, var(--accent) 20%, transparent)',
                      color: isActive ? '#ffffff' : 'var(--accent)',
                    }}
                    className="px-1.5 py-0.2 rounded-full text-[10px] font-bold leading-none"
                  >
                    {savedCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right: Uniform h-9 Liquid Glass Toolbar Controls */}
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
          icon="palette"
          iconAccent
          onClick={onOpenAppearance}
          title="Theme, Typography & Filter Studio (t)"
        >
          <span className="hidden sm:inline">Appearance</span>
        </GlassButton>

        <GlassButton
          icon={layoutMode === 'split' ? 'vertical_split' : 'width_normal'}
          iconAccent
          onClick={onToggleLayoutMode}
          title="Toggle Split-Pane / Zen Mode (z)"
        >
          <span className="hidden sm:inline">
            {layoutMode === 'split' ? 'Split' : 'Zen'}
          </span>
        </GlassButton>

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
