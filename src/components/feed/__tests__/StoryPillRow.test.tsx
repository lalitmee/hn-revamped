import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  StoryPillRow,
  formatRelativeTime,
  formatRelativeTimeConcise,
} from '../StoryPillRow';
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
  it.each([false, true])(
    'includes metadata icons in mobile and desktop markup (compact=%s)',
    (compact) => {
      render(
        <StoryPillRow
          story={mockStory}
          index={1}
          isSelected={false}
          compact={compact}
          isRead={false}
          newCommentsDelta={0}
          isBookmarked={false}
          onSelect={vi.fn()}
          onToggleBookmark={vi.fn()}
        />
      );
      for (const icon of ['language', 'person', 'schedule']) {
        expect(screen.getAllByText(icon)).toHaveLength(2);
        for (const element of screen.getAllByText(icon)) {
          expect(element).toHaveClass('material-symbols-rounded');
        }
      }
    }
  );
  it.each([true, false])(
    'distinguishes mobile density without removing actions (compact=%s)',
    (compact) => {
      const { container } = render(
        <StoryPillRow
          story={mockStory}
          index={1}
          isSelected={false}
          compact={compact}
          isRead={false}
          newCommentsDelta={0}
          isBookmarked={false}
          onSelect={vi.fn()}
          onToggleBookmark={vi.fn()}
        />
      );
      const mobile = container.querySelector('.sm\\:hidden')!;
      const title = mobile.querySelector('h3')!;
      expect(title).toHaveClass(compact ? 'text-[15px]' : 'text-[17px]');
      expect(title.classList.contains('line-clamp-2')).toBe(compact);
      expect(mobile.querySelector('.flex-nowrap')).not.toBeNull();
      expect(mobile.querySelector('button')).toHaveClass('w-6', 'h-6');
      const comments = mobile.querySelector('[aria-label$=" comments"]')!;
      expect(comments).toHaveClass(
        'rounded-lg',
        'font-medium',
        compact ? 'text-[11.5px]' : 'text-[12.5px]'
      );
      expect(comments.querySelector('.material-symbols-rounded')).toHaveClass(
        compact ? 'text-[14px]' : 'text-[15px]'
      );
    }
  );

  it.each([false, true])(
    'keeps read mobile titles aligned while retaining muted styling and the desktop check (compact=%s)',
    (compact) => {
      const { container } = render(
        <StoryPillRow
          story={mockStory}
          index={1}
          isSelected={false}
          compact={compact}
          isRead={true}
          newCommentsDelta={0}
          isBookmarked={false}
          onSelect={vi.fn()}
          onToggleBookmark={vi.fn()}
        />
      );
      const mobile = container.querySelector('.sm\\:hidden')!;
      const title = mobile.querySelector('h3')!;
      expect(title.parentElement?.firstElementChild).toBe(title);
      expect(mobile).not.toHaveTextContent('check');
      expect(container.querySelector('article')).toHaveStyle({
        opacity: '0.68',
      });
      const checkIcon = screen.getByText('check');
      expect(checkIcon.closest('.sm\\:contents')).not.toBeNull();
      expect(checkIcon.parentElement).toHaveStyle({
        backgroundColor: 'var(--bg-surface-2)',
      });
    }
  );

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

    expect(screen.getAllByText(mockStory.cleanTitle)).toHaveLength(2);
    expect(screen.getAllByText('428')[0]).toBeInTheDocument();
    expect(screen.getAllByText('214')[0]).toBeInTheDocument();
    expect(screen.getAllByText('#3')).toHaveLength(2);
    expect(screen.getAllByText('zed.dev')[0]).toBeInTheDocument();
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

    expect(screen.getAllByText('428')[0]).toBeInTheDocument();
    expect(screen.getByText('Show HN')).toBeInTheDocument();
    expect(screen.getAllByText(mockStory.cleanTitle)).toHaveLength(2);
    expect(screen.getAllByText('zed.dev')[0]).toBeInTheDocument();
    expect(screen.getAllByText('+18 new')[0]).toBeInTheDocument();
    expect(screen.getByText('+18')).toBeInTheDocument();
    expect(
      screen.getAllByRole('note', {
        name: '18 new comments since your last visit',
      })
    ).toHaveLength(2);
    expect(screen.getAllByText('214')[0]).toBeInTheDocument();

    fireEvent.click(screen.getAllByText(mockStory.cleanTitle)[0]);
    expect(onSelect).toHaveBeenCalledWith(mockStory);
  });

  it('formats long durations into readable years, months, and days (e.g., 1y 10m 2d ago)', () => {
    const nowSec = Math.floor(Date.now() / 1000);
    // 1 year (365d) + 10 months (300d) + 2 days = 667 days
    const targetSec = nowSec - 667 * 86400;
    expect(formatRelativeTime(targetSec)).toBe('1y 10m 2d ago');

    // 4625 days = 12y (4380d) + 8m (240d) + 5d
    expect(formatRelativeTime(nowSec - 4625 * 86400)).toBe('12y 8m 5d ago');

    // 364 days would previously calculate 12m without rollover
    expect(formatRelativeTime(nowSec - 364 * 86400)).toBe('1y 4d ago');
  });

  it('formats concise relative time cleanly for compact views', () => {
    const nowSec = Math.floor(Date.now() / 1000);
    expect(formatRelativeTimeConcise(nowSec - 45)).toBe('45s ago');
    expect(formatRelativeTimeConcise(nowSec - 180)).toBe('3m ago');
    expect(formatRelativeTimeConcise(nowSec - 7200)).toBe('2h ago');
    expect(formatRelativeTimeConcise(nowSec - 5 * 86400)).toBe('5d ago');
    expect(formatRelativeTimeConcise(nowSec - 45 * 86400)).toBe('1mo ago');
    expect(formatRelativeTimeConcise(nowSec - 667 * 86400)).toBe('1y ago');
    expect(formatRelativeTimeConcise(nowSec - 4625 * 86400)).toBe('12y ago');
  });
});
