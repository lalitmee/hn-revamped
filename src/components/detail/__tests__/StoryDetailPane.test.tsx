import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StoryDetailPane } from '../StoryDetailPane';
import type { HNStoryWithComments } from '@/types/hn';

const story: HNStoryWithComments = {
  id: 1,
  title: 'External story',
  cleanTitle: 'External story',
  url: 'https://example.com/article',
  points: 10,
  user: 'author',
  time: 1700000000,
  commentsCount: 0,
  badges: [],
  type: 'story',
  comments: [],
};

it('shows Discussion when switching from Reader View to a story without a URL', () => {
  const props = {
    loading: false,
    activeTab: 'reader' as const,
    onTabChange: vi.fn(),
    isBookmarked: false,
    onToggleBookmark: vi.fn(),
    onInternalHnLinkClick: vi.fn(),
  };
  const { container, rerender } = render(
    <StoryDetailPane {...props} story={story} />
  );
  expect(
    container.querySelector('.custom-scrollbar.overflow-y-auto')
  ).toHaveClass('pt-3.5');
  expect(screen.getAllByRole('button', { name: 'Reader View' })).toHaveLength(
    2
  );

  rerender(
    <StoryDetailPane {...props} story={{ ...story, id: 2, url: undefined }} />
  );
  const discussion = screen.getAllByRole('button', { name: /Discussion/ });
  expect(
    discussion.some((button) =>
      button.classList.contains('liquid-glass-primary')
    )
  ).toBe(true);
  expect(screen.queryAllByRole('button', { name: 'Reader View' })).toHaveLength(
    0
  );
  expect(
    screen.queryByText(/text-only Hacker News discussion/)
  ).not.toBeInTheDocument();
});

it('links the story title and domain to the external URL and supports refreshing discussion', () => {
  const onRefreshStory = vi.fn();
  render(
    <StoryDetailPane
      story={{ ...story, domain: 'example.com' }}
      loading={false}
      activeTab="comments"
      onTabChange={vi.fn()}
      isBookmarked={false}
      onToggleBookmark={vi.fn()}
      onInternalHnLinkClick={vi.fn()}
      onRefreshStory={onRefreshStory}
    />
  );

  const titleLink = screen.getByRole('link', { name: 'External story' });
  expect(titleLink).toHaveAttribute('href', 'https://example.com/article');

  const domainLink = screen.getByRole('link', { name: 'example.com' });
  expect(domainLink).toHaveAttribute('href', 'https://example.com/article');

  const refreshBtn = screen.getByRole('button', { name: 'Refresh discussion' });
  refreshBtn.click();
  expect(onRefreshStory).toHaveBeenCalledOnce();
});
