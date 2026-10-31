'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  ariaLabel: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  children: React.ReactNode;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  ariaLabel,
  triggerRef,
  children,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [present, setPresent] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setPresent(true);
      return;
    }
    if (!present) return;
    const delay = window.matchMedia?.('(prefers-reduced-motion: reduce)')
      .matches
      ? 0
      : 240;
    const timer = window.setTimeout(() => setPresent(false), delay);
    return () => window.clearTimeout(timer);
  }, [isOpen, present]);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const sheet = sheetRef.current;
    (
      sheet?.querySelector<HTMLElement>('[aria-current="true"]') ??
      sheet?.querySelector<HTMLButtonElement>('button')
    )?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key !== 'Tab' || !sheetRef.current) return;
      const buttons = [
        ...sheetRef.current.querySelectorAll<HTMLButtonElement>('button'),
      ];
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const media = window.matchMedia?.('(min-width: 1024px)');
    const onResize = () => {
      if (media?.matches) closeRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    media?.addEventListener('change', onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      media?.removeEventListener('change', onResize);
      triggerRef.current?.focus();
    };
  }, [isOpen, triggerRef]);

  if (!present) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-end bg-black/50 ${isOpen ? 'mobile-sheet-backdrop-enter' : 'mobile-sheet-backdrop-exit pointer-events-none'}`}
      aria-hidden={isOpen ? undefined : true}
      onMouseDown={(event) => {
        if (isOpen && event.target === event.currentTarget) onClose();
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        ref={sheetRef}
        role={isOpen ? 'dialog' : undefined}
        aria-modal={isOpen ? true : undefined}
        aria-label={isOpen ? ariaLabel : undefined}
        className={`liquid-glass-modal w-full rounded-t-3xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] max-h-[85dvh] overflow-y-auto ${isOpen ? 'mobile-sheet-enter' : 'mobile-sheet-exit'}`}
        style={{ color: 'var(--text-primary)' }}
      >
        <div
          className="flex items-center justify-between mb-3 px-2 pb-3 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <h2 className="font-bold text-base">{title}</h2>
          <button
            type="button"
            aria-label={`Close ${title.toLowerCase()}`}
            onClick={onClose}
            className="liquid-glass rounded-full w-10 h-10 inline-flex items-center justify-center"
          >
            <span aria-hidden="true" className="material-symbols-rounded">
              close
            </span>
          </button>
        </div>
        <div className="grid grid-cols-1 gap-1">{children}</div>
      </div>
    </div>,
    document.body
  );
};
