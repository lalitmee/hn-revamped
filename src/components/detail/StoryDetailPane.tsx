'use client';

import React, { startTransition } from 'react';
import { DetailTab, HNStoryWithComments } from '@/types/hn';
import { formatCommentHtml } from '@/lib/html-sanitizer';
import { formatRelativeTime } from '@/components/feed/StoryPillRow';
import { CommentTree } from './CommentTree';
import { ArticleReaderView } from './ArticleReaderView';
import { GlassSegmentedControl, SegmentedItem } from '@/components/ui/GlassSegmentedControl';
import { GlassButton } from '@/components/ui/GlassButton';
import { SafeViewTransition } from '@/components/ui/ViewTransitionWrapper';

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
        <div className="liquid-glass h-10 w-3/4 rounded-xl animate-pulse" />
        <div className="liquid-glass h-28 w-full rounded-2xl animate-pulse" />
        <div className="liquid-glass h-64 w-full rounded-2xl animate-pulse" />
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

  const tabItems: SegmentedItem<DetailTab>[] = [
    {
      id: 'comments',
      label: 'Discussion',
      icon: 'forum',
      badge: story.commentsCount,
    },
    ...(story.url
      ? [
          {
            id: 'reader' as DetailTab,
            label: 'Reader View',
            icon: 'article',
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky Liquid Glass Action & Mode Bar */}
      <div
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-canvas) 80%, transparent)',
          borderColor: 'var(--border-subtle)',
        }}
        className="sticky top-0 z-20 backdrop-blur-xl px-5 md:px-7 py-3.5 border-b flex flex-wrap items-center justify-between gap-3"
      >
        <GlassSegmentedControl<DetailTab>
          items={tabItems}
          value={activeTab}
          onChange={(nextTab) => startTransition(() => onTabChange(nextTab))}
        />

        <div className="flex items-center gap-2">
          <GlassButton
            variant={isBookmarked ? 'primary' : 'glass'}
            icon="bookmark"
            iconFilled={isBookmarked}
            onClick={onToggleBookmark}
          >
            {isBookmarked ? 'Saved' : 'Save'}
          </GlassButton>

          {story.url && (
            <a
              href={story.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--link-unvisited)' }}
              className="liquid-glass h-9 px-4 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <span>Open Site</span>
              <span className="material-symbols-rounded text-[15px]">north_east</span>
            </a>
          )}
        </div>
      </div>

      {/* Scrollable Story Content & Comments/Reader Body */}
      <div className="p-5 md:p-7 flex-1">
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
              className="liquid-glass mt-4 p-4 rounded-2xl hn-prose"
              onClick={(e) => {
                const target = (e.target as HTMLElement).closest('a[data-hn-item-id]');
                if (target) {
                  e.preventDefault();
                  const id = Number(target.getAttribute('data-hn-item-id'));
                  if (id) onInternalHnLinkClick(id);
                }
              }}
              dangerouslySetInnerHTML={{ __html: formatCommentHtml(story.text) }}
            />
          )}
        </header>

        <SafeViewTransition>
          {activeTab === 'reader' ? (
            <ArticleReaderView url={story.url} storyTitle={story.cleanTitle} />
          ) : (
            <CommentTree
              comments={story.comments}
              storyAuthor={story.user}
              onInternalHnLinkClick={onInternalHnLinkClick}
            />
          )}
        </SafeViewTransition>
      </div>
    </div>
  );
};
