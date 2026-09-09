# Stable scene during mobile browser-bar resizing

9 September 2026. Baseline **3f71a3b**, retained as `experience-mobile-scene-anchor-before`.

## Observed defect

The supplied `18879.mp4` shows the browser controls retract, followed by a separate downward jump of the Sun while the headline stays put. The source's largest sampled downward step is **244.7 native screen pixels** around 2.3–3.2 seconds. These are recording pixels, not CSS pixels. [Source metadata and samples](recording-source.json), [earlier frame](source-2.5.jpg), [later frame](source-2.9.jpg). Review crops omit the user's other browser tabs; the full recording is not copied into the repository.

The canvas correctly followed `100dvh`, but the camera still used a conventional centred projection based on that changing height. Increasing the visible height therefore moved and enlarged objects already in the frame. The previous tests protected fullscreen coverage, camera poses and progress, but did not protect the actual projected Sun position. Four new raster regressions fail against the baseline in Chromium and WebKit, including while Pause holds the scene clock and pose.

## Correction

The camera now uses the same CSS-resolved small viewport as the scroll distance and copy layout. Three 0.185.1's `PerspectiveCamera.setViewOffset()` extends the view **downward** to fill the newly available height, preserving existing scene points and scale in CSS pixels. No stretching, camera easing, CSS canvas translation or delayed fullscreen resize is used. The installed version's projection implementation was inspected directly. When visible and reference heights match, its matrix is identical to the previous ordinary desktop projection.

The camera and HTML also share the stable reference for portrait/landscape/short framing. A toolbar change cannot switch the authored camera path by crossing an aspect-ratio breakpoint. Real resizing and rotation remeasure the reference normally. One invisible, noninteractive CSS sizing element is observed by the existing ResizeObserver, then removed on failure/disposal. Projection work happens on resize, not every animation frame. A reference-only change does not needlessly clear/recreate the drawing buffer.

The full canvas still covers the screen immediately; newly exposed pixels contain the real scene. All scene owners, resource caps, the portable graphics fix, camera paths, scroll distance and 1.8-second footer glide remain intact. A subtle text shadow keeps the footer readable while it crosses the bright Sun during that glide, without adding a plaque or changing its size/timing. Native browser movement of its entire page/window is outside the site's control; the separate in-canvas jump is what this correction removes.

## Verification method

- Raster checks measure the Sun's bright-pixel centroid and central 80% vertical span in actual screenshots, rather than inferring stability from camera coordinates. The central span excludes isolated prominence/glow pixels whose visibility varies beneath the viewport-relative readability gradient.
- Actual camera projection and view matrices check CSS-pixel positions through the Sun, acquired light, Earth, region, site, selected panel, glass, absorption, DC route, inverter, business, storage, brand and reversal. Paused progress and time remain unchanged.
- Geometry checks now intersect real mesh triangles against the actual projected near-plane rectangle, including the asymmetric expanded mobile frustum. They retain the original five framings and add portrait/short expanded cases. Camera-centre and near-plane containment checks remain.
- Existing fullscreen, startup, no-JS, 200% text, keyboard Skip, Back, pinch zoom, delayed/failed loading, still views, Pause, offscreen suspension and resource-disposal tests remain in the full suite.

Desktop browser automation cannot operate a physical browser toolbar. These controlled tests hold CSS `--scroll-unit` at a 719px small viewport while changing the visible height between 719 and 844px, in both Chromium and WebKit. The existing Chromium viewport suite also exercises native `svh` resolution with its CDP small-viewport override. Neither method is represented as a physical Safari certification. Test host: Apple M4 MacBook Air, 16GB RAM; Chromium 151.0.7922.34 and Playwright WebKit 26.6. The supplied recording is physical-phone evidence of the original defect; exact phone/browser version was not supplied.

Provider/API/non-GET requests are blocked. No applications, payments, mail, provider settings or DNS changes. The original site checkout is untouched. Reproduce the capture with `ANCHOR_PHASE=after node scripts/capture-scene-anchor.mjs`; optional `ANCHOR_ENGINE=webkit` and `ANCHOR_ORIGIN=https://aesirsolar.co.uk` select engine/origin. All review evidence is excluded from the served build.

## Final checks and delivery cost

**The complete projection/control implementation passed 146/146 Node tests and a full 212/212 browser run (6.4 minutes).** During the following visual review, Chromium's user-agent button rule was found to reset the inherited footer text shadow. The final paint-only adjustment explicitly sets `#pause-motion { text-shadow: inherit }`; it changes no layout, timing or scene logic. Type checking, build and all 146 Node tests were rerun, followed by **22/22 passing Chromium/WebKit scene-anchor and footer-control checks** for that final override. [Full browser log](browser-tests.log), [final focused log](final-controls-tests.log), [Node log](node-tests.log), [baseline raster failures](regression-before.log). The focused result is separate from the full-suite result, not described as another full rerun. Ten added browser checks cover actual Sun pixels, every scene's projection, the framing threshold, reduced-motion views and reference disposal in Chromium/WebKit. Two added Node checks prove point/scale invariance and desktop equivalence; the existing geometry-clearance check was strengthened for the real asymmetric frustum. No camera fixture was reset.

Delivered JavaScript totals **254,923 B gzip**, versus 255,725 B before. Vite's shared-chunk layout changes: the entry bundle is **56,059 B gzip**, versus 51,720 B before (+4,339 B), while total JavaScript is 802 B smaller. Homepage CSS is **8,445 B gzip** (+19 B for the text shadow), and media/geographic JSON remains **1,844,085 B**. Existing transfer and drawing-pixel ceilings pass. The sizing element adds no geometry, texture, render target, renderer or permanent animation loop. Rotation and buffer changes still redraw once while paused, with zero advancement of the supplied clock.

The [comparison](comparison.jpg) aligns the viewport tops: grey below a shorter capture is the comparison board, not empty space on the page. The baseline 719→844px expansion moved the measured Sun centroid **88.41px at journey 0.06** and **90.72px at 0.15**. The corrected opening stays at the same pixel location; the brighter centroid at 0.15 can vary slightly under the viewport-relative readability gradient, while its actual projected position/scale remain invariant. Review data reports this raster variation rather than hiding it.

Evidence: [baseline motion](before-chromium/scroll-and-bars.webm), [Chromium motion](after-chromium/scroll-and-bars.webm), [WebKit motion](after-webkit/scroll-and-bars.webm), [baseline measurements](before-chromium/measurements.json), [Chromium measurements](after-chromium/measurements.json), [WebKit measurements](after-webkit/measurements.json). Recordings include abrupt height changes, rapid reversal and normal forward/reverse approach. Final recordings also include eight expanded-viewport scene views. The original baseline `height` raster field is the full warm-mask span; final `height` fields use the central 80% span to exclude isolated glow pixels. The centroid comparison uses the same mask in every recording.

## Production release

Implementation **17501ff** is pushed to GitHub `main` and the working branch, with `experience-mobile-scene-anchor-fixed` retained. Production **dpl_8jRY57BvzcNHU5ihJrhdSHX4zoRh** (`aesir-solar-kjp2acxny-aesir.vercel.app`) is Ready at `https://aesirsolar.co.uk/` and the existing www/Vercel aliases. [Deployment log](deployment.log).

The public entry JavaScript, scene JavaScript and homepage CSS match the tested build by SHA-256: `experience-CsseFbE1.js`, `scene-BV9A4vcT.js`, `experience-L5rRFiuE.css`. [Live asset verification](live-assets.json). Evidence-only commits after 17501ff do not change these assets.

[Live WebKit measurements](production-webkit/measurements.json) show **0px opening centroid movement** and at most **1.36px bright-centroid variation at 0.15** during 719/844/769/819/719px changes, matching the local result. There are no page errors. The [live recording](production-webkit/scroll-and-bars.webm) includes the forward/reverse approach and eight expanded scene views. APIs, providers and non-GET traffic remained blocked. This is a live-domain desktop WebKit emulation check, not a new physical-phone test; the user should refresh their actual phone to confirm the supplied-recording behaviour is gone there.
