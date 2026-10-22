'use client';

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useDeferredValue,
  useTransition,
} from 'react';
import { HNComment } from '@/types/hn';
import { CommentNode, ThreadCollapseMode } from './CommentNode';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassSegmentedControl } from '@/components/ui/GlassSegmentedControl';
import { SafeViewTransition } from '@/components/ui/ViewTransitionWrapper';

export function getAdaptiveThreadBudget(totalComments: number): {
  rootBatch: number;
  maxDepth: number;
  siblingReplies: number;
} {
  if (totalComments <= 35) {
    return { rootBatch: 25, maxDepth: 2, siblingReplies: 10 };
  }
  if (totalComments <= 120) {
    return { rootBatch: 12, maxDepth: 2, siblingReplies: 5 };
  }
  if (totalComments <= 300) {
    return { rootBatch: 8, maxDepth: 2, siblingReplies: 3 };
  }
  return { rootBatch: 6, maxDepth: 1, siblingReplies: 2 };
}

interface CommentTreeProps {
  comments: HNComment[];
  storyAuthor: string;
  collapseMode?: ThreadCollapseMode;
  compact?: boolean;
  onCollapseModeChange?: (mode: ThreadCollapseMode) => void;
  onInternalHnLinkClick?: (storyId: number) => void;
  externalSearchQuery?: string;
  modeVersion?: number;
  hideToolbar?: boolean;
}

function filterCommentNodes(nodes: HNComment[], query: string): HNComment[] {
  if (!query.trim()) return nodes;
  const q = query.toLowerCase();
  const filtered: HNComment[] = [];

  for (const node of nodes) {
    const childMatches = filterCommentNodes(node.children, query);
    const selfMatches =
      node.user.toLowerCase().includes(q) ||
      node.text.toLowerCase().includes(q);
    if (selfMatches || childMatches.length > 0) {
      filtered.push({
        ...node,
        children: childMatches,
      });
    }
  }
  return filtered;
}

export const CommentTree: React.FC<CommentTreeProps> = ({
  comments,
  storyAuthor,
  collapseMode: controlledCollapseMode,
  compact = false,
  onCollapseModeChange,
  onInternalHnLinkClick,
  externalSearchQuery,
  modeVersion: controlledModeVersion,
  hideToolbar = false,
}) => {
  const totalCommentsCount = useMemo(
    () => comments.reduce((acc, c) => acc + 1 + c.totalDescendants, 0),
    [comments]
  );
  const budget = useMemo(
    () => getAdaptiveThreadBudget(totalCommentsCount),
    [totalCommentsCount]
  );

  const [internalCollapseMode, setInternalCollapseMode] =
    useState<ThreadCollapseMode>(controlledCollapseMode ?? 'root-only');
  const collapseMode = controlledCollapseMode ?? internalCollapseMode;
  const [internalModeVersion, setInternalModeVersion] = useState(0);
  const modeVersion = controlledModeVersion ?? internalModeVersion;
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const searchQuery =
    externalSearchQuery !== undefined
      ? externalSearchQuery
      : internalSearchQuery;
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [isPending, startTransition] = useTransition();
  const [visibleRootCount, setVisibleRootCount] = useState(budget.rootBatch);

  // Focus search input when filter is expanded
  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  // Reset root batch count and search state when switching stories
  useEffect(() => {
    setVisibleRootCount(budget.rootBatch);
    setInternalSearchQuery('');
    setIsSearchOpen(false);
  }, [comments, budget.rootBatch]);

  const filteredComments = useMemo(
    () => filterCommentNodes(comments, deferredSearchQuery),
    [comments, deferredSearchQuery]
  );

  const displayedRootComments = useMemo(
    () =>
      deferredSearchQuery.trim()
        ? filteredComments
        : filteredComments.slice(0, visibleRootCount),
    [filteredComments, visibleRootCount, deferredSearchQuery]
  );

  const remainingRootCount =
    filteredComments.length - displayedRootComments.length;
  const isFilteringStale = searchQuery !== deferredSearchQuery || isPending;

  return (
    <div>
      {/* Condensed Thread Toolbar: Expandable Filter & Icon-Only Collapse Controls */}
      {!hideToolbar && (
        <div className="flex items-center justify-between gap-2.5 mb-3.5">
          <div className="flex items-center gap-2 min-w-0">
            {isSearchOpen || searchQuery ? (
              <div className="liquid-glass h-8 px-3 rounded-full flex items-center gap-2 flex-1 sm:w-64 max-w-xs transition-all duration-200">
                <span
                  style={{
                    color: isFilteringStale
                      ? 'var(--accent)'
                      : 'var(--text-muted)',
                  }}
                  className={`material-symbols-rounded text-[16px] shrink-0 ${
                    isFilteringStale ? 'animate-spin' : ''
                  }`}
                >
                  {isFilteringStale ? 'progress_activity' : 'search'}
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setInternalSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      if (searchQuery) {
                        setInternalSearchQuery('');
                      } else {
                        setIsSearchOpen(false);
                      }
                    }
                  }}
                  placeholder="Filter comments or @author..."
                  style={{ color: 'var(--text-primary)' }}
                  className="bg-transparent text-xs focus:outline-none w-full min-w-0"
                />
                {searchQuery && (
                  <span
                    style={{ color: 'var(--text-muted)' }}
                    className="text-[10px] font-semibold shrink-0"
                  >
                    {filteredComments.length}
                  </span>
                )}
                <button
                  type="button"
                  aria-label={searchQuery ? 'Clear filter' : 'Close filter'}
                  onClick={() => {
                    if (searchQuery) {
                      setInternalSearchQuery('');
                      searchInputRef.current?.focus();
                    } else {
                      setIsSearchOpen(false);
                    }
                  }}
                  style={{ color: 'var(--text-muted)' }}
                  className="material-symbols-rounded text-[16px] cursor-pointer hover:opacity-80 shrink-0"
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
                <span className="material-symbols-rounded text-[18px]">
                  filter_list
                </span>
              </button>
            )}
          </div>

          <GlassSegmentedControl<ThreadCollapseMode>
            size="sm"
            value={collapseMode}
            onChange={(nextMode) => {
              startTransition(() => {
                setInternalCollapseMode(nextMode);
                onCollapseModeChange?.(nextMode);
                setInternalModeVersion((v) => v + 1);
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
      )}

      {/* Root Comment Stream */}
      <SafeViewTransition>
        <div
          style={{
            opacity: isFilteringStale ? 0.72 : 1,
            transition: 'opacity 180ms ease',
          }}
        >
          {displayedRootComments.length === 0 ? (
            <div
              style={{ color: 'var(--text-muted)' }}
              className="py-12 text-center text-sm"
            >
              No comments match your filter.
            </div>
          ) : (
            <>
              {displayedRootComments.map((comment) => (
                <CommentNode
                  key={comment.id}
                  comment={comment}
                  depth={0}
                  maxAllowedDepth={budget.maxDepth}
                  initialSiblingReplies={budget.siblingReplies}
                  storyAuthor={storyAuthor}
                  collapseMode={collapseMode}
                  compact={compact}
                  modeVersion={modeVersion}
                  onInternalHnLinkClick={onInternalHnLinkClick}
                />
              ))}

              {remainingRootCount > 0 && (
                <div className="mt-6 flex justify-center">
                  <GlassButton
                    variant="glass"
                    size="lg"
                    icon="expand_more"
                    iconAccent
                    onClick={() =>
                      startTransition(() =>
                        setVisibleRootCount((prev) => prev + budget.rootBatch)
                      )
                    }
                  >
                    Load More Top-Level Threads ({remainingRootCount} remaining)
                  </GlassButton>
                </div>
              )}
            </>
          )}
        </div>
      </SafeViewTransition>
    </div>
  );
};
