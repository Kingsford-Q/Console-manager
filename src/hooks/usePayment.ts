import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentService } from '@/services/paymentService'
import { PaymentMethod } from '@/types'

export const usePaymentMethods = () => {
  return useQuery({
    queryKey: ['payment_methods'],
    queryFn: () => paymentService.getAll(),
  })
}

export const usePaymentMethod = (id: string) => {
  return useQuery({
    queryKey: ['payment_method', id],
    queryFn: () => paymentService.getById(id),
    enabled: !!id,
  })
}

export const useCreatePaymentMethod = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payment: Omit<PaymentMethod, 'id' | 'created_at'>) =>
      paymentService.create(payment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_methods'] })
    },
  })
}

export const useUpdatePaymentMethod = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PaymentMethod> }) =>
      paymentService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payment_methods'] })
      queryClient.invalidateQueries({ queryKey: ['payment_method', data.id] })
    },
  })
}

export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => paymentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_methods'] })
    },
  })
}
