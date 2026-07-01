import { supabase } from '@/lib/supabase'
import { Gmail } from '@/types'

export const gmailService = {
  // Get all gmails
  async getAll(search?: string, status?: string) {
    let query = supabase.from('gmails').select('*')

    if (search) {
      query = query.ilike('gmail_address', `%${search}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Sort by status: used/sold first, then unused, then by created_at
    query = query.order('status', { ascending: false })
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return data as Gmail[]
  },

  // Get single gmail
  async getById(id: string) {
    const { data, error } = await supabase
      .from('gmails')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Gmail
  },

  // Create gmail
  async create(gmail: Omit<Gmail, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('gmails')
      .insert([gmail])
      .select()

    if (error) throw error
    return data[0] as Gmail
  },

  // Update gmail
  async update(id: string, updates: Partial<Gmail>) {
    const { data, error } = await supabase
      .from('gmails')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()

    if (error) throw error
    return data[0] as Gmail
  },

  // Delete gmail
  async delete(id: string) {
    const { error } = await supabase.from('gmails').delete().eq('id', id)

    if (error) throw error
  },

  // Check if gmail address exists
  async exists(gmailAddress: string) {
    const { data, error } = await supabase
      .from('gmails')
      .select('id')
      .eq('gmail_address', gmailAddress)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return !!data
  },
}
