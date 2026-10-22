'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  startTransition,
} from 'react';
import {
  DetailTab,
  FeedType,
  HNStory,
  HNStoryWithComments,
  ReadHistoryEntry,
  UserPreferences,
} from '@/types/hn';
import { SafeViewTransition } from '@/components/ui/ViewTransitionWrapper';
import {
  DEFAULT_PREFERENCES,
  FONT_FAMILIES,
  THEMES,
  getThemeCssVars,
  resolveActiveThemeId,
} from '@/lib/themes';
import {
  fetchFeedStories,
  fetchStoryWithComments,
  fetchTimeTravelStories,
  getCachedStoryWithComments,
} from '@/lib/hn-api';
import {
  filterStories,
  loadBookmarks,
  loadPreferences,
  loadReadHistory,
  markStoryAsRead,
  savePreferences,
  toggleBookmarkStory,
} from '@/lib/storage';
import { AppHeader } from './AppHeader';
import { StoryFeedPane } from '@/components/feed/StoryFeedPane';
import { StoryDetailPane } from '@/components/detail/StoryDetailPane';
import { AppearanceModal } from '@/components/modals/AppearanceModal';
import { CommandPaletteModal } from '@/components/modals/CommandPaletteModal';
import { ShortcutsModal } from '@/components/modals/ShortcutsModal';
import { TimeTravelPreset } from '@/components/modals/TimeTravelPopover';
import { GlassButton } from '@/components/ui/GlassButton';

export const WorkspaceShell: React.FC = () => {
  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [activeFeed, setActiveFeed] = useState<FeedType>('top');
  const [timeTravel, setTimeTravel] = useState<TimeTravelPreset>('live');
  const [stories, setStories] = useState<HNStory[]>([]);
  const [page, setPage] = useState(1);
  const [loadingFeed, setLoadingFeed] = useState(true);

  const [selectedStory, setSelectedStory] =
    useState<HNStoryWithComments | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('comments');
  const latestStoryReqRef = useRef(0);

  const [readHistory, setReadHistory] = useState<
    Record<number, ReadHistoryEntry>
  >({});
  const [bookmarks, setBookmarks] = useState<HNStory[]>([]);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [systemPrefersDark, setSystemPrefersDark] = useState(true);

  // Hydrate local preferences, read history, bookmarks, and OS color scheme
  useEffect(() => {
    setPreferences(loadPreferences());
    setReadHistory(loadReadHistory());
    setBookmarks(loadBookmarks());

    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function'
    ) {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemPrefersDark(mql.matches);
      const listener = (e: MediaQueryListEvent) =>
        setSystemPrefersDark(e.matches);
      mql.addEventListener?.('change', listener);
      return () => mql.removeEventListener?.('change', listener);
    }
  }, []);

  // Auto-hide custom scrollbars unless actively scrolling
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timers = new WeakMap<EventTarget, ReturnType<typeof setTimeout>>();

    const handleScroll = (e: Event) => {
      const target =
        e.target === document
          ? document.documentElement
          : (e.target as HTMLElement);
      if (!target || typeof target.setAttribute !== 'function') return;

      target.setAttribute('data-scrolling', 'true');
      const existing = timers.get(target);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        target.removeAttribute('data-scrolling');
      }, 900);
      timers.set(target, timer);
    };

    window.addEventListener('scroll', handleScroll, {
      capture: true,
      passive: true,
    });
    return () =>
      window.removeEventListener('scroll', handleScroll, { capture: true });
  }, []);

  const resolvedThemeId = useMemo(
    () => resolveActiveThemeId(preferences, systemPrefersDark),
    [preferences, systemPrefersDark]
  );

  const activeTheme = THEMES[resolvedThemeId] ?? THEMES['obsidian-slate'];
  const themeVars = useMemo(
    () => getThemeCssVars(resolvedThemeId, preferences.customAccent),
    [resolvedThemeId, preferences.customAccent]
  );

  // Apply theme CSS variables, color-scheme lock (for Brave ForceDark), and typography settings
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const schemeLock =
      activeTheme.mode === 'light' ? 'only light' : 'only dark';

    root.setAttribute('data-theme', resolvedThemeId);
    root.setAttribute('data-theme-mode', activeTheme.mode);
    root.style.setProperty('color-scheme', schemeLock);

    Object.entries(themeVars).forEach(([k, v]) => {
      root.style.setProperty(k, v);
      body?.style.setProperty(k, v);
    });

    if (body) {
      body.style.backgroundColor = activeTheme.colors.bgCanvas;
      body.style.color = activeTheme.colors.textPrimary;
      body.style.setProperty('color-scheme', schemeLock);
    }

    root.style.setProperty(
      '--reader-font-family',
      (FONT_FAMILIES[preferences.fontFamily] ?? FONT_FAMILIES.sans).cssValue
    );
    root.style.setProperty('--reader-font-size', `${preferences.fontSize}px`);
    root.style.setProperty(
      '--reader-line-height',
      String(preferences.lineHeight)
    );
    root.style.setProperty(
      '--reader-line-width',
      preferences.lineWidth === 'full' ? '100%' : preferences.lineWidth
    );
  }, [preferences, resolvedThemeId, activeTheme, themeVars]);

  const handleUpdatePreferences = useCallback((next: UserPreferences) => {
    setPreferences(next);
    savePreferences(next);
  }, []);

  const syncStoryQueryParam = useCallback(
    (storyId: number | null, replace = false) => {
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      const currentParam = url.searchParams.get('story');
      const nextParam = storyId ? String(storyId) : null;

      if (currentParam === nextParam) return;

      if (nextParam) {
        url.searchParams.set('story', nextParam);
      } else {
        url.searchParams.delete('story');
      }

      if (replace) {
        window.history.replaceState(
          {},
          '',
          `${url.pathname}${url.search}${url.hash}`
        );
      } else {
        window.history.pushState(
          {},
          '',
          `${url.pathname}${url.search}${url.hash}`
        );
      }
    },
    []
  );

  const handleSelectStory = useCallback(
    (
      story: HNStory,
      options?: { skipUrlSync?: boolean; isPlaceholder?: boolean }
    ) => {
      const reqId = ++latestStoryReqRef.current;

      if (!options?.skipUrlSync) {
        syncStoryQueryParam(story.id);
      }

      // Immediately update selectedStory so the feed highlight and detail header switch in 0ms
      const cached = getCachedStoryWithComments(story.id);
      if (cached) {
        setSelectedStory(cached);
        setLoadingDetail(false);
        const updatedHistory = markStoryAsRead(cached.id, cached.commentsCount);
        setReadHistory(updatedHistory);
        return;
      }

      setSelectedStory((prev) =>
        prev?.id === story.id ? prev : { ...story, comments: [] }
      );
      setLoadingDetail(true);

      if (!options?.isPlaceholder) {
        const updatedHistory = markStoryAsRead(story.id, story.commentsCount);
        setReadHistory(updatedHistory);
      }

      fetchStoryWithComments(story.id)
        .then((fullStory) => {
          if (latestStoryReqRef.current !== reqId) return;
          startTransition(() => {
            setSelectedStory(fullStory);
            setLoadingDetail(false);
          });
          const updatedHistory = markStoryAsRead(
            fullStory.id,
            fullStory.commentsCount
          );
          setReadHistory(updatedHistory);
          if (!options?.skipUrlSync && fullStory.id !== story.id) {
            syncStoryQueryParam(fullStory.id, true);
          }
        })
        .catch(() => {
          if (latestStoryReqRef.current !== reqId) return;
          setSelectedStory({ ...story, comments: [] });
          setLoadingDetail(false);
        });
    },
    [syncStoryQueryParam]
  );

  // Deep-link support for ?story=<id> on initial page load and browser Back/Forward
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadStoryFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const rawId = params.get('story');
      const parsedId = rawId ? Number(rawId) : NaN;

      if (Number.isFinite(parsedId) && parsedId > 0) {
        handleSelectStory(
          {
            id: parsedId,
            title: `Story #${parsedId}`,
            cleanTitle: `Story #${parsedId}`,
            points: 0,
            user: '',
            time: Math.floor(Date.now() / 1000),
            commentsCount: 0,
            badges: [],
            type: 'story',
          },
          { skipUrlSync: true, isPlaceholder: true }
        );
      } else {
        setSelectedStory(null);
      }
    };

    loadStoryFromUrl();
    window.addEventListener('popstate', loadStoryFromUrl);
    return () => window.removeEventListener('popstate', loadStoryFromUrl);
  }, [handleSelectStory]);

  // Switch Feed Category: Clear current stories & reset selection immediately
  const handleSelectFeed = useCallback(
    (nextFeed: FeedType) => {
      syncStoryQueryParam(null);
      setIsAppearanceOpen(false);
      setActiveFeed(nextFeed);
      setTimeTravel('live');
      setSelectedStory(null);
      setActiveTab('comments');
      setStories([]);
      setLoadingFeed(true);
    },
    [syncStoryQueryParam]
  );

  // Switch Time Travel Range: Clear current stories & reset selection immediately
  const handleSelectTimeTravel = useCallback(
    (preset: TimeTravelPreset) => {
      syncStoryQueryParam(null);
      setIsAppearanceOpen(false);
      setTimeTravel(preset);
      setSelectedStory(null);
      setActiveTab('comments');
      setStories([]);
      setLoadingFeed(true);
    },
    [syncStoryQueryParam]
  );

  // Load feed or time-travel stories
  useEffect(() => {
    let active = true;
    setLoadingFeed(true);
    setStories([]);

    if (activeFeed === 'saved') {
      setStories(loadBookmarks());
      setLoadingFeed(false);
      return;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    let loader: Promise<HNStory[]>;

    if (timeTravel !== 'live') {
      const day = 86400;
      const ranges: Record<
        Exclude<TimeTravelPreset, 'live'>,
        [number, number]
      > = {
        yesterday: [nowSec - 2 * day, nowSec - day],
        'last-week': [nowSec - 7 * day, nowSec],
        'last-month': [nowSec - 30 * day, nowSec],
        'one-year-ago': [nowSec - 366 * day, nowSec - 364 * day],
      };
      const [start, end] = ranges[timeTravel];
      loader = fetchTimeTravelStories(start, end);
    } else {
      loader = fetchFeedStories(activeFeed, 1, 10);
    }

    loader
      .then((items) => {
        if (!active) return;
        setStories(items);
        setPage(1);
        setLoadingFeed(false);
      })
      .catch(() => {
        if (!active) return;
        setStories([]);
        setLoadingFeed(false);
      });

    return () => {
      active = false;
    };
  }, [activeFeed, timeTravel]);

  const handleLoadMore = useCallback(() => {
    if (activeFeed === 'saved' || timeTravel !== 'live') return;
    const nextPage = page + 1;
    setLoadingFeed(true);
    fetchFeedStories(activeFeed, nextPage, 10)
      .then((more) => {
        setStories((prev) => [...prev, ...more]);
        setPage(nextPage);
        setLoadingFeed(false);
      })
      .catch(() => {
        setLoadingFeed(false);
      });
  }, [activeFeed, page, timeTravel]);

  const visibleStories = useMemo(() => {
    const filtered = filterStories(stories, preferences, readHistory);
    if (selectedStory && !filtered.some((s) => s.id === selectedStory.id)) {
      return [selectedStory, ...filtered];
    }
    return filtered;
  }, [stories, preferences, readHistory, selectedStory]);

  const bookmarkedIds = useMemo(
    () => new Set(bookmarks.map((b) => b.id)),
    [bookmarks]
  );

  // Global Vim-style Keyboard Navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Escape' && isAppearanceOpen) {
        e.preventDefault();
        setIsAppearanceOpen(false);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === 't') {
        e.preventDefault();
        setIsAppearanceOpen((prev) => !prev);
      } else if (e.key === 'z') {
        e.preventDefault();
        handleUpdatePreferences({
          ...preferences,
          layoutMode: preferences.layoutMode === 'split' ? 'zen' : 'split',
        });
      } else if (e.key === 'r' && selectedStory?.url) {
        e.preventDefault();
        setActiveTab((prev) => (prev === 'comments' ? 'reader' : 'comments'));
      } else if (e.key === 'b' && selectedStory) {
        e.preventDefault();
        const res = toggleBookmarkStory(selectedStory);
        setBookmarks(res.bookmarks);
      } else if (e.key === 'o' && selectedStory?.url) {
        e.preventDefault();
        window.open(selectedStory.url, '_blank', 'noopener,noreferrer');
      } else if (e.key === 'j' || e.key === 'k') {
        e.preventDefault();
        if (visibleStories.length === 0) return;
        const idx = visibleStories.findIndex((s) => s.id === selectedStory?.id);
        const nextIdx =
          e.key === 'j'
            ? Math.min(visibleStories.length - 1, idx + 1)
            : Math.max(0, idx - 1);
        handleSelectStory(visibleStories[nextIdx]);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    preferences,
    selectedStory,
    visibleStories,
    isAppearanceOpen,
    handleSelectStory,
    handleUpdatePreferences,
  ]);

  const inlineRootStyle: React.CSSProperties = {
    ...(themeVars as React.CSSProperties),
    backgroundColor: activeTheme.colors.bgCanvas,
    color: activeTheme.colors.textPrimary,
    colorScheme: activeTheme.mode === 'light' ? 'only light' : 'only dark',
  };

  return (
    <div
      data-theme={resolvedThemeId}
      data-theme-mode={activeTheme.mode}
      style={inlineRootStyle}
      className={`${
        preferences.layoutMode === 'split' || isAppearanceOpen
          ? 'min-h-screen lg:h-screen lg:overflow-hidden flex flex-col'
          : 'min-h-screen flex flex-col'
      } transition-colors duration-200`}
    >
      <AppHeader
        activeFeed={activeFeed}
        onSelectFeed={handleSelectFeed}
        layoutMode={preferences.layoutMode}
        onToggleLayoutMode={() =>
          startTransition(() =>
            handleUpdatePreferences({
              ...preferences,
              layoutMode: preferences.layoutMode === 'split' ? 'zen' : 'split',
            })
          )
        }
        timeTravelPreset={timeTravel}
        onSelectTimeTravel={handleSelectTimeTravel}
        onOpenSearch={() => startTransition(() => setIsSearchOpen(true))}
        isAppearanceOpen={isAppearanceOpen}
        onOpenAppearance={() =>
          startTransition(() => setIsAppearanceOpen((prev) => !prev))
        }
        onOpenShortcuts={() => startTransition(() => setIsShortcutsOpen(true))}
        savedCount={bookmarks.length}
      />

      <SafeViewTransition>
        {isAppearanceOpen ? (
          <AppearanceModal
            isOpen={isAppearanceOpen}
            preferences={{ ...preferences, themeId: resolvedThemeId }}
            onUpdate={handleUpdatePreferences}
            onClose={() => startTransition(() => setIsAppearanceOpen(false))}
          />
        ) : preferences.layoutMode === 'split' ? (
          <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* Sticky / Independently Contained Left Feed Pane */}
            <section
              style={{ borderColor: 'var(--border-subtle)' }}
              className="custom-scrollbar lg:col-span-5 xl:col-span-5 border-r h-full overflow-y-auto overscroll-contain"
            >
              <StoryFeedPane
                stories={visibleStories}
                loading={loadingFeed}
                selectedStoryId={selectedStory?.id ?? null}
                readHistory={readHistory}
                bookmarkedIds={bookmarkedIds}
                onSelectStory={handleSelectStory}
                onToggleBookmark={(story, e) => {
                  e.stopPropagation();
                  setBookmarks(toggleBookmarkStory(story).bookmarks);
                }}
                onLoadMore={handleLoadMore}
                hasMore={activeFeed !== 'saved' && timeTravel === 'live'}
              />
            </section>

            {/* Independently Scrollable Right Detail & Reader Pane */}
            <section className="hidden lg:flex lg:flex-col lg:col-span-7 xl:col-span-7 h-full overflow-hidden">
              <StoryDetailPane
                story={selectedStory}
                loading={loadingDetail}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                collapseMode={preferences.defaultCollapseMode ?? 'root-only'}
                onCollapseModeChange={(mode) =>
                  handleUpdatePreferences({
                    ...preferences,
                    defaultCollapseMode: mode,
                  })
                }
                isBookmarked={
                  selectedStory ? bookmarkedIds.has(selectedStory.id) : false
                }
                onToggleBookmark={() => {
                  if (!selectedStory) return;
                  setBookmarks(toggleBookmarkStory(selectedStory).bookmarks);
                }}
                onInternalHnLinkClick={(id) =>
                  handleSelectStory(
                    {
                      id,
                      title: `Story #${id}`,
                      cleanTitle: `Story #${id}`,
                      points: 0,
                      user: '',
                      time: Math.floor(Date.now() / 1000),
                      commentsCount: 0,
                      badges: [],
                      type: 'story',
                    },
                    { isPlaceholder: true }
                  )
                }
              />
            </section>
          </main>
        ) : (
          <main className="flex-1 max-w-4xl w-full mx-auto py-4 px-2 sm:px-6">
            {selectedStory ? (
              <div>
                <div className="ml-5 mb-2">
                  <GlassButton
                    icon="arrow_back"
                    iconAccent
                    onClick={() => {
                      setSelectedStory(null);
                      syncStoryQueryParam(null);
                    }}
                  >
                    Back to Story Feed
                  </GlassButton>
                </div>
                <StoryDetailPane
                  story={selectedStory}
                  loading={loadingDetail}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  collapseMode={preferences.defaultCollapseMode ?? 'root-only'}
                  onCollapseModeChange={(mode) =>
                    handleUpdatePreferences({
                      ...preferences,
                      defaultCollapseMode: mode,
                    })
                  }
                  isBookmarked={bookmarkedIds.has(selectedStory.id)}
                  onToggleBookmark={() =>
                    setBookmarks(toggleBookmarkStory(selectedStory).bookmarks)
                  }
                  onInternalHnLinkClick={(id) =>
                    handleSelectStory({
                      id,
                      title: `Story #${id}`,
                      cleanTitle: `Story #${id}`,
                      points: 0,
                      user: '',
                      time: Math.floor(Date.now() / 1000),
                      commentsCount: 0,
                      badges: [],
                      type: 'story',
                    })
                  }
                />
              </div>
            ) : (
              <StoryFeedPane
                stories={visibleStories}
                loading={loadingFeed}
                selectedStoryId={null}
                readHistory={readHistory}
                bookmarkedIds={bookmarkedIds}
                onSelectStory={handleSelectStory}
                onToggleBookmark={(story, e) => {
                  e.stopPropagation();
                  setBookmarks(toggleBookmarkStory(story).bookmarks);
                }}
                onLoadMore={handleLoadMore}
                hasMore={activeFeed !== 'saved' && timeTravel === 'live'}
              />
            )}
          </main>
        )}
      </SafeViewTransition>

      <CommandPaletteModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectStory={(story) => {
          setIsAppearanceOpen(false);
          handleSelectStory(story);
        }}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};
