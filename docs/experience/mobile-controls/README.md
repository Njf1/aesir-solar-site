# Consistent mobile controls and discreet image credits

9 September 2026. Started from clean `af1a425` on `experience/launch-refinement`, retained as `experience-mobile-controls-before`. The original `site` checkout remains unchanged. This is a small presentation/accessibility correction to the authorized Vercel frontend.

## Diagnosis and changes

The supplied Android and iPhone photographs show different effective text sizes. Our existing Skip link also had an authored 66%-opaque black rectangle: it disappeared into space but became conspicuous over the regional map. Its previous touch target was only 32 CSS pixels high. The iPhone additionally rendered the Unicode northeast arrow as a blue emoji.

Default mobile-input Chromium and WebKit contexts both measured 11px Skip text, 12px header-action text and a 34px Sun heading. These desktop-hosted contexts did **not** reproduce the physical iPhone's enlargement. Safari automatic text adjustment, page/text zoom, logical viewport size and device preferences can affect that presentation; the photographs alone do not establish which setting was active. We do not claim to have diagnosed the user's device settings.

- Skip retains its restrained 11px mobile / 12px desktop styling, now with a transparent background, quiet text shadow and a minimum 44px touch target. Its keyboard focus outline stays visible.
- Explicit `-webkit-text-size-adjust:100%; text-size-adjust:100%` on the two site roots makes the authored responsive text scale explicit instead of leaving automatic inflation unspecified. User enlargement and pinch/page zoom remain available; no restrictive viewport flags were added.
- Original inline SVG action arrows replace emoji-capable characters in the homepage and generated supporting routes. They are decorative, nonfocusable and inherit the site's colour.
- Portrait chapter copy respects the measured bottom of Skip plus 12px. Landscape copy retains its established positions; tests check actual text rectangles against Skip. This prevents the regional headline/control collision on shorter screens and when text is deliberately enlarged. The existing ResizeObserver measures the control only during layout changes. No continuous rendering or camera/timeline changes were introduced.
- The long footer acknowledgement is now a small **Image credits** link to `/solar.html#image-credits`. The complete attribution remains visible in semantic HTML without JavaScript, alongside the illustration/endorsement qualification. The detail route downloads no 3D assets.
- Visual review of that destination also found inherited gold link colour on its gold application button. The guide's filled actions now explicitly use dark lettering.

## Image-credit decision and sources

Source terms were checked on 9 September 2026. Original exact downloads, creators, transformations and hashes remain in [Earth asset provenance](../stage-two/earth-assets.md) and [regional provenance](../stage-three/region-provenance.md). No source asset changed.

| Primary source | Supported decision and limit |
| --- | --- |
| [NASA Blue Marble: Next Generation](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/) | Names Reto Stöckli and asks users/republishers to credit **NASA Earth Observatory**. That credit is retained. |
| [NASA media-use guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/) | NASA should be acknowledged; commercial use must not imply endorsement. Third-party exceptions remain image-specific. These selected images have the recorded NASA provenance, no logos/identifiable people and no identified third-party restriction. |
| [Natural Earth terms](https://www.naturalearthdata.com/about/terms-of-use/) | Public-domain data; attribution expressly unnecessary. The voluntary acknowledgement remains in the credits section. |
| [Apple's Safari text-sizing documentation](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/AdjustingtheTextSize/AdjustingtheTextSize.html) | Describes automatic text adjustment, overflow of positioned text and the percentage control. It explains a possible browser mechanism, not the uninspected iPhone's settings. |

Neither retrieved NASA page specifies a prominent homepage-footer paragraph. Moving the full acknowledgement to a clearly linked credits section is our presentation decision; we have not removed the requested NASA credit or obtained/claimed NASA endorsement.

## Review and verification

The [before](before/observations.json) and [after](after/observations.json) records contain measured control bounds and actual rendered states. Before/after PNGs and short forward/reverse recordings cover Sun, Earth and Britain at 390×844 and 375×667 in Chromium and WebKit. The `first-pass/` captures retain the first visual review, after which the remaining single-property Britain copy rule was brought under the measured exclusion area. Final `after/` captures include 200% text, footer and credits. The first full regression run caught two landscape enlarged-text/still layouts displaced by an overly broad exclusion area; restricting the reservation to portrait restored those established compositions.

Reproduce captures with `CONTROLS_PHASE=<new-directory> node scripts/capture-mobile-controls.mjs`. Set `CONTROLS_ORIGIN` for the public origin. Provider requests are blocked. The 20 added browser cases cover both engines at six viewport sizes, forward/reverse travel, control/copy separation, keyboard focus/Skip/Back, 200% text, delayed loading and native no-JavaScript credit navigation. Existing regression coverage remains intact.

Hardware: Apple M4 MacBook Air, 16GB; Chrome for Testing 151 and Playwright WebKit 26.6. These are desktop-hosted browser-engine tests with mobile viewport/input emulation, **not physical iPhone or Android certification**. For a fresh test environment, install matching runtimes with `npx playwright install chromium webkit`. The matching WebKit test runtime was installed; project dependency versions were not changed.

Final local verification passed: type checking, build, generated-page drift check, **82 Node tests** and the complete **170 browser checks** (160 Chromium, 10 WebKit). The final focused run passed all 22 selected cases, including both corrected layouts. See `typecheck.log`, `build.log`, `node-tests.log`, `browser-tests.log` and `focused-tests.log`. Production verification passed after the authorized push; see the release record below. No provider/API/form/consent/price changes, real submissions, payments or messages are part of this work. Durable intake, authoritative payment verification and actionable fulfilment remain the separate operational repair; indexing protection remains in place.

## Delivery and runtime impact

Final local build: **255,082 B JavaScript gzip** (43 B above the viewport-fix baseline), **1,844,085 B media/geographic JSON** (unchanged), and **8,382 B homepage CSS gzip** (210 B above baseline). The existing 750,000 / 2,000,000 B JS/media ceilings pass. Supporting-page CSS remains separate; image credits add no library or runtime asset request.

No texture, geometry, renderer, shadow, render-target, shader, camera or quality-tier changes were made. The control measurement runs through the existing ResizeObserver and does not start a continuous loop while paused/offscreen. Existing pause, resize, still, disposal and reversal regressions remain required. This focused change does not replace the prior measured rendering-performance record with an unmeasured phone claim.

## Live release

Implementation **`0e1d74d`**, tagged `experience-mobile-controls-delivered`, pushed atomically to GitHub `main` and `experience/launch-refinement`. Vercel production deployment **`dpl_AGL4pTmn48tCLN6ATjmxiXKVBu6m`** reached READY at [aesir-solar.vercel.app](https://aesir-solar.vercel.app/). Previous production rollback: `dpl_3o7etxrCKtbXbMYo1KMphy7QGDdz` / `af1a425`.

The public homepage and entry JS/CSS exactly match the tested local release ([payload verification](payload-verification.json)). [Production browser observations](production/observations.json) repeat Sun/Earth/Britain forward/reverse views, 200% text and credits in both engines at 390×844 and 375×667, with no console errors/warnings. [Public route verification](production-routes/verification.json) covers 14 valid routes plus expected 404s, rejects a safe GET to checkout with 405/no-store, and verifies laptop/mobile application access, all 19 controls and both consents. It creates no application, payment or provider request.

The final mobile controls measure **11px text, a 44px touch target, transparent background and at least 12px portrait copy clearance** in the sampled frames. These results do not establish physical-phone settings or universal device certification. The verification commit is documentation-only; it does not alter the tested site payload.
