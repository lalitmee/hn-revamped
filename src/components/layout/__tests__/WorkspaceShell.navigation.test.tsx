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
  invalidateStoryCache: vi.fn(),
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
    compact,
  }: {
    compact: boolean;
    onSelectStory: (story: object) => void;
  }) => (
    <div data-testid="feed-density" data-compact={compact}>
      <button
        onClick={() =>
          onSelectStory({
            id: 456,
            title: 'Second',
            cleanTitle: 'Second',
            points: 1,
            user: 'a',
            time: 0,
            commentsCount: 0,
            badges: [],
            type: 'story',
          })
        }
      >
        Open second story
      </button>
      <article
        role="button"
        tabIndex={0}
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
        <span>Open story</span>
        <button onClick={(event) => event.stopPropagation()}>Bookmark</button>
      </article>
    </div>
  ),
}));
vi.mock('@/components/detail/StoryDetailPane', () => ({
  StoryDetailPane: ({
    story,
    compact,
  }: {
    story: { id: number } | null;
    compact: boolean;
  }) => (
    <div data-testid="discussion-density" data-compact={compact}>
      Detail {story?.id}
    </div>
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
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it.each([
    {
      layoutMode: 'split',
      feedDensity: 'compact',
      discussionDensity: 'comfortable',
    },
    {
      layoutMode: 'zen',
      feedDensity: 'compact',
      discussionDensity: 'comfortable',
    },
    {
      layoutMode: 'split',
      feedDensity: 'comfortable',
      discussionDensity: 'compact',
    },
    {
      layoutMode: 'zen',
      feedDensity: 'comfortable',
      discussionDensity: 'compact',
    },
  ])(
    'routes independent densities in $layoutMode ($feedDensity / $discussionDensity)',
    async ({ layoutMode, feedDensity, discussionDensity }) => {
      window.localStorage.setItem(
        'hn_revamped_prefs_v1',
        JSON.stringify({ layoutMode, feedDensity, discussionDensity })
      );
      render(<WorkspaceShell />);
      expect(
        screen.getByTestId('feed-density').getAttribute('data-compact')
      ).toBe(String(feedDensity === 'compact'));
      fireEvent.click(screen.getByText('Open story'));
      await waitFor(() => {
        for (const detail of screen.getAllByTestId('discussion-density')) {
          expect(detail.getAttribute('data-compact')).toBe(
            String(discussionDensity === 'compact')
          );
        }
      });
    }
  );

  it('constrains the shell for an open story in Zen mode, but not for the feed', async () => {
    window.localStorage.setItem(
      'hn_revamped_prefs_v1',
      JSON.stringify({ layoutMode: 'zen' })
    );
    const { container } = render(<WorkspaceShell />);
    const shell = container.firstElementChild as HTMLElement;

    await waitFor(() => expect(shell.className).toContain('lg:h-auto'));
    expect(shell.className).toContain('lg:overflow-visible');

    fireEvent.click(screen.getByText('Open story'));
    await waitFor(() => expect(screen.getByText('Detail 123')).toBeTruthy());

    expect(shell.className).toContain('h-dvh overflow-hidden flex flex-col');
    expect(shell.className).not.toContain('lg:h-auto');
    expect(shell.className).not.toContain('lg:overflow-visible');
  });

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

  it('returns directly to the feed after opening multiple stories', async () => {
    const go = vi.spyOn(window.history, 'go').mockImplementation(() => {});
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByText('Open story'));
    fireEvent.click(screen.getByText('Open second story'));
    expect(window.location.search).toBe('?story=456');
    fireEvent.click(screen.getByText('Back to feed'));
    expect(go).toHaveBeenCalledWith(-2);
    expect(back).not.toHaveBeenCalled();
    navigate('/', { hnNavigationDepth: 0 });
    await waitFor(() => expect(screen.queryByText('Detail 456')).toBeNull());
    go.mockRestore();
    back.mockRestore();
  });

  it('returns a direct-linked story to its feed without leaving the app', () => {
    navigate('/?feed=ask&story=456');
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByText('Back to feed'));
    expect(window.location.search).toBe('?feed=ask');
    expect(screen.queryByText('Detail 456')).toBeNull();
  });

  it('tracks the feed origin when a feed was changed before opening stories', () => {
    const go = vi.spyOn(window.history, 'go').mockImplementation(() => {});
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByText('Ask'));
    fireEvent.click(screen.getByText('Open story'));
    fireEvent.click(screen.getByText('Open second story'));
    expect(window.history.state.hnFeedDepth).toBe(1);
    fireEvent.click(screen.getByText('Back to feed'));
    expect(go).toHaveBeenCalledWith(-2);
    navigate('/?feed=ask', { hnNavigationDepth: 1 });
    expect(screen.getByTestId('feed').textContent).toBe('ask');
  });

  it('swipes feeds across the feed area without intercepting vertical or edge gestures', () => {
    render(<WorkspaceShell />);
    const area = screen.getByText('Open story').closest('.mobile-feed-scroll')!;
    const swipe = (x: number, y: number, endX: number, endY: number) => {
      fireEvent.touchStart(area, { touches: [{ clientX: x, clientY: y }] });
      fireEvent.touchEnd(area, {
        changedTouches: [{ clientX: endX, clientY: endY }],
      });
    };
    swipe(250, 600, 120, 605);
    expect(screen.getByTestId('feed').textContent).toBe('new');
    expect(window.location.search).toBe('?feed=new');
    swipe(250, 600, 245, 740);
    expect(screen.getByTestId('feed').textContent).toBe('new');
    swipe(10, 600, 150, 605);
    expect(screen.getByTestId('feed').textContent).toBe('new');
    swipe(120, 600, 250, 605);
    expect(screen.getByTestId('feed').textContent).toBe('top');
    swipe(120, 600, 250, 605);
    expect(screen.getByTestId('feed').textContent).toBe('saved');
    expect(window.location.search).toBe('?feed=saved');
    swipe(250, 600, 120, 605);
    expect(screen.getByTestId('feed').textContent).toBe('top');
    expect(window.location.search).toBe('');
  });

  it('swipes over cards, suppresses the follow-up click, and remembers hint dismissal', async () => {
    const view = render(<WorkspaceShell />);
    expect(screen.getByText('Swipe to switch feeds')).toBeTruthy();
    const title = screen.getByText('Open story');
    await act(async () => {
      fireEvent.touchStart(title, {
        touches: [{ clientX: 250, clientY: 300 }],
      });
      fireEvent.touchEnd(title, {
        changedTouches: [{ clientX: 120, clientY: 305 }],
      });
      fireEvent.click(title, { detail: 1 });
    });
    expect(window.location.search).toBe('?feed=new');
    expect(screen.queryByText('Swipe to switch feeds')).toBeNull();
    view.unmount();
    render(<WorkspaceShell />);
    expect(screen.queryByText('Swipe to switch feeds')).toBeNull();
    const bookmark = screen.getByText('Bookmark');
    await act(async () => {
      fireEvent.touchStart(bookmark, {
        touches: [{ clientX: 250, clientY: 300 }],
      });
      fireEvent.touchEnd(bookmark, {
        changedTouches: [{ clientX: 120, clientY: 305 }],
      });
    });
    expect(window.location.search).toBe('?feed=new');
    fireEvent.click(screen.getByText('Open story'));
    expect(window.location.search).toBe('?feed=new&story=123');
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
