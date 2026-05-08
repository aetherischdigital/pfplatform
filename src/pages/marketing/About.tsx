import { ArrowRight, Compass, Eye, ShieldCheck } from 'lucide-react'
import Container from '../../components/ui/Container'
import { ButtonLink } from '../../components/ui/Button'
import { BRAND } from '../../config/brand'

const values = [
  {
    icon: Compass,
    title: 'Useful, not flashy',
    body: 'Tools you reach for monthly, not a dashboard you visit once and forget. Every feature pays for the screen real estate it takes.',
  },
  {
    icon: Eye,
    title: 'Honest about uncertainty',
    body: "We don't pretend the future is a single line. Projections show ranges, assumptions are visible, and you can challenge the math.",
  },
  {
    icon: ShieldCheck,
    title: 'Your data, your call',
    body: 'Bank-grade encryption. No selling, no sharing, no surprise integrations. The export button is always one click away.',
  },
]

export default function About() {
  return (
    <>
      <section className="bg-gradient-to-b from-surface-50 to-white">
        <Container className="py-20 text-center">
          <p className="font-mono text-xs uppercase tracking-wider text-accent-600">About {BRAND.name}</p>
          <h1 className="mx-auto mt-3 max-w-3xl font-display text-5xl font-semibold tracking-tight text-surface-900 sm:text-6xl">
            Built for the home you live in.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-surface-500">
            For most of us, our home is the largest financial decision we'll ever make.
            It deserves a tool built specifically for it.
          </p>
        </Container>
      </section>

      <section className="bg-white">
        <Container size="md" className="py-20">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-surface-900 sm:text-4xl">
            Why {BRAND.name} exists.
          </h2>
          <div className="mt-6 space-y-5 text-lg leading-relaxed text-surface-600">
            <p>
              Generic personal finance apps treat your home as a line item. Mortgage
              calculators stop at "monthly payment." Spreadsheets don't update themselves.
              The single biggest asset most homeowners own gets the worst tooling.
            </p>
            <p>
              {BRAND.name} starts with the Personal Financial Statement — the same instrument
              banks use to evaluate borrowers — and turns it into a living plan you can
              update over time. Strategies for paying off your home faster, projections
              for equity over decades, and the moves that change them in plain English.
            </p>
            <p className="text-surface-400">
              <em>(Brand story to be developed with client — this is provisional copy.)</em>
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-surface-50">
        <Container className="py-20">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-surface-900 sm:text-4xl">
            What we believe.
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {values.map((v) => {
              const Icon = v.icon
              return (
                <div
                  key={v.title}
                  className="rounded-2xl border border-surface-200 bg-white p-7 shadow-card"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-900 text-accent-400">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold text-surface-900">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-surface-500">{v.body}</p>
                </div>
              )
            })}
          </div>
        </Container>
      </section>

      <section className="bg-white">
        <Container size="md" className="py-20 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-surface-900 sm:text-4xl">
            Try it free.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-surface-500">
            See your numbers, then see your plan. Five minutes, no card.
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink to="/signup" variant="primary" size="lg">
              Start free <ArrowRight size={16} />
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  )
}
