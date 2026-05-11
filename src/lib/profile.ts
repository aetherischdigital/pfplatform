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
    case 'admin':
      return '/admin'
    case 'realtor':
      return '/app/clients'
    case 'homeowner':
    default:
      return '/app/dashboard'
  }
}
