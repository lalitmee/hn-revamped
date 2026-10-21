'use client';

import React, { useState, useEffect } from 'react';
import { HNStory } from '@/types/hn';
import { searchHN } from '@/lib/hn-api';

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

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-xs p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-surface-1)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
        className="w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden"
      >
        <div
          style={{ borderColor: 'var(--border-subtle)' }}
          className="flex items-center gap-3 p-4 border-b"
        >
          <span style={{ color: 'var(--accent)' }} className="material-symbols-rounded">
            search
          </span>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all Hacker News stories via Algolia..."
            className="flex-1 bg-transparent text-base focus:outline-none"
          />
          <div className="flex gap-1">
            {(['relevance', 'date'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSortBy(s)}
                style={{
                  backgroundColor: sortBy === s ? 'var(--accent)' : 'var(--bg-surface-2)',
                  color: sortBy === s ? '#fff' : 'var(--text-secondary)',
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold capitalize cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2">
          {loading && (
            <div style={{ color: 'var(--text-muted)' }} className="py-8 text-center text-sm">
              Searching Hacker News archive...
            </div>
          )}

          {!loading && results.map((story) => (
            <button
              key={story.id}
              type="button"
              onClick={() => {
                onSelectStory(story);
                onClose();
              }}
              style={{ backgroundColor: 'var(--bg-surface-2)' }}
              className="w-full text-left p-3 rounded-2xl flex items-center justify-between gap-4 hover:brightness-110 cursor-pointer"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{story.cleanTitle}</div>
                <div style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5">
                  ▲ {story.points} • by {story.user} {story.domain ? `• ${story.domain}` : ''}
                </div>
              </div>
              <span className="text-xs font-semibold shrink-0">💬 {story.commentsCount}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
