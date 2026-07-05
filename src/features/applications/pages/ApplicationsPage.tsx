import { useState } from 'react'
import { toast } from 'sonner'
import { FileText, Pencil, Trash2, ShieldCheck, History } from 'lucide-react'
import {
  useApplications,
  useCreateApplication,
  useUpdateApplication,
  useDeleteApplication,
  useApplicationStatusHistory,
} from '@/hooks/useApplication'
import { useConsoles } from '@/hooks/useConsole'
import { useNow } from '@/hooks/useNow'
import { Application, ApplicationStatus } from '@/types'
import { PageToolbar } from '@/components/shared/page-toolbar'
import { StatusBadge } from '@/components/shared/status-badge'
import { LoadingState } from '@/components/shared/loading-state'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { StatusHistoryDialog } from '@/components/shared/status-history-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { statusToLabel, reviewDurationLabel } from '@/utils/formatting'

const APP_STATUSES: ApplicationStatus[] = [
  'idea',
  'development',
  'internal_testing',
  'closed_testing',
  'open_testing',
  'under_review',
  'production',
  'suspended',
  'removed',
]

const emptyForm = {
  console_id: '',
  app_name: '',
  package_name: '',
  short_description: '',
  full_description: '',
  category: '',
  version: '1.0.0',
  status: 'idea' as ApplicationStatus,
  privacy_policy_url: '',
  notes: '',
}

type ApplicationWithRelations = Application & {
  console?: {
    id: string
    console_name: string
    gmail?: { id: string; gmail_address: string }
  }
}

export default function ApplicationsPage() {
  useNow() // re-renders periodically so "Days in Review" keeps counting up while the page stays open
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [historyId, setHistoryId] = useState<string | null>(null)
  const [editing, setEditing] = useState<ApplicationWithRelations | null>(null)
  const [form, setForm] = useState(emptyForm)

  const { data: history, isLoading: historyLoading } = useApplicationStatusHistory(historyId ?? '')
  const { data: applications, isLoading, error } = useApplications(
    search || undefined,
    statusFilter === 'all' ? undefined : statusFilter
  )
  const { data: consoles } = useConsoles()
  const createApplication = useCreateApplication()
  const updateApplication = useUpdateApplication()
  const deleteApplication = useDeleteApplication()

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (app: ApplicationWithRelations) => {
    setEditing(app)
    setForm({
      console_id: app.console_id,
      app_name: app.app_name,
      package_name: app.package_name,
      short_description: app.short_description,
      full_description: app.full_description,
      category: app.category,
      version: app.version,
      status: app.status,
      privacy_policy_url: app.privacy_policy_url ?? '',
      notes: app.notes ?? '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await updateApplication.mutateAsync({ id: editing.id, updates: form })
        toast.success('Application updated')
      } else {
        await createApplication.mutateAsync(form)
        toast.success('Application created')
      }
      setDialogOpen(false)
    } catch {
      toast.error(editing ? 'Failed to update application' : 'Failed to create application')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteApplication.mutateAsync(deleteId)
      toast.success('Application deleted')
      setDeleteId(null)
    } catch {
      toast.error('Failed to delete application')
    }
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load applications. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by app or package name..."
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={APP_STATUSES.map((s) => ({
          value: s,
          label: statusToLabel(s),
        }))}
        onAdd={openCreate}
        addLabel="Add Application"
      />

      {isLoading ? (
        <LoadingState message="Loading applications..." />
      ) : !applications?.length ? (
        <EmptyState
          icon={FileText}
          title="No applications"
          description="Add your first Android application to track its lifecycle."
          actionLabel="Add Application"
          onAction={openCreate}
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>App Name</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Console</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Days in Review</TableHead>
                <TableHead>Version</TableHead>
                <TableHead className="w-[160px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(applications as ApplicationWithRelations[]).map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.app_name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {app.package_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {app.console?.console_name ?? '—'}
                  </TableCell>
                  <TableCell><StatusBadge status={app.status} /></TableCell>
                  <TableCell className="text-muted-foreground">
                    {reviewDurationLabel(
                      app.days_in_review,
                      app.review_started_at,
                      app.status === 'under_review',
                      app.created_at
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{app.version}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {app.privacy_policy_url && (
                        <Button variant="ghost" size="icon" asChild>
                          <a
                            href={app.privacy_policy_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View privacy policy"
                          >
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setHistoryId(app.id)}
                        title="View status history"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(app)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(app.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Application' : 'Add Application'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Console Account</Label>
              <Select
                value={form.console_id}
                onValueChange={(v) => setForm({ ...form, console_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select console" />
                </SelectTrigger>
                <SelectContent>
                  {consoles?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.console_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="app_name">App Name</Label>
                <Input
                  id="app_name"
                  value={form.app_name}
                  onChange={(e) => setForm({ ...form, app_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package_name">Package Name</Label>
                <Input
                  id="package_name"
                  value={form.package_name}
                  onChange={(e) => setForm({ ...form, package_name: e.target.value })}
                  required
                  disabled={!!editing}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="short_description">Short Description</Label>
              <Input
                id="short_description"
                value={form.short_description}
                onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_description">Full Description</Label>
              <Textarea
                id="full_description"
                value={form.full_description}
                onChange={(e) => setForm({ ...form, full_description: e.target.value })}
                rows={3}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={form.version}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as ApplicationStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APP_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusToLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="privacy_policy_url">Privacy Policy URL</Label>
              <Input
                id="privacy_policy_url"
                type="url"
                value={form.privacy_policy_url}
                onChange={(e) => setForm({ ...form, privacy_policy_url: e.target.value })}
                placeholder="https://example.com/privacy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createApplication.isPending || updateApplication.isPending || !form.console_id}
              >
                {editing ? 'Save Changes' : 'Create Application'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Application"
        description="This action cannot be undone. The application record will be permanently removed."
        onConfirm={handleDelete}
        loading={deleteApplication.isPending}
      />

      <StatusHistoryDialog
        open={!!historyId}
        onOpenChange={(open) => !open && setHistoryId(null)}
        title="Application Status History"
        entries={history}
        isLoading={historyLoading}
      />
    </div>
  )
}
