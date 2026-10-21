'use client';

import React from 'react';
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
}) => {
  if (loading && stories.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{ backgroundColor: 'var(--bg-surface-1)', borderColor: 'var(--border-subtle)' }}
            className="h-24 rounded-2xl border animate-pulse"
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
        <p className="text-base font-medium">No stories match your current view or filters.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {stories.map((story, idx) => (
        <StoryPillRow
          key={story.id}
          story={story}
          index={idx + 1}
          isSelected={selectedStoryId === story.id}
          isRead={Boolean(readHistory[story.id])}
          newCommentsDelta={getNewCommentsDelta(story.id, story.commentsCount, readHistory)}
          isBookmarked={bookmarkedIds.has(story.id)}
          onSelect={onSelectStory}
          onToggleBookmark={onToggleBookmark}
        />
      ))}

      {hasMore && onLoadMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loading}
          style={{
            backgroundColor: 'var(--bg-surface-1)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
          className="mt-2 py-3 px-6 rounded-2xl border font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-110 transition cursor-pointer"
        >
          <span className="material-symbols-rounded">expand_more</span>
          {loading ? 'Loading more stories...' : 'Load More Stories'}
        </button>
      )}
    </div>
  );
};
