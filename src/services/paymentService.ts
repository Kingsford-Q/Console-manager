import { supabase } from '@/lib/supabase'
import { PaymentMethod } from '@/types'

export const paymentService = {
  // Get all payment methods
  async getAll() {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as PaymentMethod[]
  },

  // Get single payment method
  async getById(id: string) {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as PaymentMethod
  },

  // Create payment method
  async create(
    payment: Omit<PaymentMethod, 'id' | 'created_at'>
  ) {
    const { data, error } = await supabase
      .from('payment_methods')
      .insert([payment])
      .select()

    if (error) throw error
    return data[0] as PaymentMethod
  },

  // Update payment method
  async update(id: string, updates: Partial<PaymentMethod>) {
    const { data, error } = await supabase
      .from('payment_methods')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()

    if (error) throw error
    return data[0] as PaymentMethod
  },

  // Delete payment method
  async delete(id: string) {
    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
