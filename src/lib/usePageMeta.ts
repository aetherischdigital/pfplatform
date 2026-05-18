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

function upsertJsonLdString(serialized: string) {
  const existing = document.head.querySelector(`script[${JSON_LD_FLAG}]`)
  if (existing) existing.remove()
  if (serialized) {
    const tag = document.createElement('script')
    tag.setAttribute('type', 'application/ld+json')
    tag.setAttribute(JSON_LD_FLAG, '')
    tag.textContent = serialized
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
  // jsonLd is an object — comparing by reference would re-run on every render.
  // Compare by serialized string instead, and feed that string into upsert.
  const jsonLdStr = meta.jsonLd ? JSON.stringify(meta.jsonLd) : ''
  const {
    title,
    description,
    image,
    url,
    type: typeProp,
    publishedTime,
    modifiedTime,
    author,
    noindex,
  } = meta
  useEffect(() => {
    const fullTitle = `${title} — ${BRAND.name}`
    const fullUrl = url ? `${BRAND.siteUrl}${url}` : BRAND.siteUrl
    const resolvedImage = image ?? `${BRAND.siteUrl}/og-image.png`
    const type = typeProp ?? 'website'

    document.title = fullTitle
    upsertMeta('description', description)
    upsertMeta('og:title', fullTitle, 'property')
    upsertMeta('og:description', description, 'property')
    upsertMeta('og:url', fullUrl, 'property')
    upsertMeta('og:image', resolvedImage, 'property')
    upsertMeta('og:type', type, 'property')
    upsertMeta('twitter:title', fullTitle)
    upsertMeta('twitter:description', description)
    upsertMeta('twitter:image', resolvedImage)
    upsertLink('canonical', fullUrl)
    upsertMeta('robots', noindex ? 'noindex,nofollow' : 'index,follow')

    if (type === 'article') {
      if (publishedTime) upsertMeta('article:published_time', publishedTime, 'property')
      if (modifiedTime) upsertMeta('article:modified_time', modifiedTime, 'property')
      if (author) upsertMeta('article:author', author, 'property')
    }

    upsertJsonLdString(jsonLdStr)
  }, [
    title,
    description,
    image,
    url,
    typeProp,
    publishedTime,
    modifiedTime,
    author,
    noindex,
    jsonLdStr,
  ])
}
