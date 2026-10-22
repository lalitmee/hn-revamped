'use client';

import React from 'react';
import { GlassModal } from '@/components/ui/GlassModal';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const shortcuts = [
    { key: 'j / k', desc: 'Select next / previous story in the feed' },
    {
      key: 'r',
      desc: 'Toggle between Discussion Comments and Article Reader View',
    },
    { key: 'z', desc: 'Toggle between Split-Pane Mode and Centered Zen Mode' },
    { key: 'b', desc: 'Bookmark / unbookmark the active story' },
    { key: 'o / Enter', desc: 'Open external story URL in a new tab' },
    { key: '/ or ⌘K', desc: 'Open Instant Algolia Search Modal' },
    { key: 't', desc: 'Open Theme & Typography Studio' },
    { key: '?', desc: 'Toggle Keyboard Shortcuts Help' },
  ];

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Navigation"
      icon="keyboard"
      maxWidthClass="max-w-md"
    >
      <div className="p-5 space-y-2.5">
        {shortcuts.map((s) => (
          <div
            key={s.key}
            className="liquid-glass flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs"
          >
            <span
              style={{ color: 'var(--text-secondary)' }}
              className="font-medium"
            >
              {s.desc}
            </span>
            <kbd
              style={{ color: 'var(--accent)' }}
              className="font-mono font-bold px-2.5 py-1 rounded-lg bg-black/25 border border-white/10"
            >
              {s.key}
            </kbd>
          </div>
        ))}
      </div>
    </GlassModal>
  );
};
