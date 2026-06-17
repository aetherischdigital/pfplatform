-- Phase 2 overdelivery: admin read-only drill-in to a single user's full PFS.
--
-- Phase 1's admin surface only exposed list/role/activate. To support real
-- account-management (figuring out *why* a user is flagged, helping over
-- email, etc.) the admin needs read access to the user's PFS data without
-- having to log in as them or hit the service-role API.
--
-- We add a single security-definer RPC that returns the user's whole PFS
-- bundle as JSON. Caller is gated by private.is_admin(), same pattern as
-- the other admin RPCs in 20260512200000_admin_user_management.sql.

create or replace function public.admin_user_summary(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile  jsonb;
  v_morts    jsonb;
  v_records  jsonb;
  v_biz      jsonb;
  v_conts    jsonb;
  v_snaps    jsonb;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select to_jsonb(p) - 'id' || jsonb_build_object('id', p.id)
    into v_profile
    from public.profiles p
   where p.id = p_user_id;

  if v_profile is null then
    raise exception 'user not found' using errcode = 'P0002';
  end if;

  select coalesce(jsonb_agg(to_jsonb(m) order by m.is_primary desc, m.created_at), '[]'::jsonb)
    into v_morts
    from public.mortgages m
   where m.user_id = p_user_id;

  select coalesce(jsonb_agg(to_jsonb(r) order by r.kind, r.created_at), '[]'::jsonb)
    into v_records
    from public.pfs_records r
   where r.user_id = p_user_id;

  select coalesce(jsonb_agg(to_jsonb(b) order by b.created_at), '[]'::jsonb)
    into v_biz
    from public.business_ventures b
   where b.user_id = p_user_id;

  select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at), '[]'::jsonb)
    into v_conts
    from public.contingent_liabilities c
   where c.user_id = p_user_id;

  select coalesce(jsonb_agg(to_jsonb(s) order by s.snapshot_date), '[]'::jsonb)
    into v_snaps
    from public.net_worth_snapshots s
   where s.user_id = p_user_id;

  return jsonb_build_object(
    'profile',                v_profile,
    'mortgages',              v_morts,
    'pfs_records',            v_records,
    'business_ventures',      v_biz,
    'contingent_liabilities', v_conts,
    'net_worth_snapshots',    v_snaps
  );
end;
$$;

comment on function public.admin_user_summary(uuid) is
  'Admin-only: return a single user''s full PFS bundle (profile, mortgages, records, ventures, contingent liabilities, snapshots) as one JSONB blob.';

revoke all on function public.admin_user_summary(uuid) from public;
grant execute on function public.admin_user_summary(uuid) to authenticated;
