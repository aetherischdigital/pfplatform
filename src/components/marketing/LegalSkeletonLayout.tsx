import { AlertTriangle } from 'lucide-react'
import Container from '../ui/Container'
import { BRAND } from '../../config/brand'
import { usePageMeta } from '../../lib/usePageMeta'

/**
 * Shared skeleton for the legal placeholder pages (/privacy, /terms, /disclosures).
 *
 * Renders a branded page with a single "Draft template" callout in place of
 * actual legal content. Per the Web Development Services Agreement §2.1,
 * legal/compliance review of platform content is out of scope for the
 * developer — the Client (Thomas) provides final legal text from qualified
 * counsel before public launch.
 *
 * To make a page live:
 *   1) Replace the placeholder children with the counsel-provided text
 *   2) Remove the `noindex` flag below
 *   3) Add the route to PUBLIC_ROUTES in src/config/site.ts so it appears
 *      in sitemap.xml + llms.txt
 */

type Props = {
  /** "Privacy Policy" / "Terms of Service" / "Disclosures" */
  title: string
  /** Short description (used for og:description on the placeholder). */
  description: string
  /** Route path, e.g. "/privacy". Used for canonical URL. */
  url: string
}

export default function LegalSkeletonLayout({ title, description, url }: Props) {
  usePageMeta({
    title,
    description,
    url,
    type: 'website',
    noindex: true,
  })

  return (
    <>
      <section className="bg-gradient-to-b from-surface-50 to-white">
        <Container size="md" className="py-20">
          <p className="font-mono text-xs uppercase tracking-wider text-accent-600">Legal</p>
          <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight text-surface-900 sm:text-6xl">
            {title}
          </h1>
          <p className="mt-4 text-sm text-surface-400">
            Last updated: <em>pending counsel review</em>
          </p>
        </Container>
      </section>

      <section className="bg-white">
        <Container size="md" className="pb-24">
          <div className="overflow-hidden rounded-2xl border border-amber-300/70 bg-amber-50">
            <div className="flex items-start gap-4 p-7">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-200 text-amber-800">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-3">
                <h2 className="font-display text-xl font-semibold text-amber-900">
                  Draft template — awaiting legal review
                </h2>
                <p className="text-sm leading-relaxed text-amber-900/90">
                  This page is a placeholder. The final {title.toLowerCase()} text will be supplied by
                  {' '}{BRAND.name}'s legal counsel before public launch. Until then, this page is hidden
                  from search engines (<code className="rounded bg-amber-200/60 px-1.5 py-0.5 font-mono text-xs">noindex</code>),
                  omitted from the sitemap, and exists only so the footer link does not 404.
                </p>
                <p className="text-sm leading-relaxed text-amber-900/90">
                  The developer has not drafted any legal language for this page. Per the Web
                  Development Services Agreement §2.1, legal, tax, and compliance review of platform
                  content is out of scope and is the Client&apos;s responsibility.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
