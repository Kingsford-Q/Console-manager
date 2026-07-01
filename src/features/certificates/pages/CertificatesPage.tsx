import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Award, Pencil, Trash2 } from 'lucide-react'
import {
  useCertificates,
  useCreateCertificate,
  useUpdateCertificate,
  useDeleteCertificate,
} from '@/hooks/useCertificate'
import { BusinessCertificate } from '@/types'
import { PageToolbar } from '@/components/shared/page-toolbar'
import { LoadingState } from '@/components/shared/loading-state'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { certificateService } from '@/services/certificateService'

const emptyForm = {
  business_name: '',
  country: '',
  registration_number: '',
  certificate_number: '',
  notes: '',
}

export default function CertificatesPage() {
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editing, setEditing] = useState<BusinessCertificate | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({})

  const { data: certificates, isLoading, error } = useCertificates(search || undefined)
  const createCertificate = useCreateCertificate()
  const updateCertificate = useUpdateCertificate()
  const deleteCertificate = useDeleteCertificate()

  // Fetch usage counts for all certificates
  useEffect(() => {
    if (certificates?.length) {
      const fetchUsageCounts = async () => {
        const counts: Record<string, number> = {}
        await Promise.all(
          certificates.map(async (cert) => {
            try {
              const count = await certificateService.getUsageCount(cert.id)
              counts[cert.id] = count
            } catch (error) {
              console.error(`Failed to fetch usage count for ${cert.id}:`, error)
              counts[cert.id] = 0
            }
          })
        )
        setUsageCounts(counts)
      }
      fetchUsageCounts()
    }
  }, [certificates])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (cert: BusinessCertificate) => {
    setEditing(cert)
    setForm({
      business_name: cert.business_name,
      country: cert.country,
      registration_number: cert.registration_number,
      certificate_number: cert.certificate_number,
      notes: cert.notes ?? '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await updateCertificate.mutateAsync({ id: editing.id, updates: form })
        toast.success('Certificate updated')
      } else {
        await createCertificate.mutateAsync(form)
        toast.success('Certificate created')
      }
      setDialogOpen(false)
    } catch {
      toast.error(editing ? 'Failed to update certificate' : 'Failed to create certificate')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteCertificate.mutateAsync(deleteId)
      toast.success('Certificate deleted')
      setDeleteId(null)
    } catch {
      toast.error('Failed to delete certificate. It may be linked to a console account.')
    }
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load certificates. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by business or certificate number..."
        onAdd={openCreate}
        addLabel="Add Certificate"
      />

      {isLoading ? (
        <LoadingState message="Loading certificates..." />
      ) : !certificates?.length ? (
        <EmptyState
          icon={Award}
          title="No certificates"
          description="Add your first business certificate to get started."
          actionLabel="Add Certificate"
          onAction={openCreate}
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Registration #</TableHead>
                <TableHead>Certificate #</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell className="font-medium">{cert.business_name}</TableCell>
                  <TableCell>{cert.country}</TableCell>
                  <TableCell className="text-muted-foreground">{cert.registration_number}</TableCell>
                  <TableCell className="text-muted-foreground">{cert.certificate_number}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {usageCounts[cert.id] || 0} console{usageCounts[cert.id] !== 1 ? 's' : ''}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(cert.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(cert)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(cert.id)}>
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
            <DialogTitle>{editing ? 'Edit Certificate' : 'Add Certificate'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registration_number">Registration Number</Label>
                <Input
                  id="registration_number"
                  value={form.registration_number}
                  onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="certificate_number">Certificate Number</Label>
              <Input
                id="certificate_number"
                value={form.certificate_number}
                onChange={(e) => setForm({ ...form, certificate_number: e.target.value })}
                required
                disabled={!!editing}
              />
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
              <Button type="submit" disabled={createCertificate.isPending || updateCertificate.isPending}>
                {editing ? 'Save Changes' : 'Create Certificate'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Certificate"
        description="This action cannot be undone. Certificates linked to console accounts cannot be deleted."
        onConfirm={handleDelete}
        loading={deleteCertificate.isPending}
      />
    </div>
  )
}
