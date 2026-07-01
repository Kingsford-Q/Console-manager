# Database Schema Quick Reference

## Tables Overview

### 1. profiles
User profile information linked to auth.users
```
- id (UUID, PK, FK to auth.users)
- full_name (VARCHAR 255)
- role (VARCHAR 50) → SUPER_ADMIN
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 2. gmails
Gmail account management
```
- id (UUID, PK)
- gmail_address (VARCHAR 255, UNIQUE)
- password (TEXT)
- recovery_email (VARCHAR 255)
- recovery_phone (VARCHAR 20)
- status (VARCHAR 50) → unused | used
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
INDEX: status
```

### 3. business_certificates
Business certificate management
```
- id (UUID, PK)
- business_name (VARCHAR 255)
- country (VARCHAR 100)
- registration_number (VARCHAR 255)
- certificate_number (VARCHAR 255, UNIQUE)
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 4. console_accounts
Google Play Console accounts
```
- id (UUID, PK)
- console_name (VARCHAR 255)
- gmail_id (UUID, FK, UNIQUE)
- certificate_id (UUID, FK)
- status (VARCHAR 50) → pending_payment | pending_verification | approved | suspended | closed | rejected
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
INDEXES: gmail_id, certificate_id, status
TRIGGER: Update gmail status to 'used'
TRIGGER: Reset gmail status on delete if no other consoles use it
```

### 5. applications
Android applications
```
- id (UUID, PK)
- console_id (UUID, FK CASCADE)
- app_name (VARCHAR 255)
- package_name (VARCHAR 255)
- short_description (TEXT)
- full_description (TEXT)
- category (VARCHAR 100)
- version (VARCHAR 50)
- release_date (DATE)
- status (VARCHAR 50) → idea | development | internal_testing | closed_testing | open_testing | under_review | production | suspended | removed
- app_icon_url (TEXT)
- screenshots (TEXT[] array)
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
INDEXES: console_id, status, package_name
```

### 6. app_ideas
App idea tracking
```
- id (UUID, PK)
- title (VARCHAR 255)
- description (TEXT)
- category (VARCHAR 100)
- priority (VARCHAR 50) → low | medium | high
- estimated_complexity (VARCHAR 50) → low | medium | high
- status (VARCHAR 50) → planned | in_progress | implemented | archived
- notes (TEXT)
- converted_app_id (UUID, FK to applications)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
INDEXES: status, priority
```

### 7. activity_logs
Audit trail
```
- id (UUID, PK)
- user_id (UUID, FK CASCADE)
- action (VARCHAR 100)
- resource_type (VARCHAR 100)
- resource_id (UUID)
- changes (JSONB)
- created_at (TIMESTAMP)
INDEXES: user_id, resource_type, created_at
```

## Row Level Security (RLS) Policies

All tables have:
- ✅ SELECT - Super Admin users can view all records
- ✅ INSERT - Super Admin users can create records
- ✅ UPDATE - Super Admin users can update records
- ✅ DELETE - Super Admin users can delete records

Users can also view/update their own profile.

## Status Values

### Console Account Status
- `pending_payment` - Awaiting payment
- `pending_verification` - Awaiting verification
- `approved` - Account approved
- `suspended` - Account suspended
- `closed` - Account closed
- `rejected` - Account rejected

### Application Status
- `idea` - Initial idea stage
- `development` - Under development
- `internal_testing` - Internal testing phase
- `closed_testing` - Closed beta testing
- `open_testing` - Open beta testing
- `under_review` - Submitted for review
- `production` - Live on Play Store
- `suspended` - Suspended from store
- `removed` - Removed from store

### App Idea Status
- `planned` - Planned for future
- `in_progress` - Currently in progress
- `implemented` - Converted to application
- `archived` - Archived/deprecated

### Gmail Status
- `unused` - Not linked to any console
- `used` - Linked to a console account

## Service Layer Methods

### Gmail Service
```typescript
gmailService.getAll(search?, status?)
gmailService.getById(id)
gmailService.create(gmail)
gmailService.update(id, updates)
gmailService.delete(id)
gmailService.exists(gmailAddress)
```

### Certificate Service
```typescript
certificateService.getAll(search?)
certificateService.getById(id)
certificateService.create(certificate)
certificateService.update(id, updates)
certificateService.delete(id)
certificateService.getUsageCount(certificateId)
certificateService.getConsoleAccounts(certificateId)
```

### Console Service
```typescript
consoleService.getAll(search?, status?)
consoleService.getById(id)
consoleService.create(console)
consoleService.update(id, updates)
consoleService.delete(id)
consoleService.getApplications(consoleId)
consoleService.countByStatus()
```

### Application Service
```typescript
applicationService.getAll(search?, status?)
applicationService.getById(id)
applicationService.create(app)
applicationService.update(id, updates)
applicationService.delete(id)
applicationService.getByConsoleId(consoleId)
applicationService.countByStatus()
```

### App Idea Service
```typescript
appIdeaService.getAll(search?, status?)
appIdeaService.getById(id)
appIdeaService.create(idea)
appIdeaService.update(id, updates)
appIdeaService.delete(id)
appIdeaService.convertToApplication(ideaId, applicationId)
appIdeaService.countByStatus()
```

### Activity Service
```typescript
activityService.getRecent(limit?)
activityService.getByResource(resourceType, resourceId)
activityService.getByUser(userId, limit?)
activityService.log(action, resourceType, resourceId?, changes?)
```

## Custom Hooks

Each service has corresponding hooks:

### useGmail Hooks
```typescript
useGmails(search?, status?)        // Query all gmails
useGmail(id)                       // Query single gmail
useCreateGmail()                   // Create mutation
useUpdateGmail()                   // Update mutation
useDeleteGmail()                   // Delete mutation
useCheckGmailExists()              // Check existence
```

Same pattern for:
- `useCertificate`
- `useConsole`
- `useApplication`
- `useAppIdea`
- `useActivity`

## Relationships

```
Business Certificate (1)
    ↓
    (Many) Console Accounts
    ↓
    (Many) Applications

Gmail (1)
    ↓
    (1) Console Account

Console Account (1)
    ↓
    (Many) Applications

App Idea
    ↓
    (Can be converted to) Application
```

## Data Integrity Features

- ✅ Foreign key constraints with cascading deletes
- ✅ Unique constraints on email and certificate numbers
- ✅ Automatic timestamp updates
- ✅ Check constraints for status values
- ✅ Triggers for Gmail status automation
- ✅ JSONB for flexible change tracking
