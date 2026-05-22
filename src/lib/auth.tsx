import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { fetchOwnProfile, type Profile, type UserRole } from './profile'
import { AuthContext, type SignInArgs, type SignUpArgs } from './useAuth'

const VIEW_AS_STORAGE_KEY = 'pfp:view-as'
const VALID_ROLES: UserRole[] = ['homeowner', 'advisor', 'admin']

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

type ProfileResult = {
  /** The auth user id this result belongs to — lets us tell stale from fresh. */
  userId: string | null
  profile: Profile | null
  /** True when the fetch threw (network / RLS) rather than returning a row. */
  error: boolean
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileResult, setProfileResult] = useState<ProfileResult>({
    userId: null,
    profile: null,
    error: false,
  })
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

  // Load the profile whenever the auth user changes. The result carries the
  // userId it belongs to plus an explicit error flag, so consumers can tell
  // "still loading" apart from "loaded but the fetch failed" — a transient
  // failure must never be mistaken for "no profile" or "not an admin". All
  // setState runs inside async continuations to satisfy React 19's
  // react-hooks/set-state-in-effect rule.
  const userId = session?.user.id ?? null
  useEffect(() => {
    let cancelled = false
    const work: Promise<{ profile: Profile | null; error: boolean }> = userId
      ? fetchOwnProfile()
          .then((p) => ({ profile: p, error: false }))
          .catch(() => ({ profile: null, error: true }))
      : Promise.resolve({ profile: null, error: false })
    work.then((r) => {
      if (cancelled) return
      setProfileResult({ userId, profile: r.profile, error: r.error })
      // Backstop: if an active session's account has been deactivated, sign
      // the user out. The sign-in path surfaces a user-facing message; this
      // just stops a lingering session from continuing to use the app.
      if (r.profile && !r.profile.isActive) {
        void supabase.auth.signOut()
      }
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  // Derived profile state — a result is only trusted once it's for the current
  // user. `profileError` is a settled failure; `profileLoading` is in-flight.
  const profileSettled = profileResult.userId === userId
  const profile = profileSettled ? profileResult.profile : null
  const profileError = profileSettled && profileResult.error
  const profileLoading = !!userId && !profileSettled

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

  const signUp = useCallback(
    async ({ email, password, fullName, waitlistInterest }: SignUpArgs) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            // Optional: indicates Plus/Pro interest. handle_new_user trigger
            // copies this into profiles.waitlist_interest when present.
            ...(waitlistInterest && waitlistInterest !== 'none'
              ? { waitlist_interest: waitlistInterest }
              : {}),
          },
          emailRedirectTo: `${window.location.origin}/app/dashboard`,
        },
      })
      if (error) return { error: error.message, needsConfirmation: false }
      return { error: null, needsConfirmation: !data.session }
    },
    [],
  )

  const signIn = useCallback(async ({ email, password }: SignInArgs) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    // Block deactivated accounts: an admin can flip is_active off, and such a
    // user must not be able to use the app even though Supabase Auth still
    // accepts the credentials.
    const profile = await fetchOwnProfile().catch(() => null)
    if (profile && !profile.isActive) {
      await supabase.auth.signOut()
      return {
        error:
          'This account has been deactivated. Contact support if you believe this is a mistake.',
      }
    }
    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(VIEW_AS_STORAGE_KEY)
    }
    await supabase.auth.signOut()
  }, [])

  const refreshProfile = useCallback(async () => {
    const r = await fetchOwnProfile()
      .then((p) => ({ profile: p, error: false }))
      .catch(() => ({ profile: null, error: true }))
    setProfileResult({ userId, profile: r.profile, error: r.error })
    if (r.profile && !r.profile.isActive) {
      void supabase.auth.signOut()
    }
  }, [userId])

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: error?.message ?? null }
  }, [])

  const resendSignupConfirmation = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/app/dashboard`,
      },
    })
    return { error: error?.message ?? null }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        profileLoading,
        profileError,
        viewAsRole,
        effectiveRole,
        setViewAs,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        requestPasswordReset,
        resendSignupConfirmation,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
