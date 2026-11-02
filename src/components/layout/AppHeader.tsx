'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [portalReady, setPortalReady] = useState(false);
  const feedTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressFeedClickRef = useRef(false);
  const backActionVisible = isStoryOpen || isAppearanceOpen;
  const previousBackActionRef = useRef(backActionVisible);
  const [logoBackAnimation, setLogoBackAnimation] = useState<
    'enter' | 'exit' | null
  >(null);
  const [swipeAnimation, setSwipeAnimation] = useState<{
    direction: 'up' | 'down';
    fromIcon: string;
    toIcon: string;
  } | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeFeedTab = FEED_TABS.find((tab) => tab.id === activeFeed)!;

  useLayoutEffect(() => setPortalReady(true), []);

  useEffect(() => {
    return () => {
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    };
  }, []);

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
        className={`lg:hidden w-9 h-9 rounded-xl shrink-0 ${
          logoBackAnimation
            ? `mobile-header-logo-back-${logoBackAnimation}`
            : ''
        }`}
      >
        <img src="/icon.svg" alt="" className="w-full h-full rounded-xl" />
      </div>
      {!isStoryOpen && !isAppearanceOpen && (
        <button
          ref={feedTriggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isFeedSheetOpen}
          onClick={() => setIsFeedSheetOpen(true)}
          className="liquid-glass lg:hidden h-10 rounded-full px-3 inline-flex items-center gap-1.5 text-sm font-semibold shrink-0"
        >
          <span
            aria-hidden="true"
            className="material-symbols-rounded text-[20px]"
            style={{ color: 'var(--accent)' }}
          >
            {activeFeedTab.icon}
          </span>
          <span>{activeFeedTab.label}</span>
          <span
            aria-hidden="true"
            className="material-symbols-rounded text-[17px]"
          >
            expand_more
          </span>
        </button>
      )}
      {portalReady &&
        !isStoryOpen &&
        !isAppearanceOpen &&
        createPortal(
          <button
            type="button"
            aria-label={`Swipe up or down to switch feeds. Current feed: ${activeFeedTab.label}`}
            title="Swipe up or down to switch feeds"
            style={{
              touchAction: 'none',
              color: 'var(--text-primary)',
              backgroundColor:
                'color-mix(in srgb, var(--accent) 9%, var(--bg-surface-1))',
              borderColor:
                'color-mix(in srgb, var(--accent) 30%, var(--border-subtle))',
              transform: dragOffsetY
                ? `translateY(${dragOffsetY}px)`
                : undefined,
              transition: dragOffsetY ? 'none' : undefined,
            }}
            onTouchStart={(event) => {
              if (event.touches.length !== 1) return;
              const touch = event.touches[0];
              feedTouchStartRef.current = {
                x: touch.clientX,
                y: touch.clientY,
              };
              suppressFeedClickRef.current = false;
            }}
            onTouchMove={(event) => {
              if (event.touches.length !== 1 || !feedTouchStartRef.current)
                return;
              const touch = event.touches[0];
              const dy = touch.clientY - feedTouchStartRef.current.y;
              const dx = touch.clientX - feedTouchStartRef.current.x;
              if (Math.abs(dy) > Math.abs(dx)) {
                setDragOffsetY(Math.max(-14, Math.min(14, dy * 0.35)));
              }
            }}
            onTouchEnd={(event) => {
              const start = feedTouchStartRef.current;
              feedTouchStartRef.current = null;
              setDragOffsetY(0);
              if (!start || event.changedTouches.length !== 1) return;
              const touch = event.changedTouches[0];
              const dx = touch.clientX - start.x;
              const dy = touch.clientY - start.y;
              if (Math.abs(dy) < 24 || Math.abs(dy) <= Math.abs(dx)) return;
              suppressFeedClickRef.current = true;
              const index = FEED_TABS.findIndex((tab) => tab.id === activeFeed);
              const direction = dy < 0 ? 'up' : 'down';
              const nextIndex =
                (index + (direction === 'up' ? 1 : -1) + FEED_TABS.length) %
                FEED_TABS.length;
              const nextFeed = FEED_TABS[nextIndex];

              if (animationTimerRef.current) {
                clearTimeout(animationTimerRef.current);
              }
              setSwipeAnimation({
                direction,
                fromIcon: activeFeedTab.icon,
                toIcon: nextFeed.icon,
              });
              animationTimerRef.current = setTimeout(() => {
                setSwipeAnimation(null);
              }, 240);

              onSelectFeed(nextFeed.id);
            }}
            onTouchCancel={() => {
              feedTouchStartRef.current = null;
              setDragOffsetY(0);
            }}
            onClick={() => {
              if (suppressFeedClickRef.current) {
                suppressFeedClickRef.current = false;
                return;
              }
              feedTriggerRef.current?.click();
            }}
            className={`liquid-glass fixed bottom-[calc(env(safe-area-inset-bottom)+3.25rem)] right-6 z-40 lg:hidden w-14 h-14 rounded-full border shadow-[0_6px_20px_rgba(0,0,0,0.3),0_2px_6px_rgba(0,0,0,0.18)] flex items-center justify-center select-none transition-colors motion-reduce:transition-none ${
              swipeAnimation?.direction === 'up'
                ? 'swipe-button-nudge-up'
                : swipeAnimation?.direction === 'down'
                  ? 'swipe-button-nudge-down'
                  : ''
            }`}
          >
            <div className="relative w-8 h-8 flex items-center justify-center overflow-hidden pointer-events-none">
              {swipeAnimation ? (
                <>
                  <span
                    key={`from-${swipeAnimation.fromIcon}`}
                    aria-hidden="true"
                    className={`material-symbols-rounded text-[28px] absolute inset-0 flex items-center justify-center ${
                      swipeAnimation.direction === 'up'
                        ? 'swipe-icon-exit-up'
                        : 'swipe-icon-exit-down'
                    }`}
                    style={{ color: 'var(--accent)' }}
                  >
                    {swipeAnimation.fromIcon}
                  </span>
                  <span
                    key={`to-${swipeAnimation.toIcon}`}
                    aria-hidden="true"
                    className={`material-symbols-rounded text-[28px] absolute inset-0 flex items-center justify-center ${
                      swipeAnimation.direction === 'up'
                        ? 'swipe-icon-enter-up'
                        : 'swipe-icon-enter-down'
                    }`}
                    style={{ color: 'var(--accent)' }}
                  >
                    {swipeAnimation.toIcon}
                  </span>
                </>
              ) : (
                <span
                  aria-hidden="true"
                  className="material-symbols-rounded text-[28px]"
                  style={{ color: 'var(--accent)' }}
                >
                  {activeFeedTab.icon}
                </span>
              )}
            </div>
          </button>,
          document.body
        )}
      <div className="hidden lg:flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2.5 pr-1 shrink-0">
          <img src="/icon.svg" alt="" className="w-8 h-8 rounded-xl" />
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
