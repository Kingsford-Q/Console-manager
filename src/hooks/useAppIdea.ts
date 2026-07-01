import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appIdeaService } from '@/services/appIdeaService'
import { AppIdea } from '@/types'

export const useAppIdeas = (search?: string, status?: string) => {
  return useQuery({
    queryKey: ['app-ideas', search, status],
    queryFn: () => appIdeaService.getAll(search, status),
  })
}

export const useAppIdea = (id: string) => {
  return useQuery({
    queryKey: ['app-idea', id],
    queryFn: () => appIdeaService.getById(id),
    enabled: !!id,
  })
}

export const useCreateAppIdea = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (idea: Omit<AppIdea, 'id' | 'created_at' | 'updated_at'>) =>
      appIdeaService.create(idea),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-ideas'] })
    },
  })
}

export const useUpdateAppIdea = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AppIdea> }) =>
      appIdeaService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['app-ideas'] })
      queryClient.invalidateQueries({ queryKey: ['app-idea', data.id] })
    },
  })
}

export const useDeleteAppIdea = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => appIdeaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-ideas'] })
    },
  })
}

export const useConvertAppIdea = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      ideaId,
      applicationId,
    }: {
      ideaId: string
      applicationId: string
    }) => appIdeaService.convertToApplication(ideaId, applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-ideas'] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

export const useAppIdeaStats = () => {
  return useQuery({
    queryKey: ['app-idea-stats'],
    queryFn: () => appIdeaService.countByStatus(),
  })
}
