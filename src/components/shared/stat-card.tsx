import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  description?: string
  iconClassName?: string
  iconColorClassName?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  iconClassName,
  iconColorClassName,
}: StatCardProps) {
  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardContent className="flex h-full items-start gap-3 p-5">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10',
            iconClassName
          )}
        >
          <Icon className={cn('h-5 w-5 text-primary', iconColorClassName)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {description && (
            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
