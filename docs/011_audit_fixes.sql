-- Phase 11: Audit fixes — correct review clocks + ensure status history exists
-- Run this in your Supabase SQL Editor (safe to re-run)
--
-- Findings from the full audit:
--
-- 1. DATA FIX — "Days in Review" counting from the wrong date.
--    Migration 010 backfilled review_started_at from updated_at, but
--    updated_at moves every time a row is edited, so all 5 under-review
--    apps show ~3d instead of counting from when they were actually
--    submitted (created). Bible Quiz & Color Picker Pro were backdated to
--    2026-06-29 and should show ~6d. Since every current under-review app
--    was created directly into review, review really started at creation.
--
-- 2. SCHEMA CHECK — status history tables (migration 007).
--    Migration 006 turned out never to have run on this database, so 007
--    may be missing too. If it is, the "History" (clock) button on the
--    Consoles and Applications pages fails when clicked. Everything below
--    is idempotent, so running it when 007 IS already installed changes
--    nothing. Note 007's console trigger reads OLD.created_at, which only
--    exists since migration 010 — another reason to (re)apply it now.

-- ============================================
-- 1. Review clock: count from creation for apps sitting in review
-- ============================================

UPDATE applications
SET review_started_at = created_at
WHERE status = 'under_review';

-- Sanity check: expect Bible Quiz / Color Picker Pro to show 2026-06-29,
-- and days_elapsed to be days since each app's created_at.
SELECT app_name, status, created_at, review_started_at,
       FLOOR(EXTRACT(EPOCH FROM (now() - review_started_at)) / 86400) AS days_elapsed
FROM applications
WHERE status = 'under_review'
ORDER BY app_name;

-- ============================================
-- 2. Status history tables + triggers (from migration 007, idempotent)
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
      state_started_at := COALESCE(OLD.created_at, OLD.updated_at, now());
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
      state_started_at := COALESCE(OLD.created_at, OLD.updated_at, now());
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
-- Done. Under-review apps now count Days in Review from their creation
-- date (Bible Quiz / Color Picker Pro from 2026-06-29), and the History
-- button on Consoles/Applications is guaranteed to have its tables and
-- triggers in place.
-- ============================================
