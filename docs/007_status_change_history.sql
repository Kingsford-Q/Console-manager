-- Phase 7: Full status-change history for console accounts & applications
-- Run this in your Supabase SQL Editor (safe to re-run; uses IF NOT EXISTS / OR REPLACE guards)
--
-- What this adds:
--   Every time a console_account or application's status changes, a row is
--   logged recording: what it changed from, what it changed to, when the
--   PREVIOUS state started (the last time it changed, or created_at if
--   this is its first ever transition), when it changed this time, and
--   how many days it spent in that previous state. This gives a full
--   timeline per console/app, not just the single in_review/under_review
--   snapshot columns added in migration 006.

-- ============================================
-- 1. HISTORY TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS console_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  console_id UUID NOT NULL REFERENCES console_accounts(id) ON DELETE CASCADE,
  from_status VARCHAR(50) NOT NULL,
  to_status VARCHAR(50) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_days INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_console_status_history_console_id ON console_status_history(console_id);
CREATE INDEX IF NOT EXISTS idx_console_status_history_changed_at ON console_status_history(changed_at DESC);

ALTER TABLE console_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admin can view all console status history" ON console_status_history;
CREATE POLICY "Super Admin can view all console status history"
  ON console_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE TABLE IF NOT EXISTS application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  from_status VARCHAR(50) NOT NULL,
  to_status VARCHAR(50) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_days INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_application_status_history_application_id ON application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_application_status_history_changed_at ON application_status_history(changed_at DESC);

ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admin can view all application status history" ON application_status_history;
CREATE POLICY "Super Admin can view all application status history"
  ON application_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- 2. TRIGGERS: log every status change, with duration since the last one
-- ============================================
-- SECURITY DEFINER (owned by the migration runner, same as log_activity()
-- in migration 004) so the insert isn't blocked by RLS regardless of which
-- authenticated user performs the status update.

CREATE OR REPLACE FUNCTION log_console_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  state_started_at TIMESTAMP WITH TIME ZONE;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT changed_at INTO state_started_at
    FROM console_status_history
    WHERE console_id = NEW.id
    ORDER BY changed_at DESC
    LIMIT 1;

    IF state_started_at IS NULL THEN
      state_started_at := OLD.created_at;
    END IF;

    INSERT INTO console_status_history (console_id, from_status, to_status, started_at, changed_at, duration_days)
    VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      state_started_at,
      now(),
      GREATEST(0, ROUND(EXTRACT(EPOCH FROM (now() - state_started_at)) / 86400)::INTEGER)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_console_status_change ON console_accounts;
CREATE TRIGGER trg_log_console_status_change
AFTER UPDATE ON console_accounts
FOR EACH ROW EXECUTE FUNCTION log_console_status_change();

CREATE OR REPLACE FUNCTION log_application_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  state_started_at TIMESTAMP WITH TIME ZONE;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT changed_at INTO state_started_at
    FROM application_status_history
    WHERE application_id = NEW.id
    ORDER BY changed_at DESC
    LIMIT 1;

    IF state_started_at IS NULL THEN
      state_started_at := OLD.created_at;
    END IF;

    INSERT INTO application_status_history (application_id, from_status, to_status, started_at, changed_at, duration_days)
    VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      state_started_at,
      now(),
      GREATEST(0, ROUND(EXTRACT(EPOCH FROM (now() - state_started_at)) / 86400)::INTEGER)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_application_status_change ON applications;
CREATE TRIGGER trg_log_application_status_change
AFTER UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION log_application_status_change();

-- ============================================
-- 3. REALTIME: let a history view update live too
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'console_status_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE console_status_history;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'application_status_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE application_status_history;
  END IF;
END $$;

-- ============================================
-- Done. Every status change on a console account or application is now
-- logged with how long it spent in its previous state (measured from the
-- last status change, or from created_at if this is its first-ever
-- transition). Query console_status_history / application_status_history
-- directly, or use the "History" view added to the Consoles/Applications
-- pages.
-- ============================================
