-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own subjects" ON subjects;
DROP POLICY IF EXISTS "Users can insert their own subjects" ON subjects;
DROP POLICY IF EXISTS "Users can update their own subjects" ON subjects;

DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;

DROP POLICY IF EXISTS "Users can view their own questions" ON questions;
DROP POLICY IF EXISTS "Users can insert their own questions" ON questions;

DROP POLICY IF EXISTS "Users can view their own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can insert their own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can update their own quizzes" ON quizzes;

DROP POLICY IF EXISTS "Users can view their own quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Users can insert their own quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Users can update their own quiz questions" ON quiz_questions;

-- Create temporary development policies that allow all operations
-- This is necessary because we're using a custom auth system

-- subjects table
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for subjects"
  ON subjects
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for documents"
  ON documents
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- questions table
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for questions"
  ON questions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- quizzes table
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for quizzes"
  ON quizzes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- quiz_questions table
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for quiz_questions"
  ON quiz_questions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Note: This configuration allows all operations for development
-- In production, you should implement proper RLS policies that work with your custom auth system
-- or switch to using Supabase's built-in auth system 