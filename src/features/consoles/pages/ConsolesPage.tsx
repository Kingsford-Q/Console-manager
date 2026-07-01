import { useState } from 'react'
import { toast } from 'sonner'
import { Monitor, Pencil, Trash2 } from 'lucide-react'
import {
  useConsoles,
  useCreateConsole,
  useUpdateConsole,
  useDeleteConsole,
} from '@/hooks/useConsole'
import { useGmails } from '@/hooks/useGmail'
import { useCertificates } from '@/hooks/useCertificate'
import { ConsoleAccount, ConsoleStatus } from '@/types'
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
import { statusToLabel } from '@/utils/formatting'

const CONSOLE_STATUSES: ConsoleStatus[] = [
  'approved',
  'in_review',
  'production',
  'rejected',
  'faulty',
  'sold',
]

const emptyForm = {
  console_name: '',
  gmail_id: '',
  certificate_id: '',
  status: 'approved' as ConsoleStatus,
  notes: '',
}

type ConsoleWithRelations = ConsoleAccount & {
  gmail?: { id: string; gmail_address: string }
  certificate?: { id: string; business_name: string }
}

export default function ConsolesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editing, setEditing] = useState<ConsoleWithRelations | null>(null)
  const [form, setForm] = useState(emptyForm)

  const { data: consoles, isLoading, error } = useConsoles(
    search || undefined,
    statusFilter === 'all' ? undefined : statusFilter
  )
  const { data: gmails } = useGmails(undefined, 'unused')
  const { data: allGmails } = useGmails()
  const { data: certificates } = useCertificates()
  const createConsole = useCreateConsole()
  const updateConsole = useUpdateConsole()
  const deleteConsole = useDeleteConsole()

  const availableGmails = editing
    ? allGmails?.filter((g) => g.status === 'unused' || g.id === editing.gmail_id) ?? []
    : gmails ?? []

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (console: ConsoleWithRelations) => {
    setEditing(console)
    setForm({
      console_name: console.console_name,
      gmail_id: console.gmail_id,
      certificate_id: console.certificate_id,
      status: console.status,
      notes: console.notes ?? '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await updateConsole.mutateAsync({ id: editing.id, updates: form })
        toast.success('Console account updated')
      } else {
        await createConsole.mutateAsync(form)
        toast.success('Console account created')
      }
      setDialogOpen(false)
    } catch {
      toast.error(editing ? 'Failed to update console' : 'Failed to create console')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteConsole.mutateAsync(deleteId)
      toast.success('Console account deleted')
      setDeleteId(null)
    } catch {
      toast.error('Failed to delete console account')
    }
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load console accounts. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by console name..."
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={CONSOLE_STATUSES.map((s) => ({
          value: s,
          label: statusToLabel(s),
        }))}
        onAdd={openCreate}
        addLabel="Add Console"
      />

      {isLoading ? (
        <LoadingState message="Loading console accounts..." />
      ) : !consoles?.length ? (
        <EmptyState
          icon={Monitor}
          title="No console accounts"
          description="Create a console account by linking a Gmail and certificate."
          actionLabel="Add Console"
          onAction={openCreate}
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Console Name</TableHead>
                <TableHead>Gmail</TableHead>
                <TableHead>Certificate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(consoles as ConsoleWithRelations[]).map((console) => (
                <TableRow key={console.id}>
                  <TableCell className="font-medium">{console.console_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {console.gmail?.gmail_address ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {console.certificate?.business_name ?? '—'}
                  </TableCell>
                  <TableCell><StatusBadge status={console.status} /></TableCell>
                  <TableCell>
                    {console.status === 'sold' ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        No
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(console)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(console.id)}>
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
            <DialogTitle>{editing ? 'Edit Console Account' : 'Add Console Account'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="console_name">Console Name</Label>
              <Input
                id="console_name"
                value={form.console_name}
                onChange={(e) => setForm({ ...form, console_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Gmail Account</Label>
              <Select
                value={form.gmail_id}
                onValueChange={(v) => setForm({ ...form, gmail_id: v })}
                disabled={!!editing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Gmail" />
                </SelectTrigger>
                <SelectContent>
                  {availableGmails.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.gmail_address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Business Certificate</Label>
              <Select
                value={form.certificate_id}
                onValueChange={(v) => setForm({ ...form, certificate_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select certificate" />
                </SelectTrigger>
                <SelectContent>
                  {certificates?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.business_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as ConsoleStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONSOLE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusToLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <Button
                type="submit"
                disabled={createConsole.isPending || updateConsole.isPending || !form.gmail_id || !form.certificate_id}
              >
                {editing ? 'Save Changes' : 'Create Console'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Console Account"
        description="This will delete the console account and reset the linked Gmail to unused."
        onConfirm={handleDelete}
        loading={deleteConsole.isPending}
      />
    </div>
  )
}
