# Stage five — energy put to work

The continuous journey now follows the inverter's AC output into useful activity in the same commercial building, shows optional storage charging and later discharge, then one grid-import condition before settling into Aesir's application-service reveal. This is an original educational illustration. The 879-module campus is not a customer case study or a verified eligible A1-2 design.

Delivered locally **8 September 2026** on `experience/stage-five`, tag **`experience-stage-five-delivered`**, extending the recoverable stage-four commit `55ef47f` / tag `experience-stage-four-delivered`. Preview: **http://127.0.0.1:4173/experience**. The existing loopback server serves this project’s `.release`; the original `site` checkout remains clean and untouched. Nothing was published. Historical stage-four results are recorded in the [retained handoff](../stage-four/README.md); they are not stage-five results. The [vision register](vision-register.md) preserves every future benefit, evidence and operational topic.

## Story and authored timing

One authoring unit remains **5.6 useful viewport heights**. Accepted progress 0–4.08 retains **22.848 useful viewport heights**; stage five adds exactly **11.2**, ending at 6.08, for **34.048 useful viewport heights** plus one viewport for the sticky stage. Existing camera poses are not rescaled to the new total. `timeline.ts` is the source of truth.

| New chapter | Progress | Meaning and implementation |
| --- | --- | --- |
| Into the business | 4.08–4.32 | Continue from the exact existing AC entry, open a real section of the existing west facade, establish the supported route and show the operating-condition note. |
| Energy, put to work | 4.32–4.84 | Practical lights, packaging equipment and office screen activate in sequence. The original selective work bay is inside the existing shell. |
| Optional storage | 4.84–5.15 | A separate converter connects an optional battery to an AC branch. The illustration charges a bounded store. |
| For later use | 5.15–5.40 | A later lighting condition and distinct discharge phase show stored energy helping supply the business. |
| A connected system | 5.40–5.67 | One explicitly labelled import condition. Authored export remains zero. |
| A long journey | 5.67–5.88 | “A LONG JOURNEY.” leads to “A CONNECTION WORTH GETTING RIGHT.” |
| Aesir Solar | 5.88–6.08 | The camera settles; Aesir identity and “Your G99 application. Prepared. Submitted. Followed through.” lead into the existing HTML service. |

Reduced motion retains the original eight stills and adds **business 4.70**, **storage 5.09**, **connected 5.56**, **Aesir 6.03**. Still selections use authored progress with frozen ambient time and matching HTML; they do not require the long scroll. The ending has no incident-light guide: that ended at cell absorption in stage four.

## Scientific and service meaning

Accessible HTML precedes business activity with **“Illustration of operation after the required permissions and commissioning.”** The explanation remains available beyond the animated chapter. Activity belongs to continuing generation and the wider connected system; one highlighted photon or module does not power the campus.

The storage vignette is one optional **AC-coupled** example with a separate bidirectional converter. Charging and later discharge are separate; a qualitative five-part stored-energy indication has no kWh, percentage, runtime or efficiency claim. HTML explains finite capacity/power, conversion losses and conditional backup. Grid import is a chosen later condition; an export scene, automatic export approval, tariff saving or outage demonstration is outside this milestone. [Verified sources and depiction boundaries](science.md).

The payoff preserves the supplied **G99 Form A1-2 preparation, submission and follow-up service across Great Britain: £250 fee + £50 VAT = £300 total per application, without guaranteed approval**. The film does not make the campus eligible or represent an installation as included. The service section says to check suitability before payment and retains the existing application/contact/eligibility destinations and both consents. The [backend blockers](../backend-blockers.md) remain an independent public-rollout gate.

## Implementation and ownership

- `business-journey.ts` owns the seven new ranges' camera schedule, ordered activation, separate charge/later/import conditions and copy windows. The accepted inverter pose joins at 4.08; state and supplied ambient time reconstruct on reversal.
- `business.ts` owns `interior.ts`, the AC-flow overlay and supported containment. `commercial.ts` opens the existing facade while retaining the inverter mounting wall; it does not add another warehouse. Two bounded, shadowless practical lights illuminate the bay. Equipment uses preallocated instances; the screen is an abstract document interface without telemetry.
- `storage.ts` and `storage-path.ts` own generic battery, separate converter, grid cabinet, supported branches and the buried-route surface annotation. All AC branches share `ELECTRICAL_PORTS.buildingEntry`. A DC pair joins converter to battery. The surface annotation is not an exposed cable.
- `scene.ts` owns lazy preparation, displayed-progress holds, environment/shadow updates and teardown. It reuses the renderer, campus, environment and existing shadow resources. Owners create no independent animation loops or provider requests. Provenance: [interior](interior-provenance.md), [storage/grid](storage-provenance.md).

Business is requested after progress **4.04** when electrical is ready; storage after **4.70** when business is ready. The displayed pose holds at **4.18** or **4.96** until the relevant owner is ready. The **eight-second** deadline covers import, construction and GPU readiness together; `warmup.ts` owns cancellable readiness polling. Business preparation also compiles the shared site with its new lights. Readiness refreshes requested progress and still copy without another scroll/click. Failure retains the service route; teardown aborts owned waits, clears labels and disposes each asset. The browser checks exercise these outcomes under delay, failure, late completion, Skip and context loss. The shadow cache key includes visible owner identity as well as facade/daylight state, so first readiness and reverse hiding invalidate shadows without repeating shadow work in a settled frame.

## Enforced incremental budgets

These are **ceilings**, not measured totals. `budgets.ts`, constructor assertions and `scripts/assemble.mjs` enforce the corresponding allocation and delivery limits. Geometry includes owned vertex, index and instance buffers plus owned overlays; base draw calls exclude renderer shadow passes. Driver overhead and framebuffers are not implied to be included in geometry figures.

| New owner | Geometry bytes | Triangles | Base draw calls | New texture bytes | New practical lights | Lazy code gzip |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Business, interior, containment and flow | 420,000 | 22,000 | 27 | 0 | 2, shadowless | 12,000 B |
| Optional storage, converter, grid and all route effects | 220,000 | 14,000 | 20 | 0 | 0 | 10,000 B |

The existing site ceiling stays **1,200,000 B / 140,000 triangles / 52 base calls**; the cell stays **250,000 B / 15,000 / 25** and electrical **350,000 B / 20,000 / 25**. Retained site decoded-texture ceilings are 6 MiB desktop / 1.5 MiB mobile, with estimated GPU ceilings 52 MiB / 16 MiB. New business/storage artwork adds no downloaded media, texture or render target. The complete build ceilings remain **750,000 B gzip JavaScript** and **2,000,000 B media/GeoJSON**. Actual delivered bytes are recorded in the current [asset manifest](../asset-sizes.json) and [checksums](checksums.json).

## Verification record

The final capture build was assembled at **2026-09-08 19:44:39 UTC** with the pinned dependencies. Type checking and build pass. **47/47 Node checks** pass, preserving the 38-check baseline. The complete **73/73 browser suite** passed; after the final scientific-still-note CSS correction, **four focused checks passed**, including two additional portrait/short scientific-note checks and two repeated layout checks. This is **75 distinct passing browser checks**, preserving the 48-check baseline; it is not a claim that all 75 were rerun together after the CSS-only correction. All final captures, recordings and performance runs use that corrected build. Browser console errors and warnings were zero across the five-view capture, motion and measurement runs. The CLI reports an environment-only `NO_COLOR`/`FORCE_COLOR` warning, separate from the browser.

Evidence: [sequential review results](review-checks.json), [Node log](review-2.log), [full browser log](review-3.log), [final layout checks](final-layout-checks.log), [capture observations](capture-observations.json), [zoom/still observations](zoom-observations.json), [responsive motion](responsive-motion-observations.json), [performance observations](verification.json).

The implemented Node coverage freezes stage-four poses and eight old stills; checks the 4.08 join and exact reversal; verifies ordered activation, bounded storage and mutually exclusive phases; checks shared AC/converter/battery/grid ports; raycasts the actual facade opening and retained mounting wall; counts and releases actual owned buffers/materials/instances; reconstructs equipment/light/flow state; verifies twelve still/copy states; and invokes actual-mesh camera/near-plane clearance across **three authored framings × five projection aspects**. The browser coverage adds lazy-owner delays, failed imports, timeout/late completion, pending-GPU cancellation, rapid keyboard Skip, ready context loss, four new stills, warmed reversal/resource reuse and inverter-label cleanup/restoration. Older warning, accessibility, form-parity and fallback regressions remain required. The clearance diagnostic records source hashes, tested/ignored surfaces and its fixed ambient time of zero; dense numerical sampling is not a formal proof of continuous collision freedom or of every equipment-animation phase.

The dense [actual-mesh clearance diagnostic](clearance.json) samples **300,015 camera/near-frustum rectangles**: 20,001 progress samples at step 0.0001 for each of 15 framing/projection combinations. It reports **zero collisions**, and all four shared AC endpoint errors are zero. Transparent equipment guards are included. Source hashes and surface exclusions are in the report.

### Delivery and owned resources

JavaScript gzip totals **242,153 B**, an increase of **16,952 B** over stage four’s 225,201 B. Media/geographic JSON remains **1,844,085 B**, including all variants, with **zero new media**. Both whole-build ceilings pass. Lazy business code is **6,423 B gzip**, storage **5,288 B** and shared site **8,955 B**, within their individual limits.

| Owner | Desktop / mobile geometry B | Desktop / mobile triangles | Base calls | Instances | Textures |
| --- | ---: | ---: | ---: | ---: | ---: |
| Business and interior | 67,932 / 60,924 | 8,342 / 7,430 | 22 | 437 | 0 |
| Storage, converter, grid and routes | 77,588 / 51,552 | 5,122 / 3,764 | 13 | 158 | 0 |

Together these add **145,520 B desktop / 112,476 B mobile** owned geometry (about **0.139 / 0.107 MiB**) and 35 base calls, with two shadowless practical lights. The shared site remains 39 base calls, 100,290 / 91,234 triangles and 551,232 / 533,832 B of buffers. The original office-room emission adds no texture, light, geometry or draw call.

Retained Earth/site textures with mipmaps, environment targets and shadow storage remain approximately **102.33 MiB desktop / 25.58 MiB mobile**. These include 9 / 2.25 MiB environment targets and 32 / 8 MiB shadow estimates; they exclude vertex buffers, programs, driver allocations, framebuffers, browser caches and temporary copies. CPU decoded source-image storage is reported separately in the raw observations, not added again to this GPU estimate. New owners add no texture or target storage. Each warmed traversal retained **one canvas, 68 geometries and eight textures**, with unchanged owner/readiness records and resource counts through three complete repeated old/new reversals.

Actual loopback response bodies are uncompressed: desktop first-view **915,302 B**, full journey **2,397,439 B**; mobile first-view **837,300 B**, full journey **1,655,795 B**. Including reported transfer overhead these are 918,602 / 2,403,739 B and 840,600 / 1,662,095 B. There are 11 initial requests and 21 total including navigation; warmed reversal makes no additional requests. These HTTP totals are distinct from the all-chunk gzip delivery budget.

### Measured hardware and timing

Measured on an **Apple M4 MacBook Air, 16 GB RAM (Mac16,13), arm64 Darwin 25.6.0**, Node 24.15.0, **Chrome for Testing 151.0.7922.34**, headless ANGLE Metal / Apple M4. These are desktop browser viewport emulations, **not physical-phone tests**. 1600×1000, 1280×720 and 1000×500 use DPR1/desktop quality; 740×900 uses DPR1/mobile quality; 390×844 requests DPR3 and renders at the adaptive cap of **1.25**.

Each settled scene was sampled for four seconds after readiness. All 50 holds had a **16.7 ms median** frame interval; the largest sampled interval was **17.8 ms**, with none over 33.4 ms. These are `requestAnimationFrame` intervals under native scroll/rendering, not isolated GPU execution times. P95 values in milliseconds:

| Viewport | Sun | Earth | Panel | Cell | Inverter | Business | Storage | Later | Grid | Brand |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1600×1000 | 17.6 | 17.6 | 17.6 | 17.6 | 17.6 | 17.6 | 17.6 | 17.6 | 17.6 | 17.7 |
| 1280×720 | 17.3 | 17.3 | 17.3 | 17.4 | 17.3 | 17.4 | 17.5 | 17.4 | 17.4 | 17.3 |
| 390×844 | 17.2 | 17.4 | 17.1 | 17.0 | 17.5 | 17.2 | 17.4 | 17.3 | 17.3 | 17.4 |
| 740×900 | 17.5 | 17.5 | 17.5 | 17.3 | 17.3 | 17.2 | 17.5 | 17.3 | 17.3 | 17.5 |
| 1000×500 | 17.5 | 17.4 | 17.5 | 17.4 | 17.4 | 17.3 | 17.5 | 17.5 | 17.5 | 17.5 |

Actual settled render calls / triangles (including the visible shared campus and effects, excluding inactive owners):

| Viewport | Business | Storage | Grid | Brand |
| --- | ---: | ---: | ---: | ---: |
| 1600×1000 | 64 / 114,456 | 61 / 115,492 | 87 / 120,904 | 86 / 120,088 |
| 1280×720 | 64 / 114,456 | 63 / 115,564 | 87 / 120,904 | 86 / 120,088 |
| 390×844 | 60 / 102,340 | 61 / 102,494 | 77 / 105,816 | 86 / 106,508 |
| 740×900 | 63 / 102,556 | 73 / 105,430 | 86 / 106,810 | 86 / 106,508 |
| 1000×500 | 65 / 114,776 | 64 / 116,092 | 87 / 120,904 | 86 / 120,088 |

Cold owner preparation is measured separately. Entries below are **import/build + shader readiness = total milliseconds**:

| Viewport | Business | Storage |
| --- | --- | --- |
| 1600×1000 | 11.3 + 22.9 = 34.2 | 79.8 + 12.1 = 91.9 |
| 1280×720 | 10.3 + 22.8 = 33.1 | 67.7 + 12.2 = 79.9 |
| 390×844 | 10.8 + 22.5 = 33.3 | 77.0 + 11.4 = 88.4 |
| 740×900 | 10.9 + 23.3 = 34.3 | 68.2 + 22.7 = 90.9 |
| 1000×500 | 11.1 + 24.1 = 35.2 | 69.8 + 22.0 = 91.8 |

Each run used a fresh browser context with HTTP cache disabled. OS/browser-process/driver caches were not purged, so these are first-entry measurements within that stated method, not worst-case device startup. Observed request-to-ready waits include ScrollTrigger/polling overhead: business 47.7–64.8 ms, storage 97.0–114.2 ms. Earth has no native owner clock; its observed readiness is an upper bound of 55.3–141.6 ms. [Raw per-scene distributions, request records and resource states](verification.json), [condensed measurements](performance-summary.json).

### Rendered evidence and checkpoint

The [capture gallery](captures/index.html) includes the five requested viewport sizes, intermediate entry/opening/activation/charge/later/import/brand frames and the application handoff. The [full journey and new forward/reverse recording](motion/journey-forward-reverse.webm) preserves the opening-to-ending rhythm; [four additional continuous responsive recordings](responsive-motion-observations.json) cover 1600×1000, 390×844, 740×900 and 1000×500. The gallery embeds all five recordings.

[Enlarged-text and still evidence](zoom-observations.json) includes independently doubled text, a 640×360 CSS viewport at DPR2 representing the 1280×720/200% zoom layout, all still selections on laptop/portrait/short layouts, Pause/Resume and keyboard Skip. This does not claim use of Chrome’s native zoom menu. The [visual critique](visual-review.md) records corrections made after viewing the actual images and motion. Representative final frames: [working bay](captures/desktop-business.png), [optional storage](captures/desktop-storage-charge.png), [Aesir reveal](captures/desktop-brand.png), [application](captures/desktop-application.png).

The independent preservation audit confirms all 30 baseline business files and 24 assembled static/API/lib/data contract files match their retained source; original `site` is clean at `c61643f`. The preview still rejects provider routes and non-GET/HEAD requests.

The local recovery tag is **`experience-stage-five-delivered`**; source, test, review-script and served-build hashes are in [checksums.json](checksums.json). Earlier tags remain intact. Captures and videos are review artifacts, not additional served experience media.

Run the existing local checks with Node 24 and pinned dependencies:

```sh
npm run typecheck
npm run build
npm test
npm run preview
npm run test:browser
```

The preview is loopback-only; `/api/*` returns `503 local_preview_only`, browser tests block external requests and payment tests use mocks/dummy inputs. No live application, payment, provider request, publication or homepage replacement is part of this milestone.

## Remaining work

Evidence-backed independence, economics, equipment longevity/warranties, sustainability, storage/resilience benefits and monitoring remain pending. No invented saving, 25-year blanket warranty, testimonial, live output or verified customer is supplied. Optional audio/cursor polish and physical-device/Safari/Firefox/thermal validation remain separate future work. Durable application intake, suitability enforcement, correctly bound payment, idempotent fulfilment, truthful success/retry states and telemetry freshness remain the audited operational/content repairs. See the [complete vision register](vision-register.md).
