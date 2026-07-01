-- Temporary Fix: Disable RLS on profiles table
-- This allows profile loading to work while we keep other tables protected

-- Disable RLS on profiles table temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';
