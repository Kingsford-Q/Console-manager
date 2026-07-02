import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationService } from '@/services/applicationService'
import { Application } from '@/types'

export const useApplications = (search?: string, status?: string) => {
  return useQuery({
    queryKey: ['applications', search, status],
    queryFn: () => applicationService.getAll(search, status),
  })
}

export const useApplication = (id: string) => {
  return useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationService.getById(id),
    enabled: !!id,
  })
}

export const useCreateApplication = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      app: Omit<Application, 'id' | 'created_at' | 'updated_at'>
    ) => applicationService.create(app),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['consoles'] })
    },
  })
}

export const useUpdateApplication = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Application>
    }) => applicationService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['application', data.id] })
    },
  })
}

export const useDeleteApplication = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => applicationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

export const useApplicationsByConsole = (consoleId: string) => {
  return useQuery({
    queryKey: ['applications-by-console', consoleId],
    queryFn: () => applicationService.getByConsoleId(consoleId),
    enabled: !!consoleId,
  })
}

export const useApplicationStats = () => {
  return useQuery({
    queryKey: ['application-stats'],
    queryFn: () => applicationService.countByStatus(),
  })
}

export const useApplicationReviewStats = () => {
  return useQuery({
    queryKey: ['application-review-stats'],
    queryFn: () => applicationService.getReviewStats(),
  })
}

export const useApplicationStatusHistory = (applicationId: string) => {
  return useQuery({
    queryKey: ['application-status-history', applicationId],
    queryFn: () => applicationService.getStatusHistory(applicationId),
    enabled: !!applicationId,
  })
}
