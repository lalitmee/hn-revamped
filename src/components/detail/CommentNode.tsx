'use client';

import React, { useState, useEffect } from 'react';
import { HNComment } from '@/types/hn';
import { formatCommentHtml } from '@/lib/html-sanitizer';
import { formatRelativeTime } from '@/components/feed/StoryPillRow';

const DEPTH_COLORS = [
  '#F97316', // Depth 0: Orange
  '#3B82F6', // Depth 1: Blue
  '#10B981', // Depth 2: Emerald
  '#8B5CF6', // Depth 3: Violet
  '#F59E0B', // Depth 4: Amber
  '#06B6D4', // Depth 5+: Cyan
];

const INITIAL_SIBLING_REPLIES = 5;
const DEPTH_UNLOCK_STEP = 3;

interface CommentNodeProps {
  comment: HNComment;
  depth: number;
  maxAllowedDepth?: number;
  storyAuthor: string;
  collapseAllReplies: boolean;
  onInternalHnLinkClick?: (storyId: number) => void;
}

export const CommentNode: React.FC<CommentNodeProps> = ({
  comment,
  depth,
  maxAllowedDepth = 2,
  storyAuthor,
  collapseAllReplies,
  onInternalHnLinkClick,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hideChildrenOnly, setHideChildrenOnly] = useState(false);
  const [unlockedDepthLimit, setUnlockedDepthLimit] = useState(maxAllowedDepth);
  const [visibleDirectReplies, setVisibleDirectReplies] = useState(INITIAL_SIBLING_REPLIES);

  useEffect(() => {
    setHideChildrenOnly(collapseAllReplies);
  }, [collapseAllReplies]);

  const guideColor = DEPTH_COLORS[depth % DEPTH_COLORS.length];
  const isOP = comment.user === storyAuthor;

  const plainSnippet = comment.text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90);

  if (isCollapsed) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsCollapsed(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsCollapsed(false);
          }
        }}
        style={{
          borderLeft: `3px solid ${guideColor}`,
          color: 'var(--text-muted)',
        }}
        className="liquid-glass my-2 py-2 px-3.5 rounded-r-xl flex items-center justify-between gap-3 cursor-pointer text-[13px]"
      >
        <div className="truncate">
          <strong style={{ color: 'var(--text-secondary)' }}>{comment.user}</strong>
          <span className="mx-1.5">•</span>
          <span>{formatRelativeTime(comment.time)}</span>
          <span className="mx-2 opacity-75 italic">&ldquo;{plainSnippet}...&rdquo;</span>
        </div>
        <span
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent) 18%, transparent)',
            color: 'var(--accent)',
          }}
          className="px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0"
        >
          +{1 + comment.totalDescendants}
        </span>
      </div>
    );
  }

  const isDepthGated = depth >= unlockedDepthLimit && comment.children.length > 0;
  const displayedChildren = comment.children.slice(0, visibleDirectReplies);
  const hiddenSiblingCount = comment.children.length - displayedChildren.length;

  return (
    <div className={`relative ${depth > 0 ? 'mt-3.5' : 'mt-5'}`}>
      <div className="flex">
        {/* Interactive Full-Height Color Guide Bar */}
        <button
          type="button"
          aria-label={`Collapse comment thread by ${comment.user}`}
          onClick={() => setIsCollapsed(true)}
          className="group/bar relative flex justify-center w-4 shrink-0 cursor-pointer focus:outline-none"
        >
          <span
            style={{ backgroundColor: guideColor }}
            className="w-[3px] h-full rounded-full opacity-80 group-hover/bar:w-[5px] group-hover/bar:opacity-100 transition-all"
          />
        </button>

        <div className="flex-1 min-w-0 pl-2">
          {/* Comment Header */}
          <div className="flex items-center gap-2 text-[13px] mb-1.5">
            <span
              style={{ color: isOP ? 'var(--accent)' : 'var(--text-primary)' }}
              className="font-semibold"
            >
              {comment.user}
            </span>

            {isOP && (
              <span
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent) 20%, transparent)',
                  color: 'var(--accent)',
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
              >
                OP
              </span>
            )}

            <span style={{ color: 'var(--text-muted)' }}>• {formatRelativeTime(comment.time)}</span>

            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              style={{ color: 'var(--text-muted)' }}
              className="ml-auto text-[11px] px-2 py-0.5 rounded hover:bg-white/5 cursor-pointer"
            >
              [–{comment.totalDescendants > 0 ? ` ${comment.totalDescendants}` : ''}]
            </button>
          </div>

          {/* Comment Prose Body */}
          <div
            className="hn-prose"
            onClick={(e) => {
              const target = (e.target as HTMLElement).closest('a[data-hn-item-id]');
              if (target && onInternalHnLinkClick) {
                e.preventDefault();
                const id = Number(target.getAttribute('data-hn-item-id'));
                if (id) onInternalHnLinkClick(id);
              }
            }}
            dangerouslySetInnerHTML={{ __html: formatCommentHtml(comment.text) }}
          />

          {/* Nested Replies: Collapsed / Depth-Gated / Progressive Sibling Batch */}
          {comment.children.length > 0 && (
            <div>
              {hideChildrenOnly ? (
                <button
                  type="button"
                  onClick={() => setHideChildrenOnly(false)}
                  style={{ color: 'var(--accent)' }}
                  className="liquid-glass mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold cursor-pointer"
                >
                  <span className="material-symbols-rounded text-[15px]">unfold_more</span>
                  Show {comment.totalDescendants}{' '}
                  {comment.totalDescendants === 1 ? 'reply' : 'replies'}
                </button>
              ) : isDepthGated ? (
                <button
                  type="button"
                  onClick={() =>
                    setUnlockedDepthLimit((prev) => prev + DEPTH_UNLOCK_STEP)
                  }
                  style={{ color: 'var(--accent)' }}
                  className="liquid-glass mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold cursor-pointer"
                >
                  <span className="material-symbols-rounded text-[15px]">
                    subdirectory_arrow_right
                  </span>
                  Load {comment.totalDescendants} deeper{' '}
                  {comment.totalDescendants === 1 ? 'reply' : 'replies'}
                </button>
              ) : (
                <>
                  {displayedChildren.map((child) => (
                    <CommentNode
                      key={child.id}
                      comment={child}
                      depth={depth + 1}
                      maxAllowedDepth={unlockedDepthLimit}
                      storyAuthor={storyAuthor}
                      collapseAllReplies={false}
                      onInternalHnLinkClick={onInternalHnLinkClick}
                    />
                  ))}

                  {hiddenSiblingCount > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleDirectReplies((prev) => prev + INITIAL_SIBLING_REPLIES * 2)
                      }
                      style={{ color: 'var(--text-secondary)' }}
                      className="liquid-glass mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold cursor-pointer"
                    >
                      <span
                        style={{ color: 'var(--accent)' }}
                        className="material-symbols-rounded text-[15px]"
                      >
                        expand_more
                      </span>
                      Show {hiddenSiblingCount} more{' '}
                      {hiddenSiblingCount === 1 ? 'reply' : 'replies'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
