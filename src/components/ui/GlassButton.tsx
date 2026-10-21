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
    size === 'sm' ? 'h-8 px-2.5 text-xs' : size === 'lg' ? 'h-10 px-4 text-sm' : 'h-9 px-3.5 text-xs';

  const variantClass =
    variant === 'primary'
      ? 'liquid-glass-primary font-semibold'
      : variant === 'icon'
      ? 'liquid-glass w-9 h-9 p-0 justify-center'
      : variant === 'ghost'
      ? 'border border-transparent hover:bg-white/5 font-semibold'
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
      className={`inline-flex items-center gap-2 rounded-xl cursor-pointer select-none shrink-0 transition-all active:scale-[0.98] ${
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
            backgroundColor: 'color-mix(in srgb, var(--bg-canvas) 55%, transparent)',
            color: 'var(--text-muted)',
            borderColor: 'var(--border-subtle)',
          }}
          className="px-1.5 py-0.5 rounded-md border text-[10px] font-mono leading-none"
        >
          {shortcut}
        </kbd>
      )}
    </button>
  );
};
