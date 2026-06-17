import { AlertTriangle } from 'lucide-react'
import Container from '../ui/Container'
import PageHeader from './PageHeader'
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
      <PageHeader
        kicker="Legal"
        title={title}
        size="md"
        intro={
          <span className="text-sm">
            Last updated: <em>pending counsel review</em>
          </span>
        }
      />

      <section className="bg-white">
        <Container size="md" className="pb-24">
          <div className="flex items-center gap-3 rounded-xl border border-warning-200 bg-warning-50 p-5 text-sm text-warning-700">
            <AlertTriangle size={16} className="flex-shrink-0" />
            <span><strong className="font-semibold">Draft template.</strong> Awaiting counsel-provided content.</span>
          </div>
        </Container>
      </section>
    </>
  )
}
