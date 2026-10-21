import { describe, it, expect } from 'vitest';
import { detectSpecialUrlFallback, extractArticleFromHtml } from '../reader-extractor';

describe('Article Reader View Extractor', () => {
  it('detects YouTube, GitHub repo, and PDF URLs cleanly', () => {
    const yt = detectSpecialUrlFallback('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(yt?.fallbackType).toBe('youtube');
    expect(yt?.youtubeVideoId).toBe('dQw4w9WgXcQ');

    const gh = detectSpecialUrlFallback('https://github.com/zed-industries/zed');
    expect(gh?.fallbackType).toBe('github');
    expect(gh?.githubRepo).toEqual({ owner: 'zed-industries', repo: 'zed' });

    const pdf = detectSpecialUrlFallback('https://sqlite.org/paper.pdf');
    expect(pdf?.fallbackType).toBe('pdf');
  });

  it('extracts clean readable article content and computes reading time from HTML', () => {
    const sampleHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Why SQLite is Fast</title></head>
        <body>
          <nav>Menu Clutter</nav>
          <article>
            <h1>Why SQLite is Fast</h1>
            <p>SQLite runs in-process without network roundtrips, making queries execute in microseconds.</p>
            <p>By avoiding IPC overhead, hundreds of small queries complete faster than a single RPC call.</p>
          </article>
          <script>alert("xss")</script>
        </body>
      </html>
    `;
    const article = extractArticleFromHtml(sampleHtml, 'https://sqlite.org/fast.html');
    expect(article.title).toContain('Why SQLite is Fast');
    expect(article.contentHtml).toContain('without network roundtrips');
    expect(article.contentHtml).not.toContain('<script>');
    expect(article.readingTimeMinutes).toBeGreaterThanOrEqual(1);
  });
});
