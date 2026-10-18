import { useNavigate } from 'react-router-dom';
import { Upload, Type, ArrowUpRight, Sparkles } from 'lucide-react';

interface QuickActionsProps {
  onOpenCommandPalette?: () => void;
}

export function QuickActions({ onOpenCommandPalette }: QuickActionsProps) {
  const navigate = useNavigate();

  const isMac = typeof window !== 'undefined' && (
    /Mac|iPod|iPhone|iPad/.test(navigator.platform || '') ||
    /Macintosh|Mac OS X/.test(navigator.userAgent || '')
  );

  const actions = [
    {
      id: 'upload-doc',
      title: 'Upload Document',
      description: 'Import PDF, DOCX, ODT, TXT, or Markdown',
      icon: Upload,
      shortcut: isMac ? '⌘U' : 'Ctrl+U',
      badge: 'Publish',
      onClick: () => navigate('/admin-panel/documents/new?mode=upload'),
    },
    {
      id: 'write-doc',
      title: 'Write or Paste Content',
      description: 'Rich editor with markdown, code & table support',
      icon: Type,
      shortcut: isMac ? '⌘N' : 'Ctrl+N',
      badge: 'Editor',
      onClick: () => navigate('/admin-panel/documents/new?mode=paste'),
    },
  ];

  return (
    <div className="space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div>
          <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <Sparkles size={16} className="text-[#22A06B]" />
            <span>Quick Actions</span>
          </h2>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Publish or draft new content for your public vault
          </p>
        </div>

        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 dark:bg-surface-800/60 border border-[#DCE8E0] dark:border-white/10 text-xs text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:border-[#22A06B]/40 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-surface-100 dark:bg-surface-700 rounded font-semibold text-surface-700 dark:text-surface-300">
              {isMac ? '⌘K' : 'Ctrl+K'}
            </kbd>
            <span>for command palette</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className="macos-card p-5 sm:p-6 text-left group hover:shadow-md transition-all cursor-pointer border border-[#DCE8E0] dark:border-[rgba(220,232,224,0.12)] hover:border-[#22A06B]/50 hover:bg-white/95 dark:hover:bg-surface-900/95 relative overflow-hidden flex flex-col justify-between"
            >
              {/* Top row with icon & shortcut/badge */}
              <div className="flex items-center justify-between gap-2 mb-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#E1F3E9] dark:bg-[#176B48]/20 flex items-center justify-center text-[#22A06B] dark:text-[#52C58F] group-hover:scale-105 transition-transform shadow-xs">
                  <Icon size={20} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FAFCFB] dark:bg-surface-800 text-surface-500 dark:text-surface-400 border border-surface-200 dark:border-surface-700">
                    {action.badge}
                  </span>
                  <ArrowUpRight
                    size={15}
                    className="text-surface-400 group-hover:text-[#22A06B] dark:group-hover:text-[#52C58F] transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </div>
              </div>

              {/* Title & description */}
              <div>
                <h3 className="font-semibold text-base text-surface-900 dark:text-surface-100 group-hover:text-[#167A50] dark:group-hover:text-[#52C58F] transition-colors">
                  {action.title}
                </h3>
                <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-1 leading-relaxed">
                  {action.description}
                </p>
              </div>

              {/* Bottom shortcut indicator */}
              <div className="mt-4 pt-3 border-t border-surface-100 dark:border-surface-800/60 flex items-center justify-between text-xs text-surface-400 dark:text-surface-500">
                <span className="text-[10px] uppercase font-mono tracking-wider">Keyboard Shortcut</span>
                <kbd className="px-2 py-0.5 text-xs font-mono bg-surface-100 dark:bg-surface-800 rounded font-medium text-surface-600 dark:text-surface-400">
                  {action.shortcut}
                </kbd>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
