'use client';

import React, { useState, useEffect, useRef, startTransition } from 'react';
import { HNStory } from '@/types/hn';
import { searchHN } from '@/lib/hn-api';
import { GlassModal } from '@/components/ui/GlassModal';
import { MobileBottomSheet } from '@/components/ui/MobileBottomSheet';
import { GlassSegmentedControl } from '@/components/ui/GlassSegmentedControl';
import { SafeViewTransition } from '@/components/ui/ViewTransitionWrapper';
import { SearchStoryCard } from './SearchStoryCard';

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
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) setIsSortOpen(false);
  }, [isOpen]);

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
      mobileFullscreen
      bodyScrollable={false}
    >
      <div
        style={{
          borderColor:
            'color-mix(in srgb, var(--text-primary) 10%, transparent)',
        }}
        className="flex flex-wrap items-center gap-3 p-3 sm:p-4 border-b shrink-0"
      >
        <div className="flex w-full sm:w-auto sm:flex-1 items-center gap-2 min-w-0">
          <button
            type="button"
            aria-label="Back from search"
            onClick={onClose}
            className="sm:hidden w-9 h-9 shrink-0 inline-flex items-center justify-center"
          >
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <span
            style={{ color: 'var(--accent)' }}
            className={`material-symbols-rounded text-[22px] max-sm:hidden transition-transform ${
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
            placeholder="Search Hacker News"
            aria-label="Search Hacker News"
            className="flex-1 bg-transparent text-base focus:outline-none min-w-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search query"
              style={{ color: 'var(--text-muted)' }}
              className="w-7 h-7 rounded-full inline-flex items-center justify-center hover:brightness-125 cursor-pointer"
            >
              <span className="material-symbols-rounded text-[16px]">
                close
              </span>
            </button>
          )}
          <button
            ref={sortTriggerRef}
            type="button"
            aria-label={`Sort results: ${sortBy === 'relevance' ? 'Top Relevance' : 'Newest'}`}
            aria-haspopup="dialog"
            aria-expanded={isSortOpen}
            onClick={() => setIsSortOpen(true)}
            className="liquid-glass sm:hidden w-9 h-9 rounded-full inline-flex items-center justify-center shrink-0"
          >
            <span
              aria-hidden="true"
              className="material-symbols-rounded text-[20px]"
            >
              sort
            </span>
          </button>
        </div>
        <div className="max-sm:hidden">
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
      </div>
      <MobileBottomSheet
        isOpen={isSortOpen && isOpen}
        onClose={() => setIsSortOpen(false)}
        title="Sort results"
        ariaLabel="Sort search results"
        triggerRef={sortTriggerRef}
      >
        {(
          [
            { id: 'relevance', label: 'Top Relevance', icon: 'trending_up' },
            { id: 'date', label: 'Newest', icon: 'schedule' },
          ] as const
        ).map((option) => (
          <button
            key={option.id}
            type="button"
            aria-current={sortBy === option.id ? 'true' : undefined}
            onClick={() => {
              startTransition(() => setSortBy(option.id));
              setIsSortOpen(false);
            }}
            className="w-full min-h-12 px-4 rounded-xl flex items-center gap-3 text-left font-medium"
            style={{
              backgroundColor:
                sortBy === option.id ? 'var(--bg-surface-active)' : undefined,
              color:
                sortBy === option.id ? 'var(--accent)' : 'var(--text-primary)',
            }}
          >
            <span aria-hidden="true" className="material-symbols-rounded">
              {option.icon}
            </span>
            {option.label}
            {sortBy === option.id && (
              <span
                aria-hidden="true"
                className="material-symbols-rounded ml-auto"
              >
                check
              </span>
            )}
          </button>
        ))}
      </MobileBottomSheet>

      <SafeViewTransition>
        <div className="custom-scrollbar flex-1 min-h-0 sm:max-h-[58vh] sm:min-h-[260px] overflow-y-auto p-3 sm:p-3.5 space-y-2">
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
                <SearchStoryCard
                  key={i}
                  index={i}
                  skeleton
                  story={{
                    id: i,
                    title: 'An interesting story from the community',
                    cleanTitle:
                      i % 2 === 0
                        ? 'An interesting story from the community'
                        : 'A new perspective on building things for the web and beyond',
                    points: 128,
                    domain: 'example.com',
                    user: 'reader',
                    time: Math.floor(Date.now() / 1000) - 3600,
                    commentsCount: 24,
                    badges: [],
                    type: 'story',
                  }}
                />
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
              <SearchStoryCard
                key={story.id}
                story={story}
                index={idx}
                onSelect={() => {
                  onSelectStory(story);
                  onClose();
                }}
              />
            ))}
        </div>
      </SafeViewTransition>
    </GlassModal>
  );
};
