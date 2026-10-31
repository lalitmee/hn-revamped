'use client';

import React, {
  startTransition,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { DetailTab, HNStoryWithComments, ThreadCollapseMode } from '@/types/hn';
import { formatCommentHtml } from '@/lib/html-sanitizer';
import { formatRelativeTime } from '@/components/feed/StoryPillRow';
import { CommentTree } from './CommentTree';
import { ArticleReaderView } from './ArticleReaderView';
import {
  GlassSegmentedControl,
  SegmentedItem,
} from '@/components/ui/GlassSegmentedControl';
import { SafeViewTransition } from '@/components/ui/ViewTransitionWrapper';
import { MobileBottomSheet } from '@/components/ui/MobileBottomSheet';

interface StoryDetailPaneProps {
  story: HNStoryWithComments | null;
  loading: boolean;
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  collapseMode?: ThreadCollapseMode;
  compact?: boolean;
  onCollapseModeChange?: (mode: ThreadCollapseMode) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onInternalHnLinkClick: (storyId: number) => void;
}

export const StoryDetailPane: React.FC<StoryDetailPaneProps> = ({
  story,
  loading,
  activeTab,
  onTabChange,
  collapseMode,
  compact = false,
  onCollapseModeChange,
  isBookmarked,
  onToggleBookmark,
  onInternalHnLinkClick,
}) => {
  const [internalCollapseMode, setInternalCollapseMode] =
    useState<ThreadCollapseMode>(collapseMode ?? 'root-only');
  const activeCollapseMode = collapseMode ?? internalCollapseMode;
  const [modeVersion, setModeVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isStoryTextExpanded, setIsStoryTextExpanded] = useState(false);
  const [isThreadSheetOpen, setIsThreadSheetOpen] = useState(false);
  const threadTriggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when filter is expanded in top bar
  useEffect(() => {
    if (isSearchOpen) {
      if (window.matchMedia('(max-width: 639px)').matches) {
        mobileSearchInputRef.current?.focus({ preventScroll: true });
      } else {
        searchInputRef.current?.focus();
      }
    }
  }, [isSearchOpen]);

  // Reset search and story text expansion when switching stories
  useEffect(() => {
    setSearchQuery('');
    setIsSearchOpen(false);
    setIsStoryTextExpanded(false);
  }, [story?.id]);

  const isInitialPlaceholder = Boolean(
    story && loading && story.points === 0 && !story.user
  );

  if (isInitialPlaceholder) {
    return (
      <div className="p-6 space-y-4">
        <div className="liquid-glass liquid-shimmer h-10 w-3/4 rounded-xl animate-story-in" />
        <div className="liquid-glass liquid-shimmer h-28 w-full rounded-2xl animate-story-in" />
        <div className="liquid-glass liquid-shimmer h-64 w-full rounded-2xl animate-story-in" />
      </div>
    );
  }

  if (!story) {
    return (
      <div
        style={{ color: 'var(--text-muted)' }}
        className="h-full flex flex-col items-center justify-center p-12 text-center gap-3"
      >
        <span className="material-symbols-rounded text-[48px] opacity-60">
          newspaper
        </span>
        <h3
          style={{ color: 'var(--text-secondary)' }}
          className="text-lg font-semibold"
        >
          Select a story to start reading
        </h3>
        <p className="text-sm max-w-sm">
          Use{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">
            j
          </kbd>{' '}
          /{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">
            k
          </kbd>{' '}
          to navigate stories,{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">
            r
          </kbd>{' '}
          for Reader View, or{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">
            z
          </kbd>{' '}
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
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Pinned / Sticky Liquid Glass Action & Mode Bar */}
      <div
        style={{
          backgroundColor:
            'color-mix(in srgb, var(--bg-canvas) 92%, transparent)',
          borderColor: 'var(--border-subtle)',
        }}
        className="shrink-0 sticky top-0 z-20 backdrop-blur-xl px-2 sm:px-5 md:px-6 py-2 border-b flex flex-wrap items-center justify-between gap-1.5 max-sm:h-[53px] max-sm:flex-nowrap"
      >
        {activeTab === 'comments' && isSearchOpen && (
          <div className="sm:hidden w-full liquid-glass rounded-full px-3 h-9 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="material-symbols-rounded text-[18px]"
            >
              filter_list
            </span>
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Filter comments..."
              aria-label="Filter comments"
              className="bg-transparent text-xs focus:outline-none flex-1 min-w-0"
            />
            <button
              type="button"
              aria-label="Close comment filter"
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="w-8 h-8 inline-flex items-center justify-center"
            >
              <span
                aria-hidden="true"
                className="material-symbols-rounded text-[18px]"
              >
                close
              </span>
            </button>
          </div>
        )}
        <div
          className={`sm:hidden ${activeTab === 'comments' && isSearchOpen ? 'max-sm:hidden' : ''} liquid-glass relative rounded-full p-0.5 inline-flex shrink-0`}
        >
          <span
            aria-hidden="true"
            className="liquid-glass-primary pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 rounded-full transition-[transform,width] duration-300 ease-out motion-reduce:transition-none"
            style={{
              width: activeTab === 'comments' ? 64 : 40,
              transform:
                activeTab === 'comments' ? 'translateX(0)' : 'translateX(64px)',
            }}
          />
          {tabItems.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-label={
                item.id === 'comments'
                  ? `Discussion, ${story.commentsCount} comments`
                  : 'Reader View'
              }
              aria-pressed={activeTab === item.id}
              onClick={() => startTransition(() => onTabChange(item.id))}
              className={`${item.id === 'comments' ? 'w-16' : 'w-10'} relative z-10 h-8 shrink-0 rounded-full inline-flex items-center justify-center gap-1 text-[11px] font-semibold transition-colors duration-300 ${activeTab === item.id ? 'text-white' : ''}`}
            >
              <span
                aria-hidden="true"
                className="material-symbols-rounded text-[18px]"
              >
                {item.icon}
              </span>
              {item.id === 'comments' && (
                <span aria-hidden="true">{story.commentsCount}</span>
              )}
            </button>
          ))}
        </div>
        <div className="hidden sm:block">
          <GlassSegmentedControl<DetailTab>
            items={tabItems}
            value={activeTab}
            onChange={(nextTab) => startTransition(() => onTabChange(nextTab))}
          />
        </div>

        <div
          className={`${activeTab === 'comments' && isSearchOpen ? 'max-sm:hidden' : ''} flex items-center gap-0.5 sm:gap-2`}
        >
          {activeTab === 'comments' && (
            <>
              {isSearchOpen || searchQuery ? (
                <div className="liquid-glass hidden sm:flex h-8 px-2.5 rounded-full items-center gap-1.5 w-56 transition-all duration-200">
                  <span
                    style={{ color: 'var(--text-muted)' }}
                    className="material-symbols-rounded text-[15px] shrink-0"
                  >
                    search
                  </span>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        if (searchQuery) {
                          setSearchQuery('');
                        } else {
                          setIsSearchOpen(false);
                        }
                      }
                    }}
                    placeholder="Filter thread..."
                    style={{ color: 'var(--text-primary)' }}
                    className="bg-transparent text-xs focus:outline-none w-full min-w-0"
                  />
                  <button
                    type="button"
                    aria-label={searchQuery ? 'Clear filter' : 'Close filter'}
                    onClick={() => {
                      if (searchQuery) {
                        setSearchQuery('');
                        searchInputRef.current?.focus();
                      } else {
                        setIsSearchOpen(false);
                      }
                    }}
                    style={{ color: 'var(--text-muted)' }}
                    className="material-symbols-rounded text-[15px] cursor-pointer hover:opacity-80 shrink-0"
                  >
                    close
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  aria-label="Filter comments"
                  title="Filter comments by keyword or @author"
                  onClick={() => setIsSearchOpen(true)}
                  style={{
                    color: 'var(--text-secondary)',
                  }}
                  className="liquid-glass w-8 h-8 rounded-full inline-flex items-center justify-center cursor-pointer hover:bg-[color-mix(in_srgb,var(--text-primary)_10%,transparent)] transition-colors duration-200"
                >
                  <span className="material-symbols-rounded text-[17px]">
                    filter_list
                  </span>
                </button>
              )}

              <button
                ref={threadTriggerRef}
                type="button"
                aria-label="Thread display options"
                aria-haspopup="dialog"
                aria-expanded={isThreadSheetOpen}
                onClick={() => setIsThreadSheetOpen(true)}
                className="liquid-glass sm:hidden w-8 h-8 rounded-full inline-flex items-center justify-center"
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-rounded text-[17px]"
                >
                  tune
                </span>
              </button>
              <div className="hidden sm:block">
                <GlassSegmentedControl<ThreadCollapseMode>
                  size="sm"
                  value={activeCollapseMode}
                  onChange={(nextMode) => {
                    startTransition(() => {
                      setInternalCollapseMode(nextMode);
                      onCollapseModeChange?.(nextMode);
                      setModeVersion((v) => v + 1);
                    });
                  }}
                  items={[
                    {
                      id: 'expanded',
                      icon: 'unfold_more',
                      title: 'Expand All',
                    },
                    {
                      id: 'root-only',
                      icon: 'unfold_less',
                      title: 'Collapse Replies',
                    },
                    {
                      id: 'collapse-all',
                      icon: 'compress',
                      title: 'Collapse All',
                    },
                  ]}
                />
              </div>

              <div
                style={{
                  backgroundColor:
                    'color-mix(in srgb, var(--border-subtle) 90%, transparent)',
                }}
                className="hidden sm:block h-4 w-[1px] mx-0.5 shrink-0"
              />
            </>
          )}

          <button
            type="button"
            aria-label={isBookmarked ? 'Saved' : 'Save'}
            title={isBookmarked ? 'Saved to bookmarks' : 'Save story'}
            onClick={onToggleBookmark}
            style={{
              color: isBookmarked ? '#ffffff' : 'var(--text-secondary)',
            }}
            className={`w-8 h-8 rounded-full inline-flex items-center justify-center shrink-0 cursor-pointer select-none transition-colors duration-200 ${
              isBookmarked
                ? 'liquid-glass-primary'
                : 'liquid-glass hover:bg-[color-mix(in_srgb,var(--text-primary)_10%,transparent)]'
            }`}
          >
            <span
              className={`material-symbols-rounded text-[17px] ${
                isBookmarked ? 'filled' : ''
              }`}
            >
              bookmark
            </span>
          </button>

          {story.url && (
            <a
              href={story.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open original website"
              title="Open site in new tab"
              style={{ color: 'var(--link-unvisited)' }}
              className="liquid-glass w-8 h-8 rounded-full inline-flex items-center justify-center shrink-0 hover:bg-[color-mix(in_srgb,var(--text-primary)_10%,transparent)] cursor-pointer transition-colors duration-200"
            >
              <span className="material-symbols-rounded text-[17px]">
                open_in_new
              </span>
            </a>
          )}
        </div>
      </div>
      <MobileBottomSheet
        isOpen={isThreadSheetOpen}
        onClose={() => setIsThreadSheetOpen(false)}
        title="Thread display"
        ariaLabel="Thread display options"
        triggerRef={threadTriggerRef}
      >
        {(
          [
            { id: 'expanded', label: 'Expand all', icon: 'unfold_more' },
            { id: 'root-only', label: 'Collapse replies', icon: 'unfold_less' },
            { id: 'collapse-all', label: 'Collapse all', icon: 'compress' },
          ] as const
        ).map((option) => (
          <button
            key={option.id}
            type="button"
            aria-current={activeCollapseMode === option.id ? 'true' : undefined}
            onClick={() => {
              startTransition(() => {
                setInternalCollapseMode(option.id);
                onCollapseModeChange?.(option.id);
                setModeVersion((v) => v + 1);
              });
              setIsThreadSheetOpen(false);
            }}
            className="w-full min-h-12 px-4 rounded-xl flex items-center gap-3 text-left font-medium"
            style={{
              backgroundColor:
                activeCollapseMode === option.id
                  ? 'var(--bg-surface-active)'
                  : undefined,
              color:
                activeCollapseMode === option.id
                  ? 'var(--accent)'
                  : 'var(--text-primary)',
            }}
          >
            <span aria-hidden="true" className="material-symbols-rounded">
              {option.icon}
            </span>
            {option.label}
            {activeCollapseMode === option.id && (
              <span
                aria-hidden="true"
                className="material-symbols-rounded ml-auto"
              >
                check
              </span>
            )}
          </button>
        ))}
      </MobileBottomSheet>

      {/* Independently Scrollable Story Content & Comments/Reader Body */}
      <div
        className={`custom-scrollbar px-3 sm:px-5 md:px-6 pb-6 flex-1 min-h-0 overflow-y-auto overscroll-contain ${
          compact ? 'pt-2' : 'pt-3.5'
        }`}
      >
        <header className={compact ? 'mb-2.5' : 'mb-4'}>
          <h1
            style={{ color: 'var(--text-primary)' }}
            className={`font-bold leading-snug tracking-tight ${
              compact ? 'text-base md:text-lg' : 'text-lg md:text-xl'
            }`}
          >
            {story.cleanTitle}
          </h1>

          <div
            style={{ color: 'var(--text-muted)' }}
            className={`flex flex-wrap items-center gap-2 text-xs ${
              compact ? 'mt-1' : 'mt-1.5'
            }`}
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
                <span
                  style={{ color: 'var(--link-unvisited)' }}
                  className="font-medium"
                >
                  {story.domain}
                </span>
              </>
            )}
          </div>

          {story.text && (
            <div
              className={`liquid-glass relative transition-all ${
                compact ? 'mt-2 p-2.5 rounded-xl' : 'mt-3 p-3.5 rounded-2xl'
              }`}
            >
              <div
                className={`hn-prose ${compact ? 'hn-prose-compact' : ''} ${
                  compact && !isStoryTextExpanded && story.text.length > 280
                    ? 'max-h-24 overflow-hidden'
                    : ''
                }`}
                onClick={(e) => {
                  const target = (e.target as HTMLElement).closest(
                    'a[data-hn-item-id]'
                  );
                  if (target) {
                    e.preventDefault();
                    const id = Number(target.getAttribute('data-hn-item-id'));
                    if (id) onInternalHnLinkClick(id);
                  }
                }}
                dangerouslySetInnerHTML={{
                  __html: formatCommentHtml(story.text),
                }}
              />
              {compact && !isStoryTextExpanded && story.text.length > 280 && (
                <div
                  style={{
                    background:
                      'linear-gradient(to top, var(--bg-surface-1) 30%, transparent 100%)',
                  }}
                  className="absolute inset-x-0 bottom-0 pt-6 pb-1 px-3 flex justify-center rounded-b-xl"
                >
                  <button
                    type="button"
                    onClick={() => setIsStoryTextExpanded(true)}
                    style={{ color: 'var(--accent)' }}
                    className="text-xs font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Show full text</span>
                    <span className="material-symbols-rounded text-[14px]">
                      expand_more
                    </span>
                  </button>
                </div>
              )}
              {compact && isStoryTextExpanded && story.text.length > 280 && (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsStoryTextExpanded(false)}
                    style={{ color: 'var(--text-muted)' }}
                    className="text-xs font-medium inline-flex items-center gap-0.5 hover:underline cursor-pointer"
                  >
                    <span>Collapse</span>
                    <span className="material-symbols-rounded text-[14px]">
                      expand_less
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </header>

        <SafeViewTransition>
          <div
            key={activeTab}
            className={
              activeTab === 'reader'
                ? 'detail-tab-enter-from-right'
                : 'detail-tab-enter-from-left'
            }
          >
            {activeTab === 'reader' ? (
              <ArticleReaderView
                url={story.url}
                storyTitle={story.cleanTitle}
              />
            ) : loading && story.comments.length === 0 ? (
              <div
                className={`min-h-full flex flex-col ${
                  compact ? 'space-y-2.5' : 'space-y-3.5'
                }`}
                role="status"
                aria-live="polite"
              >
                <div
                  style={{ color: 'var(--text-muted)' }}
                  className="flex items-center gap-2 text-xs font-medium py-1"
                >
                  <span
                    style={{ color: 'var(--accent)' }}
                    className="material-symbols-rounded text-[16px] animate-spin"
                  >
                    progress_activity
                  </span>
                  <span>
                    Loading{' '}
                    {story.commentsCount > 0 ? `${story.commentsCount} ` : ''}
                    comments...
                  </span>
                </div>

                {Array.from({ length: compact ? 12 : 8 }).map((_, i) => (
                  <div
                    key={`comment-skeleton-${i}`}
                    style={{ animationDelay: `${i * 30}ms` }}
                    className={`liquid-glass liquid-shimmer animate-story-in shrink-0 ${
                      compact
                        ? 'p-2.5 rounded-xl space-y-2'
                        : 'p-4 rounded-2xl space-y-3'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            backgroundColor:
                              'color-mix(in srgb, var(--accent) 28%, transparent)',
                          }}
                          className={`rounded-full ${
                            compact ? 'h-3 w-20' : 'h-3.5 w-24'
                          }`}
                        />
                        <div
                          style={{
                            backgroundColor:
                              'color-mix(in srgb, var(--text-muted) 18%, transparent)',
                          }}
                          className={`rounded-full ${
                            compact ? 'h-2.5 w-12' : 'h-3 w-14'
                          }`}
                        />
                      </div>
                      <div
                        style={{
                          backgroundColor:
                            'color-mix(in srgb, var(--text-primary) 10%, transparent)',
                        }}
                        className={`rounded-full ${
                          compact ? 'h-5 w-10' : 'h-6 w-12'
                        }`}
                      />
                    </div>
                    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
                      <div
                        style={{
                          backgroundColor:
                            'color-mix(in srgb, var(--text-primary) 12%, transparent)',
                        }}
                        className={`rounded-full ${
                          compact ? 'h-3 w-full' : 'h-3.5 w-full'
                        }`}
                      />
                      <div
                        style={{
                          backgroundColor:
                            'color-mix(in srgb, var(--text-primary) 10%, transparent)',
                        }}
                        className={`rounded-full ${
                          compact ? 'h-3' : 'h-3.5'
                        } ${i % 2 === 0 ? 'w-4/5' : 'w-2/3'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <CommentTree
                comments={story.comments}
                storyAuthor={story.user}
                collapseMode={activeCollapseMode}
                compact={compact}
                onCollapseModeChange={onCollapseModeChange}
                onInternalHnLinkClick={onInternalHnLinkClick}
                externalSearchQuery={searchQuery}
                modeVersion={modeVersion}
                hideToolbar={true}
              />
            )}
          </div>
        </SafeViewTransition>
      </div>
    </div>
  );
};
