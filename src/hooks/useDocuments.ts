import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Document, DocumentInsert, DocumentUpdate } from '../types';

/**
 * Hook to fetch the currently published document (for public use)
 */
export function usePublishedDocument() {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPublished = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('is_published', true)
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setDocument(data);
    } catch (err) {
      console.error('Error fetching published document:', err);
      setError('Unable to load the document. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublished();
  }, [fetchPublished]);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('public-documents')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: 'is_published=eq.true',
        },
        () => {
          // Refetch when any change happens to published documents
          fetchPublished();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'documents',
        },
        (payload) => {
          // Also listen for unpublish events
          if (payload.old && (payload.old as Document).is_published && !(payload.new as Document).is_published) {
            fetchPublished();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPublished]);

  return { document, loading, error, refetch: fetchPublished };
}

/**
 * Hook for admin document management
 */
export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const createDocument = useCallback(async (doc: DocumentInsert): Promise<Document | null> => {
    try {
      let createdBy = doc.created_by;
      if (!createdBy) {
        const { data: { user } } = await supabase.auth.getUser();
        createdBy = user?.id || null;
      }

      const payload = {
        ...doc,
        created_by: createdBy,
      };

      const { data, error } = await supabase
        .from('documents')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      setDocuments((prev) => [data, ...prev]);
      return data;
    } catch (err: any) {
      console.error('Error creating document:', err);
      throw new Error(err?.message || 'Failed to create document.');
    }
  }, []);

  const updateDocument = useCallback(async (id: string, updates: DocumentUpdate): Promise<Document | null> => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setDocuments((prev) => prev.map((d) => (d.id === id ? data : d)));
      return data;
    } catch (err) {
      console.error('Error updating document:', err);
      throw new Error('Failed to update document.');
    }
  }, []);

  const publishDocument = useCallback(async (id: string): Promise<void> => {
    try {
      // First unpublish all
      await supabase
        .from('documents')
        .update({ is_published: false, published_at: null })
        .eq('is_published', true);

      // Then publish the selected one
      const { error } = await supabase
        .from('documents')
        .update({ is_published: true, published_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      await fetchDocuments();
    } catch (err) {
      console.error('Error publishing document:', err);
      throw new Error('Failed to publish document.');
    }
  }, [fetchDocuments]);

  const unpublishDocument = useCallback(async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ is_published: false, published_at: null })
        .eq('id', id);

      if (error) throw error;

      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, is_published: false, published_at: null } : d))
      );
    } catch (err) {
      console.error('Error unpublishing document:', err);
      throw new Error('Failed to unpublish document.');
    }
  }, []);

  const deleteDocument = useCallback(async (id: string): Promise<void> => {
    try {
      // Find the document to get storage path
      const doc = documents.find((d) => d.id === id);

      // Delete from storage if applicable
      if (doc?.storage_path) {
        await supabase.storage.from('documents').remove([doc.storage_path]);
      }

      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error('Error deleting document:', err);
      throw new Error('Failed to delete document.');
    }
  }, [documents]);

  const getDocument = useCallback(async (id: string): Promise<Document | null> => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching document:', err);
      return null;
    }
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `uploads/${timestamp}_${safeName}`;

    const { error } = await supabase.storage
      .from('documents')
      .upload(path, file);

    if (error) throw new Error('Failed to upload file.');

    return path;
  }, []);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    createDocument,
    updateDocument,
    publishDocument,
    unpublishDocument,
    deleteDocument,
    getDocument,
    uploadFile,
  };
}
