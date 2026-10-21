'use client';

import React, { useState, useMemo } from 'react';
import { HNComment } from '@/types/hn';
import { CommentNode } from './CommentNode';

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

  const visibleComments = useMemo(
    () => filterCommentNodes(comments, searchQuery),
    [comments, searchQuery]
  );

  return (
    <div>
      {/* Thread Power Toolbar */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface-1)',
          borderColor: 'var(--border-subtle)',
        }}
        className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border mb-4"
      >
        <div
          style={{
            backgroundColor: 'var(--bg-surface-2)',
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
              className="material-symbols-rounded text-[16px]"
            >
              close
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCollapseAllReplies((prev) => !prev)}
          style={{
            backgroundColor: collapseAllReplies
              ? 'color-mix(in srgb, var(--accent) 18%, transparent)'
              : 'var(--bg-surface-2)',
            color: collapseAllReplies ? 'var(--accent)' : 'var(--text-secondary)',
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition"
        >
          <span className="material-symbols-rounded text-[16px]">
            {collapseAllReplies ? 'unfold_more' : 'unfold_less'}
          </span>
          {collapseAllReplies ? 'Expand Replies' : 'Collapse Replies'}
        </button>
      </div>

      {/* Root Comment Stream */}
      {visibleComments.length === 0 ? (
        <div
          style={{ color: 'var(--text-muted)' }}
          className="py-12 text-center text-sm"
        >
          No comments match your filter.
        </div>
      ) : (
        visibleComments.map((comment) => (
          <CommentNode
            key={comment.id}
            comment={comment}
            depth={0}
            storyAuthor={storyAuthor}
            collapseAllReplies={collapseAllReplies}
            onInternalHnLinkClick={onInternalHnLinkClick}
          />
        ))
      )}
    </div>
  );
};
