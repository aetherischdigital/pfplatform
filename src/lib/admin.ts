import { supabase } from './supabase'
import type { UserRole, WaitlistInterest } from './profile'

export type AdminUser = {
  id: string
  email: string | null
  role: UserRole
  displayName: string | null
  isActive: boolean
  waitlistInterest: WaitlistInterest
  createdAt: string
}

type Row = {
  id: string
  email: string | null
  role: UserRole
  display_name: string | null
  is_active: boolean
  waitlist_interest: WaitlistInterest | null
  created_at: string
}

export async function listUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc('admin_list_users')
  if (error) throw error
  return (data as Row[]).map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role,
    displayName: r.display_name,
    isActive: r.is_active,
    waitlistInterest: r.waitlist_interest ?? 'none',
    createdAt: r.created_at,
  }))
}

export async function updateUserRole(targetId: string, newRole: UserRole): Promise<void> {
  const { error } = await supabase.rpc('admin_update_user_role', {
    target_id: targetId,
    new_role: newRole,
  })
  if (error) throw error
}

export async function setUserActive(targetId: string, active: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_set_user_active', {
    target_id: targetId,
    active,
  })
  if (error) throw error
}
