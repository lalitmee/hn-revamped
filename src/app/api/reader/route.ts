import { NextRequest, NextResponse } from 'next/server';
import {
  detectSpecialUrlFallback,
  extractArticleFromHtml,
} from '@/lib/reader-extractor';

export const maxDuration = 10;

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
  'CDN-Cache-Control': 'public, s-maxage=86400',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=86400',
};

const ERROR_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  'CDN-Cache-Control': 'public, s-maxage=3600',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
};

function isSafePublicUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
      return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.endsWith('.local')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get('url');
  if (!targetUrl || !isSafePublicUrl(targetUrl)) {
    return NextResponse.json(
      { error: 'Invalid or unsupported URL' },
      { status: 400 }
    );
  }

  const special = detectSpecialUrlFallback(targetUrl);
  if (special) {
    return NextResponse.json(special, { headers: CACHE_HEADERS });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7500);

  try {
    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HNRevampedReader/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        {
          url: targetUrl,
          title: targetUrl,
          contentHtml: '',
          textContent: '',
          readingTimeMinutes: 1,
          fallbackType: 'blocked',
        },
        { headers: ERROR_CACHE_HEADERS }
      );
    }

    const html = await res.text();
    const article = extractArticleFromHtml(html, targetUrl);
    return NextResponse.json(article, { headers: CACHE_HEADERS });
  } catch {
    clearTimeout(timeout);
    return NextResponse.json(
      {
        url: targetUrl,
        title: targetUrl,
        contentHtml: '',
        textContent: '',
        readingTimeMinutes: 1,
        fallbackType: 'blocked',
      },
      { headers: ERROR_CACHE_HEADERS }
    );
  }
}
