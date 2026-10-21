'use client';

import React from 'react';
import { FeedType, LayoutMode } from '@/types/hn';
import { TimeTravelPopover, TimeTravelPreset } from '@/components/modals/TimeTravelPopover';

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
        backgroundColor: 'var(--bg-surface-1)',
        borderColor: 'var(--border-subtle)',
      }}
      className="sticky top-0 z-30 border-b px-4 py-2.5 flex flex-wrap items-center justify-between gap-3"
    >
      {/* Brand + Feed Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto">
        <div className="flex items-center gap-2 pr-2">
          <div
            style={{ backgroundColor: 'var(--accent)' }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-sm shadow"
          >
            Y
          </div>
          <span className="font-bold text-base tracking-tight hidden sm:inline">
            HN Revamped
          </span>
        </div>

        <nav className="flex items-center gap-1">
          {FEED_TABS.map((tab) => {
            const isActive = activeFeed === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectFeed(tab.id)}
                style={{
                  backgroundColor: isActive ? 'var(--bg-surface-active)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition hover:bg-white/5"
              >
                <span className={`material-symbols-rounded text-[16px] ${isActive ? 'filled' : ''}`}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.id === 'saved' && savedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10">
                    {savedCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Studio Controls */}
      <div className="flex items-center gap-2">
        <TimeTravelPopover
          activePreset={timeTravelPreset}
          onSelectPreset={onSelectTimeTravel}
        />

        <button
          type="button"
          onClick={onOpenSearch}
          style={{
            backgroundColor: 'var(--bg-surface-2)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer"
        >
          <span className="material-symbols-rounded text-[16px]">search</span>
          <span className="hidden md:inline">Search</span>
          <kbd className="text-[10px] font-mono opacity-75">⌘K</kbd>
        </button>

        <button
          type="button"
          onClick={onOpenAppearance}
          title="Theme & Typography Studio (t)"
          style={{
            backgroundColor: 'var(--bg-surface-2)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer"
        >
          <span style={{ color: 'var(--accent)' }} className="material-symbols-rounded text-[16px]">
            palette
          </span>
          <span className="hidden sm:inline">Appearance</span>
        </button>

        <button
          type="button"
          onClick={onToggleLayoutMode}
          title="Toggle Split-Pane / Zen Mode (z)"
          style={{
            backgroundColor: 'var(--bg-surface-2)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--accent)',
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer"
        >
          <span className="material-symbols-rounded text-[16px]">
            {layoutMode === 'split' ? 'vertical_split' : 'width_normal'}
          </span>
          <span className="hidden sm:inline">
            {layoutMode === 'split' ? 'Split' : 'Zen'}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (?)"
          style={{
            backgroundColor: 'var(--bg-surface-2)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-muted)',
          }}
          className="p-1.5 rounded-xl border cursor-pointer"
        >
          <span className="material-symbols-rounded text-[16px]">keyboard</span>
        </button>
      </div>
    </header>
  );
};
