import { useEffect } from 'react'
import { BRAND } from '../config/brand'

export type PageMeta = {
  title: string
  description: string
  image?: string
  /** Path only (e.g. "/blog/foo"). Site URL is prepended. */
  url?: string
  type?: 'website' | 'article'
  /** ISO 8601. Only used when type === 'article'. */
  publishedTime?: string
  modifiedTime?: string
  author?: string
  /** Arbitrary JSON-LD payload (e.g. Article schema). Replaced/removed on change. */
  jsonLd?: object | null
  /** When true, emits meta robots="noindex,nofollow". Use for drafts / unfinished pages. */
  noindex?: boolean
}

function upsertMeta(key: string, value: string, attr: 'name' | 'property' = 'name') {
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', value)
}

function upsertLink(rel: string, href: string) {
  let tag = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!tag) {
    tag = document.createElement('link')
    tag.setAttribute('rel', rel)
    document.head.appendChild(tag)
  }
  tag.setAttribute('href', href)
}

const JSON_LD_FLAG = 'data-pfp-jsonld'

function upsertJsonLd(data: object | null) {
  const existing = document.head.querySelector(`script[${JSON_LD_FLAG}]`)
  if (existing) existing.remove()
  if (data) {
    const tag = document.createElement('script')
    tag.setAttribute('type', 'application/ld+json')
    tag.setAttribute(JSON_LD_FLAG, '')
    tag.textContent = JSON.stringify(data)
    document.head.appendChild(tag)
  }
}

/**
 * Imperative head-tag manager. Sets <title>, meta description, OG/Twitter tags,
 * canonical URL, and optional JSON-LD. Lightweight alternative to react-helmet:
 * works for client-side route changes and stays accurate for any JS-executing
 * crawler. Initial HTML / OG-preview-on-first-paint is still controlled by
 * index.html — proper SSR/SSG is a Phase 4 polish item.
 */
export function usePageMeta(meta: PageMeta) {
  const jsonLdStr = meta.jsonLd ? JSON.stringify(meta.jsonLd) : ''
  useEffect(() => {
    const fullTitle = `${meta.title} — ${BRAND.name}`
    const fullUrl = meta.url ? `${BRAND.siteUrl}${meta.url}` : BRAND.siteUrl
    const image = meta.image ?? `${BRAND.siteUrl}/og-image.svg`
    const type = meta.type ?? 'website'

    document.title = fullTitle
    upsertMeta('description', meta.description)
    upsertMeta('og:title', fullTitle, 'property')
    upsertMeta('og:description', meta.description, 'property')
    upsertMeta('og:url', fullUrl, 'property')
    upsertMeta('og:image', image, 'property')
    upsertMeta('og:type', type, 'property')
    upsertMeta('twitter:title', fullTitle)
    upsertMeta('twitter:description', meta.description)
    upsertMeta('twitter:image', image)
    upsertLink('canonical', fullUrl)
    upsertMeta('robots', meta.noindex ? 'noindex,nofollow' : 'index,follow')

    if (type === 'article') {
      if (meta.publishedTime) upsertMeta('article:published_time', meta.publishedTime, 'property')
      if (meta.modifiedTime) upsertMeta('article:modified_time', meta.modifiedTime, 'property')
      if (meta.author) upsertMeta('article:author', meta.author, 'property')
    }

    upsertJsonLd(meta.jsonLd ?? null)
  }, [
    meta.title,
    meta.description,
    meta.image,
    meta.url,
    meta.type,
    meta.publishedTime,
    meta.modifiedTime,
    meta.author,
    meta.noindex,
    jsonLdStr,
  ])
}
