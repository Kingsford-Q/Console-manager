import { useState } from 'react'
import { toast } from 'sonner'
import { CreditCard, Landmark, Pencil, Trash2 } from 'lucide-react'
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
} from '@/hooks/usePayment'
import { PaymentMethod, PaymentMethodType } from '@/types'
import { useAuth } from '@/features/auth/context'
import { PageToolbar } from '@/components/shared/page-toolbar'
import { LoadingState } from '@/components/shared/loading-state'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  type: PaymentMethodType
  card_holder_name: string
  country: string
  notes: string
  card_number: string
  expiration: string
  cvv: string
  street: string
  bank_name: string
  account_number: string
}

const emptyForm: PaymentForm = {
  type: 'card',
  card_holder_name: '',
  country: '',
  notes: '',
  card_number: '',
  expiration: '',
  cvv: '',
  street: '',
  bank_name: '',
  account_number: '',
}

// Only send the columns that are relevant to the selected type, so the
// DB check constraint (card needs card_number/expiration/cvv/street, bank
// needs bank_name/account_number) is never tripped by leftover values.
function toPayload(form: PaymentForm) {
  const base = {
    type: form.type,
    card_holder_name: form.card_holder_name,
    country: form.country,
    notes: form.notes || undefined,
  }

  if (form.type === 'card') {
    return {
      ...base,
      card_number: form.card_number,
      expiration: form.expiration,
      cvv: form.cvv,
      street: form.street,
      bank_name: null,
      account_number: null,
    }
  }

  return {
    ...base,
    bank_name: form.bank_name,
    account_number: form.account_number,
    card_number: null,
    expiration: null,
    cvv: null,
    street: null,
  }
}

export default function PaymentDetailsPage() {
  const { canEdit } = useAuth()
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
      payment.bank_name?.toLowerCase().includes(q) ||
      payment.card_number?.slice(-4).includes(q) ||
      payment.account_number?.slice(-4).includes(q)
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
      type: payment.type,
      card_holder_name: payment.card_holder_name,
      country: payment.country,
      notes: payment.notes ?? '',
      card_number: payment.card_number ?? '',
      expiration: payment.expiration ?? '',
      cvv: payment.cvv ?? '',
      street: payment.street ?? '',
      bank_name: payment.bank_name ?? '',
      account_number: payment.account_number ?? '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = toPayload(form)
      if (editing) {
        await updatePaymentMethod.mutateAsync({ id: editing.id, updates: payload })
        toast.success('Payment method updated')
      } else {
        await createPaymentMethod.mutateAsync(payload)
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
        searchPlaceholder="Search by name, bank, country, or last 4 digits..."
        onAdd={canEdit ? openCreate : undefined}
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
              : canEdit
                ? 'Add your first payment method to get started.'
                : 'No payment methods have been added yet.'
          }
          actionLabel={search || !canEdit ? undefined : 'Add Payment Method'}
          onAction={search || !canEdit ? undefined : openCreate}
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Holder / Account Name</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Added</TableHead>
                {canEdit && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentMethods.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {payment.type === 'bank' ? (
                      <Badge variant="info" className="gap-1">
                        <Landmark className="h-3 w-3" /> Bank
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <CreditCard className="h-3 w-3" /> Card
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {payment.type === 'bank'
                      ? `${payment.bank_name} •••• ${payment.account_number?.slice(-4)}`
                      : `•••• ${payment.card_number?.slice(-4)} (${payment.expiration})`}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.card_holder_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.country}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(payment.created_at)}
                  </TableCell>
                  {canEdit && (
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
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {canEdit && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Payment Method' : 'Add Payment Method'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Payment Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm({ ...form, type: value as PaymentMethodType })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.type === 'card' ? (
                <>
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
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={form.street}
                      onChange={(e) => setForm({ ...form, street: e.target.value })}
                      required
                      placeholder="123 Main St"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input
                      id="bank_name"
                      value={form.bank_name}
                      onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                      required
                      placeholder="Chase Bank"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input
                      id="account_number"
                      value={form.account_number}
                      onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                      required
                      placeholder="000123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card_holder_name">Account Holder Name</Label>
                    <Input
                      id="card_holder_name"
                      value={form.card_holder_name}
                      onChange={(e) => setForm({ ...form, card_holder_name: e.target.value })}
                      required
                      placeholder="John Doe"
                    />
                  </div>
                </>
              )}

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
      )}

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
