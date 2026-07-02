import { supabase } from '@/lib/supabase'
import { Application, ApplicationStatusHistoryEntry, ReviewTimeStats } from '@/types'

export const applicationService = {
  // Get all applications
  async getAll(search?: string, status?: string) {
    let query = supabase
      .from('applications')
      .select(
        `*,
        console:console_accounts(
          id,
          console_name,
          status,
          gmail:gmails(id, gmail_address)
        )`
      )

    if (search) {
      query = query.or(`app_name.ilike.%${search}%,package_name.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return data as (Application & any)[]
  },

  // Get single application
  async getById(id: string) {
    const { data, error } = await supabase
      .from('applications')
      .select(
        `*,
        console:console_accounts(
          id,
          console_name,
          gmail_id,
          certificate_id,
          gmail:gmails(id, gmail_address),
          certificate:business_certificates(id, business_name)
        )`
      )
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Application & any
  },

  // Create application
  async create(app: Omit<Application, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('applications')
      .insert([app])
      .select()

    if (error) throw error
    return data[0] as Application
  },

  // Update application
  async update(id: string, updates: Partial<Application>) {
    const { data, error } = await supabase
      .from('applications')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()

    if (error) throw error
    return data[0] as Application
  },

  // Delete application
  async delete(id: string) {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Get applications by console
  async getByConsoleId(consoleId: string) {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('console_id', consoleId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Application[]
  },

  // Count applications by status
  async countByStatus() {
    const { data, error } = await supabase
      .from('applications')
      .select('status')

    if (error) throw error

    const counts: { [key: string]: number } = {}
    data.forEach((item: any) => {
      counts[item.status] = (counts[item.status] || 0) + 1
    })

    return counts
  },

  // Days spent in review (under_review -> production), plus apps currently in review
  async getReviewStats(): Promise<ReviewTimeStats> {
    const { data, error } = await supabase
      .from('applications')
      .select('status, review_started_at, days_in_review')

    if (error) throw error

    const completed = data.filter((row: any) => row.days_in_review !== null)
    const avgDaysInReview = completed.length
      ? completed.reduce((sum: number, row: any) => sum + row.days_in_review, 0) / completed.length
      : null

    const inReview = data.filter(
      (row: any) => row.status === 'under_review' && row.review_started_at
    )
    const now = Date.now()
    const avgDaysInReviewSoFar = inReview.length
      ? inReview.reduce(
          (sum: number, row: any) =>
            sum + (now - new Date(row.review_started_at).getTime()) / 86400000,
          0
        ) / inReview.length
      : null

    return {
      avgDaysInReview,
      completedCount: completed.length,
      inReviewCount: inReview.length,
      avgDaysInReviewSoFar,
    }
  },

  // Full status-change timeline for a single application
  async getStatusHistory(applicationId: string) {
    const { data, error } = await supabase
      .from('application_status_history')
      .select('*')
      .eq('application_id', applicationId)
      .order('changed_at', { ascending: false })

    if (error) throw error
    return data as ApplicationStatusHistoryEntry[]
  },
}
