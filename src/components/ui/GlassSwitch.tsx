'use client';

import React from 'react';

interface GlassSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

export const GlassSwitch: React.FC<GlassSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
}) => {
  return (
    <div
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      className="group liquid-glass p-4 rounded-2xl flex items-center justify-between gap-4 cursor-pointer select-none"
    >
      <div>
        <div
          style={{ color: 'var(--text-primary)' }}
          className="text-sm font-semibold"
        >
          {label}
        </div>
        {description && (
          <div
            style={{ color: 'var(--text-muted)' }}
            className="text-xs mt-0.5"
          >
            {description}
          </div>
        )}
      </div>

      {/* Authentic Google Material 3 Switch Track & Thumb */}
      <div
        style={{
          backgroundColor: checked ? 'var(--accent)' : 'var(--bg-canvas)',
          borderColor: checked ? 'var(--accent)' : 'var(--text-muted)',
        }}
        className="relative w-13 h-8 rounded-full border-2 transition-colors duration-200 shrink-0 flex items-center px-1"
      >
        <span
          style={{
            backgroundColor: checked ? '#ffffff' : 'var(--text-muted)',
            transform: checked
              ? 'translate3d(20px, 0, 0)'
              : 'translate3d(2px, 0, 0)',
            transition:
              'transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1), width 150ms ease, height 150ms ease, background-color 150ms ease',
          }}
          className={`${
            checked ? 'w-5 h-5' : 'w-4 h-4'
          } group-active:w-6 rounded-full flex items-center justify-center`}
        >
          {checked && (
            <span
              style={{ color: 'var(--accent)' }}
              className="material-symbols-rounded text-[13px] font-bold"
            >
              check
            </span>
          )}
        </span>
      </div>
    </div>
  );
};
