'use client';

import React from 'react';

interface GlassSliderProps {
  label: string;
  valueLabel: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

export const GlassSlider: React.FC<GlassSliderProps> = ({
  label,
  valueLabel,
  value,
  min,
  max,
  step = 1,
  onChange,
}) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className="liquid-glass p-4 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <span style={{ color: 'var(--text-secondary)' }} className="text-xs font-bold uppercase tracking-wider">
          {label}
        </span>
        <span
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent) 18%, transparent)',
            color: 'var(--accent)',
          }}
          className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono"
        >
          {valueLabel}
        </span>
      </div>

      <div className="relative h-6 flex items-center">
        {/* Liquid Glass Progress Track */}
        <div
          style={{
            backgroundColor: 'color-mix(in srgb, var(--bg-canvas) 65%, transparent)',
            borderColor: 'var(--border-subtle)',
          }}
          className="w-full h-2.5 rounded-full border overflow-hidden p-[1px]"
        >
          <div
            style={{
              width: `${percentage}%`,
              background:
                'linear-gradient(90deg, color-mix(in srgb, var(--accent) 60%, transparent), var(--accent))',
              boxShadow: '0 0 10px color-mix(in srgb, var(--accent) 50%, transparent)',
            }}
            className="h-full rounded-full transition-all duration-100"
          />
        </div>

        {/* Native Range Input Overlaid for Accessibility + Drag */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {/* Visual Liquid Glass Thumb */}
        <div
          style={{
            left: `calc(${percentage}% - 10px)`,
            background: 'linear-gradient(135deg, #ffffff, #e4e4e7)',
            borderColor: 'var(--accent)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 #ffffff',
          }}
          className="pointer-events-none absolute w-5 h-5 rounded-full border-2 transition-all duration-100"
        />
      </div>
    </div>
  );
};
