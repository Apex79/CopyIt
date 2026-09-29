import mammoth from 'mammoth';
import { marked } from 'marked';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { sanitizeDocumentHtml } from './sanitizer';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// Configure marked for safe HTML output
marked.setOptions({
  breaks: true,
  gfm: true,
});

/**
 * Sanitize HTML content to prevent XSS while preserving formatting and code blocks
 */
function sanitizeHtml(html: string): string {
  return sanitizeDocumentHtml(html);
}

/**
 * Process a file and convert it to HTML content
 */
export async function processFile(file: File): Promise<{ content: string; contentType: 'html' | 'markdown' | 'plain_text' }> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  switch (extension) {
    case 'pdf':
      return processPdf(file);
    case 'doc':
    case 'docx':
      return processDocx(file);
    case 'odt':
      return processOdt(file);
    case 'md':
    case 'markdown':
      return processMarkdown(file);
    case 'txt':
      return processText(file);
    default:
      throw new Error(`Unsupported file format: .${extension}`);
  }
}

/**
 * Process PDF file - extract text with structure
 */
async function processPdf(file: File): Promise<{ content: string; contentType: 'html' }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let htmlContent = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    if (pageNum > 1) {
      htmlContent += '<hr class="page-break" />\n';
    }

    let lastY: number | null = null;
    let currentLine = '';
    const lines: string[] = [];

    for (const item of textContent.items) {
      if (!('str' in item)) continue;
      const textItem = item as { str: string; transform: number[]; height: number; fontName: string };

      const y = Math.round(textItem.transform[5]);

      if (lastY !== null && Math.abs(y - lastY) > 2) {
        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }
        currentLine = textItem.str;
      } else {
        currentLine += textItem.str;
      }
      lastY = y;
    }

    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    // Convert lines to HTML with basic structure detection
    for (const line of lines) {
      if (!line) {
        htmlContent += '<br />\n';
        continue;
      }

      // Detect headings (all caps or short bold-looking lines)
      if (line === line.toUpperCase() && line.length < 80 && line.length > 2 && /[A-Z]/.test(line)) {
        htmlContent += `<h2>${escapeHtml(line)}</h2>\n`;
      }
      // Detect numbered items
      else if (/^\d+[\.\)]\s/.test(line)) {
        htmlContent += `<p><strong>${escapeHtml(line.match(/^\d+[\.\)]\s/)![0])}</strong>${escapeHtml(line.replace(/^\d+[\.\)]\s/, ''))}</p>\n`;
      }
      // Detect lettered items
      else if (/^[a-z][\.\)]\s/i.test(line)) {
        htmlContent += `<p style="margin-left: 1.5em;">${escapeHtml(line)}</p>\n`;
      }
      // Regular paragraph
      else {
        htmlContent += `<p>${escapeHtml(line)}</p>\n`;
      }
    }
  }

  return {
    content: sanitizeHtml(htmlContent),
    contentType: 'html',
  };
}

/**
 * Process DOCX file - convert to HTML with formatting
 */
async function processDocx(file: File): Promise<{ content: string; contentType: 'html' }> {
  const arrayBuffer = await file.arrayBuffer();

  const result = await mammoth.convertToHtml({ arrayBuffer }, {
    styleMap: [
      "p[style-name='Heading 1'] => h1:fresh",
      "p[style-name='Heading 2'] => h2:fresh",
      "p[style-name='Heading 3'] => h3:fresh",
      "p[style-name='Heading 4'] => h4:fresh",
      "p[style-name='Title'] => h1.document-title:fresh",
      "p[style-name='Subtitle'] => h2.document-subtitle:fresh",
      "b => strong",
      "i => em",
      "u => u",
      "strike => s",
    ],
  });

  if (result.messages.length > 0) {
    console.warn('DOCX conversion warnings:', result.messages);
  }

  return {
    content: sanitizeHtml(result.value),
    contentType: 'html',
  };
}

/**
 * Process ODT file - parse OpenDocument XML
 */
async function processOdt(file: File): Promise<{ content: string; contentType: 'html' }> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const contentXml = await zip.file('content.xml')?.async('string');
  if (!contentXml) {
    throw new Error('Invalid ODT file: missing content.xml');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(contentXml, 'application/xml');

  let html = '';

  // Process text:p elements
  const body = doc.getElementsByTagNameNS('urn:oasis:names:tc:opendocument:xmlns:office:1.0', 'body')[0];
  if (!body) {
    throw new Error('Invalid ODT file: no body found');
  }

  const textBody = body.getElementsByTagNameNS('urn:oasis:names:tc:opendocument:xmlns:office:1.0', 'text')[0];
  if (!textBody) {
    throw new Error('Invalid ODT file: no text body found');
  }

  function processOdtNode(node: Element): string {
    let result = '';
    const localName = node.localName;

    switch (localName) {
      case 'h': {
        const level = node.getAttribute('text:outline-level') || '1';
        const tag = `h${Math.min(parseInt(level), 6)}`;
        result += `<${tag}>${processOdtChildren(node)}</${tag}>\n`;
        break;
      }
      case 'p': {
        const text = processOdtChildren(node);
        if (text.trim()) {
          result += `<p>${text}</p>\n`;
        } else {
          result += '<br />\n';
        }
        break;
      }
      case 'list': {
        result += '<ul>\n';
        for (const child of Array.from(node.children)) {
          if (child.localName === 'list-item') {
            result += `<li>${processOdtChildren(child)}</li>\n`;
          }
        }
        result += '</ul>\n';
        break;
      }
      case 'table': {
        result += '<table>\n';
        for (const child of Array.from(node.children)) {
          result += processOdtNode(child);
        }
        result += '</table>\n';
        break;
      }
      case 'table-row': {
        result += '<tr>';
        for (const child of Array.from(node.children)) {
          if (child.localName === 'table-cell') {
            result += `<td>${processOdtChildren(child)}</td>`;
          }
        }
        result += '</tr>\n';
        break;
      }
      case 'span': {
        const styleName = node.getAttribute('text:style-name') || '';
        let text = processOdtChildren(node);
        if (styleName.toLowerCase().includes('bold') || styleName.includes('T1')) {
          text = `<strong>${text}</strong>`;
        }
        if (styleName.toLowerCase().includes('italic')) {
          text = `<em>${text}</em>`;
        }
        result += text;
        break;
      }
      case 'a': {
        const href = node.getAttribute('xlink:href') || '#';
        result += `<a href="${escapeHtml(href)}">${processOdtChildren(node)}</a>`;
        break;
      }
      case 'tab':
        result += '&emsp;';
        break;
      case 'line-break':
        result += '<br />';
        break;
      case 's': {
        const count = parseInt(node.getAttribute('text:c') || '1');
        result += '&nbsp;'.repeat(count);
        break;
      }
      default: {
        result += processOdtChildren(node);
        break;
      }
    }

    return result;
  }

  function processOdtChildren(node: Element): string {
    let result = '';
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        result += escapeHtml(child.textContent || '');
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        result += processOdtNode(child as Element);
      }
    }
    return result;
  }

  for (const child of Array.from(textBody.children)) {
    html += processOdtNode(child);
  }

  return {
    content: sanitizeHtml(html),
    contentType: 'html',
  };
}

/**
 * Process Markdown file
 */
async function processMarkdown(file: File): Promise<{ content: string; contentType: 'html' }> {
  const text = await file.text();
  const html = await marked(text);
  return {
    content: sanitizeHtml(html),
    contentType: 'html',
  };
}

/**
 * Process plain text file
 */
async function processText(file: File): Promise<{ content: string; contentType: 'html' }> {
  const text = await file.text();

  // Convert plain text to HTML preserving structure
  const lines = text.split('\n');
  let html = '';
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      html += '<br />\n';
      continue;
    }

    // Detect bullet points
    if (/^[-•*]\s/.test(trimmed)) {
      if (!inList) {
        html += '<ul>\n';
        inList = true;
      }
      html += `<li>${escapeHtml(trimmed.replace(/^[-•*]\s/, ''))}</li>\n`;
      continue;
    }

    if (inList) {
      html += '</ul>\n';
      inList = false;
    }

    // Detect numbered items
    if (/^\d+[\.\)]\s/.test(trimmed)) {
      html += `<p><strong>${escapeHtml(trimmed.match(/^\d+[\.\)]\s/)![0])}</strong>${escapeHtml(trimmed.replace(/^\d+[\.\)]\s/, ''))}</p>\n`;
      continue;
    }

    // Detect headings (all caps, short lines)
    if (trimmed === trimmed.toUpperCase() && trimmed.length < 60 && trimmed.length > 2 && /[A-Z]/.test(trimmed)) {
      html += `<h2>${escapeHtml(trimmed)}</h2>\n`;
      continue;
    }

    html += `<p>${escapeHtml(trimmed)}</p>\n`;
  }

  if (inList) {
    html += '</ul>\n';
  }

  return {
    content: sanitizeHtml(html),
    contentType: 'html',
  };
}

/**
 * Convert Markdown string to HTML
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const html = await marked(markdown);
  return sanitizeHtml(html);
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Get supported file extensions
 */
export function getSupportedExtensions(): string[] {
  return ['pdf', 'doc', 'docx', 'odt', 'txt', 'md'];
}

/**
 * Check if a file is supported
 */
export function isFileSupported(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return getSupportedExtensions().includes(ext);
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
