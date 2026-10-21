import { NextRequest, NextResponse } from 'next/server';
import { detectSpecialUrlFallback, extractArticleFromHtml } from '@/lib/reader-extractor';

function isSafePublicUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
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
    return NextResponse.json({ error: 'Invalid or unsupported URL' }, { status: 400 });
  }

  const special = detectSpecialUrlFallback(targetUrl);
  if (special) {
    return NextResponse.json(special);
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
      return NextResponse.json({
        url: targetUrl,
        title: targetUrl,
        contentHtml: '',
        textContent: '',
        readingTimeMinutes: 1,
        fallbackType: 'blocked',
      });
    }

    const html = await res.text();
    const article = extractArticleFromHtml(html, targetUrl);
    return NextResponse.json(article);
  } catch {
    clearTimeout(timeout);
    return NextResponse.json({
      url: targetUrl,
      title: targetUrl,
      contentHtml: '',
      textContent: '',
      readingTimeMinutes: 1,
      fallbackType: 'blocked',
    });
  }
}
