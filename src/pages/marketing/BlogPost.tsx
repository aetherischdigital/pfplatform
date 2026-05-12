import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Container from '../../components/ui/Container'
import { ButtonLink } from '../../components/ui/Button'
import BlogCoverImage from '../../components/BlogCoverImage'
import { getPostBySlug, listPostsByDateDesc } from '../../lib/blogPosts'
import { usePageMeta } from '../../lib/usePageMeta'
import { BRAND } from '../../config/brand'
import NotFound from '../NotFound'

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
          author: {
            '@type': 'Organization',
            name: BRAND.name,
            url: BRAND.siteUrl,
          },
          publisher: {
            '@type': 'Organization',
            name: BRAND.name,
            url: BRAND.siteUrl,
            logo: {
              '@type': 'ImageObject',
              url: `${BRAND.siteUrl}/og-image.png`,
            },
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${BRAND.siteUrl}/blog/${post.slug}`,
          },
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
    <>
      <section className="bg-gradient-to-b from-surface-50 to-white">
        <Container size="md" className="py-16">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-surface-500 transition-colors hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
          >
            <ArrowLeft size={14} />
            All posts
          </Link>
          <div className="mt-8">
            <span className="text-xs font-medium uppercase tracking-wider text-accent-600">
              {post.tag}
            </span>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-surface-900 sm:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 text-lg text-surface-500">{post.excerpt}</p>
            <div className="mt-6 flex items-center gap-3 text-xs text-surface-500">
              <span>{formatDate(post.publishedAt)}</span>
              <span aria-hidden>·</span>
              <span>{post.readingMinutes} min read</span>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-white">
        <Container size="md" className="pt-2 pb-10">
          <BlogCoverImage
            src={post.coverImage}
            alt={post.title}
            loading="eager"
            className="aspect-[21/9] w-full rounded-2xl"
          />
        </Container>
      </section>

      <section className="bg-white">
        <Container size="md" className="pb-16">
          <article className="text-surface-700">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: (props) => (
                  <p className="mb-5 text-base leading-[1.75]" {...props} />
                ),
                h2: (props) => (
                  <h2
                    className="mt-12 mb-4 font-display text-2xl font-semibold tracking-tight text-surface-900"
                    {...props}
                  />
                ),
                h3: (props) => (
                  <h3
                    className="mt-10 mb-3 font-display text-lg font-semibold text-surface-900"
                    {...props}
                  />
                ),
                ul: (props) => (
                  <ul className="mb-5 ml-5 list-disc space-y-2" {...props} />
                ),
                ol: (props) => (
                  <ol className="mb-5 ml-5 list-decimal space-y-2" {...props} />
                ),
                li: (props) => <li className="leading-relaxed" {...props} />,
                strong: (props) => (
                  <strong className="font-semibold text-surface-900" {...props} />
                ),
                em: (props) => <em className="italic" {...props} />,
                a: (props) => (
                  <a
                    className="text-accent-600 underline underline-offset-2 hover:text-accent-500"
                    {...props}
                  />
                ),
                code: (props) => (
                  <code
                    className="rounded bg-surface-100 px-1.5 py-0.5 font-mono text-[0.9em] text-surface-900"
                    {...props}
                  />
                ),
                blockquote: (props) => (
                  <blockquote
                    className="my-6 border-l-4 border-accent-400 pl-4 italic text-surface-600"
                    {...props}
                  />
                ),
                hr: () => <hr className="my-10 border-surface-200" />,
              }}
            >
              {post.body}
            </ReactMarkdown>
          </article>
        </Container>
      </section>

      <section className="border-t border-surface-200 bg-surface-50">
        <Container size="md" className="py-14">
          <h2 className="font-display text-xl font-semibold tracking-tight text-surface-900">
            Keep reading
          </h2>
          <div className="mt-5 grid gap-3">
            {otherPosts.map((p) => (
              <Link
                key={p.slug}
                to={`/blog/${p.slug}`}
                className="group flex items-center justify-between gap-4 rounded-xl border border-surface-200 bg-white p-5 transition-[colors,transform] duration-200 hover:-translate-y-0.5 hover:border-surface-300 motion-reduce:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium uppercase tracking-wider text-accent-600">
                    {p.tag}
                  </div>
                  <div className="mt-1 truncate font-display text-base font-semibold text-surface-900">
                    {p.title}
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="flex-shrink-0 text-surface-300 transition-colors group-hover:text-surface-900"
                />
              </Link>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <ButtonLink to="/calculator" variant="primary" size="lg">
              Run your numbers <ArrowRight size={16} />
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
