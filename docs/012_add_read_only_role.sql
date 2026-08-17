-- Phase 5: READ_ONLY role
-- Run this in your Supabase SQL Editor (safe to re-run)
--
-- Adds a second role, READ_ONLY, that can view every business table but
-- cannot insert/update/delete anything. Also fixes a standing gap from
-- 005_disable_profiles_rls.sql: RLS on `profiles` was left fully disabled,
-- so any authenticated user could read/write any profile row directly.
-- This re-enables it using the non-recursive is_super_admin() helper from
-- 004_fix_rls_recursion.sql, plus a trigger so a user can never change
-- their own `role` column even though they can update their own profile.

-- ============================================
-- 1. ALLOW THE NEW ROLE VALUE
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('SUPER_ADMIN', 'READ_ONLY'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION is_read_only()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'READ_ONLY'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. RE-ENABLE RLS ON PROFILES (was disabled in 005)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Super Admin can view all profiles" ON profiles;
CREATE POLICY "Super Admin can view all profiles"
  ON profiles FOR SELECT
  USING (is_super_admin());

-- A user can update their own row (e.g. full_name), but must never be able
-- to change their own role via the client SDK, only a Super Admin (or the
-- create-user edge function, which uses the service role key and bypasses
-- RLS entirely) can set role.
CREATE OR REPLACE FUNCTION prevent_role_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT is_super_admin() THEN
    RAISE EXCEPTION 'Only a Super Admin can change a user role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_self_escalation ON profiles;
CREATE TRIGGER trg_prevent_role_self_escalation
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION prevent_role_self_escalation();

-- ============================================
-- 3. LET READ_ONLY VIEW EVERY BUSINESS TABLE
-- ============================================
-- INSERT/UPDATE/DELETE policies are untouched (still Super-Admin-only).

DROP POLICY IF EXISTS "Super Admin can view all gmails" ON gmails;
CREATE POLICY "Super Admin can view all gmails"
  ON gmails FOR SELECT
  USING (is_super_admin() OR is_read_only());

DROP POLICY IF EXISTS "Super Admin can view all certificates" ON business_certificates;
CREATE POLICY "Super Admin can view all certificates"
  ON business_certificates FOR SELECT
  USING (is_super_admin() OR is_read_only());

DROP POLICY IF EXISTS "Super Admin can view all console accounts" ON console_accounts;
CREATE POLICY "Super Admin can view all console accounts"
  ON console_accounts FOR SELECT
  USING (is_super_admin() OR is_read_only());

DROP POLICY IF EXISTS "Super Admin can view all applications" ON applications;
CREATE POLICY "Super Admin can view all applications"
  ON applications FOR SELECT
  USING (is_super_admin() OR is_read_only());

DROP POLICY IF EXISTS "Super Admin can view all app ideas" ON app_ideas;
CREATE POLICY "Super Admin can view all app ideas"
  ON app_ideas FOR SELECT
  USING (is_super_admin() OR is_read_only());

DROP POLICY IF EXISTS "Super Admin can view all payment methods" ON payment_methods;
CREATE POLICY "Super Admin can view all payment methods"
  ON payment_methods FOR SELECT
  USING (is_super_admin() OR is_read_only());

DROP POLICY IF EXISTS "Super Admin can view all activity logs" ON activity_logs;
CREATE POLICY "Super Admin can view all activity logs"
  ON activity_logs FOR SELECT
  USING (is_super_admin() OR is_read_only());

-- ============================================
-- Done. READ_ONLY users can now sign in, see every business table, and
-- change their own email/password/name, but cannot create, edit, delete,
-- or change their own role.
-- ============================================
