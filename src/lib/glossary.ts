/**
 * Plain-English definitions for the technical terms used across the marketing
 * site and dashboard. Mirrored into the Tooltip primitive — when a term shows
 * up in copy, wrap it with <Term term="amortization">amortization</Term> so the
 * definition is always one tap away.
 *
 * The voice matches the rest of the site: direct, concrete, second-person,
 * no jargon explaining jargon.
 */

export type GlossaryKey =
  | 'amortization'
  | 'principal'
  | 'interest'
  | 'pi'
  | 'recast'
  | 'escrow'
  | 'note'
  | 'pmi'
  | 'pfs'
  | 'prepayment'

export const GLOSSARY: Record<GlossaryKey, string> = {
  amortization:
    "The payment-by-payment schedule of your loan. Every month's payment is split between principal and interest in an exact ratio fixed the day you sign — and that ratio shifts over time.",
  principal:
    'The portion of your payment that reduces your loan balance. Every extra dollar to principal saves you interest on every future month.',
  interest:
    "The cost the lender charges on your remaining balance. Early in a 30-year mortgage, most of your monthly payment is interest — that's why prepayment math works.",
  pi: 'Principal & Interest — the part of your monthly mortgage payment that pays down the loan itself. Excludes property taxes and insurance (those are escrow).',
  recast:
    'Re-amortizing your loan after a big principal payment. Same rate, same payoff date, but a smaller monthly payment because the balance is lower.',
  escrow:
    "The lender-held account that pays your property taxes and homeowners insurance. Funded by a portion of your monthly payment on top of P&I.",
  note: "The legal document signed at closing that sets your loan's terms — rate, term, payment amount, and the full amortization schedule.",
  pmi: "Private Mortgage Insurance. Extra insurance the lender requires when you put less than 20% down. Drops off automatically once you cross 22% equity on the original schedule.",
  pfs: 'Personal Financial Statement — the snapshot of everything you own (assets) and owe (liabilities), plus monthly cash flow. The same instrument a banker uses to evaluate a borrower.',
  prepayment:
    'Sending extra money to principal beyond your scheduled payment. The right way to do it: in the exact principal portion of an upcoming scheduled payment, so it retires that payment entirely.',
}
