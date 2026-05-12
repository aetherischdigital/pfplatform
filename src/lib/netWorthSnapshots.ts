import { supabase } from './supabase'

export type NetWorthSnapshot = {
  id: string
  snapshotDate: string
  totalAssets: number
  totalLiabilities: number
  netWorth: number
}

type Row = {
  id: string
  snapshot_date: string
  total_assets: string | number
  total_liabilities: string | number
  net_worth: string | number
}

const num = (v: string | number): number => (typeof v === 'string' ? Number(v) : v)

function toSnapshot(r: Row): NetWorthSnapshot {
  return {
    id: r.id,
    snapshotDate: r.snapshot_date,
    totalAssets: num(r.total_assets),
    totalLiabilities: num(r.total_liabilities),
    netWorth: num(r.net_worth),
  }
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Not signed in.')
  return data.user.id
}

export async function fetchNetWorthSnapshots(): Promise<NetWorthSnapshot[]> {
  const { data, error } = await supabase
    .from('net_worth_snapshots')
    .select('id,snapshot_date,total_assets,total_liabilities,net_worth')
    .order('snapshot_date', { ascending: true })
  if (error) throw error
  return (data ?? []).map(toSnapshot)
}

/**
 * Upsert today's snapshot. Overwrites if one already exists for today
 * (per the unique(user_id, snapshot_date) constraint on the table).
 */
export async function saveTodaysSnapshot(input: {
  totalAssets: number
  totalLiabilities: number
}): Promise<void> {
  const user_id = await currentUserId()
  const today = new Date()
  const isoDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const netWorth = input.totalAssets - input.totalLiabilities
  const { error } = await supabase
    .from('net_worth_snapshots')
    .upsert(
      {
        user_id,
        snapshot_date: isoDate,
        total_assets: input.totalAssets,
        total_liabilities: input.totalLiabilities,
        net_worth: netWorth,
      },
      { onConflict: 'user_id,snapshot_date' },
    )
  if (error) throw error
}

export async function deleteNetWorthSnapshot(id: string): Promise<void> {
  const { error } = await supabase.from('net_worth_snapshots').delete().eq('id', id)
  if (error) throw error
}
