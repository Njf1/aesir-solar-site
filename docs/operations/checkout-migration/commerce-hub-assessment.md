> Superseded: the user selected Stripe on 9 September 2026. Retained for recovery; do not continue Tyl onboarding. See [current Stripe handoff](stripe-migration.md).

# Solar direct checkout — Premier comparison and gateway inspection

9 September 2026. User clarified that the remembered plugin-free Fiserv work was for Premier, supplied its activation summary, and requested the same approach for Solar. **Target: a direct Commerce Hub Checkout integration for Solar, subject to the correct merchant/store and API access.** No merchant settings or production code changed during this review.

## Confirmed in the signed-in gateway

- The logged-in IPG store exactly matches the store saved in the old Solar WordPress gateway settings (compared privately; identifiers/secrets omitted).
- Its success URL is `https://www.premiercomposites.shop/checkout/order-pay/`.
- Its failure and transaction-notification URLs are both `https://www.premiercomposites.shop/wc-api/ag_tyl_checkout`.
- Both automatic return checkboxes and “Overwrite Store URLs” are enabled. Consequently, individual Connect requests can override those defaults: these settings alone do **not** prove where a historical payment actually returned or which legal entity may trade through the account.
- The separately signed-in Tyl sales portal lists Premier Composites physical/online stores; its online store website is Premier's. An Aesir merchant/store approval has not been established.
- The legacy Virtual Terminal advertises retirement on 30 October 2026 and links to the new terminal. This concerns the administration UI; it is not proof that Classic Connect payment processing ends on that date or that API credentials have been granted.
- Opened the official Fiserv developer portal, `https://portal.fiserv.dev/`, which currently requires separate sign-in. No registration, API key creation or provider request was submitted.

## What to carry across

The inspected Premier checkout client (`lib/payments/tyl.ts`, current checkout HEAD `494441e`) uses `/exp/v1/checkouts`, an exact-byte HMAC-SHA256 request signature, a hosted checkout URL, and a server-to-server query of the stored checkout ID. The order route writes an order before asking for checkout; the settlement path uses that order's stored checkout ID rather than substituting an ID supplied by a webhook.

These are useful patterns for Solar. The shop cart/catalogue/shipping, Premier merchant identity, marketing fan-out, existing database records and deployment instructions are **not** Solar defaults. No Premier source, environment, database or provider configuration was changed or copied into Solar in this review.

Desired Solar outcomes:

1. Save all 19 application controls, both consents and server-recorded policy/time evidence before requesting payment. Price is server-controlled: £250 + £50 VAT = £300 GBP for a suitable A1-2 application. Unknown suitability routes to review, not an automatic eligibility verdict.
2. Open a Tyl-hosted checkout branded for Solar. Keep card entry on the provider and customer-owned pages in the current Aesir design. Use the Solar-approved store and server-configured callback origin.
3. Re-query the stored checkout and verify the returned checkout ID, merchant/store, currency, actual approved amount, final SALE status and transaction identity against the expected attempt. Missing facts remain pending/manual review. Atomically record payment and create one actionable application item; duplicate notifications, late results and retries must not create duplicate work or overwrite a paid state.
4. Support browser return, delayed notification and reconciliation without treating a page visit as a payment receipt. Then retire old public WordPress presentation, keeping records recoverable.

## Corrections to “copy the exact setup”

The supplied summary is useful, but the local source needs further hardening before it becomes a Solar template:

| Finding in current Premier source | Required Solar behavior |
| --- | --- |
| `settle.ts` uses `approved == null || ...`; an absent amount passes that comparison. No explicit currency check appears in that settlement path. | Missing amount/currency cannot authorize work; require exact £300 GBP evidence from the provider. |
| `getCheckout()` returns the requested checkout ID in its result without validating the ID returned inside the provider body. | Verify the provider response's identity against the stored expected checkout, merchant and attempt. |
| `NATWEST_ALLOW_SANDBOX=1` overrides the sandbox block even when `NODE_ENV=production`. | Public production must reject test rails regardless of preview override flags; isolated tests/staging must never produce production fulfilment. |
| Paid transition is conditional on `pending`, but the failed/cancelled update is not similarly conditional. | Stale or racing failure must not overwrite a successfully recorded payment. |
| The activation runsheet describes a particular Premier deployment/source mismatch as of July. | Inspect Solar's own source/deployment and use its tested commit. Do not copy “redeploy without push” as a universal instruction. |

Three isolated local probes imported Premier's client with dummy `.invalid` configuration and mocked fetch: sandbox is rejected without override; it is accepted with the production override; and an inconsistent response checkout ID is returned without validation. All three observations matched the source. No payment, database or external provider call was made. The direct Node import emitted a module-type warning from Premier's package configuration; no dependency/package change was made to hide it.

This is not a fresh complete Premier test run or live settlement audit. The historical runsheet calls for live credentials and a later explicit real-money test; sandbox evidence or an HTTP 200 does not establish settlement/fulfilment.

## Provider access and remaining decision

The user subsequently confirmed **Aesir Limited** as the legal seller. Its Tyl account/store status is still unknown. Do not repurpose Premier's store. See [the current Solar merchant/client handoff](solar-merchant-setup.md).

Current NatWest guidance says API credentials are requested through the Fiserv developer portal by the main account holder or an authorized contact, using the email on the merchant account. Select the **Checkouts API** for the intended Solar store. Request/confirm separate test and production credentials and supported response schemas. No guaranteed onboarding timescale is inferred.

A Classic Connect store and developer API access are not interchangeable credentials, but the legacy UI alone does not establish whether the same merchant can be enabled for the newer API. The old store's shared secret must not be substituted for a Commerce Hub API secret.

The existing local `lib/tyl-protocol.js` is **Classic Connect preparation only**, not the selected Commerce Hub implementation and not wired into live handlers. Its requirement for `extendedResponseHashSupported` belongs to that chosen verification strategy; it is not a blanket assertion that every secure integration must use that setting. A properly authenticated provider status query is the strategy intended for the Commerce Hub adaptation.

Solar does not need Premier's public launch to happen first. Build and prove Solar in its own isolated environment, then verify the complete authorized production path before exposing checkout. Existing application/payment operational blockers remain open until the chain is implemented and verified.

## Primary sources checked

- [NatWest API overview](https://natwestpayments-api-docs.readme.io/docs/overview): partnership with Fiserv; API access and hosted checkout products.
- [NatWest API access](https://natwestpayments-api-docs.readme.io/docs/getting-started): authorized-contact registration, store-specific key request and provider review.
- [Checkout Solution](https://natwestpayments-api-docs.readme.io/docs/introduction-2): hosted checkout, redirect/webhook URLs supplied in API requests, and branding options. URL behavior is not solely a manual gateway setting.
- [Fiserv Virtual Terminal FAQ](https://docs.fiserv.dev/public/docs/faq): legacy UI retirement date and upgraded terminal; does not state that Classic Connect processing is retired.

Reviewed 9 September 2026. No live charges, application submissions, messages, DNS changes, credential changes, deployments or Premier file edits.
