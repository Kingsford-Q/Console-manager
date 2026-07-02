import { supabase } from '@/lib/supabase'
import { ConsoleAccount, ReviewTimeStats } from '@/types'

export const consoleService = {
  // Get all console accounts
  async getAll(search?: string, status?: string) {
    let query = supabase
      .from('console_accounts')
      .select(
        `*,
        gmail:gmails(id, gmail_address),
        certificate:business_certificates(id, business_name)`
      )

    if (search) {
      query = query.ilike('console_name', `%${search}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error
    return data as (ConsoleAccount & any)[]
  },

  // Get single console account
  async getById(id: string) {
    const { data, error } = await supabase
      .from('console_accounts')
      .select(
        `*,
        gmail:gmails(id, gmail_address),
        certificate:business_certificates(id, business_name)`
      )
      .eq('id', id)
      .single()

    if (error) throw error
    return data as ConsoleAccount & any
  },

  // Create console account
  async create(
    console: Omit<ConsoleAccount, 'id' | 'created_at' | 'updated_at'>
  ) {
    const { data, error } = await supabase
      .from('console_accounts')
      .insert([console])
      .select()

    if (error) throw error
    return data[0] as ConsoleAccount
  },

  // Update console account
  async update(id: string, updates: Partial<ConsoleAccount>) {
    const { data, error } = await supabase
      .from('console_accounts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()

    if (error) throw error

    // If status is being set to sold, update the linked gmail to sold
    if (updates.status === 'sold') {
      const console = data[0] as ConsoleAccount
      await supabase
        .from('gmails')
        .update({ status: 'sold' })
        .eq('id', console.gmail_id)
    }

    return data[0] as ConsoleAccount
  },

  // Delete console account
  async delete(id: string) {
    const { error } = await supabase
      .from('console_accounts')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Get apps for a console
  async getApplications(consoleId: string) {
    const { data, error } = await supabase
      .from('applications')
      .select('id, app_name, status')
      .eq('console_id', consoleId)

    if (error) throw error
    return data
  },

  // Count consoles by status
  async countByStatus() {
    const { data, error } = await supabase
      .from('console_accounts')
      .select('status')

    if (error) throw error

    const counts: { [key: string]: number } = {}
    data.forEach((item: any) => {
      counts[item.status] = (counts[item.status] || 0) + 1
    })

    return counts
  },

  // Days spent in review (in_review -> approved), plus consoles currently in review
  async getReviewStats(): Promise<ReviewTimeStats> {
    const { data, error } = await supabase
      .from('console_accounts')
      .select('status, review_started_at, days_in_review')

    if (error) throw error

    const completed = data.filter((row: any) => row.days_in_review !== null)
    const avgDaysInReview = completed.length
      ? completed.reduce((sum: number, row: any) => sum + row.days_in_review, 0) / completed.length
      : null

    const inReview = data.filter(
      (row: any) => row.status === 'in_review' && row.review_started_at
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
}
