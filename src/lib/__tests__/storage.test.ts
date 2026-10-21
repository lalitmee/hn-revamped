import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadPreferences,
  savePreferences,
  markStoryAsRead,
  getNewCommentsDelta,
  toggleBookmarkStory,
  filterStories,
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

  it('persists and loads user preferences', () => {
    expect(loadPreferences().themeId).toBe('obsidian-slate');
    savePreferences({ ...DEFAULT_PREFERENCES, themeId: 'kindle-sepia', fontSize: 18 });
    expect(loadPreferences().themeId).toBe('kindle-sepia');
    expect(loadPreferences().fontSize).toBe(18);
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
