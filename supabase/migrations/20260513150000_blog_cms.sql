-- Phase 3 §3.1: turn the Phase 1 blog_posts table into a CMS-managed surface.
--
-- Phase 1 pre-shipped the schema + 4 seed posts (20260511180000_blog_posts.sql)
-- with public-read RLS but no write policies — writes were intended to flow
-- through service-role. Phase 3 wires the in-app admin CMS, so we add owner-
-- side admin write policies + a storage bucket for cover image uploads.
--
-- Admin-check pattern: inline `auth.uid()` lookup against profiles.role rather
-- than the `private.is_admin()` function. Reason: the phase-3 branch is off
-- main, and `private.is_admin()` lives on phase-1's not-yet-merged validation
-- pass. Inlining keeps the migration self-contained; when phase-1 + phase-3
-- both reach main, either form works since the result is identical.

-- ---------------------------------------------------------------------------
-- Admin write policies on blog_posts
-- ---------------------------------------------------------------------------

create policy "admin inserts blog_posts"
  on public.blog_posts for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "admin updates blog_posts"
  on public.blog_posts for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "admin deletes blog_posts"
  on public.blog_posts for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins also need to read non-published rows (drafts + scheduled). The Phase 1
-- "public read for published posts" policy permits-by-OR with this one, so
-- both apply at the same time without colliding.
create policy "admin reads all blog_posts"
  on public.blog_posts for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Extend grants so the writes are actually executable (RLS is the gate, but
-- the role still needs the table-level privilege).
grant insert, update, delete on public.blog_posts to authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket for cover images
-- ---------------------------------------------------------------------------
-- Public-read bucket so /blog covers render without signed URLs. Writes are
-- admin-only via the policies below.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-covers',
  'blog-covers',
  true,
  5 * 1024 * 1024, -- 5 MB cap
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

-- Public can read any object in the bucket (matches `public = true` above).
create policy "public reads blog-covers"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'blog-covers');

create policy "admin uploads blog-covers"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'blog-covers'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "admin updates blog-covers"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'blog-covers'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "admin deletes blog-covers"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'blog-covers'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
