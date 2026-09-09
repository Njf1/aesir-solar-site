# Authenticated hosting and Tyl inspection

9 September 2026. User authorized Fasthosts access and clarified that the intended solution is a direct Tyl connection without renewing the paid AG gateway plugin.

## Diagnosis

The new source contains a direct Tyl integration, but the inspected Vercel Solar project has **no payment environment configuration**. The live new-site controller therefore falls through to the old WordPress shop. Having direct integration code in Git did not connect the deployed checkout.

The inspected WordPress installation still has AG Tyl 1.7.10 active, configured for live `sale`, with the existing merchant ID and shared secret present. The plugin's paid licence has expired; its UI says the installed premium features remain usable. This is not a reason to renew it, nor proof that present-day payments work.

Only one stored WooCommerce order was found: £1, dated 4 February 2025, using `ag_tyl_checkout`. It does not prove a working £300 application service today. No customer identifying details, card data, credentials or secret values are included in this report.

| A good outcome | Current evidence | Work still required |
| --- | --- | --- |
| The customer supplies installation details once and opens Tyl from the new Aesir design. | The direct Vercel initializer is unconfigured; its deployed fallback opens the old shop. | Configure and test the replacement handoff before removing the live fallback. |
| Closing the browser does not lose the application. | Full installation answers are only in the browser draft, not the inspected old order. | Persist all answers and both consents before initiating payment. |
| One verified £300 payment creates one retrievable application for Aesir. | Existing callbacks lack durable, expected-order-bound settlement and work creation. | Atomic payment/attempt binding, replay protection and an actionable application record. |

## What was inspected

- Fasthosts managed WordPress, Go package; automatic WordPress administration login worked. Generated temporary SSH/SFTP access, valid for 48 hours, without changing the existing account password.
- WordPress 7.1 / WooCommerce 11.0.1 / web PHP 8.1.34. HPOS order storage is enabled, legacy synchronization disabled. Currency GBP, taxes enabled, prices entered without tax.
- All installed plugin names/versions and gateway settings, with secrets handled only in private local storage. The Tyl live endpoint in the installed integration is `https://www.ipg-online.com/connect/gateway/processing` and its signing algorithm is HMAC-SHA512.
- Custom theme files, must-use plugins, the provider/custom plugin, non-core root PHP files, and all 12 WPCode snippets including drafts/trash. No separate direct Tyl integration found in those locations. Published snippets change checkout fields, button text, thumbnail sizing and page scrolling. An initial `tyl` substring hit in `style` was manually ruled out.
- Relevant WordPress option names and aggregate order metadata keys. The historical record includes a basic notification hash but no extended-response-hash metadata. Absence in one old record does **not** establish the current gateway-account setting.
- Vercel project inventory: the identified `aesir-solar` project has no configured payment environment variables. No alternative Solar project carrying that configuration was found in the inspected account.
- Hosting recovery points: latest displayed file backup 9 September 2026 01:16; latest displayed database backup 8 September 2026 02:58. A fresh private recovery export was also taken below.

Read-only inspection of the remote site/database apart from authorized temporary access creation and administration login. No plugin updates, purchases, gateway changes, order writes, customer payments, outbound messages or DNS changes were made.

## Recovery

Fresh private exports live outside every Git repository at `/Users/nick/Projects/Aesir Solar/.private-recovery/checkout-20260909/`, directory mode 0700, files 0600. They contain sensitive configuration and historical data: never copy them into the public build, commits or reports.

- Full WordPress file archive, excluding regenerable cache/litespeed/upgrade and provider-restore directories: 273,181,820 bytes. Readable archive with 34,245 entries, including configuration, WooCommerce, themes and uploads.
- Transactional database export: 1,425,955 compressed bytes; 67 CREATE TABLE statements, HPOS order tables and complete dump marker verified.
- Hashes and verification scope: [recovery-manifest.json](recovery-manifest.json).
- **No restore drill has been performed.** Readability/structure checks and available hosting restore points are not a completed disaster-recovery test.

The paid plugin was privately inspected to identify the current protocol. Its proprietary source is not copied into the project or used as replacement implementation code.

## Direct integration preparation

`lib/tyl-protocol.js` is original, local, **not yet wired into any live handler**. Six new fixture tests cover SHA-512 request signing, strict callback parsing, expected order/amount/currency/time/operation checks, tampering and distinct pending/declined/approved outcomes. Every existing provider handler/helper remains unchanged and byte-protected.

This candidate requires Tyl's `extendedResponseHashSupported` account setting, so the result signature covers the order reference, status and gateway transaction ID as well as payment fields. It deliberately does not downgrade to a basic hash. The expected attempt must come from durable server storage, and accepting a result must be followed by an atomic transaction-ID uniqueness/idempotency check. Neither durable intake nor settlement/work creation is implemented by this protocol helper.

Account confirmation and actual sandbox response fixtures may require adapting the strict parser/field requirements before enabling it. Local cryptographic fixtures are **not** a Tyl end-to-end payment test. The helper does not declare an application fulfilled, and no card data is needed in its verified result.

Next implementation can reuse the existing Fasthosts database/order back office without paying for AG, with a new authenticated application bridge and direct Tyl handoff. The final host/callback routing must be chosen and tested before cutover; no new database vendor or merchant product has been selected by assumption.

## Remaining account access

The user signed in to the official Tyl sales portal at `https://portal.natwestpayments.com/`. It lists Premier Composites' physical and online stores, with the online URL `www.premiercomposites.co.uk`; no Aesir store/account switch was visible. No Premier store or payment settings were changed.

The portal's own “Access your virtual terminal” link points to `https://www.ipg-online.com/vt/login`. Opened that separate Fiserv gateway login and prefilled the store number already configured on the Aesir website, without copying the signing secret or trying it as a login password. **Gateway sign-in is now pending.** Need to establish that store's actual Classic Connect configuration, callback overwrite/return settings, supported branding controls, strong result verification and separate test credentials. The merchant account must match the intended Aesir service; the Premier portal alone does not establish that. Live credentials are not sandbox credentials.

User's preference is explicit: no AG renewal. Keep the existing merchant account; do not substitute a new processor or silently migrate to a different Tyl API product. Do not disable the remaining live AG route before its replacement is verified.

## Primary references

Accessed 9 September 2026:

- [Tyl hosted payment pages guide, v2.4](https://www.tylbynatwest.com/assets/downloads/tyl-hosted-payment-pages-guide.pdf): direct hosted card entry and integration protocol; verify account-specific current behavior.
- [Fiserv response fields](https://docs.fiserv.dev/public/docs/response-fields): basic versus extended result signatures, ordering, approval states and original transaction time. Extended signing requires provider account enablement.
- [AG setup guide](https://weareag.co.uk/docs/tyl-by-natwest/setup-tyl-by-natwest/setup-guide/): separate live/test credentials and current installed-gateway context. Does not impose an AG subscription on an independently implemented Tyl integration.
- [Tyl website payments](https://www.tylbynatwest.com/help-and-support/online-payments-new/website-payments-new): sandbox accounts and supported hosted-page customization for the newer product; do not assume identical controls on the older account.

## Verification at this checkpoint

Type checking and build passed. Full Node suite: 90/90 (84 existing plus six new protocol tests). No UI/3D changes in this authenticated-inspection pass. Earlier candidate's 18 focused browser checks and ten viewport reviews remain separately recorded; they are not a new full cinematic or payment-provider run. No production push/deployment made.
