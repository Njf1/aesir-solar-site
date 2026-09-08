# Stage seven — route, content and source ownership

Source review: **9 September 2026**, candidate based on checkpoint `dbb8197`. This manifest describes the integrated code and its delivery boundaries. Final integrated test totals and visual acceptance belong in the stage-seven handoff; this document does not certify provider operation or public rollout.

The candidate now has one homepage presentation and retained, purposeful supporting routes. The original `site` checkout is separate. All changes described here belong to the local `experience-stage1` candidate.

## Route outcomes

| URL forms | Candidate behavior | Authority and retained boundary |
| --- | --- | --- |
| `/`, `/index`, `/index.html` | The compiled cinematic homepage followed by the complete native service, suitability guide, benefits, historical example, process and FAQ content. No navigation redirect is used for the homepage aliases. | [`experience.html`](../../../experience.html) is the source authority. Python copies it to source `index.html`; assembly copies compiled `experience.html` to delivered `index.html`. |
| `/experience`, `/experience.html` | The same delivered homepage HTML as index, with ordinary query and fragment navigation. | Vite compiles the experience entry once. These are compatibility aliases, not a second sales page. |
| `/apply`, `/apply.html` | The complete installation form and £250 + £50 VAT = £300 offer. All 19 named controls, their attributes/defaults and both required unchecked consents remain. | [`templates/site/apply.html`](../../../templates/site/apply.html), rendered by [`build.py`](../../../build.py). The existing payment/prefill implementation in [`app.js`](../../../app.js) remains unchanged. |
| `/success`, `/success.html` | A truthful unverified return page. It does not claim a charge, receipt, received application or assigned work. `order` and `session_id` are optional, bounded text references only. | Success template and [`site.js`](../../../site.js); URL parameters are retained, never treated as authoritative status. |
| `/contact`, `/contact.html` | A complete email-based suitability/support page with useful installation details to gather. | Contact template. Real supplied contact: `hello@aesirsolar.co.uk`. No invented phone, office hours, address, contact form or account portal. |
| `/terms`, `/privacy`, `/refunds` and `.html` equivalents | Dedicated full policy pages, native consent-link destinations, coherent shared shell. | Corresponding `templates/site/` files. All 11 terms, 8 privacy and 6 refund section headings remain. Corrections and unverified policy-operation commitments are recorded below and in the claim ledger. |
| `/faq`, `/faq.html` | A static bridge with a visible ordinary link and meta-refresh to `/#application-faqs`. Works without JavaScript. | FAQ template. The bridge deliberately targets the common FAQ fragment; it does not preserve an old FAQ query/fragment or old FAQ JSON-LD. |
| `/simulator`, `/simulator.html` | A planning-retirement page explains why roof/DC estimates are not verified equipment capacity, eligibility, savings or returns. It links to solar context and suitability contact. | Simulator template. The old `sim.js` and `sim.css` are absent from the output allowlist. A planning footer link does not reactivate the retired calculator. |
| `/api/tyl-checkout`, `/api/checkout`, `/api/tyl-return`, `/api/tyl-notify`, `/api/tigo` | Existing API source contracts are preserved. The loopback development/preview servers return isolated `503` JSON rather than invoking providers. | Existing five API files, helper, data and package files. Local isolation is not production API behavior or an operational repair. |
| Unknown paths | Local preview returns `404`, not the marketing page. | Explicit static resolution in [`scripts/preview.mjs`](../../../scripts/preview.mjs); no SPA catch-all. |

The same native homepage content works without the cinematic renderer, during asset delay/failure and without JavaScript. The recorded generation summary/chart/table are generated into HTML at build time. The interactive suitability guide needs JavaScript, but its initial unknown guidance, contact action, source explanation and other page content are native HTML.

## Native homepage aliases

| Existing fragment | Current native destination |
| --- | --- |
| `#main` | Focusable main element at the beginning of the homepage. |
| `#top` | Focusable start anchor within main. |
| `#gate` | The application-service introduction and its scope. |
| `#price` | The service/fee section. |
| `#apply` | The homepage application action section; distinct from the full `/apply.html` form. |
| `#check` | The new documented-AC suitability section. |
| `#work` | The application process section. |
| `#realroof` | The dated recorded-generation example. |

The stage-six destinations `#application-details`, `#solar-benefits`, `#recorded-generation`, `#application-process` and `#application-faqs` remain. Compatibility anchors are real focusable elements; they are not hidden/inert JavaScript shims. Browser fragments are not sent to the server, so source and compiled HTML retain the IDs directly. The experience startup logic uses native content anchors after layout and treats malformed fragments as unknown destinations, not renderer failures.

## Generator and delivery ownership

1. `experience.html` owns the homepage. [`src/experience/main.ts`](../../../src/experience/main.ts) owns enhancement/lifecycle, and [`src/experience/suitability.ts`](../../../src/experience/suitability.ts) owns the conservative native guide. The film's geometry, lighting and resource owners remain separate from supporting-page scripts.
2. `templates/site/shell.html` owns shared supporting navigation/footer. Eight route body templates own apply, contact, terms, privacy, refunds, success, simulator and FAQ. `build.py` generates their top-level HTML and the source index compatibility copy. `--check` detects drift without writing. Do not hand-edit generated page outputs as a lasting fix.
3. Vite compiles the experience into `.preview-build`. [`vite.config.ts`](../../../vite.config.ts) maps root/index/experience development requests to the same entry without changing the browser URL. It does not turn supporting pages into cinematic entries.
4. [`scripts/assemble.mjs`](../../../scripts/assemble.mjs) stages an explicit static allowlist plus the clean Vite build, overlays compiled experience to index, writes a sorted `output-manifest.json`, and replaces the known `.release` directory. Its temporary/previous directories are explicit siblings, not broad deletion globs. It rejects symlinked output directories. Stale release-only files cannot survive a completed rebuild.
5. `site.css` is a small independent supporting stylesheet sharing the homepage palette, mark and system font stack. `site.js` is loaded only on apply/success; unchanged `app.js` is loaded only on apply. Contact, policy, FAQ and retirement pages need no runtime. No supporting page imports the film, Three, Earth textures, telemetry or the retired simulator.
6. The candidate's robots/noindex treatment and isolated loopback preview remain in place. The checked-in production `vercel.json` is not a newly certified deployment configuration. In particular, its legacy API cache rules remain part of the later operational review.

## Preserved form and payment semantics

The named controls remain, in order:

`company`, `contact`, `email`, `phone`, `accreditation`, `address`, `postcode`, `mpan`, `inverter`, `typetest`, `kw`, `phases`, `storage`, `target`, `g100`, `eps`, `notes`, `agree`, `privacy`.

Required flags remain on contact, email, phone, address, postcode, inverter, kW, agreement and privacy. Phase values remain `1`/`3`; kW retains `min=0`/`step=0.01`; storage energy retains `min=0`/`step=0.1`. The form clarifies registered AC output without changing the `kw` field name or silently substituting panel DC capacity. The first consent accepts terms **and** refunds. The second records understanding of the privacy notice and sharing with the operator. Neither captures a distinct early-performance request.

`aesir.prefill` meanings (`kw`, `phases`, `g100`, `eps`), submitted field names, `acceptedTerms`, `acceptedPrivacy`, `submittedAt` and fixed `amountGBP:'300.00'` survive. Original Tyl-first, Stripe-second and cart-fallback logic and provider routes are unchanged. The new guide does not write a paid eligibility verdict or new prefill contract.

The default submit button is disabled in HTML. The companion registers before the deferred controller, then activates only after unchanged `app.js` finishes successfully. A failed controller leaves readable email help and a non-submitting form; no-JavaScript operation also remains non-submitting. The companion makes no request or storage write. It replaces legacy charge/receipt assertions after controller load with neutral cancelled/pending/declined/unverified/unknown return context. It never proves a payment.

At narrower widths or with enlarged controls, the form uses a single-column layout and a fixed 40px outer grid gap. This corrects clipped supply/date text and a reproduced percentage-gap overrun into the footer without changing controls or payment handling. [The handoff](README.md#post-test-form-review) records the regression scope. [Native Safari evidence](browser-availability.json) adds a limited desktop application/Skip/Back smoke check; it does not certify all route behavior, provider operation or a full Safari console/performance suite.

## What this delivery does not prove

A complete application is still not demonstrably durably stored, tied to the correct verified £300 GBP transaction, and converted into exactly one actionable work item. Provider identity/amount/currency/status binding, authenticated idempotent notifications, retries, full restore, server suitability enforcement and durable consent evidence remain the separate [backend gate](../backend-blockers.md). A correct visual route and a blocked/no-JS form are only frontend improvements.

The full supplied privacy retention/deletion and UK/EEA-hosting commitments are retained but not operationally verified. Contracting entity, company/registered-office/VAT details, applicable ICO status, cancellation-information/form provision and any separate early-performance workflow require owner/legal confirmation before rollout. Removing placeholder text is not proof of legal completeness.
