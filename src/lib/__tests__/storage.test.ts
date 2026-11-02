import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadPreferences,
  savePreferences,
  markStoryAsRead,
  getNewCommentsDelta,
  toggleBookmarkStory,
  filterStories,
  hasUsedSwipe,
  recordSwipe,
} from '../storage';
import { DEFAULT_PREFERENCES } from '../themes';
import { HNStory } from '@/types/hn';

const sampleStory: HNStory = {
  id: 5001,
  title: 'Show HN: Fast Rust Compiler',
  cleanTitle: 'Fast Rust Compiler',
  url: 'https://github.com/example/rust-compiler',
  domain: 'github.com',
  points: 340,
  user: 'dev',
  time: 1700000000,
  commentsCount: 120,
  badges: [],
  type: 'story',
};

describe('Local Storage & Filtering Service', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('defaults to comfortable feeds and compact discussions on every viewport', () => {
    for (const matches of [true, false]) {
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches }));
      expect(loadPreferences()).toMatchObject({
        feedDensity: 'comfortable',
        discussionDensity: 'compact',
        themeMode: 'system',
      });
    }
  });

  it.each(['compact', 'comfortable'] as const)(
    'migrates legacy %s density to both settings',
    (cardDensity) => {
      window.localStorage.setItem(
        'hn_revamped_prefs_v1',
        JSON.stringify({ cardDensity })
      );
      expect(loadPreferences()).toMatchObject({
        feedDensity: cardDensity,
        discussionDensity: cardDensity,
      });
      const saved = JSON.parse(
        window.localStorage.getItem('hn_revamped_prefs_v1')!
      );
      expect(saved).toMatchObject({
        feedDensity: cardDensity,
        discussionDensity: cardDensity,
      });
      expect(saved).not.toHaveProperty('cardDensity');
      expect(loadPreferences()).toMatchObject({
        feedDensity: cardDensity,
        discussionDensity: cardDensity,
      });
    }
  );

  it('preserves independent settings over legacy values', () => {
    savePreferences({
      ...DEFAULT_PREFERENCES,
      cardDensity: 'compact',
      feedDensity: 'comfortable',
      discussionDensity: 'compact',
    });
    expect(loadPreferences()).toMatchObject({
      feedDensity: 'comfortable',
      discussionDensity: 'compact',
    });
  });

  it('fills a missing density from the legacy value without changing an explicit density', () => {
    window.localStorage.setItem(
      'hn_revamped_prefs_v1',
      JSON.stringify({ cardDensity: 'comfortable', feedDensity: 'compact' })
    );
    expect(loadPreferences()).toMatchObject({
      feedDensity: 'compact',
      discussionDensity: 'comfortable',
    });
  });

  it('defaults older or malformed preferences safely', () => {
    window.localStorage.setItem(
      'hn_revamped_prefs_v1',
      JSON.stringify({ fontSize: 18, feedDensity: 'invalid' })
    );
    expect(loadPreferences()).toMatchObject({
      feedDensity: 'comfortable',
      discussionDensity: 'compact',
      fontSize: 18,
    });
    window.localStorage.setItem('hn_revamped_prefs_v1', 'invalid');
    expect(loadPreferences()).toMatchObject({
      feedDensity: 'comfortable',
      discussionDensity: 'compact',
    });
  });

  it('persists and loads user preferences', () => {
    expect(loadPreferences().themeId).toBe('obsidian-slate');
    savePreferences({
      ...DEFAULT_PREFERENCES,
      themeId: 'kindle-sepia',
      fontSize: 18,
    });
    expect(loadPreferences().themeId).toBe('kindle-sepia');
    expect(loadPreferences().fontSize).toBe(18);
  });

  it('remembers swipe actions separately for Appearance and detail hints', () => {
    expect(hasUsedSwipe('appearance')).toBe(false);
    expect(hasUsedSwipe('detail')).toBe(false);

    recordSwipe('appearance');
    expect(hasUsedSwipe('appearance')).toBe(true);
    expect(hasUsedSwipe('detail')).toBe(false);

    recordSwipe('detail');
    expect(hasUsedSwipe('detail')).toBe(true);
  });

  it('tracks read stories and calculates +N new comment deltas', () => {
    const history = markStoryAsRead(5001, 100);
    expect(history[5001].lastCommentCount).toBe(100);
    expect(getNewCommentsDelta(5001, 128, history)).toBe(28);
    expect(getNewCommentsDelta(5001, 95, history)).toBe(0);
    expect(getNewCommentsDelta(9999, 50, history)).toBe(0);
  });

  it('toggles story bookmarks cleanly', () => {
    const first = toggleBookmarkStory(sampleStory);
    expect(first.isBookmarked).toBe(true);
    expect(first.bookmarks).toHaveLength(1);

    const second = toggleBookmarkStory(sampleStory);
    expect(second.isBookmarked).toBe(false);
    expect(second.bookmarks).toHaveLength(0);
  });

  it('filters stories by muted keywords, muted domains, and hideReadStories', () => {
    const cryptoStory: HNStory = {
      ...sampleStory,
      id: 5002,
      title: 'Why Blockchain Token Failed',
      cleanTitle: 'Why Blockchain Token Failed',
      domain: 'spamcoin.io',
    };
    const history = markStoryAsRead(5001, 120);

    const filteredByKeyword = filterStories(
      [sampleStory, cryptoStory],
      { ...DEFAULT_PREFERENCES, mutedKeywords: ['blockchain'] },
      {}
    );
    expect(filteredByKeyword.map((s) => s.id)).toEqual([5001]);

    const filteredByRead = filterStories(
      [sampleStory, cryptoStory],
      { ...DEFAULT_PREFERENCES, hideReadStories: true },
      history
    );
    expect(filteredByRead.map((s) => s.id)).toEqual([5002]);
  });
});
