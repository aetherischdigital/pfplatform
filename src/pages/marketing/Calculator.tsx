import { ArrowRight, Sparkles } from 'lucide-react'
import Container from '../../components/ui/Container'
import { ButtonLink } from '../../components/ui/Button'
import PayoffCalculator from '../../components/calculators/PayoffCalculator'

export default function Calculator() {
  return (
    <>
      <section className="bg-gradient-to-b from-surface-50 to-white">
        <Container className="py-16 text-center sm:py-20">
          <p className="font-mono text-xs uppercase tracking-wider text-accent-600">Free tool</p>
          <h1 className="mx-auto mt-3 max-w-3xl font-display text-5xl font-semibold tracking-tight text-surface-900 sm:text-6xl">
            See your payoff date in under 60 seconds.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-surface-500">
            Enter your loan, add a few extra dollars a month, and see the years and dollars you&rsquo;d save.
            No signup required.
          </p>
        </Container>
      </section>

      <section className="bg-white">
        <Container className="pb-16">
          <PayoffCalculator
            footer={
              <div className="flex items-start gap-3 rounded-xl border border-accent-200 bg-accent-100 p-5">
                <Sparkles size={16} className="mt-0.5 flex-shrink-0 text-accent-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-surface-900">
                    Want to save this scenario and track real progress?
                  </p>
                  <p className="mt-1 text-sm text-surface-600">
                    Sign up for free to compare multiple strategies side by side and update them as
                    your finances change.
                  </p>
                </div>
                <ButtonLink to="/signup" variant="primary" size="sm">
                  Start free <ArrowRight size={14} />
                </ButtonLink>
              </div>
            }
          />
        </Container>
      </section>

      <section className="bg-surface-50">
        <Container size="md" className="py-20">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-surface-900 sm:text-3xl">
            How this works
          </h2>
          <div className="mt-6 grid gap-6 text-sm leading-relaxed text-surface-600 sm:grid-cols-2">
            <p>
              Every month, your scheduled payment splits between interest (paid to the bank) and
              principal (reducing your balance). Early in a 30-year loan, most of your payment is
              interest.
            </p>
            <p>
              When you pay extra, all of it goes to principal. That smaller balance generates less
              interest next month — and the savings compound over decades.
            </p>
            <p>
              The chart shows two paths: your baseline schedule and the scenario with extra
              principal. The shaded area between them is the interest you don&rsquo;t pay.
            </p>
            <p className="text-surface-500">
              <em>
                Educational only. Doesn&rsquo;t model PMI, taxes, insurance, or refinance scenarios — those
                live in the full app once you sign up.
              </em>
            </p>
          </div>
        </Container>
      </section>
    </>
  )
}
