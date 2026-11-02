import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import { StorySkeleton } from '../StorySkeleton';
import { StoryPillRow } from '../StoryPillRow';
import { SearchStoryCard } from '@/components/modals/SearchStoryCard';
import { HNStory } from '@/types/hn';

const story: HNStory = {
  id: 1,
  title: 'Example story',
  cleanTitle: 'Example story',
  domain: 'example.com',
  user: 'reader',
  points: 128,
  commentsCount: 24,
  time: Math.floor(Date.now() / 1000) - 3600,
  badges: [],
  type: 'story',
};

// Compare the full element structure and layout classes, not placeholder copy.
function layout(element: Element): unknown {
  return [
    element.tagName,
    element.className,
    Array.from(element.children, layout),
  ];
}

describe('card skeleton layout parity', () => {
  it.each([false, true])(
    'staggers the wave independently of entry animation (animateIn=%s)',
    (animateIn) => {
      const { container } = render(
        <>
          <StorySkeleton compact index={0} animateIn={animateIn} />
          <StorySkeleton compact index={1} animateIn={animateIn} />
        </>
      );
      const rows = container.querySelectorAll<HTMLElement>(
        '[data-story-skeleton]'
      );
      expect(rows[0].style.getPropertyValue('--shimmer-delay')).toBe('0ms');
      expect(rows[1].style.getPropertyValue('--shimmer-delay')).toBe('35ms');
    }
  );

  it('staggers search skeleton waves too', () => {
    const { container } = render(
      <SearchStoryCard story={story} index={2} skeleton />
    );
    expect(
      (container.firstChild as HTMLElement).style.getPropertyValue(
        '--shimmer-delay'
      )
    ).toBe('70ms');
  });
  it.each([false, true])(
    'shares both responsive feed layouts (compact=%s)',
    (compact) => {
      const skeleton = render(<StorySkeleton compact={compact} index={0} />);
      const actual = render(
        <StoryPillRow
          story={story}
          index={1}
          compact={compact}
          isSelected={false}
          isRead={false}
          newCommentsDelta={0}
          isBookmarked={false}
          onSelect={vi.fn()}
          onToggleBookmark={vi.fn()}
        />
      );
      expect(layout(skeleton.container.querySelector('article')!)).toEqual(
        layout(actual.container.querySelector('article')!)
      );
      expect(skeleton.container.firstChild).toHaveAttribute('inert');
      expect(skeleton.container.firstChild).toHaveAttribute(
        'aria-hidden',
        'true'
      );
      expect(skeleton.container.querySelector('article')).not.toHaveClass(
        'h-[4.25rem]'
      );
    }
  );

  it('shares the mobile and desktop search result layout', () => {
    const skeleton = render(
      <SearchStoryCard story={story} index={0} skeleton />
    );
    const actual = render(
      <SearchStoryCard story={story} index={0} onSelect={vi.fn()} />
    );
    expect(layout(skeleton.container.querySelector('button')!)).toEqual(
      layout(actual.container.querySelector('button')!)
    );
    expect(skeleton.container.firstChild).toHaveAttribute('inert');
    expect(skeleton.container.firstChild).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });
});
