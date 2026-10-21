export type FeedType = 'top' | 'new' | 'best' | 'ask' | 'show' | 'jobs' | 'saved';

export type LayoutMode = 'split' | 'zen';

export type DetailTab = 'comments' | 'reader';

export type FontFamilyId = 'sans' | 'serif' | 'hyperlegible' | 'mono';

export type LineWidthOption = '55ch' | '65ch' | '75ch' | 'full';

export type ThemeId =
  | 'warm-paper'
  | 'kindle-sepia'
  | 'kobo-matte'
  | 'crisp-day'
  | 'obsidian-slate'
  | 'catppuccin-mocha'
  | 'solarized-dark'
  | 'solarized-light'
  | 'nord-frost'
  | 'gruvbox-dark'
  | 'oled-midnight';

export interface ThemeColors {
  bgCanvas: string;
  bgSurface1: string;
  bgSurface2: string;
  bgSurfaceActive: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  linkUnvisited: string;
  linkVisited: string;
  borderSubtle: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  category: 'reader' | 'code';
  mode: 'light' | 'dark';
  inspiration: string;
  colors: ThemeColors;
}

export type StoryBadgeType = 'show' | 'ask' | 'launch' | 'pdf' | 'video' | 'github' | 'audio';

export interface StoryBadge {
  type: StoryBadgeType;
  label: string;
  icon: string;
}

export interface HNStory {
  id: number;
  title: string;
  cleanTitle: string;
  url?: string;
  domain?: string;
  text?: string;
  points: number;
  user: string;
  time: number;
  commentsCount: number;
  badges: StoryBadge[];
  type: 'story' | 'job' | 'ask' | 'poll';
}

export interface HNComment {
  id: number;
  user: string;
  time: number;
  text: string;
  points?: number | null;
  parentId?: number;
  children: HNComment[];
  totalDescendants: number;
  isDeadOrDeleted?: boolean;
}

export interface HNStoryWithComments extends HNStory {
  comments: HNComment[];
}

export interface ReaderArticle {
  url: string;
  title: string;
  byline?: string | null;
  siteName?: string | null;
  contentHtml: string;
  textContent: string;
  excerpt?: string | null;
  readingTimeMinutes: number;
  fallbackType?: 'youtube' | 'github' | 'pdf' | 'blocked';
  youtubeVideoId?: string;
  githubRepo?: { owner: string; repo: string };
}

export interface ReadHistoryEntry {
  storyId: number;
  lastVisitedAt: number;
  lastCommentCount: number;
}

export interface UserPreferences {
  themeId: ThemeId;
  fontFamily: FontFamilyId;
  fontSize: number;
  lineHeight: number;
  lineWidth: LineWidthOption;
  layoutMode: LayoutMode;
  hideReadStories: boolean;
  mutedKeywords: string[];
  mutedDomains: string[];
}
