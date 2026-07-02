import { useQuery } from '@tanstack/react-query'
import { salesService } from '@/services/salesService'

export const useAppSalesAnalytics = () => {
  return useQuery({
    queryKey: ['app-sales-analytics'],
    queryFn: () => salesService.getAppSalesAnalytics(),
  })
}
