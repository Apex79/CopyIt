import { FileText, BookOpen } from 'lucide-react';
import { MacosWindowHeader } from '../shared/MacosWindowHeader';

export function EmptyState() {
  return (
    <div className="macos-window max-w-xl mx-auto animate-fade-in">
      <MacosWindowHeader title="CopyIt — Document Viewer" />
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#E1F3E9] dark:bg-[#176B48]/20 flex items-center justify-center mb-5 border border-[#22A06B]/20">
          <FileText size={28} className="text-[#22A06B]" />
        </div>

        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2 tracking-tight">
          No document published yet
        </h2>

        <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm leading-relaxed">
          The administrator has not published a document yet. Please check back shortly.
        </p>

        <div className="mt-8 flex items-center gap-2 text-xs text-surface-400 dark:text-surface-500">
          <BookOpen size={14} />
          <span>CopyIt Document Platform</span>
        </div>
      </div>
    </div>
  );
}
