import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({ message = 'Loading...', className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-muted-foreground', className)}>
      <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
