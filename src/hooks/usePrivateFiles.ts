import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { PrivateFile } from '../types';

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
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `private/${timestamp}_${safeName}`;

    // Upload to Supabase Storage (private-files bucket)
    const { error: uploadError } = await supabase.storage
      .from('private-files')
      .upload(path, file);

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error('Failed to upload file to storage.');
    }

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    // Insert metadata into private_files table
    const { data, error: insertError } = await supabase
      .from('private_files')
      .insert({
        file_name: file.name,
        storage_path: path,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        uploaded_by: user?.id || null,
      })
      .select()
      .single();

    if (insertError) {
      // Rollback: remove from storage if DB insert fails
      await supabase.storage.from('private-files').remove([path]);
      console.error('DB insert error:', insertError);
      throw new Error('Failed to save file metadata.');
    }

    setFiles((prev) => [data, ...prev]);
    return data;
  }, []);

  const downloadFile = useCallback(async (file: PrivateFile): Promise<void> => {
    try {
      // Generate a signed URL (valid for 60 seconds)
      const { data, error: signError } = await supabase.storage
        .from('private-files')
        .createSignedUrl(file.storage_path, 60);

      if (signError || !data?.signedUrl) {
        throw new Error('Failed to generate download link.');
      }

      // Trigger browser download
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = file.file_name;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      throw new Error('Failed to download file. Please try again.');
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
