'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { HNComment } from '@/types/hn';
import { CommentNode } from './CommentNode';
import { GlassButton } from '@/components/ui/GlassButton';

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
  const [collapseAllReplies, setCollapseAllReplies] = useState(false);
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
      {/* Thread Power Toolbar */}
      <div className="liquid-glass flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl mb-4">
        <div
          style={{
            backgroundColor: 'color-mix(in srgb, var(--bg-canvas) 55%, transparent)',
            borderColor: 'var(--border-subtle)',
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border flex-1 min-w-[200px]"
        >
          <span
            style={{ color: 'var(--text-muted)' }}
            className="material-symbols-rounded text-[18px]"
          >
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter thread by keyword or @author..."
            style={{ color: 'var(--text-primary)' }}
            className="bg-transparent text-sm focus:outline-none w-full"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ color: 'var(--text-muted)' }}
              className="material-symbols-rounded text-[16px] cursor-pointer"
            >
              close
            </button>
          )}
        </div>

        <GlassButton
          variant={collapseAllReplies ? 'primary' : 'glass'}
          icon={collapseAllReplies ? 'unfold_more' : 'unfold_less'}
          onClick={() => setCollapseAllReplies((prev) => !prev)}
        >
          {collapseAllReplies ? 'Expand Replies' : 'Collapse Replies'}
        </GlassButton>
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
              collapseAllReplies={collapseAllReplies}
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
