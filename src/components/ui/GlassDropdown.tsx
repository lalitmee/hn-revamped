'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface GlassDropdownOption<T extends string> {
  id: T;
  label: string;
  icon?: string;
  description?: string;
}

interface GlassDropdownProps<T extends string> {
  value: T;
  options: GlassDropdownOption<T>[];
  onChange: (value: T) => void;
  leadingIcon?: string;
  ariaLabel?: string;
}

export function GlassDropdown<T extends string>({
  value,
  options,
  onChange,
  leadingIcon = 'history',
  ariaLabel = 'Select option',
}: GlassDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.id === value) ?? options[0];

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{ color: 'var(--text-primary)' }}
        className="liquid-glass h-9 px-3.5 rounded-full inline-flex items-center gap-2 text-xs font-semibold cursor-pointer select-none shrink-0"
      >
        <span
          style={{ color: 'var(--accent)' }}
          className="material-symbols-rounded text-[17px]"
        >
          {leadingIcon}
        </span>
        <span className="leading-none whitespace-nowrap">{selectedOption?.label}</span>
        <span
          style={{ color: 'var(--text-muted)' }}
          className={`material-symbols-rounded text-[16px] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="liquid-glass-elevated animate-glass-pop absolute right-0 mt-2 w-56 rounded-2xl p-1.5 z-50 space-y-0.5"
        >
          {options.map((opt) => {
            const isSelected = opt.id === value;
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.id);
                  setIsOpen(false);
                }}
                style={{
                  backgroundColor: isSelected
                    ? 'color-mix(in srgb, var(--accent) 16%, transparent)'
                    : undefined,
                  color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                }}
                className="w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-2 text-xs font-semibold cursor-pointer transition-colors hover:bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)] text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {opt.icon && (
                    <span className="material-symbols-rounded text-[16px]">{opt.icon}</span>
                  )}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && (
                  <span className="material-symbols-rounded text-[16px] shrink-0">
                    check
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
