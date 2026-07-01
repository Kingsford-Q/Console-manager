-- Seed Admin Profiles into Console Manager
-- Run this in Supabase SQL Editor

INSERT INTO profiles (id, full_name, role, created_at, updated_at)
VALUES 
  ('4e8517b8-4ec0-4c15-8b9e-aee72fbc5c12', 'Admin User 1', 'SUPER_ADMIN', NOW(), NOW()),
  ('f5501a6c-7233-4a02-a5e4-a7539ad0dcea', 'Admin User 2', 'SUPER_ADMIN', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Verify the profiles were created
SELECT id, full_name, role, created_at FROM profiles WHERE role = 'SUPER_ADMIN';
