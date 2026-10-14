import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type Role = 'grad' | 'recruiter' | 'admin'
export type Profile = { id: string; role: Role; full_name: string }

type AuthState = {
  session: Session | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', userId)
    .maybeSingle()
  return (data as Profile | null) ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      setProfile(data.session ? await loadProfile(data.session.user.id) : null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      // Defer the query: calling Supabase inside this callback can deadlock.
      setTimeout(async () => {
        setProfile(next ? await loadProfile(next.user.id) : null)
      }, 0)
    })
    // Re-read the profile when the person comes back to the tab, so a role change
    // (e.g. being made admin) shows up without logging out.
    const onFocus = async () => {
      const { data } = await supabase.auth.getSession()
      if (active && data.session) setProfile(await loadProfile(data.session.user.id))
    }
    window.addEventListener('focus', onFocus)
    return () => {
      active = false
      sub.subscription.unsubscribe()
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  const value: AuthState = {
    session,
    profile,
    loading,
    refreshProfile: async () => {
      if (session) setProfile(await loadProfile(session.user.id))
    },
    signOut: async () => {
      await supabase.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

// Where each kind of user lands after signing in.
export function homeFor(role: Role | undefined) {
  if (role === 'recruiter') return '/browse'
  if (role === 'grad') return '/me'
  if (role === 'admin') return '/admin'
  return '/'
}
