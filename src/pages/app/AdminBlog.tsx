import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import {
  fetchAllPosts,
  deletePost,
  type BlogPost,
  type PostStatus,
} from '../../lib/blogPosts'
import { Button, ButtonLink } from '../../components/ui/Button'

type Filter = 'all' | PostStatus

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<Filter>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(() => {
    return fetchAllPosts()
      .then((data) => {
        setPosts(data)
        setError(null)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load posts.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchAllPosts()
      .then((data) => {
        if (!cancelled) setPosts(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load posts.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const counts = useMemo(() => {
    const c = { total: posts.length, draft: 0, scheduled: 0, published: 0 }
    for (const p of posts) c[p.status] += 1
    return c
  }, [posts])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return posts.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (q && !p.title.toLowerCase().includes(q) && !p.slug.toLowerCase().includes(q)) {
        return false
      }
      return true
    })
  }, [posts, query, statusFilter])

  const handleDelete = async (post: BlogPost) => {
    if (!window.confirm(`Delete "${post.title}"? This can't be undone.`)) return
    setBusyId(post.id)
    setError(null)
    try {
      await deletePost(post.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-accent-600" />
            <h1 className="font-display text-2xl font-semibold tracking-tight text-surface-900">
              Blog
            </h1>
          </div>
          <p className="mt-1 text-sm text-surface-500">
            Draft, schedule, and publish posts.
          </p>
        </div>
        <ButtonLink to="/admin/blog/new" variant="primary" size="md">
          <Plus size={14} /> New post
        </ButtonLink>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CountCard label="Total" value={counts.total} />
        <CountCard label="Published" value={counts.published} accent />
        <CountCard label="Scheduled" value={counts.scheduled} />
        <CountCard label="Drafts" value={counts.draft} />
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
        >
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="rounded-2xl border border-surface-200 bg-white shadow-card">
        <header className="flex flex-col gap-3 border-b border-surface-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-400"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or slug…"
              className="w-full rounded-md border border-surface-200 bg-surface-50 py-2 pl-9 pr-3 text-sm text-surface-900 outline-none placeholder:text-surface-400 focus:border-surface-400 focus:bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Filter)}
            className="rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-surface-400"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="draft">Draft</option>
          </select>
        </header>

        {loading ? (
          <div className="p-10 text-center text-sm text-surface-500">Loading posts…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-surface-500">
            {posts.length === 0 ? 'No posts yet. Click "New post" to get started.' : 'No posts match.'}
          </div>
        ) : (
          <ul className="divide-y divide-surface-200">
            {filtered.map((p) => (
              <PostRow
                key={p.id}
                post={p}
                busy={busyId === p.id}
                onDelete={() => handleDelete(p)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function PostRow({
  post,
  busy,
  onDelete,
}: {
  post: BlogPost
  busy: boolean
  onDelete: () => void
}) {
  return (
    <li className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={post.status} />
          <span className="font-medium text-surface-900">{post.title}</span>
        </div>
        <div className="mt-1 truncate text-xs text-surface-500">
          /blog/{post.slug} · {post.tag} · {post.readingMinutes} min
          {post.status === 'scheduled' && post.scheduledAt && (
            <> · publishes {formatWhen(post.scheduledAt)}</>
          )}
          {post.status === 'published' && post.publishedAt && (
            <> · published {formatWhen(post.publishedAt)}</>
          )}
        </div>
      </div>
      <div className="flex flex-shrink-0 gap-2">
        <Link
          to={`/admin/blog/${post.id}/edit`}
          className="inline-flex items-center gap-1 rounded-md border border-surface-200 bg-white px-2.5 py-1.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
        >
          <Pencil size={12} /> Edit
        </Link>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onDelete}
          disabled={busy}
        >
          <Trash2 size={12} /> Delete
        </Button>
      </div>
    </li>
  )
}

function StatusBadge({ status }: { status: PostStatus }) {
  const styles: Record<PostStatus, string> = {
    draft: 'bg-surface-100 text-surface-600',
    scheduled: 'bg-warning-50 text-warning-700',
    published: 'bg-success-50 text-success-700',
  }
  const labels: Record<PostStatus, string> = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    published: 'Published',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}

function CountCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card">
      <div className="text-xs font-medium uppercase tracking-wider text-surface-500">{label}</div>
      <div
        className={`mt-2 font-display text-2xl font-semibold tracking-tight ${
          accent ? 'text-accent-600' : 'text-surface-900'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
