'use client';

import React from 'react';
import { HNStory, ReadHistoryEntry } from '@/types/hn';
import { getNewCommentsDelta } from '@/lib/storage';
import { StoryPillRow } from './StoryPillRow';
import { GlassButton } from '@/components/ui/GlassButton';

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
            className="liquid-glass h-24 rounded-2xl animate-pulse"
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
        <div className="mt-2 flex justify-center">
          <GlassButton
            size="lg"
            icon="expand_more"
            iconAccent
            disabled={loading}
            onClick={onLoadMore}
            className="w-full justify-center"
          >
            {loading ? 'Loading more stories...' : 'Load More Stories'}
          </GlassButton>
        </div>
      )}
    </div>
  );
};
