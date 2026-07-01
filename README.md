# Console Manager - Google Play Console Management System

A production-ready internal management system for managing Google Play Console accounts, Gmail accounts, business certificates, Android applications, and app ideas.

## Technology Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Backend**: Supabase (PostgreSQL + Auth)
- **Deployment**: Vercel

## Project Structure

```
src/
├── features/           # Feature modules (auth, dashboard, gmails, etc.)
├── components/         # Reusable UI components
│   └── ui/            # shadcn/ui components
├── hooks/             # Custom React hooks
├── layouts/           # Layout components
├── lib/               # Utility libraries (supabase, utils)
├── services/          # API services
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── routes/            # Route definitions
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Vercel account (for deployment)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env.local
```

Update `.env.local` with your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

3. Start the development server:
```bash
npm run dev
```

The application will open at `http://localhost:5173`.

### Build

```bash
npm run build
```

### Type Check

```bash
npm run type-check
```

## Database Setup

See [DATABASE.md](./docs/DATABASE.md) for detailed schema setup instructions.

## Authentication

### Admin Users

Only Super Admin users can log in. The system includes a seed script to create initial admin accounts.

### Credentials (Default)

Admin 1:
- Email: `admin1@example.com`
- Password: `Admin@12345`

Admin 2:
- Email: `admin2@example.com`
- Password: `Admin@12345`

## Development Phases

1. ✅ **Phase 1**: Project Setup (completed)
2. ⏳ **Phase 2**: Supabase Configuration & Authentication
3. ⏳ **Phase 3**: Database Schema
4. ⏳ **Phase 4**: Dashboard Layout
5. ⏳ **Phase 5**: Gmail Management
6. ⏳ **Phase 6**: Business Certificates
7. ⏳ **Phase 7**: Console Accounts
8. ⏳ **Phase 8**: Applications
9. ⏳ **Phase 9**: App Ideas
10. ⏳ **Phase 10**: Search & Filters
11. ⏳ **Phase 11**: Dashboard Analytics
12. ⏳ **Phase 12**: Final Polish & Optimization

## Features

### Authentication
- Supabase Authentication with email/password
- Protected routes
- Session persistence
- Automatic login restoration
- Profile management

### Dashboard
- Real-time analytics cards
- Recent activity log
- Quick stats overview

### Gmail Management
- Full CRUD operations
- Status tracking (used/unused)
- Linked console display
- Duplicate prevention

### Business Certificates
- Full CRUD operations
- Usage tracking
- Linked console accounts

### Console Accounts
- Full CRUD operations
- Multiple statuses
- App tracking

### Applications
- Full CRUD operations
- Multi-stage lifecycle
- Console association
- Optional media (icons/screenshots)

### App Ideas
- Full CRUD operations
- Priority and complexity tracking
- Conversion to Applications

## Code Quality Standards

- Strong TypeScript typing
- ESLint configuration
- Consistent code style
- Scalable architecture
- Error boundaries
- Loading states
- Form validation

## Deployment

The application is configured for deployment on Vercel. Push to main branch to deploy automatically.

## Support

For issues or questions, please create an issue in the repository.

## License

Proprietary - Internal Use Only
