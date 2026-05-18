import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in.',
  )
}

/**
 * Snapshot of whether the app booted from a Supabase password-recovery link.
 * Captured *before* `createClient` runs, because `detectSessionInUrl` consumes
 * (and clears) the recovery payload from the URL asynchronously right after.
 * The /reset-password page uses this to tell a genuine recovery visit apart
 * from an already-signed-in user landing on the URL by other means.
 */
export const ENTERED_VIA_RECOVERY_LINK =
  typeof window !== 'undefined' &&
  (/access_token=|type=recovery|error=/.test(window.location.hash) ||
    /[?&]code=/.test(window.location.search))

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
