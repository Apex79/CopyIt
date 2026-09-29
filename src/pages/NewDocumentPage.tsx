import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Upload, Type } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useDocuments } from '../hooks/useDocuments';
import { useToast } from '../components/shared/Toast';
import { ThemeToggle } from '../components/shared/ThemeToggle';
import { FileUploader } from '../components/admin/FileUploader';
import { DocumentEditor } from '../components/admin/DocumentEditor';
import { DocumentPreview } from '../components/admin/DocumentPreview';

export function NewDocumentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { createDocument, uploadFile } = useDocuments();
  const { showToast } = useToast();

  const initialMode = searchParams.get('mode') as 'upload' | 'paste' | null;
  const [mode, setMode] = useState<'choose' | 'upload' | 'paste'>(initialMode || 'choose');
  const [saving, setSaving] = useState(false);

  // For file upload - stores processed content before showing editor
  const [uploadedData, setUploadedData] = useState<{
    content: string;
    contentType: 'html' | 'markdown' | 'plain_text';
    fileName: string;
    fileType: string;
    file: File;
  } | null>(null);

  // For preview
  const [previewData, setPreviewData] = useState<{
    title: string;
    content: string;
    content_type: string;
  } | null>(null);

  const handleFileProcessed = useCallback((
    content: string,
    contentType: 'html' | 'markdown' | 'plain_text',
    fileName: string,
    fileType: string,
    file: File,
  ) => {
    setUploadedData({ content, contentType, fileName, fileType, file });
  }, []);

  const handlePreview = useCallback((title: string, content: string) => {
    setPreviewData({ title, content, content_type: 'html' });
  }, []);

  const handleSave = useCallback(async (title: string, content: string) => {
    let currentUser = user;
    if (!currentUser) {
      const { data } = await supabase.auth.getUser();
      currentUser = data.user;
    }
    if (!currentUser) {
      showToast('You must be logged in as an administrator to save documents.', 'error');
      return;
    }
    setSaving(true);

    try {
      let storagePath: string | null = null;

      // Upload original file if it was a file upload
      if (uploadedData?.file) {
        storagePath = await uploadFile(uploadedData.file);
      }

      await createDocument({
        title,
        content,
        content_type: 'html',
        file_name: uploadedData?.fileName || null,
        file_type: uploadedData?.fileType || null,
        storage_path: storagePath,
        is_published: false,
        created_by: currentUser.id,
      });

      showToast('Document saved successfully!', 'success');
      navigate('/admin-panel/dashboard');
    } catch (err) {
      console.error('Save failed:', err);
      const message = err instanceof Error ? err.message : 'Something went wrong while saving the document.';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  }, [user, uploadedData, createDocument, uploadFile, navigate, showToast]);

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
              <span className="text-sm font-medium text-surface-600 dark:text-surface-400">
                New Document
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">
        {/* Mode selection */}
        {mode === 'choose' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100 tracking-tight">
                Add New Document
              </h1>
              <p className="text-surface-500 dark:text-surface-400 mt-1">
                Choose how you want to add your content
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setMode('upload')}
                className="macos-card p-8 text-left hover:shadow-md transition-all group cursor-pointer border border-[#DCE8E0] dark:border-white/10 hover:border-[#22A06B]/50"
              >
                <div className="w-12 h-12 rounded-xl bg-[#E1F3E9] dark:bg-[#176B48]/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Upload size={24} className="text-[#22A06B] dark:text-[#52C58F]" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                  Upload Document
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-2">
                  Upload a PDF, DOCX, ODT, TXT, or Markdown file. The content will be automatically converted.
                </p>
              </button>

              <button
                onClick={() => setMode('paste')}
                className="macos-card p-8 text-left hover:shadow-md transition-all group cursor-pointer border border-[#DCE8E0] dark:border-white/10 hover:border-[#22A06B]/50"
              >
                <div className="w-12 h-12 rounded-xl bg-[#E1F3E9] dark:bg-[#176B48]/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Type size={24} className="text-[#22A06B] dark:text-[#52C58F]" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                  Paste Content
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-2">
                  Write or paste formatted text directly using the rich text editor.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* File upload mode */}
        {mode === 'upload' && !uploadedData && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                Upload Document
              </h1>
              <p className="text-surface-500 dark:text-surface-400 mt-1">
                Select a document to upload and convert
              </p>
            </div>

            <FileUploader
              onFileProcessed={handleFileProcessed}
              onCancel={() => setMode('choose')}
            />
          </div>
        )}

        {/* Editor after file upload */}
        {mode === 'upload' && uploadedData && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                Edit Converted Document
              </h1>
              <p className="text-surface-500 dark:text-surface-400 mt-1">
                Review and edit the converted content before saving
              </p>
            </div>

            <DocumentEditor
              initialContent={uploadedData.content}
              initialTitle={uploadedData.fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')}
              onSave={handleSave}
              onPreview={handlePreview}
              onCancel={() => {
                setUploadedData(null);
                setMode('choose');
              }}
              saving={saving}
            />
          </div>
        )}

        {/* Paste content mode */}
        {mode === 'paste' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                Create Document
              </h1>
              <p className="text-surface-500 dark:text-surface-400 mt-1">
                Write or paste your content using the editor
              </p>
            </div>

            <DocumentEditor
              onSave={handleSave}
              onPreview={handlePreview}
              onCancel={() => setMode('choose')}
              saving={saving}
            />
          </div>
        )}
      </main>

      {/* Preview */}
      {previewData && (
        <DocumentPreview
          document={previewData}
          onClose={() => setPreviewData(null)}
        />
      )}
    </div>
  );
}
