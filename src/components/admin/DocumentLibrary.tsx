import { Upload, Send, Eye, Globe, Trash2, Edit3, FileText, Clock, MoreHorizontal, Search } from 'lucide-react';
import { useState } from 'react';
import type { Document } from '../../types';

interface DocumentLibraryProps {
  documents: Document[];
  loading: boolean;
  onPreview: (doc: Document) => void;
  onEdit: (doc: Document) => void;
  onPublish: (doc: Document) => void;
  onUnpublish: (doc: Document) => void;
  onDelete: (doc: Document) => void;
}

export function DocumentLibrary({
  documents,
  loading,
  onPreview,
  onEdit,
  onPublish,
  onUnpublish,
  onDelete,
}: DocumentLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFileTypeLabel = (doc: Document) => {
    if (doc.file_type) return doc.file_type.toUpperCase();
    if (doc.content_type === 'markdown') return 'MD';
    if (doc.content_type === 'plain_text') return 'TXT';
    return 'HTML';
  };

  if (loading) {
    return (
      <div className="macos-card overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-surface-100 dark:border-surface-800 last:border-0">
            <div className="skeleton h-4 w-1/3" />
            <div className="skeleton h-4 w-16" />
            <div className="skeleton h-4 w-20" />
            <div className="flex-1" />
            <div className="skeleton h-8 w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="macos-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-surface-200 dark:border-surface-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="font-semibold text-surface-900 dark:text-surface-100">
            Document Library
            <span className="ml-2 text-sm font-normal text-surface-500">
              ({documents.length})
            </span>
          </h3>

          {documents.length > 0 && (
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-white dark:bg-[#18261E] border border-[#DCE8E0] dark:border-[rgba(220,232,224,0.15)] text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:border-[#22A06B] focus:ring-2 focus:ring-[#22A06B]/20 transition-all shadow-xs"
                aria-label="Search documents"
              />
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {documents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
            <FileText size={24} className="text-surface-400" />
          </div>
          <p className="text-surface-500 dark:text-surface-400 font-medium">No documents yet</p>
          <p className="text-sm text-surface-400 dark:text-surface-500 mt-1">
            Upload or paste a document to get started
          </p>
        </div>
      )}

      {/* No search results */}
      {documents.length > 0 && filteredDocuments.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-surface-500 dark:text-surface-400">No documents match your search</p>
        </div>
      )}

      {/* Document list */}
      {filteredDocuments.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center gap-3 px-4 py-3.5 border-b border-surface-100 dark:border-surface-800 last:border-0 hover:bg-[#EEF6F1]/50 dark:hover:bg-surface-800/40 transition-colors group"
        >
          {/* Icon */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            doc.is_published
              ? 'bg-[#E1F3E9] dark:bg-[#176B48]/25 text-[#176B48] dark:text-[#52C58F]'
              : 'bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400'
          }`}>
            {doc.is_published ? <Globe size={16} /> : <FileText size={16} />}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-surface-900 dark:text-surface-100 truncate">
                {doc.title}
              </span>
              {doc.is_published ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-[#E1F3E9] dark:bg-[#176B48]/25 text-[#176B48] dark:text-[#52C58F] border border-[#22A06B]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22A06B]" />
                  Published
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400">
                  Draft
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-surface-500 dark:text-surface-400">
              <span className="uppercase font-medium">{getFileTypeLabel(doc)}</span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {formatDate(doc.updated_at)}
              </span>
            </div>
          </div>

          {/* Actions - Desktop */}
          <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onPreview(doc)}
              className="macos-btn-ghost p-2 text-surface-500 hover:text-surface-800 dark:hover:text-surface-200"
              title="Preview"
              aria-label={`Preview ${doc.title}`}
            >
              <Eye size={15} />
            </button>
            <button
              onClick={() => onEdit(doc)}
              className="macos-btn-ghost p-2 text-surface-500 hover:text-surface-800 dark:hover:text-surface-200"
              title="Edit"
              aria-label={`Edit ${doc.title}`}
            >
              <Edit3 size={15} />
            </button>
            {doc.is_published ? (
              <button
                onClick={() => onUnpublish(doc)}
                className="macos-btn-ghost p-2 text-amber-600 dark:text-amber-400"
                title="Unpublish"
                aria-label={`Unpublish ${doc.title}`}
              >
                <Upload size={15} />
              </button>
            ) : (
              <button
                onClick={() => onPublish(doc)}
                className="macos-btn-ghost p-2 text-[#22A06B] dark:text-[#52C58F] hover:bg-[#E1F3E9] dark:hover:bg-[#176B48]/20"
                title="Publish"
                aria-label={`Publish ${doc.title}`}
              >
                <Send size={15} />
              </button>
            )}
            <button
              onClick={() => onDelete(doc)}
              className="macos-btn-ghost p-2 text-red-500 hover:text-red-700"
              title="Delete"
              aria-label={`Delete ${doc.title}`}
            >
              <Trash2 size={15} />
            </button>
          </div>

          {/* Actions - Mobile menu */}
          <div className="sm:hidden relative">
            <button
              onClick={() => setActiveMenu(activeMenu === doc.id ? null : doc.id)}
              className="macos-btn-ghost p-2"
              aria-label="Document actions"
            >
              <MoreHorizontal size={16} />
            </button>

            {activeMenu === doc.id && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                <div className="absolute right-0 top-full mt-1 z-20 macos-card p-1 min-w-[160px] shadow-lg animate-scale-in">
                  <button
                    onClick={() => { onPreview(doc); setActiveMenu(null); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                  >
                    <Eye size={14} /> Preview
                  </button>
                  <button
                    onClick={() => { onEdit(doc); setActiveMenu(null); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  {doc.is_published ? (
                    <button
                      onClick={() => { onUnpublish(doc); setActiveMenu(null); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                    >
                      <Upload size={14} /> Unpublish
                    </button>
                  ) : (
                    <button
                      onClick={() => { onPublish(doc); setActiveMenu(null); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#22A06B] dark:text-[#52C58F] hover:bg-[#E1F3E9] dark:hover:bg-[#176B48]/20 rounded-lg transition-colors"
                    >
                      <Send size={14} /> Publish
                    </button>
                  )}
                  <div className="my-1 border-t border-surface-200 dark:border-surface-700" />
                  <button
                    onClick={() => { onDelete(doc); setActiveMenu(null); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
