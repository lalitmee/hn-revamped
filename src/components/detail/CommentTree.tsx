'use client';

import React, {
  useState,
  useMemo,
  useEffect,
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
  onCollapseModeChange,
  onInternalHnLinkClick,
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
  const [modeVersion, setModeVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [isPending, startTransition] = useTransition();
  const [visibleRootCount, setVisibleRootCount] = useState(budget.rootBatch);

  // Reset root batch count based on adaptive budget when switching stories
  useEffect(() => {
    setVisibleRootCount(budget.rootBatch);
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
      {/* Clean Material 3 Thread Toolbar (No Nested Box-Inside-Box) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3.5">
        <div className="liquid-glass h-9 px-4 rounded-full flex items-center gap-2.5 flex-1 min-w-[220px]">
          <span
            style={{
              color: isFilteringStale ? 'var(--accent)' : 'var(--text-muted)',
            }}
            className={`material-symbols-rounded text-[17px] shrink-0 transition-transform ${
              isFilteringStale ? 'animate-spin' : ''
            }`}
          >
            {isFilteringStale ? 'progress_activity' : 'search'}
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter thread by keyword or @author..."
            style={{ color: 'var(--text-primary)' }}
            className="bg-transparent text-xs sm:text-sm focus:outline-none w-full"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear thread search"
              onClick={() => setSearchQuery('')}
              style={{ color: 'var(--text-muted)' }}
              className="material-symbols-rounded text-[16px] cursor-pointer hover:opacity-80"
            >
              close
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
              setModeVersion((v) => v + 1);
            });
          }}
          items={[
            {
              id: 'expanded',
              label: 'Expand All',
              icon: 'unfold_more',
              title: 'Expand all comments and nested replies',
            },
            {
              id: 'root-only',
              label: 'Collapse Replies',
              icon: 'unfold_less',
              title: 'Collapse nested replies and show root comments only',
            },
            {
              id: 'collapse-all',
              label: 'Collapse All',
              icon: 'compress',
              title: 'Collapse every comment into a single-line summary bar',
            },
          ]}
        />
      </div>

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
