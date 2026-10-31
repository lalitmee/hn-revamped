import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CommandPaletteModal } from '../CommandPaletteModal';

describe('mobile search controls', () => {
  it('keeps results in a flex scroll region and selects sort from a sheet', () => {
    const onClose = vi.fn();
    const { container } = render(
      <CommandPaletteModal isOpen onClose={onClose} onSelectStory={vi.fn()} />
    );
    const results = container.querySelector('.custom-scrollbar');
    expect(results).toHaveClass('flex-1', 'min-h-0');
    fireEvent.click(
      screen.getByRole('button', { name: 'Sort results: Top Relevance' })
    );
    const sheet = screen.getByRole('dialog', { name: 'Sort search results' });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Newest' }));
    expect(
      screen.getByRole('button', { name: 'Sort results: Newest' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('dialog', { name: 'Sort search results' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back from search' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
