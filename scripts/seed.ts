#!/usr/bin/env node

/**
 * Seed script for creating default Super Admin accounts in Supabase
 * Run this script after setting up your Supabase project
 * 
 * Usage: npx ts-node scripts/seed.ts
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const adminAccounts = [
  {
    email: "admin1@example.com",
    password: "Admin@12345",
    fullName: "Admin User 1",
  },
  {
    email: "admin2@example.com",
    password: "Admin@12345",
    fullName: "Admin User 2",
  },
];

console.log("🌱 Seeding Supabase with admin accounts...");
console.log("⚠️  This script should only be run during initial setup");
console.log("");
console.log("Admin accounts to be created:");
adminAccounts.forEach((account, index) => {
  console.log(`  ${index + 1}. ${account.email} (${account.fullName})`);
});
console.log("");
console.log("📝 Steps to complete the setup:");
console.log("1. Go to https://supabase.com and create a new project");
console.log("2. Note your Supabase URL and Anon Key");
console.log("3. Update .env.local with your credentials");
console.log("4. Create the database schema (see DATABASE.md)");
console.log("5. Use Supabase Admin panel to create auth users:");
console.log("   - Go to Authentication > Users");
console.log("   - Click 'Create new user'");
adminAccounts.forEach((account) => {
  console.log(`   - Email: ${account.email}, Password: ${account.password}`);
});
console.log("6. Then run this script or manually insert profiles:");
console.log(`   INSERT INTO profiles (id, full_name, role) VALUES`);
adminAccounts.forEach((account, index) => {
  const isLast = index === adminAccounts.length - 1;
  console.log(`   ('<user-id-from-auth>', '${account.fullName}', 'SUPER_ADMIN')${isLast ? ';' : ','}`);
});
console.log("");
console.log("✅ Setup complete! You can now log in.");
