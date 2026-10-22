import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StoryPillRow, formatRelativeTime } from '../StoryPillRow';
import { HNStory } from '@/types/hn';

const mockStory: HNStory = {
  id: 42001,
  title: 'Show HN: Zed 1.0 – High-performance multiplayer code editor in Rust',
  cleanTitle: 'Zed 1.0 – High-performance multiplayer code editor in Rust',
  url: 'https://zed.dev/blog/zed-1-0',
  domain: 'zed.dev',
  points: 428,
  user: 'nathansobo',
  time: Math.floor(Date.now() / 1000) - 3600,
  commentsCount: 214,
  badges: [{ type: 'show', label: 'Show HN', icon: 'rocket_launch' }],
  type: 'story',
};

describe('StoryPillRow Component', () => {
  it('renders compact variant with title, points, comments and metadata on one line', () => {
    render(
      <StoryPillRow
        story={mockStory}
        index={3}
        isSelected={false}
        compact
        isRead={false}
        newCommentsDelta={0}
        isBookmarked={false}
        onSelect={vi.fn()}
        onToggleBookmark={vi.fn()}
      />
    );

    expect(screen.getByText(mockStory.cleanTitle)).toBeInTheDocument();
    expect(screen.getByText('428')).toBeInTheDocument();
    expect(screen.getByText('214')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.getByText('zed.dev')).toBeInTheDocument();
  });

  it('renders score pill, smart badges, clean title, domain, and +N new comments badge', () => {
    const onSelect = vi.fn();
    const onToggleBookmark = vi.fn();

    render(
      <StoryPillRow
        story={mockStory}
        index={1}
        isSelected={false}
        isRead={true}
        newCommentsDelta={18}
        isBookmarked={false}
        onSelect={onSelect}
        onToggleBookmark={onToggleBookmark}
      />
    );

    expect(screen.getByText('428')).toBeInTheDocument();
    expect(screen.getByText('Show HN')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Zed 1.0 – High-performance multiplayer code editor in Rust'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('zed.dev')).toBeInTheDocument();
    expect(screen.getByText('+18 new')).toBeInTheDocument();
    expect(screen.getByText('214')).toBeInTheDocument();

    fireEvent.click(
      screen.getByText(
        'Zed 1.0 – High-performance multiplayer code editor in Rust'
      )
    );
    expect(onSelect).toHaveBeenCalledWith(mockStory);
  });

  it('formats long durations into readable years, months, and days (e.g., 1y 10m 2d ago)', () => {
    const nowSec = Math.floor(Date.now() / 1000);
    // 1 year (365d) + 10 months (300d) + 2 days = 667 days
    const targetSec = nowSec - 667 * 86400;
    expect(formatRelativeTime(targetSec)).toBe('1y 10m 2d ago');

    // 4625 days = 12y (4380d) + 8m (240d) + 5d
    expect(formatRelativeTime(nowSec - 4625 * 86400)).toBe('12y 8m 5d ago');
  });
});
