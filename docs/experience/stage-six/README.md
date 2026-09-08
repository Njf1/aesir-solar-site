# Stage six — the commercial experience

The local page now leads from the preserved Sun-to-business film into the Form A1-2 application offer, useful commercial explanation, an honestly attributed historical generation example, practical preparation steps and FAQs. It is a local editorial and visual milestone, not a public rollout or a repair of the application/payment system.

Preview: **http://127.0.0.1:4173/experience**. Working project: `/Users/nick/Projects/Aesir Solar/experience-stage1`, branch `experience/stage-six`, recovery tag **`experience-stage-six-delivered`**. Starting checkpoint **`ebac896` / `experience-stage-five-delivered`** remains recoverable. The original `site` checkout stays clean and untouched. No deployment, real application, payment, upstream telemetry request or message was made.

## What the visitor gets

- **The existing film, deliberately finished.** The operation-after-permission qualification is a 16px caption before activation, with its full meaning retained in still and supporting HTML. Grid copy says “WHEN THE GRID SUPPLIES POWER.” The final Aesir promise has a genuine `/apply.html` link, with inactive chapter links removed from keyboard interaction through `inert` and visibility.
- **The offer first.** `#application-details` remains the immediate Skip destination and first substantive section after the film. “Your G99 application, handled.” sits beside the precise Form A1-2 scope and **£250 fee + £50 VAT = £300 total per suitable application**, with eligibility/contact links beside the action. On narrow screens the price and action precede the longer explanation.
- **Useful commercial context.** `#solar-benefits` explains generation used on site, the timing of demand/imports, investment inputs, equipment/documentation/support, distinct warranty types, lifecycle impacts and optional storage/backup limits. An original SVG explains the relationship between generation, the business and imported supply. No savings calculator, product endorsement, invented return or carbon equivalence is added.
- **A dated record with clear limits.** `#recorded-generation` presents the supplied Premier Composites transcription, **24 August 2026 / 206.41 kWh**, with source/date visible beside the value, a lightweight hourly SVG and native table. It remains historical without JavaScript or regardless of today's date. Monitoring copy distinguishes energy (kWh) from power (kW) and generation from consumption or savings.
- **Preparation, process and answers.** `#application-process` follows the actual service and existing form fields. `#application-faqs` covers fee/scope, suitability, installer/owner roles, information, timing, backup, proof and policies. The first three answers are open by default; essential meaning is not locked behind every accordion. Scientific qualifications remain in readable supporting detail; the source directory is optional detail.

The page contains no replacement lead form. All original pages, scripts, APIs, generator, providers, fields and both consents are preserved. The service buys application preparation, submission and follow-up—not installation, approval, commissioning, a grid upgrade or a guaranteed timescale. Commissioning-notification paperwork follows being told commissioning has taken place. The 879-module rendered campus is not a verified eligible A1-2 design or customer claim.

## Contracts, data and implementation

The camera, scene ownership, shaders, original stylesheet and all other 32 tracked experience files except `main.ts` are byte-identical to `ebac896`. The complete timeline remains **6.08 units, 34.048 useful viewport heights, 23 chapters and 12 stills**. No new 3D chapter, geometry, texture, light, render target or library was introduced. The new document has ordinary native height after the accepted film.

`experience.html` and `src/experience/editorial.css` own the page and focused ending refinements. `main.ts` makes the payoff link inert when hidden and restores valid editorial deep links after asynchronous scene startup; malformed percent fragments safely remain unknown anchors instead of causing fallback. The existing observer continues to suspend the renderer offscreen.

`scripts/recorded-generation.mjs` is **build-time only**. Its Vite HTML hook reads the supplied JSON and inserts semantic static markup on development/build requests for the experience entry only. The assembled preview serves that finished HTML. It adds no browser data request or chart runtime. Other routes and the source JSON are unchanged.

Validation accepts finite nonnegative numeric energy, including **zero**. Missing internal hours are gaps/“Not recorded”, not fabricated zeros; missing/invalid totals, invalid dates, malformed source or unavailable files produce a useful unavailable block with an application link. Source text is escaped. Only the dated record fields are displayed: no unresolved kWp, hardware specifications, commissioning date, tariff, return, optimisation saving or environmental equivalent.

The approximate bars sum to **205.15 kWh**, 1.26 kWh below the separately transcribed daily total. Neither is rescaled or substituted for the other. The record's `measured` labels describe the supplier's transcription; this work did not inspect a private portal, source export, meter or screenshots, or certify ownership, installation or endorsement. See the [claim/data ledger](claim-ledger.md), [source JSON](../../../data/premier-composites.json) and [complete vision register](vision-register.md).

## Verification of the final source

Final assembled build recorded **8 September 2026, 20:36:38 UTC**:

| Check | Final result |
| --- | --- |
| `npm run build` | Passed; all delivery and per-owner budgets passed |
| `npm run typecheck` | Passed |
| `npm test` | **61/61 passed** (47 retained + 14 new) |
| `npm run test:browser` | **92/92 passed**, one complete sequential suite (75 retained + 17 new), 4.1 minutes |
| Five-view capture run | Passed; no console warnings or errors |

The command sequence, timestamps and exact logs are in [review-checks.json](review-checks.json), [Node output](review-3.log) and [full browser output](review-4.log). An earlier interrupted integration run is not counted as this final result. The capture, motion and measurement stages run sequentially so another review browser does not compete for the GPU.

Coverage retains the prior **47 Node tests** and **75 distinct browser checks**. Historical stage-five evidence was 73 full-suite passes plus four focused passes representing 75 distinct checks; it was not a final 75-test rerun. Stage six reports its own full run, separately from that history.

New coverage checks source/date/interval attribution, zero/missing/invalid/future-clock cases, HTML escaping and Vite failure isolation; all native anchors and focus/Back; delayed startup/deep-link retention; the intact form/two consents; no-JS/reduced-motion/failed scenes; offscreen suspension; visible-only payoff interaction; enlarged still buttons/caption and malformed fragments. Existing mock payment and byte-parity regressions remain intact. The preview still rejects provider routes and non-GET/HEAD requests.

The independent preservation audit confirmed **30 original business files** and **24 assembled contract files** match their retained source. Package versions, lockfile, assembler and preview are unchanged. There was no provider integration or operational write.

## Rendered review

The [capture gallery](captures/index.html) includes five-view ending/offer/content frames and complete still-page captures. The review covers **1280×720, 1600×1000, 390×844, 740×900 and 1000×500**. The [motion record](motion-observations.json) links continuous opening-to-ending and ending-reverse recordings at every size. All five recorded normal runs had zero warnings/errors, frozen Pause/offscreen states and correct keyboard Skip focus. Enlarged-text and zoom-equivalent samples had no horizontal overflow. Deliberately aborting the scene import produced the expected failed-resource/import console messages, zero canvas and a usable fallback document; those expected failure-fixture messages are not reported as a normal-run defect. The laptop walkthrough takes 65 seconds forward and 18 seconds through the ending in reverse; the other forwards use 45 seconds. These are authored review scroll speeds, not automatic playback added to the product.

Enlarged-text review independently doubles measured text in portrait/landscape. **640×360 CSS pixels at DPR2** is used as a 1280×720/200% zoom layout equivalent, not a claim to have operated Chrome's native zoom menu. Normal, enlarged, still, no-JS and import-failure page captures are included. Full-page captures use a one-viewport still/fallback film so the complete document is legible without a long empty scroll image. Cropped editorial-detail images hide only the fixed header during capture to avoid stamping it over the middle of a long clipped element; normal viewport/full-page images retain the actual header.

Corrections made after actual rendered review:

- Kept the operation qualification compact and legible instead of a headline.
- Placed the final action below the promise with room for the campus; added a restrained dark backing only at enlarged text sizes.
- Kept SVG chart labels at 14px while bar spacing resizes, and separated the large total from its unit to avoid a stranded word on mobile.
- Used two-column record metadata on narrow screens so date and supplied-source attribution remain close to the total.
- Reflowed enlarged portrait still controls to three columns; retained the repeated ready/reduced-motion status for assistive technology without an overlay plaque obscuring the action. Loading/failure/paused messages retain their visible treatment.

After the final automated suite passed, the phone offer, all commercial sections, chart, preparation, FAQ and no-JS continuation were visually inspected, along with transition frames extracted from the continuous forward/reverse recordings. The image-only business holds remain; copy clears before the brand appears, and the new action resolves above the narrow-screen campus. No further product correction was indicated by those final captures. Final art-direction acceptance remains a review decision; these are the rendered corrections made in this local pass. Physical-phone, Safari/Firefox and sustained thermal checks remain unperformed.

## Transfer and runtime measurements

Measured on an **Apple M4 MacBook Air, 16 GB (Mac16,13), arm64 Darwin 25.6.0**, Node 24.15.0 and **Chrome for Testing 151.0.7922.34**, headless ANGLE Metal / Apple M4. These are desktop viewport emulations, not physical phones. The 390px view requests DPR3 and retains the adaptive **1.25** cap; 740px uses the mobile tier at DPR1; the other views use desktop DPR1.

| Delivered content | Stage six | Change from stage five |
| --- | --- | --- |
| All JavaScript, gzip | **242,212 B** | **+59 B** |
| All media/geographic JSON variants | **1,844,085 B** | **0 B** |
| CSS, gzip | **7,550 B** | **+3,406 B** |
| Experience document | **40,450 B raw / 11,649 B gzip** | +24,805 B raw |

The **750,000 B JS gzip / 2,000,000 B media** ceilings and all existing owner budgets pass. The static recorded block accounts for approximately 7,642 B HTML / 1,808 B gzip in isolation; it is included in the document, not an extra request.

The loopback server serves uncompressed bodies. Observed opening bodies total **957,053 B desktop / 879,051 B mobile**; the complete sampled route totals **2,439,190 / 1,697,546 B**. Each is **41,751 B above the corresponding [stage-five measurement](../stage-five/verification.json)**, with no additional request (11 opening / 21 full route). These body totals include document, CSS, raw JavaScript and the chosen media variant; they are different from the gzip-code and all-variant media budgets above. Application pages remain byte-identical and acquire none of this experience code or media.

Fresh-context readiness and four-second settled frame sampling:

| Viewport | Opening ready, observed | Business owner first ready | Storage owner first ready | P95 frame interval: Sun / Business / Brand, ms |
| --- | --- | --- | --- | --- |
| 1280×720 | 136 ms | 32.1 ms | 22.7 ms | 17.3 / 16.8 / 17.3 |
| 1600×1000 | 129 ms | 32.3 ms | 25.5 ms | 17.4 / 17.4 / 17.4 |
| 390×844 | 128 ms | 30.3 ms | 26.5 ms | 17.5 / 17.2 / 17.1 |
| 740×900 | 119 ms | 39.3 ms | 25.9 ms | 17.5 / 17.2 / 17.4 |
| 1000×500 | 129 ms | 42.4 ms | 27.6 ms | 17.3 / 17.4 / 17.4 |

All **15** settled holds had a **16.7 ms median**; maximum sampled interval **17.7 ms**, none above 33.4 ms. Settled draws were **10–20 Sun, 63–66 Business, 86 Brand**, retaining existing quality decisions. First-use timing above includes each owner's import/build/readiness; the raw [performance record](performance.json) separates business/storage compile time from total and records all earlier owners. It does not time an uncached internet connection.

Across **25 editorial holds** (five anchors at five sizes), the scene was offscreen, ambient time was frozen and **zero render-frame samples** were recorded. Three repeated Sun → brand → recorded-example reversals per viewport kept **one canvas, 66 GPU-observed geometries, eight textures and 21 requests** stable. This focused route does not render every chapter, so its geometry count is not the stage-five full-traversal count of 68. The full browser suite separately retains the complete chapter/reversal/lifecycle contracts. All five normal performance runs had no console warnings/errors.


No new downloaded media or GPU resources are associated with the editorial content or chart. The retained stage-five **102.33 / 25.58 MiB** desktop/mobile texture/environment/shadow estimate therefore remains the baseline estimate, excluding geometry, programs, driver allocations, framebuffers and temporary copies; it is not a newly measured total process-memory figure. Frame intervals describe browser scheduling/rendering, not isolated GPU time. First-entry timing uses fresh browser contexts with cache disabled; OS/driver caches are not purged.

## Remaining work and rollout boundary

The six commercial topics now have useful supported content. Stronger project-specific promises still require evidence: actual demand/yield/import/export, design costs and finance terms, product/warrantor documents, lifetime and maintenance assumptions, a defined environmental comparison and specific backup capability. The supplied dated example is not independently verified proof or repaired live telemetry. Optional audio/cursor polish, final art-direction acceptance and real-device/broader-browser validation remain separate work.

Most importantly, public rollout still needs a proved transaction: **durably save the complete application, verify its correct payment, and create one actionable Aesir work item**. Suitability enforcement, reliable recovery and consent evidence, payment identity/amount/currency/status, authenticated/idempotent callbacks and truthful fulfilment status remain in [backend blockers](../backend-blockers.md). A richer page and a successful link to the form do not establish that chain.

Run locally with the existing Node 24 runtime: `npm run build`, `npm run typecheck`, `npm test`, `npm run test:browser`. `node scripts/review-stage-six.mjs` records the full sequential review. The local server remains `npm run preview` on 127.0.0.1:4173. Source/build hashes are in [checksums.json](checksums.json); earlier tags remain intact.
