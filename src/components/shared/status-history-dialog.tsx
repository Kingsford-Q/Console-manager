import { ArrowRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/status-badge'
import { LoadingState } from '@/components/shared/loading-state'
import { formatDateTime } from '@/utils/formatting'

interface StatusHistoryEntry {
  id: string
  from_status: string
  to_status: string
  changed_at: string
  duration_days: number
}

interface StatusHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  entries?: StatusHistoryEntry[]
  isLoading: boolean
}

export function StatusHistoryDialog({
  open,
  onOpenChange,
  title,
  entries,
  isLoading,
}: StatusHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Every status change, and how long it spent in the previous state</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <LoadingState message="Loading history..." className="py-8" />
        ) : !entries?.length ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No status changes recorded yet.
          </p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <StatusBadge status={entry.from_status} />
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <StatusBadge status={entry.to_status} />
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold">{entry.duration_days}d</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(entry.changed_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
