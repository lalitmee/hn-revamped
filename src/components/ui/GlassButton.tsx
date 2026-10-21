'use client';

import React from 'react';

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'glass' | 'primary' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  iconFilled?: boolean;
  iconAccent?: boolean;
  badge?: string | number;
  shortcut?: string;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'glass',
  size = 'md',
  icon,
  iconFilled = false,
  iconAccent = false,
  badge,
  shortcut,
  className = '',
  children,
  style,
  ...props
}) => {
  const heightClass =
    size === 'sm'
      ? 'h-8 px-3 text-xs'
      : size === 'lg'
      ? 'h-10 px-5 text-sm'
      : 'h-9 px-3.5 text-xs';

  const variantClass =
    variant === 'primary'
      ? 'liquid-glass-primary font-semibold'
      : variant === 'icon'
      ? 'liquid-glass w-9 h-9 p-0 justify-center'
      : variant === 'ghost'
      ? 'hover:bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)] font-semibold'
      : 'liquid-glass font-semibold';

  return (
    <button
      type="button"
      style={{
        color:
          variant === 'primary'
            ? '#ffffff'
            : variant === 'ghost'
            ? 'var(--text-secondary)'
            : 'var(--text-primary)',
        ...style,
      }}
      className={`inline-flex items-center gap-2 rounded-full cursor-pointer select-none shrink-0 transition-all active:scale-[0.98] ${
        variant === 'icon' ? '' : heightClass
      } ${variantClass} ${className}`}
      {...props}
    >
      {icon && (
        <span
          style={{
            color:
              variant === 'primary'
                ? '#ffffff'
                : iconAccent
                ? 'var(--accent)'
                : undefined,
          }}
          className={`material-symbols-rounded text-[17px] ${iconFilled ? 'filled' : ''}`}
        >
          {icon}
        </span>
      )}
      {children && <span className="leading-none">{children}</span>}
      {badge !== undefined && (
        <span
          style={{
            backgroundColor:
              variant === 'primary'
                ? 'rgba(255,255,255,0.22)'
                : 'color-mix(in srgb, var(--accent) 18%, transparent)',
            color: variant === 'primary' ? '#ffffff' : 'var(--accent)',
          }}
          className="px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none"
        >
          {badge}
        </span>
      )}
      {shortcut && (
        <kbd
          style={{
            backgroundColor: 'color-mix(in srgb, var(--bg-canvas) 65%, transparent)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
          className="h-5 px-1.5 rounded-md border inline-flex items-center justify-center gap-1 text-[11px] font-mono font-bold leading-none"
        >
          {shortcut.startsWith('⌘') ? (
            <>
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="shrink-0"
              >
                <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
              </svg>
              <span>{shortcut.slice(1).trim()}</span>
            </>
          ) : (
            shortcut
          )}
        </kbd>
      )}
    </button>
  );
};
