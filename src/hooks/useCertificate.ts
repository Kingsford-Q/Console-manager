import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { certificateService } from '@/services/certificateService'
import { BusinessCertificate } from '@/types'

export const useCertificates = (search?: string) => {
  return useQuery({
    queryKey: ['certificates', search],
    queryFn: () => certificateService.getAll(search),
  })
}

export const useCertificate = (id: string) => {
  return useQuery({
    queryKey: ['certificate', id],
    queryFn: () => certificateService.getById(id),
    enabled: !!id,
  })
}

export const useCreateCertificate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      certificate: Omit<
        BusinessCertificate,
        'id' | 'created_at' | 'updated_at'
      >
    ) => certificateService.create(certificate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] })
    },
  })
}

export const useUpdateCertificate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<BusinessCertificate>
    }) => certificateService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] })
      queryClient.invalidateQueries({ queryKey: ['certificate', data.id] })
    },
  })
}

export const useDeleteCertificate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => certificateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] })
    },
  })
}

export const useCertificateUsageCount = (certificateId: string) => {
  return useQuery({
    queryKey: ['certificate-usage', certificateId],
    queryFn: () => certificateService.getUsageCount(certificateId),
    enabled: !!certificateId,
  })
}

export const useCertificateConsoles = (certificateId: string) => {
  return useQuery({
    queryKey: ['certificate-consoles', certificateId],
    queryFn: () => certificateService.getConsoleAccounts(certificateId),
    enabled: !!certificateId,
  })
}
