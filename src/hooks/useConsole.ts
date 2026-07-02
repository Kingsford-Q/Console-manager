import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { consoleService } from '@/services/consoleService'
import { ConsoleAccount } from '@/types'

export const useConsoles = (search?: string, status?: string) => {
  return useQuery({
    queryKey: ['consoles', search, status],
    queryFn: () => consoleService.getAll(search, status),
  })
}

export const useConsole = (id: string) => {
  return useQuery({
    queryKey: ['console', id],
    queryFn: () => consoleService.getById(id),
    enabled: !!id,
  })
}

export const useCreateConsole = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      console: Omit<ConsoleAccount, 'id' | 'created_at' | 'updated_at'>
    ) => consoleService.create(console),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consoles'] })
      queryClient.invalidateQueries({ queryKey: ['gmails'] })
    },
  })
}

export const useUpdateConsole = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<ConsoleAccount>
    }) => consoleService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['consoles'] })
      queryClient.invalidateQueries({ queryKey: ['console', data.id] })
    },
  })
}

export const useDeleteConsole = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => consoleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consoles'] })
    },
  })
}

export const useConsoleApplications = (consoleId: string) => {
  return useQuery({
    queryKey: ['console-applications', consoleId],
    queryFn: () => consoleService.getApplications(consoleId),
    enabled: !!consoleId,
  })
}

export const useConsoleStats = () => {
  return useQuery({
    queryKey: ['console-stats'],
    queryFn: () => consoleService.countByStatus(),
  })
}

export const useConsoleReviewStats = () => {
  return useQuery({
    queryKey: ['console-review-stats'],
    queryFn: () => consoleService.getReviewStats(),
  })
}

export const useConsoleStatusHistory = (consoleId: string) => {
  return useQuery({
    queryKey: ['console-status-history', consoleId],
    queryFn: () => consoleService.getStatusHistory(consoleId),
    enabled: !!consoleId,
  })
}
