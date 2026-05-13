import { Instagram, Facebook } from 'lucide-react'
import Container from '../../components/ui/Container'
import { ButtonLink } from '../../components/ui/Button'
import { usePageMeta } from '../../lib/usePageMeta'

/**
 * Phase 3 §3.3 social embeds — scaffolded with TBD-handle placeholders until
 * Thomas provides accounts. Each card swaps to the platform's official embed
 * widget when a handle lands. API ingestion (Instagram Basic Display, FB
 * Graph, TikTok Display) is conditioned per Exhibit A on "platform access
 * permits at the time of delivery" — best-effort, not absolute.
 */

type Platform = {
  name: string
  icon: typeof Instagram
  handle: string | null // null = handle TBD
  href: string | null
  blurb: string
}

const PLATFORMS: Platform[] = [
  {
    name: 'Instagram',
    icon: Instagram,
    handle: null,
    href: null,
    blurb: 'Mortgage math in 60-second cards. Drops weekly.',
  },
  {
    name: 'Facebook',
    icon: Facebook,
    handle: null,
    href: null,
    blurb: 'Longer-form posts, neighborhood Q&A, and the occasional debate.',
  },
  {
    name: 'TikTok',
    icon: TikTokIcon,
    handle: null,
    href: null,
    blurb: 'Short videos walking through real scenarios — biweekly, recasts, the works.',
  },
]

export default function Social() {
  usePageMeta({
    title: 'Social',
    description:
      `Follow ${"Personal Financial Platform"} for short-form mortgage math, scenario walk-throughs, and homeowner Q&A.`,
    url: '/social',
    type: 'website',
  })

  return (
    <>
      <section className="bg-gradient-to-b from-surface-50 to-white">
        <Container className="py-20 text-center">
          <p className="font-mono text-xs uppercase tracking-wider text-accent-600">Social</p>
          <h1 className="mx-auto mt-3 max-w-3xl font-display text-5xl font-semibold tracking-tight text-surface-900 sm:text-6xl">
            Math in your feed.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-surface-500">
            The same plain-English breakdowns from the blog, sized for the
            platforms you actually open.
          </p>
        </Container>
      </section>

      <section className="bg-white">
        <Container className="py-16">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORMS.map((p) => (
              <PlatformCard key={p.name} platform={p} />
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-surface-50">
        <Container className="py-20 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-surface-900 sm:text-4xl">
            Or skip the scroll — run your numbers.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-surface-500">
            The free calculator does in 30 seconds what these videos walk you
            through in 60.
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink to="/calculator" variant="primary" size="lg">
              Open the calculator
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  )
}

function PlatformCard({ platform }: { platform: Platform }) {
  const Icon = platform.icon
  const pending = !platform.handle

  return (
    <div className="flex flex-col rounded-2xl border border-surface-200 bg-white p-6 shadow-card">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-accent-100 text-accent-600">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-surface-900">
            {platform.name}
          </h2>
          {pending ? (
            <span className="inline-flex items-center rounded-full bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-600">
              Handle TBD
            </span>
          ) : (
            <span className="text-xs text-surface-500">@{platform.handle}</span>
          )}
        </div>
      </div>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-surface-500">
        {platform.blurb}
      </p>
      {platform.href ? (
        <a
          href={platform.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-1 rounded text-sm font-medium text-surface-900 hover:text-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
        >
          Follow on {platform.name} →
        </a>
      ) : (
        <span className="mt-5 text-xs italic text-surface-400">
          Account launching soon.
        </span>
      )}
    </div>
  )
}

/** Inline TikTok icon — lucide-react doesn't ship one. */
function TikTokIcon({ size = 24, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  )
}
