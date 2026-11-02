import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StoryFeedPane } from '../StoryFeedPane';
import { HNStory } from '@/types/hn';

const createMockStory = (id: number, title: string): HNStory => ({
  id,
  title,
  cleanTitle: title,
  url: `https://example.com/${id}`,
  domain: 'example.com',
  points: 100,
  user: 'alice',
  time: Math.floor(Date.now() / 1000) - 3600,
  commentsCount: 10,
  badges: [],
  type: 'story',
});

describe('StoryFeedPane Component', () => {
  it.each([
    { feed: 'saved' as const, bookmarks: [], showPrompt: true },
    { feed: 'saved' as const, bookmarks: [123], showPrompt: false },
    { feed: 'top' as const, bookmarks: [], showPrompt: false },
  ])(
    'shows the save-for-later prompt only for an empty library ($feed, $bookmarks)',
    ({ feed, bookmarks, showPrompt }) => {
      render(
        <StoryFeedPane
          activeFeed={feed}
          stories={[]}
          loading={false}
          selectedStoryId={null}
          readHistory={{}}
          bookmarkedIds={new Set(bookmarks)}
          onSelectStory={vi.fn()}
          onToggleBookmark={vi.fn()}
        />
      );
      if (showPrompt) {
        expect(
          screen.getByRole('heading', { name: 'Good stories can wait' })
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Tap the bookmark on any story/)
        ).toBeInTheDocument();
        expect(screen.queryByText(/No stories match/)).not.toBeInTheDocument();
      } else {
        expect(
          screen.queryByText('Good stories can wait')
        ).not.toBeInTheDocument();
        expect(screen.getByText(/No stories match/)).toBeInTheDocument();
      }
    }
  );

  it.each([false, true])(
    'passes the selected density to the saved example (compact=%s)',
    (compact) => {
      const { container } = render(
        <StoryFeedPane
          activeFeed="saved"
          compact={compact}
          stories={[]}
          loading={false}
          selectedStoryId={null}
          readHistory={{}}
          bookmarkedIds={new Set()}
          onSelectStory={vi.fn()}
          onToggleBookmark={vi.fn()}
        />
      );
      expect(container.querySelector('article')).toHaveClass(
        compact ? 'rounded-xl' : 'rounded-2xl'
      );
    }
  );

  it('deduplicates stories with identical IDs to prevent React duplicate key errors', () => {
    const duplicateStories: HNStory[] = [
      createMockStory(50195110, 'Story 1'),
      createMockStory(50195110, 'Story 1 Duplicate'),
      createMockStory(50195111, 'Story 2'),
    ];

    const { container } = render(
      <StoryFeedPane
        stories={duplicateStories}
        loading={false}
        selectedStoryId={null}
        readHistory={{}}
        bookmarkedIds={new Set()}
        onSelectStory={vi.fn()}
        onToggleBookmark={vi.fn()}
      />
    );

    // Only 2 unique stories should be rendered
    const storyElements = container.querySelectorAll('[data-story-id]');
    expect(storyElements.length).toBe(2);
    expect(screen.getAllByText('Story 1')).toHaveLength(2);
    expect(screen.getAllByText('Story 2')).toHaveLength(2);
    expect(screen.queryByText('Story 1 Duplicate')).not.toBeInTheDocument();
  });
});
