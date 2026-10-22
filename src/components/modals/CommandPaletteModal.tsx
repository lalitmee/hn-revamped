'use client';

import React, { useState, useEffect, startTransition } from 'react';
import { HNStory } from '@/types/hn';
import { searchHN } from '@/lib/hn-api';
import { GlassModal } from '@/components/ui/GlassModal';
import { GlassSegmentedControl } from '@/components/ui/GlassSegmentedControl';
import { SafeViewTransition } from '@/components/ui/ViewTransitionWrapper';
import { formatRelativeTimeConcise } from '@/components/feed/StoryPillRow';

const publishedDateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStory: (story: HNStory) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectStory,
}) => {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance');
  const [results, setResults] = useState<HNStory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!isOpen || !trimmed) {
      setLoading(false);
      setResults([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(() => {
      searchHN({ query: trimmed, sortBy })
        .then((hits) => {
          if (!cancelled) {
            setResults(hits);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setResults([]);
            setLoading(false);
          }
        });
    }, 240);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, sortBy, isOpen]);

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      topAligned
    >
      <div
        style={{
          borderColor:
            'color-mix(in srgb, var(--text-primary) 10%, transparent)',
        }}
        className="flex flex-wrap items-center gap-3 p-4 border-b"
      >
        <span
          style={{ color: 'var(--accent)' }}
          className={`material-symbols-rounded text-[22px] transition-transform ${
            loading ? 'animate-spin' : ''
          }`}
        >
          {loading ? 'progress_activity' : 'search'}
        </span>
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search all Hacker News stories via Algolia..."
          className="flex-1 bg-transparent text-base focus:outline-none min-w-[180px]"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search query"
            style={{ color: 'var(--text-muted)' }}
            className="w-7 h-7 rounded-full inline-flex items-center justify-center hover:brightness-125 cursor-pointer"
          >
            <span className="material-symbols-rounded text-[16px]">close</span>
          </button>
        )}
        <GlassSegmentedControl<'relevance' | 'date'>
          size="sm"
          value={sortBy}
          onChange={(nextSort) => startTransition(() => setSortBy(nextSort))}
          items={[
            { id: 'relevance', label: 'Top Relevance', icon: 'trending_up' },
            { id: 'date', label: 'Newest', icon: 'schedule' },
          ]}
        />
      </div>

      <SafeViewTransition>
        <div className="custom-scrollbar max-h-[58vh] min-h-[260px] overflow-y-auto p-3.5 space-y-2">
          {loading && (
            <div className="space-y-2.5 py-1" role="status" aria-live="polite">
              <div
                style={{ color: 'var(--text-muted)' }}
                className="flex items-center gap-2 px-2 py-1 text-xs font-medium"
              >
                <span
                  style={{ color: 'var(--accent)' }}
                  className="material-symbols-rounded text-[15px] animate-spin"
                >
                  progress_activity
                </span>
                <span>Searching Hacker News archive...</span>
              </div>

              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`search-skeleton-${i}`}
                  style={{ animationDelay: `${i * 45}ms` }}
                  className="liquid-glass liquid-shimmer animate-story-in w-full p-3.5 rounded-2xl flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <div
                      style={{
                        backgroundColor:
                          'color-mix(in srgb, var(--text-primary) 12%, transparent)',
                      }}
                      className={`h-4 rounded-full ${i % 2 === 0 ? 'w-4/5' : 'w-3/5'}`}
                    />
                    <div className="flex items-center gap-2.5">
                      <div
                        style={{
                          backgroundColor:
                            'color-mix(in srgb, var(--accent) 25%, transparent)',
                        }}
                        className="h-3 w-10 rounded-full"
                      />
                      <div
                        style={{
                          backgroundColor:
                            'color-mix(in srgb, var(--text-muted) 18%, transparent)',
                        }}
                        className="h-3 w-16 rounded-full"
                      />
                      <div
                        style={{
                          backgroundColor:
                            'color-mix(in srgb, var(--link-unvisited) 18%, transparent)',
                        }}
                        className="h-3 w-24 rounded-full"
                      />
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5 pl-2">
                    <div
                      style={{
                        backgroundColor:
                          'color-mix(in srgb, var(--text-primary) 10%, transparent)',
                      }}
                      className="h-6 w-12 rounded-xl"
                    />
                    <div
                      style={{
                        backgroundColor:
                          'color-mix(in srgb, var(--text-muted) 16%, transparent)',
                      }}
                      className="h-3 w-14 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !query.trim() && (
            <div
              style={{ color: 'var(--text-muted)' }}
              className="h-[220px] flex flex-col items-center justify-center text-center px-6 gap-2"
            >
              <span
                style={{ color: 'var(--accent)' }}
                className="material-symbols-rounded text-[32px] opacity-80"
              >
                manage_search
              </span>
              <div className="text-xs max-w-sm leading-relaxed">
                Type any topic, domain, or Show HN title to search across all
                Hacker News history.
              </div>
            </div>
          )}

          {!loading && query.trim() && results.length === 0 && (
            <div
              style={{ color: 'var(--text-muted)' }}
              className="h-[220px] flex flex-col items-center justify-center text-center px-6 gap-2 animate-story-in"
            >
              <span className="material-symbols-rounded text-[32px] opacity-60">
                search_off
              </span>
              <div
                className="text-sm font-semibold"
                style={{ color: 'var(--text-secondary)' }}
              >
                No stories found for &ldquo;{query.trim()}&rdquo;
              </div>
              <div className="text-xs">
                Try a broader keyword or switch between Top Relevance and
                Newest.
              </div>
            </div>
          )}

          {!loading &&
            Boolean(query.trim()) &&
            results.map((story, idx) => (
              <button
                key={story.id}
                type="button"
                onClick={() => {
                  onSelectStory(story);
                  onClose();
                }}
                style={{ animationDelay: `${Math.min(idx * 35, 280)}ms` }}
                className="liquid-glass animate-story-in w-full text-left p-3.5 rounded-2xl flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">
                    {story.cleanTitle}
                  </div>
                  <div
                    style={{ color: 'var(--text-muted)' }}
                    className="flex items-center flex-wrap gap-2.5 text-xs mt-1.5"
                  >
                    <span
                      style={{ color: 'var(--accent)' }}
                      className="font-semibold inline-flex items-center gap-0.5"
                    >
                      <span>▲</span> {story.points}
                    </span>

                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-rounded text-[13px]">
                        person
                      </span>
                      <span>{story.user}</span>
                    </span>

                    {story.domain && (
                      <span className="inline-flex items-center gap-1 truncate max-w-[200px]">
                        <span
                          style={{ color: 'var(--link-unvisited)' }}
                          className="material-symbols-rounded text-[13px]"
                        >
                          language
                        </span>
                        <span className="truncate">{story.domain}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1.5 pl-2">
                  <span className="liquid-glass px-2.5 py-1 rounded-xl text-xs font-semibold inline-flex items-center gap-1">
                    <span className="material-symbols-rounded text-[14px]">
                      forum
                    </span>
                    {story.commentsCount}
                  </span>
                  <time
                    dateTime={new Date(story.time * 1000).toISOString()}
                    title={`Published ${publishedDateFormatter.format(
                      new Date(story.time * 1000)
                    )} (${new Date(story.time * 1000).toLocaleString()})`}
                    style={{ color: 'var(--text-muted)' }}
                    className="text-[11px] font-medium tracking-tight hover:underline inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-rounded text-[12px] opacity-70">
                      schedule
                    </span>
                    {formatRelativeTimeConcise(story.time)}
                  </time>
                </div>
              </button>
            ))}
        </div>
      </SafeViewTransition>
    </GlassModal>
  );
};
