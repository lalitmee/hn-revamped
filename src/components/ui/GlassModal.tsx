'use client';

import React, { useEffect } from 'react';

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  icon?: string;
  maxWidthClass?: string;
  topAligned?: boolean;
  children: React.ReactNode;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  maxWidthClass = 'max-w-2xl',
  topAligned = false,
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-50 flex justify-center ${
        topAligned ? 'items-start pt-16 sm:pt-20' : 'items-center'
      } bg-black/45 backdrop-blur-md p-4 transition-opacity`}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{ color: 'var(--text-primary)' }}
        className={`liquid-glass-modal w-full ${maxWidthClass} max-h-[88vh] flex flex-col rounded-3xl overflow-hidden`}
      >
        {title && (
          <div
            style={{ borderColor: 'color-mix(in srgb, var(--text-primary) 10%, transparent)' }}
            className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          >
            <div className="flex items-center gap-2.5">
              {icon && (
                <span
                  style={{ color: 'var(--accent)' }}
                  className="material-symbols-rounded text-[22px]"
                >
                  {icon}
                </span>
              )}
              <h2 className="text-base sm:text-lg font-bold tracking-tight">{title}</h2>
            </div>
            <button
              type="button"
              aria-label="Close modal"
              onClick={onClose}
              className="liquid-glass w-8 h-8 rounded-xl inline-flex items-center justify-center cursor-pointer hover:brightness-110"
            >
              <span className="material-symbols-rounded text-[18px]">close</span>
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};
