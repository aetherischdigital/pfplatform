import { supabase } from './supabase'

export type BusinessVenture = {
  id: string
  name: string
  address: string | null
  pctOwnership: number | null
  positionTitle: string | null
  businessAssets: number | null
  lineOfBusiness: string | null
  yearsInBusiness: number | null
}

export type BusinessVentureInput = {
  name: string
  address: string | null
  pctOwnership: number | null
  positionTitle: string | null
  businessAssets: number | null
  lineOfBusiness: string | null
  yearsInBusiness: number | null
}

type Row = {
  id: string
  name: string
  address: string | null
  pct_ownership: string | number | null
  position_title: string | null
  business_assets: string | number | null
  line_of_business: string | null
  years_in_business: number | null
  created_at: string
}

const num = (v: string | number | null): number | null =>
  v === null ? null : typeof v === 'string' ? Number(v) : v

function toBusinessVenture(r: Row): BusinessVenture {
  return {
    id: r.id,
    name: r.name,
    address: r.address,
    pctOwnership: num(r.pct_ownership),
    positionTitle: r.position_title,
    businessAssets: num(r.business_assets),
    lineOfBusiness: r.line_of_business,
    yearsInBusiness: r.years_in_business,
  }
}

function toRow(input: BusinessVentureInput) {
  return {
    name: input.name.trim(),
    address: input.address,
    pct_ownership: input.pctOwnership,
    position_title: input.positionTitle,
    business_assets: input.businessAssets,
    line_of_business: input.lineOfBusiness,
    years_in_business: input.yearsInBusiness,
  }
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Not signed in.')
  return data.user.id
}

export async function fetchBusinessVentures(): Promise<BusinessVenture[]> {
  const { data, error } = await supabase
    .from('business_ventures')
    .select(
      'id,name,address,pct_ownership,position_title,business_assets,line_of_business,years_in_business,created_at',
    )
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(toBusinessVenture)
}

export async function createBusinessVenture(input: BusinessVentureInput): Promise<void> {
  const user_id = await currentUserId()
  const { error } = await supabase
    .from('business_ventures')
    .insert({ user_id, ...toRow(input) })
  if (error) throw error
}

export async function updateBusinessVenture(
  id: string,
  input: BusinessVentureInput,
): Promise<void> {
  const { error } = await supabase
    .from('business_ventures')
    .update(toRow(input))
    .eq('id', id)
  if (error) throw error
}

export async function deleteBusinessVenture(id: string): Promise<void> {
  const { error } = await supabase.from('business_ventures').delete().eq('id', id)
  if (error) throw error
}
