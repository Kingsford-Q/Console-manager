import { supabase } from '@/lib/supabase'
import { AppIdea } from '@/types'

export const appIdeaService = {
  // Get all app ideas
  async getAll(search?: string, status?: string) {
    let query = supabase.from('app_ideas').select('*')

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return data as AppIdea[]
  },

  // Get single app idea
  async getById(id: string) {
    const { data, error } = await supabase
      .from('app_ideas')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as AppIdea
  },

  // Create app idea
  async create(idea: Omit<AppIdea, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('app_ideas')
      .insert([idea])
      .select()

    if (error) throw error
    return data[0] as AppIdea
  },

  // Update app idea
  async update(id: string, updates: Partial<AppIdea>) {
    const { data, error } = await supabase
      .from('app_ideas')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()

    if (error) throw error
    return data[0] as AppIdea
  },

  // Delete app idea
  async delete(id: string) {
    const { error } = await supabase
      .from('app_ideas')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Convert idea to application
  async convertToApplication(ideaId: string, applicationId: string) {
    const { data, error } = await supabase
      .from('app_ideas')
      .update({
        status: 'implemented',
        converted_app_id: applicationId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ideaId)
      .select()

    if (error) throw error
    return data[0] as AppIdea
  },

  // Count ideas by status
  async countByStatus() {
    const { data, error } = await supabase
      .from('app_ideas')
      .select('status')

    if (error) throw error

    const counts: { [key: string]: number } = {}
    data.forEach((item: any) => {
      counts[item.status] = (counts[item.status] || 0) + 1
    })

    return counts
  },
}
