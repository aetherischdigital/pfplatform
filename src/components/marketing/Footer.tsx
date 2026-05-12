import { Link } from 'react-router-dom'
import { BRAND } from '../../config/brand'
import Container from '../ui/Container'
import Wordmark from '../Wordmark'

const sections = [
  {
    title: 'Product',
    links: [
      { to: '/how-it-works', label: 'How it works' },
      { to: '/calculator', label: 'Calculator' },
      { to: '/pricing', label: 'Pricing' },
      { to: '/signup', label: 'Start free' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { to: '/blog', label: 'Blog' },
      { to: '/about', label: 'About' },
      { to: '/how-it-works#realtors', label: 'For realtors' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/privacy', label: 'Privacy' },
      { to: '/terms', label: 'Terms' },
      { to: '/disclosures', label: 'Disclosures' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-surface-200 bg-white">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,_1fr)]">
          <div className="space-y-4">
            <Wordmark size="md" />
            <p className="max-w-xs font-display text-sm italic text-accent-600">
              Eliminating debt &amp; creating ownership.
            </p>
          </div>
          {sections.map((s) => (
            <div key={s.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                {s.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {s.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-surface-600 hover:text-surface-900">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-surface-200 pt-6 text-xs text-surface-500 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.</span>
          <span>Educational. Not financial advice.</span>
        </div>
      </Container>
    </footer>
  )
}
