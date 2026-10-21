'use client';

import React from 'react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'j / k', desc: 'Select next / previous story in the feed' },
    { key: 'r', desc: 'Toggle between Discussion Comments and Article Reader View' },
    { key: 'z', desc: 'Toggle between Split-Pane Mode and Centered Zen Mode' },
    { key: 'b', desc: 'Bookmark / unbookmark the active story' },
    { key: 'o / Enter', desc: 'Open external story URL in a new tab' },
    { key: '/ or ⌘K', desc: 'Open Instant Algolia Search Modal' },
    { key: 't', desc: 'Open Theme & Typography Studio' },
    { key: '?', desc: 'Toggle Keyboard Shortcuts Help' },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-surface-1)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
        className="w-full max-w-md rounded-3xl border p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2">
            <span style={{ color: 'var(--accent)' }} className="material-symbols-rounded">
              keyboard
            </span>
            Keyboard Navigation
          </h2>
          <button type="button" onClick={onClose} className="material-symbols-rounded cursor-pointer">
            close
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              style={{ backgroundColor: 'var(--bg-surface-2)' }}
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs"
            >
              <span style={{ color: 'var(--text-secondary)' }}>{s.desc}</span>
              <kbd
                style={{ color: 'var(--accent)' }}
                className="font-mono font-bold px-2 py-0.5 rounded bg-black/20"
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
