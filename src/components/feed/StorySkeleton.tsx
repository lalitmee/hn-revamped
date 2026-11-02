import React from 'react';
import { StoryPillRow } from './StoryPillRow';
import { HNStory } from '@/types/hn';
import styles from './StorySkeleton.module.css';

const noop = () => {};

export function StorySkeleton({
  compact,
  index,
  animateIn = true,
}: {
  compact: boolean;
  index: number;
  animateIn?: boolean;
}) {
  const title =
    index % 2 === 0
      ? 'An interesting story from the community'
      : 'A new perspective on building things for the web and beyond';
  const story: HNStory = {
    id: index,
    title,
    cleanTitle: title,
    domain: 'example.com',
    url: 'https://example.com',
    points: 128,
    user: 'reader',
    time: Math.floor(Date.now() / 1000) - 3600,
    commentsCount: 24,
    badges: [],
    type: 'story',
  };
  return (
    <div
      aria-hidden="true"
      inert
      data-story-skeleton=""
      className={`${styles.skeleton} shrink-0 ${animateIn ? 'animate-story-in' : ''}`}
      style={
        {
          '--shimmer-delay': `${index * 35}ms`,
          ...(animateIn ? { animationDelay: `${index * 35}ms` } : {}),
        } as React.CSSProperties
      }
    >
      <StoryPillRow
        story={story}
        index={index + 1}
        compact={compact}
        isSelected={false}
        isRead={false}
        newCommentsDelta={0}
        isBookmarked={false}
        onSelect={noop}
        onToggleBookmark={noop}
      />
    </div>
  );
}
