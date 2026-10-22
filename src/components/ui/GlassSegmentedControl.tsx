'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

export interface SegmentedItem<T extends string> {
  id: T;
  label?: string;
  icon?: string;
  badge?: number | string;
  title?: string;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  const updateIndicator = useCallback(() => {
    const activeBtn = buttonRefs.current[value];
    if (activeBtn) {
      setIndicator({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
      });
    }
  }, [value]);

  useEffect(() => {
    updateIndicator();
  }, [updateIndicator, items]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      updateIndicator();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [updateIndicator]);

  const hasMeasured = indicator.width > 0;

  return (
    <div
      ref={containerRef}
      className={`liquid-glass relative p-1 rounded-full inline-flex items-center gap-0.5 ${
        fullWidth ? 'w-full flex' : ''
      }`}
    >
      {/* Borderless Material 3 Gliding Active Pill */}
      {hasMeasured && (
        <div
          aria-hidden="true"
          style={{
            width: `${indicator.width}px`,
            transform: `translate3d(${indicator.left}px, 0, 0)`,
            transition:
              'transform 280ms cubic-bezier(0.2, 0, 0, 1), width 280ms cubic-bezier(0.2, 0, 0, 1)',
          }}
          className="liquid-glass-primary pointer-events-none absolute top-1 bottom-1 left-0 rounded-full z-0"
        />
      )}

      {items.map((item) => {
        const isActive = item.id === value;
        const isIconOnly = Boolean(item.icon && !item.label);
        return (
          <button
            key={item.id}
            ref={(el) => {
              buttonRefs.current[item.id] = el;
            }}
            type="button"
            title={item.title ?? item.label}
            aria-label={item.label ?? item.title ?? item.id}
            onClick={() => onChange(item.id)}
            style={{
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
            }}
            className={`relative z-10 ${
              fullWidth ? 'flex-1 justify-center' : ''
            } ${
              isIconOnly
                ? 'w-7 h-7 justify-center'
                : size === 'sm'
                  ? 'px-3 py-1.5 text-xs'
                  : 'px-4 py-1.5 text-xs'
            } ${
              isActive
                ? `${!hasMeasured ? 'liquid-glass-primary ' : ''}font-bold`
                : 'hover:bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)] font-semibold'
            } inline-flex items-center gap-1.5 rounded-full cursor-pointer transition-colors duration-200 select-none`}
          >
            {item.icon && (
              <span
                className={`material-symbols-rounded text-[16px] transition-transform duration-200 ${
                  isActive ? 'filled scale-105' : ''
                }`}
              >
                {item.icon}
              </span>
            )}
            {item.label && <span>{item.label}</span>}
            {item.badge !== undefined && (
              <span
                style={{
                  backgroundColor: isActive
                    ? 'rgba(255,255,255,0.22)'
                    : 'color-mix(in srgb, var(--text-primary) 10%, transparent)',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                }}
                className="px-1.5 py-0.2 rounded-full text-[10px] font-bold transition-colors duration-200"
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
