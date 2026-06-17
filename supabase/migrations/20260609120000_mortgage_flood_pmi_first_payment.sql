-- Finish Thomas's "Step 2 — Add a Mortgage" PITI breakdown.
-- Adds the two missing escrow lines (flood insurance, PMI/MIP) and the first
-- scheduled payment date, which anchors the numbered amortization schedule to
-- real calendar dates. All nullable — null means "not entered", never $0.
alter table public.mortgages
  add column if not exists flood_insurance_annual numeric(14,2)
    check (flood_insurance_annual is null or flood_insurance_annual >= 0),
  add column if not exists pmi_mip_monthly numeric(14,2)
    check (pmi_mip_monthly is null or pmi_mip_monthly >= 0),
  add column if not exists first_payment_date date;

comment on column public.mortgages.flood_insurance_annual is
  'Annual flood-insurance premium in dollars. Adds to true PITI alongside property_tax_annual, homeowners_insurance_annual, pmi_mip_monthly, and hoa_monthly.';
comment on column public.mortgages.pmi_mip_monthly is
  'Monthly PMI (conventional) or MIP (FHA) premium in dollars. Adds to true PITI.';
comment on column public.mortgages.first_payment_date is
  'Date the first scheduled mortgage payment is/was due. Anchors the numbered amortization schedule to real calendar dates.';
