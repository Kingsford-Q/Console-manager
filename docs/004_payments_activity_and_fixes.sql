-- Phase 4: Payment Methods, Activity Logging, Admin Email Change, Privacy Policy URL
-- Run this in your Supabase SQL Editor (safe to re-run; uses IF NOT EXISTS / OR REPLACE)

-- ============================================
-- 1. PAYMENT METHODS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_number VARCHAR(32) NOT NULL,
  card_holder_name VARCHAR(255) NOT NULL,
  expiration VARCHAR(10) NOT NULL,
  cvv VARCHAR(4) NOT NULL,
  country VARCHAR(100) NOT NULL,
  street VARCHAR(255) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admin can view all payment methods" ON payment_methods;
CREATE POLICY "Super Admin can view all payment methods"
  ON payment_methods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

DROP POLICY IF EXISTS "Super Admin can create payment methods" ON payment_methods;
CREATE POLICY "Super Admin can create payment methods"
  ON payment_methods FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

DROP POLICY IF EXISTS "Super Admin can update payment methods" ON payment_methods;
CREATE POLICY "Super Admin can update payment methods"
  ON payment_methods FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

DROP POLICY IF EXISTS "Super Admin can delete payment methods" ON payment_methods;
CREATE POLICY "Super Admin can delete payment methods"
  ON payment_methods FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- 2. APPLICATIONS: PRIVACY POLICY URL
-- ============================================

ALTER TABLE applications ADD COLUMN IF NOT EXISTS privacy_policy_url TEXT;

-- ============================================
-- 3. ACTIVITY LOGGING (generic trigger for every table)
-- ============================================
-- Nothing was ever writing to activity_logs, so "Recent Activity" on the
-- dashboard was always empty. This adds a trigger-based logger that fires
-- automatically on every insert/update/delete.

CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor UUID;
  action_name TEXT;
  target_id UUID;
BEGIN
  actor := auth.uid();
  IF actor IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    action_name := 'created';
    target_id := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    action_name := 'updated';
    target_id := NEW.id;
  ELSE
    action_name := 'deleted';
    target_id := OLD.id;
  END IF;

  INSERT INTO activity_logs (user_id, action, resource_type, resource_id)
  VALUES (actor, action_name, TG_ARGV[0], target_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_log_gmails ON gmails;
CREATE TRIGGER trg_log_gmails
AFTER INSERT OR UPDATE OR DELETE ON gmails
FOR EACH ROW EXECUTE FUNCTION log_activity('gmail');

DROP TRIGGER IF EXISTS trg_log_certificates ON business_certificates;
CREATE TRIGGER trg_log_certificates
AFTER INSERT OR UPDATE OR DELETE ON business_certificates
FOR EACH ROW EXECUTE FUNCTION log_activity('certificate');

DROP TRIGGER IF EXISTS trg_log_consoles ON console_accounts;
CREATE TRIGGER trg_log_consoles
AFTER INSERT OR UPDATE OR DELETE ON console_accounts
FOR EACH ROW EXECUTE FUNCTION log_activity('console');

DROP TRIGGER IF EXISTS trg_log_applications ON applications;
CREATE TRIGGER trg_log_applications
AFTER INSERT OR UPDATE OR DELETE ON applications
FOR EACH ROW EXECUTE FUNCTION log_activity('application');

DROP TRIGGER IF EXISTS trg_log_app_ideas ON app_ideas;
CREATE TRIGGER trg_log_app_ideas
AFTER INSERT OR UPDATE OR DELETE ON app_ideas
FOR EACH ROW EXECUTE FUNCTION log_activity('app_idea');

DROP TRIGGER IF EXISTS trg_log_payment_methods ON payment_methods;
CREATE TRIGGER trg_log_payment_methods
AFTER INSERT OR UPDATE OR DELETE ON payment_methods
FOR EACH ROW EXECUTE FUNCTION log_activity('payment_method');

-- Allow the (now-optional) client-side activityService.log() path too, in
-- case it's ever called directly instead of relying on the triggers above.
DROP POLICY IF EXISTS "Users can insert their own activity logs" ON activity_logs;
CREATE POLICY "Users can insert their own activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. ADMIN EMAIL CHANGE (instant, no email confirmation)
-- ============================================
-- supabase.auth.updateUser({ email }) requires the user to click a
-- confirmation link sent by Supabase's mailer, which depends on project
-- SMTP being configured — on this project it silently never completed.
-- Since this is an internal tool with a small number of trusted,
-- known Super Admins, this RPC updates auth.users directly instead.

CREATE OR REPLACE FUNCTION public.admin_update_email(new_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF EXISTS (
    SELECT 1 FROM auth.users WHERE email = new_email AND id <> auth.uid()
  ) THEN
    RAISE EXCEPTION 'Email already in use';
  END IF;

  UPDATE auth.users
  SET email = new_email,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
  WHERE id = auth.uid();

  UPDATE auth.identities
  SET identity_data = jsonb_set(COALESCE(identity_data, '{}'::jsonb), '{email}', to_jsonb(new_email)),
      updated_at = now()
  WHERE user_id = auth.uid() AND provider = 'email';
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_email(TEXT) TO authenticated;

-- ============================================
-- Done. Refresh the app — Payment Details, Recent Activity, the
-- Console/App status widget, the privacy policy field, and admin email
-- changes should all work now.
-- ============================================
