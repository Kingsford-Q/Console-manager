-- Admin Account Creation Helper
-- Use this after creating auth users in Supabase dashboard

-- Step 1: Create admin accounts in Supabase Auth UI at:
-- https://supabase.com > Your Project > Authentication > Users > Create new user
-- 
-- Admin 1: admin1@example.com / Admin@12345
-- Admin 2: admin2@example.com / Admin@12345

-- Step 2: After creating auth users, copy their UUIDs and run these queries:

-- Create profiles for admins (replace <USER_ID_1> and <USER_ID_2> with actual UUIDs from auth.users)
INSERT INTO profiles (id, full_name, role, created_at, updated_at)
VALUES 
  ('<USER_ID_1>', 'Admin User 1', 'SUPER_ADMIN', NOW(), NOW()),
  ('<USER_ID_2>', 'Admin User 2', 'SUPER_ADMIN', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Verify profiles were created
SELECT id, full_name, role, created_at FROM profiles;
