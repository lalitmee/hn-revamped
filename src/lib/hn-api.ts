import { FeedType, HNComment, HNStory, HNStoryWithComments, StoryBadge } from '@/types/hn';

const FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0';
const ALGOLIA_BASE = 'https://hn.algolia.com/api/v1';

export function extractDomain(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return undefined;
  }
}

export function parseTitleAndBadges(
  rawTitle: string,
  url?: string
): { cleanTitle: string; badges: StoryBadge[] } {
  let title = (rawTitle || '').trim();
  const badges: StoryBadge[] = [];

  if (/^Show HN:\s*/i.test(title)) {
    badges.push({ type: 'show', label: 'Show HN', icon: 'rocket_launch' });
    title = title.replace(/^Show HN:\s*/i, '');
  } else if (/^Ask HN:\s*/i.test(title)) {
    badges.push({ type: 'ask', label: 'Ask HN', icon: 'help' });
    title = title.replace(/^Ask HN:\s*/i, '');
  } else if (/^Launch HN:\s*/i.test(title)) {
    badges.push({ type: 'launch', label: 'Launch HN', icon: 'flag' });
    title = title.replace(/^Launch HN:\s*/i, '');
  }

  if (/\s*[\[\(]pdf[\]\)]\s*$/i.test(title) || (url && /\.pdf($|\?)/i.test(url))) {
    badges.push({ type: 'pdf', label: 'PDF', icon: 'picture_as_pdf' });
    title = title.replace(/\s*[\[\(]pdf[\]\)]\s*$/i, '');
  }

  if (
    /\s*[\[\(]video[\]\)]\s*$/i.test(title) ||
    (url && /(youtube\.com\/watch|youtu\.be\/|vimeo\.com)/i.test(url))
  ) {
    badges.push({ type: 'video', label: 'Video', icon: 'play_circle' });
    title = title.replace(/\s*[\[\(]video[\]\)]\s*$/i, '');
  }

  if (url && /github\.com\/[^/]+\/[^/]+/i.test(url)) {
    badges.push({ type: 'github', label: 'GitHub', icon: 'code' });
  }

  return { cleanTitle: title.trim(), badges };
}

export interface AlgoliaRawNode {
  id: number;
  author?: string | null;
  created_at_i?: number;
  text?: string | null;
  points?: number | null;
  parent_id?: number;
  children?: AlgoliaRawNode[];
}

export function normalizeAlgoliaCommentTree(nodes: AlgoliaRawNode[] = []): HNComment[] {
  const result: HNComment[] = [];

  for (const node of nodes) {
    if (!node || (!node.text && (!node.children || node.children.length === 0))) {
      continue;
    }
    const children = normalizeAlgoliaCommentTree(node.children || []);
    const totalDescendants = children.reduce((acc, child) => acc + 1 + child.totalDescendants, 0);

    result.push({
      id: node.id,
      user: node.author || '[deleted]',
      time: node.created_at_i || Math.floor(Date.now() / 1000),
      text: node.text || '',
      points: node.points ?? null,
      parentId: node.parent_id,
      children,
      totalDescendants,
      isDeadOrDeleted: !node.author || !node.text,
    });
  }

  return result;
}

const FEED_ENDPOINTS: Record<Exclude<FeedType, 'saved'>, string> = {
  top: 'topstories',
  new: 'newstories',
  best: 'beststories',
  ask: 'askstories',
  show: 'showstories',
  jobs: 'jobstories',
};

const FEED_IDS_TTL_MS = 60_000;
const feedIdsCache = new Map<string, { ids: number[]; fetchedAt: number }>();
const storyItemCache = new Map<number, { story: HNStory; fetchedAt: number }>();

export async function fetchStoryItem(id: number): Promise<HNStory | null> {
  const cached = storyItemCache.get(id);
  if (cached && Date.now() - cached.fetchedAt < FEED_IDS_TTL_MS) {
    return cached.story;
  }

  try {
    const res = await fetch(`${FIREBASE_BASE}/item/${id}.json`);
    if (!res.ok) return null;
    const item = await res.json();
    if (!item || item.deleted || item.dead || !item.title) return null;

    const { cleanTitle, badges } = parseTitleAndBadges(item.title, item.url);
    const story: HNStory = {
      id: item.id,
      title: item.title,
      cleanTitle,
      url: item.url,
      domain: extractDomain(item.url),
      text: item.text,
      points: item.score ?? 0,
      user: item.by ?? 'anonymous',
      time: item.time ?? Math.floor(Date.now() / 1000),
      commentsCount: item.descendants ?? 0,
      badges,
      type: item.type === 'job' ? 'job' : item.title.startsWith('Ask HN:') ? 'ask' : 'story',
    };
    storyItemCache.set(id, { story, fetchedAt: Date.now() });
    return story;
  } catch {
    return null;
  }
}

export async function fetchFeedStories(
  feed: FeedType,
  page = 1,
  pageSize = 15
): Promise<HNStory[]> {
  if (feed === 'saved') return [];
  const endpoint = FEED_ENDPOINTS[feed];
  const cachedIds = feedIdsCache.get(endpoint);
  let ids: number[];

  if (cachedIds && Date.now() - cachedIds.fetchedAt < FEED_IDS_TTL_MS && page > 1) {
    ids = cachedIds.ids;
  } else {
    const res = await fetch(`${FIREBASE_BASE}/${endpoint}.json`);
    if (!res.ok) throw new Error(`Failed to fetch ${feed} feed`);
    ids = await res.json();
    feedIdsCache.set(endpoint, { ids, fetchedAt: Date.now() });
  }

  const slice = ids.slice((page - 1) * pageSize, page * pageSize);
  const stories = await Promise.all(slice.map((id) => fetchStoryItem(id)));
  return stories.filter((s): s is HNStory => s !== null);
}

export async function fetchStoryWithComments(storyId: number): Promise<HNStoryWithComments> {
  const res = await fetch(`${ALGOLIA_BASE}/items/${storyId}`);
  if (res.ok) {
    const data = await res.json();

    // If the linked HN item is a comment with a parent story_id, load the root story
    // or present the comment thread cleanly if root story fetch is unavailable.
    if (data.type === 'comment' && data.story_id && Number(data.story_id) !== storyId) {
      try {
        const rootRes = await fetch(`${ALGOLIA_BASE}/items/${data.story_id}`);
        if (rootRes.ok) {
          const rootData = await rootRes.json();
          const { cleanTitle, badges } = parseTitleAndBadges(
            rootData.title || `Story #${data.story_id}`,
            rootData.url
          );
          const comments = normalizeAlgoliaCommentTree(rootData.children || []);
          return {
            id: rootData.id,
            title: rootData.title || `Story #${data.story_id}`,
            cleanTitle,
            url: rootData.url || undefined,
            domain: extractDomain(rootData.url),
            text: rootData.text || undefined,
            points: rootData.points ?? 0,
            user: rootData.author || 'anonymous',
            time: rootData.created_at_i || Math.floor(Date.now() / 1000),
            commentsCount: comments.reduce((acc, c) => acc + 1 + c.totalDescendants, 0),
            badges,
            type: rootData.type === 'job' ? 'job' : 'story',
            comments,
          };
        }
      } catch {
        // Fall through to rendering the comment node directly as a thread
      }
    }

    const fallbackTitle =
      data.title ||
      (data.type === 'comment'
        ? `Comment by ${data.author || 'anonymous'} (#${data.id})`
        : `Story #${data.id}`);
    const { cleanTitle, badges } = parseTitleAndBadges(fallbackTitle, data.url);
    const comments = normalizeAlgoliaCommentTree(data.children || []);
    return {
      id: data.id,
      title: fallbackTitle,
      cleanTitle,
      url: data.url || undefined,
      domain: extractDomain(data.url),
      text: data.text || undefined,
      points: data.points ?? 0,
      user: data.author || 'anonymous',
      time: data.created_at_i || Math.floor(Date.now() / 1000),
      commentsCount: comments.reduce((acc, c) => acc + 1 + c.totalDescendants, 0),
      badges,
      type: data.type === 'job' ? 'job' : 'story',
      comments,
    };
  }

  const fallbackStory = await fetchStoryItem(storyId);
  if (!fallbackStory) {
    throw new Error(`Story #${storyId} could not be loaded`);
  }
  return { ...fallbackStory, comments: [] };
}

interface AlgoliaHit {
  objectID: string;
  title?: string;
  story_title?: string;
  url?: string;
  story_url?: string;
  story_text?: string;
  points?: number;
  author?: string;
  created_at_i?: number;
  num_comments?: number;
}

function mapHitToStory(hit: AlgoliaHit): HNStory {
  const rawTitle = hit.title || hit.story_title || 'Untitled';
  const url = hit.url || hit.story_url || undefined;
  const { cleanTitle, badges } = parseTitleAndBadges(rawTitle, url);
  return {
    id: Number(hit.objectID),
    title: rawTitle,
    cleanTitle,
    url,
    domain: extractDomain(url),
    text: hit.story_text || undefined,
    points: hit.points ?? 0,
    user: hit.author || 'anonymous',
    time: hit.created_at_i || Math.floor(Date.now() / 1000),
    commentsCount: hit.num_comments ?? 0,
    badges,
    type: 'story',
  };
}

export async function searchHN(params: {
  query: string;
  tags?: string;
  sortBy?: 'relevance' | 'date';
  numericFilters?: string;
}): Promise<HNStory[]> {
  const endpoint = params.sortBy === 'date' ? 'search_by_date' : 'search';
  const url = new URL(`${ALGOLIA_BASE}/${endpoint}`);
  url.searchParams.set('query', params.query);
  url.searchParams.set('tags', params.tags || 'story');
  url.searchParams.set('hitsPerPage', '35');
  if (params.numericFilters) {
    url.searchParams.set('numericFilters', params.numericFilters);
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Algolia search failed');
  const data = await res.json();
  return (data.hits || []).map(mapHitToStory);
}

export async function fetchTimeTravelStories(
  startTimestampSec: number,
  endTimestampSec: number
): Promise<HNStory[]> {
  return searchHN({
    query: '',
    tags: 'story',
    sortBy: 'relevance',
    numericFilters: `created_at_i>${startTimestampSec},created_at_i<${endTimestampSec}`,
  });
}
