-- ============================================
-- CopyIt V1 — Private Files Migration
-- Run this in the Supabase SQL Editor AFTER the initial setup
-- ============================================

-- 1. Create the private_files table (completely separate from documents)
CREATE TABLE IF NOT EXISTS private_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid()
);

-- 2. Create index for fast file lookups
CREATE INDEX IF NOT EXISTS idx_private_files_created_at ON private_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_files_uploaded_by ON private_files(uploaded_by);

-- 3. Grant table-level privileges to Supabase roles
-- IMPORTANT: anon role gets NO access to private_files (no public access)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.private_files TO authenticated;
-- Do NOT grant any access to anon for private_files

-- 4. Enable Row Level Security
ALTER TABLE private_files ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policy: Only authenticated admin can read private files
CREATE POLICY "Authenticated admin can select private files"
  ON private_files
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 6. RLS Policy: Only authenticated admin can insert private files
CREATE POLICY "Authenticated admin can insert private files"
  ON private_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (uploaded_by = auth.uid() OR uploaded_by IS NULL)
  );

-- 7. RLS Policy: Only authenticated admin can update private files
CREATE POLICY "Authenticated admin can update private files"
  ON private_files
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 8. RLS Policy: Only authenticated admin can delete private files
CREATE POLICY "Authenticated admin can delete private files"
  ON private_files
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 9. Create updated_at trigger for private_files (reuses existing function)
DROP TRIGGER IF EXISTS set_updated_at_private_files ON private_files;
CREATE TRIGGER set_updated_at_private_files
  BEFORE UPDATE ON private_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Private Files Storage Bucket Setup
-- ============================================

-- 10. Create 'private-files' storage bucket
-- NOTE: You may need to create this via the Supabase Dashboard instead:
--   1. Go to Storage in the Supabase dashboard
--   2. Click "New Bucket"
--   3. Name it "private-files"
--   4. Set it to PRIVATE (NOT public)
--   5. Leave all other defaults

INSERT INTO storage.buckets (id, name, public)
VALUES ('private-files', 'private-files', false)
ON CONFLICT (id) DO NOTHING;

-- 11. Storage RLS Policies for 'private-files' bucket
-- IMPORTANT: These policies ensure ONLY authenticated users can access files

-- Allow authenticated users to upload files to private-files bucket
CREATE POLICY "Auth users can upload to private-files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'private-files');

-- Allow authenticated users to read/download files from private-files bucket
CREATE POLICY "Auth users can read from private-files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'private-files');

-- Allow authenticated users to update files in private-files bucket
CREATE POLICY "Auth users can update in private-files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'private-files');

-- Allow authenticated users to delete files from private-files bucket
CREATE POLICY "Auth users can delete from private-files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'private-files');

-- ============================================
-- SECURITY VERIFICATION
-- ============================================
-- After running this migration, verify:
-- 1. The 'private-files' bucket is PRIVATE (not public)
-- 2. No anon policies exist for private_files table
-- 3. No anon policies exist for private-files bucket
-- 4. The existing 'documents' bucket and table remain unchanged
-- 5. Public users can still read published documents
