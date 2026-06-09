import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import BlogCoverImage from '../../components/BlogCoverImage'
import { getPostBySlug, listPostsByDateDesc } from '../../lib/blogPosts'
import { usePageMeta } from '../../lib/usePageMeta'
import { BRAND } from '../../config/brand'
import NotFound from '../NotFound'
import '../preview/statement.css'

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const post = slug ? getPostBySlug(slug) : undefined

  usePageMeta({
    title: post ? post.title : 'Post not found',
    description: post ? post.excerpt : 'The blog post you requested could not be found.',
    image: post?.coverImage,
    url: post ? `/blog/${post.slug}` : '/blog',
    type: 'article',
    publishedTime: post?.publishedAt,
    modifiedTime: post?.publishedAt,
    author: BRAND.name,
    jsonLd: post
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.excerpt,
          image: post.coverImage,
          datePublished: post.publishedAt,
          dateModified: post.publishedAt,
          author: { '@type': 'Organization', name: BRAND.name, url: BRAND.siteUrl },
          publisher: {
            '@type': 'Organization',
            name: BRAND.name,
            url: BRAND.siteUrl,
            logo: { '@type': 'ImageObject', url: `${BRAND.siteUrl}/og-image.png` },
          },
          mainEntityOfPage: { '@type': 'WebPage', '@id': `${BRAND.siteUrl}/blog/${post.slug}` },
          articleSection: post.tag,
          wordCount: post.body.split(/\s+/).length,
        }
      : null,
  })

  if (!post) return <NotFound />

  const otherPosts = listPostsByDateDesc()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3)

  return (
    <div className="stmt">
      {/* ── Masthead ─────────────────────────────────────────────────────── */}
      <section className="stmt-section--alt" style={{ padding: '56px 0' }}>
        <div className="stmt-wrap" style={{ maxWidth: 760 }}>
          <Link
            to="/blog"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--soft)' }}
          >
            <ArrowLeft size={14} /> All posts
          </Link>
          <div style={{ marginTop: 28 }}>
            <span className="stmt-label">{post.tag}</span>
            <h1 className="stmt-display" style={{ marginTop: 12, fontSize: 'clamp(36px, 5vw, 58px)', lineHeight: 1.04 }}>
              {post.title}
            </h1>
            <p className="stmt-sub" style={{ marginTop: 18 }}>{post.excerpt}</p>
            <div className="stmt-mono" style={{ marginTop: 22, fontSize: 11, letterSpacing: '0.08em', color: 'var(--faint)' }}>
              {formatDate(post.publishedAt)} · {post.readingMinutes} MIN READ
            </div>
          </div>
        </div>
      </section>

      {/* ── Cover ────────────────────────────────────────────────────────── */}
      <div className="stmt-wrap" style={{ maxWidth: 760, marginTop: 40 }}>
        <div style={{ borderRadius: 4, overflow: 'hidden', border: '1px solid var(--color-accent-400)', outline: '1px solid color-mix(in srgb, var(--color-accent-400) 30%, transparent)', outlineOffset: 4 }}>
          <BlogCoverImage src={post.coverImage} alt={post.title} loading="eager" className="aspect-[21/9] w-full" />
        </div>
      </div>

      {/* ── Article ──────────────────────────────────────────────────────── */}
      <section className="stmt-section" style={{ paddingTop: 48 }}>
        <article className="stmt-wrap" style={{ maxWidth: 720 }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: (props) => <p style={{ margin: '0 0 22px', fontSize: 19, lineHeight: 1.78, color: 'var(--soft)' }} {...props} />,
              h2: (props) => (
                <h2 className="stmt-display" style={{ margin: '44px 0 14px', fontSize: 32, fontWeight: 600, color: 'var(--color-surface-900)' }} {...props} />
              ),
              h3: (props) => (
                <h3 className="stmt-display" style={{ margin: '32px 0 10px', fontSize: 23, fontWeight: 600, color: 'var(--color-surface-900)' }} {...props} />
              ),
              ul: (props) => <ul style={{ margin: '0 0 22px 22px', display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none' }} {...props} />,
              ol: (props) => <ol style={{ margin: '0 0 22px 22px', display: 'flex', flexDirection: 'column', gap: 8 }} {...props} />,
              li: (props) => <li style={{ fontSize: 18, lineHeight: 1.65, color: 'var(--soft)' }} {...props} />,
              strong: (props) => <strong style={{ fontWeight: 600, color: 'var(--color-surface-900)' }} {...props} />,
              em: (props) => <em style={{ fontStyle: 'italic' }} {...props} />,
              a: ({ href, children, ...rest }) => {
                const isInternal = typeof href === 'string' && href.startsWith('/') && !href.startsWith('//')
                const style = { color: 'var(--gold-deep)', textDecoration: 'underline', textUnderlineOffset: 2 } as const
                if (isInternal && href) {
                  return <Link to={href} style={style}>{children}</Link>
                }
                return <a href={href} target="_blank" rel="noopener noreferrer" style={style} {...rest}>{children}</a>
              },
              code: (props) => (
                <code className="stmt-mono" style={{ background: 'var(--color-surface-100)', padding: '2px 6px', borderRadius: 3, fontSize: '0.9em' }} {...props} />
              ),
              blockquote: (props) => (
                <blockquote style={{ margin: '28px 0', borderLeft: '2px solid var(--color-accent-400)', paddingLeft: 22, fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 24, lineHeight: 1.35, color: 'var(--color-surface-900)' }} {...props} />
              ),
              hr: () => (
                <div className="stmt-rule" style={{ maxWidth: 220, margin: '40px auto' }}>
                  <span className="l" /><span className="d" /><span className="l" />
                </div>
              ),
            }}
          >
            {post.body}
          </ReactMarkdown>
        </article>
      </section>

      {/* ── Keep reading ─────────────────────────────────────────────────── */}
      <section className="stmt-section stmt-section--alt">
        <div className="stmt-wrap" style={{ maxWidth: 760 }}>
          <span className="stmt-label">Keep reading</span>
          <div style={{ marginTop: 24, display: 'grid', gap: 14 }}>
            {otherPosts.map((p) => (
              <Link
                key={p.slug}
                to={`/blog/${p.slug}`}
                className="group"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: 20, borderRadius: 4, border: '1px solid var(--line)', background: 'var(--color-white)', outline: '1px solid color-mix(in srgb, var(--color-accent-400) 22%, transparent)', outlineOffset: 3 }}
              >
                <div style={{ minWidth: 0 }}>
                  <span className="stmt-ptag" style={{ color: 'var(--gold-deep)' }}>{p.tag}</span>
                  <div className="stmt-display" style={{ marginTop: 4, fontSize: 20, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.title}
                  </div>
                </div>
                <ArrowRight size={16} style={{ flexShrink: 0, color: 'var(--gold-deep)' }} />
              </Link>
            ))}
          </div>
          <div className="stmt-cta" style={{ justifyContent: 'center', marginTop: 40 }}>
            <Link to="/calculator" className="stmt-btn stmt-btn--gold">Run your numbers <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
