import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments';
import { useToast } from '../components/shared/Toast';
import { ThemeToggle } from '../components/shared/ThemeToggle';
import { DocumentEditor } from '../components/admin/DocumentEditor';
import { DocumentPreview } from '../components/admin/DocumentPreview';
import type { Document } from '../types';

export function EditDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDocument, updateDocument, publishDocument } = useDocuments();
  const { showToast } = useToast();

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewData, setPreviewData] = useState<{
    title: string;
    content: string;
    content_type: string;
  } | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchDoc = async () => {
      setLoading(true);
      const doc = await getDocument(id);
      setDocument(doc);
      setLoading(false);
    };

    fetchDoc();
  }, [id, getDocument]);

  const handleSave = useCallback(async (title: string, content: string) => {
    if (!id) return;
    setSaving(true);

    try {
      await updateDocument(id, {
        title,
        content,
        content_type: 'html',
      });
      showToast('Document updated successfully!', 'success');
      navigate('/admin-panel/dashboard');
    } catch (err) {
      console.error('Save failed:', err);
      showToast('Something went wrong while saving the document.', 'error');
    } finally {
      setSaving(false);
    }
  }, [id, updateDocument, navigate]);

  const handlePreview = useCallback((title: string, content: string) => {
    setPreviewData({ title, content, content_type: 'html' });
  }, []);

  const handlePublishFromPreview = useCallback(async () => {
    if (!id) return;
    setPublishing(true);
    try {
      await publishDocument(id);
      showToast('Document published successfully!', 'success');
      setPreviewData(null);
      navigate('/admin-panel/dashboard');
    } catch (err) {
      console.error('Publish failed:', err);
      showToast('Failed to publish the document.', 'error');
    } finally {
      setPublishing(false);
    }
  }, [id, publishDocument, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EEF6F1] dark:bg-[#0D1612]">
        <header className="macos-glass sticky top-0 z-40 border-b border-[#DCE8E0] dark:border-white/10">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
            <div className="flex items-center justify-between h-14">
              <Link to="/admin-panel/dashboard" className="macos-btn-ghost gap-1.5 text-sm">
                <ArrowLeft size={15} />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#22A06B]/20 border-t-[#22A06B] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-[#EEF6F1] dark:bg-[#0D1612]">
        <header className="macos-glass sticky top-0 z-40 border-b border-[#DCE8E0] dark:border-white/10">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
            <div className="flex items-center justify-between h-14">
              <Link to="/admin-panel/dashboard" className="macos-btn-ghost gap-1.5 text-sm">
                <ArrowLeft size={15} />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
          <p className="text-surface-500 dark:text-surface-400 font-medium">Document not found</p>
          <Link to="/admin-panel/dashboard" className="macos-btn-primary mt-4 text-sm">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF6F1] dark:bg-[#0D1612]">
      {/* Header */}
      <header className="macos-glass sticky top-0 z-40 border-b border-[#DCE8E0] dark:border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link
                to="/admin-panel/dashboard"
                className="macos-btn-ghost gap-1.5 text-sm"
              >
                <ArrowLeft size={15} />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <ChevronRight size={14} className="text-surface-400" />
              <span className="text-sm font-medium text-surface-600 dark:text-surface-400 truncate max-w-[200px]">
                {document.title}
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100 tracking-tight">
              Edit Document
            </h1>
            <p className="text-surface-500 dark:text-surface-400 mt-1">
              Make changes to your document
            </p>
          </div>

          <DocumentEditor
            initialContent={document.content || ''}
            initialTitle={document.title}
            onSave={handleSave}
            onPreview={handlePreview}
            onCancel={() => navigate('/admin-panel/dashboard')}
            saving={saving}
          />
        </div>
      </main>

      {/* Preview */}
      {previewData && (
        <DocumentPreview
          document={previewData}
          onClose={() => setPreviewData(null)}
          showPublish={!document.is_published}
          onPublish={handlePublishFromPreview}
          publishing={publishing}
        />
      )}
    </div>
  );
}
