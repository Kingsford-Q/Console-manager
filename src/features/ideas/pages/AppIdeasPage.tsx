import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Lightbulb, Link2, Pencil, Trash2 } from 'lucide-react'
import {
  useAppIdeas,
  useCreateAppIdea,
  useUpdateAppIdea,
  useDeleteAppIdea,
  useConvertAppIdea,
} from '@/hooks/useAppIdea'
import { useApplications } from '@/hooks/useApplication'
import { AppIdea, AppIdeaStatus } from '@/types'
import { PageToolbar } from '@/components/shared/page-toolbar'
import { StatusBadge } from '@/components/shared/status-badge'
import { LoadingState } from '@/components/shared/loading-state'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
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
  DialogDescription,
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
import { formatDate, statusToLabel } from '@/utils/formatting'

const IDEA_STATUSES: AppIdeaStatus[] = ['planned', 'in_progress', 'implemented', 'archived']
const PRIORITIES = ['low', 'medium', 'high'] as const
const COMPLEXITIES = ['low', 'medium', 'high'] as const

type IdeaForm = {
  title: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high'
  estimated_complexity: 'low' | 'medium' | 'high'
  status: AppIdeaStatus
  notes: string
}

const emptyForm: IdeaForm = {
  title: '',
  description: '',
  category: '',
  priority: 'medium' as const,
  estimated_complexity: 'medium' as const,
  status: 'planned' as AppIdeaStatus,
  notes: '',
}

export default function AppIdeasPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [convertOpen, setConvertOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [convertingIdea, setConvertingIdea] = useState<AppIdea | null>(null)
  const [selectedAppId, setSelectedAppId] = useState('')
  const [editing, setEditing] = useState<AppIdea | null>(null)
  const [form, setForm] = useState<IdeaForm>(emptyForm)

  const { data: ideas, isLoading, error } = useAppIdeas(
    search || undefined,
    statusFilter === 'all' ? undefined : statusFilter
  )
  const { data: applications } = useApplications()
  const createIdea = useCreateAppIdea()
  const updateIdea = useUpdateAppIdea()
  const deleteIdea = useDeleteAppIdea()
  const convertIdea = useConvertAppIdea()

  const sortedIdeas = useMemo(() => {
    if (!ideas) return ideas
    return [...ideas].sort((a, b) => IDEA_STATUSES.indexOf(a.status) - IDEA_STATUSES.indexOf(b.status))
  }, [ideas])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (idea: AppIdea) => {
    setEditing(idea)
    setForm({
      title: idea.title,
      description: idea.description,
      category: idea.category,
      priority: idea.priority,
      estimated_complexity: idea.estimated_complexity,
      status: idea.status,
      notes: idea.notes ?? '',
    })
    setDialogOpen(true)
  }

  const openConvert = (idea: AppIdea) => {
    setConvertingIdea(idea)
    setSelectedAppId('')
    setConvertOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await updateIdea.mutateAsync({ id: editing.id, updates: form })
        toast.success('App idea updated')
      } else {
        await createIdea.mutateAsync(form)
        toast.success('App idea created')
      }
      setDialogOpen(false)
    } catch {
      toast.error(editing ? 'Failed to update idea' : 'Failed to create idea')
    }
  }

  const handleConvert = async () => {
    if (!convertingIdea || !selectedAppId) return
    try {
      await convertIdea.mutateAsync({
        ideaId: convertingIdea.id,
        applicationId: selectedAppId,
      })
      toast.success('Idea linked to application')
      setConvertOpen(false)
    } catch {
      toast.error('Failed to convert idea')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteIdea.mutateAsync(deleteId)
      toast.success('App idea deleted')
      setDeleteId(null)
    } catch {
      toast.error('Failed to delete idea')
    }
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load app ideas. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by title..."
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={IDEA_STATUSES.map((s) => ({
          value: s,
          label: statusToLabel(s),
        }))}
        onAdd={openCreate}
        addLabel="Add Idea"
      />

      {isLoading ? (
        <LoadingState message="Loading app ideas..." />
      ) : !sortedIdeas?.length ? (
        <EmptyState
          icon={Lightbulb}
          title="No app ideas"
          description="Capture your next app concept in the idea backlog."
          actionLabel="Add Idea"
          onAction={openCreate}
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Complexity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[130px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedIdeas.map((idea) => {
                const linkedApp = idea.converted_app_id
                  ? applications?.find((app) => app.id === idea.converted_app_id)
                  : undefined

                return (
                  <TableRow key={idea.id}>
                    <TableCell className="font-medium">{idea.title}</TableCell>
                    <TableCell className="text-muted-foreground">{idea.category}</TableCell>
                    <TableCell><StatusBadge status={idea.priority} /></TableCell>
                    <TableCell><StatusBadge status={idea.estimated_complexity} /></TableCell>
                    <TableCell><StatusBadge status={idea.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(idea.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {idea.converted_app_id ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled
                            className="cursor-default disabled:opacity-100"
                            title={linkedApp ? `Linked to ${linkedApp.app_name}` : 'Linked to an application'}
                          >
                            <Link2 className="h-4 w-4 text-emerald-600" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => openConvert(idea)} title="Link to app">
                            <Link2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEdit(idea)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(idea.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit App Idea' : 'Add App Idea'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as AppIdeaStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IDEA_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusToLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v as typeof form.priority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {statusToLabel(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Complexity</Label>
                <Select
                  value={form.estimated_complexity}
                  onValueChange={(v) =>
                    setForm({ ...form, estimated_complexity: v as typeof form.estimated_complexity })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPLEXITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {statusToLabel(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <Button type="submit" disabled={createIdea.isPending || updateIdea.isPending}>
                {editing ? 'Save Changes' : 'Create Idea'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link to Application</DialogTitle>
            <DialogDescription>
              Mark &ldquo;{convertingIdea?.title}&rdquo; as implemented by linking it to an existing application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Application</Label>
            <Select value={selectedAppId} onValueChange={setSelectedAppId}>
              <SelectTrigger>
                <SelectValue placeholder="Select application" />
              </SelectTrigger>
              <SelectContent>
                {applications?.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.app_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConvert} disabled={!selectedAppId || convertIdea.isPending}>
              Link Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete App Idea"
        description="This action cannot be undone. The idea will be permanently removed."
        onConfirm={handleDelete}
        loading={deleteIdea.isPending}
      />
    </div>
  )
}
