import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, FileText, Upload, Type, HardDrive,
  Globe, Moon, Sun, HelpCircle, LogOut,
  CornerDownLeft, Sparkles, X,
} from 'lucide-react';
import type { Document } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents?: Document[];
  onPreviewDoc?: (doc: Document) => void;
  onOpenShortcuts?: () => void;
  onTriggerFileUpload?: () => void;
}

interface CommandItemDef {
  id: string;
  title: string;
  description: string;
  category: 'Actions' | 'Navigation' | 'Documents' | 'Preferences';
  icon: typeof FileText;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  documents = [],
  onPreviewDoc,
  onOpenShortcuts,
  onTriggerFileUpload,
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }

  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setSelectedIndex(0);
  }

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Build commands list
  const baseCommands = useMemo<CommandItemDef[]>(() => {
    return [
      {
        id: 'new-doc-upload',
        title: 'Upload Document',
        description: 'Publish a new PDF, DOCX, TXT or Markdown file',
        category: 'Actions',
        icon: Upload,
        shortcut: '⌘U',
        action: () => {
          onOpenChange(false);
          navigate('/admin-panel/documents/new?mode=upload');
        },
      },
      {
        id: 'new-doc-paste',
        title: 'New Rich Document / Paste',
        description: 'Write or paste notes with formatting & tables',
        category: 'Actions',
        icon: Type,
        shortcut: '⌘N',
        action: () => {
          onOpenChange(false);
          navigate('/admin-panel/documents/new?mode=paste');
        },
      },
      {
        id: 'vault-upload',
        title: 'Upload File to Private Vault',
        description: 'Add an arbitrary file (up to 50MB) to secure storage',
        category: 'Actions',
        icon: HardDrive,
        shortcut: '⌘V',
        action: () => {
          onOpenChange(false);
          if (onTriggerFileUpload) {
            onTriggerFileUpload();
          } else {
            const el = window.document.getElementById('private-files-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }
        },
      },
      {
        id: 'nav-dashboard',
        title: 'Dashboard Overview',
        description: 'View document metrics and quick controls',
        category: 'Navigation',
        icon: Sparkles,
        action: () => {
          onOpenChange(false);
          navigate('/admin-panel/dashboard');
        },
      },
      {
        id: 'nav-public',
        title: 'View Public Website',
        description: 'Open the live visitor view with the published document',
        category: 'Navigation',
        icon: Globe,
        action: () => {
          onOpenChange(false);
          navigate('/');
        },
      },
      {
        id: 'nav-vault',
        title: 'Private Files Manager',
        description: 'Browse, download, and manage your private files',
        category: 'Navigation',
        icon: HardDrive,
        action: () => {
          onOpenChange(false);
          const el = window.document.getElementById('private-files-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          } else {
            navigate('/admin-panel/dashboard');
          }
        },
      },
      {
        id: 'pref-theme',
        title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
        description: `Currently in ${theme} mode`,
        category: 'Preferences',
        icon: theme === 'dark' ? Sun : Moon,
        shortcut: '⌘T',
        action: () => {
          onOpenChange(false);
          toggleTheme();
        },
      },
      {
        id: 'pref-shortcuts',
        title: 'Keyboard Shortcuts Help',
        description: 'View all keyboard shortcuts and productivity tips',
        category: 'Preferences',
        icon: HelpCircle,
        shortcut: '?',
        action: () => {
          onOpenChange(false);
          onOpenShortcuts?.();
        },
      },
      {
        id: 'pref-signout',
        title: 'Sign Out',
        description: 'End your current admin session safely',
        category: 'Preferences',
        icon: LogOut,
        action: () => {
          onOpenChange(false);
          signOut();
        },
      },
    ];
  }, [navigate, onOpenChange, onTriggerFileUpload, onOpenShortcuts, signOut, theme, toggleTheme]);

  // Documents commands
  const documentCommands = useMemo<CommandItemDef[]>(() => {
    return documents.map((doc) => ({
      id: `doc-${doc.id}`,
      title: doc.title,
      description: doc.is_published
        ? 'Live on public website · Click to view/edit'
        : `Updated ${new Date(doc.updated_at).toLocaleDateString()} · Click to edit`,
      category: 'Documents',
      icon: FileText,
      action: () => {
        onOpenChange(false);
        if (onPreviewDoc) {
          onPreviewDoc(doc);
        } else {
          navigate(`/admin-panel/documents/${doc.id}`);
        }
      },
    }));
  }, [documents, navigate, onOpenChange, onPreviewDoc]);

  // Filter commands by search query
  const filteredItems = useMemo(() => {
    const all = [...baseCommands, ...documentCommands];
    if (!query.trim()) return all;
    const lower = query.toLowerCase();
    return all.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        item.description.toLowerCase().includes(lower) ||
        item.category.toLowerCase().includes(lower)
    );
  }, [baseCommands, documentCommands, query]);

  // Keyboard navigation inside palette
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev <= 0 ? (filteredItems.length - 1 || 0) : prev - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    },
    [filteredItems, onOpenChange, selectedIndex]
  );

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: { [cat: string]: { item: CommandItemDef; globalIndex: number }[] } = {};
    filteredItems.forEach((item, index) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push({ item, globalIndex: index });
    });
    return groups;
  }, [filteredItems]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 backdrop-blur-xs animate-fade-in"
      onClick={() => onOpenChange(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#131E18] rounded-2xl shadow-2xl border border-[#DCE8E0] dark:border-white/10 overflow-hidden flex flex-col max-h-[80vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#DCE8E0] dark:border-white/10 bg-[#FAFCFB] dark:bg-[#111A15]">
          <Search size={18} className="text-surface-400 dark:text-surface-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search documents..."
            className="flex-1 bg-transparent text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500 outline-hidden font-normal"
            aria-label="Command Palette Input"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 p-1 rounded-md cursor-pointer"
              title="Clear search"
            >
              <X size={14} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-md bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 border border-surface-200 dark:border-surface-700">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 space-y-4 max-h-[380px] scrollbar-thin"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-surface-500 dark:text-surface-400">
              No matching commands or documents found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="space-y-1">
                <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                  {category}
                </div>
                <div className="space-y-0.5">
                  {items.map(({ item, globalIndex }) => {
                    const isSelected = globalIndex === selectedIndex;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#E1F3E9] dark:bg-[#176B48]/30 text-surface-900 dark:text-surface-100'
                            : 'hover:bg-surface-100/70 dark:hover:bg-surface-800/50 text-surface-700 dark:text-surface-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-[#22A06B] text-white shadow-xs'
                                : 'bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400'
                            }`}
                          >
                            <Icon size={14} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs sm:text-sm font-medium truncate block">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-surface-500 dark:text-surface-400 truncate block">
                              {item.description}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {item.shortcut && (
                            <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-surface-200/70 dark:bg-surface-700/60 text-surface-600 dark:text-surface-300">
                              {item.shortcut}
                            </kbd>
                          )}
                          {isSelected && (
                            <CornerDownLeft size={13} className="text-[#22A06B] dark:text-[#52C58F]" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Keyboard Hints */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#DCE8E0] dark:border-white/10 bg-[#FAFCFB] dark:bg-[#111A15] text-[11px] text-surface-400 dark:text-surface-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded bg-surface-100 dark:bg-surface-800 font-mono text-[10px]">↑</kbd>
              <kbd className="px-1 py-0.2 rounded bg-surface-100 dark:bg-surface-800 font-mono text-[10px]">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 rounded bg-surface-100 dark:bg-surface-800 font-mono text-[10px]">↵</kbd>
              <span>to select</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1">
            <span>Powered by</span>
            <span className="font-semibold text-surface-700 dark:text-surface-300">CopyIt</span>
          </div>
        </div>
      </div>
    </div>
  );
}
