import DOMPurify from 'dompurify';

const HN_ITEM_REGEX = /^https?:\/\/news\.ycombinator\.com\/item\?id=(\d+)/i;

export function formatCommentHtml(rawHtml: string): string {
  if (!rawHtml) return '';

  const clean = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'p',
      'a',
      'i',
      'em',
      'b',
      'strong',
      'pre',
      'code',
      'ul',
      'ol',
      'li',
      'blockquote',
      'br',
    ],
    ALLOWED_ATTR: ['href', 'rel', 'target'],
  });

  return clean.replace(
    /<a\s+([^>]*?)href="([^"]+)"([^>]*)>(.*?)<\/a>/gi,
    (_match, pre, href, post, innerText) => {
      const decodedHref = href.replace(/&amp;/g, '&');
      const hnMatch = decodedHref.match(HN_ITEM_REGEX);

      if (hnMatch) {
        const itemId = hnMatch[1];
        return `<a href="?story=${itemId}" data-hn-item-id="${itemId}" class="hn-internal-link"><span class="material-symbols-rounded hn-link-icon">forum</span>HN #${itemId}</a>`;
      }

      return `<a ${pre}href="${decodedHref}" target="_blank" rel="noopener noreferrer" class="hn-external-link"${post}>${innerText}<span class="material-symbols-rounded hn-link-icon">north_east</span></a>`;
    }
  );
}
