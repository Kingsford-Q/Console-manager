import { useAuth } from '@/features/auth/context'
import { useGmails } from '@/hooks/useGmail'
import { useCertificates } from '@/hooks/useCertificate'
import { useConsoleStats } from '@/hooks/useConsole'
import { useApplicationStats } from '@/hooks/useApplication'
import { useAppIdeaStats } from '@/hooks/useAppIdea'
import { useRecentActivity } from '@/hooks/useActivity'
import { StatCard } from '@/components/shared/stat-card'
import { LoadingState } from '@/components/shared/loading-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Mail,
  Monitor,
  Award,
  FileText,
  Lightbulb,
  Activity,
} from 'lucide-react'
import { formatDateTime, statusToLabel } from '@/utils/formatting'

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: gmails, isLoading: gmailsLoading } = useGmails()
  const { data: certificates, isLoading: certsLoading } = useCertificates()
  const { data: consoleStats, isLoading: consoleLoading } = useConsoleStats()
  const { data: appStats, isLoading: appLoading } = useApplicationStats()
  const { data: ideaStats, isLoading: ideaLoading } = useAppIdeaStats()
  const { data: activity, isLoading: activityLoading } = useRecentActivity(8)

  const isLoading =
    gmailsLoading || certsLoading || consoleLoading || appLoading || ideaLoading

  const usedGmails = gmails?.filter((g) => g.status === 'used').length ?? 0
  const totalGmails = gmails?.length ?? 0
  const totalConsoles = Object.values(consoleStats ?? {}).reduce((a, b) => a + b, 0)
  const approvedConsoles = consoleStats?.approved ?? 0
  const totalApps = Object.values(appStats ?? {}).reduce((a, b) => a + b, 0)
  const productionApps = appStats?.production ?? 0
  const totalIdeas = Object.values(ideaStats ?? {}).reduce((a, b) => a + b, 0)

  if (isLoading) {
    return <LoadingState message="Loading dashboard..." />
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-muted-foreground">
          Welcome back, <span className="font-medium text-foreground">{user?.full_name}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Gmail Accounts"
          value={totalGmails}
          icon={Mail}
          description={`${usedGmails} used · ${totalGmails - usedGmails} available`}
        />
        <StatCard
          title="Certificates"
          value={certificates?.length ?? 0}
          icon={Award}
        />
        <StatCard
          title="Console Accounts"
          value={totalConsoles}
          icon={Monitor}
          description={`${approvedConsoles} approved`}
        />
        <StatCard
          title="Applications"
          value={totalApps}
          icon={FileText}
          description={`${productionApps} in production`}
        />
        <StatCard
          title="App Ideas"
          value={totalIdeas}
          icon={Lightbulb}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Console Status</CardTitle>
            <CardDescription>Breakdown by approval state</CardDescription>
          </CardHeader>
          <CardContent>
            {totalConsoles === 0 ? (
              <p className="text-sm text-muted-foreground">No console accounts yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(consoleStats ?? {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <StatusBadge status={status} />
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Application Status</CardTitle>
            <CardDescription>Lifecycle distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {totalApps === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(appStats ?? {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <StatusBadge status={status} />
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </div>
          <CardDescription>Latest actions across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <LoadingState message="Loading activity..." className="py-8" />
          ) : !activity?.length ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {activity.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between gap-4 border-b pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {statusToLabel(log.action)}{' '}
                      <span className="font-normal text-muted-foreground">
                        {statusToLabel(log.resource_type)}
                      </span>
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {formatDateTime(log.created_at)}
                  </time>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
