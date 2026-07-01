-- Fix RLS Recursion Issue for Profiles Table
-- Run this in Supabase SQL Editor

-- Drop the problematic policies
DROP POLICY IF EXISTS "Super Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create a simpler approach - use user auth UID directly without recursion
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- For admin operations, we'll use a different approach
-- Create a helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'SUPER_ADMIN'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now use this function in the policies for other tables
-- For gmails table
DROP POLICY IF EXISTS "Super Admin can view all gmails" ON gmails;
DROP POLICY IF EXISTS "Super Admin can create gmails" ON gmails;
DROP POLICY IF EXISTS "Super Admin can update gmails" ON gmails;
DROP POLICY IF EXISTS "Super Admin can delete gmails" ON gmails;

CREATE POLICY "Super Admin can view all gmails"
  ON gmails FOR SELECT
  USING (is_super_admin());

CREATE POLICY "Super Admin can create gmails"
  ON gmails FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY "Super Admin can update gmails"
  ON gmails FOR UPDATE
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super Admin can delete gmails"
  ON gmails FOR DELETE
  USING (is_super_admin());

-- Same for business_certificates
DROP POLICY IF EXISTS "Super Admin can view all certificates" ON business_certificates;
DROP POLICY IF EXISTS "Super Admin can create certificates" ON business_certificates;
DROP POLICY IF EXISTS "Super Admin can update certificates" ON business_certificates;
DROP POLICY IF EXISTS "Super Admin can delete certificates" ON business_certificates;

CREATE POLICY "Super Admin can view all certificates"
  ON business_certificates FOR SELECT
  USING (is_super_admin());

CREATE POLICY "Super Admin can create certificates"
  ON business_certificates FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY "Super Admin can update certificates"
  ON business_certificates FOR UPDATE
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super Admin can delete certificates"
  ON business_certificates FOR DELETE
  USING (is_super_admin());

-- Same for console_accounts
DROP POLICY IF EXISTS "Super Admin can view all console accounts" ON console_accounts;
DROP POLICY IF EXISTS "Super Admin can create console accounts" ON console_accounts;
DROP POLICY IF EXISTS "Super Admin can update console accounts" ON console_accounts;
DROP POLICY IF EXISTS "Super Admin can delete console accounts" ON console_accounts;

CREATE POLICY "Super Admin can view all console accounts"
  ON console_accounts FOR SELECT
  USING (is_super_admin());

CREATE POLICY "Super Admin can create console accounts"
  ON console_accounts FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY "Super Admin can update console accounts"
  ON console_accounts FOR UPDATE
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super Admin can delete console accounts"
  ON console_accounts FOR DELETE
  USING (is_super_admin());

-- Same for applications
DROP POLICY IF EXISTS "Super Admin can view all applications" ON applications;
DROP POLICY IF EXISTS "Super Admin can create applications" ON applications;
DROP POLICY IF EXISTS "Super Admin can update applications" ON applications;
DROP POLICY IF EXISTS "Super Admin can delete applications" ON applications;

CREATE POLICY "Super Admin can view all applications"
  ON applications FOR SELECT
  USING (is_super_admin());

CREATE POLICY "Super Admin can create applications"
  ON applications FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY "Super Admin can update applications"
  ON applications FOR UPDATE
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super Admin can delete applications"
  ON applications FOR DELETE
  USING (is_super_admin());

-- Same for app_ideas
DROP POLICY IF EXISTS "Super Admin can view all app ideas" ON app_ideas;
DROP POLICY IF EXISTS "Super Admin can create app ideas" ON app_ideas;
DROP POLICY IF EXISTS "Super Admin can update app ideas" ON app_ideas;
DROP POLICY IF EXISTS "Super Admin can delete app ideas" ON app_ideas;

CREATE POLICY "Super Admin can view all app ideas"
  ON app_ideas FOR SELECT
  USING (is_super_admin());

CREATE POLICY "Super Admin can create app ideas"
  ON app_ideas FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY "Super Admin can update app ideas"
  ON app_ideas FOR UPDATE
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super Admin can delete app ideas"
  ON app_ideas FOR DELETE
  USING (is_super_admin());

-- Same for activity_logs
DROP POLICY IF EXISTS "Super Admin can view all activity logs" ON activity_logs;

CREATE POLICY "Super Admin can view all activity logs"
  ON activity_logs FOR SELECT
  USING (is_super_admin());

-- Verify the function was created
SELECT * FROM pg_proc WHERE proname = 'is_super_admin';
