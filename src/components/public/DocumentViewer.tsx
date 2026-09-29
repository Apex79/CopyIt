import { MacosWindowHeader } from '../shared/MacosWindowHeader';
import { DocumentHeader } from './DocumentHeader';
import { DocumentRenderer } from '../shared/DocumentRenderer';
import { CopyButton } from './CopyButton';
import type { Document } from '../../types';

interface DocumentViewerProps {
  document: Document;
}

export function DocumentViewer({ document }: DocumentViewerProps) {
  return (
    <div className="macos-window animate-fade-in" id="document-viewer">
      {/* Decorative macOS Window Header with Traffic Lights */}
      <MacosWindowHeader
        title={document.title}
        badge={
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium text-[#176B48] dark:text-[#5cb98e] bg-[#E1F3E9] dark:bg-[#176B48]/25 border border-[#22A06B]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22A06B] inline-block animate-pulse" />
            Published Document
          </span>
        }
      />

      {/* Window Content Top: Document Title, Metadata & Primary Copy Button */}
      <div className="px-6 py-6 sm:px-10 sm:py-8 lg:px-14 lg:py-8 border-b border-[#DCE8E0] dark:border-[rgba(220,232,224,0.1)] bg-[#FAFCFB] dark:bg-[#111A15]">
        <DocumentHeader
          document={document}
          action={<CopyButton htmlContent={document.content || ''} />}
        />
      </div>

      {/* Document Content with comfortable, spacious reading margins (not squeezed) */}
      <div className="px-6 py-6 sm:px-10 sm:py-8 lg:px-14 lg:py-10 bg-white dark:bg-[#131E18]">
        <DocumentRenderer
          content={document.content}
          contentType={document.content_type}
        />
      </div>

      {/* Subtle bottom window footer with secondary copy button */}
      <div className="px-6 py-4 sm:px-10 lg:px-14 border-t border-[#DCE8E0] dark:border-[rgba(220,232,224,0.1)] bg-[#FAFCFB] dark:bg-[#111A15] flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs text-surface-500 dark:text-surface-400">
          End of document
        </span>
        <CopyButton htmlContent={document.content || ''} />
      </div>
    </div>
  );
}
