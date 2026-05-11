-- Backfill cover_image_url for the 4 seeded blog posts.
--
-- Phase 1 runtime hot-links these from Unsplash; the Phase 3 CMS will allow
-- the admin to either paste a URL or upload to Supabase Storage. Both paths
-- write to the same cover_image_url column.

update public.blog_posts
   set cover_image_url = 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1600&q=80',
       updated_at = now()
 where slug = 'biweekly-vs-extra-principal';

update public.blog_posts
   set cover_image_url = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=80',
       updated_at = now()
 where slug = 'recast-vs-refinance';

update public.blog_posts
   set cover_image_url = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1600&q=80',
       updated_at = now()
 where slug = 'equity-isnt-cash';

update public.blog_posts
   set cover_image_url = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=80',
       updated_at = now()
 where slug = 'velocity-banking';
