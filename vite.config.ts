import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { BRAND } from './src/config/brand'
import { PUBLIC_ROUTES, DISALLOWED_PATHS } from './src/config/site'
import { BLOG_POSTS } from './src/lib/blogPosts'

/**
 * Path of the OG/social preview image, served from /public.
 * When client provides a real image, drop it at this path (or update here
 * + the file at public/) and every meta tag picks it up.
 */
const OG_IMAGE_PATH = '/og-image.svg'

const HTML_REPLACEMENTS: Record<string, string> = {
  '%BRAND_NAME%': BRAND.name,
  '%BRAND_HEADLINE%': BRAND.headline,
  '%BRAND_TAGLINE%': BRAND.tagline,
  '%SITE_URL%': BRAND.siteUrl,
  '%OG_IMAGE%': OG_IMAGE_PATH,
}

/**
 * Generates robots.txt, sitemap.xml, llms.txt and templates index.html
 * from BRAND + PUBLIC_ROUTES. Serves SEO files at root paths in dev (via
 * middleware) and emits them as build assets in production.
 * Single source of truth: src/config/{brand,site}.ts.
 */
function seoFilesPlugin(): Plugin {
  const handlers: Record<string, { type: string; build: () => string }> = {
    '/robots.txt': { type: 'text/plain; charset=utf-8', build: buildRobotsTxt },
    '/sitemap.xml': { type: 'application/xml; charset=utf-8', build: buildSitemapXml },
    '/llms.txt': { type: 'text/plain; charset=utf-8', build: buildLlmsTxt },
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
        res.setHeader('Content-Type', handler.type)
        res.setHeader('Cache-Control', 'no-store')
        res.end(handler.build())
      })
    },

    generateBundle() {
      for (const [path, handler] of Object.entries(handlers)) {
        this.emitFile({
          type: 'asset',
          fileName: path.replace(/^\//, ''),
          source: handler.build(),
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

function buildSitemapXml(): string {
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
  const postUrls = BLOG_POSTS.map(
    (p) =>
      `  <url>
    <loc>${BRAND.siteUrl}/blog/${p.slug}</loc>
    <lastmod>${p.publishedAt}</lastmod>
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

function buildLlmsTxt(): string {
  const pages = PUBLIC_ROUTES.map(
    (r) => `- [${r.title}](${BRAND.siteUrl}${r.path}): ${r.description}`,
  ).join('\n')

  const articles = BLOG_POSTS.map(
    (p) => `- [${p.title}](${BRAND.siteUrl}/blog/${p.slug}): ${p.excerpt}`,
  ).join('\n')

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
export default defineConfig({
  plugins: [react(), tailwindcss(), seoFilesPlugin()],
})
