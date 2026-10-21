'use client';

import React, { useState, useEffect } from 'react';
import { HNComment } from '@/types/hn';
import { formatCommentHtml } from '@/lib/html-sanitizer';
import { formatRelativeTime } from '@/components/feed/StoryPillRow';

export type ThreadCollapseMode = 'expanded' | 'root-only' | 'collapse-all';

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
  collapseMode: ThreadCollapseMode;
  modeVersion?: number;
  onInternalHnLinkClick?: (storyId: number) => void;
}

export const CommentNode: React.FC<CommentNodeProps> = ({
  comment,
  depth,
  maxAllowedDepth = 2,
  storyAuthor,
  collapseMode,
  modeVersion = 0,
  onInternalHnLinkClick,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapseMode === 'collapse-all');
  const [hideChildrenOnly, setHideChildrenOnly] = useState(collapseMode === 'root-only');
  const [unlockedDepthLimit, setUnlockedDepthLimit] = useState(maxAllowedDepth);
  const [visibleDirectReplies, setVisibleDirectReplies] = useState(INITIAL_SIBLING_REPLIES);

  useEffect(() => {
    if (collapseMode === 'collapse-all') {
      setIsCollapsed(true);
      setHideChildrenOnly(false);
    } else if (collapseMode === 'root-only') {
      setIsCollapsed(false);
      setHideChildrenOnly(true);
    } else {
      setIsCollapsed(false);
      setHideChildrenOnly(false);
    }
  }, [collapseMode, modeVersion]);

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
        className="liquid-glass animate-comment-state my-2.5 py-2.5 px-3.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer text-[13px] focus:outline-none"
      >
        <div className="truncate flex items-center gap-1.5 min-w-0">
          <strong style={{ color: isOP ? 'var(--accent)' : 'var(--text-secondary)' }}>
            {comment.user}
          </strong>
          {isOP && (
            <span
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent) 20%, transparent)',
                color: 'var(--accent)',
              }}
              className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider shrink-0"
            >
              OP
            </span>
          )}
          <span className="opacity-60">•</span>
          <span className="shrink-0">{formatRelativeTime(comment.time)}</span>
          <span className="ml-1.5 opacity-75 italic truncate">&ldquo;{plainSnippet}...&rdquo;</span>
        </div>

        <span
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent) 16%, transparent)',
            color: 'var(--accent)',
          }}
          className="h-7 px-3 rounded-full text-xs font-bold shrink-0 inline-flex items-center gap-1"
        >
          <span className="material-symbols-rounded text-[15px]">unfold_more</span>
          <span>+{1 + comment.totalDescendants}</span>
        </span>
      </div>
    );
  }

  const isDepthGated = depth >= unlockedDepthLimit && comment.children.length > 0;
  const displayedChildren = comment.children.slice(0, visibleDirectReplies);
  const hiddenSiblingCount = comment.children.length - displayedChildren.length;

  return (
    <div className={`animate-comment-state relative ${depth > 0 ? 'mt-3.5' : 'mt-5'}`}>
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
          {/* Comment Header with Accessible Material 3 Collapse Pill Button */}
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
                className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
              >
                OP
              </span>
            )}

            <span style={{ color: 'var(--text-muted)' }}>• {formatRelativeTime(comment.time)}</span>

            <button
              type="button"
              title="Collapse comment thread"
              aria-label={`Collapse comment by ${comment.user}`}
              onClick={() => setIsCollapsed(true)}
              style={{ color: 'var(--text-secondary)' }}
              className="liquid-glass ml-auto h-7 px-2.5 rounded-full inline-flex items-center gap-1 text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
            >
              <span
                style={{ color: 'var(--accent)' }}
                className="material-symbols-rounded text-[15px]"
              >
                unfold_less
              </span>
              <span>
                {comment.totalDescendants > 0
                  ? `${1 + comment.totalDescendants}`
                  : 'Hide'}
              </span>
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
            <div className="animate-comment-state">
              {hideChildrenOnly ? (
                <button
                  type="button"
                  onClick={() => setHideChildrenOnly(false)}
                  style={{ color: 'var(--accent)' }}
                  className="liquid-glass mt-2.5 h-7 px-3 rounded-full inline-flex items-center gap-1.5 text-[12px] font-semibold cursor-pointer active:scale-95 transition-transform"
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
                  className="liquid-glass mt-2.5 h-7 px-3.5 rounded-full inline-flex items-center gap-1.5 text-[12px] font-semibold cursor-pointer active:scale-95 transition-transform"
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
                      collapseMode="expanded"
                      modeVersion={modeVersion}
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
                      className="liquid-glass mt-3 h-7 px-3 rounded-full inline-flex items-center gap-1.5 text-[12px] font-semibold cursor-pointer active:scale-95 transition-transform"
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
