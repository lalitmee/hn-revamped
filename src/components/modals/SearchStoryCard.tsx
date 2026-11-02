import React from 'react';
import { HNStory } from '@/types/hn';
import { formatRelativeTimeConcise } from '@/components/feed/StoryPillRow';
import styles from '@/components/feed/StorySkeleton.module.css';

const publishedDateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

export function SearchStoryCard({
  story,
  index,
  onSelect,
  skeleton = false,
}: {
  story: HNStory;
  index: number;
  onSelect?: () => void;
  skeleton?: boolean;
}) {
  return (
    <div
      aria-hidden={skeleton || undefined}
      inert={skeleton || undefined}
      className={skeleton ? styles.skeleton : undefined}
      data-search-skeleton={skeleton ? '' : undefined}
      style={
        skeleton
          ? ({ '--shimmer-delay': `${index * 35}ms` } as React.CSSProperties)
          : undefined
      }
    >
      <button
        data-skeleton-card={skeleton ? '' : undefined}
        type="button"
        onClick={onSelect}
        style={{ animationDelay: `${Math.min(index * 35, 280)}ms` }}
        className="liquid-glass animate-story-in relative overflow-hidden w-full text-left p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl flex flex-row items-start justify-between gap-2 sm:gap-4 cursor-pointer"
      >
        <div className="min-w-0 flex-1">
          <div
            data-card-title=""
            style={{ fontSize: 'var(--reader-font-size)' }}
            className="text-sm font-semibold leading-snug line-clamp-2"
          >
            {story.cleanTitle}
          </div>
          <div
            style={{ color: 'var(--text-muted)' }}
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs mt-1.5"
          >
            <span
              style={{ color: 'var(--accent)' }}
              className="shrink-0 font-semibold"
            >
              ▲ {story.points}
            </span>
            {story.domain && (
              <span
                className="inline-flex items-center gap-1 min-w-0 max-w-[140px] sm:max-w-[200px]"
                style={{ color: 'var(--link-unvisited)' }}
                title={story.domain}
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-rounded text-[13px] shrink-0"
                >
                  language
                </span>
                <span className="truncate">{story.domain}</span>
              </span>
            )}
            <span
              className="inline-flex items-center gap-1 min-w-0 max-w-[120px]"
              title={story.user}
            >
              <span
                aria-hidden="true"
                className="material-symbols-rounded text-[13px] shrink-0"
              >
                person
              </span>
              <span className="truncate">{story.user}</span>
            </span>
            <time
              dateTime={new Date(story.time * 1000).toISOString()}
              title={`Published ${publishedDateFormatter.format(new Date(story.time * 1000))} (${new Date(story.time * 1000).toLocaleString()})`}
              className="inline-flex items-center gap-1 shrink-0"
            >
              <span
                aria-hidden="true"
                className="material-symbols-rounded text-[13px]"
              >
                schedule
              </span>
              {formatRelativeTimeConcise(story.time)}
            </time>
          </div>
        </div>
        <span
          className="shrink-0 rounded-lg px-1.5 py-0.5 inline-flex items-center gap-1 text-xs font-semibold"
          aria-label={`${story.commentsCount} comments`}
        >
          <span
            aria-hidden="true"
            className="material-symbols-rounded text-[14px]"
          >
            forum
          </span>
          {story.commentsCount}
        </span>
      </button>
    </div>
  );
}
