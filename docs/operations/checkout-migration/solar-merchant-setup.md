> Superseded: the user selected Stripe on 9 September 2026. Retained for recovery; do not continue Tyl onboarding. See [current Stripe handoff](stripe-migration.md).

# Aesir Limited — direct Solar payments preparation

9 September 2026. **User-confirmed legal merchant: Aesir Limited**, trading as Aesir Solar. The intended service is one suitable G99 Form A1-2 application across Great Britain: £250 preparation/submission/follow-up fee + £50 VAT = £300 total. The fee does not buy installation or approval.

## Current position

The inspected Tyl portal/store belongs to Premier's existing setup and has Premier URLs. Do not relabel that store, reuse its keys or change its settlement account for Solar. Asked the user whether **Aesir Limited already has its own Tyl merchant account**; answer pending. Registration number, registered address, VAT details and Tyl's approval of the business/site have not been verified by this task and must not be inferred from Premier's details.

The user has authorized the plugin-free direct integration. New local `lib/commerce-hub.js` implements the documented Checkout API client without introducing a framework, dependency or WooCommerce/AG integration. It is **not wired to the public payment handlers or a database yet**. No actual account, store, key, checkout, charge or application was created by these tests.

## Implemented locally

- Direct hosted-checkout creation with server-fixed GBP 300, subtotal 250 and VAT 50; exact-byte HMAC-SHA256 request signing and configured callback origin.
- Separate `SOLAR_*` configuration; no fallback to legacy shared-secret or Premier credentials. Live mode only in production; sandbox refused in production even if `NATWEST_ALLOW_SANDBOX=1` exists.
- Read-back verification against the **documented top-level** Checkout retrieval response: saved checkout ID, store, original merchant transaction reference, SALE type, actual `approvedAmount.total` and `approvedAmount.currency`, approval result and provider transaction ID.
- Strict pending/declined/partial/approved distinctions. Unknown/missing/contradictory facts do not authorize work. An approved SALE is not described as completed bank settlement.
- Eight-second bounded requests, bounded response bodies, no redirects while sending authentication headers, no raw provider/card details in errors/results and no automatic checkout-creation retries. An interrupted or malformed creation may have succeeded at the provider and is classified as uncertain.
- Terms and privacy identify **Aesir Limited, trading as Aesir Solar**; shared supporting-page footer identifies the trading name. Source templates and generated HTML remain aligned. No unverified company/VAT number or address was added.

The hosted checkout redirect allowlist follows the documented `checkout-lane.com` / sandbox `ci.checkout-lane.com` examples. Actual account sandbox evidence must confirm hosts/schema before activation; it may require a narrowly reviewed adjustment. No raw card data should be stored in Solar's application record.

## Environment contract — values not configured

| Name | Purpose |
| --- | --- |
| `SOLAR_TYL_MODE` | `sandbox` for isolated development/preview; `live` for production only. |
| `SOLAR_TYL_API_KEY` | API key issued for Aesir Limited's approved store and environment. |
| `SOLAR_TYL_API_SECRET` | Matching API secret; server only. |
| `SOLAR_TYL_STORE_ID` | Approved Aesir Limited store; separate sandbox/live values as issued. |
| `SOLAR_CHECKOUT_ORIGIN` | Trusted HTTPS site origin used for return/notification URLs; never browser-supplied Origin/Host. |

The provider base is selected from the official schema's exact production/sandbox endpoints. Keep all values in the relevant secret/environment manager, not source or chat. Do not change Premier's existing `NATWEST_*` configuration.

## Provider request draft — NOT SENT

> We need online payments for **Aesir Limited**, trading as **Aesir Solar**, at **https://aesirsolar.co.uk**. The site sells a G99 Form A1-2 application service for £250 + £50 VAT (£300 total) per suitable application; it does not sell installation or guarantee network approval.
>
> We want a direct **Commerce Hub Checkouts API / hosted Checkout Solution** integration without a WooCommerce or AG plugin. Please confirm whether Aesir Limited already has an approved merchant account/store for this activity and website, or what onboarding is required.
>
> Please provide or enable separate sandbox and production Checkouts API access for the approved Aesir Limited store, explain the authorized account-holder/developer access process, and confirm hosted-page branding and notification/status-query requirements. This must be separate from Premier Composites' merchant setup.

Send/request through the account holder's appropriate Tyl onboarding/support route only after establishing existing-account status and completing any required business details. No support form, message or onboarding declaration has been submitted by Codex.

## Remaining implementation and acceptance

1. Establish Aesir Limited's merchant account/store, account-holder email and sandbox/production API approval. [NatWest API access guidance](https://natwestpayments-api-docs.readme.io/docs/getting-started) requires the main holder or an authorized contact.
2. Implement durable full-form intake, independent consents/policy version evidence, stable application/payment attempts and server suitability handling. A request timeout cannot silently create another application/charge.
3. Wire checkout, status, notifications and reconciliation to that durable state. Re-query the **stored** checkout; do not pass webhook bodies to the verifier as trusted provider responses. Atomically bind unique transactions and create one actionable Aesir work item. A late failure must not replace an approved payment.
4. Prove the complete chain in the Aesir sandbox, including failed intake, wrong/missing amount/currency/reference, duplicate/out-of-order events, browser close, retry and return-before-notification. Local client fixtures are not a substitute.
5. Preserve historical records, replace all old public routes under the new design, verify operational handoff and account/site requirements, then perform the authorized release. No public cutover or live charge has occurred in this preparation pass.

## Sources

- [Official Checkout Solution OpenAPI 1.0.7](https://natwestpayments-api-docs.readme.io/openapi/68a87eceaf314e2be11c7a69), accessed 9 September 2026. Confirms exact endpoints, request signing, create response wrapper and top-level retrieval schema. The retrieval model uses `approvedAmount` and `requestSent.merchantTransactionId`; old Premier fallback parsing is not used.
- [NatWest API access](https://natwestpayments-api-docs.readme.io/docs/getting-started), accessed 9 September 2026. Merchant/authorized-contact registration and provider-reviewed API key requests.
- [Hosted Checkout Solution](https://natwestpayments-api-docs.readme.io/docs/introduction-2), accessed 9 September 2026. Redirects, notification URLs and hosted-page customization.

Verification: type checking and build pass; **117/117 Node tests**, **18/18 focused checkout/route browser checks**, and **10/10 legal-page viewport checks** in Chromium/WebKit with JavaScript disabled. The final runs use local fixtures, with no provider requests or charges. See the migration README and `merchant-review/report.json` for scope and device limitations. Company identity is supplied by the user, not independently certified by Tyl or Companies House in this task.
