import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const DASHBOARD_QUERY_KEYS = [
  'consoles',
  'console-stats',
  'console-review-stats',
  'applications',
  'application-stats',
  'application-review-stats',
  'app-sales-analytics',
]

// Keeps dashboard analytics (review-time + sales) live by invalidating the
// relevant queries whenever a console account or application changes, so
// status transitions (e.g. in_review -> approved, under_review ->
// production, -> sold) show up without a manual refresh.
export const useRealtimeDashboard = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    const invalidateAll = () => {
      DASHBOARD_QUERY_KEYS.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key] })
      )
    }

    const channel = supabase
      .channel('dashboard-live-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'console_accounts' },
        invalidateAll
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications' },
        invalidateAll
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
