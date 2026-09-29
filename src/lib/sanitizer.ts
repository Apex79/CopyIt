import DOMPurify from 'dompurify';
import { marked } from 'marked';

/**
 * Configure marked for predictable parsing
 */
marked.setOptions({
  breaks: true,
  gfm: true,
});

function getSanitizer(): { sanitize: (html: string, options?: any) => string } {
  if (typeof DOMPurify.sanitize === 'function') {
    return DOMPurify;
  }
  if (typeof (DOMPurify as any)?.default?.sanitize === 'function') {
    return (DOMPurify as any).default;
  }
  if (typeof window !== 'undefined') {
    return (DOMPurify as any)(window);
  }
  return {
    sanitize: (html: string) => html,
  };
}

/**
 * Single source of truth for safe HTML sanitization that preserves code blocks,
 * inline code, indentation, tables, lists, formatting tags, classes, and styles.
 */
export function sanitizeDocumentHtml(html: string): string {
  if (!html) return '';

  const purifier = getSanitizer();

  return purifier.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'pre', 'code',
      'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'ul', 'ol', 'li',
      'blockquote',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'col', 'colgroup',
      'a', 'span', 'div', 'img', 'sub', 'sup', 'mark', 'kbd', 'samp', 'var', 'del', 'ins'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel',
      'class', 'style',
      'colspan', 'rowspan', 'scope', 'align', 'valign',
      'src', 'alt', 'title', 'width', 'height',
      'data-*', 'tabindex'
    ],
    ADD_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'code', 'pre', 'span'],
    ADD_ATTR: ['class', 'style', 'target', 'rel', 'colspan', 'rowspan', 'scope'],
    ALLOW_DATA_ATTR: true,
  });
}

/**
 * Render document content to safe HTML preserving structure and whitespace
 */
export function renderDocumentContent(
  content: string | null | undefined,
  contentType: 'html' | 'markdown' | 'plain_text' | string = 'html'
): string {
  if (!content) return '';

  switch (contentType) {
    case 'markdown': {
      const raw = marked.parse(content) as string;
      return sanitizeDocumentHtml(raw);
    }
    case 'plain_text': {
      const escaped = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

      return sanitizeDocumentHtml(`<pre class="plain-text-block"><code>${escaped}</code></pre>`);
    }
    case 'html':
    default:
      return sanitizeDocumentHtml(content);
  }
}
