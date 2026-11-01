'use client';

import React, { useRef, useState } from 'react';
import {
  GlassDropdown,
  GlassDropdownOption,
} from '@/components/ui/GlassDropdown';
import { MobileBottomSheet } from '@/components/ui/MobileBottomSheet';

export type TimeTravelPreset =
  'live' | 'yesterday' | 'last-week' | 'last-month' | 'one-year-ago';

interface TimeTravelPopoverProps {
  activePreset: TimeTravelPreset;
  onSelectPreset: (preset: TimeTravelPreset) => void;
  mobileSheet?: boolean;
}

const PRESET_OPTIONS: GlassDropdownOption<TimeTravelPreset>[] = [
  { id: 'live', label: 'Live Front Page', icon: 'sensors' },
  { id: 'yesterday', label: 'Yesterday Top', icon: 'today' },
  { id: 'last-week', label: 'Past 7 Days Top', icon: 'date_range' },
  { id: 'last-month', label: 'Past 30 Days Top', icon: 'calendar_month' },
  { id: 'one-year-ago', label: '1 Year Ago Today', icon: 'history_edu' },
];

export const TimeTravelPopover: React.FC<TimeTravelPopoverProps> = ({
  activePreset,
  onSelectPreset,
  mobileSheet = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  if (!mobileSheet)
    return (
      <GlassDropdown<TimeTravelPreset>
        value={activePreset}
        options={PRESET_OPTIONS}
        onChange={onSelectPreset}
        leadingIcon="history"
        ariaLabel="Time travel front page"
      />
    );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Time travel: ${PRESET_OPTIONS.find((preset) => preset.id === activePreset)?.label}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className="liquid-glass w-10 h-10 rounded-full inline-flex items-center justify-center"
      >
        <span aria-hidden="true" className="material-symbols-rounded">
          history
        </span>
      </button>
      <MobileBottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Time travel"
        ariaLabel="Choose a time period"
        triggerRef={triggerRef}
      >
        {PRESET_OPTIONS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-current={preset.id === activePreset ? 'true' : undefined}
            onClick={() => {
              onSelectPreset(preset.id);
              setIsOpen(false);
            }}
            className="w-full min-h-12 px-4 rounded-xl flex items-center gap-3 text-left font-medium"
            style={{
              backgroundColor:
                preset.id === activePreset
                  ? 'var(--bg-surface-active)'
                  : undefined,
              color:
                preset.id === activePreset
                  ? 'var(--accent)'
                  : 'var(--text-primary)',
            }}
          >
            <span aria-hidden="true" className="material-symbols-rounded">
              {preset.icon}
            </span>
            <span>{preset.label}</span>
            {preset.id === activePreset && (
              <span
                aria-hidden="true"
                className="material-symbols-rounded ml-auto"
              >
                check
              </span>
            )}
          </button>
        ))}
      </MobileBottomSheet>
    </>
  );
};
