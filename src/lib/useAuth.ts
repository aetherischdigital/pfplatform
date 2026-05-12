import { createContext, useContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile, UserRole, WaitlistInterest } from './profile'

export type SignUpArgs = {
  email: string
  password: string
  fullName: string
  waitlistInterest?: WaitlistInterest
}
export type SignInArgs = { email: string; password: string }

export type AuthContextValue = {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  profileLoading: boolean
  /** Admin-only: the role they're previewing. null = no view-as active. */
  viewAsRole: UserRole | null
  /** profile.role with view-as applied (admins only). */
  effectiveRole: UserRole | null
  setViewAs: (role: UserRole | null) => void
  signUp: (args: SignUpArgs) => Promise<{ error: string | null; needsConfirmation: boolean }>
  signIn: (args: SignInArgs) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>
  resendSignupConfirmation: (email: string) => Promise<{ error: string | null }>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
