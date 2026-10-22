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
    expect(screen.getByText('Story 1')).toBeInTheDocument();
    expect(screen.getByText('Story 2')).toBeInTheDocument();
    expect(screen.queryByText('Story 1 Duplicate')).not.toBeInTheDocument();
  });
});
