import { useQuery } from '@tanstack/react-query'
import { activityService } from '@/services/activityService'

export const useRecentActivity = (limit = 10) => {
  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: () => activityService.getRecent(limit),
    refetchInterval: 10000, // Refresh every 10 seconds
  })
}

export const useActivityByResource = (
  resourceType: string,
  resourceId: string
) => {
  return useQuery({
    queryKey: ['activity-by-resource', resourceType, resourceId],
    queryFn: () => activityService.getByResource(resourceType, resourceId),
    enabled: !!resourceType && !!resourceId,
  })
}

export const useActivityByUser = (userId: string, limit = 50) => {
  return useQuery({
    queryKey: ['activity-by-user', userId, limit],
    queryFn: () => activityService.getByUser(userId, limit),
    enabled: !!userId,
  })
}
