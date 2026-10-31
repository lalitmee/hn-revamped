import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppHeader } from '../AppHeader';

const props = {
  activeFeed: 'top' as const,
  onSelectFeed: vi.fn(),
  layoutMode: 'split' as const,
  onToggleLayoutMode: vi.fn(),
  timeTravelPreset: 'live' as const,
  onSelectTimeTravel: vi.fn(),
  onOpenSearch: vi.fn(),
  onOpenAppearance: vi.fn(),
  onOpenShortcuts: vi.fn(),
  savedCount: 3,
  isStoryOpen: false,
  onBackToFeed: vi.fn(),
};

describe('mobile feed picker', () => {
  it('selects a feed and closes the sheet', () => {
    const onSelectFeed = vi.fn();
    const { container } = render(
      <AppHeader {...props} onSelectFeed={onSelectFeed} />
    );
    fireEvent.click(container.querySelector('button[aria-haspopup="dialog"]')!);
    const sheet = screen.getByRole('dialog', { name: 'Choose a story feed' });
    expect(sheet).toBeInTheDocument();
    expect(
      within(sheet).getByRole('button', { name: /Saved 3/ })
    ).toBeInTheDocument();
    fireEvent.click(within(sheet).getByRole('button', { name: 'Show' }));
    expect(onSelectFeed).toHaveBeenCalledWith('show');
    expect(
      screen.queryByRole('dialog', { name: 'Choose a story feed' })
    ).not.toBeInTheDocument();
  });

  it('opens time travel as a mobile sheet and selects a period', () => {
    const onSelectTimeTravel = vi.fn();
    render(<AppHeader {...props} onSelectTimeTravel={onSelectTimeTravel} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Time travel: Live Front Page' })
    );
    const sheet = screen.getByRole('dialog', { name: 'Choose a time period' });
    fireEvent.click(
      within(sheet).getByRole('button', { name: 'Past 7 Days Top' })
    );
    expect(onSelectTimeTravel).toHaveBeenCalledWith('last-week');
    expect(
      screen.queryByRole('dialog', { name: 'Choose a time period' })
    ).not.toBeInTheDocument();
  });

  it('keeps appearance directly accessible without a More menu on mobile', () => {
    const onOpenAppearance = vi.fn();
    render(<AppHeader {...props} onOpenAppearance={onOpenAppearance} />);
    fireEvent.click(screen.getByRole('button', { name: 'Appearance' }));
    expect(onOpenAppearance).toHaveBeenCalledOnce();
    expect(
      screen.queryByRole('button', { name: 'More options' })
    ).not.toBeInTheDocument();
  });

  it('dismisses with Escape and hides the picker on a story', () => {
    const { container, rerender } = render(<AppHeader {...props} />);
    const trigger = container.querySelector<HTMLButtonElement>(
      'button[aria-haspopup="dialog"]'
    )!;
    fireEvent.click(trigger);
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.body.style.overflow).toBe('');
    expect(trigger).toHaveFocus();
    expect(
      screen.queryByRole('dialog', { name: 'Choose a story feed' })
    ).not.toBeInTheDocument();
    rerender(<AppHeader {...props} isStoryOpen />);
    expect(
      container.querySelector(
        'button[aria-haspopup="dialog"]:not([aria-label])'
      )
    ).not.toBeInTheDocument();
    const back = screen.getByRole('button', { name: 'Back to feed' });
    expect(back).toBeInTheDocument();
    expect(back.nextElementSibling).toHaveAttribute(
      'aria-label',
      'HN Revamped'
    );
  });
});
