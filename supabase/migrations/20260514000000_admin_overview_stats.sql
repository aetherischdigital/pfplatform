-- Addons: admin "Overview" dashboard data.
--
-- Returns a single JSONB blob with everything the /admin/overview page
-- needs: user/blog/PFS counts, signup trend for the last 30 days, etc.
-- Gated to admins via private.is_admin() inside the function body, same
-- pattern as the other admin RPCs (admin_list_users, admin_user_summary).
--
-- One round trip → one render. Cheap to call; the underlying tables are
-- all small at this stage and we don't paginate anything here.

create or replace function public.admin_overview_stats()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_users_total       int;
  v_users_by_role     jsonb;
  v_users_inactive    int;
  v_users_waitlist    jsonb;
  v_signups_7d        int;
  v_signups_30d       int;
  v_signups_daily     jsonb;
  v_mortgages         int;
  v_pfs_records       int;
  v_pfs_by_kind       jsonb;
  v_business_ventures int;
  v_contingent        int;
  v_snapshots         int;
  v_blog_total        int;
  v_blog_by_status    jsonb;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- Users ------------------------------------------------------------------
  select count(*) into v_users_total from public.profiles;

  select coalesce(
    jsonb_object_agg(role, c),
    '{}'::jsonb
  ) into v_users_by_role
  from (
    select role::text as role, count(*)::int as c
    from public.profiles
    group by role
  ) r;

  select count(*) into v_users_inactive
  from public.profiles
  where is_active = false;

  select coalesce(
    jsonb_object_agg(waitlist_interest, c),
    '{}'::jsonb
  ) into v_users_waitlist
  from (
    select waitlist_interest::text as waitlist_interest, count(*)::int as c
    from public.profiles
    where waitlist_interest <> 'none'
    group by waitlist_interest
  ) w;

  select count(*) into v_signups_7d
  from public.profiles
  where created_at >= now() - interval '7 days';

  select count(*) into v_signups_30d
  from public.profiles
  where created_at >= now() - interval '30 days';

  -- Daily signup buckets for the last 30 days. Empty days are zero-filled
  -- so the sparkline gets a contiguous series instead of a sparse one.
  select coalesce(
    jsonb_agg(
      jsonb_build_object('date', d::date, 'count', coalesce(c.cnt, 0))
      order by d
    ),
    '[]'::jsonb
  ) into v_signups_daily
  from generate_series(
    (current_date - interval '29 days')::date,
    current_date,
    interval '1 day'
  ) d
  left join (
    select created_at::date as day, count(*)::int as cnt
    from public.profiles
    where created_at >= current_date - interval '29 days'
    group by created_at::date
  ) c on c.day = d::date;

  -- PFS / mortgage / venture / contingent / snapshots ----------------------
  select count(*) into v_mortgages          from public.mortgages;
  select count(*) into v_pfs_records        from public.pfs_records;
  select count(*) into v_business_ventures  from public.business_ventures;
  select count(*) into v_contingent         from public.contingent_liabilities;
  select count(*) into v_snapshots          from public.net_worth_snapshots;

  select coalesce(
    jsonb_object_agg(kind, c),
    '{}'::jsonb
  ) into v_pfs_by_kind
  from (
    select kind::text as kind, count(*)::int as c
    from public.pfs_records
    group by kind
  ) k;

  -- Blog -------------------------------------------------------------------
  select count(*) into v_blog_total from public.blog_posts;

  select coalesce(
    jsonb_object_agg(status, c),
    '{}'::jsonb
  ) into v_blog_by_status
  from (
    select status::text as status, count(*)::int as c
    from public.blog_posts
    group by status
  ) b;

  return jsonb_build_object(
    'users', jsonb_build_object(
      'total',     v_users_total,
      'by_role',   v_users_by_role,
      'inactive',  v_users_inactive,
      'waitlist',  v_users_waitlist,
      'signups_7d',  v_signups_7d,
      'signups_30d', v_signups_30d,
      'signups_daily', v_signups_daily
    ),
    'pfs', jsonb_build_object(
      'mortgages',             v_mortgages,
      'records_total',         v_pfs_records,
      'records_by_kind',       v_pfs_by_kind,
      'business_ventures',     v_business_ventures,
      'contingent_liabilities',v_contingent,
      'net_worth_snapshots',   v_snapshots
    ),
    'blog', jsonb_build_object(
      'total',     v_blog_total,
      'by_status', v_blog_by_status
    ),
    'generated_at', now()
  );
end;
$$;

comment on function public.admin_overview_stats() is
  'Admin-only: returns site stats (users/PFS/blog counts + 30-day signup trend) as one JSONB blob. Caller gated via private.is_admin().';

revoke all on function public.admin_overview_stats() from public;
grant execute on function public.admin_overview_stats() to authenticated;
