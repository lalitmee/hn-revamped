import React from 'react';
import styles from './SavedEmptyState.module.css';
import { StoryPillRow } from './StoryPillRow';
import { HNStory } from '@/types/hn';

const ignoreDemoAction = () => {};

export function SavedEmptyState({ compact = false }: { compact?: boolean }) {
  const example: HNStory = {
    id: 0,
    title: 'Your next interesting read',
    cleanTitle: 'Your next interesting read',
    url: 'https://example.com',
    domain: 'example.com',
    points: 128,
    user: 'reader',
    time: Math.floor(Date.now() / 1000) - 3600,
    commentsCount: 24,
    badges: [],
    type: 'story',
  };
  return (
    <div className={styles.empty}>
      <span
        aria-hidden="true"
        className={`material-symbols-rounded ${styles.heroIcon}`}
      >
        bookmark
      </span>
      <h2 className={styles.heading}>Good stories can wait</h2>
      <p className={styles.copy}>
        Find something interesting but short on time? Tap the bookmark on any
        story to save it here, then come back when you have a moment.
      </p>
      <figure
        className={styles.demo}
        aria-label="Example: use the bookmark on a story card to save it for later."
      >
        <div aria-hidden="true" inert className={styles.card}>
          <StoryPillRow
            story={example}
            index={1}
            compact={compact}
            isSelected={false}
            isRead={false}
            newCommentsDelta={0}
            isBookmarked={true}
            onSelect={ignoreDemoAction}
            onToggleBookmark={ignoreDemoAction}
          />
        </div>
        <figcaption className={styles.caption}>
          Example · Save a story for later
        </figcaption>
        <div aria-hidden="true" className={styles.confirmation}>
          <span className="material-symbols-rounded">check_circle</span>
          Saved for later
        </div>
      </figure>
    </div>
  );
}
