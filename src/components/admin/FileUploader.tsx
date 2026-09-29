import { useState, useCallback, useRef, type DragEvent } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { processFile, isFileSupported, formatFileSize, getSupportedExtensions } from '../../lib/documentProcessor';

interface FileUploaderProps {
  onFileProcessed: (content: string, contentType: 'html' | 'markdown' | 'plain_text', fileName: string, fileType: string, file: File) => void;
  onCancel: () => void;
}

export function FileUploader({ onFileProcessed, onCancel }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<'idle' | 'processing' | 'done'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedExtensions = getSupportedExtensions();

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const processSelectedFile = useCallback(async (file: File) => {
    if (!isFileSupported(file.name)) {
      setError(`Unsupported file type. Supported formats: ${supportedExtensions.join(', ').toUpperCase()}`);
      return;
    }

    setSelectedFile(file);
    setError(null);
    setProcessing(true);
    setProgress('processing');

    try {
      const result = await processFile(file);
      const fileType = file.name.split('.').pop()?.toLowerCase() || '';

      setProgress('done');
      
      // Small delay for UX
      setTimeout(() => {
        onFileProcessed(result.content, result.contentType, file.name, fileType, file);
      }, 500);
    } catch (err) {
      console.error('File processing error:', err);
      setError('Something went wrong while processing the document. Please try a different file.');
      setProgress('idle');
    } finally {
      setProcessing(false);
    }
  }, [onFileProcessed, supportedExtensions]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processSelectedFile(file);
    }
  }, [processSelectedFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  }, [processSelectedFile]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    setProgress('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {!selectedFile && (
        <div
          className={`relative border-2 border-dashed rounded-[var(--radius-macos)] p-10 text-center transition-all duration-200 cursor-pointer ${
            dragActive
              ? 'drop-zone-active border-primary-400'
              : 'border-surface-300 dark:border-surface-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-surface-50 dark:hover:bg-surface-800/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload document"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={supportedExtensions.map((ext) => `.${ext}`).join(',')}
            onChange={handleFileSelect}
          />

          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
              <Upload size={24} className="text-primary-500" />
            </div>
            <div>
              <p className="font-medium text-surface-700 dark:text-surface-300">
                Drop your document here
              </p>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                or <span className="text-primary-600 dark:text-primary-400 font-medium">choose a file</span>
              </p>
            </div>
            <p className="text-xs text-surface-400 dark:text-surface-500">
              Supported: {supportedExtensions.map((e) => e.toUpperCase()).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Selected file */}
      {selectedFile && (
        <div className="macos-card p-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              progress === 'done'
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
            }`}>
              {progress === 'done' ? <CheckCircle2 size={20} /> : <FileText size={20} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-surface-900 dark:text-surface-100 truncate">
                {selectedFile.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-surface-500 uppercase">
                  {selectedFile.name.split('.').pop()}
                </span>
                <span className="text-xs text-surface-400">•</span>
                <span className="text-xs text-surface-500">
                  {formatFileSize(selectedFile.size)}
                </span>
                {processing && (
                  <>
                    <span className="text-xs text-surface-400">•</span>
                    <span className="text-xs text-primary-500 font-medium">Processing...</span>
                  </>
                )}
                {progress === 'done' && (
                  <>
                    <span className="text-xs text-surface-400">•</span>
                    <span className="text-xs text-emerald-500 font-medium">Ready</span>
                  </>
                )}
              </div>
            </div>
            {!processing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                className="macos-btn-ghost p-2 text-surface-400 hover:text-red-500"
                aria-label="Remove file"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Processing bar */}
          {processing && (
            <div className="mt-3 h-1 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full animate-pulse" style={{ width: '75%' }} />
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-[var(--radius-macos-xs)] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm animate-scale-in">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Cancel */}
      <div className="flex justify-end">
        <button
          onClick={onCancel}
          className="macos-btn-secondary text-sm"
          disabled={processing}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
