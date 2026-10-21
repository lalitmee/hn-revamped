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
        <span
          style={{ color: 'var(--text-secondary)' }}
          className="text-xs font-bold uppercase tracking-wider"
        >
          {label}
        </span>
        <span
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent) 16%, transparent)',
            color: 'var(--accent)',
          }}
          className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono"
        >
          {valueLabel}
        </span>
      </div>

      <div className="relative h-6 flex items-center">
        {/* Clean Material 3 Slider Track */}
        <div
          style={{
            backgroundColor: 'color-mix(in srgb, var(--text-primary) 12%, transparent)',
          }}
          className="w-full h-2 rounded-full overflow-hidden"
        >
          <div
            style={{
              width: `${percentage}%`,
              backgroundColor: 'var(--accent)',
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

        {/* Material 3 Solid Pill/Circle Thumb */}
        <div
          style={{
            left: `calc(${percentage}% - 10px)`,
            backgroundColor: 'var(--accent)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          }}
          className="pointer-events-none absolute w-5 h-5 rounded-full transition-all duration-100"
        />
      </div>
    </div>
  );
};
