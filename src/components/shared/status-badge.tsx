import { Badge } from '@/components/ui/badge'
import { statusToLabel } from '@/utils/formatting'
import { cn } from '@/lib/utils'

const statusVariantMap: Record<string, 'success' | 'warning' | 'info' | 'error' | 'secondary' | 'default' | 'purple' | 'orange'> = {
  approved: 'success',
  production: 'success',
  implemented: 'success',
  pending_payment: 'warning',
  pending_verification: 'info',
  under_review: 'warning',
  in_review: 'warning',
  suspended: 'error',
  rejected: 'error',
  removed: 'error',
  faulty: 'orange',
  sold: 'purple',
  used: 'info',
  unused: 'secondary',
  closed: 'secondary',
  development: 'info',
  idea: 'secondary',
  planned: 'secondary',
  in_progress: 'info',
  archived: 'secondary',
  internal_testing: 'info',
  closed_testing: 'info',
  open_testing: 'warning',
  low: 'secondary',
  medium: 'warning',
  high: 'error',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = statusVariantMap[status] ?? 'secondary'
  return (
    <Badge variant={variant} className={cn('capitalize', className)}>
      {statusToLabel(status)}
    </Badge>
  )
}
