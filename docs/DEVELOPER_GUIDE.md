# Developer Guide: Services & Hooks

## Overview

The application uses a three-layer architecture for data operations:

1. **Services** - Direct Supabase interactions
2. **Hooks** - TanStack Query wrappers with caching
3. **Components** - UI components that use hooks

## Services Layer

Located in `src/services/`, services provide direct database operations.

### Using Services

```typescript
import { gmailService } from '@/services/gmailService'

// Get all gmails
const gmails = await gmailService.getAll()

// Search gmails
const results = await gmailService.getAll('%example%')

// Get single gmail
const gmail = await gmailService.getById('id-here')

// Create gmail
const newGmail = await gmailService.create({
  gmail_address: 'test@gmail.com',
  password: 'secure-password',
  status: 'unused',
})

// Update gmail
const updated = await gmailService.update('id-here', {
  status: 'used',
  notes: 'Updated note',
})

// Delete gmail
await gmailService.delete('id-here')
```

### Service Methods by Entity

#### Gmail Service
```typescript
gmailService.getAll(search?, status?)          // Get all gmails
gmailService.getById(id)                       // Get single
gmailService.create(gmail)                     // Create new
gmailService.update(id, updates)               // Update
gmailService.delete(id)                        // Delete
gmailService.exists(gmailAddress)              // Check if exists
```

#### Certificate Service
```typescript
certificateService.getAll(search?)             // Get all
certificateService.getById(id)                 // Get single
certificateService.create(certificate)         // Create
certificateService.update(id, updates)         // Update
certificateService.delete(id)                  // Delete
certificateService.getUsageCount(id)           // Usage count
certificateService.getConsoleAccounts(id)      // Linked consoles
```

#### Console Service
```typescript
consoleService.getAll(search?, status?)        // Get all
consoleService.getById(id)                     // Get single
consoleService.create(console)                 // Create
consoleService.update(id, updates)             // Update
consoleService.delete(id)                      // Delete
consoleService.getApplications(consoleId)      // Get apps
consoleService.countByStatus()                 // Stats
```

#### Application Service
```typescript
applicationService.getAll(search?, status?)    // Get all
applicationService.getById(id)                 // Get single
applicationService.create(app)                 // Create
applicationService.update(id, updates)         // Update
applicationService.delete(id)                  // Delete
applicationService.getByConsoleId(id)          // By console
applicationService.countByStatus()             // Stats
```

#### App Idea Service
```typescript
appIdeaService.getAll(search?, status?)        // Get all
appIdeaService.getById(id)                     // Get single
appIdeaService.create(idea)                    // Create
appIdeaService.update(id, updates)             // Update
appIdeaService.delete(id)                      // Delete
appIdeaService.convertToApplication(id, appId) // Convert
appIdeaService.countByStatus()                 // Stats
```

## Hooks Layer (Recommended)

Located in `src/hooks/`, hooks provide TanStack Query integration with automatic caching and refetching.

### Using Hooks

```typescript
import { useGmails, useCreateGmail } from '@/hooks/useGmail'
import { toast } from 'sonner'

export function GmailList() {
  // Query - automatically cached
  const { data: gmails, isLoading, error } = useGmails()

  // Mutation - automatically invalidates cache
  const { mutate: createGmail, isPending } = useCreateGmail()

  const handleCreate = () => {
    createGmail(
      {
        gmail_address: 'new@gmail.com',
        password: 'password',
        status: 'unused',
      },
      {
        onSuccess: () => {
          toast.success('Gmail created')
        },
        onError: (error) => {
          toast.error('Failed to create gmail')
        },
      }
    )
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {gmails?.map((gmail) => (
        <div key={gmail.id}>{gmail.gmail_address}</div>
      ))}
      <button onClick={handleCreate} disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Gmail'}
      </button>
    </div>
  )
}
```

### Hook Patterns

#### Query Hook
```typescript
// Automatically refetch when dependencies change
const { data, isLoading, error, refetch } = useGmails(search, status)
```

#### Mutation Hook
```typescript
// Returns mutate/mutateAsync and isPending
const { mutate, mutateAsync, isPending } = useCreateGmail()

// Usage
mutate(newGmail, {
  onSuccess: (data) => console.log('Created:', data),
  onError: (error) => console.error('Failed:', error),
})
```

#### Dependent Queries
```typescript
// Only runs if id is provided
const { data } = useGmail(selectedId)
```

## Common Patterns

### 1. Search and Filter

```typescript
const [search, setSearch] = useState('')
const [status, setStatus] = useState('')

const { data: gmails } = useGmails(search, status)

return (
  <>
    <input value={search} onChange={(e) => setSearch(e.target.value)} />
    <select value={status} onChange={(e) => setStatus(e.target.value)}>
      <option value="">All</option>
      <option value="used">Used</option>
      <option value="unused">Unused</option>
    </select>

    {gmails?.map((gmail) => (
      <div key={gmail.id}>{gmail.gmail_address}</div>
    ))}
  </>
)
```

### 2. CRUD Operations

```typescript
const { data: gmail } = useGmail(selectedId)
const { mutate: updateGmail } = useUpdateGmail()
const { mutate: deleteGmail } = useDeleteGmail()

const handleSave = (updates) => {
  updateGmail({ id: gmail.id, updates })
}

const handleDelete = () => {
  deleteGmail(gmail.id, {
    onSuccess: () => {
      toast.success('Gmail deleted')
      navigate('/gmails')
    },
  })
}
```

### 3. Statistics

```typescript
const { data: stats } = useConsoleStats()

return (
  <div>
    <p>Total: {stats?.pending_payment}</p>
    <p>Approved: {stats?.approved}</p>
    <p>Suspended: {stats?.suspended}</p>
  </div>
)
```

## Error Handling

### Service Layer
Services throw errors that can be caught:

```typescript
try {
  await gmailService.create(newGmail)
} catch (error) {
  console.error('Failed to create gmail:', error)
}
```

### Hook Layer
Hooks provide error state:

```typescript
const { data, error, isLoading } = useGmails()

if (error) {
  return <div className="text-red-600">Error: {error.message}</div>
}
```

## TypeScript Usage

All services and hooks are fully typed:

```typescript
import { Gmail, ConsoleAccount, Application } from '@/types'
import { useGmails, useCreateGmail } from '@/hooks/useGmail'

// Type-safe data
const { data: gmails }: { data?: Gmail[] } = useGmails()

// Type-safe mutations
const { mutate } = useCreateGmail()
const newGmail: Omit<Gmail, 'id' | 'created_at'> = {
  gmail_address: 'test@gmail.com',
  password: 'pass',
  status: 'unused',
}
mutate(newGmail)
```

## Performance Tips

1. **Use Hooks** - They provide automatic caching and deduplication
2. **Selective Queries** - Only select needed fields:
   ```typescript
   // Service: Add to select statement
   .select('id, console_name, status')
   ```
3. **Pagination** - Implement for large lists (future phase)
4. **Filters** - Use filters before fetching
5. **Refetch Control** - Set appropriate refetchInterval values

## Activity Logging

The system automatically logs activities:

```typescript
// Manually log activity
import { activityService } from '@/services/activityService'

await activityService.log(
  'created',           // action
  'gmail',             // resource_type
  'gmail-id',          // resource_id
  { email: 'test@gmail.com' } // changes
)

// Or use the hook
import { useRecentActivity } from '@/hooks/useActivity'

const { data: activities } = useRecentActivity(limit = 10)
```

## Database Queries with Relationships

Services support related data:

```typescript
// Get console with related data
const consoles = await supabase
  .from('console_accounts')
  .select(`
    *,
    gmail:gmails(id, gmail_address),
    certificate:business_certificates(id, business_name)
  `)
```

## Testing Services

```typescript
// Test data
const testGmail = {
  gmail_address: 'test@example.com',
  password: 'password123',
  status: 'unused',
}

// Create
const created = await gmailService.create(testGmail)

// Read
const fetched = await gmailService.getById(created.id)

// Update
const updated = await gmailService.update(created.id, {
  status: 'used',
})

// Delete
await gmailService.delete(created.id)

// Verify deleted
const notFound = await gmailService.getById(created.id) // Error
```

## Best Practices

1. ✅ **Always use hooks in components** - Never call services directly
2. ✅ **Handle loading and error states** - Provide user feedback
3. ✅ **Use TypeScript types** - Strong typing prevents bugs
4. ✅ **Show toast notifications** - Use `onSuccess` and `onError`
5. ✅ **Refetch when needed** - Cache is automatically invalidated
6. ✅ **Avoid N+1 queries** - Use relationship queries
7. ✅ **Log important actions** - Use activity service
8. ✅ **Validate on backend** - RLS policies enforce security

## Advanced Patterns

### Optimistic Updates
```typescript
const { mutate } = useUpdateGmail()

mutate(
  { id, updates },
  {
    onMutate: async (newData) => {
      // Optimistically update UI
      queryClient.setQueryData(
        ['gmail', id],
        (old) => ({ ...old, ...newData })
      )
    },
  }
)
```

### Dependent Queries
```typescript
const { data: gmail } = useGmail(selectedId) // Only runs if selectedId
const { data: activity } = useActivityByResource(
  'gmail',
  gmail?.id || '' // Only runs if gmail exists
)
```

### Mutations with Side Effects
```typescript
const { mutate } = useConvertAppIdea()

mutate(
  { ideaId, applicationId },
  {
    onSuccess: (data) => {
      // Refetch related data
      queryClient.invalidateQueries({ queryKey: ['app-ideas'] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      toast.success('Idea converted to application')
    },
  }
)
```

## Troubleshooting

### "No data showing up"
- Check if queries are enabled
- Verify RLS policies allow access
- Check network tab for errors
- Use React DevTools to inspect React Query state

### "Cache not updating"
- Verify mutation calls are using hooks
- Check if query keys match
- Try manual refetch: `refetch()`

### "Authentication errors"
- Verify session is active
- Check auth context is properly initialized
- Verify user role is SUPER_ADMIN

## Next Steps

- Phase 3 will use these hooks to build the Dashboard
- Phase 4+ will use them for each feature module
- Each component will follow the pattern shown above

---

For questions about specific services or hooks, refer to their source files or the type definitions in `src/types/index.ts`.
