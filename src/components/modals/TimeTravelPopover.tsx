'use client';

import React from 'react';

export type TimeTravelPreset = 'live' | 'yesterday' | 'last-week' | 'last-month' | 'one-year-ago';

interface TimeTravelPopoverProps {
  activePreset: TimeTravelPreset;
  onSelectPreset: (preset: TimeTravelPreset) => void;
}

export const TimeTravelPopover: React.FC<TimeTravelPopoverProps> = ({
  activePreset,
  onSelectPreset,
}) => {
  const presets: { id: TimeTravelPreset; label: string }[] = [
    { id: 'live', label: 'Live Front Page' },
    { id: 'yesterday', label: 'Yesterday Top' },
    { id: 'last-week', label: 'Past 7 Days Top' },
    { id: 'last-month', label: 'Past 30 Days Top' },
    { id: 'one-year-ago', label: '1 Year Ago Today' },
  ];

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        style={{ color: 'var(--accent)' }}
        className="material-symbols-rounded text-[18px]"
      >
        history
      </span>
      <select
        aria-label="Time travel front page"
        value={activePreset}
        onChange={(e) => onSelectPreset(e.target.value as TimeTravelPreset)}
        style={{
          backgroundColor: 'var(--bg-surface-2)',
          color: 'var(--text-primary)',
          borderColor: 'var(--border-subtle)',
        }}
        className="px-2.5 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none cursor-pointer"
      >
        {presets.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
};
