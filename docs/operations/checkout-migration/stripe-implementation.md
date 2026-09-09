# Stripe intake implementation — 9 September 2026

## Current result (local, not live)

The new form now selects Stripe exclusively. Its complete original 19 controls and both consents are retained. `api/checkout.js` validates and saves the full application before creating Checkout; metadata contains binding references, not truncated intake. Supabase RPCs enforce one payment/session per application and atomically create one work item. All tables have RLS, no public/authenticated grants, and only server-role RPC access. The operator queue is a security-invoker view.

The dedicated Free London project `gkxwaeoknypueqbcqhtl` has the schema installed. Migration-owner assertions proved full-note retention, wrong-amount rejection, token conflict rejection, three repeated confirmations producing one job, public privilege denial and complete fixture rollback. MCP execute_sql is read-only (`supabase_read_only_user`); verification used an explicit migration-owner DO block, not extra public grants. Security advisor returned no findings.

Stripe TEST credentials were privately read from the authorised Aesir Solar account and verified with `/v1/account`: `acct_1S0LTfL9cBVV8DnX`. A test-only 20% exclusive VAT rate was created (`txr_1UDjvsL9cBVV8DnXutt3AZIz`). No live secret, payment, webhook or deployment was configured. Secrets remain outside Git and static delivery.

**Integration access resolved:** direct clipboard paste into the private setup form obtained the complete server key without displaying it. The server REST API returned 200; the public key returned PostgreSQL 42501 permission denied. No user action is now needed on the earlier Reveal prompt.

Actual Stripe TEST evidence:
- Application `0a66df47-ecc7-425d-8cc8-f860a5ee974a`: complete 1,273-character note and both consents saved before Checkout; £250 + £50 VAT = £300; cancellation restored values with consents unchecked and reused the same session; documented test Visa payment succeeded. Both signed webhook and return confirmation yielded one work item.
- Application `0a7b2029-3abd-48ff-9692-f8cc62a90e75`: documented declined test card left status awaiting_payment with zero jobs; subsequent 3-D Secure test challenge completed. Leaving the return flow still produced one paid work item from `evt_1UDkEdL9cBVV8DnXadnwMtld` alone.
- Three concurrent signed replays returned 200 without extra jobs/events; altered raw body returned 400.
- Stripe CLI 1.43.2 forwarded genuine test completion events to localhost. Its event payload version was 2025-07-30.basil; independent Session/PaymentIntent reads used pinned 2024-06-20.
- Encrypted backup of two applications, two work items and three event records passed AES-GCM read-back verification, then restored with constraints into temporary PostgreSQL tables with exact record equality. Temporary tables were dropped; live tables were not overwritten. This is a manual backup/restore proof, not automatic or off-machine disaster recovery.

No real funds moved. A protected Vercel Preview deployment is being prepared with server-only TEST settings; production credentials, DNS and the live checkout remain unchanged.

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

`node scripts/solar-reconcile.mjs` uses server environment to independently verify the oldest 100 unresolved records, including searching creation windows when a provider response arrived before local session binding. It does not create payments. It reports unresolved counts and exits nonzero for investigation. This is an operator recovery tool, not an installed recurring schedule.

Free-plan inactivity pausing and lack of automatic backups remain material. An off-machine backup/key custody procedure, broader recovery pagination/scheduling, operational queue handling, anti-abuse controls and final suitability enforcement remain necessary before launch. No keep-alive workaround or paid plan was enabled.

## Remaining end-to-end release work

1. Completed: private server key, REST access and public-key permission denial.
2. Local actual test Checkout/cancellation/decline/3DS/webhook-only fulfilment and concurrent replay proved. Repeat signed delivery on Vercel; test expired/uncertain requests and recovery beyond the local happy path.
3. Configure a protected test deployment and its webhook; inspect application, Checkout and return views. Finish expiry/new-application lifecycle and recovery/backup verification.
4. Use live-only credentials/webhook after these checks, keeping test and live records explicit. A sandbox success is not settlement/payout proof. No real payment is authorised as a test here.
5. Migrate to `aesirsolar.co.uk` only when ready, preserving mail DNS, old order recovery and compatible historical return URLs.

## Validation so far

- Type check and full build: passed.
- Full Node run: **128/128** (117 prior plus 11 focused Stripe tests).
- Focused browser run: **20/20** (route/form suite and checkout suite). Earlier run was 17/18 before correcting the intentionally changed Tyl handoff fixture.
- Database owner verification: passed; fixtures rolled back; security advisor clean.
- Browser mocks are isolated from providers. None of these results is a live or sandbox end-to-end payment result.

Sources checked 9 September 2026: Stripe [Checkout Session API](https://docs.stripe.com/api/checkout/sessions/create?api-version=2024-06-20), [idempotent requests](https://docs.stripe.com/api/idempotent_requests), [webhook signatures](https://docs.stripe.com/webhooks/signature); Supabase [roles](https://supabase.com/docs/guides/database/postgres/roles), [privileged function exposure](https://supabase.com/docs/guides/observability/advisors?queryGroups=lint&lint=0028_anon_security_definer_function_executable); NGED [G99 procedures](https://connections.nationalgrid.co.uk/g99-connection-procedures) and [fast-track routes](https://connections.nationalgrid.co.uk/get-connected/solar-and-wind/fast-track-g99), read alongside the existing stage-seven ENA claim ledger. General G99 17/50 kW thresholds are not substituted for the A1-2 SGI conditions.
