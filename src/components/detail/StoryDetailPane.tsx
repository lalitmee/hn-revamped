'use client';

import React from 'react';
import { DetailTab, HNStoryWithComments } from '@/types/hn';
import { formatCommentHtml } from '@/lib/html-sanitizer';
import { formatRelativeTime } from '@/components/feed/StoryPillRow';
import { CommentTree } from './CommentTree';
import { ArticleReaderView } from './ArticleReaderView';

interface StoryDetailPaneProps {
  story: HNStoryWithComments | null;
  loading: boolean;
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onInternalHnLinkClick: (storyId: number) => void;
}

export const StoryDetailPane: React.FC<StoryDetailPaneProps> = ({
  story,
  loading,
  activeTab,
  onTabChange,
  isBookmarked,
  onToggleBookmark,
  onInternalHnLinkClick,
}) => {
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div
          style={{ backgroundColor: 'var(--bg-surface-1)' }}
          className="h-10 w-3/4 rounded-xl animate-pulse"
        />
        <div
          style={{ backgroundColor: 'var(--bg-surface-1)' }}
          className="h-32 w-full rounded-2xl animate-pulse"
        />
        <div
          style={{ backgroundColor: 'var(--bg-surface-1)' }}
          className="h-64 w-full rounded-2xl animate-pulse"
        />
      </div>
    );
  }

  if (!story) {
    return (
      <div
        style={{ color: 'var(--text-muted)' }}
        className="h-full flex flex-col items-center justify-center p-12 text-center gap-3"
      >
        <span className="material-symbols-rounded text-[48px] opacity-60">newspaper</span>
        <h3 style={{ color: 'var(--text-secondary)' }} className="text-lg font-semibold">
          Select a story to start reading
        </h3>
        <p className="text-sm max-w-sm">
          Use <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">j</kbd> /{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">k</kbd> to navigate
          stories, <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">r</kbd> for
          Reader View, or <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">z</kbd>{' '}
          for Zen Mode.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-7">
      {/* Top Action & Mode Bar */}
      <div
        style={{ borderColor: 'var(--border-subtle)' }}
        className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b"
      >
        <div
          style={{ backgroundColor: 'var(--bg-surface-1)', borderColor: 'var(--border-subtle)' }}
          className="inline-flex p-1 rounded-xl border"
        >
          <button
            type="button"
            onClick={() => onTabChange('comments')}
            style={{
              backgroundColor: activeTab === 'comments' ? 'var(--bg-surface-2)' : 'transparent',
              color: activeTab === 'comments' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition"
          >
            <span className="material-symbols-rounded text-[16px]">forum</span>
            Discussion ({story.commentsCount})
          </button>

          {story.url && (
            <button
              type="button"
              onClick={() => onTabChange('reader')}
              style={{
                backgroundColor: activeTab === 'reader' ? 'var(--bg-surface-2)' : 'transparent',
                color: activeTab === 'reader' ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition"
            >
              <span className="material-symbols-rounded text-[16px]">article</span>
              Reader View
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleBookmark}
            style={{
              backgroundColor: 'var(--bg-surface-1)',
              borderColor: 'var(--border-subtle)',
              color: isBookmarked ? 'var(--accent)' : 'var(--text-secondary)',
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer"
          >
            <span className={`material-symbols-rounded text-[16px] ${isBookmarked ? 'filled' : ''}`}>
              bookmark
            </span>
            {isBookmarked ? 'Saved' : 'Save'}
          </button>

          {story.url && (
            <a
              href={story.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: 'var(--bg-surface-1)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--link-unvisited)',
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold"
            >
              <span>Open Site</span>
              <span className="material-symbols-rounded text-[15px]">north_east</span>
            </a>
          )}
        </div>
      </div>

      {/* Story Title & Metadata Header */}
      <header className="mb-6">
        <h1
          style={{ color: 'var(--text-primary)' }}
          className="text-xl md:text-2xl font-bold leading-snug tracking-tight"
        >
          {story.cleanTitle}
        </h1>

        <div
          style={{ color: 'var(--text-muted)' }}
          className="flex flex-wrap items-center gap-3 mt-2.5 text-xs"
        >
          <span style={{ color: 'var(--accent)' }} className="font-bold">
            ▲ {story.points} points
          </span>
          <span>•</span>
          <span>by {story.user}</span>
          <span>•</span>
          <span>{formatRelativeTime(story.time)}</span>
          {story.domain && (
            <>
              <span>•</span>
              <span style={{ color: 'var(--link-unvisited)' }} className="font-medium">
                {story.domain}
              </span>
            </>
          )}
        </div>

        {story.text && (
          <div
            style={{
              backgroundColor: 'var(--bg-surface-1)',
              borderColor: 'var(--border-subtle)',
            }}
            className="mt-4 p-4 rounded-2xl border hn-prose"
            dangerouslySetInnerHTML={{ __html: formatCommentHtml(story.text) }}
          />
        )}
      </header>

      {/* Active Tab Content */}
      {activeTab === 'reader' ? (
        <ArticleReaderView url={story.url} storyTitle={story.cleanTitle} />
      ) : (
        <CommentTree
          comments={story.comments}
          storyAuthor={story.user}
          onInternalHnLinkClick={onInternalHnLinkClick}
        />
      )}
    </div>
  );
};
