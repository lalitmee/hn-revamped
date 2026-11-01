'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GlassModal } from '@/components/ui/GlassModal';
import { MobileBottomSheet } from '@/components/ui/MobileBottomSheet';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  voices: { id: string; label: string; icon: string }[];
  selectedVoice: string;
  onSelectVoice: (voice: string) => void;
  preload: boolean;
  onPreloadChange: (preload: boolean) => void;
}

export function ReaderVoicePreferences({
  isOpen,
  onClose,
  triggerRef,
  voices,
  selectedVoice,
  onSelectVoice,
  preload,
  onPreloadChange,
}: Props) {
  const [mobile, setMobile] = useState(false);
  const desktopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia?.('(max-width: 639px)');
    const update = () => setMobile(media?.matches ?? window.innerWidth < 640);
    update();
    media?.addEventListener?.('change', update);
    return () => media?.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (!isOpen || mobile) return;
    desktopRef.current
      ?.querySelector('[role="dialog"]')
      ?.setAttribute('aria-label', 'Voice preferences');
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    desktopRef.current
      ?.querySelector<HTMLElement>('[aria-current="true"]')
      ?.focus();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const buttons =
        desktopRef.current?.querySelectorAll<HTMLButtonElement>('button');
      if (!buttons?.length) return;
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
    document.addEventListener('keydown', trapFocus);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', trapFocus);
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [isOpen, mobile, triggerRef]);

  const content = (
    <>
      <div
        className="px-2 pb-3 mb-2 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <button
          type="button"
          role="switch"
          aria-label="Preload my preferred voice in Reader View"
          aria-checked={preload}
          onClick={() => onPreloadChange(!preload)}
          className="w-full flex items-center justify-between gap-4 py-3 text-left"
        >
          <span>
            <span className="block text-sm font-semibold">
              Preload preferred voice
            </span>
            <span
              className="block mt-1 text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              Prepare the local model when Reader View opens.
            </span>
          </span>
          <span
            aria-hidden="true"
            className="relative w-10 h-6 shrink-0 rounded-full transition-colors"
            style={{
              backgroundColor: preload
                ? 'var(--accent)'
                : 'var(--bg-surface-active)',
            }}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform motion-reduce:transition-none ${preload ? 'translate-x-4' : ''}`}
              style={{
                backgroundColor: preload ? '#fff' : 'var(--text-secondary)',
              }}
            />
          </span>
        </button>
        <p
          className="text-xs leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          Off by default. Preloading uses data and memory without starting
          playback. Supertonic may download approximately 398 MB.
        </p>
      </div>
      <p
        className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        Preferred voice · saved in this browser
      </p>
      {voices.map((voice) => (
        <button
          key={voice.id}
          type="button"
          aria-label={voice.label}
          aria-current={selectedVoice === voice.id ? 'true' : undefined}
          onClick={() => onSelectVoice(voice.id)}
          className="w-full min-h-12 px-4 rounded-xl flex items-center gap-3 text-left font-medium text-sm transition-colors hover:bg-[var(--bg-surface-2)]"
          style={{
            backgroundColor:
              selectedVoice === voice.id
                ? 'var(--bg-surface-active)'
                : undefined,
            color:
              selectedVoice === voice.id
                ? 'var(--accent)'
                : 'var(--text-primary)',
          }}
        >
          <span
            aria-hidden="true"
            className="material-symbols-rounded text-[20px]"
          >
            {voice.icon}
          </span>
          <span className="min-w-0 truncate">{voice.label}</span>
          {selectedVoice === voice.id && (
            <span
              aria-hidden="true"
              className="material-symbols-rounded ml-auto text-[20px]"
            >
              check
            </span>
          )}
        </button>
      ))}
    </>
  );

  if (mobile)
    return (
      <MobileBottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Voice preferences"
        ariaLabel="Voice preferences"
        triggerRef={triggerRef}
      >
        {content}
      </MobileBottomSheet>
    );
  if (!isOpen) return null;
  return createPortal(
    <div ref={desktopRef}>
      <GlassModal
        isOpen={isOpen}
        onClose={onClose}
        title="Voice preferences"
        icon="record_voice_over"
        maxWidthClass="max-w-md"
      >
        <div className="p-4 grid grid-cols-1 gap-1">{content}</div>
      </GlassModal>
    </div>,
    document.body
  );
}
