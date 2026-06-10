import { Link } from 'react-router-dom'
import PageHeader from '../../components/marketing/PageHeader'
import Term from '../../components/ui/Term'
import { BRAND } from '../../config/brand'
import '../preview/statement.css'

/* About — rebuilt on the Statement vocabulary: editorial prose in EB Garamond,
 * a Marcellus-captioned plate image, and the commitments as a numbered method. */

const values = [
  {
    title: 'You own the ledger',
    body: 'No bank logins. No auto-sync. The platform tracks what should be true; you enter what your statement says is true. Mismatches are where the value lives.',
  },
  {
    title: 'The math is checkable',
    body: 'Every projection shows its inputs. Every prepayment is additional principal that retires your loan faster. No rounded numbers, no opaque models — if the math is wrong, you can see it.',
  },
  {
    title: 'Your data, your call',
    body: 'Encrypted at rest and in transit. No selling, no sharing, no surprise integrations. The export button is always one click away.',
  },
]

export default function About() {
  return (
    <>
      <PageHeader
        kicker={`About ${BRAND.name}`}
        title="Built for the home you live in."
        intro={
          <>
            When was the last time you actually verified your mortgage statement? For most of us, our
            home is the largest financial decision we&rsquo;ll ever make — and almost nobody is
            checking the math. {BRAND.name} exists because the math is checkable. You just need the
            right tools.
          </>
        }
      />

      <div className="stmt">
        {/* ── The why ────────────────────────────────────────────────────── */}
        <section className="stmt-section">
          <div className="stmt-wrap" style={{ maxWidth: 820 }}>
            <figure
              style={{ margin: 0, marginBottom: 48, overflow: 'hidden', borderRadius: 4, border: '1px solid var(--gold)', outline: '1px solid color-mix(in srgb, var(--color-accent-400) 30%, transparent)', outlineOffset: 4 }}
            >
              <picture>
                <source type="image/webp" srcSet="/img/about-desk-900.webp 900w, /img/about-desk-1600.webp 1600w" sizes="(min-width: 768px) 768px, 100vw" />
                <img
                  src="/img/about-desk-1600.jpg"
                  srcSet="/img/about-desk-900.jpg 900w, /img/about-desk-1600.jpg 1600w"
                  sizes="(min-width: 768px) 768px, 100vw"
                  alt="A sunlit desk with a notebook and morning coffee — where a homeowner keeps their books."
                  style={{ aspectRatio: '16 / 9', width: '100%', objectFit: 'cover', display: 'block' }}
                  loading="lazy"
                  decoding="async"
                />
              </picture>
              <figcaption
                style={{ borderTop: '1px solid var(--line)', background: 'var(--color-surface-100)', padding: '12px 16px', textAlign: 'center', fontFamily: "'Marcellus', serif", fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold-deep)' }}
              >
                The platform is the math. You are the ledger-keeper.
              </figcaption>
            </figure>

            <span className="stmt-label">The why</span>
            <h2 className="stmt-display stmt-h2" style={{ marginTop: 14 }}>Why {BRAND.name} exists.</h2>
            <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 20, fontSize: 19, lineHeight: 1.7, color: 'var(--soft)' }}>
              <p>
                Your mortgage isn&rsquo;t really about years or months — it&rsquo;s a fixed schedule of
                numbered payments, each broken down to the penny the day you sign the{' '}
                <Term term="note">Note</Term>. The lender knows it. The borrower almost never does. So
                when a payment gets misapplied, an <Term term="escrow">escrow</Term> analysis comes
                out wrong, or a servicer transfer loses a payment in the seam, the math drifts — and
                nobody catches it, because nobody&rsquo;s keeping their own books.
              </p>
              <p>
                {BRAND.name} exists to flip that. We start with the Personal Financial Statement — the
                same instrument a banker uses to evaluate a borrower — and turn it into a living
                ledger you control. Every scheduled payment becomes a numbered row, with the exact
                principal and interest split known the day the loan closes. Every prepayment is
                additional principal that retires the loan faster, and the math is checkable to the
                penny.
              </p>
              <p>
                The platform is deliberately manual. No bank logins. No auto-sync. You are the
                ledger-keeper; the platform is the math. That separation is what makes the audit
                possible — and what makes the savings yours to keep.
              </p>
            </div>
          </div>
        </section>

        {/* ── Commitments ────────────────────────────────────────────────── */}
        <section className="stmt-section stmt-section--alt">
          <div className="stmt-wrap">
            <div className="stmt-head">
              <span className="stmt-label">What we believe</span>
              <h2 className="stmt-display stmt-h2" style={{ marginTop: 14 }}>
                Three commitments, kept to the penny.
              </h2>
            </div>
            <ol className="stmt-method" style={{ marginTop: 36 }}>
              {values.map((v, i) => (
                <li key={v.title}>
                  <span className="no">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h4>{v.title}</h4>
                    <p>{v.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Closing ────────────────────────────────────────────────────── */}
        <section className="stmt-close">
          <div className="stmt-wrap">
            <div className="stmt-rule"><span className="l" /><span className="d" /><span className="l" /></div>
            <h2 className="stmt-display stmt-h2">Get started.</h2>
            <p className="stmt-sub" style={{ margin: '16px auto 0', maxWidth: '30em' }}>
              See your numbers, then see your plan. Five minutes to set up.
            </p>
            <div className="stmt-cta" style={{ justifyContent: 'center', marginTop: 32 }}>
              <Link to="/signup" className="stmt-btn stmt-btn--gold">Get started</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
