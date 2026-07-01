#!/bin/bash
# Windows Batch Version: setup.bat

@echo off
echo ================================
echo Console Manager - Phase 2 Setup
echo ================================
echo.

echo Checklist for Supabase Setup:
echo.
echo [ ] Step 1: Create Supabase Project at supabase.com
echo [ ] Step 2: Copy credentials to .env.local
echo [ ] Step 3: Run SQL schema from docs/001_initial_schema.sql
echo [ ] Step 4: Create admin users in Auth ^> Users
echo [ ] Step 5: Copy user UUIDs
echo [ ] Step 6: Run SQL seed from docs/002_seed_admin_accounts.sql
echo.

echo Documentation:
echo   ^> docs/SETUP_PHASE2.md - Complete setup instructions
echo   ^> docs/001_initial_schema.sql - Database schema
echo   ^> docs/002_seed_admin_accounts.sql - Admin seeding
echo   ^> PHASE_2_COMPLETE.md - Phase summary
echo.

echo Development Commands:
echo   npm run dev          - Start development server
echo   npm run build        - Build for production
echo   npm run type-check   - Check TypeScript types
echo   npm run lint         - Run ESLint
echo.

echo Test Credentials (after setup):
echo   Email: admin1@example.com
echo   Password: Admin@12345
echo.
echo   Email: admin2@example.com
echo   Password: Admin@12345
echo.

echo Setup Complete!
echo Start with: npm install ^&^& npm run dev
