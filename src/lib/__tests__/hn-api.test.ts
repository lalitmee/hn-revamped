import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  extractDomain,
  parseTitleAndBadges,
  normalizeAlgoliaCommentTree,
  fetchStoryWithComments,
} from '../hn-api';
import { formatCommentHtml } from '../html-sanitizer';

afterEach(() => vi.unstubAllGlobals());

describe('HN API Utilities & Sanitizer', () => {
  it('uses the HN reported total rather than the smaller indexed comment tree', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => ({
        ok: true,
        json: async () =>
          url.includes('firebaseio.com')
            ? {
                id: 987654,
                title: 'Count test',
                descendants: 512,
                type: 'story',
              }
            : {
                id: 987654,
                title: 'Count test',
                type: 'story',
                children: [
                  {
                    id: 987655,
                    author: 'user',
                    text: '<p>A visible comment</p>',
                    children: [],
                  },
                ],
              },
      }))
    );
    const story = await fetchStoryWithComments(987654);
    expect(story.commentsCount).toBe(512);
    expect(story.comments).toHaveLength(1);
  });
  it('extracts clean domain names without www.', () => {
    expect(extractDomain('https://www.github.com/zed-industries/zed')).toBe(
      'github.com'
    );
    expect(extractDomain('https://sqlite.org/faster.html')).toBe('sqlite.org');
    expect(extractDomain(undefined)).toBeUndefined();
  });

  it('detects Show HN, Ask HN, PDF, Video, and GitHub badges and cleans title', () => {
    const res1 = parseTitleAndBadges(
      'Show HN: Zed 1.0 – Fast Code Editor [video]',
      'https://github.com/zed-industries/zed'
    );
    expect(res1.cleanTitle).toBe('Zed 1.0 – Fast Code Editor');
    expect(res1.badges.map((b) => b.type)).toEqual(['show', 'video', 'github']);

    const res2 = parseTitleAndBadges(
      'Ask HN: What is your favorite e-ink reader? (pdf)',
      'https://example.com/paper.pdf'
    );
    expect(res2.cleanTitle).toBe('What is your favorite e-ink reader?');
    expect(res2.badges.map((b) => b.type)).toEqual(['ask', 'pdf']);
  });

  it('normalizes nested Algolia comment tree and counts total descendants', () => {
    const rawChildren = [
      {
        id: 101,
        author: 'tptacek',
        created_at_i: 1700000000,
        text: '<p>Great work!</p>',
        children: [
          {
            id: 102,
            author: 'nathansobo',
            created_at_i: 1700000100,
            text: '<p>Thanks!</p>',
            children: [],
          },
        ],
      },
    ];
    const tree = normalizeAlgoliaCommentTree(rawChildren);
    expect(tree).toHaveLength(1);
    expect(tree[0].user).toBe('tptacek');
    expect(tree[0].totalDescendants).toBe(1);
    expect(tree[0].children[0].user).toBe('nathansobo');
  });

  it('rewrites internal HN item URLs and marks external links cleanly', () => {
    const raw =
      '<p>See <a href="https://news.ycombinator.com/item?id=410923">this thread</a> and <a href="https://zed.dev">Zed</a></p>';
    const formatted = formatCommentHtml(raw);
    expect(formatted).toContain('data-hn-item-id="410923"');
    expect(formatted).toContain('class="hn-internal-link"');
    expect(formatted).toContain('class="hn-external-link"');
  });
});
