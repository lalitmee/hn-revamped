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
  const { rerender } = render(<StoryDetailPane {...props} story={story} />);
  expect(
    screen.getByRole('button', { name: 'Reader View' })
  ).toBeInTheDocument();

  rerender(
    <StoryDetailPane {...props} story={{ ...story, id: 2, url: undefined }} />
  );
  const discussion = screen.getByRole('button', { name: /Discussion/ });
  expect(discussion).toHaveClass('liquid-glass-primary');
  expect(
    screen.queryByRole('button', { name: 'Reader View' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText(/text-only Hacker News discussion/)
  ).not.toBeInTheDocument();
});
