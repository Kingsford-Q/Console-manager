# Phase 2: Supabase Setup Instructions

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in project details:
   - Name: "Console Manager"
   - Password: Create a strong password
   - Region: Choose closest to you
5. Wait for project to be created (2-3 minutes)

## Step 2: Get Credentials

1. Go to Project Settings > API
2. Copy:
   - `Project URL` → This is your `VITE_SUPABASE_URL`
   - `anon public` key → This is your `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Update `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
   ```

## Step 3: Create Database Schema

1. In Supabase, go to SQL Editor
2. Click "New query"
3. Copy the entire content from `docs/001_initial_schema.sql`
4. Paste into the query editor
5. Click "Run"
6. Wait for all tables to be created (you'll see green checkmarks)

**What gets created:**
- ✅ 7 database tables
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Triggers for automatic Gmail status updates

## Step 4: Create Admin Accounts

1. In Supabase, go to Authentication > Users
2. Click "Create new user"
3. Create first admin account:
   - Email: `admin1@example.com`
   - Password: `Admin@12345`
   - Click "Create user"
4. Create second admin account:
   - Email: `admin2@example.com`
   - Password: `Admin@12345`
   - Click "Create user"

## Step 5: Get User IDs for Seeding

1. After creating users, go back to Authentication > Users
2. Click on the first admin user
3. Copy the UUID (looks like: `a1b2c3d4-e5f6-4789-0123-456789abcdef`)
4. Repeat for second admin user

## Step 6: Seed Admin Profiles

1. Go to SQL Editor > New Query
2. Copy this template and replace the `<USER_ID_X>` with actual UUIDs:

```sql
INSERT INTO profiles (id, full_name, role, created_at, updated_at)
VALUES 
  ('<USER_ID_1_FROM_STEP_5>', 'Admin User 1', 'SUPER_ADMIN', NOW(), NOW()),
  ('<USER_ID_2_FROM_STEP_5>', 'Admin User 2', 'SUPER_ADMIN', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
```

3. Click "Run"
4. You should see "Success" message

## Step 7: Verify Setup

1. Run the development server:
   ```bash
   npm run dev
   ```

2. You should see the login page at `http://localhost:5173`

3. Try logging in with:
   - Email: `admin1@example.com`
   - Password: `Admin@12345`

4. If login is successful, you'll see the dashboard

## Troubleshooting

### "Invalid credentials" when logging in
- Verify you created the auth user in Step 4
- Check that your `.env.local` has the correct credentials
- Make sure the email is exactly: `admin1@example.com`

### "User not found in profiles table"
- You skipped Step 6 (seeding profiles)
- Run the SQL insert query from Step 6
- Verify the UUID matches the auth user ID

### "Network error" or "Connection refused"
- Check your `VITE_SUPABASE_URL` is correct
- Make sure your Supabase project is active (not paused)
- Verify your `.env.local` file exists

### Tables not created
- Go to SQL Editor and verify tables exist
- Check the SQL query ran without errors
- Look for error messages in red text

## What's Next?

Once you've completed this setup:

1. Run `npm run dev` to start the development server
2. Log in with admin credentials
3. Proceed to Phase 3 (Dashboard Layout)

## Database Schema Summary

| Table | Purpose |
|-------|---------|
| `profiles` | User profile information |
| `gmails` | Gmail account management |
| `business_certificates` | Business certificate management |
| `console_accounts` | Google Play Console accounts |
| `applications` | Android applications |
| `app_ideas` | App ideas tracking |
| `activity_logs` | Audit trail |

All tables have:
- ✅ Row Level Security enabled
- ✅ Indexes for performance
- ✅ Automatic timestamps
- ✅ Foreign key relationships
