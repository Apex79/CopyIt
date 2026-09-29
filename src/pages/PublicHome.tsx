import { Navbar } from '../components/public/Navbar';
import { DocumentViewer } from '../components/public/DocumentViewer';
import { CopyButton } from '../components/public/CopyButton';
import { EmptyState } from '../components/public/EmptyState';
import { DocumentSkeleton } from '../components/shared/LoadingStates';
import { usePublishedDocument } from '../hooks/useDocuments';

export function PublicHome() {
  const { document, loading, error } = usePublishedDocument();

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-10 py-6 sm:py-10">
        {/* Loading state */}
        {loading && <DocumentSkeleton />}

        {/* Error state */}
        {!loading && error && (
          <div className="macos-card p-12 text-center max-w-lg mx-auto my-16">
            <p className="text-surface-600 dark:text-surface-400 font-medium">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && !document && <EmptyState />}

        {/* Published Document macOS Window */}
        {!loading && !error && document && (
          <>
            <DocumentViewer document={document} />

            {/* Floating copy button for fast access while scrolling */}
            <CopyButton htmlContent={document.content || ''} variant="floating" />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-10 py-6 border-t border-[#DCE8E0] dark:border-[rgba(220,232,224,0.1)]">
        <p className="text-center text-xs text-surface-500 dark:text-surface-400">
          Powered by CopyIt — Publish and copy formatted content
        </p>
      </footer>
    </div>
  );
}
