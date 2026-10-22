'use client';

import React, { useState, useEffect, startTransition } from 'react';
import { HNComment } from '@/types/hn';
import { formatCommentHtml } from '@/lib/html-sanitizer';
import { formatRelativeTime } from '@/components/feed/StoryPillRow';
import { SafeViewTransition } from '@/components/ui/ViewTransitionWrapper';

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
  initialSiblingReplies?: number;
  storyAuthor: string;
  collapseMode: ThreadCollapseMode;
  modeVersion?: number;
  onInternalHnLinkClick?: (storyId: number) => void;
}

export const CommentNode: React.FC<CommentNodeProps> = ({
  comment,
  depth,
  maxAllowedDepth = 2,
  initialSiblingReplies = INITIAL_SIBLING_REPLIES,
  storyAuthor,
  collapseMode,
  modeVersion = 0,
  onInternalHnLinkClick,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(
    collapseMode === 'collapse-all'
  );
  const [hideChildrenOnly, setHideChildrenOnly] = useState(
    collapseMode === 'root-only'
  );
  const [unlockedDepthLimit, setUnlockedDepthLimit] = useState(maxAllowedDepth);
  const [visibleDirectReplies, setVisibleDirectReplies] = useState(
    initialSiblingReplies
  );

  useEffect(() => {
    setUnlockedDepthLimit(maxAllowedDepth);
    setVisibleDirectReplies(initialSiblingReplies);
  }, [maxAllowedDepth, initialSiblingReplies]);

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

  const isDepthGated =
    depth >= unlockedDepthLimit && comment.children.length > 0;
  const displayedChildren = comment.children.slice(0, visibleDirectReplies);
  const hiddenSiblingCount = comment.children.length - displayedChildren.length;
  const totalCount = 1 + comment.totalDescendants;

  const toggleCollapsed = () => {
    startTransition(() => {
      setIsCollapsed((prev) => !prev);
    });
  };

  const isRoot = depth === 0;

  return (
    <SafeViewTransition>
      <div
        role={isCollapsed ? 'button' : undefined}
        tabIndex={isCollapsed ? 0 : undefined}
        onClick={
          isCollapsed
            ? (e) => {
                e.stopPropagation();
                startTransition(() => setIsCollapsed(false));
              }
            : undefined
        }
        onKeyDown={
          isCollapsed
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  startTransition(() => setIsCollapsed(false));
                }
              }
            : undefined
        }
        style={{
          backgroundColor: isCollapsed
            ? 'var(--bg-surface-2)'
            : isRoot
              ? 'var(--bg-surface-1)'
              : 'transparent',
          borderTop: isCollapsed
            ? '0px solid transparent'
            : isRoot
              ? '1px solid var(--border-subtle)'
              : '1px solid color-mix(in srgb, var(--border-subtle) 55%, transparent)',
          borderRight:
            isRoot && !isCollapsed
              ? '1px solid var(--border-subtle)'
              : '0px solid transparent',
          borderBottom:
            isRoot && !isCollapsed
              ? '1px solid var(--border-subtle)'
              : '0px solid transparent',
          borderLeft: isCollapsed
            ? `3px solid ${guideColor}`
            : isRoot
              ? '1px solid var(--border-subtle)'
              : '0px solid transparent',
          transition:
            'background-color 280ms cubic-bezier(0.22, 1, 0.36, 1), padding 280ms cubic-bezier(0.22, 1, 0.36, 1), margin 280ms cubic-bezier(0.22, 1, 0.36, 1), border-color 280ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        className={`relative focus:outline-none ${
          isCollapsed
            ? 'my-2 py-2 px-3 rounded-2xl cursor-pointer hover:brightness-105'
            : isRoot
              ? 'mb-2.5 p-3.5 rounded-2xl'
              : 'mt-2.5 pt-2.5'
        }`}
      >
        <div className="flex">
          {/* Interactive Full-Height Color Guide Bar (Smoothly collapses width when card mode is active) */}
          <button
            type="button"
            tabIndex={isCollapsed ? -1 : 0}
            aria-label={`Collapse comment thread by ${comment.user}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapsed();
            }}
            style={{
              width: isCollapsed ? '0px' : '16px',
              opacity: isCollapsed ? 0 : 1,
              transition:
                'width 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className="group/bar relative flex justify-center shrink-0 cursor-pointer overflow-hidden focus:outline-none"
          >
            <span
              style={{ backgroundColor: guideColor }}
              className="w-[3px] h-full rounded-full opacity-80 group-hover/bar:w-[5px] group-hover/bar:opacity-100 transition-all"
            />
          </button>

          <div
            style={{
              paddingLeft: isCollapsed ? '0px' : '8px',
              transition: 'padding-left 260ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className="flex-1 min-w-0"
          >
            {/* Persistent Header Row that Morphs Between Expanded Header & Collapsed Summary Card */}
            <div className="flex items-center justify-between gap-3 text-[13px]">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <span
                  style={{
                    color: isOP
                      ? 'var(--accent)'
                      : isCollapsed
                        ? `color-mix(in srgb, ${guideColor} 55%, var(--text-secondary))`
                        : `color-mix(in srgb, ${guideColor} 82%, var(--text-primary))`,
                    backgroundColor: isOP
                      ? 'color-mix(in srgb, var(--accent) 14%, transparent)'
                      : `color-mix(in srgb, ${guideColor} 12%, transparent)`,
                  }}
                  className="px-2 py-0.5 rounded-md font-semibold shrink-0 transition-colors duration-200"
                >
                  {comment.user}
                </span>

                {isOP && (
                  <span
                    style={{
                      backgroundColor:
                        'color-mix(in srgb, var(--accent) 20%, transparent)',
                      color: 'var(--accent)',
                    }}
                    className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0"
                  >
                    OP
                  </span>
                )}

                <span
                  style={{ color: 'var(--text-muted)' }}
                  className="shrink-0"
                >
                  • {formatRelativeTime(comment.time)}
                </span>

                {/* Inline Snippet that Smoothly Slides & Fades In When Collapsed */}
                {isCollapsed && (
                  <span
                    style={{ color: 'var(--text-muted)' }}
                    className="animate-comment-state ml-1.5 opacity-78 italic truncate"
                  >
                    &ldquo;{plainSnippet}...&rdquo;
                  </span>
                )}
              </div>

              {/* Persistent Right-Side Collapse / Expand Pill Button with Icon Rotation & Tonal Morph */}
              <button
                type="button"
                title={
                  isCollapsed
                    ? 'Expand comment thread'
                    : 'Collapse comment thread'
                }
                aria-label={
                  isCollapsed
                    ? `Expand comment by ${comment.user}`
                    : `Collapse comment by ${comment.user}`
                }
                aria-expanded={!isCollapsed}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapsed();
                }}
                style={{
                  backgroundColor: isCollapsed
                    ? 'color-mix(in srgb, var(--accent) 16%, transparent)'
                    : 'var(--bg-surface-2)',
                  color: isCollapsed
                    ? 'var(--accent)'
                    : 'var(--text-secondary)',
                  transition:
                    'background-color 260ms cubic-bezier(0.22, 1, 0.36, 1), color 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                className="h-7 px-2.5 rounded-full shrink-0 inline-flex items-center gap-1 text-xs font-bold cursor-pointer hover:brightness-110 active:scale-90 focus:outline-none"
              >
                <span
                  style={{
                    color: 'var(--accent)',
                    transform: isCollapsed
                      ? 'rotate(180deg) scale(1.05)'
                      : 'rotate(0deg) scale(1)',
                    transition:
                      'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                  className="material-symbols-rounded text-[15px]"
                >
                  {isCollapsed ? 'unfold_more' : 'unfold_less'}
                </span>
                <span>
                  {isCollapsed
                    ? `+${totalCount}`
                    : comment.totalDescendants > 0
                      ? `${totalCount}`
                      : 'Hide'}
                </span>
              </button>
            </div>

            {/* Smooth CSS Grid Accordion for Comment Prose Body & Nested Replies */}
            <div
              aria-hidden={isCollapsed}
              style={{
                display: 'grid',
                gridTemplateRows: isCollapsed ? '0fr' : '1fr',
                opacity: isCollapsed ? 0 : 1,
                marginTop: isCollapsed ? '0px' : '6px',
                transition:
                  'grid-template-rows 300ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms cubic-bezier(0.22, 1, 0.36, 1), margin-top 280ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              className={isCollapsed ? 'pointer-events-none select-none' : ''}
            >
              <div className="overflow-hidden min-h-0">
                {/* Comment Prose Body */}
                <div
                  className="hn-prose"
                  onClick={(e) => {
                    const target = (e.target as HTMLElement).closest(
                      'a[data-hn-item-id]'
                    );
                    if (target && onInternalHnLinkClick) {
                      e.preventDefault();
                      const id = Number(target.getAttribute('data-hn-item-id'));
                      if (id) onInternalHnLinkClick(id);
                    }
                  }}
                  dangerouslySetInnerHTML={{
                    __html: formatCommentHtml(comment.text),
                  }}
                />

                {/* Nested Replies: Collapsed / Depth-Gated / Progressive Sibling Batch */}
                {comment.children.length > 0 && (
                  <div className="animate-comment-state">
                    {hideChildrenOnly ? (
                      <button
                        type="button"
                        onClick={() =>
                          startTransition(() => setHideChildrenOnly(false))
                        }
                        style={{ color: 'var(--accent)' }}
                        className="liquid-glass mt-2.5 h-7 px-3 rounded-full inline-flex items-center gap-1.5 text-[12px] font-semibold cursor-pointer active:scale-95 transition-transform"
                      >
                        <span className="material-symbols-rounded text-[15px]">
                          unfold_more
                        </span>
                        Show {comment.totalDescendants}{' '}
                        {comment.totalDescendants === 1 ? 'reply' : 'replies'}
                      </button>
                    ) : isDepthGated ? (
                      <button
                        type="button"
                        onClick={() =>
                          startTransition(() =>
                            setUnlockedDepthLimit(
                              (prev) => prev + DEPTH_UNLOCK_STEP
                            )
                          )
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
                            initialSiblingReplies={initialSiblingReplies}
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
                              startTransition(() =>
                                setVisibleDirectReplies(
                                  (prev) => prev + INITIAL_SIBLING_REPLIES * 2
                                )
                              )
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
        </div>
      </div>
    </SafeViewTransition>
  );
};
