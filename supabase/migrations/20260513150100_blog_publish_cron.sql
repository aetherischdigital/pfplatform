-- Phase 3 §3.1: scheduled-publish via pg_cron.
--
-- When an admin marks a post as `scheduled` with a `scheduled_at`, the post
-- stays hidden until that timestamp passes. A minute-level cron job flips
-- `status = scheduled AND scheduled_at <= now()` rows to `published`, setting
-- `published_at = scheduled_at` so ordering on /blog reflects the intended
-- publish moment (not the cron tick).
--
-- pg_cron lives in the `cron` schema and ships pre-installed on Supabase's
-- managed Postgres. The extension only needs `create extension if not exists`
-- to be sure it's enabled.

create extension if not exists pg_cron with schema extensions;

-- Flip function: idempotent, runs as security definer so the cron job (which
-- executes as the cron-internal role) can update public.blog_posts.
create or replace function public.publish_scheduled_blog_posts()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.blog_posts
     set status       = 'published',
         published_at = coalesce(published_at, scheduled_at, now()),
         updated_at   = now()
   where status = 'scheduled'
     and scheduled_at is not null
     and scheduled_at <= now();
end;
$$;

comment on function public.publish_scheduled_blog_posts() is
  'Phase 3 §3.1 scheduler: flips scheduled blog posts to published when their scheduled_at has passed. Invoked every minute by pg_cron.';

revoke all on function public.publish_scheduled_blog_posts() from public;

-- Schedule it. cron.schedule returns the job id but we don't need it.
-- Re-running this migration is safe because cron.schedule with the same name
-- replaces the prior schedule.
select cron.schedule(
  'publish-scheduled-blog-posts',
  '* * * * *', -- every minute
  $$select public.publish_scheduled_blog_posts();$$
);
