import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { fetchOwnProfile, type Profile, type UserRole } from './profile'
import { AuthContext, type SignInArgs, type SignUpArgs } from './useAuth'

const VIEW_AS_STORAGE_KEY = 'pfp:view-as'
const VALID_ROLES: UserRole[] = ['homeowner', 'realtor', 'admin']

function readStoredViewAs(userId: string | null): UserRole | null {
  if (!userId || typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(VIEW_AS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { userId: string; role: UserRole }
    if (parsed.userId !== userId) return null
    return VALID_ROLES.includes(parsed.role) ? parsed.role : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [viewAsRole, setViewAsRoleState] = useState<UserRole | null>(null)

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

  // Hydrate viewAs from localStorage when an admin's profile loads.
  // Cleared when userId changes (sign-out / different account). setState
  // happens inside an async continuation to satisfy React 19's
  // set-state-in-effect rule.
  useEffect(() => {
    let cancelled = false
    const next =
      !userId || profile?.role !== 'admin' ? null : readStoredViewAs(userId)
    Promise.resolve(next).then((r) => {
      if (!cancelled) setViewAsRoleState(r)
    })
    return () => {
      cancelled = true
    }
  }, [userId, profile?.role])

  const setViewAs = useCallback(
    (role: UserRole | null) => {
      if (!userId || profile?.role !== 'admin') return
      setViewAsRoleState(role)
      if (typeof window === 'undefined') return
      if (role) {
        window.localStorage.setItem(
          VIEW_AS_STORAGE_KEY,
          JSON.stringify({ userId, role }),
        )
      } else {
        window.localStorage.removeItem(VIEW_AS_STORAGE_KEY)
      }
    },
    [userId, profile?.role],
  )

  // Effective role: view-as only honored for admins.
  const effectiveRole: UserRole | null =
    profile?.role === 'admin' && viewAsRole ? viewAsRole : profile?.role ?? null

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
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(VIEW_AS_STORAGE_KEY)
    }
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
        viewAsRole,
        effectiveRole,
        setViewAs,
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
