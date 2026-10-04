import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { PrivateFile, UploadErrorDetails } from '../types';

export class PrivateFileUploadError extends Error {
  public details: UploadErrorDetails;

  constructor(message: string, details: UploadErrorDetails) {
    super(message);
    this.name = 'PrivateFileUploadError';
    this.details = details;
  }
}

export function getFileExt(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? (parts.pop()?.toLowerCase() || '') : '';
}

export function getMimeTypeFromFileName(fileName: string): string {
  const ext = getFileExt(fileName);
  switch (ext) {
    // Images
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'bmp':
      return 'image/bmp';
    case 'avif':
      return 'image/avif';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    case 'ico':
      return 'image/x-icon';
    // Documents
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'ppt':
      return 'application/vnd.ms-powerpoint';
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'txt':
      return 'text/plain';
    case 'md':
      return 'text/markdown';
    case 'csv':
      return 'text/csv';
    case 'rtf':
      return 'application/rtf';
    case 'odt':
      return 'application/vnd.oasis.opendocument.text';
    // Archives
    case 'zip':
      return 'application/zip';
    case 'rar':
      return 'application/x-rar-compressed';
    case '7z':
      return 'application/x-7z-compressed';
    case 'tar':
      return 'application/x-tar';
    case 'gz':
      return 'application/gzip';
    // Media
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'mov':
      return 'video/quicktime';
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'ogg':
      return 'audio/ogg';
    // Code & Data
    case 'json':
      return 'application/json';
    case 'xml':
      return 'application/xml';
    case 'html':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'js':
      return 'application/javascript';
    case 'ts':
      return 'text/typescript';
    case 'py':
      return 'text/x-python';
    case 'cpp':
    case 'c':
    case 'h':
      return 'text/x-c++src';
    case 'java':
      return 'text/x-java-source';
    case 'sql':
      return 'application/sql';
    default:
      return 'application/octet-stream';
  }
}

function isNetworkError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const msg = String((err as Record<string, unknown>).message || '').toLowerCase();
  const name = String((err as Record<string, unknown>).name || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('aborted') ||
    msg.includes('timeout') ||
    msg.includes('connection') ||
    name.includes('network') ||
    name.includes('abort')
  );
}

export function usePrivateFiles() {
  const [files, setFiles] = useState<PrivateFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('private_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setFiles(data || []);
    } catch (err) {
      console.error('Error fetching private files:', err);
      setError('Failed to load files.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const uploadFile = useCallback(async (file: File): Promise<PrivateFile> => {
    const fileExt = getFileExt(file.name);
    const detectedMime = file.type || getMimeTypeFromFileName(file.name) || 'application/octet-stream';

    console.info('[PrivateFiles] Preparing upload:', {
      name: file.name,
      type: file.type,
      detectedMime,
      size: file.size,
      lastModified: file.lastModified,
      extension: fileExt,
    });

    // 1. Session verification and auto-refresh
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    let activeSession = sessionData?.session;

    if (sessionError || !activeSession) {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData?.session) {
        const authMsg = refreshError?.message || sessionError?.message || 'No active session found.';
        console.error('[PrivateFiles] Auth check failed:', authMsg);
        throw new PrivateFileUploadError(
          'Your session has expired. Please sign in again.',
          {
            fileName: file.name,
            fileType: detectedMime,
            fileSize: file.size,
            lastModified: file.lastModified,
            fileExtension: fileExt,
            stage: 'auth_check',
            errorMessage: authMsg,
            errorName: 'AuthSessionError',
            statusCode: 401,
            timestamp: new Date().toISOString(),
          }
        );
      }
      activeSession = refreshData.session;
    }

    // 2. File reading & memory detachment (prevents Android Scoped Storage stream locks)
    let uploadPayload: File | Blob = file;
    try {
      const buffer = await file.arrayBuffer();
      uploadPayload = new File([buffer], file.name, {
        type: detectedMime,
        lastModified: file.lastModified,
      });
    } catch (readErr: unknown) {
      console.warn('[PrivateFiles] File memory read warning (falling back to original handle):', readErr);
      const isReadErr = readErr instanceof Error;
      if (isReadErr && (readErr.name === 'NotReadableError' || readErr.name === 'SecurityError')) {
        throw new PrivateFileUploadError(
          'Could not read this file from your device. Please check device permissions and try again.',
          {
            fileName: file.name,
            fileType: detectedMime,
            fileSize: file.size,
            lastModified: file.lastModified,
            fileExtension: fileExt,
            stage: 'file_read',
            errorMessage: readErr.message,
            errorName: readErr.name,
            timestamp: new Date().toISOString(),
          }
        );
      }
      uploadPayload = file;
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `private/${timestamp}_${safeName}`;

    // 3. Upload to Supabase Storage with automatic single retry for mobile network glitches
    let { error: uploadError } = await supabase.storage
      .from('private-files')
      .upload(path, uploadPayload, {
        cacheControl: '3600',
        contentType: detectedMime,
        upsert: false,
      });

    if (uploadError && isNetworkError(uploadError)) {
      console.warn('[PrivateFiles] Storage upload network error, retrying in 1s...', uploadError);
      await new Promise((r) => setTimeout(r, 1000));
      const retryResult = await supabase.storage
        .from('private-files')
        .upload(path, uploadPayload, {
          cacheControl: '3600',
          contentType: detectedMime,
          upsert: false,
        });
      uploadError = retryResult.error;
    }

    if (uploadError) {
      const rawErr = uploadError as unknown as Record<string, unknown>;
      const statusCode = (rawErr.statusCode as string | number) || (rawErr.status as string | number);
      const httpStatus = typeof rawErr.status === 'number' ? rawErr.status : undefined;

      console.error('[PrivateFiles] Storage upload failed:', {
        message: uploadError.message,
        name: uploadError.name,
        statusCode,
        httpStatus,
        error: uploadError,
      });

      let userMsg = 'Failed to upload file to storage.';
      if (isNetworkError(uploadError)) {
        userMsg = 'Network connection interrupted or timed out. Please check your internet connection and try again.';
      } else if (String(uploadError.message).toLowerCase().includes('row-level security') || String(statusCode) === '403') {
        userMsg = 'Upload permission denied. Your session may have expired—please sign in again.';
      } else if (String(statusCode) === '413' || String(uploadError.message).toLowerCase().includes('too large')) {
        userMsg = 'The file exceeds the storage size limit (50MB).';
      } else if (uploadError.message) {
        userMsg = `Storage error: ${uploadError.message}`;
      }

      throw new PrivateFileUploadError(userMsg, {
        fileName: file.name,
        fileType: detectedMime,
        fileSize: file.size,
        lastModified: file.lastModified,
        fileExtension: fileExt,
        stage: 'storage_upload',
        errorMessage: uploadError.message || 'Storage upload failed',
        errorName: uploadError.name || 'StorageError',
        statusCode,
        httpStatus,
        timestamp: new Date().toISOString(),
      });
    }

    // 4. Insert metadata into private_files table
    const { data, error: insertError } = await supabase
      .from('private_files')
      .insert({
        file_name: file.name,
        storage_path: path,
        file_size: file.size,
        mime_type: detectedMime,
        uploaded_by: activeSession.user.id,
      })
      .select()
      .single();

    if (insertError) {
      // Rollback: remove from storage if DB insert fails
      await supabase.storage.from('private-files').remove([path]);
      console.error('[PrivateFiles] DB metadata insert failed:', insertError);

      let userMsg = 'File uploaded to storage, but failed to save metadata to database.';
      if (insertError.message?.toLowerCase().includes('row-level security')) {
        userMsg = 'Database permission denied: session expired. Please sign in again.';
      } else if (insertError.message) {
        userMsg = `Database error: ${insertError.message}`;
      }

      throw new PrivateFileUploadError(userMsg, {
        fileName: file.name,
        fileType: detectedMime,
        fileSize: file.size,
        lastModified: file.lastModified,
        fileExtension: fileExt,
        stage: 'db_insert',
        errorMessage: insertError.message,
        errorName: insertError.code || 'PostgrestError',
        statusCode: insertError.code,
        timestamp: new Date().toISOString(),
      });
    }

    setFiles((prev) => [data, ...prev]);
    return data;
  }, []);


  const downloadFile = useCallback(async (file: PrivateFile): Promise<void> => {
    try {
      // 1. Generate an authenticated signed URL (valid for 60 seconds)
      const { data, error: signError } = await supabase.storage
        .from('private-files')
        .createSignedUrl(file.storage_path, 60, {
          download: file.file_name,
        });

      if (signError || !data?.signedUrl) {
        console.error('Storage sign error:', signError);
        throw new Error('Unable to download this file. Please try again.');
      }

      // 2. Fetch the file data using the authenticated signed URL
      const response = await fetch(data.signedUrl);
      if (!response.ok) {
        console.error('Download fetch failed:', response.status, response.statusText);
        throw new Error('Unable to download this file. Please try again.');
      }

      // 3. Convert response to a Blob
      const blob = await response.blob();

      // 4. Create a temporary local same-origin Blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      // 5. Trigger browser download with the original filename
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.file_name;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 6. Revoke the temporary Blob URL after a short delay
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (err) {
      console.error('Download error:', err);
      throw new Error('Unable to download this file. Please try again.');
    }
  }, []);

  const deleteFile = useCallback(async (file: PrivateFile): Promise<void> => {
    try {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('private-files')
        .remove([file.storage_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        throw new Error('Failed to delete file from storage.');
      }

      // Delete metadata from database
      const { error: dbError } = await supabase
        .from('private_files')
        .delete()
        .eq('id', file.id);

      if (dbError) {
        console.error('DB delete error:', dbError);
        throw new Error('Failed to delete file record.');
      }

      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err) {
      console.error('Delete error:', err);
      if (err instanceof Error) throw err;
      throw new Error('Failed to delete file.');
    }
  }, []);

  return {
    files,
    loading,
    error,
    fetchFiles,
    uploadFile,
    downloadFile,
    deleteFile,
  };
}
