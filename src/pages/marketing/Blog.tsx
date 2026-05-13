import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Container from '../../components/ui/Container'
import { ButtonLink } from '../../components/ui/Button'
import BlogCoverImage from '../../components/BlogCoverImage'
import { fetchPublishedPosts, type BlogPost } from '../../lib/blogPosts'
import { usePageMeta } from '../../lib/usePageMeta'
import { BRAND } from '../../config/brand'

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchPublishedPosts()
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

  usePageMeta({
    title: 'Blog — payoff strategy, equity, and homeownership math',
    description:
      "Plain-English deep dives on the mechanics of mortgage payoff, equity, and the bank's amortization math. The same things we'd tell a friend over coffee, written down so you can read them at 11pm.",
    url: '/blog',
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: `${BRAND.name} — Blog`,
      url: `${BRAND.siteUrl}/blog`,
      description:
        'Plain-English deep dives on payoff, equity, and homeownership math.',
      blogPost: posts.map((p) => ({
        '@type': 'BlogPosting',
        headline: p.title,
        description: p.excerpt,
        datePublished: p.publishedAt,
        url: `${BRAND.siteUrl}/blog/${p.slug}`,
      })),
    },
  })

  const [featured, ...rest] = posts

  return (
    <>
      <section className="bg-gradient-to-b from-surface-50 to-white">
        <Container className="py-20 text-center">
          <p className="font-mono text-xs uppercase tracking-wider text-accent-600">Blog</p>
          <h1 className="mx-auto mt-3 max-w-3xl font-display text-5xl font-semibold tracking-tight text-surface-900 sm:text-6xl">
            Plain-English deep dives on payoff, equity, and homeownership.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-surface-500">
            The same things we'd tell a friend over coffee, written down so you can read them at 11pm.
          </p>
        </Container>
      </section>

      <section className="bg-white">
        <Container className="py-16">
          {loading ? (
            <PostListSkeleton />
          ) : error ? (
            <ErrorPanel message={error} />
          ) : posts.length === 0 ? (
            <EmptyPanel />
          ) : (
            <>
              {featured && <FeaturedCard post={featured} />}
              {rest.length > 0 && (
                <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((p) => (
                    <PostCard key={p.slug} post={p} />
                  ))}
                </div>
              )}
            </>
          )}
        </Container>
      </section>

      <section className="bg-surface-50">
        <Container className="py-20 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-surface-900 sm:text-4xl">
            Stop reading. Start running numbers.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-surface-500">
            The free calculator turns the ideas in these articles into your actual numbers.
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink to="/calculator" variant="primary" size="lg">
              Open the calculator <ArrowRight size={16} />
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  )
}

function PostListSkeleton() {
  return (
    <>
      <div className="h-96 animate-pulse rounded-2xl bg-surface-100" />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl bg-surface-100" />
        ))}
      </div>
    </>
  )
}

function EmptyPanel() {
  return (
    <div className="rounded-2xl border border-dashed border-surface-200 px-6 py-16 text-center text-surface-500">
      <p className="font-display text-xl font-semibold text-surface-900">
        Nothing here yet.
      </p>
      <p className="mt-2 text-sm">
        First post is in the works. Check back soon — or run the numbers in the meantime.
      </p>
    </div>
  )
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-danger-200 bg-danger-50 px-6 py-10 text-center text-sm text-danger-700">
      Couldn't load posts: {message}
    </div>
  )
}

function FeaturedCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group block overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card transition-shadow hover:shadow-card-lg"
    >
      <div className="grid gap-0 lg:grid-cols-2">
        <div className="relative aspect-[16/10] lg:aspect-auto lg:h-full">
          <BlogCoverImage
            src={post.coverImage ?? undefined}
            alt={post.title}
            loading="eager"
            className="absolute inset-0 h-full w-full"
          />
          <span className="absolute left-4 top-4 rounded-full bg-surface-900/90 px-3 py-1 font-mono text-xs uppercase tracking-wider text-accent-400 backdrop-blur">
            Featured
          </span>
        </div>
        <div className="flex flex-col justify-between p-8 lg:p-10">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-accent-600">
              {post.tag}
            </span>
            <h2 className="mt-3 font-display text-2xl font-semibold leading-tight tracking-tight text-surface-900 sm:text-3xl">
              {post.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-surface-500">{post.excerpt}</p>
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-surface-200 pt-5">
            <span className="font-mono text-xs text-surface-400">
              {post.publishedAt ? formatDate(post.publishedAt) : ''} · {post.readingMinutes} min read
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-surface-900 group-hover:text-accent-600">
              Read article <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card transition-shadow hover:shadow-card-lg"
    >
      <BlogCoverImage
        src={post.coverImage ?? undefined}
        alt={post.title}
        className="aspect-[16/10] w-full"
      />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-accent-600">
            {post.tag}
          </span>
          <span className="font-mono text-xs text-surface-400">
            {post.readingMinutes} min
          </span>
        </div>
        <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-surface-900">
          {post.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-surface-500">{post.excerpt}</p>
        <div className="mt-5 flex items-center justify-between text-xs">
          <span className="text-surface-500">
            {post.publishedAt ? formatDate(post.publishedAt) : ''}
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-surface-900 group-hover:text-accent-600">
            Read <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
