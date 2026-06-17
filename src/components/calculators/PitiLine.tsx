import { formatUSD } from '../../lib/mortgage'

type Props = {
  monthlyPayment: number
  /** Extra principal per month, if any (default 0). */
  extraPrincipal?: number
  propertyTaxAnnual: number | null
  homeownersInsuranceAnnual: number | null
  floodInsuranceAnnual?: number | null
  pmiMipMonthly?: number | null
  hoaMonthly: number | null
}

/**
 * Inline true-PITI summary row for the calculator pages. Renders only when
 * the user has at least one PITI extra populated on their mortgage. The
 * calculator math itself stays P+I-only; this is informational.
 */
export default function PitiLine({
  monthlyPayment,
  extraPrincipal = 0,
  propertyTaxAnnual,
  homeownersInsuranceAnnual,
  floodInsuranceAnnual = null,
  pmiMipMonthly = null,
  hoaMonthly,
}: Props) {
  const hasAny =
    propertyTaxAnnual != null ||
    homeownersInsuranceAnnual != null ||
    floodInsuranceAnnual != null ||
    pmiMipMonthly != null ||
    hoaMonthly != null
  if (!hasAny) return null

  const tax = propertyTaxAnnual != null ? propertyTaxAnnual / 12 : 0
  const insurance = homeownersInsuranceAnnual != null ? homeownersInsuranceAnnual / 12 : 0
  const flood = floodInsuranceAnnual != null ? floodInsuranceAnnual / 12 : 0
  const pmi = pmiMipMonthly ?? 0
  const hoa = hoaMonthly ?? 0
  const total = monthlyPayment + extraPrincipal + tax + insurance + flood + pmi + hoa

  return (
    <div className="mt-3 border-t border-surface-200 pt-3">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-surface-700">True monthly housing cost</span>
        <span className="font-mono text-base font-semibold text-accent-700">
          {formatUSD(total)}
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-surface-500">
        <span>P&amp;I + extra {formatUSD(monthlyPayment + extraPrincipal)}</span>
        {propertyTaxAnnual != null && <span>· tax {formatUSD(tax)}</span>}
        {homeownersInsuranceAnnual != null && <span>· insurance {formatUSD(insurance)}</span>}
        {floodInsuranceAnnual != null && <span>· flood {formatUSD(flood)}</span>}
        {pmiMipMonthly != null && pmiMipMonthly > 0 && <span>· PMI/MIP {formatUSD(pmi)}</span>}
        {hoaMonthly != null && hoaMonthly > 0 && <span>· HOA {formatUSD(hoa)}</span>}
      </div>
    </div>
  )
}
