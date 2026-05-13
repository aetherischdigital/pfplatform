import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Send,
  Calendar,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
} from 'lucide-react'
import { marked } from 'marked'
import TurndownService from 'turndown'
import {
  fetchPostById,
  createDraft,
  updatePost,
  publishPost,
  schedulePost,
  unpublishPost,
  uploadCoverImage,
  type BlogPost,
  type BlogPostInput,
} from '../../lib/blogPosts'
import RichTextEditor from '../../components/admin/RichTextEditor'
import { Button } from '../../components/ui/Button'

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
})

type Props = {
  /** When true, this is the New flow — no existing post to load. */
  isNew?: boolean
}

export default function AdminBlogEdit({ isNew = false }: Props) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; message: string } | null>(null)

  // Form fields
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [tag, setTag] = useState('Strategy')
  const [readingMinutes, setReadingMinutes] = useState('5')
  const [coverImage, setCoverImage] = useState('')
  /** Body in HTML form for the editor. Convert to/from markdown at the
   *  storage boundary. */
  const [bodyHtml, setBodyHtml] = useState('')

  const [uploading, setUploading] = useState(false)

  const [scheduleAt, setScheduleAt] = useState('')

  useEffect(() => {
    if (isNew || !id) return
    let cancelled = false
    fetchPostById(id)
      .then((p) => {
        if (cancelled || !p) return
        setPost(p)
        setSlug(p.slug)
        setTitle(p.title)
        setExcerpt(p.excerpt)
        setTag(p.tag)
        setReadingMinutes(String(p.readingMinutes))
        setCoverImage(p.coverImage ?? '')
        // Existing posts are stored as markdown. Convert markdown → HTML for
        // the TipTap editor. Marked returns string synchronously when given
        // a string and no async options.
        setBodyHtml(marked.parse(p.body, { async: false }) as string)
        if (p.scheduledAt) {
          // Convert UTC ISO to local datetime-local input format.
          setScheduleAt(toDatetimeLocal(p.scheduledAt))
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load post.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, isNew])

  // Auto-dismiss status banners
  useEffect(() => {
    if (!status) return
    const t = setTimeout(() => setStatus(null), 3500)
    return () => clearTimeout(t)
  }, [status])

  const collectInput = useCallback((): BlogPostInput | null => {
    if (!title.trim()) {
      setError('Title is required.')
      return null
    }
    if (!slug.trim()) {
      setError('Slug is required.')
      return null
    }
    if (!/^[a-z0-9-]+$/.test(slug.trim())) {
      setError('Slug must be lowercase letters, numbers, and hyphens only.')
      return null
    }
    const minutes = Number(readingMinutes)
    if (!Number.isFinite(minutes) || minutes <= 0) {
      setError('Reading minutes must be a positive number.')
      return null
    }
    setError(null)
    return {
      slug: slug.trim(),
      title: title.trim(),
      excerpt: excerpt.trim(),
      body: turndown.turndown(bodyHtml),
      tag: tag.trim() || 'Strategy',
      readingMinutes: Math.round(minutes),
      coverImage: coverImage.trim() || null,
    }
  }, [slug, title, excerpt, tag, readingMinutes, coverImage, bodyHtml])

  const handleSaveDraft = async (e: FormEvent) => {
    e.preventDefault()
    const input = collectInput()
    if (!input) return
    setSaving(true)
    try {
      if (isNew) {
        const newId = await createDraft(input)
        setStatus({ kind: 'ok', message: 'Draft saved.' })
        navigate(`/admin/blog/${newId}/edit`, { replace: true })
      } else if (id) {
        await updatePost(id, input)
        if (post?.status !== 'draft') {
          await unpublishPost(id)
        }
        setStatus({ kind: 'ok', message: 'Saved as draft.' })
        // Re-fetch so the local status reflects the unpublish
        const fresh = await fetchPostById(id)
        if (fresh) setPost(fresh)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    const input = collectInput()
    if (!input) return
    setSaving(true)
    try {
      let postId = id
      if (isNew) {
        postId = await createDraft(input)
      } else if (id) {
        await updatePost(id, input)
      }
      if (!postId) throw new Error('Missing post id.')
      await publishPost(postId)
      setStatus({ kind: 'ok', message: 'Published.' })
      if (isNew) navigate(`/admin/blog/${postId}/edit`, { replace: true })
      else {
        const fresh = await fetchPostById(postId)
        if (fresh) setPost(fresh)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleSchedule = async () => {
    if (!scheduleAt) {
      setError('Pick a publish date/time first.')
      return
    }
    const when = new Date(scheduleAt)
    if (Number.isNaN(when.getTime())) {
      setError('Invalid date.')
      return
    }
    if (when.getTime() <= Date.now()) {
      setError('Schedule must be in the future.')
      return
    }
    const input = collectInput()
    if (!input) return
    setSaving(true)
    try {
      let postId = id
      if (isNew) {
        postId = await createDraft(input)
      } else if (id) {
        await updatePost(id, input)
      }
      if (!postId) throw new Error('Missing post id.')
      await schedulePost(postId, when.toISOString())
      setStatus({ kind: 'ok', message: `Scheduled for ${when.toLocaleString()}.` })
      if (isNew) navigate(`/admin/blog/${postId}/edit`, { replace: true })
      else {
        const fresh = await fetchPostById(postId)
        if (fresh) setPost(fresh)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Schedule failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleUnpublish = async () => {
    if (!id) return
    setSaving(true)
    try {
      await unpublishPost(id)
      setStatus({ kind: 'ok', message: 'Moved back to draft.' })
      const fresh = await fetchPostById(id)
      if (fresh) setPost(fresh)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unpublish failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const url = await uploadCoverImage(file)
      setCoverImage(url)
      setStatus({ kind: 'ok', message: 'Cover image uploaded.' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
      // Reset the input so re-selecting the same file fires onChange again.
      e.target.value = ''
    }
  }

  // Auto-fill the slug from the title when creating a new post and the user
  // hasn't manually touched the slug field yet.
  const titlePlaceholder = useMemo(() => 'How biweekly payments actually work', [])
  const slugPlaceholder = useMemo(() => 'how-biweekly-payments-actually-work', [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-100" />
        <div className="h-96 animate-pulse rounded-2xl bg-surface-100" />
      </div>
    )
  }

  if (!isNew && !post) {
    return (
      <div className="rounded-2xl border border-danger-200 bg-danger-50 p-6 text-center text-sm text-danger-700">
        Post not found.{' '}
        <Link to="/admin/blog" className="font-medium underline">
          Back to all posts
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSaveDraft} className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            to="/admin/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 hover:text-surface-900"
          >
            <ArrowLeft size={14} /> All posts
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-surface-900">
            {isNew ? 'New post' : post?.title || 'Edit post'}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew && post?.status === 'published' && (
            <Button type="button" variant="secondary" size="md" onClick={handleUnpublish} disabled={saving}>
              <EyeOff size={14} /> Unpublish
            </Button>
          )}
          <Button type="submit" variant="secondary" size="md" disabled={saving}>
            <Save size={14} /> Save draft
          </Button>
          <Button type="button" variant="primary" size="md" onClick={handlePublish} disabled={saving}>
            <Send size={14} /> {saving ? 'Saving…' : 'Publish now'}
          </Button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700"
        >
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {status && (
        <div
          role={status.kind === 'err' ? 'alert' : 'status'}
          className={`flex items-start gap-2 rounded-md px-3 py-2 text-sm ${
            status.kind === 'err'
              ? 'border border-danger-200 bg-danger-50 text-danger-700'
              : 'border border-success-200 bg-success-50 text-success-700'
          }`}
        >
          {status.kind === 'err' ? (
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          ) : (
            <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wider text-surface-500">
                Title
              </span>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={titlePlaceholder}
                className="mt-1 w-full rounded-md border border-surface-200 bg-surface-50 px-3 py-2 text-base text-surface-900 outline-none placeholder:text-surface-400 focus:border-surface-400 focus:bg-white"
              />
            </label>
            <label className="mt-4 block">
              <span className="text-xs font-medium uppercase tracking-wider text-surface-500">
                Excerpt
              </span>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                placeholder="One-sentence hook shown on the blog index and OG tags."
                className="mt-1 w-full rounded-md border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 outline-none placeholder:text-surface-400 focus:border-surface-400 focus:bg-white"
              />
            </label>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-surface-500">
              Body
            </label>
            <RichTextEditor
              initialContent={bodyHtml}
              onChange={setBodyHtml}
              placeholder="Start writing…"
            />
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-surface-500">
              Meta
            </h2>
            <div className="mt-3 space-y-3">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-surface-500">
                  Slug
                </span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder={slugPlaceholder}
                  className="mt-1 w-full rounded-md border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 outline-none placeholder:text-surface-400 focus:border-surface-400 focus:bg-white"
                />
                <p className="mt-1 text-xs text-surface-500">URL: /blog/{slug || '…'}</p>
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-surface-500">
                  Tag
                </span>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="Strategy"
                  className="mt-1 w-full rounded-md border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 outline-none placeholder:text-surface-400 focus:border-surface-400 focus:bg-white"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-surface-500">
                  Reading minutes
                </span>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={readingMinutes}
                  onChange={(e) => setReadingMinutes(e.target.value)}
                  className="mt-1 w-full rounded-md border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 outline-none focus:border-surface-400 focus:bg-white"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-surface-500">
              Cover image
            </h2>
            <div className="mt-3 space-y-3">
              {coverImage ? (
                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="aspect-[16/9] w-full rounded-md border border-surface-200 object-cover"
                />
              ) : (
                <div className="grid aspect-[16/9] w-full place-items-center rounded-md border border-dashed border-surface-200 bg-surface-50 text-surface-400">
                  <ImageIcon size={20} />
                </div>
              )}
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-surface-500">
                  URL or upload
                </span>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://… or use upload"
                  className="mt-1 w-full rounded-md border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 outline-none placeholder:text-surface-400 focus:border-surface-400 focus:bg-white"
                />
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-surface-200 bg-white px-3 py-2 text-sm font-medium text-surface-700 hover:bg-surface-100">
                <Upload size={14} />
                {uploading ? 'Uploading…' : 'Upload image'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleCoverUpload}
                  disabled={uploading}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-surface-500">
              Schedule
            </h2>
            <p className="mt-2 text-xs text-surface-500">
              Pick a future date to auto-publish. Runs every minute via{' '}
              <code className="rounded bg-surface-100 px-1 py-0.5 font-mono text-[0.85em]">
                pg_cron
              </code>
              .
            </p>
            <label className="mt-3 block">
              <span className="text-xs font-medium uppercase tracking-wider text-surface-500">
                Publish at
              </span>
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                className="mt-1 w-full rounded-md border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 outline-none focus:border-surface-400 focus:bg-white"
              />
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-3 w-full"
              onClick={handleSchedule}
              disabled={saving || !scheduleAt}
            >
              <Calendar size={14} /> Schedule
            </Button>
          </div>

          {post && (
            <div className="rounded-2xl border border-surface-200 bg-surface-50 p-4 text-xs text-surface-500">
              <div>
                Status: <span className="font-medium text-surface-900">{post.status}</span>
              </div>
              {post.publishedAt && <div>Published: {new Date(post.publishedAt).toLocaleString()}</div>}
              {post.scheduledAt && <div>Scheduled: {new Date(post.scheduledAt).toLocaleString()}</div>}
              <div>Created: {new Date(post.createdAt).toLocaleString()}</div>
              <div>Updated: {new Date(post.updatedAt).toLocaleString()}</div>
            </div>
          )}
        </aside>
      </div>
    </form>
  )
}

/** Convert an ISO timestamp ("2026-05-13T15:30:00Z") to the local-time format
 *  expected by <input type="datetime-local"> ("2026-05-13T11:30" if the local
 *  zone is UTC-4). */
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}
