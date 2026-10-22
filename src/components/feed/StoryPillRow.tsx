'use client';

import React from 'react';
import { HNStory } from '@/types/hn';

export function formatRelativeTime(unixSeconds: number): string {
  const diffSec = Math.max(1, Math.floor(Date.now() / 1000) - unixSeconds);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  const years = Math.floor(diffDays / 365);
  const remAfterYears = diffDays % 365;
  let months = Math.floor(remAfterYears / 30);
  let resolvedYears = years;
  let days = remAfterYears % 30;

  if (months >= 12) {
    resolvedYears += 1;
    months -= 12;
  }

  const parts: string[] = [];
  if (resolvedYears > 0) parts.push(`${resolvedYears}y`);
  if (months > 0) parts.push(`${months}m`);
  if (days > 0) parts.push(`${days}d`);

  return `${parts.join(' ')} ago`;
}

export function formatRelativeTimeConcise(unixSeconds: number): string {
  const diffSec = Math.max(1, Math.floor(Date.now() / 1000) - unixSeconds);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  const years = Math.floor(diffDays / 365);
  const remAfterYears = diffDays % 365;
  let months = Math.floor(remAfterYears / 30);
  let resolvedYears = years;

  if (months >= 12) {
    resolvedYears += 1;
    months -= 12;
  }

  if (resolvedYears > 0) return `${resolvedYears}y ago`;
  return `${Math.max(1, months)}mo ago`;
}

interface StoryPillRowProps {
  story: HNStory;
  index: number;
  isSelected: boolean;
  hasFloatingIndicator?: boolean;
  compact?: boolean;
  isRead: boolean;
  newCommentsDelta: number;
  isBookmarked: boolean;
  onSelect: (story: HNStory) => void;
  onToggleBookmark: (story: HNStory, e: React.MouseEvent) => void;
}

export const StoryPillRow: React.FC<StoryPillRowProps> = ({
  story,
  index,
  isSelected,
  hasFloatingIndicator = false,
  compact = false,
  isRead,
  newCommentsDelta,
  isBookmarked,
  onSelect,
  onToggleBookmark,
}) => {
  const isHot = story.points >= 250;
  const showInlineSelection = isSelected && !hasFloatingIndicator;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect(story)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(story);
        }
      }}
      style={{
        backgroundColor: showInlineSelection
          ? 'var(--bg-surface-active)'
          : isSelected
            ? 'transparent'
            : 'var(--bg-surface-1)',
        borderColor: showInlineSelection
          ? 'color-mix(in srgb, var(--accent) 55%, var(--border-subtle))'
          : isSelected
            ? 'transparent'
            : 'var(--border-subtle)',
        opacity: isRead && !isSelected ? 0.68 : 1,
        transition:
          'background-color 240ms cubic-bezier(0.22, 1, 0.36, 1), border-color 240ms cubic-bezier(0.22, 1, 0.36, 1), transform 200ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      className={`group relative z-10 overflow-hidden flex items-center border cursor-pointer hover:brightness-105 active:scale-[0.995] focus:outline-none ${
        compact ? 'gap-3 rounded-xl px-3 py-2' : 'gap-4 rounded-2xl p-4'
      }`}
    >
      {/* Fallback Left Selection Indicator Bar (when floating indicator is not yet measured) */}
      <span
        aria-hidden="true"
        style={{
          backgroundColor: 'var(--accent)',
          transform: showInlineSelection ? 'scaleY(1)' : 'scaleY(0)',
          opacity: showInlineSelection ? 1 : 0,
          transition:
            'transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease',
        }}
        className={`absolute left-0 w-1 rounded-r-full ${compact ? 'top-2 bottom-2' : 'top-3 bottom-3'}`}
      />
      {/* Left Zone: Score & Heat Pill */}
      <div
        style={{
          backgroundColor: isHot
            ? 'color-mix(in srgb, var(--accent) 18%, transparent)'
            : 'var(--bg-surface-2)',
          color: isRead && !isSelected ? 'var(--text-muted)' : 'var(--accent)',
        }}
        className={`flex items-center justify-center font-bold shrink-0 ${
          compact
            ? 'flex-row min-w-[48px] h-8 px-2.5 rounded-lg'
            : 'flex-col min-w-[52px] h-[54px] rounded-xl'
        }`}
      >
        <span
          className={`material-symbols-rounded ${
            compact ? 'text-[16px] -ml-1 -mr-0.5' : 'text-[18px]'
          }`}
        >
          {isRead && !isSelected ? 'check' : 'keyboard_arrow_up'}
        </span>
        <span className="text-[13px] leading-tight tabular-nums">
          {story.points}
        </span>
      </div>

      {compact ? (
        <>
          {/* Compact Center Zone: Title + single metadata line */}
          <div className="flex-1 min-w-0">
            <h3
              style={{ color: 'var(--text-primary)' }}
              className="text-[14.5px] font-semibold leading-snug tracking-tight line-clamp-2"
            >
              {story.cleanTitle}
            </h3>
            <div
              style={{ color: 'var(--text-muted)' }}
              className="flex items-center gap-1.5 mt-0.5 text-[12px] min-w-0"
            >
              <span className="font-mono shrink-0">#{index}</span>
              {story.badges.map((badge) => (
                <span
                  key={badge.type}
                  title={badge.label}
                  style={{ color: 'var(--link-unvisited)' }}
                  className="material-symbols-rounded text-[14px] shrink-0"
                >
                  {badge.icon}
                </span>
              ))}
              {story.domain && (
                <span
                  className="truncate"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {story.domain}
                </span>
              )}
              <span className="shrink-0">· {story.user}</span>
              <span className="shrink-0">
                · {formatRelativeTime(story.time)}
              </span>
              {newCommentsDelta > 0 && (
                <span className="shrink-0 px-1.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400">
                  +{newCommentsDelta}
                </span>
              )}
            </div>
          </div>

          {/* Compact Right Zone */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark story'}
              onClick={(e) => onToggleBookmark(story, e)}
              style={{
                color: isBookmarked ? 'var(--accent)' : 'var(--text-muted)',
                backgroundColor: isBookmarked
                  ? 'color-mix(in srgb, var(--accent) 14%, transparent)'
                  : undefined,
              }}
              className="w-8 h-8 rounded-lg inline-flex items-center justify-center leading-none shrink-0 hover:bg-white/10 active:scale-95 transition-all focus:outline-none"
            >
              <span
                className={`material-symbols-rounded text-[18px] leading-none ${
                  isBookmarked ? 'filled' : ''
                }`}
              >
                bookmark
              </span>
            </button>
            <div
              style={{
                backgroundColor: 'var(--bg-surface-2)',
                color: 'var(--text-primary)',
              }}
              className="h-8 px-2.5 rounded-lg inline-flex items-center justify-center gap-1 text-[12.5px] font-semibold leading-none"
            >
              <span
                style={{ color: 'var(--text-muted)' }}
                className="material-symbols-rounded text-[15px] leading-none"
              >
                forum
              </span>
              <span>{story.commentsCount}</span>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Center Zone: Badges, Clean Title & Thoughtful Metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span
                style={{ color: 'var(--text-muted)' }}
                className="text-[11px] font-mono font-semibold"
              >
                #{index}
              </span>

              {story.badges.map((badge) => (
                <span
                  key={badge.type}
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--link-unvisited) 15%, transparent)',
                    color: 'var(--link-unvisited)',
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase"
                >
                  <span className="material-symbols-rounded text-[13px]">
                    {badge.icon}
                  </span>
                  {badge.label}
                </span>
              ))}

              {story.domain && (
                <span
                  style={{ color: 'var(--text-secondary)' }}
                  className="inline-flex items-center gap-1 text-[12.5px] font-medium truncate"
                >
                  <span
                    style={{ color: 'var(--link-unvisited)' }}
                    className="material-symbols-rounded text-[14px]"
                  >
                    language
                  </span>
                  {story.domain}
                </span>
              )}
            </div>

            <h3
              style={{ color: 'var(--text-primary)' }}
              className="text-[17px] font-semibold leading-snug tracking-tight"
            >
              {story.cleanTitle}
            </h3>

            <div
              style={{ color: 'var(--text-muted)' }}
              className="flex items-center flex-wrap gap-3 mt-2 text-[12.5px]"
            >
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-rounded text-[14px]">
                  person
                </span>
                <strong
                  style={{ color: 'var(--text-secondary)' }}
                  className="font-medium"
                >
                  {story.user}
                </strong>
              </span>

              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-rounded text-[14px]">
                  schedule
                </span>
                {formatRelativeTime(story.time)}
              </span>

              {newCommentsDelta > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400">
                  +{newCommentsDelta} new
                </span>
              )}
            </div>
          </div>

          {/* Right Zone: Bookmark & Comment Count Pill */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark story'}
              onClick={(e) => onToggleBookmark(story, e)}
              style={{
                color: isBookmarked ? 'var(--accent)' : 'var(--text-muted)',
                backgroundColor: isBookmarked
                  ? 'color-mix(in srgb, var(--accent) 14%, transparent)'
                  : undefined,
              }}
              className="w-9 h-9 rounded-xl inline-flex items-center justify-center leading-none shrink-0 hover:bg-white/10 active:scale-95 transition-all focus:outline-none"
            >
              <span
                className={`material-symbols-rounded text-[19px] leading-none ${
                  isBookmarked ? 'filled' : ''
                }`}
              >
                bookmark
              </span>
            </button>

            <div
              style={{
                backgroundColor: 'var(--bg-surface-2)',
                color: 'var(--text-primary)',
              }}
              className="h-9 px-3.5 rounded-xl inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold leading-none"
            >
              <span
                style={{ color: 'var(--text-muted)' }}
                className="material-symbols-rounded text-[17px] leading-none"
              >
                forum
              </span>
              <span>{story.commentsCount}</span>
            </div>
          </div>
        </>
      )}
    </article>
  );
};
