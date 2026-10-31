import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { WorkspaceShell } from '../WorkspaceShell';

vi.mock('@/lib/hn-api', () => ({
  fetchFeedStories: vi.fn(async () => []),
  fetchTimeTravelStories: vi.fn(async () => []),
  fetchStoryWithComments: vi.fn(async (id: number) => ({
    id,
    title: `Story #${id}`,
    cleanTitle: `Story #${id}`,
    points: 0,
    user: '',
    time: 0,
    commentsCount: 0,
    badges: [],
    type: 'story',
    comments: [],
  })),
  getCachedStoryWithComments: vi.fn(() => null),
}));
vi.mock('../AppHeader', () => ({
  AppHeader: ({
    activeFeed,
    onSelectFeed,
    onBackToFeed,
    onOpenSearch,
    onOpenAppearance,
  }: {
    activeFeed: string;
    onSelectFeed: (feed: 'ask') => void;
    onBackToFeed: () => void;
    onOpenSearch: () => void;
    onOpenAppearance: () => void;
  }) => (
    <header>
      <span data-testid="feed">{activeFeed}</span>
      <button onClick={() => onSelectFeed('ask')}>Ask</button>
      <button onClick={onBackToFeed}>Back to feed</button>
      <button onClick={onOpenSearch}>Search</button>
      <button onClick={onOpenAppearance}>Appearance</button>
    </header>
  ),
}));
vi.mock('@/components/feed/StoryFeedPane', () => ({
  StoryFeedPane: ({
    onSelectStory,
  }: {
    onSelectStory: (story: object) => void;
  }) => (
    <button
      onClick={() =>
        onSelectStory({
          id: 123,
          title: 'Test',
          cleanTitle: 'Test',
          points: 1,
          user: 'a',
          time: 0,
          commentsCount: 0,
          badges: [],
          type: 'story',
        })
      }
    >
      Open story
    </button>
  ),
}));
vi.mock('@/components/detail/StoryDetailPane', () => ({
  StoryDetailPane: ({ story }: { story: { id: number } | null }) => (
    <div>Detail {story?.id}</div>
  ),
}));
vi.mock('@/components/modals/CommandPaletteModal', () => ({
  CommandPaletteModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div>Search open</div> : null,
}));
vi.mock('@/components/modals/AppearanceModal', () => ({
  AppearanceModal: () => <div>Appearance open</div>,
}));
vi.mock('@/components/modals/ShortcutsModal', () => ({
  ShortcutsModal: () => null,
}));
vi.mock('@/components/ui/ViewTransitionWrapper', () => ({
  SafeViewTransition: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

function navigate(url: string, state: object = {}) {
  window.history.replaceState(state, '', url);
  act(() => window.dispatchEvent(new PopStateEvent('popstate', { state })));
}

describe('workspace navigation history', () => {
  beforeEach(() => {
    window.localStorage.clear();
    navigate('/');
  });
  afterEach(() => vi.clearAllMocks());

  it('restores feed and story from URL when traversing history', async () => {
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByText('Ask'));
    expect(window.location.search).toBe('?feed=ask');
    fireEvent.click(screen.getByText('Open story'));
    expect(window.location.search).toBe('?feed=ask&story=123');
    navigate('/?feed=ask', { hnNavigationDepth: 1 });
    await waitFor(() => expect(screen.queryByText('Detail 123')).toBeNull());
    expect(screen.getByTestId('feed').textContent).toBe('ask');
    navigate('/', { hnNavigationDepth: 0 });
    await waitFor(() =>
      expect(screen.getByTestId('feed').textContent).toBe('top')
    );
  });

  it('opens appearance as a URL-backed view and restores it on navigation', async () => {
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByText('Appearance'));
    expect(window.location.search).toBe('?view=appearance');
    expect(screen.getByText('Appearance open')).toBeTruthy();
    navigate('/', { hnNavigationDepth: 0 });
    await waitFor(() =>
      expect(screen.queryByText('Appearance open')).toBeNull()
    );
    navigate('/?view=appearance', { hnNavigationDepth: 1 });
    await waitFor(() =>
      expect(screen.getByText('Appearance open')).toBeTruthy()
    );
  });

  it('restores a direct story link and closes a transient overlay on Back', async () => {
    navigate('/?story=456');
    render(<WorkspaceShell />);
    await waitFor(() =>
      expect(screen.getAllByText('Detail 456').length).toBeGreaterThan(0)
    );
    fireEvent.click(screen.getByText('Search'));
    expect(screen.getByText('Search open')).toBeTruthy();
    navigate('/?story=456', { hnNavigationDepth: 0 });
    await waitFor(() => expect(screen.queryByText('Search open')).toBeNull());
  });
});
