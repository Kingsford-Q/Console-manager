import { supabase } from '@/lib/supabase'
import { BusinessCertificate } from '@/types'

export const certificateService = {
  // Get all certificates
  async getAll(search?: string) {
    let query = supabase.from('business_certificates').select('*')

    if (search) {
      query = query.or(
        `business_name.ilike.%${search}%,certificate_number.ilike.%${search}%`
      )
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return data as BusinessCertificate[]
  },

  // Get single certificate
  async getById(id: string) {
    const { data, error } = await supabase
      .from('business_certificates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as BusinessCertificate
  },

  // Create certificate
  async create(
    certificate: Omit<BusinessCertificate, 'id' | 'created_at' | 'updated_at'>
  ) {
    const { data, error } = await supabase
      .from('business_certificates')
      .insert([certificate])
      .select()

    if (error) throw error
    return data[0] as BusinessCertificate
  },

  // Update certificate
  async update(id: string, updates: Partial<BusinessCertificate>) {
    const { data, error } = await supabase
      .from('business_certificates')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()

    if (error) throw error
    return data[0] as BusinessCertificate
  },

  // Delete certificate
  async delete(id: string) {
    const { error } = await supabase
      .from('business_certificates')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Get certificate usage count
  async getUsageCount(certificateId: string): Promise<number> {
    const { count, error } = await supabase
      .from('console_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('certificate_id', certificateId)

    if (error) throw error
    return count || 0
  },

  // Get console accounts using this certificate
  async getConsoleAccounts(certificateId: string) {
    const { data, error } = await supabase
      .from('console_accounts')
      .select('id, console_name, status')
      .eq('certificate_id', certificateId)

    if (error) throw error
    return data
  },
}
