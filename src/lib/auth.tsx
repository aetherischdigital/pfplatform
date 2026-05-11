import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { fetchOwnProfile, type Profile } from './profile'
import { AuthContext, type SignInArgs, type SignUpArgs } from './useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Load (or clear) profile whenever the auth user changes. All setState
  // happens inside async continuations to satisfy React 19's
  // react-hooks/set-state-in-effect rule.
  const userId = session?.user.id ?? null
  useEffect(() => {
    let cancelled = false
    const work: Promise<Profile | null> = userId
      ? fetchOwnProfile().catch(() => null)
      : Promise.resolve(null)
    work.then((p) => {
      if (!cancelled) setProfile(p)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  // Derived: profile is "loading" whenever the cached profile doesn't match
  // the current authenticated user yet.
  const profileLoading = !!userId && profile?.id !== userId

  const signUp = useCallback(async ({ email, password, fullName }: SignUpArgs) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/app/dashboard`,
      },
    })
    if (error) return { error: error.message, needsConfirmation: false }
    return { error: null, needsConfirmation: !data.session }
  }, [])

  const signIn = useCallback(async ({ email, password }: SignInArgs) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const refreshProfile = useCallback(async () => {
    const p = await fetchOwnProfile().catch(() => null)
    setProfile(p)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        profileLoading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
