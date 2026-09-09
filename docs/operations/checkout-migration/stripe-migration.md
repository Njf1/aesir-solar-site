> **Update:** the following account-decision notes are historical. [Current implementation status](stripe-implementation.md) records the new private schema and local Stripe flow.

# Stripe — Aesir Solar account and implementation handoff

9 September 2026. The user explicitly abandoned Tyl/Fiserv in favour of Stripe, signed into the existing account, corrected its name to **Aesir Solar**, and confirmed the account is now **exclusively for Solar**. Aesir Limited is the user-confirmed legal recipient. The final website must use **aesirsolar.co.uk** after full verification.

## Authenticated inspection and changes

Read through the signed-in Stripe Dashboard, without printing secret keys or retaining personal representative information:

- Legal entity displayed: **Aesir Ltd**. Account status: **No active tasks for your account**. This does not establish successful payment, settlement or bank payout.
- Account display name was already Aesir Solar; old customer-facing name was JOB COPILOT, statement descriptor AESIR-JC, website aesir.uk and support email a Premier address.
- After the user confirmed exclusive Solar use, saved **Aesir Solar** as the trading name, **hello@aesirsolar.co.uk** as support email, **https://aesir-solar.vercel.app/contact.html** as support URL and **https://aesir-solar.vercel.app/** as current website. Saved statement descriptor **AESIR SOLAR**. Each change was verified in the resulting Dashboard details.
- Existing legal name, representative/ownership, addresses, phone, receipt-phone visibility and bank/settlement information were preserved. The UI warns some legal identity information is shared with other business accounts; no shared legal-identity change was made.
- Live API keys page has no restricted keys and an existing masked standard key. Switched the view to test mode: test keys and a historical AESIR CONSOLE restricted key are present. **No secret was exported, no key created/revoked/rotated, no webhook registered, no Checkout Session created and no charge made.** Do not repurpose the historical restricted key without checking its permissions and owner/use.
- Dashboard test mode is an inspection context, not proof that the application is configured in test mode.

Public customer-facing name and statement descriptor changes affect future payments from this account. They do not alter historical records. The account is not connected to the Solar application yet.

## Final-domain contract

**aesirsolar.co.uk is the final destination, not a later optional task.** Keep the temporary Vercel address for review/testing until the full chain works. Before cutover:

- Verify canonical root/www hosting and TLS, update trusted application origin and Stripe success/cancel/support/privacy/terms URLs to the canonical domain, and verify endpoint reachability before relying on webhooks there.
- Establish overlap/reconciliation for already-created sessions and events so a host change cannot strand a paid application. Preserve valid older returns safely; never redirect provider POSTs into marketing HTML.
- Preserve existing mail MX/TXT and unrelated DNS, plus the old order/backup/admin recovery requirements. Public old presentations retire via the route manifest after the new flow is verified.
- Keep card data on Stripe Checkout. Do not buy a custom checkout domain or change financial/payout settings without an explicit need and authorization.

## Existing source is not the replacement

`api/checkout.js` is the old dependency-free Stripe Checkout creator. It accepts only an email as essential validation, trusts request Origin/Host for returns, truncates application fields into metadata, lacks durable full-form intake/attempt persistence and has no webhook/atomic fulfilment implementation. Its optional tax-rate configuration is not validated against the required £300 total. It is not ready to activate simply by adding a key.

The local `app.js` still targets Tyl from the earlier preparation. Tyl/Commerce Hub helpers remain unwired and retained for recovery; they are no longer the intended payment path. Existing API bytes and payment configuration have not been altered in this decision pass. Production still has the known old-site fallback until the complete replacement is deployed.

## What to build and verify next

Use a Stripe-hosted Checkout Session with the existing new application page and truthful return/status page. Preserve all original fields, consents, fee, eligibility/contact support and accessibility. Use configured origins, explicit environment/account checks, one fixed application purchase and no metadata truncation as primary storage.

The successful flow must behave like this:

| Visitor/action | Required result | Current missing part |
| --- | --- | --- |
| Applicant submits the complete form. | Their complete answers and consents are saved before Checkout opens. | Durable Solar intake and server validation. |
| Applicant pays £300 and closes the tab. | A signed Stripe event and provider verification record the payment against that same application. | Verified webhook/status processing and persisted payment attempts. |
| Stripe repeats a notification or the applicant refreshes. | The same application and one work item remain; no duplicate fulfilment or new charge. | Database constraints, atomic transition and retry handling. |

No dedicated Solar database was found in the connected Supabase project list. The user first selected AESIR, but after its US$10/month quote **changed the instruction to a new, separate Aesir Solar organisation on the Free plan**. Do not create the previously proposed paid AESIR project or use its cost confirmation. Proposed free project remains `aesir-solar`, London (`eu-west-2`), subject to actual availability and zero-cost confirmation.

The user signed into Supabase. Created the separate **Aesir Solar** organisation (`ovpkjjrmzazrxgjyvehl`) via the Dashboard, verified its **Free** plan, obtained and confirmed a **US$0/month** project quote, then created **aesir-solar** (`gkxwaeoknypueqbcqhtl`) in **London / eu-west-2** via MCP. Project reports ACTIVE_HEALTHY, PostgreSQL17.6, with zero public application tables; a read-only query succeeded and security advisors returned no findings. Dashboard independently shows Free/Nano. [Provisioning evidence](supabase-provisioning.json). No other organisation/project, paid add-on, API credentials, deployment or DNS was changed. This is infrastructure readiness, not a completed secure application schema or Stripe integration. Read-only docs confirm that free projects can coexist with a paid organisation, but the two-active-free-project limit applies across owner/admin memberships, not anew for each organisation. Do not bypass that quota if reached.

Free projects can pause after a week of low activity and do not include automatic backups. Before public launch, implement a verified backup/restore procedure and fail-closed intake: if application persistence is unavailable, keep the visitor’s entries and support route, but do not open payment. Payment-event retry/reconciliation must preserve paid work through temporary database unavailability. Do not manufacture activity to evade the plan’s rules or describe the Free plan as uninterrupted production hosting.

Sources accessed 9 September 2026: [free projects alongside Pro](https://supabase.com/docs/guides/troubleshooting/keeping-free-projects-after-pro-upgrade-Kf9Xm2), [organisation billing and free quota](https://supabase.com/docs/guides/platform/billing-on-supabase), [project pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [pricing/backups](https://supabase.com/pricing). No other project data or settings were changed.

Before live mode, prove success, cancellation, decline, 3DS, expired/retried sessions, timeout/replay/concurrency, wrong amount/currency/account/environment, invalid signatures, duplicate and out-of-order events, browser-close and return-before-notification. Show the saved complete record and single actionable work item; do not call client fixtures or a branded Checkout page full fulfilment proof.

Use existing Dashboard access for setup; do not ask the user to paste passwords or keys in chat. Test and live configuration must stay separate and server-only. API access/branding/receipt settings, VAT treatment and the final provider-specific policy wording must be verified against the actual implementation.

## Sources checked

Accessed 9 September 2026:

- [Stripe-hosted Checkout](https://docs.stripe.com/checkout/quickstart): hosted payment page, return URLs and branding.
- [Checkout fulfilment](https://docs.stripe.com/checkout/fulfillment): retrieve payment state, use webhooks rather than relying on browser return, and fulfil once under repeated/concurrent calls.
- [Stripe API keys](https://docs.stripe.com/keys): separate test/live resources, restricted server access and secret management. Webhook signing secrets are separate from API keys.
- [Stripe webhook handling](https://docs.stripe.com/webhooks): HTTPS event endpoints, signature verification and retries.

No fresh implementation test suite was run for these documentation/account-profile changes. Previous b5131ee code baseline is recorded in the parent README. Stripe sandbox payment and production activation remain unproved.
