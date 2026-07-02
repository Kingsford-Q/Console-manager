import { createContext, useContext, useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types'

interface AuthContextType {
  session: Session | null
  user: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  updateEmail: (newEmail: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session) {
        await loadProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setUser(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      setUser({ ...user, ...updates })
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error
    } catch (error) {
      console.error('Error updating password:', error)
      throw error
    }
  }

  const updateEmail = async (newEmail: string) => {
    try {
      // Admins are trusted, known accounts managed directly by us, so we
      // update auth.users via a SECURITY DEFINER RPC and skip Supabase's
      // default "confirm from new email" flow, which depends on project
      // SMTP being configured and previously left this stuck/unconfirmed.
      const { error } = await supabase.rpc('admin_update_email', {
        new_email: newEmail,
      })

      if (error) throw error

      // The current session's JWT still has the old email claim until we
      // refresh it, so pull a new session/user reflecting the change.
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) throw refreshError
      setSession(refreshed.session)
    } catch (error) {
      console.error('Error updating email:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut, updateProfile, updatePassword, updateEmail }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
