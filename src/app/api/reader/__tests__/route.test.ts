import { afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, maxDuration } from '../route';

vi.mock('@/lib/reader-extractor', () => ({
  detectSpecialUrlFallback: () => null,
  extractArticleFromHtml: (html: string) => ({
    url: 'https://example.com/article',
    title: 'Article',
    contentHtml: html,
    textContent: html,
    readingTimeMinutes: 1,
    ...(html ? {} : { fallbackType: 'blocked' }),
  }),
}));

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function request() {
  return new NextRequest(
    'https://app.example/api/reader?url=https%3A%2F%2Fexample.com%2Farticle'
  );
}

it.each([
  [
    '<p>Article content</p>',
    'public, s-maxage=86400, stale-while-revalidate=604800',
  ],
  ['', 'public, s-maxage=3600, stale-while-revalidate=86400'],
])(
  'uses the appropriate cache duration for extraction result %s',
  async (html, cacheControl) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, text: async () => html }))
    );
    const response = await GET(request());
    expect(response.headers.get('Cache-Control')).toBe(cacheControl);
    expect(response.headers.get('CDN-Cache-Control')).toBeTruthy();
    expect(response.headers.get('Vercel-CDN-Cache-Control')).toBeTruthy();
    expect(maxDuration).toBe(10);
  }
);

it('keeps the timeout active until the response body finishes', async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url, options) => ({
      ok: true,
      text: () =>
        new Promise((_resolve, reject) =>
          options.signal.addEventListener('abort', () =>
            reject(new Error('Timed out'))
          )
        ),
    }))
  );
  const responsePromise = GET(request());
  await vi.advanceTimersByTimeAsync(7500);
  const response = await responsePromise;
  expect((await response.json()).fallbackType).toBe('blocked');
  expect(vi.getTimerCount()).toBe(0);
});
