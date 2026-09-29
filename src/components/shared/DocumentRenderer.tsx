import { useMemo } from 'react';
import { renderDocumentContent } from '../../lib/sanitizer';

interface DocumentRendererProps {
  content: string | null | undefined;
  contentType?: string;
  className?: string;
}

/**
 * Single source of truth for document content rendering across the application.
 * Used by both public DocumentViewer and admin DocumentPreview.
 */
export function DocumentRenderer({
  content,
  contentType = 'html',
  className = '',
}: DocumentRendererProps) {
  const renderedHtml = useMemo(
    () => renderDocumentContent(content, contentType),
    [content, contentType]
  );

  return (
    <div
      className={`document-prose ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}
