import { supabase } from '@/lib/supabase'
import { SalesAnalytics, MonthSalesBucket, WeekSalesBucket } from '@/types'

const MONTHS_BACK = 6

const weekOfMonthLabel = (dayOfMonth: number): string => {
  const week = Math.min(Math.ceil(dayOfMonth / 7), 5)
  return `Week ${week}`
}

export const salesService = {
  // Apps sold this week, this month, all-time, plus weekly (current month)
  // and monthly (last 6 months) breakdowns. An app counts as sold the
  // moment its console is marked "sold" (applications.sold_at, cascaded by
  // a DB trigger from console_accounts.sold_at).
  async getAppSalesAnalytics(): Promise<SalesAnalytics> {
    const { data, error } = await supabase
      .from('applications')
      .select('sold_at')
      .not('sold_at', 'is', null)

    if (error) throw error

    const soldDates = (data as { sold_at: string }[]).map((row) => new Date(row.sold_at))

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const soldThisWeek = soldDates.filter((d) => d >= startOfWeek).length
    const soldThisMonth = soldDates.filter((d) => d >= startOfMonth).length
    const soldAllTime = soldDates.length

    // Weekly buckets within the current month
    const weekCounts = new Map<number, number>()
    soldDates
      .filter((d) => d >= startOfMonth)
      .forEach((d) => {
        const week = Math.min(Math.ceil(d.getDate() / 7), 5)
        weekCounts.set(week, (weekCounts.get(week) ?? 0) + 1)
      })

    const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const weekCount = Math.min(Math.ceil(daysInCurrentMonth / 7), 5)
    const weekly: WeekSalesBucket[] = Array.from({ length: weekCount }, (_, i) => {
      const week = i + 1
      return { label: weekOfMonthLabel(week * 7 - 6), count: weekCounts.get(week) ?? 0 }
    })

    // Monthly buckets for the last MONTHS_BACK months (oldest first)
    const monthCounts = new Map<string, number>()
    soldDates.forEach((d) => {
      const key = `${d.getFullYear()}-${d.getMonth()}`
      monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1)
    })

    const monthly: MonthSalesBucket[] = Array.from({ length: MONTHS_BACK }, (_, i) => {
      const offset = MONTHS_BACK - 1 - i
      const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1)
      const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`
      return {
        label: monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        count: monthCounts.get(key) ?? 0,
      }
    })

    return { soldThisWeek, soldThisMonth, soldAllTime, weekly, monthly }
  },
}
