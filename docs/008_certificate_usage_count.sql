-- Phase 8: Certificate usage count
-- Run this in your Supabase SQL Editor (safe to re-run; uses IF NOT EXISTS / OR REPLACE guards)
--
-- Adds a persisted `times_used` counter to business_certificates — how many
-- times that certificate has ever been used to create a console account.
-- Unlike the existing "Usage" badge on the Certificates page (which counts
-- currently-linked console_accounts live, and drops if one is deleted),
-- this is a running historical total that only ever goes up.

-- ============================================
-- 1. NEW COLUMN
-- ============================================

ALTER TABLE business_certificates ADD COLUMN IF NOT EXISTS times_used INTEGER NOT NULL DEFAULT 0;

-- ============================================
-- 2. BACKFILL: seed historical usage counts
-- ============================================

-- Matched by substring (case-insensitive) since the stored business_name is
-- the full legal name (e.g. "SUNBURY AUTO REPAIR LTD", "THE RED ROAMER LTD",
-- "EURO UK SHOPPING LIMITED", "Odunaike Holdings LLC") rather than the short
-- name — an exact match against the short name silently updates 0 rows.
UPDATE business_certificates SET times_used = 4 WHERE business_name ILIKE '%sunbury auto repair%';
UPDATE business_certificates SET times_used = 5 WHERE business_name ILIKE '%sushi dragon%';
UPDATE business_certificates SET times_used = 3 WHERE business_name ILIKE '%red roamer%';
UPDATE business_certificates SET times_used = 1 WHERE business_name ILIKE '%euro uk%';
UPDATE business_certificates SET times_used = 1 WHERE business_name ILIKE '%odunaike%';

-- Sanity check: run this after the updates above and confirm all 5 rows show
-- up with the expected count. If a business_name doesn't match exactly
-- (extra whitespace, different casing, etc.) its row simply won't appear
-- here with a nonzero value — go back and fix the name in the UPDATE above.
SELECT business_name, times_used FROM business_certificates ORDER BY business_name;

-- ============================================
-- 3. AUTO-INCREMENT going forward
-- ============================================
-- Every time a new console account is created against a certificate, bump
-- its times_used by 1, so this count keeps itself accurate without any
-- more manual UPDATE statements.

CREATE OR REPLACE FUNCTION increment_certificate_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE business_certificates
  SET times_used = times_used + 1
  WHERE id = NEW.certificate_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_certificate_usage ON console_accounts;
CREATE TRIGGER trg_increment_certificate_usage
AFTER INSERT ON console_accounts
FOR EACH ROW EXECUTE FUNCTION increment_certificate_usage();

-- ============================================
-- Done. business_certificates.times_used now holds the historical usage
-- count, seeded from your existing numbers and auto-incrementing on every
-- new console account from now on.
-- ============================================
