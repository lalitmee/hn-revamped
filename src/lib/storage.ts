import { HNStory, ReadHistoryEntry, UserPreferences } from '@/types/hn';
import { DEFAULT_PREFERENCES } from './themes';

const PREFS_KEY = 'hn_revamped_prefs_v1';
const TYPOGRAPHY_MIGRATED_KEY = 'hn_revamped_typo_v2';
const HISTORY_KEY = 'hn_revamped_history_v1';
const BOOKMARKS_KEY = 'hn_revamped_bookmarks_v1';

export function loadPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    const merged: UserPreferences = { ...DEFAULT_PREFERENCES, ...parsed };

    // One-time migration from legacy 16px / 1.65 default to compact 14px / 1.55 default
    if (
      !window.localStorage.getItem(TYPOGRAPHY_MIGRATED_KEY) &&
      parsed.fontSize === 16 &&
      parsed.lineHeight === 1.65
    ) {
      merged.fontSize = DEFAULT_PREFERENCES.fontSize;
      merged.lineHeight = DEFAULT_PREFERENCES.lineHeight;
      window.localStorage.setItem(TYPOGRAPHY_MIGRATED_KEY, '1');
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
    }
    return merged;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: UserPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadReadHistory(): Record<number, ReadHistoryEntry> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function markStoryAsRead(
  storyId: number,
  currentCommentsCount: number
): Record<number, ReadHistoryEntry> {
  const history = loadReadHistory();
  history[storyId] = {
    storyId,
    lastVisitedAt: Date.now(),
    lastCommentCount: currentCommentsCount,
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // Ignore quota errors
    }
  }
  return history;
}

export function getNewCommentsDelta(
  storyId: number,
  currentCommentsCount: number,
  history: Record<number, ReadHistoryEntry>
): number {
  const entry = history[storyId];
  if (!entry) return 0;
  const delta = currentCommentsCount - entry.lastCommentCount;
  return delta > 0 ? delta : 0;
}

export function loadBookmarks(): HNStory[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleBookmarkStory(story: HNStory): {
  bookmarks: HNStory[];
  isBookmarked: boolean;
} {
  const current = loadBookmarks();
  const exists = current.some((b) => b.id === story.id);
  const next = exists ? current.filter((b) => b.id !== story.id) : [story, ...current];

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota errors
    }
  }
  return { bookmarks: next, isBookmarked: !exists };
}

export function filterStories(
  stories: HNStory[],
  prefs: UserPreferences,
  history: Record<number, ReadHistoryEntry>
): HNStory[] {
  const keywords = prefs.mutedKeywords.map((k) => k.toLowerCase().trim()).filter(Boolean);
  const domains = prefs.mutedDomains.map((d) => d.toLowerCase().trim()).filter(Boolean);

  return stories.filter((story) => {
    if (prefs.hideReadStories && history[story.id]) {
      return false;
    }
    if (story.domain && domains.some((d) => story.domain!.toLowerCase().includes(d))) {
      return false;
    }
    const lowerTitle = story.title.toLowerCase();
    if (keywords.some((kw) => lowerTitle.includes(kw))) {
      return false;
    }
    return true;
  });
}
