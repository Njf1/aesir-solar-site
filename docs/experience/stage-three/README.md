# From Earth to a working roof

[Local preview](http://127.0.0.1:4173/experience) · [Capture gallery](captures/index.html) · [Continuous forward/reverse recording](motion/journey-forward-reverse.webm) · [Complete vision register](vision-register.md)

Stage three extends the accepted source → Sun → flight → Earth sequence into a north-west European orbital arc, Great Britain, cloud descent, an original commercial site, roof-height array travel and a selected panel. The same white-gold guide remains ahead of the camera, briefly hidden by cloud, and ends above the glass. Cell absorption and electrical conversion remain future chapters.

## What is built

- Named chapters preserve the original **5.6 viewport heights** from source to Earth. Britain, atmosphere, building, array and panel add **7.0 viewport heights**; total useful travel is 12.6. Scroll remains native, with reversible camera/aim/guide schedules and no history-dependent offsets.
- The shared latitude/longitude convention aligns the NASA texture, Natural Earth outline, regional mesh and illustrative Midlands origin. London, Glasgow, Cardiff, Edinburgh and other recorded landmarks are checked; Belfast and Dublin remain on Ireland, outside the Great Britain emphasis. Sun direction is transformed through the same basis.
- Cloud occlusion at the two scale handoffs hides bounded coordinate changes. Camera position, aim, up, guide position/direction and apparent size remain continuous in the common reference frame. The guide and trailing geometry share distance-based curve samples.
- The original 80 × 48m warehouse has an office/entrance, terrace, loading doors and yard, roads, parking, restrained landscaping, cladding ribs, parapets, roof seams, rooflights, HVAC, mounting structures and cable containment. Its 879 south-facing modules occupy about 59% of the main roof. Repeated parts are instanced; fine contacts appear only near the selected module.
- Warm directional light, cooler fill, restrained glass reflections and a cached shadow give the site depth. Portrait framing widens the reveal and follows the guide through the array; short landscape has its own camera offset. The near clipping distance adapts during the aerial descent to prevent service-yard depth flicker, then contracts for the glass approach.
- Reversible HTML copy gives geography, architecture and the panel distinct moments, with image-only intervals. The final panel frame leads directly to the existing HTML service section.

The building, landscape, equipment, sky/reflection artwork and module texture are original unbranded illustrations, not a surveyed installation or customer claim. Natural Earth supplies physical coastline, not DNO boundaries or roof-level terrain. Exact [regional provenance](region-provenance.md), [source manifest](region-provenance.json) and [commercial asset record](commercial-provenance.md) are retained. The prior [Earth assets](../stage-two/earth-assets.md) and [solar references](../stage-two/solar-references.md) remain unchanged.

## Application access and resilience

Persistent **Start your application → /apply.html**, Skip, focus handling, keyboard access and the complete HTML service are available before the renderer or assets. Reduced motion offers Sun, Earth, Britain, roof and panel stills without the long scroll. Pause, hidden/offscreen suspension, no-JavaScript content, WebGL/import/context-loss alternatives and disposal continue through the new chapters.

Only the next required asset is prefetched: Earth after 0.16, region after 0.88 once Earth is ready, site after 1.37 once the region is ready. A delayed load holds a composed earlier frame and resumes without another scroll. An eight-second fetch/decode/warmup deadline collapses a failed journey into the accessible service alternative. Owned shader polling cancels before materials are disposed, including context loss.

Each implemented chapter is cached once for reverse traversal. No future cell/inverter/storage assets are loaded. A warmed full forward/reverse cycle remains at one renderer, eight textures and forty geometries; no additional requests or count growth occur on repeated traversal. All owned requests, timers, bitmaps, canvases, instance buffers, geometry, materials, environment and shadow targets are released on disposal. The still-view cache is deliberately bounded rather than repeatedly unloaded/recreated during reversal.

The service remains **G99 Form A1-2 preparation, submission and follow-up across Great Britain; £250 fee + £50 VAT = £300 total per application**. Installer/property-owner distinctions, eligibility/contact/legal routes, all original form fields and both consents remain. The fee buys the application service and does not guarantee approval. Original business files remain byte-identical to audited baseline `c61643f`. The preview blocks providers with local API stubs; verification uses mocks and submits no real application or payment.

## Verification

**Type checking, production build, 24 unit tests and 29 browser regressions pass.** Added coverage checks geographic axes and landmarks, old pacing, reversible poses and velocity joins, guide attachment/visibility, Earth/roof clearance, raycasts against actual building geometry, hero alignment, resource budgets/disposal, lazy/delayed/failed loads, timeouts/late completion, cancellable GPU readiness, still views, rapid keyboard Skip and enlarged text. Existing route/form/consent/payment-mock guarantees are retained.

Actual rendered frames were reviewed at **1600×1000, 1280×720, 390×844, 740×900 and 1000×500**, including both sides of chapter boundaries and backward traversal. Iteration corrected cropped regional edges, portrait guide framing, the length of the roof glide, portrait site scale/haze, copy over Scotland and aerial ground depth flicker. The gallery includes Earth hold, Europe, Britain, both cloud transitions, the commercial site, array, panel and application handoff. Additional intermediate forward/reverse frames are in [motion/](motion/).

The continuous recording uses native scroll forward through the whole journey, back from the panel to Earth, then forward again to the application handoff. A 640×360 CSS viewport at DPR 2 models the layout of 1280×720 at 200% browser zoom; a separate 200% text override checks copy/controls and horizontal overflow. These are explicit browser-layout checks, not every OS accessibility configuration.

A supplemental [near-plane clearance check](near-plane-clearance.json) samples 35,005 authored site poses across all five framing/aspect combinations against actual mesh and instance bounds. It finds no clipping risk: at least 0.419m between the near-frustum volume and geometry, and 0.188m between the near plane and the hero-glass corners. Reproduce with `node scripts/verify-stage-three-clearance.mjs`.

[Timing/network and motion states](verification.json) · [Compact performance summary](performance-summary.json) · [Capture observations](capture-observations.json) · [Text/zoom observations](zoom-observations.json)

## Delivery and memory

Stage-two measured baseline: **186,624 bytes gzip JavaScript / 1,340,840 bytes media**. Stage three: **209,285 bytes gzip JavaScript / 1,844,085 bytes media and geographic JSON**, including all delivery variants. Existing ceilings of 750,000 / 2,000,000 bytes pass. The incremental JavaScript is 22,661 bytes gzip; no downloaded building model or extra bitmap transfer is needed.

| Added resource | Measured | Enforced limit |
| --- | ---: | ---: |
| Regional JSON | 503,245B raw / 173,539B gzip | 550,000 / 180,000B |
| Regional lazy code | 1,587B gzip | 10,000B |
| Site lazy code | 7,839B gzip | 20,000B |
| Regional geometry | 960,176B / 20,350 triangles | 1,200,000B / 30,000 |
| Site geometry and instance buffers | 633,472B desktop / 560,776B mobile | 1,200,000B |
| Site geometry triangles, including hero | 115,710 desktop / 96,286 mobile | 140,000 |
| Site base draw calls including ground/road | 42 | 52 |
| Site decoded module + landscape pixels | 6 / 1.5 MiB | 6 / 1.5 MiB |
| Estimated site textures + environment + shadow | 49 / 12.25 MiB | 52 / 16 MiB |

Desktop/mobile retained texture estimates separate module/landscape mipmaps (**8 / 2 MiB**), environment plus depth (**9 / 2.25 MiB**) and shadow colour/depth storage (**32 / 8 MiB**). Earth remains **40 / 10 MiB decoded**, approximately **53.33 / 13.33 MiB with mipmaps**. These are storage estimates, not measured total process/GPU memory; they exclude driver overhead, framebuffers, temporary upload/capture copies and browser caching.

Steady integrated building views render **44 calls**, with **101,294 / 92,238 triangles**; panel views **38 / 36 calls**, **115,540 / 96,414 triangles**. Shadow rendering is cached, so the first warmup/re-entry shadow pass costs more than these steady-frame counters. The original adaptive DPR/pixel caps and Sun quality approach remain; no full-frame bloom/postprocessing target was added.

[Exact hashed build sizes and enforced limits](../asset-sizes.json) distinguish compressed estimates from actual local delivery. The preview sends uncompressed bodies. Opening resource requests contain neither Earth textures nor region/site assets; desktop and mobile each fetch only their selected Earth pair. Network totals and frame intervals below are generated from the final run.

Final median / 95th percentile frame intervals, milliseconds:

| CSS viewport | Sun | Earth | Region | Building | Panel |
| --- | --- | --- | --- | --- | --- |
| 1600 × 1000 | 16.7 / 17.3 | 16.7 / 17.3 | 16.7 / 17.3 | 16.7 / 17.2 | 16.7 / 17.5 |
| 1280 × 720 | 16.7 / 17.3 | 16.7 / 17.4 | 16.7 / 17.1 | 16.7 / 17.4 | 16.7 / 17.5 |
| 390 × 844 | 16.7 / 17.3 | 16.7 / 17.3 | 16.7 / 17.3 | 16.7 / 17.1 | 16.7 / 17.3 |
| 740 × 900 | 16.7 / 17.3 | 16.7 / 17.4 | 16.7 / 17.4 | 16.7 / 17.7 | 16.7 / 17.7 |
| 1000 × 500 | 16.7 / 17.6 | 16.7 / 17.6 | 16.7 / 17.6 | 16.7 / 17.6 | 16.7 / 17.6 |

No sampled interval exceeded 33.4 ms in these settled four-second windows. No page/console errors were recorded.

Local uncompressed resource-body totals (excluding the HTML navigation, headers and browser overhead):

| Selected tier | Opening | Entire journey |
| --- | ---: | ---: |
| desktop | 863,497B | 2,291,503B |
| mobile | 785,495B | 1,549,859B |


Measurements use **Chrome for Testing 151.0.7922.34 on an Apple M4 MacBook Air, 16 GB, ANGLE Metal**. Four seconds are sampled in each settled heavy view. Frame intervals measure browser animation cadence, not isolated GPU time or long-duration thermal performance. Phone-sized emulation is not a physical-phone test. Safari, Firefox, physical phones, constrained networks and sustained thermal behaviour remain unmeasured.

## Checkpoint and continuation

Work is on `experience/stage-three` in `/Users/nick/Projects/Aesir Solar/experience-stage1`. The actual clean checkout `ecb981d`, running port-4173 server and its project directory were confirmed before edits. The recoverable tag **`experience-stage-two-reviewed`** preserves that checkpoint; **`experience-stage-one-reviewed` / `9845462`** also remains. The tag **`experience-stage-three-delivered`** identifies the final delivery checkpoint; prior capture histories are retained. The original `/Users/nick/Projects/Aesir Solar/site` remains untouched. Nothing was published and the public homepage was not replaced.

Next: glass → silicon → absorption, a distinct current cue, DC → inverter → AC, optional storage, considered business activation, and the long-journey/final-connection payoff. The [vision register](vision-register.md) explicitly retains independence, economics, equipment longevity, sustainability, storage/resilience, monitoring, process, proof, FAQs and support, separating confirmed service copy from claims awaiting evidence. It also preserves optional audio/cursor polish and real-device verification.

The independent [intake/payment/fulfilment blockers](../backend-blockers.md) are unchanged and remain a public-rollout gate. This visual milestone does not repair them.

Reproduce with `npm run typecheck`, `npm run build`, `npm test`, `npm run test:browser`. Run `node scripts/capture-stage-three.mjs`, `node scripts/verify-stage-three.mjs` and `node scripts/inspect-stage-three.mjs` separately to avoid simultaneous browser measurements. Source masters stay outside the served build.
