# Console Manager - Database Schema

This document describes the database schema for the Console Manager application.

## Tables Overview

### 1. profiles
Extended user profile information linked to Supabase auth.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'SUPER_ADMIN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2. gmails
Gmail account management.

```sql
CREATE TABLE gmails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_address VARCHAR(255) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  recovery_email VARCHAR(255),
  recovery_phone VARCHAR(20),
  status VARCHAR(50) NOT NULL DEFAULT 'unused',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3. business_certificates
Business certificate management.

```sql
CREATE TABLE business_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  registration_number VARCHAR(255) NOT NULL,
  certificate_number VARCHAR(255) NOT NULL UNIQUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4. console_accounts
Google Play Console account management.

```sql
CREATE TABLE console_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  console_name VARCHAR(255) NOT NULL,
  gmail_id UUID NOT NULL UNIQUE REFERENCES gmails(id) ON DELETE RESTRICT,
  certificate_id UUID NOT NULL REFERENCES business_certificates(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending_payment',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 5. applications
Android application management.

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  console_id UUID NOT NULL REFERENCES console_accounts(id) ON DELETE CASCADE,
  app_name VARCHAR(255) NOT NULL,
  package_name VARCHAR(255) NOT NULL,
  short_description TEXT NOT NULL,
  full_description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  version VARCHAR(50) NOT NULL,
  release_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'development',
  app_icon_url TEXT,
  screenshots TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 6. app_ideas
App idea tracking.

```sql
CREATE TABLE app_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  estimated_complexity VARCHAR(50) NOT NULL DEFAULT 'medium',
  status VARCHAR(50) NOT NULL DEFAULT 'planned',
  notes TEXT,
  converted_app_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 7. activity_logs
Audit trail for all operations.

```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Indexes

For optimal query performance:

```sql
CREATE INDEX idx_gmails_status ON gmails(status);
CREATE INDEX idx_gmails_console_id ON gmails(id);
CREATE INDEX idx_console_accounts_gmail_id ON console_accounts(gmail_id);
CREATE INDEX idx_console_accounts_certificate_id ON console_accounts(certificate_id);
CREATE INDEX idx_console_accounts_status ON console_accounts(status);
CREATE INDEX idx_applications_console_id ON applications(console_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_package_name ON applications(package_name);
CREATE INDEX idx_app_ideas_status ON app_ideas(status);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_resource_type ON activity_logs(resource_type);
```

## Row Level Security (RLS)

All tables should have RLS enabled with policies allowing authenticated Super Admin users to perform CRUD operations:

```sql
-- Example for gmails table
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

-- Similar policies for UPDATE and DELETE...
```

## Setup Instructions

1. Log in to Supabase dashboard
2. Go to SQL Editor
3. Create each table using the SQL provided above
4. Create indexes for performance
5. Enable RLS on all tables
6. Create RLS policies
7. Run the seed script to create initial admin accounts

## Status Enums

### Console Status
- `pending_payment`
- `pending_verification`
- `approved`
- `suspended`
- `closed`
- `rejected`

### Application Status
- `idea`
- `development`
- `internal_testing`
- `closed_testing`
- `open_testing`
- `under_review`
- `production`
- `suspended`
- `removed`

### App Idea Status
- `planned`
- `in_progress`
- `implemented`
- `archived`

### Gmail Status
- `unused`
- `used`
