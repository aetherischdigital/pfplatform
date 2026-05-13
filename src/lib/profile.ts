import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'

export type UserRole = 'homeowner' | 'realtor' | 'admin'

export type Profile = {
  id: string
  role: UserRole
  displayName: string | null
  email: string | null
}

type Row = {
  id: string
  role: UserRole
  display_name: string | null
  email: string | null
}

export async function fetchOwnProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, display_name, email')
    .eq('id', auth.user.id)
    .maybeSingle<Row>()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    role: data.role,
    displayName: data.display_name,
    email: data.email,
  }
}

/** Hook wrapper around fetchOwnProfile. Re-fetches when the auth session
 *  changes. Returns { profile, loading } — `profile` is null while loading
 *  or if the user is signed out. */
export function useProfile(): { profile: Profile | null; loading: boolean } {
  const { session, loading: authLoading } = useAuth()
  const [fetched, setFetched] = useState<Profile | null>(null)
  const [fetchedFor, setFetchedFor] = useState<string | null>(null)

  const userId = session?.user.id ?? null

  useEffect(() => {
    if (authLoading || !userId) return
    let cancelled = false
    fetchOwnProfile()
      .then((p) => {
        if (cancelled) return
        setFetched(p)
        setFetchedFor(userId)
      })
      .catch(() => {
        if (cancelled) return
        setFetched(null)
        setFetchedFor(userId)
      })
    return () => {
      cancelled = true
    }
  }, [userId, authLoading])

  // Derive profile + loading from session + fetch state — avoids synchronous
  // setState-in-effect when the session disappears.
  if (authLoading) return { profile: null, loading: true }
  if (!userId) return { profile: null, loading: false }
  const loading = fetchedFor !== userId
  return { profile: loading ? null : fetched, loading }
}
