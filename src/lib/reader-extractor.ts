import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
import DOMPurify from 'isomorphic-dompurify';
import { ReaderArticle } from '@/types/hn';

export function detectSpecialUrlFallback(url: string): Partial<ReaderArticle> | null {
  try {
    const parsed = new URL(url);

    if (/\.pdf($|\?)/i.test(parsed.pathname)) {
      return {
        url,
        title: parsed.pathname.split('/').pop() || 'PDF Document',
        fallbackType: 'pdf',
        contentHtml: '',
        textContent: '',
        readingTimeMinutes: 1,
      };
    }

    if (parsed.hostname.includes('youtube.com') || parsed.hostname === 'youtu.be') {
      const videoId =
        parsed.hostname === 'youtu.be'
          ? parsed.pathname.slice(1)
          : parsed.searchParams.get('v');
      if (videoId) {
        return {
          url,
          title: 'YouTube Video',
          fallbackType: 'youtube',
          youtubeVideoId: videoId,
          contentHtml: '',
          textContent: '',
          readingTimeMinutes: 1,
        };
      }
    }

    if (parsed.hostname === 'github.com') {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return {
          url,
          title: `${parts[0]}/${parts[1]}`,
          fallbackType: 'github',
          githubRepo: { owner: parts[0], repo: parts[1] },
          contentHtml: '',
          textContent: '',
          readingTimeMinutes: 1,
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function extractArticleFromHtml(rawHtml: string, url: string): ReaderArticle {
  const { document } = parseHTML(rawHtml);

  // Resolve relative links and images
  const baseElements = document.querySelectorAll('a[href], img[src]');
  baseElements.forEach((el: Element) => {
    const href = el.getAttribute('href');
    if (href && !href.startsWith('#')) {
      try {
        el.setAttribute('href', new URL(href, url).toString());
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      } catch {
        // leave as is
      }
    }
    const src = el.getAttribute('src');
    if (src) {
      try {
        el.setAttribute('src', new URL(src, url).toString());
      } catch {
        // leave as is
      }
    }
  });

  const reader = new Readability(document as unknown as Document);
  const parsed = reader.parse();

  if (!parsed || !parsed.content) {
    return {
      url,
      title: document.title || url,
      contentHtml: '',
      textContent: '',
      readingTimeMinutes: 1,
      fallbackType: 'blocked',
    };
  }

  const sanitizedHtml = DOMPurify.sanitize(parsed.content, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li',
      'blockquote', 'pre', 'code', 'img', 'figure', 'figcaption',
      'strong', 'em', 'b', 'i', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'br'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel'],
  });

  const wordCount = (parsed.textContent || '').trim().split(/\s+/).filter(Boolean).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 220));

  return {
    url,
    title: parsed.title || document.title || url,
    byline: parsed.byline || null,
    siteName: parsed.siteName || null,
    contentHtml: sanitizedHtml,
    textContent: parsed.textContent || '',
    excerpt: parsed.excerpt || null,
    readingTimeMinutes,
  };
}
