import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PageHeader from '../../components/marketing/PageHeader'
import '../preview/statement.css'
import BlogCoverImage from '../../components/BlogCoverImage'
import { listPostsByDateDesc, type BlogPost } from '../../lib/blogPosts'
import { usePageMeta } from '../../lib/usePageMeta'
import { BRAND } from '../../config/brand'

export default function Blog() {
  const posts = listPostsByDateDesc()
  const [featured, ...rest] = posts

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

  return (
    <>
      <PageHeader
        kicker="Blog"
        title="Plain-English deep dives on payoff, equity, and homeownership."
        intro="The same things we'd tell a friend over coffee, written down so you can read them at 11pm."
      />

      <div className="stmt">
        <section className="stmt-section" style={{ paddingBottom: 0 }}>
          <div className="stmt-wrap">
            {featured && <FeaturedCard post={featured} />}

            {rest.length > 0 && (
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((p) => (
                  <PostCard key={p.slug} post={p} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="stmt-close">
          <div className="stmt-wrap">
            <div className="stmt-rule"><span className="l" /><span className="d" /><span className="l" /></div>
            <h2 className="stmt-display stmt-h2">Stop reading. Start running numbers.</h2>
            <p className="stmt-sub" style={{ margin: '16px auto 0', maxWidth: '30em' }}>
              The free calculator turns the ideas in these articles into your actual numbers.
            </p>
            <div className="stmt-cta" style={{ justifyContent: 'center', marginTop: 32 }}>
              <Link to="/calculator" className="stmt-btn stmt-btn--gold">Open the calculator</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

function FeaturedCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group block overflow-hidden rounded-lg border border-surface-200 bg-white shadow-card transition-[border-color,box-shadow] duration-200 hover:border-surface-300 hover:shadow-card-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
    >
      <div className="grid gap-0 lg:grid-cols-2">
        <div className="relative aspect-[16/10] lg:aspect-auto lg:h-full">
          <BlogCoverImage
            src={post.coverImage}
            alt={post.title}
            loading="eager"
            className="absolute inset-0 h-full w-full"
          />
          <span className="absolute left-4 top-4 rounded-full bg-surface-900/90 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-accent-400 backdrop-blur">
            Featured
          </span>
        </div>
        <div className="flex flex-col justify-between p-8 lg:p-10">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-accent-600">
              {post.tag}
            </span>
            <h2 className="mt-3 font-display text-2xl font-semibold leading-tight tracking-tight text-surface-900 sm:text-3xl">
              {post.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-surface-500">{post.excerpt}</p>
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-surface-200 pt-5">
            <span className="font-mono text-[11px] tabular-nums text-surface-500">
              {formatDate(post.publishedAt)} · {post.readingMinutes} min read
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
      className="group flex flex-col overflow-hidden rounded-lg border border-surface-200 bg-white shadow-card transition-[border-color,box-shadow] duration-200 hover:border-surface-300 hover:shadow-card-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
    >
      <BlogCoverImage
        src={post.coverImage}
        alt={post.title}
        className="aspect-[16/10] w-full"
      />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-accent-600">
            {post.tag}
          </span>
          <span className="font-mono text-[11px] tabular-nums text-surface-500">
            {post.readingMinutes} min
          </span>
        </div>
        <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-surface-900">
          {post.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-surface-500">{post.excerpt}</p>
        <div className="mt-5 flex items-center justify-between text-xs">
          <span className="font-mono tabular-nums text-surface-500">{formatDate(post.publishedAt)}</span>
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
