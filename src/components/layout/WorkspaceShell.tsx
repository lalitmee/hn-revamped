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
  hasUsedSwipe,
  loadBookmarks,
  loadPreferences,
  loadReadHistory,
  markStoryAsRead,
  recordSwipe,
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
  const [prefsHydrated, setPrefsHydrated] = useState(false);

  // Compact cards fit more rows on screen, so fetch a larger first batch.
  const desiredPageSize = preferences.cardDensity === 'compact' ? 15 : 10;
  const desiredPageSizeRef = useRef(desiredPageSize);
  desiredPageSizeRef.current = desiredPageSize;
  // Page size is pinned per feed load so "load more" offsets stay consistent
  // even if density is toggled mid-session.
  const loadedPageSizeRef = useRef(desiredPageSize);

  const [selectedStory, setSelectedStory] =
    useState<HNStoryWithComments | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const feedTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressFeedClickUntilRef = useRef(0);
  const [showFeedSwipeHint, setShowFeedSwipeHint] = useState(false);
  const [showDetailSwipeHint, setShowDetailSwipeHint] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>('comments');
  const latestStoryReqRef = useRef(0);
  const navigationDepthRef = useRef(0);

  const [readHistory, setReadHistory] = useState<
    Record<number, ReadHistoryEntry>
  >({});
  const [bookmarks, setBookmarks] = useState<HNStory[]>([]);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [systemPrefersDark, setSystemPrefersDark] = useState(true);
  const overlayRef = useRef<'search' | 'shortcuts' | null>(null);

  const closeOverlay = useCallback(() => {
    if (
      new URLSearchParams(window.location.search).get('view') === 'appearance'
    ) {
      if (navigationDepthRef.current > 0) window.history.back();
      else {
        const url = new URL(window.location.href);
        url.searchParams.delete('view');
        window.history.replaceState(
          window.history.state,
          '',
          `${url.pathname}${url.search}${url.hash}`
        );
        setIsAppearanceOpen(false);
      }
      return;
    }
    if (
      overlayRef.current &&
      window.history.state?.hnOverlay === overlayRef.current
    ) {
      window.history.back();
    } else {
      overlayRef.current = null;
      setIsSearchOpen(false);
      setIsAppearanceOpen(false);
      setIsShortcutsOpen(false);
    }
  }, []);

  const openOverlay = useCallback((overlay: 'search' | 'shortcuts') => {
    if (overlayRef.current === overlay) return;
    window.history.pushState(
      { ...window.history.state, hnOverlay: overlay },
      ''
    );
    overlayRef.current = overlay;
    setIsSearchOpen(overlay === 'search');
    setIsShortcutsOpen(overlay === 'shortcuts');
  }, []);

  // Hydrate local preferences, read history, bookmarks, and OS color scheme
  useEffect(() => {
    setShowFeedSwipeHint(!hasUsedSwipe('feed'));
    setPreferences(loadPreferences());
    setPrefsHydrated(true);
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

  const syncNavigation = useCallback(
    (
      next: {
        story?: number | null;
        feed?: FeedType;
        time?: TimeTravelPreset;
        view?: 'appearance' | null;
      },
      replace = false
    ) => {
      const url = new URL(window.location.href);
      const wasViewingStory = url.searchParams.has('story');
      if (next.story !== undefined) {
        if (next.story) url.searchParams.set('story', String(next.story));
        else url.searchParams.delete('story');
      }
      if (next.feed !== undefined) {
        if (next.feed === 'top') url.searchParams.delete('feed');
        else url.searchParams.set('feed', next.feed);
      }
      if (next.time !== undefined) {
        if (next.time === 'live') url.searchParams.delete('time');
        else url.searchParams.set('time', next.time);
      }
      if (next.view !== undefined) {
        if (next.view) url.searchParams.set('view', next.view);
        else url.searchParams.delete('view');
      }
      const target = `${url.pathname}${url.search}${url.hash}`;
      if (
        target ===
        `${window.location.pathname}${window.location.search}${window.location.hash}`
      )
        return;
      const depth = navigationDepthRef.current + (replace ? 0 : 1);
      const state = {
        ...window.history.state,
        hnNavigationDepth: depth,
        hnFeedDepth: next.story
          ? wasViewingStory
            ? (window.history.state?.hnFeedDepth ?? null)
            : navigationDepthRef.current
          : next.story === null
            ? null
            : (window.history.state?.hnFeedDepth ?? null),
        hnOverlay: null,
      };
      if (replace) window.history.replaceState(state, '', target);
      else window.history.pushState(state, '', target);
      navigationDepthRef.current = depth;
    },
    []
  );

  const openAppearance = useCallback(() => {
    syncNavigation({ view: 'appearance' });
    setIsAppearanceOpen(true);
  }, [syncNavigation]);

  const handleSelectStory = useCallback(
    (
      story: HNStory,
      options?: { skipUrlSync?: boolean; isPlaceholder?: boolean }
    ) => {
      const reqId = ++latestStoryReqRef.current;
      setShowDetailSwipeHint(!hasUsedSwipe('detail'));

      // A text-only story has no Reader View; don't carry that selection over.
      if (!story.url) setActiveTab('comments');

      if (!options?.skipUrlSync) {
        syncNavigation({ story: story.id, view: null });
      }

      // Immediately update selectedStory so the feed highlight and detail header switch in 0ms
      const cached = getCachedStoryWithComments(story.id);
      if (cached) {
        setSelectedStory(cached);
        setStories((current) =>
          current.map((item) =>
            item.id === cached.id
              ? { ...item, commentsCount: cached.commentsCount }
              : item
          )
        );
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
            setStories((current) =>
              current.map((item) =>
                item.id === fullStory.id
                  ? { ...item, commentsCount: fullStory.commentsCount }
                  : item
              )
            );
            setLoadingDetail(false);
          });
          const updatedHistory = markStoryAsRead(
            fullStory.id,
            fullStory.commentsCount
          );
          setReadHistory(updatedHistory);
          if (!options?.skipUrlSync && fullStory.id !== story.id) {
            syncNavigation({ story: fullStory.id }, true);
          }
        })
        .catch(() => {
          if (latestStoryReqRef.current !== reqId) return;
          setSelectedStory({ ...story, comments: [] });
          setLoadingDetail(false);
        });
    },
    [syncNavigation]
  );

  const returnToFeed = useCallback(() => {
    ++latestStoryReqRef.current;
    setSelectedStory(null);
    setLoadingDetail(false);
    setActiveTab('comments');
    const feedDepth = window.history.state?.hnFeedDepth;
    if (
      Number.isInteger(feedDepth) &&
      feedDepth >= 0 &&
      feedDepth < navigationDepthRef.current
    ) {
      // This is an Up action, not browser Back: skip intermediate stories.
      window.history.go(feedDepth - navigationDepthRef.current);
    } else {
      // A direct link has no known feed entry in this tab's history.
      syncNavigation({ story: null, view: null }, true);
    }
  }, [syncNavigation]);

  // Deep-link support for ?story=<id> on initial page load and browser Back/Forward
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadStoryFromUrl = () => {
      navigationDepthRef.current = window.history.state?.hnNavigationDepth ?? 0;
      overlayRef.current = window.history.state?.hnOverlay ?? null;
      const params = new URLSearchParams(window.location.search);
      setIsSearchOpen(overlayRef.current === 'search');
      setIsAppearanceOpen(params.get('view') === 'appearance');
      setIsShortcutsOpen(overlayRef.current === 'shortcuts');
      const feed = params.get('feed');
      const time = params.get('time');
      const validFeeds: FeedType[] = [
        'top',
        'new',
        'best',
        'ask',
        'show',
        'jobs',
        'saved',
      ];
      const validTimes: TimeTravelPreset[] = [
        'live',
        'yesterday',
        'last-week',
        'last-month',
        'one-year-ago',
      ];
      setActiveFeed(
        validFeeds.includes(feed as FeedType) ? (feed as FeedType) : 'top'
      );
      setTimeTravel(
        validTimes.includes(time as TimeTravelPreset)
          ? (time as TimeTravelPreset)
          : 'live'
      );
      setActiveTab('comments');
      ++latestStoryReqRef.current;
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
        setLoadingDetail(false);
      }
    };

    if (window.history.state?.hnNavigationDepth === undefined) {
      window.history.replaceState(
        { ...window.history.state, hnNavigationDepth: 0 },
        ''
      );
    }
    loadStoryFromUrl();
    window.addEventListener('popstate', loadStoryFromUrl);
    return () => window.removeEventListener('popstate', loadStoryFromUrl);
  }, [handleSelectStory]);

  // Switch Feed Category: Clear current stories & reset selection immediately
  const handleSelectFeed = useCallback(
    (nextFeed: FeedType) => {
      if (nextFeed === activeFeed && timeTravel === 'live' && !selectedStory)
        return;
      ++latestStoryReqRef.current;
      if (overlayRef.current) {
        window.history.replaceState(
          { ...window.history.state, hnOverlay: null },
          ''
        );
        overlayRef.current = null;
      }
      syncNavigation({ story: null, feed: nextFeed, time: 'live', view: null });
      setIsAppearanceOpen(false);
      setActiveFeed(nextFeed);
      setTimeTravel('live');
      setSelectedStory(null);
      setActiveTab('comments');
      setStories([]);
      setLoadingFeed(true);
    },
    [activeFeed, timeTravel, selectedStory, syncNavigation]
  );

  // Switch Time Travel Range: Clear current stories & reset selection immediately
  const handleSelectTimeTravel = useCallback(
    (preset: TimeTravelPreset) => {
      if (preset === timeTravel && !selectedStory) return;
      ++latestStoryReqRef.current;
      if (overlayRef.current) {
        window.history.replaceState(
          { ...window.history.state, hnOverlay: null },
          ''
        );
        overlayRef.current = null;
      }
      syncNavigation({ story: null, time: preset, view: null });
      setIsAppearanceOpen(false);
      setTimeTravel(preset);
      setSelectedStory(null);
      setActiveTab('comments');
      setStories([]);
      setLoadingFeed(true);
    },
    [timeTravel, selectedStory, syncNavigation]
  );

  // Load feed or time-travel stories
  useEffect(() => {
    if (!prefsHydrated) return;
    let active = true;
    setLoadingFeed(true);
    setStories([]);
    loadedPageSizeRef.current = desiredPageSizeRef.current;

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
      loader = fetchFeedStories(activeFeed, 1, loadedPageSizeRef.current);
    }

    loader
      .then((items) => {
        if (!active) return;
        const seen = new Set<number>();
        const unique = items.filter((s) => {
          if (seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        });
        setStories(unique);
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
  }, [activeFeed, timeTravel, prefsHydrated]);

  const handleLoadMore = useCallback(() => {
    if (activeFeed === 'saved' || timeTravel !== 'live') return;
    const nextPage = page + 1;
    setLoadingFeed(true);
    fetchFeedStories(activeFeed, nextPage, loadedPageSizeRef.current)
      .then((more) => {
        setStories((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const uniqueMore = more.filter((s) => !existingIds.has(s.id));
          return [...prev, ...uniqueMore];
        });
        setPage(nextPage);
        setLoadingFeed(false);
      })
      .catch(() => {
        setLoadingFeed(false);
      });
  }, [activeFeed, page, timeTravel]);

  const visibleStories = useMemo(() => {
    const filtered = filterStories(stories, preferences, readHistory);
    const seen = new Set<number>();
    const list: HNStory[] = [];
    for (const story of filtered) {
      if (!seen.has(story.id)) {
        seen.add(story.id);
        list.push(story);
      }
    }
    // Only prepend selectedStory if it originated from an external URL/comment link
    // and does not already exist in the current feed page.
    if (selectedStory && !seen.has(selectedStory.id)) {
      list.unshift(selectedStory);
    }
    return list;
  }, [stories, preferences, readHistory, selectedStory]);

  const onFeedTouchStart = (event: React.TouchEvent) => {
    feedTouchStartRef.current = null;
    suppressFeedClickUntilRef.current = 0;
    if (selectedStory || event.touches.length !== 1) return;
    const target = event.target as HTMLElement;
    if (
      target.closest(
        'button, a, input, textarea, select, [role="button"]:not(article), [role="slider"], [role="switch"], [contenteditable="true"]'
      )
    )
      return;
    const touch = event.touches[0];
    if (touch.clientX < 28 || touch.clientX > window.innerWidth - 28) return;
    feedTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const onFeedTouchEnd = (event: React.TouchEvent) => {
    const start = feedTouchStartRef.current;
    feedTouchStartRef.current = null;
    if (!start || selectedStory || event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const feeds: FeedType[] = [
      'top',
      'new',
      'best',
      'ask',
      'show',
      'jobs',
      'saved',
    ];
    const nextIndex =
      (feeds.indexOf(activeFeed) + (dx < 0 ? 1 : -1) + feeds.length) %
      feeds.length;
    suppressFeedClickUntilRef.current = Date.now() + 500;
    handleSelectFeed(feeds[nextIndex]);
    recordSwipe('feed');
    setShowFeedSwipeHint(false);
  };

  const onFeedClickCapture = (event: React.MouseEvent) => {
    if (event.detail !== 0 && Date.now() < suppressFeedClickUntilRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressFeedClickUntilRef.current = 0;
    }
  };

  const onDetailTouchStart = (event: React.TouchEvent) => {
    touchStartRef.current = null;
    if (event.touches.length !== 1) return;
    const target = event.target as HTMLElement;
    if (
      target.closest(
        'button, a, input, textarea, select, pre, [role="button"], [data-no-story-swipe]'
      )
    )
      return;
    const touch = event.touches[0];
    // Leave the screen edge to the browser's back gesture.
    touchStartRef.current =
      touch.clientX < 28 || touch.clientX > window.innerWidth - 28
        ? null
        : { x: touch.clientX, y: touch.clientY };
  };

  const onDetailTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (!selectedStory?.url) return;
    if (dx < 0 && activeTab === 'comments') {
      setActiveTab('reader');
      recordSwipe('detail');
      setShowDetailSwipeHint(false);
    } else if (dx > 0 && activeTab === 'reader') {
      setActiveTab('comments');
      recordSwipe('detail');
      setShowDetailSwipeHint(false);
    }
  };

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
        closeOverlay();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isSearchOpen) closeOverlay();
        else openOverlay('search');
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        openOverlay('search');
      } else if (e.key === '?') {
        e.preventDefault();
        if (isShortcutsOpen) closeOverlay();
        else openOverlay('shortcuts');
      } else if (e.key === 't') {
        e.preventDefault();
        if (isAppearanceOpen) closeOverlay();
        else openAppearance();
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
    isSearchOpen,
    isShortcutsOpen,
    openOverlay,
    openAppearance,
    closeOverlay,
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
          ? 'h-dvh overflow-hidden flex flex-col'
          : 'h-dvh overflow-hidden lg:min-h-screen lg:h-auto lg:overflow-visible flex flex-col'
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
        onOpenSearch={() => openOverlay('search')}
        isAppearanceOpen={isAppearanceOpen}
        onOpenAppearance={() =>
          isAppearanceOpen ? closeOverlay() : openAppearance()
        }
        onOpenShortcuts={() => openOverlay('shortcuts')}
        savedCount={bookmarks.length}
        isStoryOpen={Boolean(selectedStory) && !isAppearanceOpen}
        onBackToFeed={returnToFeed}
        onBackFromAppearance={closeOverlay}
      />

      <SafeViewTransition>
        {isAppearanceOpen ? (
          <AppearanceModal
            isOpen={isAppearanceOpen}
            preferences={{ ...preferences, themeId: resolvedThemeId }}
            onUpdate={handleUpdatePreferences}
            onClose={closeOverlay}
          />
        ) : preferences.layoutMode === 'split' ? (
          <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* Sticky / Independently Contained Left Feed Pane */}
            <section
              style={{ borderColor: 'var(--border-subtle)' }}
              onTouchStart={onFeedTouchStart}
              onTouchEnd={onFeedTouchEnd}
              onClickCapture={onFeedClickCapture}
              onTouchCancel={() => {
                feedTouchStartRef.current = null;
              }}
              className={`touch-pan-y custom-scrollbar mobile-feed-scroll lg:col-span-5 xl:col-span-5 lg:border-r h-full overflow-y-auto overscroll-contain ${selectedStory ? 'hidden lg:block' : ''}`}
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
                compact={preferences.cardDensity === 'compact'}
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
                compact={preferences.cardDensity === 'compact'}
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
            {selectedStory && (
              <section
                onTouchStart={onDetailTouchStart}
                onTouchEnd={onDetailTouchEnd}
                className="lg:hidden relative flex flex-col min-h-0 overflow-hidden min-w-0"
              >
                <StoryDetailPane
                  story={selectedStory}
                  loading={loadingDetail}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  collapseMode={preferences.defaultCollapseMode ?? 'root-only'}
                  compact={preferences.cardDensity === 'compact'}
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
                {showDetailSwipeHint && (
                  <div className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-40 -translate-x-1/2 lg:hidden">
                    <div className="swipe-hint-pill liquid-glass rounded-full h-8 px-3.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)] shadow-lg whitespace-nowrap">
                      <span
                        aria-hidden="true"
                        className="swipe-hint-icon material-symbols-rounded text-[16px] text-[var(--accent)]"
                      >
                        swipe
                      </span>
                      <span>Swipe to switch discussion and reader</span>
                    </div>
                  </div>
                )}
              </section>
            )}
          </main>
        ) : (
          <main
            onTouchStart={onFeedTouchStart}
            onTouchEnd={onFeedTouchEnd}
            onClickCapture={onFeedClickCapture}
            onTouchCancel={() => {
              feedTouchStartRef.current = null;
            }}
            className={`touch-pan-y custom-scrollbar mobile-feed-scroll flex-1 min-h-0 ${selectedStory ? 'max-lg:overflow-hidden max-lg:py-0 max-lg:px-0' : 'overflow-y-auto'} lg:overflow-visible max-w-4xl w-full mx-auto py-2 sm:py-4 px-1.5 sm:px-6`}
          >
            {selectedStory ? (
              <div
                onTouchStart={onDetailTouchStart}
                onTouchEnd={onDetailTouchEnd}
                className="relative h-full min-h-0 flex flex-col"
              >
                <div className="hidden lg:block ml-5 mb-2">
                  <GlassButton
                    icon="arrow_back"
                    iconAccent
                    onClick={() => {
                      returnToFeed();
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
                  compact={preferences.cardDensity === 'compact'}
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
                {showDetailSwipeHint && (
                  <div className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-40 -translate-x-1/2 lg:hidden">
                    <div className="swipe-hint-pill liquid-glass rounded-full h-8 px-3.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)] shadow-lg whitespace-nowrap">
                      <span
                        aria-hidden="true"
                        className="swipe-hint-icon material-symbols-rounded text-[16px] text-[var(--accent)]"
                      >
                        swipe
                      </span>
                      <span>Swipe to switch discussion and reader</span>
                    </div>
                  </div>
                )}
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
                compact={preferences.cardDensity === 'compact'}
                hasMore={activeFeed !== 'saved' && timeTravel === 'live'}
              />
            )}
          </main>
        )}
      </SafeViewTransition>

      {showFeedSwipeHint &&
        !selectedStory &&
        !isAppearanceOpen &&
        !isSearchOpen &&
        !isShortcutsOpen && (
          <div className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-40 -translate-x-1/2 lg:hidden">
            <div className="swipe-hint-pill liquid-glass rounded-full h-8 px-3.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)] shadow-lg whitespace-nowrap">
              <span
                aria-hidden="true"
                className="swipe-hint-icon material-symbols-rounded text-[16px] text-[var(--accent)]"
              >
                swipe
              </span>
              <span>Swipe to switch feeds</span>
            </div>
          </div>
        )}

      <CommandPaletteModal
        isOpen={isSearchOpen}
        onClose={closeOverlay}
        onSelectStory={(story) => {
          // Replace the overlay entry with the destination so Back returns to its origin.
          if (overlayRef.current) {
            window.history.replaceState(
              { ...window.history.state, hnOverlay: null },
              ''
            );
            overlayRef.current = null;
          }
          setIsSearchOpen(false);
          handleSelectStory(story);
        }}
      />

      <ShortcutsModal isOpen={isShortcutsOpen} onClose={closeOverlay} />
    </div>
  );
};
