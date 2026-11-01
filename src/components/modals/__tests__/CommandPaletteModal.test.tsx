import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CommandPaletteModal } from '../CommandPaletteModal';
import { searchHN } from '@/lib/hn-api';

vi.mock('@/lib/hn-api', () => ({ searchHN: vi.fn(async () => []) }));

describe('mobile search controls', () => {
  it('orders result metadata as points, website, author, then time', async () => {
    vi.mocked(searchHN).mockResolvedValueOnce([
      {
        id: 123,
        title: 'Test story',
        cleanTitle: 'Test story',
        domain: 'example.com',
        user: 'author',
        points: 42,
        time: Math.floor(Date.now() / 1000) - 3600,
        commentsCount: 7,
        badges: [],
        type: 'story',
      },
    ]);
    render(
      <CommandPaletteModal isOpen onClose={vi.fn()} onSelectStory={vi.fn()} />
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Search Hacker News' }),
      { target: { value: 'test' } }
    );
    const title = await screen.findByText('Test story');
    const card = title.closest('button')!;
    const text = card.textContent!;
    expect(text.indexOf('42')).toBeLessThan(text.indexOf('example.com'));
    expect(text.indexOf('example.com')).toBeLessThan(text.indexOf('author'));
    expect(text.indexOf('author')).toBeLessThan(text.indexOf('schedule'));
    expect(card.querySelector('time')).toHaveAttribute('datetime');
  });
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
