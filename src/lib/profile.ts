import { supabase } from './supabase'

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

export function displayLabel(p: Profile | null): string {
  if (!p) return 'there'
  if (p.displayName?.trim()) return p.displayName.trim().split(' ')[0]
  if (p.email) return p.email.split('@')[0]
  return 'there'
}

export function homePathFor(role: UserRole | null | undefined): string {
  switch (role) {
    case 'realtor':
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
