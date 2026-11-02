import React from 'react';
import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeedTransition } from '../FeedTransition';

const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms));
afterEach(() => vi.useRealTimers());

describe('feed transitions', () => {
  it('slides the previous list out, shows the destination, then brings in ready content', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <FeedTransition feed="top" loading={false}>
        Old stories
      </FeedTransition>
    );
    expect(container.firstChild).toHaveAttribute('data-phase', 'idle');
    rerender(
      <FeedTransition feed="new" loading={false}>
        New stories
      </FeedTransition>
    );
    expect(container.firstChild).toHaveAttribute('data-direction', 'left');
    expect(screen.getByText('Old stories')).toBeInTheDocument();
    expect(screen.queryByText('New stories')).not.toBeInTheDocument();
    tick(140);
    expect(screen.getByRole('status')).toHaveTextContent('New');
    tick(159);
    expect(screen.getByRole('status')).toBeInTheDocument();
    tick(1);
    expect(container.firstChild).toHaveAttribute('data-phase', 'enter');
    expect(screen.getByText('New stories')).toBeInTheDocument();
    tick(200);
    expect(container.firstChild).toHaveAttribute('data-phase', 'idle');
  });

  it('waits for data and replaces rapid destinations instead of queuing them', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <FeedTransition feed="top" loading={false}>
        Top stories
      </FeedTransition>
    );
    rerender(
      <FeedTransition feed="new" loading>
        Loading
      </FeedTransition>
    );
    tick(140);
    tick(160);
    expect(screen.getByRole('status')).toHaveTextContent('Loading stories');
    rerender(
      <FeedTransition feed="best" loading>
        Loading
      </FeedTransition>
    );
    tick(140);
    expect(screen.getByRole('status')).toHaveTextContent('Best');
    tick(160);
    expect(container.firstChild).toHaveAttribute('data-phase', 'middle');
    rerender(
      <FeedTransition feed="best" loading={false}>
        Best stories
      </FeedTransition>
    );
    expect(screen.getByText('Best stories')).toBeInTheDocument();
    expect(screen.queryByText('New')).not.toBeInTheDocument();
  });

  it('reverses at wraparound and does not transition on pagination or initial load', () => {
    vi.useFakeTimers();
    const { container, rerender, unmount } = render(
      <FeedTransition feed="top" loading>
        Loading
      </FeedTransition>
    );
    rerender(
      <FeedTransition feed="top" loading={false}>
        Top stories
      </FeedTransition>
    );
    expect(container.firstChild).toHaveAttribute('data-phase', 'idle');
    rerender(
      <FeedTransition feed="top" loading>
        More stories
      </FeedTransition>
    );
    expect(container.firstChild).toHaveAttribute('data-phase', 'idle');
    rerender(
      <FeedTransition feed="saved" loading={false}>
        Saved stories
      </FeedTransition>
    );
    expect(container.firstChild).toHaveAttribute('data-direction', 'right');
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
