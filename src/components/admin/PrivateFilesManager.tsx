import { useState, useCallback, useRef, useEffect, type DragEvent } from 'react';
import {
  Upload, Download, Trash2, Search, FileText,
  File as FileIcon, Image, Video, Archive, Code, Music,
  HardDrive, MoreHorizontal,
} from 'lucide-react';
import { usePrivateFiles } from '../../hooks/usePrivateFiles';
import { useToast } from '../shared/Toast';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import type { PrivateFile } from '../../types';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (Supabase Storage standard limit)

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFileIcon(mimeType: string, fileName: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.startsWith('audio/')) return Music;
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) return Archive;
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'rb', 'go', 'rs', 'php', 'html', 'css', 'json', 'xml', 'yaml', 'yml', 'sh', 'bat', 'sql'].includes(ext)) return Code;
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'rtf', 'odt'].includes(ext)) return FileText;
  return FileIcon;
}

function getFileExtLabel(fileName: string): string {
  const ext = fileName.split('.').pop()?.toUpperCase();
  return ext || 'FILE';
}

function getIsMac(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    /Mac|iPod|iPhone|iPad/.test(navigator.platform || '') ||
    /Macintosh|Mac OS X/.test(navigator.userAgent || '')
  );
}

function isGenericImageFileName(fileName: string): boolean {
  if (!fileName || !fileName.trim()) return true;
  const name = fileName.trim().toLowerCase();
  if (name === 'blob' || name === 'image' || name === 'untitled') return true;
  return /^image\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(name);
}

function getExtensionFromMime(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'image/svg+xml':
      return 'svg';
    case 'image/bmp':
      return 'bmp';
    case 'image/avif':
      return 'avif';
    default: {
      const sub = mimeType.split('/')[1];
      return sub ? sub.replace(/[^a-zA-Z0-9]/g, '') : 'png';
    }
  }
}

export function PrivateFilesManager() {
  const { files, loading, uploadFile, downloadFile, deleteFile } = usePrivateFiles();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PrivateFile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const downloadingFileIdRef = useRef<string | null>(null);

  useEffect(() => {
    downloadingFileIdRef.current = downloadingFileId;
  }, [downloadingFileId]);

  const isMac = getIsMac();
  const pasteShortcut = isMac ? 'Cmd+V' : 'Ctrl+V';

  const filteredFiles = files.filter((f) =>
    f.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Upload handlers
  const handleUploadFiles = useCallback(async (fileList: FileList | File[]) => {
    const rawFiles = Array.from(fileList);
    if (rawFiles.length === 0) return;

    // Validate files (size limit and non-empty)
    const validFiles: File[] = [];
    for (const file of rawFiles) {
      if (file.size > MAX_FILE_SIZE) {
        showToast(
          `"${file.name}" exceeds the 50MB size limit (${formatFileSize(file.size)}).`,
          'error'
        );
      } else if (file.size === 0) {
        showToast(`"${file.name}" is empty (0 Bytes).`, 'error');
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const progressMsg = validFiles.length > 1
          ? `Uploading ${file.name} (${i + 1}/${validFiles.length})...`
          : `Uploading ${file.name}...`;
        setUploadProgress(progressMsg);
        await uploadFile(file);
        successCount++;
      } catch (err) {
        console.error('Upload failed:', file.name, err);
        failCount++;
      }
    }

    setUploading(false);
    setUploadProgress(null);

    if (successCount > 0 && failCount === 0) {
      showToast(
        successCount === 1
          ? 'File uploaded successfully!'
          : `${successCount} files uploaded successfully!`,
        'success'
      );
    } else if (successCount > 0 && failCount > 0) {
      showToast(`${successCount} uploaded, ${failCount} failed.`, 'info');
    } else if (failCount > 0) {
      showToast('Upload failed. Please try again.', 'error');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadFile, showToast]);

  // Keep refs for window event listener to avoid stale closures
  const handleUploadFilesRef = useRef(handleUploadFiles);
  const uploadingRef = useRef(uploading);
  const deleteTargetRef = useRef(deleteTarget);

  useEffect(() => {
    handleUploadFilesRef.current = handleUploadFiles;
  }, [handleUploadFiles]);

  useEffect(() => {
    uploadingRef.current = uploading;
  }, [uploading]);

  useEffect(() => {
    deleteTargetRef.current = deleteTarget;
  }, [deleteTarget]);

  // Global paste handler for the Admin Panel
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Don't process if already uploading or in a delete confirmation dialog
      if (uploadingRef.current || deleteTargetRef.current) {
        return;
      }

      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // Extract files from clipboard
      const extractedFiles: File[] = [];

      // 1. Try clipboardData.files (FileList)
      if (clipboardData.files && clipboardData.files.length > 0) {
        for (let i = 0; i < clipboardData.files.length; i++) {
          const file = clipboardData.files[i];
          if (file) {
            extractedFiles.push(file);
          }
        }
      }
      // 2. Try clipboardData.items if no files found in .files
      else if (clipboardData.items && clipboardData.items.length > 0) {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) {
              extractedFiles.push(file);
            }
          }
        }
      }

      // If clipboard does not contain any file or image, allow default behavior
      // This ensures normal text paste continues working without interference.
      if (extractedFiles.length === 0) {
        return;
      }

      // Files/images found: prevent default browser paste behavior
      e.preventDefault();
      e.stopPropagation();

      // Process files: preserve filename if provided, or generate sensible filename for raw images/blobs
      const timestamp = Date.now();
      const processedFiles: File[] = extractedFiles.map((file, idx) => {
        const isImage = file.type.startsWith('image/');
        if (isImage && isGenericImageFileName(file.name)) {
          const ext = getExtensionFromMime(file.type);
          const newName = extractedFiles.length > 1
            ? `pasted-image-${timestamp}-${idx + 1}.${ext}`
            : `pasted-image-${timestamp}.${ext}`;
          return new File([file], newName, { type: file.type || 'image/png' });
        }

        if (!file.name || file.name === 'blob') {
          const ext = file.type ? file.type.split('/')[1]?.replace(/[^a-zA-Z0-9]/g, '') || 'bin' : 'bin';
          const newName = extractedFiles.length > 1
            ? `pasted-file-${timestamp}-${idx + 1}.${ext}`
            : `pasted-file-${timestamp}.${ext}`;
          return new File([file], newName, { type: file.type });
        }

        return file;
      });

      handleUploadFilesRef.current(processedFiles);
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (uploadingRef.current) return;
    if (e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  }, [handleUploadFiles]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (uploadingRef.current) return;
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFiles(e.target.files);
    }
  }, [handleUploadFiles]);

  // Download handler
  const handleDownload = useCallback(async (file: PrivateFile) => {
    // Prevent accidental multiple clicks while a download is already in progress
    if (downloadingFileIdRef.current) return;
    downloadingFileIdRef.current = file.id;
    setDownloadingFileId(file.id);

    try {
      await downloadFile(file);
      showToast(`Downloaded ${file.file_name}`, 'success');
    } catch (err) {
      console.error('Download failed:', err);
      const message = err instanceof Error ? err.message : 'Unable to download this file. Please try again.';
      showToast(message, 'error');
    } finally {
      downloadingFileIdRef.current = null;
      setDownloadingFileId(null);
    }
  }, [downloadFile, showToast]);

  // Delete handlers
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteFile(deleteTarget);
      showToast('File deleted.', 'info');
    } catch (err) {
      console.error('Delete failed:', err);
      showToast('Failed to delete file.', 'error');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteFile, showToast]);

  return (
    <div>
      <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
        <HardDrive size={20} className="text-[#22A06B]" />
        Private Files
      </h2>

      {/* Upload area */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer mb-6 ${
          dragActive
            ? 'border-[#22A06B] bg-[#E1F3E9]/50 dark:bg-[#176B48]/10'
            : 'border-[#DCE8E0] dark:border-[rgba(220,232,224,0.15)] hover:border-[#22A06B]/50 hover:bg-[#EEF6F1]/50 dark:hover:bg-[#176B48]/5'
        } ${uploading ? 'pointer-events-none opacity-70' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label={`Upload private files. Drag and drop, choose files, or press ${pasteShortcut} to upload`}
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
          multiple
          onChange={handleFileInputChange}
        />

        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-[#E1F3E9] dark:bg-[#176B48]/20 flex items-center justify-center">
            {uploading ? (
              <div className="w-5 h-5 border-2 border-[#22A06B]/30 border-t-[#22A06B] rounded-full animate-spin" />
            ) : (
              <Upload size={22} className="text-[#22A06B]" />
            )}
          </div>
          {uploading ? (
            <div>
              <p className="font-medium text-surface-700 dark:text-surface-300 text-sm">
                {uploadProgress || 'Uploading...'}
              </p>
            </div>
          ) : (
            <div>
              <p className="font-medium text-surface-700 dark:text-surface-300">
                Drag &amp; drop, choose files, or press{' '}
                <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-[#E1F3E9] dark:bg-[#176B48]/30 text-[#176B48] dark:text-[#52C58F] rounded-md border border-[#22A06B]/20 font-mono shadow-xs">
                  {pasteShortcut}
                </kbd>{' '}
                to upload
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                or <span className="text-[#22A06B] font-medium">click to browse</span> from your device
              </p>
            </div>
          )}
        </div>
      </div>

      {/* File list card */}
      <div className="macos-card overflow-hidden">
        {/* Header with search */}
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="font-semibold text-surface-900 dark:text-surface-100">
              Files
              <span className="ml-2 text-sm font-normal text-surface-500">
                ({files.length})
              </span>
            </h3>

            {files.length > 0 && (
              <div className="relative w-full sm:w-72">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-white dark:bg-[#18261E] border border-[#DCE8E0] dark:border-[rgba(220,232,224,0.15)] text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:border-[#22A06B] focus:ring-2 focus:ring-[#22A06B]/20 transition-all shadow-xs"
                  aria-label="Search files"
                />
              </div>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-8 flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-[#22A06B]/20 border-t-[#22A06B] rounded-full animate-spin" />
            <span className="text-sm text-surface-500 dark:text-surface-400">Loading files...</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && files.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
              <HardDrive size={24} className="text-surface-400" />
            </div>
            <p className="text-surface-500 dark:text-surface-400 font-medium">
              No files uploaded yet
            </p>
            <p className="text-sm text-surface-400 dark:text-surface-500 mt-1 text-center max-w-sm">
              Upload files here to access them from your other devices. Drag &amp; drop, choose files, or press{' '}
              <kbd className="px-1 py-0.5 text-xs font-semibold bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded font-mono">
                {pasteShortcut}
              </kbd>{' '}
              to upload.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="macos-btn-primary text-sm mt-4 gap-1.5"
            >
              <Upload size={15} />
              Upload File
            </button>
          </div>
        )}

        {/* No search results */}
        {!loading && files.length > 0 && filteredFiles.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-surface-500 dark:text-surface-400">No files match your search</p>
          </div>
        )}

        {/* File list */}
        {!loading && filteredFiles.map((file) => {
          const IconComponent = getFileIcon(file.mime_type, file.file_name);
          return (
            <div
              key={file.id}
              className="flex items-center gap-3 px-4 py-3.5 border-b border-surface-100 dark:border-surface-800 last:border-0 hover:bg-[#EEF6F1]/50 dark:hover:bg-surface-800/40 transition-colors group"
            >
              {/* Icon */}
              <div className="w-8 h-8 rounded-lg bg-[#E1F3E9] dark:bg-[#176B48]/20 flex items-center justify-center flex-shrink-0 text-[#176B48] dark:text-[#52C58F]">
                <IconComponent size={16} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <span className="font-medium text-surface-900 dark:text-surface-100 truncate block">
                  {file.file_name}
                </span>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-surface-500 dark:text-surface-400">
                  <span className="uppercase font-medium">{getFileExtLabel(file.file_name)}</span>
                  <span>{formatFileSize(file.file_size)}</span>
                  <span className="hidden sm:inline">{formatDate(file.created_at)}</span>
                </div>
              </div>

              {/* Actions - Desktop */}
              <div
                className={`hidden sm:flex items-center gap-1 transition-opacity ${
                  downloadingFileId === file.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <button
                  onClick={() => handleDownload(file)}
                  disabled={downloadingFileId !== null}
                  className={`macos-btn-ghost p-2 text-[#22A06B] dark:text-[#52C58F] hover:bg-[#E1F3E9] dark:hover:bg-[#176B48]/20 transition-all disabled:opacity-50 ${
                    downloadingFileId === file.id ? 'cursor-wait bg-[#E1F3E9] dark:bg-[#176B48]/20 !opacity-100' : ''
                  }`}
                  title={downloadingFileId === file.id ? 'Downloading...' : 'Download'}
                  aria-label={downloadingFileId === file.id ? `Downloading ${file.file_name}` : `Download ${file.file_name}`}
                >
                  {downloadingFileId === file.id ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium px-1">
                      <div className="w-3.5 h-3.5 border-2 border-[#22A06B]/30 border-t-[#22A06B] rounded-full animate-spin" />
                      <span className="hidden md:inline">Downloading...</span>
                    </span>
                  ) : (
                    <Download size={15} />
                  )}
                </button>
                <button
                  onClick={() => setDeleteTarget(file)}
                  disabled={downloadingFileId !== null}
                  className="macos-btn-ghost p-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                  title="Delete"
                  aria-label={`Delete ${file.file_name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Actions - Mobile menu */}
              <div className="sm:hidden relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === file.id ? null : file.id)}
                  className="macos-btn-ghost p-2"
                  aria-label="File actions"
                >
                  <MoreHorizontal size={16} />
                </button>

                {activeMenu === file.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                    <div className="absolute right-0 top-full mt-1 z-20 macos-card p-1 min-w-[160px] shadow-lg animate-scale-in">
                      <button
                        onClick={() => { handleDownload(file); setActiveMenu(null); }}
                        disabled={downloadingFileId !== null}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#22A06B] dark:text-[#52C58F] hover:bg-[#E1F3E9] dark:hover:bg-[#176B48]/20 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {downloadingFileId === file.id ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-[#22A06B]/30 border-t-[#22A06B] rounded-full animate-spin" />
                            <span>Downloading...</span>
                          </>
                        ) : (
                          <>
                            <Download size={14} /> Download
                          </>
                        )}
                      </button>
                      <div className="my-1 border-t border-surface-200 dark:border-surface-700" />
                      <button
                        onClick={() => { setDeleteTarget(file); setActiveMenu(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm delete dialog */}
      {deleteTarget && (
        <ConfirmDialog
          open={true}
          title="Delete this file permanently?"
          message={`"${deleteTarget.file_name}" will be permanently removed. This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          loading={deleteLoading}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
