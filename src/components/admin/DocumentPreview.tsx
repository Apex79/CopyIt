import { X, Send, ArrowLeft, Eye } from 'lucide-react';
import { DocumentRenderer } from '../shared/DocumentRenderer';
import { MacosWindowHeader } from '../shared/MacosWindowHeader';
import type { Document } from '../../types';

interface DocumentPreviewProps {
  document: Document | { title: string; content: string; content_type: string };
  onClose: () => void;
  onPublish?: () => void;
  showPublish?: boolean;
  publishing?: boolean;
}

export function DocumentPreview({
  document,
  onClose,
  onPublish,
  showPublish = false,
  publishing = false,
}: DocumentPreviewProps) {
  return (
    <div className="fixed inset-0 z-50 bg-[#EEF6F1] dark:bg-[#0D1612] overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 macos-glass border-b border-[#DCE8E0] dark:border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={onClose}
              className="macos-btn-ghost gap-1.5 text-sm"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to Editor</span>
              <span className="sm:hidden">Back</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22A06B] animate-pulse" />
              <h2 className="text-sm font-medium text-surface-700 dark:text-surface-300">
                Document Preview
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {showPublish && onPublish && (
                <button
                  onClick={onPublish}
                  className="macos-btn-primary text-sm gap-1.5"
                  disabled={publishing}
                >
                  {publishing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Publishing...
                    </span>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Publish Now</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                className="macos-btn-ghost p-2"
                aria-label="Close preview"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview content */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-10 py-8">
        {/* Banner note */}
        <div className="mb-6 flex items-center justify-between gap-4 p-4 rounded-xl bg-white/70 dark:bg-surface-800/60 border border-[#DCE8E0] dark:border-surface-700 text-sm">
          <div className="flex items-center gap-2 text-surface-600 dark:text-surface-300">
            <Eye size={16} className="text-[#22A06B]" />
            <span>This is exactly how public visitors will see the published document.</span>
          </div>
          <span className="hidden sm:inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-[#E1F3E9] text-[#176B48]">
            Interactive Preview
          </span>
        </div>

        {/* macOS Window Document container */}
        <div className="macos-window overflow-hidden animate-fade-in mb-12">
          {/* macOS window header */}
          <MacosWindowHeader
            title="Preview Mode"
            badge={
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E1F3E9] dark:bg-[#176B48]/30 text-[#176B48] dark:text-[#52C58F] border border-[#22A06B]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22A06B]" />
                Ready to Publish
              </span>
            }
          />

          {/* Document metadata section */}
          <div className="px-6 py-6 sm:px-10 sm:py-8 lg:px-14 lg:py-8 border-b border-[#DCE8E0] dark:border-surface-800 bg-white/60 dark:bg-surface-900/30">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50 leading-tight">
              {document.title}
            </h1>
          </div>

          {/* Actual document prose content with comfortable padding */}
          <div className="px-6 py-6 sm:px-10 sm:py-8 lg:px-14 lg:py-10 bg-white dark:bg-surface-900/95">
            <DocumentRenderer
              content={document.content}
              contentType={document.content_type}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

