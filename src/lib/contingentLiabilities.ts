import { supabase } from './supabase'

export type ContingentLiabilityType =
  | 'endorser_guarantor'
  | 'lease_contract'
  | 'lawsuit'
  | 'tax_lien'
  | 'other'

export type ContingentLiability = {
  id: string
  type: ContingentLiabilityType
  description: string
  estimatedAmount: number | null
}

export type ContingentLiabilityInput = {
  type: ContingentLiabilityType
  description: string
  estimatedAmount: number | null
}

export const CONTINGENT_TYPE_LABELS: Record<ContingentLiabilityType, string> = {
  endorser_guarantor: 'Endorser / Co-maker / Guarantor',
  lease_contract: 'Lease or contract obligation',
  lawsuit: 'Pending lawsuit',
  tax_lien: 'Contested income tax lien',
  other: 'Other',
}

type Row = {
  id: string
  type: ContingentLiabilityType
  description: string
  estimated_amount: string | number | null
  created_at: string
}

const num = (v: string | number | null): number | null =>
  v === null ? null : typeof v === 'string' ? Number(v) : v

function toContingentLiability(r: Row): ContingentLiability {
  return {
    id: r.id,
    type: r.type,
    description: r.description,
    estimatedAmount: num(r.estimated_amount),
  }
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Not signed in.')
  return data.user.id
}

export async function fetchContingentLiabilities(): Promise<ContingentLiability[]> {
  const { data, error } = await supabase
    .from('contingent_liabilities')
    .select('id,type,description,estimated_amount,created_at')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(toContingentLiability)
}

export async function createContingentLiability(input: ContingentLiabilityInput): Promise<void> {
  const user_id = await currentUserId()
  const { error } = await supabase.from('contingent_liabilities').insert({
    user_id,
    type: input.type,
    description: input.description.trim(),
    estimated_amount: input.estimatedAmount,
  })
  if (error) throw error
}

export async function updateContingentLiability(
  id: string,
  input: ContingentLiabilityInput,
): Promise<void> {
  const { error } = await supabase
    .from('contingent_liabilities')
    .update({
      type: input.type,
      description: input.description.trim(),
      estimated_amount: input.estimatedAmount,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteContingentLiability(id: string): Promise<void> {
  const { error } = await supabase.from('contingent_liabilities').delete().eq('id', id)
  if (error) throw error
}
