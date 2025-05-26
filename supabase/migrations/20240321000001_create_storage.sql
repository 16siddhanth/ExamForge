-- Create a storage bucket for documents if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('documents', 'documents', false);
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;

-- For development purposes, we'll use a more permissive policy
-- since we're using a custom auth system
CREATE POLICY "Enable all operations for storage"
ON storage.objects
FOR ALL
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- Note: This configuration allows all operations for development
-- In production, you should either:
-- 1. Implement proper storage policies that work with your custom auth system
-- 2. Switch to using Supabase's built-in auth system 