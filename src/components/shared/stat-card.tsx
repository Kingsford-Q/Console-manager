import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  description?: string
  iconClassName?: string
}

export function StatCard({ title, value, icon: Icon, description, iconClassName }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10', iconClassName)}>
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
