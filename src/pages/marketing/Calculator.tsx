import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import Container from '../../components/ui/Container'
import { ButtonLink } from '../../components/ui/Button'
import PageHeader from '../../components/marketing/PageHeader'
import PayoffCalculator from '../../components/calculators/PayoffCalculator'
import '../preview/statement.css'

export default function Calculator() {
  return (
    <>
      <PageHeader
        kicker="Free tool · no signup"
        title="See your payoff date in under 60 seconds."
        intro="Enter your loan, add a few extra dollars a month, and see the years and dollars you'd save. No signup required."
      />

      <section>
        <Container className="py-16">
          <PayoffCalculator
            footer={
              <div
                className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                style={{
                  borderRadius: 4,
                  border: '1px solid var(--color-accent-400)',
                  outline: '1px solid color-mix(in srgb, var(--color-accent-400) 30%, transparent)',
                  outlineOffset: 4,
                  background: 'var(--color-surface-100)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'Marcellus', serif",
                      textTransform: 'uppercase',
                      letterSpacing: '0.22em',
                      fontSize: 11,
                      color: 'var(--color-accent-600)',
                    }}
                  >
                    Save your scenario
                  </div>
                  <p className="mt-1.5 text-sm text-surface-600">
                    Sign up free to compare multiple strategies side by side and update them as your
                    finances change.
                  </p>
                </div>
                <ButtonLink to="/signup" variant="accent" size="sm" className="flex-shrink-0">
                  Start free <ArrowRight size={14} />
                </ButtonLink>
              </div>
            }
          />
        </Container>
      </section>

      <div className="stmt">
        <section className="stmt-section stmt-section--alt">
          <div className="stmt-wrap" style={{ maxWidth: 880 }}>
            <span className="stmt-label">The mechanics</span>
            <h2 className="stmt-display stmt-h2" style={{ marginTop: 14 }}>How this works.</h2>
            <div
              style={{
                marginTop: 28,
                display: 'grid',
                gap: 28,
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              }}
            >
              <Mechanic n="01" title="Interest first">
                Every month, your scheduled payment splits between interest (paid to the bank) and
                principal (reducing your balance). Early in a 30-year loan, most of it is interest.
              </Mechanic>
              <Mechanic n="02" title="Extra goes to principal">
                When you pay extra, all of it goes to principal. That smaller balance generates less
                interest next month — and the savings compound over decades.
              </Mechanic>
              <Mechanic n="03" title="The shaded area is yours">
                The chart shows two paths: your baseline schedule and the scenario with extra
                principal. The shaded area between them is the interest you don&rsquo;t pay.
              </Mechanic>
            </div>
            <p className="stmt-sub" style={{ marginTop: 28, fontSize: 16, fontStyle: 'italic' }}>
              Educational only. Doesn&rsquo;t model PMI, taxes, insurance, or refinance scenarios —
              those live in the full app once you sign up.
            </p>
          </div>
        </section>
      </div>
    </>
  )
}

function Mechanic({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
      <div className="stmt-mono" style={{ fontSize: 13, color: 'var(--gold-deep)' }}>{n}</div>
      <h3 className="stmt-display" style={{ fontSize: 22, fontWeight: 600, margin: '8px 0 0' }}>{title}</h3>
      <p style={{ marginTop: 8, fontSize: 16, color: 'var(--soft)' }}>{children}</p>
    </div>
  )
}
