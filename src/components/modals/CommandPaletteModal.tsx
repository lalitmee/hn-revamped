'use client';

import React, { useState, useEffect } from 'react';
import { HNStory } from '@/types/hn';
import { searchHN } from '@/lib/hn-api';
import { GlassModal } from '@/components/ui/GlassModal';
import { GlassSegmentedControl } from '@/components/ui/GlassSegmentedControl';

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
    if (!isOpen || !query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setLoading(true);
      searchHN({ query, sortBy })
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 240);
    return () => clearTimeout(timer);
  }, [query, sortBy, isOpen]);

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      topAligned
    >
      <div
        style={{ borderColor: 'color-mix(in srgb, var(--text-primary) 10%, transparent)' }}
        className="flex flex-wrap items-center gap-3 p-4 border-b"
      >
        <span style={{ color: 'var(--accent)' }} className="material-symbols-rounded text-[22px]">
          search
        </span>
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search all Hacker News stories via Algolia..."
          className="flex-1 bg-transparent text-base focus:outline-none min-w-[180px]"
        />
        <GlassSegmentedControl<'relevance' | 'date'>
          size="sm"
          value={sortBy}
          onChange={setSortBy}
          items={[
            { id: 'relevance', label: 'Top Relevance', icon: 'trending_up' },
            { id: 'date', label: 'Newest', icon: 'schedule' },
          ]}
        />
      </div>

      <div className="max-h-[58vh] overflow-y-auto p-3.5 space-y-2">
        {loading && (
          <div style={{ color: 'var(--text-muted)' }} className="py-10 text-center text-sm">
            Searching Hacker News archive...
          </div>
        )}

        {!loading && !query.trim() && (
          <div style={{ color: 'var(--text-muted)' }} className="py-10 text-center text-xs">
            Type any topic, domain, or Show HN title to search across all Hacker News history.
          </div>
        )}

        {!loading &&
          results.map((story) => (
            <button
              key={story.id}
              type="button"
              onClick={() => {
                onSelectStory(story);
                onClose();
              }}
              className="liquid-glass w-full text-left p-3.5 rounded-2xl flex items-center justify-between gap-4 cursor-pointer"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{story.cleanTitle}</div>
                <div style={{ color: 'var(--text-muted)' }} className="text-xs mt-1">
                  <strong style={{ color: 'var(--accent)' }}>▲ {story.points}</strong> • by{' '}
                  {story.user} {story.domain ? `• ${story.domain}` : ''}
                </div>
              </div>
              <span className="liquid-glass px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 inline-flex items-center gap-1">
                <span className="material-symbols-rounded text-[15px]">forum</span>
                {story.commentsCount}
              </span>
            </button>
          ))}
      </div>
    </GlassModal>
  );
};
