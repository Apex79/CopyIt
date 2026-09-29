-- ============================================
-- CopyIt - Supabase Database Setup
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Create the documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  content_type TEXT NOT NULL DEFAULT 'html' CHECK (content_type IN ('html', 'markdown', 'plain_text')),
  file_name TEXT,
  file_type TEXT,
  storage_path TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid()
);

-- 2. Create index for fast published document lookup
CREATE INDEX IF NOT EXISTS idx_documents_published ON documents(is_published) WHERE is_published = true;

-- 3. Grant schema and table-level privileges to Supabase roles
-- Without these grants, PostgreSQL rejects operations before RLS is even checked (error 42501).
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.documents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;

-- 4. Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policy: Anyone (anon) can read published documents only
CREATE POLICY "Public can read published documents"
  ON documents
  FOR SELECT
  TO anon
  USING (is_published = true);

-- 6. RLS Policy: Authenticated administrator can read all documents
CREATE POLICY "Authenticated admin can select documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 7. RLS Policy: Authenticated administrator can insert documents
CREATE POLICY "Authenticated admin can insert documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (created_by = auth.uid() OR created_by IS NULL)
  );

-- 8. RLS Policy: Authenticated administrator can update documents
CREATE POLICY "Authenticated admin can update documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 9. RLS Policy: Authenticated administrator can delete documents
CREATE POLICY "Authenticated admin can delete documents"
  ON documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 10. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS set_updated_at ON documents;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 12. Create function to ensure only one published document at a time
CREATE OR REPLACE FUNCTION ensure_single_published()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_published = true THEN
    UPDATE documents 
    SET is_published = false, published_at = NULL 
    WHERE id != NEW.id AND is_published = true;
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 13. Create trigger for single published document
DROP TRIGGER IF EXISTS single_published_document ON documents;
CREATE TRIGGER single_published_document
  BEFORE UPDATE ON documents
  FOR EACH ROW
  WHEN (NEW.is_published = true AND OLD.is_published = false)
  EXECUTE FUNCTION ensure_single_published();

-- Also handle INSERT with is_published = true
DROP TRIGGER IF EXISTS single_published_document_insert ON documents;
CREATE TRIGGER single_published_document_insert
  BEFORE INSERT ON documents
  FOR EACH ROW
  WHEN (NEW.is_published = true)
  EXECUTE FUNCTION ensure_single_published();

-- 14. Enable Realtime for documents table
ALTER PUBLICATION supabase_realtime ADD TABLE documents;

-- ============================================
-- Storage Setup
-- ============================================

-- 15. Create storage bucket (run this separately or via Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('documents', 'documents', false)
-- ON CONFLICT (id) DO NOTHING;

-- Note: Create the 'documents' storage bucket via Supabase Dashboard:
-- 1. Go to Storage in the Supabase dashboard
-- 2. Click "New Bucket"
-- 3. Name it "documents"
-- 4. Set it to private (not public)

-- 16. Storage RLS Policies (run after creating the bucket)
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to read files
CREATE POLICY "Authenticated users can read files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');
