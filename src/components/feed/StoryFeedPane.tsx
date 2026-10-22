'use client';

import React, { useState, useEffect, useRef } from 'react';
import { HNStory, ReadHistoryEntry } from '@/types/hn';
import { getNewCommentsDelta } from '@/lib/storage';
import { StoryPillRow } from './StoryPillRow';

interface StoryFeedPaneProps {
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

export const StoryFeedPane: React.FC<StoryFeedPaneProps> = ({
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

  useEffect(() => {
    if (stories.length > prevCountRef.current) {
      setNewlyAddedStartIndex(prevCountRef.current);
    } else if (stories.length === 0) {
      setNewlyAddedStartIndex(0);
    }
    prevCountRef.current = stories.length;
  }, [stories.length]);

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
      if (!container) return;
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
  }, [selectedStoryId, stories.length]);

  if (loading && stories.length === 0) {
    return (
      <div
        className={`min-h-full flex flex-col ${
          compact ? 'gap-1.5 p-3' : 'gap-3 p-4'
        }`}
      >
        {Array.from({ length: compact ? 20 : 12 }).map((_, i) => (
          <div
            key={i}
            style={{ animationDelay: `${i * 30}ms` }}
            className={`liquid-glass liquid-shimmer animate-story-in shrink-0 ${
              compact ? 'h-14 rounded-xl' : 'h-24 rounded-2xl'
            }`}
          />
        ))}
      </div>
    );
  }

  if (stories.length === 0) {
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

  const isAppendingMore = loading && stories.length > 0;
  const hasFloatingIndicator = Boolean(
    indicatorRect && indicatorRect.height > 0
  );

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col ${compact ? 'gap-1.5 p-3' : 'gap-3 p-4'}`}
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

      {stories.map((story, idx) => {
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
            <div
              key={`more-skeleton-${i}`}
              style={{ animationDelay: `${i * 45}ms` }}
              className={`liquid-glass liquid-shimmer animate-story-in ${
                compact ? 'h-14 rounded-xl' : 'h-24 rounded-2xl'
              }`}
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
