import { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteAllFilesDialogProps {
  open: boolean;
  fileCount: number;
  loading: boolean;
  progressText?: string;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteAllFilesDialog({
  open,
  fileCount,
  loading,
  progressText,
  errorMessage,
  onConfirm,
  onCancel,
}: DeleteAllFilesDialogProps) {
  const [confirmText, setConfirmText] = useState('');

  // Reset confirmation input whenever the dialog opens or closes
  useEffect(() => {
    if (!open) {
      setConfirmText('');
    }
  }, [open]);

  if (!open) return null;

  const isConfirmed = confirmText.trim() === 'DELETE';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isConfirmed && !loading) {
      e.preventDefault();
      onConfirm();
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={() => {
        if (!loading) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-all-title"
    >
      <div
        className="macos-card w-full max-w-md p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex-shrink-0">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 id="delete-all-title" className="font-semibold text-lg text-surface-900 dark:text-surface-100">
                Delete all private files?
              </h3>
              <p className="mt-1.5 text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                This will permanently delete all files currently stored in your Private Files section. This action cannot be undone.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="macos-btn-ghost p-1.5 disabled:opacity-40"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* File count indicator */}
        <div className="my-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
          <span className="font-medium">Files targeted for deletion:</span>
          <span className="font-bold font-mono text-sm px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200">
            {fileCount} {fileCount === 1 ? 'file' : 'files'}
          </span>
        </div>

        {/* Error / partial failure alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-200">
            <p className="font-semibold mb-0.5">Note:</p>
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Safety input confirmation */}
        <div className="mb-6">
          <label
            htmlFor="delete-confirm-input"
            className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5"
          >
            To confirm, type <strong className="font-mono text-red-600 dark:text-red-400 font-bold">DELETE</strong> below:
          </label>
          <input
            id="delete-confirm-input"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="DELETE"
            disabled={loading}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            className="w-full h-10 px-3 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm font-mono text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all disabled:opacity-50"
          />
        </div>

        {/* Progress indicator during execution */}
        {loading && (
          <div className="mb-4 p-3 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center gap-2.5 text-xs text-surface-600 dark:text-surface-300">
            <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-600 rounded-full animate-spin flex-shrink-0" />
            <span className="font-medium">{progressText || 'Deleting files...'}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-surface-100 dark:border-surface-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="macos-btn-secondary text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isConfirmed || loading}
            className="macos-btn-danger text-sm gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={15} />
                <span>Delete All Files</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
