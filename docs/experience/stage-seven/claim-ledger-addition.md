# Stage seven — claim ledger addition

Reviewed against integrated source on **8 September 2026**, starting from `dbb8197`. This extends the [stage-six claim ledger](../stage-six/claim-ledger.md); its historical data and primary energy-source limitations still apply. Final test/capture totals and source identity are recorded separately in the stage-seven handoff and check record.

| Wording/behavior | Evidence and current limit |
| --- | --- |
| Documented AC current, existing/proposed generation, per-unit rating and phase arrangement determine useful connection guidance; roof DC kWp and battery kWh are different inputs. | ENA G99 Issue 2 §§6.2.2 and definitions; NGED connection procedures. The checker asks current on the relevant phase and does not derive it from a fictional panel rating or the rendered campus. |
| A1-2 is a possible small-generation route, not a universal commercial product. | Current ENA SGI distinctions. Registered and intrinsic unit ratings, type-testing, export limits and installation conditions still require documents and operator review. The UI never certifies a specific design or automatically assigns SGI-2 from total capacity. |
| Exact 32/60 A aggregates need operator confirmation. | The current G99 summary and detailed clauses differ at these boundaries. The checker exposes the uncertainty rather than choosing a paid route. |
| Unknown, inconsistent, zero, out-of-scope, backup or type-test answers do not establish a paid A1-2 route. | `assessSuitability()` returns a contact action for every result. Zero is distinguished from missing/non-finite input. Possible cases also go to contact pending review. No server enforcement is implied. |
| Backup/EPS needs specific design review. | Source guidance describes particular connection arrangements; it does not justify a universal claim that every EPS-capable device is barred from all current SGI routes. The guide avoids that blanket statement. |
| £250 + £50 VAT = £300 per suitable application. | The supplied Aesir offer, not independently verified fulfilment evidence. It is one application for one installation; installation, physical commissioning, approval and network works are separate. Commissioning-notification paperwork remains the offered follow-on after commissioning is reported. |
| Aesir corrects its own paperwork errors; material design changes/inaccurate supplied information may need additional work. | Retained terms/refund policy and the supplied offer. The FAQ must preserve explanation of any additional fee and not guarantee network approval or a turnaround. |
| Payment or application status cannot be established from a success/return URL. | Existing source has no authoritative status lookup or durable expected-payment binding. `success` is unverified by default; reference text is explicitly unverified. `site.js` supplies neutral return context and never claims a receipt or successful intake. |
| Form answers are stored in this browser on submit, but the full form is not automatically restored and a browser copy is not durable receipt. | Unchanged `app.js` writes `aesir.application` and never reads it back. The privacy description now matches that actual limitation. |
| Existing consent boxes have two distinct purposes and are not an early-start request. | Exact source form: agreement to terms/refunds, and privacy understanding including network sharing. Refund copy no longer asserts a nonexistent checkout waiver. |
| Retired simulator cannot establish savings, capacity or eligibility. | It formerly inferred AC capacity from array DC assumptions. The route now explains retirement and offers education/contact; old runtime and its paid bridge are omitted from output. |
| The illustration and the supplied generation record are separate. | The 879-module campus remains original illustrative geometry, not an eligible A1-2 design, installed project or customer proof. The Premier Composites record stays dated 24 August 2026 and attributed to the supplied Tigo transcription. 206.41 kWh is the daily total; approximate interval values and their table are not instantaneous kW, live telemetry, independently verified measurement or a savings forecast. |

## Exact primary sources for the new suitability wording

Sources reviewed **8 September 2026**. These are source explanations, not commercial promises or approval of an installation.

- [ENA G99 catalogue](https://www.ena-eng.org/ena-docs/Index?Action=ViewDetail&EID=102105&tab=dcode): G99 Issue 2, March 2025 is the current catalogue edition reviewed. Forms/connection-guide revisions are separate; the old underlying audit is not permission to freeze operator forms indefinitely.
- [ENA G99 Issue 2, 10 March 2025](https://dcode.org.uk/assets/250307ena-erec-g99-issue-2-(2025).pdf): §§6.2.2.1–4, printed pages 62–65 distinguish SGI-1, SGI-2 and SGI-3. Registered versus intrinsic capacity must not be conflated. SGI-2's individual registered limit is 16 A; SGI-3 can include registered units up to 32 A and can waive export limitation at an aggregate of 32 A or less. Aggregate alone does not identify SGI-2. The table/detail boundary differences are retained as a review condition.
- [NGED G99 connection procedures](https://connections.nationalgrid.co.uk/g99-connection-procedures): inverter continuous steady-state AC rating, application category and operator process. Its older linked PDF is not used to override the current ENA edition.
- [SSEN G99 fast-track process](https://www.ssen.co.uk/our-services/new-supplies/generation-connections/micro-generation-connections/g99-fast-track-process/): existing/new equipment, ratings, type-testing, phase/export information and operator-specific requirements. Apparent arithmetic/editorial inconsistencies in secondary summaries are not copied into the guide.
- [SP Energy Networks export limitation](https://www.spenergynetworks.co.uk/pages/export_limitation.aspx): backup exclusions in its described arrangement require contextual reading, not a universal ban on any possible current EPS arrangement.

## Policy corrections, preserved rights and unverified operations

Every full policy section survives. Removed company/registered-office/ICO placeholder spans have not been replaced with fabricated particulars. Substantive service scope, price, cancellation rights, liability, governing law, retention, rights and support sections remain available at their existing routes.

Narrow implementation-copy corrections are deliberate: payment-route descriptions acknowledge existing Tyl/Stripe/WooCommerce fallbacks; localStorage no longer promises reload restoration; the refund introduction now retains the detailed requested-work qualification; and the existing checkboxes are not described as an early-performance request. The [official Consumer Contracts implementation guidance](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/429300/bis-13-1368-consumer-contracts-information-cancellation-and-additional-payments-regulations-guidance.pdf), particularly G6 and H5/H11/H21, supports keeping ordinary acceptance separate from express early commencement and retaining statutory/proportionate-work conditions. No new early-performance capture is implemented here.

The full source privacy retention/deletion and UK/EEA-hosting commitments remain **unverified operational commitments**, not tests that passed. Verified legal identity/registered office/company/VAT information, applicable ICO status, cancellation-information/form provision, current processor/cookie review and any early-performance workflow remain owner/legal rollout work. Removing placeholders is not legal completion.

## Review corrections completed

The integrated homepage was re-read after review and both wording corrections are now present:

1. The process consent sentence distinguishes acceptance of terms/refunds from a separate acknowledgement of the privacy notice and network-operator sharing, matching the preserved form.
2. The refund FAQ no longer invents a general post-submission non-refund cutoff; it points to the detailed policy conditions and retains consumer cancellation rights/qualifications.

No substantive numerical routing defect was identified in the conservative guide. A focused Node regression test covering 21 cases passed against the integrated `assessSuitability()` source: missing/non-finite/negative values; unknown equipment/phase/backup facts; zero; notification-range input; 32/60 A boundaries; excessive aggregate/per-unit values; inconsistent inputs; EPS/type-test review; export-limitation conditions; and tentative possible routes. Every result points to `/contact.html`. This limited source test does not establish the browser layout, engineering suitability or provider behavior.

## Separate operational acceptance remains open

The target is still complete durable installation answers and consent evidence → correct verified £300 GBP payment → exactly one actionable Aesir work item, with recovery and server suitability enforcement. Frontend return truthfulness, static recorded evidence and conservative contact-only guidance improve presentation but do not implement this transaction. Original historical backend reproductions remain valid evidence about untouched code; they must not be misreported as newly repaired because a message or route changed.

No invented savings, payback, warranty duration, testimonial, system rating, carbon equivalence, live telemetry, working account or receipt delivery has been introduced. Optional polish, physical-device performance, owner art-direction approval and the independent operational launch gate remain subject to their own evidence.
