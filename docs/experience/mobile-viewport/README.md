# Full-height mobile viewport repair

Baseline: clean `b1ded61`, `experience/launch-refinement`; recovery tag `experience-viewport-before`. The original `site` checkout remains untouched at `c61643f`. The user supplied a physical-phone photograph showing the Sun cut off along a straight edge, with unused black space below. [Original report image](before/user-photo.jpg).

## Diagnosis and implementation

The stage used `100svh`: the small viewport with browser controls expanded. When mobile browser controls retract, the visible page grows but that stage stays short. Desktop viewport resizing makes `svh` and the visible viewport equal, so the previous fixed-size checks did not exercise this condition. Chromium's real CSS-unit override reproduces **125 px of uncovered screen at 390×780** and **160 px at 412×915**. The supplied image and the reproduced stage boundary have the same straight clipping edge.

The stage, canvas host and static alternatives now fill **100dvh**, with a 100vh fallback for older engines. The 34.048 viewport heights of useful travel still use the stable small viewport. The journey consists of that travel plus one current visible viewport, and ScrollTrigger measures the actual sticky travel rather than subtracting its own large-viewport measurement. Browser-bar changes therefore do not rescale the story or add an empty tail.

Real resizing/rotation preserves chapter progress. A refresh guard prevents ScrollTrigger's earlier resize callback from replacing the old progress before ResizeObserver can restore it. The added test initially exposed a jump from Sun progress .295 to .800; the final implementation preserves .295 through rotation. When Skip has focused the visible application offer, rotation keeps that offer visible and focused.

Changing a WebGL drawing buffer clears it. An actual resize now redraws once before paint with a zero time step, including Pause/stills. Unchanged dimensions avoid clearing/reallocating the buffer. The ambient clock remains frozen when paused, and rendering stays suspended off screen. Existing clipping/framing, narrative, owner disposal and pixel caps are retained; the change does not create a new renderer or stretch a stale canvas image.

## Verification scope

The new browser suite covers small/current viewport differences at 280×653, 320×568, 360×800, 390×780, 412×915, 430×932, 600×600, 740×900, 820×1180, 667×375, 844×390, 1000×500, 1280×720, 1600×1000 and 2560×1080. It samples the Sun approach, close-up and reverse in every view; checks CSS bounds and actual drawing-buffer dimensions; and retains the existing mobile/desktop pixel ceilings.

Additional cases cover ten increments of browser-bar expansion/collapse, paused clock/composition, rotation through portrait/landscape/tablet layouts, the exact last-frame/application boundary, reduced-motion stills, missing WebGL, no JavaScript, pinch zoom, rotation after Skip, and a device-scale-factor-3 mobile view. These are 24 new checks in addition to the previous 126 browser checks. Existing regression coverage remains in place for the rest of the film, delayed loads, context loss, reversal, controls and application contracts.

**Device scope:** Apple M4 MacBook Air, 16 GB, Chrome for Testing 151.0.7922.34 / ANGLE Metal. Mobile inputs and browser-control viewport differences are explicitly emulated using the browser's own CSS viewport-unit implementation. The supplied phone image is real-device evidence of the defect; this work does not claim to have remotely retested that phone or certified every physical device. ADB and Playwright WebKit/Firefox runtimes were not installed. Physical-phone and broader Safari/Firefox/thermal release checks remain explicit work.

## Evidence and reproduction

- `before/` retains the supplied image and reproduced clipping captures.
- `after/` records the corrected full-height Sun, Earth, panel/cell, working business and final composition under the same viewport difference.
- `scripts/capture-viewport.mjs` takes `VIEWPORT_PHASE` and `VIEWPORT_ORIGIN`; `before` permits the historical defect while later phases assert full-height coverage.
- `tests/browser/viewport.spec.ts` contains the regression. The small-viewport override must be applied to the loaded document after navigation; applying it to about:blank is reset by navigation and does not reproduce mobile chrome.
- Type/build, Node and full browser logs, current delivery accounting and isolated settled-frame measurements are stored with this handoff after final verification.

The stage's intentional close-up may extend beyond the actual screen edge. The defect being removed is an internal canvas boundary above that edge, not the artistic choice to approach a monumental Sun.

## Sources and release boundary

Checked 9 September 2026: [W3C viewport-relative lengths](https://www.w3.org/TR/css-values-4/#viewport-relative-lengths) defines small, large and dynamic viewport units and browser-UI behaviour; [Chromium viewport emulation](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setSmallViewportHeightDifferenceOverride) provides the small/large difference used for the regression. The installed Playwright protocol declaration independently documents the same parameter. No new media or external assets are introduced.

This is a continuation of the user-authorized live frontend repair. Original forms, both consents, fees, APIs and provider settings remain unchanged. No real application, payment or message is part of testing. The [operational blockers](../backend-blockers.md) and local indexing protection remain separate from the visual fix.

## Final local result

**Type checking, build, 82/82 Node tests and the full 150/150 browser suite passed (4.8 minutes).** The 24 new viewport checks supplement the original 126. [Check record](checks.json) and [full browser log](browser-tests.log).

Matched phone captures show the old 125/160 px gaps reduced to **0 px**. [Before](before/phone-0.315.png), [after](after/phone-0.315.png), [paused after viewport expansion](after/paused-expanded.png), [Earth](after/tall-phone-0.925.png), [final campus](after/phone-6.030.png). The Sun now meets the actual viewport edge; Earth and the architectural chapters retain full coverage. The videos in `after/` record the zoom approach/reverse and sampled later scenes, not a physical phone recording.

[Isolated performance record](performance.json): 390×844, requested DPR 3 on the M4 MacBook, renderer capped at 1.25. All eight heavy scenes measured 16.7 ms median / 17.6–17.7 ms p95 rAF intervals, with no console errors or warnings. Resources remain at 79 geometries / 8 textures / 23 requests through three full reversals; offscreen rendering suspends. Observed opening readiness was 132 ms on loopback with a fresh browser context and warmed host; this is not mobile-network or cold-phone performance.

Compiled JavaScript is 255,039 B gzip (+266 B); homepage CSS is 8,172 B gzip (+73 B). Media/geographic JSON stays 1,844,085 B. There are no added scene assets, textures, geometry owners or render targets. The drawing buffer covers the enlarged visible viewport under the existing DPR/pixel caps; no transfer or resource ceiling was raised.
