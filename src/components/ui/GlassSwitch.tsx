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
      className="group liquid-glass p-3.5 rounded-2xl flex items-center justify-between gap-4 cursor-pointer select-none"
    >
      <div>
        <div style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold">
          {label}
        </div>
        {description && (
          <div style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5">
            {description}
          </div>
        )}
      </div>

      <div
        style={{
          background: checked
            ? 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 95%, #ffffff 15%), var(--accent))'
            : 'color-mix(in srgb, var(--bg-canvas) 65%, transparent)',
          borderColor: checked ? 'var(--accent)' : 'var(--border-subtle)',
          boxShadow: checked
            ? 'inset 0 1px 1px rgba(255,255,255,0.35), 0 0 14px color-mix(in srgb, var(--accent) 45%, transparent)'
            : 'inset 0 1px 3px rgba(0,0,0,0.35)',
        }}
        className="relative w-12 h-7 rounded-full border p-0.5 transition-all duration-300 shrink-0 flex items-center"
      >
        <span
          style={{
            transform: checked ? 'translate3d(20px, 0, 0)' : 'translate3d(0px, 0, 0)',
            transition: 'transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1), width 150ms ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.85)',
          }}
          className="w-5 h-5 group-active:w-6 rounded-full bg-white"
        />
      </div>
    </div>
  );
};
