# Launch refinement and Vercel frontend release

**Later operational release:** the new site and Stripe intake/payment/work chain are now live on aesirsolar.co.uk with user approval. See the [current release handover](../../operations/checkout-migration/release-2026-09-09.md). The frontend-only scope and provider/domain statements below remain historical.

The user authorized publication of the upgraded experience after the packing-line, battery-camera, facade, wall-seam and content fixes. Work begins at clean `331ebc8` / `experience-stage-seven-delivered`, on `experience/launch-refinement`. The original `/Users/nick/Projects/Aesir Solar/site` remains unchanged at `c61643f`.

Local candidate: **http://127.0.0.1:4173/**. [Review gallery](review.html), [current route/content manifest](route-content-manifest.md), [complete vision register](vision-register.md), [precise refinement notes](refinement-notes.md). **Live production:** https://aesir-solar.vercel.app/. Deployed source: `88c8884`; Vercel deployment `dpl_Er9QBEKjBoaN1x4jfqQNZ12VRTNp`, **READY**. [Deployment record](production/deployment.json) and [public verification](production/verification.json) identify the exact tested release. No custom domain or payment-provider setting was changed.

## Requested fixes

The packing bay now uses a recognizable fixed-height carton tape sealer: tape reel/feed, side guides and pressure rollers. Standard cartons move through a slow indexing/accumulation cycle, with covered transfer points concealing loop resets. A scroll-dependent clock multiplication was removed, eliminating unintended fast-forward during the reveal. The pure supplied-time animation remains pausable/reversible and adds no per-frame geometry.

The battery move is a calmer outward dolly with an exact composed hold. The factory facade closes only after the camera has left the interior, and every original facade instance returns before the final view. Tall cladding ribs now end physically above the dark plinth; the coplanar overlap responsible for flickering is removed while preserving the ribbed pattern.

The application offer remains the first substantive section after the film. Authored content below it falls from **2,447 to 502 words (79.5% less)** using the same HTML-text counting method, including closed FAQ text. Full guidance is preserved on `/solar.html`, `/suitability.html` and `/faq.html`. The historical summary still uses the validated supplied record, date/source/limits and valid-zero handling; its full chart/table and scientific context are native HTML on the solar page. No new claims or external assets were introduced.

All 23 chapter meanings, 12 still views, 6.08 authoring units and the £250 + £50 VAT = £300 suitable Form A1-2 application offer remain. Every original named form control, both consents, provider selection and API implementation is retained. Supporting routes load no 3D. The original site's source checkout and history remain intact.

## Review and measured limits

[Five-view film captures](final/observations.json), [complete page captures](pages/observations.json), [packing-cycle/forward-reverse recordings](motion/observations.json), [budget accounting](budgets.json), and the final performance/check records document the actual scope. The review corrects the foreground transfer hood and moves enlarged storage labels into a lower legend so text does not collide.

The supplied wall screenshots are preserved under `before/`. `motion/laptop-forward-reverse.webm` and `motion/mobile-forward-reverse.webm` cover inverter entry, a full slow packing cycle, steady storage, the restored ending and reverse travel. Phone-sized views are **desktop viewport emulation**, not real phones. The wider 23-chapter rhythm and unchanged scene checks remain in the full regression suite and stage-seven historical recordings.

Measured host: Apple M4 MacBook Air, 16 GB, Mac16,13; Chrome for Testing 151.0.7922.34, ANGLE Metal. Requested layouts: 1280×720, 1600×1000, 390×844, 740×900, 1000×500. Enlarged text, reduced motion, no-JavaScript, keyboard navigation, Back, failed/delayed owners, Pause/reversal, context loss, disposal and resize coverage are explicitly in the suites. Physical phones, full Safari/Firefox suites and sustained thermal validation remain unperformed in this pass. A fresh native Safari 26.6.2 smoke check of the public release is recorded below, separate from the Chromium suite.

No delivery ceiling or DPR/pixel cap was raised. No new external media, texture or render target is added. Interior geometry uses 61,360 desktop / 54,352 mobile bytes, 9,560 / 8,392 triangles and 22 base draws, within existing bounds. The full business owner includes its existing route/containment overhead. Frame measurements are rAF cadence, not GPU execution time or internet/phone predictions.

Final source checks: **type checking and build passed; 82/82 Node tests and 118/118 browser checks passed**. [Check scope and source hashes](checks.json), [Node log](node-tests.log), [browser log](browser-tests.log). Focused earlier runs are not added to those counts. The additional enlarged-storage review at 390×844, 740×900 and 1000×500 found no label/copy overlap; its captures and measurements are in `final/*storage-text200.png` and [enlarged-storage.json](enlarged-storage.json).

[Final measured results](verification-summary.md): 16.7ms median, 17.8–18.7ms p95 across the eight heavy views; stable 79 geometries / 8 textures / 23 requests after three traversals. Delivery remains 254,774 B compiled JS gzip (+272 B) and 1,844,085 B media (unchanged). The exact per-view measurements and local-readiness limits are in [performance.json](performance.json).

## Deployment and operational boundary

Vercel project **aesir-solar**, team **aesir**, is linked to `Njf1/aesir-solar-site` on GitHub. The existing production alias is **aesir-solar.vercel.app**; no custom domain was bound to this Vercel project at inspection. The previous production deployment is `dpl_FDWdfALkrgQV7BFPVchafM1hYxZw`, retained for rollback. Release source is pushed to GitHub, never to the candidate's `origin` remote, which points at the protected original local checkout.

The root build runs the generator before Vite and assembles a clean static output. Vercel keeps the five original API routes as Node 24 functions; raw handlers, server helpers and package files are no longer copied into public static output. API cache becomes `no-store`. This is release packaging, not payment/provider logic repair. Credential/settings files, dependencies and review films are excluded from direct source deployment. A fresh build can create its measurement directory when review documentation is excluded.

**The paid-application pipeline is not proved by this frontend release.** The current Vercel project has no Tyl/Stripe environment settings. The existing controller falls back to the external cart. A complete application still needs durable saving, authoritative matching payment verification and one actionable Aesir work item. The return page remains truthful and unverified. No provider configuration, real submission/payment or message was made in this milestone. Search indexing stays disabled pending operational readiness. The [backend blockers](../backend-blockers.md) remain separate required work.

## Reproduce

`npm run typecheck`, `npm run build`, `npm test`, `npm run test:browser`. The build generates supporting pages and the recorded content, compiles the two lightweight entry points, and atomically assembles the scoped `.release`. `npm run preview` serves only loopback and blocks provider APIs. Capture scripts are `capture-launch-pages.mjs`, `record-launch.mjs`, `verify-launch.mjs` and the parameterized stage-seven film capture. Run the isolated benchmark after other browser work finishes.

## Public verification after deployment

All 14 intended page/alias requests returned 200 after canonical redirects; cancellation/reference query strings survived. Unknown route and server-helper source requests returned 404. Safe GET `/api/checkout` returned its original 405 `Method not allowed`, `Allow: POST`, and `Cache-Control: no-store`; no POST or provider API was invoked.

Production Chromium checks at 1280×720 and 390×844 loaded the opening, packing bay, battery and final restored facade, then used Skip and the header action to reach the original 19-field/two-consent form. They produced no browser errors, warnings, provider requests or overflow. [Public captures and record](production/verification.json) supplement the complete local five-view suite and recordings. The original checkout remains clean at `c61643f`.

## Native Safari public smoke check

Safari **26.6.2** on the actual M4 MacBook loaded the public Sun, packing bay, battery and final restored facade. Large forward scrolling held the previous composed scene while the next lazy owner loaded, then resumed. Two temporally separated paused captures have identical central scene pixels (SSIM 1.0, crop recorded in scope.json); Skip focused the offer; the header action opened the original form without submission; Back returned to `#application-details`. [Scope and captures](production/safari/scope.json). This is a native desktop smoke check, not a full Safari console/performance run or physical-phone test. No settings were changed.
