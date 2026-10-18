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

export interface DeleteAllResult {
  deletedCount: number;
  failedCount: number;
  error?: string;
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

  const deleteAllFiles = useCallback(
    async (onProgress?: (deleted: number, total: number) => void): Promise<DeleteAllResult> => {
      // 1. Fetch all records from database, handling pagination if there are >1000 records
      let allRecords: PrivateFile[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      try {
        while (hasMore) {
          const { data, error: fetchErr } = await supabase
            .from('private_files')
            .select('*')
            .order('created_at', { ascending: false })
            .range(from, from + pageSize - 1);

          if (fetchErr) {
            console.error('[PrivateFiles] Error fetching files for bulk delete:', fetchErr);
            throw new Error(fetchErr.message || 'Failed to list files for deletion.');
          }

          if (data && data.length > 0) {
            allRecords = allRecords.concat(data);
            if (data.length < pageSize) {
              hasMore = false;
            } else {
              from += pageSize;
            }
          } else {
            hasMore = false;
          }
        }
      } catch (err) {
        console.error('[PrivateFiles] Listing files failed:', err);
        const msg = err instanceof Error ? err.message : 'Failed to query file records.';
        return { deletedCount: 0, failedCount: 0, error: msg };
      }

      if (allRecords.length === 0) {
        return { deletedCount: 0, failedCount: 0 };
      }

      const total = allRecords.length;
      let deletedCount = 0;
      let failedCount = 0;
      let lastError: string | undefined;

      // 2. Discover existing objects in Supabase Storage to avoid blindly retrying
      // storage deletion for objects whose storage files were already removed in a prior attempt
      const existingStoragePaths = new Set<string>();
      let canListStorage = false;

      try {
        // Collect all distinct folder prefixes represented in allRecords
        const distinctFolders = Array.from(
          new Set(
            allRecords.map((f) =>
              f.storage_path && f.storage_path.includes('/')
                ? f.storage_path.substring(0, f.storage_path.lastIndexOf('/'))
                : ''
            )
          )
        );

        for (const folder of distinctFolders) {
          let offset = 0;
          const limit = 1000;
          let hasMoreStorage = true;

          while (hasMoreStorage) {
            const { data: storageList, error: listErr } = await supabase.storage
              .from('private-files')
              .list(folder, { limit, offset });

            if (listErr) {
              console.warn(`[PrivateFiles] Could not list bucket folder "${folder}":`, listErr);
              break;
            }

            if (storageList && storageList.length > 0) {
              for (const item of storageList) {
                if (item.id !== null) {
                  const fullPath = folder ? `${folder}/${item.name}` : item.name;
                  existingStoragePaths.add(fullPath);
                }
              }
              if (storageList.length < limit) {
                hasMoreStorage = false;
              } else {
                offset += limit;
              }
            } else {
              hasMoreStorage = false;
            }
          }
        }
        canListStorage = true;
      } catch (listErr) {
        console.warn('[PrivateFiles] Storage listing failed, falling back to direct removal:', listErr);
        canListStorage = false;
      }

      // 3. Batch remove in safe chunks of 50 to respect Supabase Storage API limits
      const BATCH_SIZE = 50;
      for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
        const batch = allRecords.slice(i, i + BATCH_SIZE);
        let validIdsForDbDelete: string[] = [];

        if (canListStorage) {
          const filesNeedingStorageRemoval: PrivateFile[] = [];
          const filesAlreadyRemovedFromStorage: PrivateFile[] = [];

          for (const file of batch) {
            if (file.storage_path && existingStoragePaths.has(file.storage_path)) {
              filesNeedingStorageRemoval.push(file);
            } else {
              // The object is already gone from storage (e.g. from a prior run where DB delete failed).
              // Avoid blindly retrying storage removal.
              filesAlreadyRemovedFromStorage.push(file);
            }
          }

          const pathsToRemoveFromStorage = filesNeedingStorageRemoval
            .map((f) => f.storage_path)
            .filter(Boolean);

          if (pathsToRemoveFromStorage.length > 0) {
            const { error: storageErr } = await supabase.storage
              .from('private-files')
              .remove(pathsToRemoveFromStorage);

            if (storageErr) {
              console.error('[PrivateFiles] Storage bulk remove batch error:', storageErr);
              failedCount += filesNeedingStorageRemoval.length;
              lastError = storageErr.message || 'Storage deletion failed';
            } else {
              validIdsForDbDelete.push(...filesNeedingStorageRemoval.map((f) => f.id));
            }
          }

          // Files already removed from storage can safely proceed to metadata record deletion
          validIdsForDbDelete.push(...filesAlreadyRemovedFromStorage.map((f) => f.id));
        } else {
          // Fallback if list was unavailable: remove all batch paths directly
          const batchPaths = batch.map((f) => f.storage_path).filter(Boolean);
          const { error: storageErr } = await supabase.storage
            .from('private-files')
            .remove(batchPaths);

          if (storageErr) {
            console.error('[PrivateFiles] Storage bulk remove batch error:', storageErr);
            failedCount += batch.length;
            lastError = storageErr.message || 'Storage deletion failed';
            continue;
          } else {
            validIdsForDbDelete = batch.map((f) => f.id);
          }
        }

        if (validIdsForDbDelete.length === 0) {
          continue;
        }

        // Delete metadata records from database for all objects verified as removed from storage
        const { error: dbErr } = await supabase
          .from('private_files')
          .delete()
          .in('id', validIdsForDbDelete);

        if (dbErr) {
          console.error('[PrivateFiles] DB metadata batch delete error:', dbErr);
          failedCount += validIdsForDbDelete.length;
          lastError = dbErr.message
            ? `Storage objects removed, but metadata records could not be deleted: ${dbErr.message}`
            : 'Storage objects removed, but database metadata could not be deleted.';
        } else {
          deletedCount += validIdsForDbDelete.length;
          // Progressively update in-memory files
          setFiles((prev) => prev.filter((f) => !validIdsForDbDelete.includes(f.id)));
          onProgress?.(deletedCount, total);
        }
      }

      // 4. Final refresh from database to ensure exact sync
      await fetchFiles();

      return {
        deletedCount,
        failedCount,
        error: lastError,
      };
    },
    [fetchFiles]
  );

  return {
    files,
    loading,
    error,
    fetchFiles,
    uploadFile,
    downloadFile,
    deleteFile,
    deleteAllFiles,
  };
}
