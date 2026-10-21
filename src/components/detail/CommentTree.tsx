'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { HNComment } from '@/types/hn';
import { CommentNode, ThreadCollapseMode } from './CommentNode';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassSegmentedControl } from '@/components/ui/GlassSegmentedControl';

const INITIAL_ROOT_BATCH = 15;

interface CommentTreeProps {
  comments: HNComment[];
  storyAuthor: string;
  onInternalHnLinkClick?: (storyId: number) => void;
}

function filterCommentNodes(nodes: HNComment[], query: string): HNComment[] {
  if (!query.trim()) return nodes;
  const q = query.toLowerCase();
  const filtered: HNComment[] = [];

  for (const node of nodes) {
    const childMatches = filterCommentNodes(node.children, query);
    const selfMatches =
      node.user.toLowerCase().includes(q) || node.text.toLowerCase().includes(q);
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
  onInternalHnLinkClick,
}) => {
  const [collapseMode, setCollapseMode] = useState<ThreadCollapseMode>('expanded');
  const [modeVersion, setModeVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleRootCount, setVisibleRootCount] = useState(INITIAL_ROOT_BATCH);

  // Reset root batch count when switching stories
  useEffect(() => {
    setVisibleRootCount(INITIAL_ROOT_BATCH);
  }, [comments]);

  const filteredComments = useMemo(
    () => filterCommentNodes(comments, searchQuery),
    [comments, searchQuery]
  );

  const displayedRootComments = useMemo(
    () =>
      searchQuery.trim()
        ? filteredComments
        : filteredComments.slice(0, visibleRootCount),
    [filteredComments, visibleRootCount, searchQuery]
  );

  const remainingRootCount = filteredComments.length - displayedRootComments.length;

  return (
    <div>
      {/* Clean Material 3 Thread Toolbar (No Nested Box-Inside-Box) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-5">
        <div className="liquid-glass h-9 px-4 rounded-full flex items-center gap-2.5 flex-1 min-w-[220px]">
          <span
            style={{ color: 'var(--text-muted)' }}
            className="material-symbols-rounded text-[17px] shrink-0"
          >
            search
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
            setCollapseMode(nextMode);
            setModeVersion((v) => v + 1);
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
              maxAllowedDepth={2}
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
                  setVisibleRootCount((prev) => prev + INITIAL_ROOT_BATCH)
                }
              >
                Load More Top-Level Threads ({remainingRootCount} remaining)
              </GlassButton>
            </div>
          )}
        </>
      )}
    </div>
  );
};
