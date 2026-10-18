import { useEffect, useCallback } from 'react';
import { Keyboard, X, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  const isMac = typeof window !== 'undefined' && (
    /Mac|iPod|iPhone|iPad/.test(navigator.platform || '') ||
    /Macintosh|Mac OS X/.test(navigator.userAgent || '')
  );

  const modKey = isMac ? '⌘' : 'Ctrl';

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  const shortcutGroups = [
    {
      title: 'Global & Navigation',
      items: [
        {
          keys: [`${modKey}`, 'K'],
          description: 'Open Command Palette & Search',
        },
        {
          keys: ['?'],
          description: 'Open this Keyboard Shortcuts Guide',
        },
        {
          keys: ['Esc'],
          description: 'Close modals, drawers, or dialogs',
        },
      ],
    },
    {
      title: 'Documents & Publishing',
      items: [
        {
          keys: [`${modKey}`, 'N'],
          description: 'Create new rich document in editor',
        },
        {
          keys: [`${modKey}`, 'U'],
          description: 'Upload new document (PDF, DOCX, TXT)',
        },
      ],
    },
    {
      title: 'Private Files Vault',
      items: [
        {
          keys: [`${modKey}`, 'V'],
          description: 'Paste clipboard file/screenshot to upload instantly',
        },
        {
          keys: ['Drag & Drop'],
          description: 'Drop files anywhere in the vault to upload',
        },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#131E18] rounded-2xl shadow-2xl border border-[#DCE8E0] dark:border-white/10 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DCE8E0] dark:border-white/10 bg-[#FAFCFB] dark:bg-[#111A15]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E1F3E9] dark:bg-[#176B48]/20 flex items-center justify-center text-[#22A06B] dark:text-[#52C58F] shadow-xs">
              <Keyboard size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-surface-900 dark:text-surface-100">
                Keyboard Shortcuts
              </h3>
              <p className="text-[11px] text-surface-500 dark:text-surface-400">
                Productivity shortcuts available in CopyIt
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 p-1.5 rounded-lg transition-colors cursor-pointer"
            aria-label="Close shortcuts modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 px-1">
                {group.title}
              </h4>
              <div className="space-y-1.5">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800/60"
                  >
                    <span className="text-xs text-surface-700 dark:text-surface-300">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {item.keys.map((k, ki) => (
                        <kbd
                          key={ki}
                          className="px-2 py-0.5 text-xs font-mono font-medium rounded-md bg-white dark:bg-surface-700 text-surface-800 dark:text-surface-200 border border-surface-200 dark:border-surface-600 shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#DCE8E0] dark:border-white/10 bg-[#FAFCFB] dark:bg-[#111A15] flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Command size={12} className="text-[#22A06B]" />
            <span>Works in all modern browsers</span>
          </span>
          <button
            onClick={onClose}
            className="macos-btn-secondary text-xs py-1 px-3 rounded-lg cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
