import { ArrowRight, Compass, Eye, ShieldCheck } from 'lucide-react'
import Container from '../../components/ui/Container'
import { ButtonLink } from '../../components/ui/Button'
import { BRAND } from '../../config/brand'

const values = [
  {
    icon: Compass,
    title: 'You own the ledger',
    body: 'No bank logins. No auto-sync. The platform tracks what should be true; you enter what your statement says is true. Mismatches are where the value lives.',
  },
  {
    icon: Eye,
    title: 'The math is checkable',
    body: 'Every projection shows its inputs. Every prepayment is the exact principal portion of a specific payment. No rounded numbers, no opaque models — if the math is wrong, you can see it.',
  },
  {
    icon: ShieldCheck,
    title: 'Your data, your call',
    body: 'Encrypted at rest and in transit. No selling, no sharing, no surprise integrations. The export button is always one click away.',
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
            It deserves a tool built specifically for it — and one that doesn't take the bank's word for it.
          </p>
        </Container>
      </section>

      <section className="bg-white">
        <Container size="md" className="py-20">
          <figure className="mb-12 overflow-hidden rounded-2xl">
            <img
              src="https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1600&q=80"
              alt="A sunlit desk with a notebook and morning coffee — the kind of place a homeowner keeps their books."
              className="aspect-[16/9] w-full object-cover"
              loading="lazy"
            />
            <figcaption className="mt-3 text-center text-xs italic text-surface-400">
              The platform is the math. You are the ledger-keeper.
            </figcaption>
          </figure>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-surface-900 sm:text-4xl">
            Why {BRAND.name} exists.
          </h2>
          <div className="mt-6 space-y-5 text-lg leading-relaxed text-surface-600">
            <p>
              Most homeowners never see their amortization schedule. They sign a Note at closing,
              receive monthly statements, and trust the numbers in the corner of the page. Servicers
              change hands. Payments get misapplied. Escrow analyses come out wrong. Almost nobody
              catches it, because almost nobody is keeping their own books.
            </p>
            <p>
              {BRAND.name} exists to flip that. We start with the Personal Financial Statement — the
              same instrument a banker uses to evaluate a borrower — and turn it into a living ledger
              you control. Every scheduled payment becomes a numbered row, with the exact principal
              and interest split known the day the loan closes. Every prepayment is sent in the
              precise principal-portion amount of one or more upcoming payments, so the math is
              checkable to the penny. Every statement is a chance to confirm that the bank's
              version of your balance matches yours.
            </p>
            <p>
              The platform is deliberately manual. No bank logins. No auto-sync. The user is the
              ledger-keeper; the platform is the math. That separation is what makes the audit
              possible — and what makes the savings yours to keep.
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
