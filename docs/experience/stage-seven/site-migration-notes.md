# Stage-seven supporting-page candidate — 8 September 2026

The candidate makes the retained routes coherent and more truthful while preserving the application/payment boundary. It is entirely under `/private/tmp/aesir-stage-seven-site`; this subtask has made no checkout edit and has launched no browser or provider request. The original `site` checkout was clean when checked.

This should look like a customer finding the same 19 fields and two consent meanings after the visual migration. The candidate retains every original input/select/textarea tag attribute and option, including names, IDs, required flags, types, units and defaults. The new AC-output explanation does not rename or transform the `kw` payload. What remains broken between completing the form and receiving a working application is the separate durable intake/payment/fulfilment chain.

This should look like an uncertain payer reaching useful support without being told that a payment or application was received. Direct, unknown and parameterised `success` visits now say that this page cannot verify those facts. The old unconditional receipt claim is removed. Authoritative transaction verification remains unimplemented.

This should look like an old FAQ or simulator bookmark reaching a meaningful destination. FAQ provides a static refresh plus a normal link to `/#application-faqs`; simulator is a native planning-retirement explanation with contact and solar-learning links. Neither starts its old runtime or sends visitors from a made-up DC roof estimate into a claimed eligibility result.

## Copy into the project

The exact 20 product files are listed in `candidate-parity.json` under `product_files`:

- `build.py`
- `site.css`, `site.js`
- `templates/site/shell.html`
- `templates/site/apply.html`, `contact.html`, `terms.html`, `privacy.html`, `refunds.html`, `success.html`, `simulator.html`, `faq.html`
- The corresponding eight generated top-level HTML files.

**Do not copy this directory’s `experience.html` snapshot or `index.html` back over the active homepage.** The snapshot is an isolated generator fixture. After integrating the generator, run `python3 build.py` against the current authoritative project `experience.html`; that writes the matching `index.html` source compatibility copy. The assembler must then map the compiled experience to both final homepage HTML routes. The generator never edits `experience.html` and never emits the old sales/checker homepage. `python3 build.py --check` detects drift without writes, including index-source drift.

Do not ship `candidate-checks.mjs`, `candidate-parity.json` or this handoff as website assets. The assembler should explicitly retain `site.css` and `site.js` and stop copying retired `sim.js`/`sim.css`. Reusing `app.js` on apply is intentional; it is absent from every other supporting page and must remain absent from the marketing homepage.

## Enhancement and failure behavior

Navigation, consent links, policy text, help and contact links are native HTML. There are no fonts/CDNs, external asset loads, canvas or cinematic imports in the new supporting pages. CSS uses the experience’s Arial/Helvetica stack, palette and mark. The header and nav reflow in document flow; no JavaScript menu is required.

Application HTML has the same 19 controls and a disabled default submit button. This prevents a no-JavaScript implicit Enter submission as well as a button submission. The visible unavailable notice and no-script explanation give the real email alternative. No extra action or personal-data GET query is introduced.

The deferred `site.js` element intentionally precedes the deferred, unchanged `app.js` element **only to register its load/error handlers before the controller runs**. It enables payment and replaces the legacy return copy only after `app.js` executes successfully. A capture-phase submit guard blocks requests before readiness and repeat attempts while the existing button is disabled. A missing/network-failed/throwing controller leaves the button disabled and the email fallback readable. If the companion itself fails, the static disabled button remains; the old pay-status container remains hidden, so the old unverified charge claim is not exposed.

For normal ready applications, the original FormData collection, localStorage prefill, terms/privacy booleans, price, timestamp, Tyl-first flow, Stripe fallback and external cart fallback remain untouched. The companion makes no fetch, storage write, history rewrite or provider call. It handles `cancelled=1`, `payment=pending|declined|unverified|unknown` as return context, never as verification. Success uses `order`/`session_id` only as bounded text labelled unverified; parameters remain in the URL. No query value becomes HTML.

The usual site header retains Start your application → `/apply.html` on every supporting page except apply itself, where Discuss suitability goes to `/contact.html`. On success, the body expressly advises uncertain payers to contact support before another attempt; the common header is not a payment-status claim.

## Policy changes and launch evidence

All policy section headings and substantive scope/rights clauses survive: **11 terms sections, 8 privacy sections and 6 refund sections**. Terms retain separate installation, installer responsibility, no guaranteed approval/timescale, network charges, correction/resubmission, liability, governing law and version applicability. Privacy retains data categories, purposes, sharing, retention, rights and hosting sections. Refunds retain suitability refunds, requested-work qualification, statutory cancellation, resubmission, operator limits and the support/refund route.

Narrow, agreed copy corrections:

1. Removed only company/registered-office/ICO placeholder spans and the shared placeholder footer. No fabricated legal identity, address, VAT/ICO number, office hours, telephone or account portal was added.
2. Terms/privacy now acknowledge Tyl plus the existing Stripe/WooCommerce fallback boundary; they do not certify any live provider configuration.
3. Privacy describes actual submit-time localStorage writes and existing prefill/reference/cart values. It no longer promises full-form restore or treats a browser copy as durable receipt.
4. Refund introduction now agrees with the detailed pre-submission refund less requested-work qualification and retains statutory rights.
5. Early-performance text no longer claims that either existing checkbox captures an early-start request. It calls for arranging the required express request/acknowledgement before early work. It does not pretend that this workflow has been implemented.
6. Policy update dates reflect this candidate revision (8 September 2026).

The refund clarification was checked against the official [Consumer Contracts implementation guidance](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/429300/bis-13-1368-consumer-contracts-information-cancellation-and-additional-payments-regulations-guidance.pdf), especially sections G6 and H5/H11/H21, accessed 8 September 2026. It distinguishes an express early-start instruction from ordinary acceptance, and preserves consumer cancellation/proportionate-work conditions. This is a narrow implementation-copy correction, not a completed legal review.

**Still unresolved before public rollout:** verified contracting entity, registered office/company/VAT details and applicable ICO status; owner/legal review of the full terms/refund policy and cancellation-information/form provision; an actual early-performance request/acknowledgement process if offered; proof of retention/deletion and UK/EEA-hosting commitments retained from the supplied privacy policy; complete current processor/cookie practices; and the separate durable complete application → verified correct payment → one work item transaction. The candidate preserves source policy commitments but does not demonstrate their operation. No pages or fixtures establish a working order account or receipt delivery.

## Checks actually completed

- `python3 build.py` and `python3 build.py --check` pass inside the temporary candidate directory.
- Repeated generation is byte-stable, leaves its authoritative `experience.html` input unchanged, and makes `index.html` identical to that input.
- Exact parsed baseline comparison against `dbb8197`: all 19 control tags/attributes match; nine required control names match; both consent boxes remain unchecked. The phase options remain `1` and `3` and consent text/link ownership are copied from the original.
- All 25 policy headings retained, no duplicate IDs in the eight supporting outputs, no placeholder/retired simulator/canvas/film runtime in them.
- Eleven protected source files (`app.js`, five APIs, helper/data and package files) match `dbb8197`; their SHA-256 values are recorded in `candidate-parity.json`. Those files were read only and are not part of the candidate copy list.
- `node --check site.js` passes.
- `node --test candidate-checks.mjs`: **5/5 pass**. These are isolated DOM-event fixtures covering readiness/repeated submits; controller network/execute failures; cancellation/pending/declined/unverified/unknown messages and query preservation; absence of fabricated ordinary status; safe reference text/direct success.
- No browser tests, screenshots, real form submission, checkout, provider callback, public deployment or external-account inspection occurred in this subtask. The main task owns integrated layout/browser checks and final delivery verification.
