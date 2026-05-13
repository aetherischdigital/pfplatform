import { supabase } from './supabase'

// ---------------------------------------------------------------------------
// Types — mirror public.blog_posts (Phase 1 schema + Phase 3 RLS additions).
//
// Field name choices preserve the Phase-1 static-array shape so existing
// consumers (Blog.tsx + BlogPost.tsx) only need to switch from sync helpers
// to async fetches.
// ---------------------------------------------------------------------------

export type PostStatus = 'draft' | 'scheduled' | 'published'

export type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  tag: string
  publishedAt: string | null
  scheduledAt: string | null
  readingMinutes: number
  coverImage: string | null
  status: PostStatus
  authorId: string | null
  createdAt: string
  updatedAt: string
}

export type BlogPostInput = {
  slug: string
  title: string
  excerpt: string
  body: string
  tag: string
  readingMinutes: number
  coverImage: string | null
}

type Row = {
  id: string
  slug: string
  title: string
  excerpt: string
  body_markdown: string
  tag: string
  reading_minutes: number
  status: PostStatus
  published_at: string | null
  scheduled_at: string | null
  cover_image_url: string | null
  author_id: string | null
  created_at: string
  updated_at: string
}

function toBlogPost(r: Row): BlogPost {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    body: r.body_markdown,
    tag: r.tag,
    publishedAt: r.published_at,
    scheduledAt: r.scheduled_at,
    readingMinutes: r.reading_minutes,
    coverImage: r.cover_image_url,
    status: r.status,
    authorId: r.author_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

const SELECT_COLUMNS =
  'id, slug, title, excerpt, body_markdown, tag, reading_minutes, status, published_at, scheduled_at, cover_image_url, author_id, created_at, updated_at'

// ---------------------------------------------------------------------------
// Public read API — RLS lets anon + authenticated read published rows whose
// published_at <= now(). Future-dated published rows stay hidden.
// ---------------------------------------------------------------------------

export async function fetchPublishedPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(SELECT_COLUMNS)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toBlogPost)
}

export async function fetchPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(SELECT_COLUMNS)
    .eq('slug', slug)
    .maybeSingle<Row>()
  if (error) throw error
  return data ? toBlogPost(data) : null
}

// ---------------------------------------------------------------------------
// Admin write API — gated by RLS (admin role required).
// ---------------------------------------------------------------------------

export async function fetchAllPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(SELECT_COLUMNS)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toBlogPost)
}

export async function fetchPostById(id: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(SELECT_COLUMNS)
    .eq('id', id)
    .maybeSingle<Row>()
  if (error) throw error
  return data ? toBlogPost(data) : null
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

export async function createDraft(input: BlogPostInput): Promise<string> {
  const author_id = await currentUserId()
  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      slug: input.slug.trim(),
      title: input.title.trim(),
      excerpt: input.excerpt.trim(),
      body_markdown: input.body,
      tag: input.tag.trim(),
      reading_minutes: input.readingMinutes,
      cover_image_url: input.coverImage,
      status: 'draft',
      author_id,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id as string
}

export async function updatePost(id: string, input: BlogPostInput): Promise<void> {
  const { error } = await supabase
    .from('blog_posts')
    .update({
      slug: input.slug.trim(),
      title: input.title.trim(),
      excerpt: input.excerpt.trim(),
      body_markdown: input.body,
      tag: input.tag.trim(),
      reading_minutes: input.readingMinutes,
      cover_image_url: input.coverImage,
    })
    .eq('id', id)
  if (error) throw error
}

/** Publish immediately. Sets status=published and published_at=now() if
 *  not already set. */
export async function publishPost(id: string): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('blog_posts')
    .update({ status: 'published', published_at: now, scheduled_at: null })
    .eq('id', id)
  if (error) throw error
}

/** Schedule for a future timestamp. The pg_cron job
 *  publish-scheduled-blog-posts will flip status to published when the time
 *  passes. publishAt is an ISO timestamp. */
export async function schedulePost(id: string, publishAt: string): Promise<void> {
  const { error } = await supabase
    .from('blog_posts')
    .update({ status: 'scheduled', scheduled_at: publishAt, published_at: null })
    .eq('id', id)
  if (error) throw error
}

export async function unpublishPost(id: string): Promise<void> {
  const { error } = await supabase
    .from('blog_posts')
    .update({ status: 'draft', scheduled_at: null })
    .eq('id', id)
  if (error) throw error
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from('blog_posts').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Cover image upload to storage.
// ---------------------------------------------------------------------------

export async function uploadCoverImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const key = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('blog-covers').upload(key, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })
  if (error) throw error
  const { data } = supabase.storage.from('blog-covers').getPublicUrl(key)
  return data.publicUrl
}
