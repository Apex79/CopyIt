import { Calendar, FileType, CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Document } from '../../types';

interface DocumentHeaderProps {
  document: Document;
  action?: ReactNode;
}

export function DocumentHeader({ document, action }: DocumentHeaderProps) {
  const updatedDate = new Date(document.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const updatedTime = new Date(document.updated_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100 tracking-tight leading-tight">
            {document.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3.5 mt-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E1F3E9] text-[#176B48] border border-[#22A06B]/20 dark:bg-[#176B48]/25 dark:text-[#5cb98e]">
              <CheckCircle2 size={12} />
              <span>Published Document</span>
            </span>

            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-surface-500 dark:text-surface-400">
              <Calendar size={14} className="text-[#22A06B]" />
              <span>
                Updated {updatedDate} at {updatedTime}
              </span>
            </div>

            {document.file_type && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-surface-500 dark:text-surface-400">
                <FileType size={14} />
                <span className="uppercase">{document.file_type}</span>
              </div>
            )}
          </div>
        </div>

        {action && (
          <div className="flex-shrink-0 pt-2 sm:pt-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
