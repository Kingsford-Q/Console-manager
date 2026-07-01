import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gmailService } from '@/services/gmailService'
import { Gmail } from '@/types'

export const useGmails = (search?: string, status?: string) => {
  return useQuery({
    queryKey: ['gmails', search, status],
    queryFn: () => gmailService.getAll(search, status),
  })
}

export const useGmail = (id: string) => {
  return useQuery({
    queryKey: ['gmail', id],
    queryFn: () => gmailService.getById(id),
    enabled: !!id,
  })
}

export const useCreateGmail = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (gmail: Omit<Gmail, 'id' | 'created_at'>) =>
      gmailService.create(gmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gmails'] })
    },
  })
}

export const useUpdateGmail = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Gmail> }) =>
      gmailService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gmails'] })
      queryClient.invalidateQueries({ queryKey: ['gmail', data.id] })
    },
  })
}

export const useDeleteGmail = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => gmailService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gmails'] })
    },
  })
}

export const useCheckGmailExists = () => {
  return useMutation({
    mutationFn: (gmailAddress: string) => gmailService.exists(gmailAddress),
  })
}
