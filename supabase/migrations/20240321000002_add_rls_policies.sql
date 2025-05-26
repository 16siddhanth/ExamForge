-- Enable RLS on tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- For development purposes, we'll use a more permissive policy
-- since we're using a custom auth system
-- In production, you should implement proper RLS policies that work with your auth system

-- Documents table policies
CREATE POLICY "Enable all operations for documents"
ON documents
FOR ALL
USING (true)
WITH CHECK (true);

-- Questions table policies
CREATE POLICY "Enable all operations for questions"
ON questions
FOR ALL
USING (true)
WITH CHECK (true);

-- Note: This configuration allows all operations for development
-- In production, you should either:
-- 1. Implement proper RLS policies that work with your custom auth system
-- 2. Switch to using Supabase's built-in auth system 