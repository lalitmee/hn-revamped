'use client';

import React from 'react';

export interface SegmentedItem<T extends string> {
  id: T;
  label: string;
  icon?: string;
  badge?: number | string;
}

interface GlassSegmentedControlProps<T extends string> {
  items: SegmentedItem<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
}

export function GlassSegmentedControl<T extends string>({
  items,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
}: GlassSegmentedControlProps<T>) {
  return (
    <div
      className={`liquid-glass p-1 rounded-2xl inline-flex items-center gap-1 ${
        fullWidth ? 'w-full flex' : ''
      }`}
    >
      {items.map((item) => {
        const isActive = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            style={{
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
            }}
            className={`${
              fullWidth ? 'flex-1 justify-center' : ''
            } ${
              size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-1.5 text-xs'
            } ${
              isActive ? 'liquid-glass-primary font-bold' : 'hover:bg-white/5 font-semibold'
            } inline-flex items-center gap-1.5 rounded-xl cursor-pointer transition-all select-none`}
          >
            {item.icon && (
              <span
                className={`material-symbols-rounded text-[16px] ${
                  isActive ? 'filled' : ''
                }`}
              >
                {item.icon}
              </span>
            )}
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span
                style={{
                  backgroundColor: isActive
                    ? 'rgba(255,255,255,0.22)'
                    : 'color-mix(in srgb, var(--text-muted) 20%, transparent)',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                }}
                className="px-1.5 py-0.2 rounded-full text-[10px] font-bold"
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
