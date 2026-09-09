# Stripe intake implementation — 9 September 2026

## Current result (local and protected hosted tests; not live)

The new form now selects Stripe exclusively. Its complete original 19 controls and both consents are retained. `api/checkout.js` validates and saves the full application before creating Checkout; metadata contains binding references, not truncated intake. Supabase RPCs enforce one payment/session per application and atomically create one work item. All tables have RLS, no public/authenticated grants, and only server-role RPC access. The operator queue is a security-invoker view.

The dedicated Free London project `gkxwaeoknypueqbcqhtl` has the schema installed. Migration-owner assertions proved full-note retention, wrong-amount rejection, token conflict rejection, three repeated confirmations producing one job, public privilege denial and complete fixture rollback. MCP execute_sql is read-only (`supabase_read_only_user`); verification used an explicit migration-owner DO block, not extra public grants. Security advisor returned no findings.

Stripe TEST credentials were privately read from the authorised Aesir Solar account and verified with `/v1/account`: `acct_1S0LTfL9cBVV8DnX`. A test-only 20% exclusive VAT rate was created (`txr_1UDjvsL9cBVV8DnXutt3AZIz`). No live secret, real payment, production webhook or production deployment was configured. Secrets remain outside Git and static delivery.

**Integration access resolved:** direct clipboard paste into the private setup form obtained the complete server key without displaying it. The server REST API returned 200; the public key returned PostgreSQL 42501 permission denied. No user action is now needed on the earlier Reveal prompt.

Actual Stripe TEST evidence:
- Application `0a66df47-ecc7-425d-8cc8-f860a5ee974a`: complete 1,273-character note and both consents saved before Checkout; £250 + £50 VAT = £300; cancellation restored values with consents unchecked and reused the same session; documented test Visa payment succeeded. Both signed webhook and return confirmation yielded one work item.
- Application `0a7b2029-3abd-48ff-9692-f8cc62a90e75`: documented declined test card left status awaiting_payment with zero jobs; subsequent 3-D Secure test challenge completed. Leaving the return flow still produced one paid work item from `evt_1UDkEdL9cBVV8DnXadnwMtld` alone.
- Three concurrent signed replays returned 200 without extra jobs/events; altered raw body returned 400.
- Stripe CLI 1.43.2 forwarded genuine test completion events to localhost. Its event payload version was 2025-07-30.basil; independent Session/PaymentIntent reads used pinned 2024-06-20.
- Encrypted backup of two applications, two work items and three event records passed AES-GCM read-back verification, then restored with constraints into temporary PostgreSQL tables with exact record equality. Temporary tables were dropped; live tables were not overwritten. This is a manual backup/restore proof, not automatic or off-machine disaster recovery.

No real funds moved. Protected Vercel TEST verification completed; production credentials, DNS and the live checkout remain unchanged.

### Hosted proof and temporary-access cleanup

Deployment `dpl_6SfdNt87BVxgaL3c8FHSPggFa5Nq` ran source `c171d32` with Preview-only test credentials. Synthetic application `31303ba7-bdbd-43f2-82a1-280defc77913` was saved through its API before Checkout. A documented test Visa completed £300 (£250 + £50 VAT). Vercel request logs recorded the genuine Stripe webhook at HTTP 200. The database contained one paid test application and one ready work item. Three concurrent signed replays each returned 200 without extra work items/events; modifying the raw body returned 400. See [machine-readable evidence](hosted-test-evidence.json).

The user explicitly approved a temporary project-wide automation bypass. After testing it was revoked, the same token returned HTTP 401, and existing SSO protection was unchanged. Test endpoint `we_1UDkVML9cBVV8DnXzYqfdQW4` is disabled; its Preview signing environment variable was removed. The stable preview is rebuilt with checkout failing closed after this test window. No production alias or domain changed.

Eight actual verified-return layouts passed in installed Chromium and Playwright WebKit at 1280×720, 390×844, 740×900 and 1000×500, without horizontal overflow or page errors. Representative [narrow WebKit capture](captures/webkit-verified-390.png) and [desktop Chromium capture](captures/chromium-verified-1280.png) were visually reviewed. These are desktop browser tests on Apple M4 MacBook Air, 16 GB; not physical-phone or Safari certification.

## Behaviour and contracts

- Fixed one-item service: 25,000 pence plus a checked 20% exclusive Stripe tax rate; total must be 30,000 GBP and VAT 5,000 pence. Provider account and test/live environment are checked. Quantity/discount/amount cannot come from the client.
- 256-bit private status token stays in local browser storage; only its SHA-256 hash is stored on the server. Success URLs carry no bearer secret. A URL reference alone never verifies payment.
- One browser attempt ID is reused after uncertain failures. Payload mismatch cannot overwrite a saved application. Cancellation restores answers, with both consents unchecked for reconfirmation. Confirmed expired sessions can be explicitly restarted; uncertain unbound requests stop for review after the bounded retry window.
- Checkout creation uses a stable Stripe idempotency key and identical parameters. Session lifetime is two hours; no blind recreation after Stripe's key retention period.
- Signed raw-body webhook verifies timestamp/signature, then retrieves the Checkout Session and PaymentIntent from Stripe. Session, application, mode, amount, currency, VAT and line-item checks precede the atomic payment/job transaction. Database failure returns non-2xx so Stripe can retry.
- Status checks require the private token. A verified TEST result explicitly says no real money was taken. No-JavaScript visits retain unverified/support wording.
- Server screening rejects missing data/consents, non-GB postcodes, invalid ratings, obvious out-of-scope arrangements and EPS for review. This is **not complete suitability certification**: the existing form does not capture all individual intrinsic/registered ratings. This remains a live-launch review requirement, not something a current-only check can solve.
- Old Tyl handlers/helpers remain byte-protected for recovery/old callback compatibility; the new browser never selects them and no Tyl environment is configured. They must not be re-enabled. Stripe is the selected new path.

## Owner access and recovery

In Supabase Table Editor, `solar_operator_queue` joins paid applications to full details and work status. Filter `livemode=true` for actual paid work; test records must never initiate real application preparation. The database dashboard is the current restricted operator surface; no public admin route or email notification is fabricated.

`node scripts/solar-reconcile.mjs` uses server environment to independently verify unresolved records, including searching creation windows when a provider response arrived before local session binding. Keyset pagination advances past unresolved records and is stable when earlier records become paid. Each run checks up to 500 applications and returns an explicit continuation cursor and snapshot cutoff; `SOLAR_RECOVERY_CURSOR` and `SOLAR_RECOVERY_UNTIL` resume that scan. It never creates payments. It reports unresolved counts and exits nonzero for investigation or an unfinished scan. A regression proves that 120 earlier unresolved applications cannot hide a later paid application. This is an operator recovery tool, not an installed recurring schedule.

Free-plan inactivity pausing and lack of automatic backups remain material. An off-machine backup/key custody procedure, broader recovery pagination/scheduling, operational queue handling, anti-abuse controls and final suitability enforcement remain necessary before launch. No keep-alive workaround or paid plan was enabled.

## Remaining end-to-end release work

1. Completed: private server key, REST access and public-key permission denial.
2. Local actual test Checkout/cancellation/decline/3DS/webhook-only fulfilment and concurrent replay proved. Hosted signed delivery, repeat delivery and tamper handling also proved. Broaden expired/uncertain requests and recovery beyond these paths before launch.
3. Protected test deployment/webhook and responsive return inspection completed, followed by access revocation. Finish wider expiry/edit/retry lifecycle, operational recovery and off-machine backup custody.
4. Use live-only credentials/webhook after these checks, keeping test and live records explicit. A sandbox success is not settlement/payout proof. No real payment is authorised as a test here.
5. Migrate to `aesirsolar.co.uk` only when ready, preserving mail DNS, old order recovery and compatible historical return URLs.

## Validation so far

- Type check and full build: passed.
- Full Node run: **128/128** (117 prior plus 11 focused Stripe tests).
- Focused browser run: **21/21** (route/form suite and checkout suite). Earlier run was 17/18 before correcting the intentionally changed Tyl handoff fixture.
- Database owner verification: passed; fixtures rolled back; security advisor clean.
- Browser mocks are isolated from providers. The automated mock suites are separate from the genuine sandbox results above; neither is live settlement proof.

Sources checked 9 September 2026: Stripe [Checkout Session API](https://docs.stripe.com/api/checkout/sessions/create?api-version=2024-06-20), [idempotent requests](https://docs.stripe.com/api/idempotent_requests), [webhook signatures](https://docs.stripe.com/webhooks/signature); Supabase [roles](https://supabase.com/docs/guides/database/postgres/roles), [privileged function exposure](https://supabase.com/docs/guides/observability/advisors?queryGroups=lint&lint=0028_anon_security_definer_function_executable); NGED [G99 procedures](https://connections.nationalgrid.co.uk/g99-connection-procedures) and [fast-track routes](https://connections.nationalgrid.co.uk/get-connected/solar-and-wind/fast-track-g99), read alongside the existing stage-seven ENA claim ledger. General G99 17/50 kW thresholds are not substituted for the A1-2 SGI conditions.

## Launch preparation — further work on 9 September

The user authorised finishing live readiness and later cutover. No live credentials, production deployment, billing change or DNS change has occurred in this preparation pass.

- Added live-only durable checkout admission: up to 10 new applications per email identifier and 30 per trusted request-IP identifier per fixed hour; identical saved-application retries do not consume another allowance. Keyed digests use the server secret; raw IP addresses are not stored in counters. Database locks serialise application identity and atomic counter updates. Old counters are pruned on later activity. This is bounded abuse protection, not DDoS prevention. Public access remains denied.
- Applied `solar_checkout_rate_limits`; migration-owner checks proved quota rejection, no blocked intake row, retry exemption and public-role denial. All fixtures rolled back. Supabase security advisor returned no findings.
- The full Node suite passed **133/133**; focused browser regression passed **22/22**; typecheck/build passed. No cinematic source or original form control changed. The newly authorised recovery module is excluded from legacy byte parity and has separate behavioral tests; all original untouched providers remain byte-protected.
- The revised recovery command was run against the private test database: complete scan, zero unresolved records, no payment created.
- Stripe reports no active account tasks. A dedicated restricted live-key form was prepared but not submitted. Browser credential policy requires the user to create it. Intended permissions: Checkout Sessions write; Payment Intents, Charges/Refunds, Events, Accounts, Balance and Payouts read; Tax Rates and Webhook Endpoints write for setup. No refund or payout write permission. Reduce setup-only writes after provisioning. API permissions still need actual verification after key creation.
- Vercel team `aesir` is on Hobby. Official Hobby rules restrict commercial use. User approved preparing a Pro quote, not purchasing; billing browser currently requires sign-in.
- Public DNS before cutover: apex A `109.228.34.97`; MX `10 mailserver.livemail.co.uk`; NS `ns1/2/3.livedns.co.uk`. Fasthosts needs sign-in again. Do not change mail records or cut over while remaining release gates are open.
- Paid-application recipient/queue/alert preference is awaiting the user. Suitability evidence, recurring recovery/backup custody, live verification and domain migration remain unfinished.

References accessed 9 September 2026: [Vercel trusted request headers](https://vercel.com/docs/headers/request-headers), [Hobby commercial-use restriction](https://vercel.com/docs/plans/hobby), [NGED SGI conditions](https://connections.nationalgrid.co.uk/get-connected/solar-and-wind/fast-track-g99).
