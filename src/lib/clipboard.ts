/**
 * Copy content to clipboard with both HTML and plain text formats
 */
export async function copyToClipboard(
  htmlContent: string,
  plainTextContent: string
): Promise<boolean> {
  // Normalize non-breaking spaces to standard spaces in plain text
  const cleanPlainText = plainTextContent.replace(/\u00a0/g, ' ');

  try {
    // Try the Clipboard API with ClipboardItem for rich content
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const textBlob = new Blob([cleanPlainText], { type: 'text/plain' });

      const clipboardItem = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      });

      await navigator.clipboard.write([clipboardItem]);
      return true;
    }

    // Fallback: try plain text copy via Clipboard API
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(cleanPlainText);
      return true;
    }

    // Fallback: use execCommand
    return fallbackCopy(cleanPlainText);
  } catch (error) {
    console.warn('Clipboard API failed, trying fallback:', error);

    // Try fallback
    try {
      return fallbackCopy(cleanPlainText);
    } catch {
      return false;
    }
  }
}

/**
 * Fallback copy using execCommand
 */
function fallbackCopy(text: string): boolean {
  const textArea = document.createElement('textarea');
  textArea.value = text;

  // Make it invisible
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  textArea.style.top = '-9999px';
  textArea.style.opacity = '0';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  let success = false;
  try {
    success = document.execCommand('copy');
  } finally {
    document.body.removeChild(textArea);
  }

  return success;
}

export function htmlToPlainText(html: string): string {
  if (!html) return '';

  if (typeof document === 'undefined') {
    // Fallback for SSR or non-browser test environments
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, code) => '\n\n' + code.replace(/<[^>]+>/g, '') + '\n\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/<[^>]+>/g, '')
      .replace(/\u00a0/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  const div = document.createElement('div');
  div.innerHTML = html;

  const rawText = convertNodeToText(div);
  // Normalize non-breaking spaces and excessive consecutive newlines (max 2)
  return rawText
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function convertNodeToText(node: Node): string {
  let result = '';

  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      result += child.textContent || '';
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();

      switch (tag) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          result += ensureDoubleNewline(result) + convertNodeToText(el).trim() + '\n\n';
          break;

        case 'p': {
          const pText = convertNodeToText(el);
          if (pText.trim().length === 0) {
            result += '\n';
          } else {
            result += ensureNewline(result) + pText + '\n';
          }
          break;
        }

        case 'br':
          result += '\n';
          break;

        case 'hr':
          result += ensureDoubleNewline(result) + '---\n\n';
          break;

        case 'li':
          result += ensureNewline(result) + '• ' + convertNodeToText(el).trim() + '\n';
          break;

        case 'ol': {
          const items = el.querySelectorAll(':scope > li');
          result += ensureNewline(result);
          items.forEach((item, i) => {
            result += `${i + 1}. ${convertNodeToText(item).trim()}\n`;
          });
          result += '\n';
          break;
        }

        case 'ul':
          result += ensureNewline(result) + convertNodeToText(el) + '\n';
          break;

        case 'table':
          result += ensureDoubleNewline(result) + convertTableToText(el) + '\n\n';
          break;

        case 'pre': {
          // Preserve code block text exactly as formatted (including indentation and line breaks)
          const codeText = (el.textContent || '').replace(/\r\n/g, '\n');
          result += ensureDoubleNewline(result) + codeText + '\n\n';
          break;
        }

        case 'code':
          // Inline code - keep inline text without artificial line breaks or fences
          result += el.textContent || '';
          break;

        case 'blockquote':
          result += ensureNewline(result) + '> ' + convertNodeToText(el).trim().replace(/\n/g, '\n> ') + '\n';
          break;

        case 'strong':
        case 'b':
        case 'em':
        case 'i':
        case 'u':
        case 's':
        case 'span':
        case 'a':
        default:
          result += convertNodeToText(el);
          break;
      }
    }
  }

  return result;
}

function ensureNewline(str: string): string {
  if (!str || str.endsWith('\n')) return '';
  return '\n';
}

function ensureDoubleNewline(str: string): string {
  if (!str) return '';
  if (str.endsWith('\n\n')) return '';
  if (str.endsWith('\n')) return '\n';
  return '\n\n';
}

function convertTableToText(table: HTMLElement): string {
  const rows = table.querySelectorAll('tr');
  if (rows.length === 0) return '';

  const tableData: string[][] = [];
  const colWidths: number[] = [];

  rows.forEach((row) => {
    const cells = row.querySelectorAll('th, td');
    const rowData: string[] = [];
    cells.forEach((cell, i) => {
      const text = (cell.textContent || '').trim();
      rowData.push(text);
      colWidths[i] = Math.max(colWidths[i] || 0, text.length);
    });
    tableData.push(rowData);
  });

  let result = '';
  tableData.forEach((row, rowIndex) => {
    result += row.map((cell, i) => cell.padEnd(colWidths[i] || 0)).join(' | ') + '\n';
    if (rowIndex === 0) {
      result += colWidths.map((w) => '-'.repeat(w)).join('-+-') + '\n';
    }
  });

  return result;
}
