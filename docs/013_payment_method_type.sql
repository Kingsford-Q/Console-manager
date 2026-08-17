-- Phase 6: Bank transfer as a second payment method type
-- Run this in your Supabase SQL Editor (safe to re-run)
--
-- payment_methods used to be card-only. This adds a `type` discriminator
-- ('card' | 'bank') plus the two bank-specific columns, and makes the
-- card-only columns optional so a bank row doesn't need them.

ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'card';
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS account_number VARCHAR(64);

ALTER TABLE payment_methods ALTER COLUMN card_number DROP NOT NULL;
ALTER TABLE payment_methods ALTER COLUMN expiration DROP NOT NULL;
ALTER TABLE payment_methods ALTER COLUMN cvv DROP NOT NULL;
ALTER TABLE payment_methods ALTER COLUMN street DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_methods_type_check'
  ) THEN
    ALTER TABLE payment_methods ADD CONSTRAINT payment_methods_type_check CHECK (type IN ('card', 'bank'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_methods_type_fields_check'
  ) THEN
    ALTER TABLE payment_methods ADD CONSTRAINT payment_methods_type_fields_check CHECK (
      (type = 'card' AND card_number IS NOT NULL AND expiration IS NOT NULL AND cvv IS NOT NULL AND street IS NOT NULL)
      OR
      (type = 'bank' AND bank_name IS NOT NULL AND account_number IS NOT NULL)
    );
  END IF;
END $$;

-- ============================================
-- Done. Existing rows already satisfy the card branch of the check
-- (type defaults to 'card' and all four card columns were NOT NULL
-- before this migration), so nothing needs to be backfilled.
-- ============================================
