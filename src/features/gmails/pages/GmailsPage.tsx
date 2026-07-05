import { useState } from 'react'
import { toast } from 'sonner'
import { Mail, Pencil, Trash2 } from 'lucide-react'
import { useGmails, useCreateGmail, useUpdateGmail, useDeleteGmail } from '@/hooks/useGmail'
import { Gmail } from '@/types'
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
import { formatDate } from '@/utils/formatting'

type GmailForm = {
  gmail_address: string
  password: string
  status: 'unused' | 'used' | 'sold'
  notes: string
  created_by?: string
}

const emptyForm: GmailForm = {
  gmail_address: '',
  password: '',
  status: 'unused' as const,
  notes: '',
  created_by: '',
}

export default function GmailsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Gmail | null>(null)
  const [form, setForm] = useState<GmailForm>(emptyForm)

  const { data: gmails, isLoading, error } = useGmails(
    search || undefined,
    statusFilter === 'all' ? undefined : statusFilter
  )
  const createGmail = useCreateGmail()
  const updateGmail = useUpdateGmail()
  const deleteGmail = useDeleteGmail()

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (gmail: Gmail) => {
    setEditing(gmail)
    setForm({
      gmail_address: gmail.gmail_address,
      password: gmail.password,
      status: gmail.status,
      notes: gmail.notes ?? '',
      created_by: gmail.created_by ?? '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await updateGmail.mutateAsync({ id: editing.id, updates: form })
        toast.success('Gmail account updated')
      } else {
        await createGmail.mutateAsync(form)
        toast.success('Gmail account created')
      }
      setDialogOpen(false)
    } catch {
      toast.error(editing ? 'Failed to update account' : 'Failed to create account')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteGmail.mutateAsync(deleteId)
      toast.success('Gmail account deleted')
      setDeleteId(null)
    } catch {
      toast.error('Failed to delete account')
    }
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load Gmail accounts. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by email..."
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={[
          { value: 'unused', label: 'Unused' },
          { value: 'used', label: 'Used' },
          { value: 'sold', label: 'Sold' },
        ]}
        filterPlaceholder="All statuses"
        onAdd={openCreate}
        addLabel="Add Gmail"
      />

      {isLoading ? (
        <LoadingState message="Loading Gmail accounts..." />
      ) : !gmails?.length ? (
        <EmptyState
          icon={Mail}
          title="No Gmail accounts"
          description="Add your first Gmail account to get started."
          actionLabel="Add Gmail"
          onAction={openCreate}
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gmails.map((gmail) => (
                <TableRow key={gmail.id}>
                  <TableCell className="font-medium">{gmail.gmail_address}</TableCell>
                  <TableCell><StatusBadge status={gmail.status} /></TableCell>
                  <TableCell className="text-muted-foreground">
                    {gmail.created_by || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(gmail.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(gmail)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(gmail.id)}
                        disabled={gmail.status !== 'unused'}
                        title={gmail.status !== 'unused' ? 'Only unused Gmail accounts can be deleted' : undefined}
                      >
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Gmail Account' : 'Add Gmail Account'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gmail_address">Gmail Address</Label>
              <Input
                id="gmail_address"
                type="email"
                value={form.gmail_address}
                onChange={(e) => setForm({ ...form, gmail_address: e.target.value })}
                required
                disabled={!!editing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="created_by">Created By</Label>
              <Input
                id="created_by"
                value={form.created_by}
                onChange={(e) => setForm({ ...form, created_by: e.target.value })}
              />
            </div>
            {editing && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as 'unused' | 'used' | 'sold' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unused">Unused</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createGmail.isPending || updateGmail.isPending}>
                {editing ? 'Save Changes' : 'Create Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Gmail Account"
        description="This action cannot be undone. The Gmail account will be permanently removed."
        onConfirm={handleDelete}
        loading={deleteGmail.isPending}
      />
    </div>
  )
}
