import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createClient } from '@supabase/supabase-js'
import { BRAND } from './src/config/brand'
import { PUBLIC_ROUTES, DISALLOWED_PATHS } from './src/config/site'

/**
 * Path of the OG/social preview image, served from /public.
 * When client provides a real image, drop it at this path (or update here
 * + the file at public/) and every meta tag picks it up.
 */
const OG_IMAGE_PATH = '/og-image.svg'

const GSC_TAG = BRAND.gscVerificationToken
  ? `<meta name="google-site-verification" content="${BRAND.gscVerificationToken}" />`
  : '<!-- google-site-verification tag inactive — set BRAND.gscVerificationToken to emit it. -->'

const HTML_REPLACEMENTS: Record<string, string> = {
  '%BRAND_NAME%': BRAND.name,
  '%BRAND_HEADLINE%': BRAND.headline,
  '%BRAND_TAGLINE%': BRAND.tagline,
  '%SITE_URL%': BRAND.siteUrl,
  '%OG_IMAGE%': OG_IMAGE_PATH,
  '%GSC_VERIFICATION%': GSC_TAG,
}

type SitemapPost = {
  slug: string
  published_at: string | null
  excerpt: string
  title: string
}

/** Fetch published posts from Supabase at build time so sitemap.xml +
 *  llms.txt reflect what's actually live. Falls back to an empty list if
 *  the env vars aren't set (e.g., CI without secrets). */
async function fetchSitemapPosts(env: Record<string, string>): Promise<SitemapPost[]> {
  const url = env.VITE_SUPABASE_URL
  const anonKey = env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    console.warn(
      '[seo] Supabase env vars not set; sitemap will list pages only (no blog posts).',
    )
    return []
  }
  try {
    const client = createClient(url, anonKey)
    const { data, error } = await client
      .from('blog_posts')
      .select('slug, published_at, excerpt, title')
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
    if (error) {
      console.warn('[seo] blog_posts fetch failed:', error.message)
      return []
    }
    return (data ?? []) as SitemapPost[]
  } catch (err) {
    console.warn('[seo] blog_posts fetch threw:', err)
    return []
  }
}

/**
 * Generates robots.txt, sitemap.xml, llms.txt and templates index.html
 * from BRAND + PUBLIC_ROUTES + (at build time) the published blog_posts table.
 */
function seoFilesPlugin(env: Record<string, string>): Plugin {
  // Cached at plugin construction so repeat /sitemap.xml dev requests don't
  // re-hit Supabase on every request. Refreshes on each Vite restart.
  let postsPromise: Promise<SitemapPost[]> | null = null
  const getPosts = () => {
    if (!postsPromise) postsPromise = fetchSitemapPosts(env)
    return postsPromise
  }

  const handlers: Record<
    string,
    { type: string; build: () => Promise<string> }
  > = {
    '/robots.txt': {
      type: 'text/plain; charset=utf-8',
      build: async () => buildRobotsTxt(),
    },
    '/sitemap.xml': {
      type: 'application/xml; charset=utf-8',
      build: async () => buildSitemapXml(await getPosts()),
    },
    '/llms.txt': {
      type: 'text/plain; charset=utf-8',
      build: async () => buildLlmsTxt(await getPosts()),
    },
  }

  return {
    name: 'seo-files',

    transformIndexHtml(html) {
      let out = html
      for (const [token, value] of Object.entries(HTML_REPLACEMENTS)) {
        out = out.split(token).join(value)
      }
      return out
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        const handler = handlers[url]
        if (!handler) return next()
        handler
          .build()
          .then((body) => {
            res.setHeader('Content-Type', handler.type)
            res.setHeader('Cache-Control', 'no-store')
            res.end(body)
          })
          .catch((err) => {
            res.statusCode = 500
            res.end(String(err))
          })
      })
    },

    async generateBundle() {
      for (const [path, handler] of Object.entries(handlers)) {
        const source = await handler.build()
        this.emitFile({
          type: 'asset',
          fileName: path.replace(/^\//, ''),
          source,
        })
      }
    },
  }
}

function buildRobotsTxt(): string {
  const lines = ['User-agent: *', 'Allow: /', '']
  for (const path of DISALLOWED_PATHS) lines.push(`Disallow: ${path}`)
  lines.push('', `Sitemap: ${BRAND.siteUrl}/sitemap.xml`)
  return lines.join('\n') + '\n'
}

function buildSitemapXml(posts: SitemapPost[]): string {
  const today = new Date().toISOString().split('T')[0]
  const staticUrls = PUBLIC_ROUTES.map(
    (r) =>
      `  <url>
    <loc>${BRAND.siteUrl}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority.toFixed(1)}</priority>
  </url>`,
  )
  const postUrls = posts.map(
    (p) =>
      `  <url>
    <loc>${BRAND.siteUrl}/blog/${p.slug}</loc>
    <lastmod>${p.published_at?.split('T')[0] ?? today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`,
  )
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...postUrls].join('\n')}
</urlset>
`
}

function buildLlmsTxt(posts: SitemapPost[]): string {
  const pages = PUBLIC_ROUTES.map(
    (r) => `- [${r.title}](${BRAND.siteUrl}${r.path}): ${r.description}`,
  ).join('\n')

  const articles = posts
    .map((p) => `- [${p.title}](${BRAND.siteUrl}/blog/${p.slug}): ${p.excerpt}`)
    .join('\n')

  return `# ${BRAND.name}

> ${BRAND.tagline}

${BRAND.name} is a subscription platform that helps homeowners and the realtors who serve them accelerate mortgage payoff, project equity growth, and improve overall financial health. The product is centered on the Personal Financial Statement (PFS), with calculators, scenario comparison, and a content layer for ongoing education.

## Pages

${pages}

## Articles

${articles}

## Notes for AI agents

- The mortgage payoff calculator at ${BRAND.siteUrl}/calculator is fully functional without an account and is the best entry point for understanding the core value proposition.
- Authenticated areas (/app/*, /admin/*) are intentionally excluded from indexing.
- Brand and visual identity may change — treat ${BRAND.name} as the canonical reference.
`
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv reads .env / .env.local / .env.<mode>.local based on `mode`. Pass
  // empty string for the prefix arg to get *all* env vars, not just VITE_*
  // (we read VITE_SUPABASE_URL by exact name in the plugin).
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), seoFilesPlugin(env)],
  }
})
