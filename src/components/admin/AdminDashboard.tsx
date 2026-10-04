import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, LogOut, Globe, FolderOpen, Clock,
  Upload, Type, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useDocuments } from '../../hooks/useDocuments';
import { useToast } from '../shared/Toast';
import { ThemeToggle } from '../shared/ThemeToggle';
import { DocumentLibrary } from './DocumentLibrary';
import { DocumentPreview } from './DocumentPreview';
import { PrivateFilesManager } from './PrivateFilesManager';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import type { Document } from '../../types';

export function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const {
    documents,
    loading,
    publishDocument,
    unpublishDocument,
    deleteDocument,
  } = useDocuments();
  const { showToast } = useToast();

  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'publish' | 'unpublish' | 'delete';
    document: Document;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const publishedDoc = documents.find((d) => d.is_published);
  const totalDocuments = documents.length;
  const lastUpdated = documents.length > 0
    ? new Date(documents[0].updated_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Never';

  const handleConfirmAction = useCallback(async () => {
    if (!confirmAction) return;
    setActionLoading(true);

    try {
      switch (confirmAction.type) {
        case 'publish':
          await publishDocument(confirmAction.document.id);
          showToast(`"${confirmAction.document.title}" published successfully!`, 'success');
          break;
        case 'unpublish':
          await unpublishDocument(confirmAction.document.id);
          showToast('Document unpublished.', 'info');
          break;
        case 'delete':
          await deleteDocument(confirmAction.document.id);
          showToast('Document deleted.', 'info');
          break;
      }
    } catch (err) {
      console.error('Action failed:', err);
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  }, [confirmAction, publishDocument, unpublishDocument, deleteDocument]);

  const getConfirmDialogProps = () => {
    if (!confirmAction) return null;

    switch (confirmAction.type) {
      case 'publish':
        return {
          title: 'Publish this document?',
          message: publishedDoc
            ? `When published, "${confirmAction.document.title}" will replace "${publishedDoc.title}" as the document visible on the public website.`
            : `"${confirmAction.document.title}" will become visible on the public website.`,
          confirmLabel: 'Publish',
          variant: 'default' as const,
        };
      case 'unpublish':
        return {
          title: 'Unpublish this document?',
          message: 'The public website will show an empty state until another document is published.',
          confirmLabel: 'Unpublish',
          variant: 'warning' as const,
        };
      case 'delete':
        return {
          title: 'Delete this document?',
          message: confirmAction.document.is_published
            ? 'This document is currently published. Deleting it will remove it from the public website. This action cannot be undone.'
            : 'This action cannot be undone.',
          confirmLabel: 'Delete',
          variant: 'danger' as const,
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF6F1] dark:bg-[#0D1612]">
      {/* Admin Navbar */}
      <header className="macos-glass sticky top-0 z-40 border-b border-[#DCE8E0] dark:border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-7 h-7 rounded-lg bg-[#22A06B] flex items-center justify-center transition-transform group-hover:scale-105">
                  <FileText size={15} className="text-white" />
                </div>
                <span className="font-semibold text-lg tracking-tight text-surface-900 dark:text-surface-100">
                  CopyIt
                </span>
              </Link>
              <ChevronRight size={14} className="text-surface-400" />
              <span className="text-sm font-medium text-surface-500 dark:text-surface-400">
                Admin
              </span>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 dark:bg-surface-800/80 border border-[#DCE8E0] dark:border-surface-700 text-xs text-surface-600 dark:text-surface-300">
                <div className="w-1.5 h-1.5 rounded-full bg-[#22A06B]" />
                {user?.email}
              </div>
              <button
                onClick={signOut}
                className="macos-btn-ghost text-sm gap-1.5"
                aria-label="Sign out"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Published document */}
          <div className="macos-card p-5 group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-surface-500 dark:text-surface-400">
                Published Document
              </span>
              <Globe size={16} className="text-[#22A06B]" />
            </div>
            <p className="font-semibold text-surface-900 dark:text-surface-100 truncate">
              {publishedDoc ? publishedDoc.title : 'None'}
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
              {publishedDoc ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22A06B] inline-block" />
                  Live on public website
                </span>
              ) : (
                'No document published'
              )}
            </p>
          </div>

          {/* Total documents */}
          <div className="macos-card p-5 group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-surface-500 dark:text-surface-400">
                Total Documents
              </span>
              <FolderOpen size={16} className="text-[#22A06B]" />
            </div>
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              {loading ? '—' : totalDocuments}
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
              In document library
            </p>
          </div>

          {/* Last updated */}
          <div className="macos-card p-5 group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-surface-500 dark:text-surface-400">
                Last Updated
              </span>
              <Clock size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <p className="font-semibold text-surface-900 dark:text-surface-100">
              {loading ? '—' : lastUpdated}
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
              Most recent activity
            </p>
          </div>
        </div>

        {/* Add new document */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
            Add New Document
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/admin-panel/documents/new?mode=upload')}
              className="macos-card p-6 text-left hover:shadow-md transition-all group cursor-pointer border border-[#DCE8E0] dark:border-white/10 hover:border-[#22A06B]/50"
            >
              <div className="w-10 h-10 rounded-xl bg-[#E1F3E9] dark:bg-[#176B48]/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Upload size={20} className="text-[#22A06B] dark:text-[#52C58F]" />
              </div>
              <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                Upload Document
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                PDF, DOCX, ODT, TXT, or Markdown
              </p>
            </button>

            <button
              onClick={() => navigate('/admin-panel/documents/new?mode=paste')}
              className="macos-card p-6 text-left hover:shadow-md transition-all group cursor-pointer border border-[#DCE8E0] dark:border-white/10 hover:border-[#22A06B]/50"
            >
              <div className="w-10 h-10 rounded-xl bg-[#E1F3E9] dark:bg-[#176B48]/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Type size={20} className="text-[#22A06B] dark:text-[#52C58F]" />
              </div>
              <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                Paste Content
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                Write or paste formatted text
              </p>
            </button>
          </div>
        </div>

        {/* Document library */}
        <div className="mb-8">
          <DocumentLibrary
            documents={documents}
            loading={loading}
            onPreview={(doc) => setPreviewDoc(doc)}
            onEdit={(doc) => navigate(`/admin-panel/documents/${doc.id}`)}
            onPublish={(doc) => setConfirmAction({ type: 'publish', document: doc })}
            onUnpublish={(doc) => setConfirmAction({ type: 'unpublish', document: doc })}
            onDelete={(doc) => setConfirmAction({ type: 'delete', document: doc })}
          />
        </div>

        {/* Private Files - completely separate from published content */}
        <div className="mb-8">
          <PrivateFilesManager />
        </div>
      </main>

      {/* Preview modal */}
      {previewDoc && (
        <DocumentPreview
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
          showPublish={!previewDoc.is_published}
          onPublish={() => {
            setPreviewDoc(null);
            setConfirmAction({ type: 'publish', document: previewDoc });
          }}
        />
      )}

      {/* Confirm dialog */}
      {confirmAction && (
        <ConfirmDialog
          open={true}
          {...getConfirmDialogProps()!}
          loading={actionLoading}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
