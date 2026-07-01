import { supabase } from '@/lib/supabase'
import { ActivityLog } from '@/types'

export const activityService = {
  // Get recent activity
  async getRecent(limit = 10) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as ActivityLog[]
  },

  // Get activity by resource
  async getByResource(resourceType: string, resourceId: string) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as ActivityLog[]
  },

  // Get activity by user
  async getByUser(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as ActivityLog[]
  },

  // Log activity
  async log(
    action: string,
    resourceType: string,
    resourceId?: string,
    changes?: any
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: user.id,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          changes,
        },
      ])
      .select()

    if (error) throw error
    return data[0] as ActivityLog
  },
}
