'use client';

import React, { useEffect, useState } from 'react';
import { ReaderArticle } from '@/types/hn';

interface ArticleReaderViewProps {
  url?: string;
  storyTitle: string;
}

export const ArticleReaderView: React.FC<ArticleReaderViewProps> = ({ url, storyTitle }) => {
  const [article, setArticle] = useState<ReaderArticle | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) return;
    let active = true;
    setLoading(true);
    fetch(`/api/reader?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          setArticle(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setArticle({
            url,
            title: storyTitle,
            contentHtml: '',
            textContent: '',
            readingTimeMinutes: 1,
            fallbackType: 'blocked',
          });
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [url, storyTitle]);

  if (!url) {
    return (
      <div
        style={{ color: 'var(--text-muted)' }}
        className="py-16 text-center flex flex-col items-center gap-2"
      >
        <span className="material-symbols-rounded text-[36px]">forum</span>
        <p>This is a text-only Hacker News discussion without an external URL.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 py-6">
        <div
          style={{ backgroundColor: 'var(--bg-surface-2)' }}
          className="h-8 w-2/3 rounded-xl animate-pulse"
        />
        <div
          style={{ backgroundColor: 'var(--bg-surface-1)' }}
          className="h-64 w-full rounded-2xl animate-pulse"
        />
      </div>
    );
  }

  if (article?.fallbackType === 'youtube' && article.youtubeVideoId) {
    return (
      <div className="py-4">
        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${article.youtubeVideoId}`}
            title={storyTitle}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  if (!article || article.fallbackType || !article.contentHtml) {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-surface-1)',
          borderColor: 'var(--border-subtle)',
        }}
        className="p-8 rounded-2xl border text-center flex flex-col items-center gap-4 my-4"
      >
        <span
          style={{ color: 'var(--accent)' }}
          className="material-symbols-rounded text-[40px]"
        >
          open_in_new
        </span>
        <div>
          <h4 className="text-lg font-semibold mb-1">{storyTitle}</h4>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm max-w-md">
            This resource ({article?.fallbackType?.toUpperCase() || 'External Site'}) is best
            viewed directly in its original tab.
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm shadow hover:brightness-110 transition"
        >
          <span>Open Original Article</span>
          <span className="material-symbols-rounded text-[18px]">north_east</span>
        </a>
      </div>
    );
  }

  return (
    <article
      style={{
        backgroundColor: 'var(--bg-surface-1)',
        borderColor: 'var(--border-subtle)',
      }}
      className="p-6 md:p-8 rounded-2xl border my-2"
    >
      <div
        style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}
        className="flex flex-wrap items-center gap-4 text-xs pb-4 mb-6 border-b"
      >
        <span className="inline-flex items-center gap-1">
          <span className="material-symbols-rounded text-[16px]">schedule</span>
          {article.readingTimeMinutes} min read
        </span>
        {article.byline && <span>By {article.byline}</span>}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--link-unvisited)' }}
          className="ml-auto inline-flex items-center gap-1 font-semibold"
        >
          Original URL
          <span className="material-symbols-rounded text-[15px]">north_east</span>
        </a>
      </div>

      <div
        className="hn-prose hn-article-body space-y-4"
        dangerouslySetInnerHTML={{ __html: article.contentHtml }}
      />
    </article>
  );
};
