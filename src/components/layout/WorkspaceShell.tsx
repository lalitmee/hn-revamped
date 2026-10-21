'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DetailTab,
  FeedType,
  HNStory,
  HNStoryWithComments,
  ReadHistoryEntry,
  UserPreferences,
} from '@/types/hn';
import { DEFAULT_PREFERENCES, FONT_FAMILIES, getThemeCssVars } from '@/lib/themes';
import {
  fetchFeedStories,
  fetchStoryWithComments,
  fetchTimeTravelStories,
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

export const WorkspaceShell: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [activeFeed, setActiveFeed] = useState<FeedType>('top');
  const [timeTravel, setTimeTravel] = useState<TimeTravelPreset>('live');
  const [stories, setStories] = useState<HNStory[]>([]);
  const [page, setPage] = useState(1);
  const [loadingFeed, setLoadingFeed] = useState(true);

  const [selectedStory, setSelectedStory] = useState<HNStoryWithComments | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('comments');

  const [readHistory, setReadHistory] = useState<Record<number, ReadHistoryEntry>>({});
  const [bookmarks, setBookmarks] = useState<HNStory[]>([]);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Hydrate local preferences, read history, and bookmarks
  useEffect(() => {
    setPreferences(loadPreferences());
    setReadHistory(loadReadHistory());
    setBookmarks(loadBookmarks());
  }, []);

  // Apply theme CSS variables and typography settings
  useEffect(() => {
    const vars = getThemeCssVars(preferences.themeId);
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.style.setProperty(
      '--reader-font-family',
      FONT_FAMILIES[preferences.fontFamily].cssValue
    );
    root.style.setProperty('--reader-font-size', `${preferences.fontSize}px`);
    root.style.setProperty('--reader-line-height', String(preferences.lineHeight));
    root.style.setProperty(
      '--reader-line-width',
      preferences.lineWidth === 'full' ? '100%' : preferences.lineWidth
    );
  }, [preferences]);

  const handleUpdatePreferences = useCallback((next: UserPreferences) => {
    setPreferences(next);
    savePreferences(next);
  }, []);

  const handleSelectStory = useCallback((story: HNStory) => {
    setLoadingDetail(true);
    const updatedHistory = markStoryAsRead(story.id, story.commentsCount);
    setReadHistory(updatedHistory);

    fetchStoryWithComments(story.id)
      .then((fullStory) => {
        setSelectedStory(fullStory);
      })
      .catch(() => {
        setSelectedStory({ ...story, comments: [] });
      })
      .finally(() => {
        setLoadingDetail(false);
      });
  }, []);

  // Load feed or time-travel stories
  useEffect(() => {
    let active = true;
    setLoadingFeed(true);

    if (activeFeed === 'saved') {
      setStories(loadBookmarks());
      setLoadingFeed(false);
      return;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    let loader: Promise<HNStory[]>;

    if (timeTravel !== 'live') {
      const day = 86400;
      const ranges: Record<Exclude<TimeTravelPreset, 'live'>, [number, number]> = {
        yesterday: [nowSec - 2 * day, nowSec - day],
        'last-week': [nowSec - 7 * day, nowSec],
        'last-month': [nowSec - 30 * day, nowSec],
        'one-year-ago': [nowSec - 366 * day, nowSec - 364 * day],
      };
      const [start, end] = ranges[timeTravel];
      loader = fetchTimeTravelStories(start, end);
    } else {
      loader = fetchFeedStories(activeFeed, 1, 30);
    }

    loader
      .then((items) => {
        if (!active) return;
        setStories(items);
        setPage(1);
        if (items.length > 0 && !selectedStory) {
          handleSelectStory(items[0]);
        }
      })
      .catch(() => {
        if (active) setStories([]);
      })
      .finally(() => {
        if (active) setLoadingFeed(false);
      });

    return () => {
      active = false;
    };
  }, [activeFeed, timeTravel, handleSelectStory]);

  const handleLoadMore = useCallback(() => {
    if (activeFeed === 'saved' || timeTravel !== 'live') return;
    const nextPage = page + 1;
    setLoadingFeed(true);
    fetchFeedStories(activeFeed, nextPage, 30)
      .then((more) => {
        setStories((prev) => [...prev, ...more]);
        setPage(nextPage);
      })
      .finally(() => setLoadingFeed(false));
  }, [activeFeed, page, timeTravel]);

  const visibleStories = useMemo(
    () => filterStories(stories, preferences, readHistory),
    [stories, preferences, readHistory]
  );

  const bookmarkedIds = useMemo(() => new Set(bookmarks.map((b) => b.id)), [bookmarks]);

  // Global Vim-style Keyboard Navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

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
  }, [preferences, selectedStory, visibleStories, handleSelectStory, handleUpdatePreferences]);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader
        activeFeed={activeFeed}
        onSelectFeed={(f) => {
          setActiveFeed(f);
          setTimeTravel('live');
        }}
        layoutMode={preferences.layoutMode}
        onToggleLayoutMode={() =>
          handleUpdatePreferences({
            ...preferences,
            layoutMode: preferences.layoutMode === 'split' ? 'zen' : 'split',
          })
        }
        timeTravelPreset={timeTravel}
        onSelectTimeTravel={setTimeTravel}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAppearance={() => setIsAppearanceOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        savedCount={bookmarks.length}
      />

      {preferences.layoutMode === 'split' ? (
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 h-[calc(100vh-57px)] overflow-hidden">
          <section
            style={{ borderColor: 'var(--border-subtle)' }}
            className="lg:col-span-5 xl:col-span-5 border-r overflow-y-auto h-full"
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

          <section className="hidden lg:block lg:col-span-7 xl:col-span-7 overflow-y-auto h-full">
            <StoryDetailPane
              story={selectedStory}
              loading={loadingDetail}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isBookmarked={selectedStory ? bookmarkedIds.has(selectedStory.id) : false}
              onToggleBookmark={() => {
                if (!selectedStory) return;
                setBookmarks(toggleBookmarkStory(selectedStory).bookmarks);
              }}
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
          </section>
        </main>
      ) : (
        <main className="flex-1 max-w-4xl w-full mx-auto py-4 px-2 sm:px-6">
          {selectedStory ? (
            <div>
              <button
                type="button"
                onClick={() => setSelectedStory(null)}
                style={{
                  backgroundColor: 'var(--bg-surface-1)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--accent)',
                }}
                className="ml-5 mb-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer"
              >
                <span className="material-symbols-rounded text-[16px]">arrow_back</span>
                Back to Story Feed
              </button>
              <StoryDetailPane
                story={selectedStory}
                loading={loadingDetail}
                activeTab={activeTab}
                onTabChange={setActiveTab}
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

      <AppearanceModal
        isOpen={isAppearanceOpen}
        preferences={preferences}
        onUpdate={handleUpdatePreferences}
        onClose={() => setIsAppearanceOpen(false)}
      />

      <CommandPaletteModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectStory={handleSelectStory}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};
