# Touch-device graphics budget

9 September 2026. Baseline `990b544`, retained as `experience-safari-performance-before`. The user reports intermittent jumping on an iPad and an iPhone using Safari. Exact device models, Safari versions and affected scenes have not yet been supplied. This pass corrects a reproduced resource-selection defect; it does not establish the cause of every reported hitch.

## Diagnosis and correction

Quality selection previously considered only viewport width and reported CPU cores. A touch device wider than 759px with more than four reported cores received the desktop graphics budget. That includes a possible iPad or a phone loaded in landscape. Rotation could also change the Sun's geometry/shader tier while already-loaded scene owners retained their original, larger textures. The original mobile resources already existed; these devices were simply not reliably selecting them.

Touch capability now selects the existing mobile budget regardless of width or orientation. The scene captures `maxTouchPoints` or the `any-pointer: coarse` capability once, and uses it for initial loading and every resize. No browser-name sniffing is used. Playwright WebKit's mobile context reports zero touch points but a coarse pointer, so both capability paths matter. A mouse-only desktop retains its previous settings; touch-capable laptops also use the bounded portable profile.

This changes rendering workload and resource selection, not the story: full-screen canvas coverage, camera paths, scientific explanations, native scroll, reversible states, scene ownership and the recent 1.8-second footer glide are unchanged. It adds no per-frame measurement, allocation, resolution adaptation, new asset or dependency. It does not change the checkout, providers, DNS, mail or the original site checkout.

An iPhone already receiving the mobile tier in portrait gets no additional reduction from this fix. Its reported hitches still need device-specific profiling. Frame-rate drops, first-use compilation/loading and viewport changes are different possible causes; none should be declared resolved merely because a desktop test passes.

## Review method and limits

`scripts/inspect-safari-quality.mjs` records eight views (Sun, Earth, selected panel, cell, inverter, business, storage and brand), rotates twice, traverses the complete film backwards and forwards, and checks that Skip suspends rendering. It blocks API, external-provider and non-GET requests. No application, payment or message is created.

The controlled profiles are 820×1180/DPR2 and 844×390/DPR3, with eight reported cores to exercise the previously wrong branch. These are **Playwright WebKit on an Apple M4 MacBook Air with 16GB RAM**, not an actual iPad or iPhone. The WebKit build reports version 26.6. Video recording is active during the frame-interval samples; the numbers describe this desktop recording run, not a phone benchmark or guaranteed frame rate. Fresh browser contexts are used, but OS/driver shader caches are not cleared. Owner readiness includes local import/build/compile work and is reported separately from settled frames.

The texture/target estimate counts retained Earth textures and mipmaps, site/extra textures and mipmaps, environment targets and the shadow map. It excludes geometry, the main drawing buffers, cell/electrical overlays, driver copies and process overhead. It is not a measurement of total GPU/process memory. Raw snapshot fields retain the separately reported geometry and overlay costs.

Reproduce with `SAFARI_PHASE=after node scripts/inspect-safari-quality.mjs`. `SAFARI_ORIGIN` can select the public site and `SAFARI_ENGINE=chromium` selects Chromium. Review JPEGs retain capture dimensions (new captures at quality 94, baseline PNGs converted with ffmpeg JPEG quality 2); videos are the original WebM captures. All evidence is outside the served build.

## Measurements and verification

| Controlled touch profile | Before | After |
| --- | ---: | ---: |
| 820×1180 rendering pixels, before integer buffer rounding | 2,000,000 | 850,000 |
| 844×390 rendering pixels, before integer buffer rounding | 740,610 | 514,312.5 |
| Retained texture/target estimate, both profiles | 102.33 MiB | 25.58 MiB |
| Earth day + cloud source-file bytes selected | 903,188 B | 239,546 B |
| Geometries before/after repeated traversal | 79 / 79 | 79 / 79 |
| Textures before/after repeated traversal | 8 / 8 | 8 / 8 |
| Frames sampled after Skip leaves the film | 0 | 0 |

This is **57.5% fewer drawing pixels for the tablet profile** and **75% less estimated retained texture/target storage**. The landscape phone profile draws 30.6% fewer pixels. The HTML text remains at native browser resolution. Close panel lines are softer at the smaller drawing resolution, as expected; the guide, cell event, Earth destination and application actions remain legible in the reviewed frames. The existing portable profile is used without new blur, lighting changes or camera changes.

The recordings **do not demonstrate a frame-rate improvement** on this fast desktop: before scene medians were 16–17ms with p95 25–28ms; after medians were 16–17ms with p95 28–31ms, during video capture. The proven gain is lower workload/storage, not a measured physical-device FPS improvement. In the tablet profile, site/cell/business owner readiness was 241/310/184ms before and 74/82/36ms after; initial readiness was 1793ms versus 247ms. These first-use observations are cache-sensitive and cannot be attributed solely to this change. Landscape phone observations and individual scene/frame/readiness samples are preserved in the raw reports.

- **144/144 Node tests, type checking and production build passed.** The new touch regression failed on the baseline while its mouse-desktop control passed: [before regression](regression-before.log), [final Node run](node-tests.log).
- **202/202 browser checks passed in the final full run** (5.9 minutes): [full log](browser-tests.log). Six new Chromium/WebKit checks cover tablet/landscape widths, two rotations, loaded resource stability, the actual mobile Earth variant and keyboard-focus handoff. Existing startup, fullscreen, 200% text, reduced-motion/no-JS, delayed/failed loading, Pause, disposal, application and provider-isolation coverage remains passing.
- Final capture runs have no page errors or console warnings. Both rotations retain the mobile tier. These are desktop-emulated checks; real iPad/iPhone, battery/thermal and device-specific Safari validation remain open.
- Delivered JavaScript is **255,725 B gzip** (+61 B), homepage CSS **8,426 B gzip** (unchanged), media/geographic JSON **1,844,085 B** (unchanged). Existing 750,000/2,000,000 B transfer ceilings and all rendering caps remain in place.

Evidence: [before measurements](before-webkit/measurements.json), [after measurements](after-webkit/measurements.json), [tablet before motion](before-webkit/ipad-motion.webm), [tablet after motion](after-webkit/ipad-motion.webm), [landscape phone after motion](after-webkit/iphone-landscape-motion.webm), [Sun](after-webkit/ipad-sun.jpg), [Earth](after-webkit/ipad-earth.jpg), [panel](after-webkit/ipad-panel.jpg), [cell](after-webkit/iphone-landscape-cell.jpg), [final campus](after-webkit/iphone-landscape-brand.jpg). The motion captures include eight settled views, rotation and the entire film in reverse and forward.

## Release

Implementation **7076d9e** is pushed to GitHub `main` and `experience/checkout-consolidation`, with `experience-safari-performance-fixed` retained. Production **dpl_2EaC1grU7HxVrBSVEzAJJfZVwjEd** (`aesir-solar-dgu3tbt5q-aesir.vercel.app`) is Ready and serves `https://aesirsolar.co.uk/` plus the existing www/Vercel aliases. [Deployment log](deployment.log).

The [public verification](production/verification.json) compares SHA-256 hashes of the served entry JavaScript, scene JavaScript and homepage CSS against the tested build: `experience-H1LMbZYr.js`, `scene-Bv1eVTb8.js` and `experience-cbuE7ehO.css`. Tablet and portrait-phone WebKit contexts select mobile graphics, load mobile Earth imagery, retain that tier when rotated, focus the application section after Skip and stop rendering offscreen. No page errors or console warnings occurred; all API/provider/non-GET requests were blocked. [Live tablet](production/tablet-earth.jpg), [live phone](production/phone-earth.jpg). Reproduce with `node scripts/verify-touch-release.mjs`.

Evidence-only commits after 7076d9e do not alter the served implementation. The remaining next check is on the user's actual iPad/iPhone, including the exact device/Safari version and a recording of any surviving hitch. Lower resource use is proven; universal Safari smoothness is not claimed.

## Supporting references

Accessed 9 September 2026: [WebKit's desktop-class iPad browsing explanation](https://webkit.org/blog/9674/new-webkit-features-in-safari-13/) and [WebKit's feature-detection recommendation](https://bugs.webkit.org/show_bug.cgi?id=212937) support detecting capabilities rather than treating a desktop user-agent as proof of desktop hardware. [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) supports explicit pixel/VRAM budgets and smaller backbuffers. These explain the approach; they do not diagnose this user's physical devices.
