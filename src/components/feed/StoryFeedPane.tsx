'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FeedType, HNStory, ReadHistoryEntry } from '@/types/hn';
import { getNewCommentsDelta } from '@/lib/storage';
import { StoryPillRow } from './StoryPillRow';
import { FeedTransition } from './FeedTransition';

function StoryShimmer({ compact, index }: { compact: boolean; index: number }) {
  const placeholder = (className: string) => (
    <div
      aria-hidden="true"
      className={`rounded-full bg-[color-mix(in_srgb,var(--text-primary)_12%,transparent)] ${className}`}
    />
  );

  return (
    <div
      aria-hidden="true"
      style={{ animationDelay: `${index * 35}ms` }}
      className={`liquid-glass liquid-shimmer animate-story-in flex shrink-0 items-center ${
        compact
          ? 'h-[4.25rem] gap-3 rounded-xl px-2 py-1.5 sm:h-[4.5rem] sm:px-3 sm:py-2 sm:gap-3'
          : 'h-[4.75rem] gap-3 rounded-xl p-2 sm:h-[6.25rem] sm:gap-4 sm:rounded-2xl sm:p-4'
      }`}
    >
      <div
        className={`hidden shrink-0 rounded-lg bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] sm:block ${
          compact ? 'h-8 w-12' : 'h-[3.375rem] w-[3.25rem] rounded-xl'
        }`}
      />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="space-y-1.5">
          {placeholder(`h-3.5 ${index % 2 === 0 ? 'w-4/5' : 'w-3/5'}`)}
          {placeholder(`h-3.5 ${index % 2 === 0 ? 'w-2/5' : 'w-1/2'}`)}
        </div>
        <div className="flex items-center gap-2">
          {placeholder(
            'h-2.5 w-8 bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]'
          )}
          {placeholder(
            'h-2.5 w-12 bg-[color-mix(in_srgb,var(--link-unvisited)_18%,transparent)]'
          )}
          {placeholder('hidden h-2.5 w-16 sm:block')}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden h-7 w-7 rounded-lg bg-[color-mix(in_srgb,var(--text-muted)_15%,transparent)] sm:block" />
        <div className="h-7 w-12 rounded-lg bg-[color-mix(in_srgb,var(--text-muted)_15%,transparent)]" />
      </div>
    </div>
  );
}

interface StoryFeedPaneProps {
  activeFeed?: FeedType;
  stories: HNStory[];
  loading: boolean;
  selectedStoryId: number | null;
  readHistory: Record<number, ReadHistoryEntry>;
  bookmarkedIds: Set<number>;
  onSelectStory: (story: HNStory) => void;
  onToggleBookmark: (story: HNStory, e: React.MouseEvent) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  compact?: boolean;
}

export const StoryFeedPane: React.FC<StoryFeedPaneProps> = (props) => (
  <FeedTransition feed={props.activeFeed ?? 'top'} loading={props.loading}>
    <FeedContents {...props} />
  </FeedTransition>
);

const FeedContents: React.FC<StoryFeedPaneProps> = ({
  stories,
  loading,
  selectedStoryId,
  readHistory,
  bookmarkedIds,
  onSelectStory,
  onToggleBookmark,
  onLoadMore,
  hasMore,
  compact = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const [newlyAddedStartIndex, setNewlyAddedStartIndex] = useState(0);
  const [indicatorRect, setIndicatorRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const deduplicatedStories = useMemo(() => {
    const seen = new Set<number>();
    return stories.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [stories]);

  useEffect(() => {
    if (deduplicatedStories.length > prevCountRef.current) {
      setNewlyAddedStartIndex(prevCountRef.current);
    } else if (deduplicatedStories.length === 0) {
      setNewlyAddedStartIndex(0);
    }
    prevCountRef.current = deduplicatedStories.length;
  }, [deduplicatedStories.length]);

  // Measure the active story card so the shared selection indicator can glide between posts
  useEffect(() => {
    const updateIndicator = () => {
      const container = containerRef.current;
      if (!container || !selectedStoryId) {
        setIndicatorRect(null);
        return;
      }
      const activeEl = container.querySelector<HTMLElement>(
        `[data-story-id="${selectedStoryId}"]`
      );
      if (!activeEl) {
        setIndicatorRect(null);
        return;
      }
      setIndicatorRect({
        top: activeEl.offsetTop,
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        height: activeEl.offsetHeight,
      });
    };

    updateIndicator();
    const rafId = requestAnimationFrame(updateIndicator);

    const container = containerRef.current;
    let resizeObserver: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateIndicator();
      });
      resizeObserver.observe(container);
    }

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
    };
  }, [selectedStoryId, stories]);

  // Automatically center the selected story in the middle of the feed viewport
  useEffect(() => {
    if (!selectedStoryId || !containerRef.current) return;

    const scrollSelectedToCenter = () => {
      const container = containerRef.current;
      if (!container || !container.getClientRects().length) return;
      const activeEl = container.querySelector<HTMLElement>(
        `[data-story-id="${selectedStoryId}"]`
      );
      if (!activeEl) return;

      const scrollParent = container.parentElement;
      if (
        scrollParent &&
        scrollParent.scrollHeight > scrollParent.clientHeight &&
        typeof scrollParent.scrollTo === 'function'
      ) {
        const itemTop = activeEl.offsetTop;
        const itemHeight = activeEl.offsetHeight;
        const targetScrollTop = Math.max(
          0,
          itemTop - scrollParent.clientHeight / 2 + itemHeight / 2
        );
        scrollParent.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      } else if (typeof activeEl.scrollIntoView === 'function') {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    const rafId = requestAnimationFrame(scrollSelectedToCenter);
    const timer = setTimeout(scrollSelectedToCenter, 180);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [selectedStoryId, deduplicatedStories.length]);

  if (loading && deduplicatedStories.length === 0) {
    return (
      <div
        className={`min-h-full flex flex-col ${
          compact ? 'gap-1.5 p-2.5 sm:p-3' : 'gap-2.5 p-2.5 sm:gap-3 sm:p-4'
        }`}
      >
        {Array.from({ length: compact ? 20 : 12 }).map((_, i) => (
          <StoryShimmer key={i} compact={compact} index={i} />
        ))}
      </div>
    );
  }

  if (deduplicatedStories.length === 0) {
    return (
      <div
        style={{ color: 'var(--text-muted)' }}
        className="flex flex-col items-center justify-center py-20 px-6 text-center gap-2"
      >
        <span className="material-symbols-rounded text-[40px]">inbox</span>
        <p className="text-base font-medium">
          No stories match your current view or filters.
        </p>
      </div>
    );
  }

  const isAppendingMore = loading && deduplicatedStories.length > 0;
  const hasFloatingIndicator = Boolean(
    indicatorRect && indicatorRect.height > 0
  );

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col ${compact ? 'gap-1.5 p-2.5 sm:p-3' : 'gap-2.5 p-2.5 sm:gap-3 sm:p-4'}`}
    >
      {/* Shared Traveling Selection Backdrop & Left Accent Indicator */}
      {hasFloatingIndicator && indicatorRect && (
        <div
          aria-hidden="true"
          style={{
            transform: `translate3d(${indicatorRect.left}px, ${indicatorRect.top}px, 0)`,
            width: `${indicatorRect.width}px`,
            height: `${indicatorRect.height}px`,
            backgroundColor: 'var(--bg-surface-active)',
            borderColor:
              'color-mix(in srgb, var(--accent) 55%, var(--border-subtle))',
            transition:
              'transform 320ms cubic-bezier(0.22, 1, 0.36, 1), height 260ms cubic-bezier(0.22, 1, 0.36, 1), width 200ms ease, opacity 200ms ease',
          }}
          className={`pointer-events-none absolute top-0 left-0 z-0 overflow-hidden border will-change-transform ${compact ? 'rounded-xl' : 'rounded-2xl'}`}
        >
          <span
            style={{ backgroundColor: 'var(--accent)' }}
            className={`absolute left-0 w-1 rounded-r-full ${compact ? 'top-2 bottom-2' : 'top-3 bottom-3'}`}
          />
        </div>
      )}

      {deduplicatedStories.map((story, idx) => {
        const staggerIdx = Math.max(0, idx - newlyAddedStartIndex);
        const delayMs =
          idx >= newlyAddedStartIndex ? Math.min(staggerIdx * 35, 350) : 0;
        return (
          <div
            key={story.id}
            data-story-id={story.id}
            style={{ animationDelay: `${delayMs}ms` }}
            className="relative z-10 animate-story-in"
          >
            <StoryPillRow
              story={story}
              index={idx + 1}
              isSelected={selectedStoryId === story.id}
              hasFloatingIndicator={hasFloatingIndicator}
              compact={compact}
              isRead={Boolean(readHistory[story.id])}
              newCommentsDelta={getNewCommentsDelta(
                story.id,
                story.commentsCount,
                readHistory
              )}
              isBookmarked={bookmarkedIds.has(story.id)}
              onSelect={onSelectStory}
              onToggleBookmark={onToggleBookmark}
            />
          </div>
        );
      })}

      {/* Animated Skeleton Placeholders While Appending Next Batch */}
      {isAppendingMore && (
        <div
          className={`flex flex-col ${
            compact ? 'gap-1.5 mt-0.5' : 'gap-3 mt-1'
          }`}
          aria-live="polite"
        >
          {Array.from({ length: compact ? 4 : 3 }).map((_, i) => (
            <StoryShimmer
              key={`more-skeleton-${i}`}
              compact={compact}
              index={i}
            />
          ))}
        </div>
      )}

      {hasMore && onLoadMore && (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            disabled={loading}
            onClick={onLoadMore}
            style={{ color: 'var(--text-primary)' }}
            className={`group relative overflow-hidden liquid-glass h-11 px-5 rounded-full w-full inline-flex items-center justify-center gap-2.5 text-sm font-semibold cursor-pointer select-none transition-all duration-300 active:scale-[0.99] ${
              isAppendingMore ? 'liquid-shimmer' : ''
            }`}
          >
            <span
              style={{ color: 'var(--accent)' }}
              className={`material-symbols-rounded text-[19px] transition-transform duration-300 ${
                isAppendingMore ? 'animate-spin' : 'group-hover:translate-y-0.5'
              }`}
            >
              {isAppendingMore ? 'progress_activity' : 'expand_circle_down'}
            </span>
            <span>
              {isAppendingMore
                ? 'Fetching next 10 stories...'
                : 'Load More Stories'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
