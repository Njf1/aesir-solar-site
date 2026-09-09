# Checkout and real-domain consolidation — work in progress

Inspected **9 September 2026**. This is a local migration checkpoint, **not a deployed fix or a working transaction certification**.

## What is broken

The new Vercel application still deliberately falls back to the old WordPress cart. Vercel has no payment environment variables configured. The actual `aesirsolar.co.uk` domain continues to serve the older WordPress site on Fasthosts. A visual reskin of the Vercel application did not replace the real-domain checkout.

Three practical contracts must be completed:

| This should look like | What happens now | Missing connection |
| --- | --- | --- |
| The applicant supplies installation details once, then opens Tyl from the new design. | The browser tries unconfigured Tyl, then unconfigured Stripe, then the old WooCommerce billing page. | Configured, tested Tyl handoff on the new site. |
| Aesir can retrieve all 19 answers and both consents against an application reference. | The new form saves a browser-local draft; the old shop does not receive that full record. | Durable intake before payment and a stable order/application association. |
| One verified £300 payment produces one actionable Aesir application. | The Vercel notification handler logs a hash result; it does not create durable work or bind a verified payment to the expected application. | Authoritative payment verification, idempotent state and work creation. |

## Evidence collected

- [`current-state.json`](current-state.json): public DNS, pages, Vercel domain assignment and environment-variable **names only**. No environment variables are configured. No secrets or customer records were read or included.
- [`public-route-inventory.json`](public-route-inventory.json): anonymous public WordPress page/product metadata and sitemap locations. Product **308** is `begin-your-application`, configured as **not sold individually**.
- [`legacy-checkout-observation.json`](legacy-checkout-observation.json), [`legacy-checkout.png`](legacy-checkout.png): isolated anonymous cart with one public product; no identity/card data, checkout POST, order or charge. All POSTs and external-origin traffic blocked. It shows **£300 including £50 VAT** and payment method **`ag_tyl_checkout` — Tyl By NatWest Checkout**.
- Public DNS points to `109.228.34.97` / `2a00:da00:100f:f000::200`, with Fasthosts `livedns.co.uk` nameservers. Mail uses `mailserver.livemail.co.uk`; website cutover must preserve mail records and other unrelated DNS.
- Vercel currently has only `aesir-solar.vercel.app` assigned. Root/www real-domain assignment has not been changed.

The old page is the merchant's WooCommerce billing page **before** Tyl. It is not evidence that Tyl itself requires that old design. Public inspection identifies the gateway family; its installed version, credentials, mode, webhook settings and actual order-processing behavior still require authenticated inspection.

## Local implementation prepared

- `app.js` now makes only the existing `/api/tyl-checkout` request. Removed the Stripe and old-cart fallback, cart quantity timer and misleading save/handoff comments.
- Failed, malformed, interrupted or stalled initialization stays on the new application page with entries intact, a focused explanatory message and a working contact link. The wait is bounded at 15 seconds. It makes no claim that an application or payment was received.
- The existing successful Tyl form-POST response contract, 19 fields, separate consents, amount, prefill and return context remain covered with local fixtures.
- Terms/privacy payment-route wording now describes the Tyl-only candidate; fee, refund terms and other policy sections remain unchanged.
- Old byte fixtures were relaxed only for intentionally changed `app.js`. Existing server handlers/helpers/data/dependency bytes remain protected. **Their existing operational defects remain unresolved.**

**Do not deploy this frontend change by itself.** With the current empty production configuration it would stop the unwanted fallback but would not provide a functioning replacement payment route. No code, DNS, settings or credentials were changed on production in this task.

## Access needed to complete the work

Requested signed-in browser access to:

1. **WordPress admin for aesirsolar.co.uk** — inspect the installed AG Tyl gateway version/settings (without copying secrets into chat), checkout setup, stored application/order fields, callbacks, refund handling and backup capability.
2. **Fasthosts** — inspect web hosting, backups, DNS and a safe private origin/admin arrangement. Retiring old public pages must not destroy transaction history or break merchant notifications.
3. **Tyl merchant administration** — establish whether the account uses Classic Connect, confirm configured return/notification paths and hosted-page branding, and obtain/use a separate test environment through an approved secret channel. The merchant account must remain the existing one.

Authenticated access has not yet been supplied. Do not choose an arbitrary new database or change merchant/API product merely because the new frontend is on Vercel. Reusing WooCommerce as the order/payment back office behind the new customer experience is a candidate to assess after inspection; it is not implemented or presumed verified.

## Remaining acceptance and cutover

1. Back up old files/database/settings and verify a restore path; preserve historical orders, refunds and any existing applicant records.
2. Select and implement the durable intake/payment route with all original answers and server-recorded consents. Server controls amount/currency/quantity and application suitability handling. Unknown cases must not become certified eligibility.
3. Verify signed notifications against the expected stored transaction, including reference, amount, currency and final status; test duplicates, out-of-order notifications, retries, declined/pending/cancelled outcomes and return-before-notification. A browser return/query string is not proof. Create exactly one actionable work item.
4. Reuse the existing Tyl merchant, style all merchant-owned pages consistently, and apply the supported branding on the Tyl-hosted page. Keep card data on Tyl. Test through the account's documented test environment with no live charges.
5. Implement the [route migration manifest](route-manifest.md) on the new real-domain deployment. Establish callback routing before retiring any WooCommerce paths. Preserve email DNS and administrative/transaction access privately.
6. Verify every route, legacy link, form, policy and payment state; check navigation/Back/responsiveness and complete end-to-end test orders in isolation. Only then perform the authorized public cutover and verify live read-only routes. No real customer order/payment is a test.

## Sources checked

Accessed 9 September 2026:

- [We are AG Tyl setup guide](https://weareag.co.uk/docs/tyl-by-natwest/setup-tyl-by-natwest/setup-guide/): WooCommerce settings and separate test/live account details.
- [We are AG gateway changelog](https://weareag.co.uk/product/tyl-by-natwest-for-woocommerce/): identifies `ag_tyl_checkout` as Classic Connect; newer hosted checkout is a different method. Does **not** identify the installed version on this site.
- [Tyl hosted payment page integration guide](https://www.tylbynatwest.com/assets/downloads/tyl-hosted-payment-pages-guide.pdf): hosted card entry, test credentials and integration checklist. Account-specific current configuration must be checked.
- [Fiserv Connect response fields](https://docs.fiserv.dev/public/docs/response-fields): basic response hash fields and separately enabled extended response hash. The basic hash alone does not bind every response field/order ID. Do not treat current return-handler tests as an authoritative end-to-end verification.
- [Tyl website payments](https://www.tylbynatwest.com/help-and-support/online-payments-new/website-payments-new): supported hosted-page customization for the newer product. Its exact settings are not assumed to apply to this older Classic Connect account.

## Verification and recovery

- `npm run build`, `npm run typecheck`: passed.
- `npm test`: **84/84 Node checks**.
- Focused application/route browser regression: **18/18** (four new checkout cases plus fourteen existing route/form/access cases). This is **not** a full cinematic-suite rerun.
- Additional local visual review: see [`local-browser-review.json`](local-browser-review.json). Chromium and WebKit at 1280×720, 1600×1000, 390×844, 740×900 and 1000×500. All traffic local/mocked; no physical-phone certification.
- Review hardware: Apple M4 MacBook Air, 16 GB. Chrome for Testing **151.0.7922.34**, Playwright WebKit **26.6**. Ten viewport captures/checks passed. The narrow WebKit and desktop Chromium error/help compositions were also visually inspected; labels, consents, fee and contact remain legible.
- No scene, camera, renderer, texture, motion-control or supporting layout changes. Cinematic delivery remains **255,082 B JS gzip / 1,844,085 B media**.
- Recovery tag: **`experience-checkout-migration-before` → `606e290`**. Local working branch: **`experience/checkout-consolidation`**. Do not merge/push to the production branch until the complete flow is ready. The original `/Users/nick/Projects/Aesir Solar/site` remains untouched.
