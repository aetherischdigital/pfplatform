import { supabase } from './supabase'

export type UserRole = 'homeowner' | 'advisor' | 'admin'

/** For advisor-role users: realtor vs loan officer. Drives the UI label, the
 *  license field (real-estate license vs NMLS #), and feature gating. Null for
 *  non-advisors. */
export type ProfessionalType = 'realtor' | 'loan_officer'

export type WaitlistInterest = 'none' | 'plus' | 'pro'

export type Profile = {
  id: string
  role: UserRole
  /** Only meaningful for advisor-role users; null otherwise. */
  professionalType: ProfessionalType | null
  displayName: string | null
  email: string | null
  waitlistInterest: WaitlistInterest
  /** Soft activation flag. An admin can deactivate an account; a deactivated
   *  user is blocked from signing in and signed out of any live session. */
  isActive: boolean
}

type Row = {
  id: string
  role: UserRole
  professional_type: ProfessionalType | null
  display_name: string | null
  email: string | null
  waitlist_interest: WaitlistInterest
  is_active: boolean
}

export async function fetchOwnProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, professional_type, display_name, email, waitlist_interest, is_active')
    .eq('id', auth.user.id)
    .maybeSingle<Row>()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    role: data.role,
    professionalType: data.professional_type,
    displayName: data.display_name,
    email: data.email,
    waitlistInterest: data.waitlist_interest ?? 'none',
    isActive: data.is_active ?? true,
  }
}

export function displayLabel(p: Profile | null): string {
  if (!p) return 'there'
  if (p.displayName?.trim()) return p.displayName.trim().split(' ')[0]
  if (p.email) return p.email.split('@')[0]
  return 'there'
}

export function homePathFor(role: UserRole | null | undefined): string {
  switch (role) {
    case 'advisor':
      return '/app/clients'
    case 'admin':
    case 'homeowner':
    default:
      return '/app/dashboard'
  }
}

export async function updateOwnDisplayName(displayName: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Not signed in.')
  const trimmed = displayName.trim()
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: trimmed.length > 0 ? trimmed : null })
    .eq('id', auth.user.id)
  if (error) throw error
}

export async function updateOwnPassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

/**
 * Initiates an email-change. Supabase sends a confirmation link to the NEW
 * address; the change only takes effect once that link is clicked. While the
 * change is pending, `auth.users.new_email` holds the requested address and
 * `auth.users.email` still reflects the current one. The Account UI shows a
 * "pending confirmation" hint while that's the case.
 */
export async function requestOwnEmailChange(newEmail: string): Promise<void> {
  const trimmed = newEmail.trim()
  if (!trimmed) throw new Error('Email is required.')
  const { error } = await supabase.auth.updateUser({
    email: trimmed,
    options: {
      // Send the user back to their dashboard after they confirm. Domain
      // is provided at runtime so dev / preview / prod all behave correctly.
      emailRedirectTo: `${window.location.origin}/app/dashboard`,
    },
  } as Parameters<typeof supabase.auth.updateUser>[0])
  if (error) throw error
}

export async function updateOwnWaitlistInterest(
  interest: WaitlistInterest,
): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Not signed in.')
  const { error } = await supabase
    .from('profiles')
    .update({ waitlist_interest: interest })
    .eq('id', auth.user.id)
  if (error) throw error
}
