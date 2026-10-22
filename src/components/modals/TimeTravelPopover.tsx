'use client';

import React from 'react';
import {
  GlassDropdown,
  GlassDropdownOption,
} from '@/components/ui/GlassDropdown';

export type TimeTravelPreset =
  'live' | 'yesterday' | 'last-week' | 'last-month' | 'one-year-ago';

interface TimeTravelPopoverProps {
  activePreset: TimeTravelPreset;
  onSelectPreset: (preset: TimeTravelPreset) => void;
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
}) => {
  return (
    <GlassDropdown<TimeTravelPreset>
      value={activePreset}
      options={PRESET_OPTIONS}
      onChange={onSelectPreset}
      leadingIcon="history"
      ariaLabel="Time travel front page"
    />
  );
};
