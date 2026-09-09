# Aesir Solar — live Stripe checkout and domain

**Released 9 September 2026:** [aesirsolar.co.uk](https://aesirsolar.co.uk/) serves the new site. The user approved Production credentials, £300 Stripe checkout, application alerts and the root/www domain move. Mail DNS and the original WordPress recovery records were preserved.

- **[Current release and operator handover](release-2026-09-09.md)** — what is live, how to handle paid applications, verification and practical limits.
- [Current route manifest](route-manifest.md) — new and legacy destinations, truthful historical returns and retired WordPress presentation.
- [Implementation and test history](stripe-implementation.md) — durable intake, genuine Stripe sandbox evidence, one work item, recovery and alerts. Earlier pending-release statements describe their dated phase; the current handover supersedes them.
- [Public route inventory](public-route-inventory.json), [private recovery manifest](recovery-manifest.json) and [Supabase provisioning record](supabase-provisioning.json).

The legal merchant is **Aesir Limited**, displayed as **Aesir Ltd** in Stripe, trading as Aesir Solar. The account is exclusively Solar. The service remains **£250 fee + £50 VAT = £300 per suitable G99 Form A1-2 application**, for preparation, submission and follow-up across Great Britain. Payment does not buy installation or guarantee network approval.

## Historical decisions and recovery

The user cancelled Tyl/Fiserv in favour of Stripe. [Stripe migration plan](stripe-migration.md), [Tyl preparation](tyl-preparation-checkpoint.md), [gateway inspection](authenticated-inspection.md) and [Commerce Hub comparison](commerce-hub-assessment.md) remain historical evidence, not instructions to enable another provider.

Original pre-migration tag `experience-checkout-migration-before` points to `606e290`. The original `/Users/nick/Projects/Aesir Solar/site` checkout and private WordPress archive are intact. Do not restore old public payment links as a cosmetic rollback: the payment backend, database and domain must be reviewed together.
