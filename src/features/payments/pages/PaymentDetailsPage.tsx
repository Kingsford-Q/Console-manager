import { useState } from 'react'
import { toast } from 'sonner'
import { CreditCard, Pencil, Trash2 } from 'lucide-react'
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
} from '@/hooks/usePayment'
import { PaymentMethod } from '@/types'
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

type PaymentForm = {
  card_number: string
  card_holder_name: string
  expiration: string
  cvv: string
  country: string
  street: string
  notes: string
}

const emptyForm: PaymentForm = {
  card_number: '',
  card_holder_name: '',
  expiration: '',
  cvv: '',
  country: '',
  street: '',
  notes: '',
}

export default function PaymentDetailsPage() {
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editing, setEditing] = useState<PaymentMethod | null>(null)
  const [form, setForm] = useState<PaymentForm>(emptyForm)

  const { data: allPaymentMethods, isLoading, error } = usePaymentMethods()
  const createPaymentMethod = useCreatePaymentMethod()
  const updatePaymentMethod = useUpdatePaymentMethod()
  const deletePaymentMethod = useDeletePaymentMethod()

  const paymentMethods = allPaymentMethods?.filter((payment) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      payment.card_holder_name.toLowerCase().includes(q) ||
      payment.country.toLowerCase().includes(q) ||
      payment.card_number.slice(-4).includes(q)
    )
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (payment: PaymentMethod) => {
    setEditing(payment)
    setForm({
      card_number: payment.card_number,
      card_holder_name: payment.card_holder_name,
      expiration: payment.expiration,
      cvv: payment.cvv,
      country: payment.country,
      street: payment.street,
      notes: payment.notes ?? '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await updatePaymentMethod.mutateAsync({ id: editing.id, updates: form })
        toast.success('Payment method updated')
      } else {
        await createPaymentMethod.mutateAsync(form)
        toast.success('Payment method added')
      }
      setDialogOpen(false)
    } catch {
      toast.error(editing ? 'Failed to update payment method' : 'Failed to add payment method')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deletePaymentMethod.mutateAsync(deleteId)
      toast.success('Payment method deleted')
      setDeleteId(null)
    } catch {
      toast.error('Failed to delete payment method')
    }
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load payment methods. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by card holder, country, or last 4 digits..."
        onAdd={openCreate}
        addLabel="Add Payment Method"
      />

      {isLoading ? (
        <LoadingState message="Loading payment methods..." />
      ) : !paymentMethods?.length ? (
        <EmptyState
          icon={CreditCard}
          title={search ? 'No matching payment methods' : 'No payment methods'}
          description={
            search
              ? 'Try a different search term.'
              : 'Add your first payment method to get started.'
          }
          actionLabel={search ? undefined : 'Add Payment Method'}
          onAction={search ? undefined : openCreate}
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Card Number</TableHead>
                <TableHead>Card Holder</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Street</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentMethods.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    •••• {payment.card_number.slice(-4)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.card_holder_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.expiration}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.country}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.street}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(payment.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(payment)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(payment.id)}>
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
            <DialogTitle>{editing ? 'Edit Payment Method' : 'Add Payment Method'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card_number">Card Number</Label>
              <Input
                id="card_number"
                value={form.card_number}
                onChange={(e) => setForm({ ...form, card_number: e.target.value })}
                required
                placeholder="1234 5678 9012 3456"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card_holder_name">Card Holder Name</Label>
              <Input
                id="card_holder_name"
                value={form.card_holder_name}
                onChange={(e) => setForm({ ...form, card_holder_name: e.target.value })}
                required
                placeholder="John Doe"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expiration">Expiration</Label>
                <Input
                  id="expiration"
                  value={form.expiration}
                  onChange={(e) => setForm({ ...form, expiration: e.target.value })}
                  required
                  placeholder="MM/YY"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  value={form.cvv}
                  onChange={(e) => setForm({ ...form, cvv: e.target.value })}
                  required
                  placeholder="123"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                required
                placeholder="United States"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                required
                placeholder="123 Main St"
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
              <Button
                type="submit"
                disabled={createPaymentMethod.isPending || updatePaymentMethod.isPending}
              >
                {editing ? 'Save Changes' : 'Add Payment Method'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Payment Method"
        description="This action cannot be undone. The payment method will be permanently removed."
        onConfirm={handleDelete}
        loading={deletePaymentMethod.isPending}
      />
    </div>
  )
}
