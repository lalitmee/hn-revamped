import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppearanceModal } from '../AppearanceModal';
import { DEFAULT_PREFERENCES, THEMES } from '@/lib/themes';

describe('mobile appearance controls', () => {
  it('exposes labeled tabs and selects the requested settings panel', () => {
    render(
      <AppearanceModal
        isOpen
        preferences={{ ...DEFAULT_PREFERENCES }}
        onUpdate={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const tablist = screen.getByRole('tablist', {
      name: 'Appearance sections',
    });
    const themeTab = within(tablist).getByRole('tab', { name: 'Theme' });
    const filtersTab = within(tablist).getByRole('tab', { name: 'Filters' });
    expect(themeTab).toHaveAttribute('aria-selected', 'true');
    expect(themeTab).toHaveAttribute('tabindex', '0');
    expect(filtersTab).toHaveAttribute('tabindex', '-1');

    fireEvent.click(filtersTab);

    expect(filtersTab).toHaveAttribute('aria-selected', 'true');
    expect(filtersTab).toHaveAttribute('aria-controls', 'appearance-panel');
    expect(
      screen.getByRole('tabpanel', { name: 'Filters' })
    ).toBeInTheDocument();
    expect(screen.getByText('Muted keywords')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reset filters settings' })
    ).toBeInTheDocument();
  });

  it('supports arrow and boundary-key navigation between tabs', () => {
    render(
      <AppearanceModal
        isOpen
        preferences={{ ...DEFAULT_PREFERENCES }}
        onUpdate={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const themeTab = screen.getByRole('tab', { name: 'Theme' });
    const textTab = screen.getByRole('tab', { name: 'Text' });
    const filtersTab = screen.getByRole('tab', { name: 'Filters' });

    themeTab.focus();
    fireEvent.keyDown(themeTab, { key: 'ArrowRight' });
    expect(textTab).toHaveFocus();
    expect(textTab).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(textTab, { key: 'End' });
    expect(filtersTab).toHaveFocus();
    expect(filtersTab).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(filtersTab, { key: 'ArrowRight' });
    expect(themeTab).toHaveFocus();
    expect(themeTab).toHaveAttribute('aria-selected', 'true');
  });

  it('switches tabs with horizontal swipes and leaves vertical gestures alone', () => {
    render(
      <AppearanceModal
        isOpen
        preferences={{ ...DEFAULT_PREFERENCES }}
        onUpdate={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const panel = screen.getByRole('tabpanel');
    const themeTab = screen.getByRole('tab', { name: 'Theme' });
    const textTab = screen.getByRole('tab', { name: 'Text' });

    fireEvent.touchStart(panel, {
      touches: [{ clientX: 280, clientY: 220 }],
    });
    fireEvent.touchEnd(panel, {
      changedTouches: [{ clientX: 210, clientY: 225 }],
    });
    expect(textTab).toHaveAttribute('aria-selected', 'true');

    const updatedPanel = screen.getByRole('tabpanel');
    fireEvent.touchStart(updatedPanel, {
      touches: [{ clientX: 280, clientY: 220 }],
    });
    fireEvent.touchEnd(updatedPanel, {
      changedTouches: [{ clientX: 275, clientY: 300 }],
    });
    expect(textTab).toHaveAttribute('aria-selected', 'true');

    fireEvent.touchStart(updatedPanel, {
      touches: [{ clientX: 210, clientY: 220 }],
    });
    fireEvent.touchEnd(updatedPanel, {
      changedTouches: [{ clientX: 285, clientY: 220 }],
    });
    expect(themeTab).toHaveAttribute('aria-selected', 'true');
  });

  it('clears muted keyword and domain lists with labeled actions', () => {
    const onUpdate = vi.fn();
    render(
      <AppearanceModal
        isOpen
        preferences={{
          ...DEFAULT_PREFERENCES,
          mutedKeywords: ['crypto'],
          mutedDomains: ['example.com'],
        }}
        onUpdate={onUpdate}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole('tab', { name: 'Filters, 2 active filters' })
    );
    const clearKeywords = screen.getByRole('button', {
      name: 'Clear all muted keywords',
    });
    const clearDomains = screen.getByRole('button', {
      name: 'Clear all muted domains',
    });

    expect(
      clearKeywords.querySelector('.material-symbols-rounded')
    ).toHaveTextContent('delete_sweep');
    expect(
      clearDomains.querySelector('.material-symbols-rounded')
    ).toHaveTextContent('delete_sweep');

    fireEvent.click(clearKeywords);
    fireEvent.click(clearDomains);
    expect(onUpdate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ mutedKeywords: [] })
    );
    expect(onUpdate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ mutedDomains: [] })
    );
  });

  it('selects an accent preset from its sheet', () => {
    const onUpdate = vi.fn();
    render(
      <AppearanceModal
        isOpen
        preferences={{ ...DEFAULT_PREFERENCES }}
        onUpdate={onUpdate}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Choose accent color. Current: HN Orange',
      })
    );
    const sheet = screen.getByRole('dialog', {
      name: 'Choose an accent color',
    });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Google Blue' }));

    expect(
      within(sheet).queryByRole('button', {
        name: 'Choose custom accent color',
      })
    ).not.toBeInTheDocument();
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ customAccent: '#3B82F6' })
    );
    expect(
      screen.queryByRole('dialog', { name: 'Choose an accent color' })
    ).not.toBeInTheDocument();
  });

  it('marks only the active theme as selected across light and dark sheets', () => {
    render(
      <AppearanceModal
        isOpen
        preferences={{
          ...DEFAULT_PREFERENCES,
          themeId: 'kindle-sepia',
          themeMode: 'light',
          lightThemeId: 'kindle-sepia',
        }}
        onUpdate={vi.fn()}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Choose light theme. Current: Kindle Sepia',
      })
    );
    const lightSheet = screen.getByRole('dialog', {
      name: 'Choose a light theme',
    });
    expect(
      within(lightSheet)
        .getAllByRole('button')
        .filter((button) => button.getAttribute('aria-pressed') === 'true')
        .map((button) => button.getAttribute('title'))
    ).toEqual(['Amazon Kindle Warm']);

    fireEvent.click(
      within(lightSheet).getByRole('button', { name: 'Close light themes' })
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Choose dark theme. Current: Obsidian Slate',
      })
    );
    const darkSheet = screen.getByRole('dialog', {
      name: 'Choose a dark theme',
    });
    expect(
      within(darkSheet)
        .getAllByRole('button')
        .filter((button) => button.getAttribute('aria-pressed') === 'true')
    ).toHaveLength(0);
  });

  it('selects a light theme from its dedicated sheet', () => {
    const onUpdate = vi.fn();
    render(
      <AppearanceModal
        isOpen
        preferences={{ ...DEFAULT_PREFERENCES }}
        onUpdate={onUpdate}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Choose light theme. Current: Warm Paper',
      })
    );
    const sheet = screen.getByRole('dialog', { name: 'Choose a light theme' });
    const kindleTheme = within(sheet).getByRole('button', {
      name: 'Kindle Sepia',
    });
    expect(kindleTheme).toHaveStyle({
      backgroundColor: THEMES['kindle-sepia'].colors.bgCanvas,
      color: THEMES['kindle-sepia'].colors.textPrimary,
    });
    fireEvent.click(kindleTheme);

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        themeId: 'kindle-sepia',
        lightThemeId: 'kindle-sepia',
        themeMode: 'light',
      })
    );
    expect(
      screen.queryByRole('dialog', { name: 'Choose a light theme' })
    ).not.toBeInTheDocument();
  });

  it('selects reading width from its sheet and labels density icons', () => {
    const onUpdate = vi.fn();
    render(
      <AppearanceModal
        isOpen
        preferences={{ ...DEFAULT_PREFERENCES }}
        onUpdate={onUpdate}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Text' }));
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Choose reading width. Current: Optimal',
      })
    );
    const widthSheet = screen.getByRole('dialog', {
      name: 'Choose a reading width',
    });
    fireEvent.click(
      within(widthSheet).getByRole('button', { name: /^Narrow/ })
    );

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ lineWidth: '55ch' })
    );
    expect(
      screen.getByRole('button', { name: 'Comfortable card density' })
    ).toBeInTheDocument();
  });

  it('selects a font from the font sheet', () => {
    const onUpdate = vi.fn();
    render(
      <AppearanceModal
        isOpen
        preferences={{ ...DEFAULT_PREFERENCES }}
        onUpdate={onUpdate}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Text' }));
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Choose font. Current: Editorial Sans',
      })
    );
    const fontSheet = screen.getByRole('dialog', {
      name: 'Choose a font family',
    });
    fireEvent.click(
      within(fontSheet).getByRole('button', { name: 'Kindle Bookerly' })
    );

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ fontFamily: 'bookerly' })
    );
    expect(
      screen.queryByRole('dialog', { name: 'Choose a font family' })
    ).not.toBeInTheDocument();
  });
});
