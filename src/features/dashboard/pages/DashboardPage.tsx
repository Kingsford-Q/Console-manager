import { useAuth } from '@/features/auth/context'
import { useGmails } from '@/hooks/useGmail'
import { useCertificates } from '@/hooks/useCertificate'
import { useConsoleStats, useConsoleReviewStats } from '@/hooks/useConsole'
import { useApplicationStats, useApplications, useApplicationReviewStats } from '@/hooks/useApplication'
import { useAppIdeaStats } from '@/hooks/useAppIdea'
import { useRecentActivity } from '@/hooks/useActivity'
import { usePaymentMethods } from '@/hooks/usePayment'
import { useAppSalesAnalytics } from '@/hooks/useSales'
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard'
import { useNow } from '@/hooks/useNow'
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
  CreditCard,
  Activity,
  Rocket,
  Timer,
  TrendingUp,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatDateTime, statusToLabel, reviewDurationLabel } from '@/utils/formatting'
import { Application, ConsoleAccount } from '@/types'

type ApplicationWithConsole = Application & {
  console?: Pick<ConsoleAccount, 'id' | 'console_name' | 'status'>
}

const formatDays = (value: number | null): string => {
  if (value === null) return '—'
  return `${value.toFixed(1)}d`
}

export default function DashboardPage() {
  useRealtimeDashboard()
  useNow() // re-renders periodically so "Days in Review" keeps counting up while the page stays open

  const { user } = useAuth()
  const { data: gmails, isLoading: gmailsLoading } = useGmails()
  const { data: certificates, isLoading: certsLoading } = useCertificates()
  const { data: consoleStats, isLoading: consoleLoading } = useConsoleStats()
  const { data: appStats, isLoading: appLoading } = useApplicationStats()
  const { data: ideaStats, isLoading: ideaLoading } = useAppIdeaStats()
  const { data: activity, isLoading: activityLoading } = useRecentActivity(10)
  const { data: paymentMethods, isLoading: paymentsLoading } = usePaymentMethods()
  const { data: applications, isLoading: applicationsLoading } = useApplications()
  const { data: consoleReviewStats, isLoading: consoleReviewLoading } = useConsoleReviewStats()
  const { data: appReviewStats, isLoading: appReviewLoading } = useApplicationReviewStats()
  const { data: salesAnalytics, isLoading: salesLoading } = useAppSalesAnalytics()

  const isLoading =
    gmailsLoading ||
    certsLoading ||
    consoleLoading ||
    appLoading ||
    ideaLoading ||
    paymentsLoading ||
    applicationsLoading ||
    consoleReviewLoading ||
    appReviewLoading ||
    salesLoading

  const usedGmails = gmails?.filter((g) => g.status === 'used').length ?? 0
  const soldGmails = gmails?.filter((g) => g.status === 'sold').length ?? 0
  const unusedGmails = gmails?.filter((g) => g.status === 'unused').length ?? 0
  const totalGmails = gmails?.length ?? 0
  const totalConsoles = Object.values(consoleStats ?? {}).reduce((a, b) => a + b, 0)
  const approvedConsoles = consoleStats?.approved ?? 0
  const totalApps = Object.values(appStats ?? {}).reduce((a, b) => a + b, 0)
  const productionApps = appStats?.production ?? 0
  const totalIdeas = Object.values(ideaStats ?? {}).reduce((a, b) => a + b, 0)

  const liveApps = (applications as ApplicationWithConsole[] | undefined)
    ?.filter((app) => app.status === 'under_review' || app.status === 'production')
    .sort((a, b) => (a.status === b.status ? 0 : a.status === 'under_review' ? -1 : 1))

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Gmail Accounts"
          value={totalGmails}
          icon={Mail}
          description={`${usedGmails} used · ${soldGmails} sold · ${unusedGmails} available`}
          iconClassName="bg-blue-500/10"
          iconColorClassName="text-blue-600"
        />
        <StatCard
          title="Certificates"
          value={certificates?.length ?? 0}
          icon={Award}
          iconClassName="bg-violet-500/10"
          iconColorClassName="text-violet-600"
        />
        <StatCard
          title="Console Accounts"
          value={totalConsoles}
          icon={Monitor}
          description={`${approvedConsoles} approved`}
          iconClassName="bg-amber-500/10"
          iconColorClassName="text-amber-600"
        />
        <StatCard
          title="Applications"
          value={totalApps}
          icon={FileText}
          description={`${productionApps} in production`}
          iconClassName="bg-emerald-500/10"
          iconColorClassName="text-emerald-600"
        />
        <StatCard
          title="App Ideas"
          value={totalIdeas}
          icon={Lightbulb}
          iconClassName="bg-pink-500/10"
          iconColorClassName="text-pink-600"
        />
        <StatCard
          title="Payment Details"
          value={paymentMethods?.length ?? 0}
          icon={CreditCard}
          description="Saved cards on file"
          iconClassName="bg-teal-500/10"
          iconColorClassName="text-teal-600"
        />
        <StatCard
          title="Apps Sold This Week"
          value={salesAnalytics?.soldThisWeek ?? 0}
          icon={TrendingUp}
          description={`${salesAnalytics?.soldThisMonth ?? 0} this month · ${salesAnalytics?.soldAllTime ?? 0} all-time`}
          iconClassName="bg-fuchsia-500/10"
          iconColorClassName="text-fuchsia-600"
        />
        <StatCard
          title="Avg. Review Time"
          value={formatDays(appReviewStats?.avgDaysInReview ?? null)}
          icon={Timer}
          description={`Apps · ${appReviewStats?.completedCount ?? 0} completed reviews`}
          iconClassName="bg-cyan-500/10"
          iconColorClassName="text-cyan-600"
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Console Status</CardTitle>
            <CardDescription>Breakdown by approval state</CardDescription>
          </CardHeader>
          <CardContent>
            {totalConsoles === 0 ? (
              <p className="text-sm text-muted-foreground">No console accounts yet.</p>
            ) : (
              <div className="divide-y">
                {Object.entries(consoleStats ?? {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <StatusBadge status={status} />
                    <span className="text-sm font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>Lifecycle distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {totalApps === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            ) : (
              <div className="divide-y">
                {Object.entries(appStats ?? {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <StatusBadge status={status} />
                    <span className="text-sm font-semibold">{count}</span>
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
            <Timer className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Review Time Analytics</CardTitle>
          </div>
          <CardDescription>
            Days spent in review, tracked automatically from status changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Console Accounts <span className="text-xs">(in_review → approved)</span>
              </p>
              <p className="text-3xl font-bold tracking-tight">
                {formatDays(consoleReviewStats?.avgDaysInReview ?? null)}
              </p>
              <p className="text-xs text-muted-foreground">
                Avg. across {consoleReviewStats?.completedCount ?? 0} completed reviews
              </p>
              {(consoleReviewStats?.inReviewCount ?? 0) > 0 && (
                <p className="text-xs text-amber-600">
                  {consoleReviewStats?.inReviewCount} currently in review · avg{' '}
                  {formatDays(consoleReviewStats?.avgDaysInReviewSoFar ?? null)} so far
                </p>
              )}
            </div>
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Applications <span className="text-xs">(under_review → production)</span>
              </p>
              <p className="text-3xl font-bold tracking-tight">
                {formatDays(appReviewStats?.avgDaysInReview ?? null)}
              </p>
              <p className="text-xs text-muted-foreground">
                Avg. across {appReviewStats?.completedCount ?? 0} completed reviews
              </p>
              {(appReviewStats?.inReviewCount ?? 0) > 0 && (
                <p className="text-xs text-amber-600">
                  {appReviewStats?.inReviewCount} currently in review · avg{' '}
                  {formatDays(appReviewStats?.avgDaysInReviewSoFar ?? null)} so far
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <CardTitle>App Sales Analytics</CardTitle>
          </div>
          <CardDescription>
            An app counts as sold the moment its console is marked sold
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">This Month, by Week</p>
              {!salesAnalytics?.weekly.some((w) => w.count > 0) ? (
                <p className="text-sm text-muted-foreground">No apps sold this month yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={salesAnalytics?.weekly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                    <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar dataKey="count" name="Apps Sold" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Last 6 Months</p>
              {!salesAnalytics?.monthly.some((m) => m.count > 0) ? (
                <p className="text-sm text-muted-foreground">No apps sold in this period yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={salesAnalytics?.monthly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                    <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar dataKey="count" name="Apps Sold" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Consoles &amp; Apps in Review or Production</CardTitle>
          </div>
          <CardDescription>
            Live view of every console and its app once the app reaches review or production
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!liveApps?.length ? (
            <p className="text-sm text-muted-foreground">
              No apps are currently in review or production.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="bg-muted/50">
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">Console</th>
                      <th className="px-4 py-2.5 font-medium">Console Status</th>
                      <th className="px-4 py-2.5 font-medium">Application</th>
                      <th className="px-4 py-2.5 font-medium">App Status</th>
                      <th className="px-4 py-2.5 font-medium">Days in Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveApps.map((app) => (
                      <tr key={app.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2.5 font-medium">
                          {app.console?.console_name ?? '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          {app.console?.status ? (
                            <StatusBadge status={app.console.status} />
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-2.5">{app.app_name}</td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {reviewDurationLabel(
                            app.days_in_review,
                            app.review_started_at,
                            app.status === 'under_review',
                            app.created_at
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Recent Activity</CardTitle>
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
