-- Phase 2: Database Schema Setup for Supabase
-- Run these migrations in your Supabase SQL Editor

-- ============================================
-- 1. PROFILES TABLE (Linked to auth.users)
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'SUPER_ADMIN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Super Admin can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- 2. GMAILS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS gmails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_address VARCHAR(255) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  recovery_email VARCHAR(255),
  recovery_phone VARCHAR(20),
  status VARCHAR(50) NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'used')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gmails_status ON gmails(status);
CREATE INDEX idx_gmails_gmail_address ON gmails(gmail_address);

ALTER TABLE gmails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin can view all gmails"
  ON gmails FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super Admin can create gmails"
  ON gmails FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super Admin can update gmails"
  ON gmails FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super Admin can delete gmails"
  ON gmails FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- 3. BUSINESS CERTIFICATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS business_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  registration_number VARCHAR(255) NOT NULL,
  certificate_number VARCHAR(255) NOT NULL UNIQUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_business_certificates_business_name ON business_certificates(business_name);

ALTER TABLE business_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin can view all certificates"
  ON business_certificates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super Admin can create certificates"
  ON business_certificates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super Admin can update certificates"
  ON business_certificates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super Admin can delete certificates"
  ON business_certificates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- 4. CONSOLE ACCOUNTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS console_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  console_name VARCHAR(255) NOT NULL,
  gmail_id UUID NOT NULL UNIQUE REFERENCES gmails(id) ON DELETE RESTRICT,
  certificate_id UUID NOT NULL REFERENCES business_certificates(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending_payment' CHECK (
    status IN ('pending_payment', 'pending_verification', 'approved', 'suspended', 'closed', 'rejected')
  ),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_console_accounts_gmail_id ON console_accounts(gmail_id);
CREATE INDEX idx_console_accounts_certificate_id ON console_accounts(certificate_id);
CREATE INDEX idx_console_accounts_status ON console_accounts(status);

ALTER TABLE console_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin can view all console accounts"
  ON console_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super Admin can create console accounts"
  ON console_accounts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super Admin can update console accounts"
  ON console_accounts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super Admin can delete console accounts"
  ON console_accounts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- 5. APPLICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  console_id UUID NOT NULL REFERENCES console_accounts(id) ON DELETE CASCADE,
  app_name VARCHAR(255) NOT NULL,
  package_name VARCHAR(255) NOT NULL,
  short_description TEXT NOT NULL,
  full_description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  version VARCHAR(50) NOT NULL,
  release_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'development' CHECK (
    status IN ('idea', 'development', 'internal_testing', 'closed_testing', 'open_testing', 'under_review', 'production', 'suspended', 'removed')
  ),
  app_icon_url TEXT,
  screenshots TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_applications_console_id ON applications(console_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_package_name ON applications(package_name);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin can view all applications"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super Admin can create applications"
  ON applications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super Admin can update applications"
  ON applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super Admin can delete applications"
  ON applications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- 6. APP IDEAS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS app_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  estimated_complexity VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (estimated_complexity IN ('low', 'medium', 'high')),
  status VARCHAR(50) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'implemented', 'archived')),
  notes TEXT,
  converted_app_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_app_ideas_status ON app_ideas(status);
CREATE INDEX idx_app_ideas_priority ON app_ideas(priority);

ALTER TABLE app_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin can view all app ideas"
  ON app_ideas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super Admin can create app ideas"
  ON app_ideas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super Admin can update app ideas"
  ON app_ideas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super Admin can delete app ideas"
  ON app_ideas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- 7. ACTIVITY LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_resource_type ON activity_logs(resource_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin can view all activity logs"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- 8. FUNCTION: Update Gmail Status on Console Creation
-- ============================================

CREATE OR REPLACE FUNCTION update_gmail_status_on_console_create()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE gmails
  SET status = 'used'
  WHERE id = NEW.gmail_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gmail_status
AFTER INSERT ON console_accounts
FOR EACH ROW
EXECUTE FUNCTION update_gmail_status_on_console_create();

-- ============================================
-- 9. FUNCTION: Reset Gmail Status on Console Delete
-- ============================================

CREATE OR REPLACE FUNCTION reset_gmail_status_on_console_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE gmails
  SET status = 'unused'
  WHERE id = OLD.gmail_id
  AND NOT EXISTS (
    SELECT 1 FROM console_accounts WHERE gmail_id = OLD.gmail_id
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reset_gmail_status
AFTER DELETE ON console_accounts
FOR EACH ROW
EXECUTE FUNCTION reset_gmail_status_on_console_delete();

-- ============================================
-- Setup Complete!
-- ============================================
-- Your database is now ready. 
-- Next: Create admin accounts through Supabase Auth UI
-- Then run the seed script to create profile records
