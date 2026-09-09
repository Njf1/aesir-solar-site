# Checkout and real-domain consolidation — Stripe

**Current decision, 9 September 2026:** the user has cancelled the Tyl/Fiserv integration plan and selected the existing **Aesir Solar Stripe account**. The user confirms this account is now exclusively for Aesir Solar. **Aesir Limited remains the legal business receiving the payments.**

Current handoff: [Stripe account preparation and complete checkout requirements](stripe-migration.md).

**Final public domain: `aesirsolar.co.uk`.** The user reaffirmed that the new site must move there once everything works. Vercel is the current testing/review address, not a replacement for that domain. Preserve root/www routing, existing email DNS and historical payment records during cutover.

## Actual state

- Stripe Dashboard access works. Legal business is displayed as **Aesir Ltd**; Account status shows **no active tasks**. This is not an end-to-end payment or payout certification.
- Customer-facing Stripe name, support email/URL, website and statement descriptor were updated and saved for Solar after the user confirmed exclusive account use. Test mode is accessible. No keys were created/exported, no new payment sessions or charges were made, and no deployment/DNS change occurred in this account-preparation pass.
- The repository still contains the old incomplete Stripe `/api/checkout` handler and the local Tyl-only frontend. They have **not** been switched on. The complete form-save/payment/work-item chain still needs implementation and proof.
- No dedicated Solar database is configured in the candidate. Read-only connected Supabase project inventory found no Solar project. The user has been asked whether to use the existing AESIR organisation for a dedicated Solar database, with any cost confirmed before creation.

## Delivery that must be proved

1. Save all 19 original installation controls, both consents and server-recorded policy evidence against a stable application reference before offering payment.
2. Open branded Stripe Checkout for exactly **£250 fee + £50 VAT = £300**, quantity one, using server-controlled configuration and retry-safe payment attempts.
3. Verify the account/environment, saved session/payment identity, amount, currency and paid status. Signed webhooks and server-side retrieval must work even when the browser never returns.
4. Record payment and create **one actionable Aesir application**, including concurrent/duplicate delivery and delayed/failed payment tests. Never label a query-string-only return paid or received.
5. Prove the whole flow in test mode, update actual provider copy and all routes, configure production securely, then cut over `aesirsolar.co.uk` with the established route/content preservation requirements. No live money is a fixture.

## Evidence and recovery

- [Real-domain route manifest](route-manifest.md)
- [Public inventory](public-route-inventory.json) and [private backup manifest](recovery-manifest.json)
- [Historical Tyl preparation checkpoint](tyl-preparation-checkpoint.md), [gateway inspection](authenticated-inspection.md) and [Commerce Hub comparison](commerce-hub-assessment.md). These remain evidence/recovery material, not instructions to activate Tyl.
- Recoverable pre-switch implementation: **b5131ee**, branch `experience/checkout-consolidation`; original pre-migration tag `experience-checkout-migration-before` at **606e290**. The original `/Users/nick/Projects/Aesir Solar/site` checkout remains untouched.
- Existing source baseline: type/build, **117 Node**, **18 focused checkout/route browser** and **10 no-JS legal-page viewport** checks passed at b5131ee. This provider-decision/account-settings pass changes documentation only; those counts are a prior baseline, not a Stripe integration rerun.
