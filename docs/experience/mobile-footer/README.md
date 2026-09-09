# Smooth mobile bottom controls

9 September 2026. Baseline **7c8b1be**, retained as `experience-mobile-footer-before`. The supplied physical-phone recording **18877.mp4** shows the browser bars retracting, the whole page moving with them, then the bottom scroll cue and Pause control jumping down when the dynamic viewport catches up. Full-frame review around 1–4 seconds and quarter-second crops confirm the two distinct movements. [Source metadata](recording-source.json) records the original without publishing the user's other browser tabs.

## Correction

The bottom controls previously followed an absolute `bottom` inset inside the changing `100dvh` stage. A 719→844px viewport update therefore moved them **125px in one frame**. They now retain a top-relative pixel position and ease into the newly available space over **460ms**, using one bounded compositor transform. An interrupted move starts from its current displayed position. The CSS still supplies the same 38/28/18px desktop/portrait/short-screen insets.

The stable top anchor matters: an initial implementation compensating for the old bottom position in ResizeObserver still exposed a late resize in WebKit. The final implementation does not depend on the parent keeping its height until that callback. Window resize and ResizeObserver cover viewport updates and actual control reflow without a JavaScript animation loop.

The canvas fills the changing viewport immediately. The preceding stable-title/fade-in-place fix is preserved. Camera paths, scroll distance, rendering quality, chapter copy, application contracts and providers are untouched. No new scene resources or dependencies are allocated.

Rotation and enlarged controls reflow directly to fit. Pause, reduced motion, hidden/offscreen state and page suspension end any footer effect. Failure/context loss restores ordinary CSS positioning and disposes the owner. The no-JavaScript layout remains ordinary CSS. If returning browser bars remove a large area **in one step**, the controls must first move inside the available screen (8px minimum clearance), then ease to their normal inset; this deliberately avoids animating an inaccessible button from underneath native browser UI. Native browser movement itself is not suppressed or claimed to be controllable by the site.

## Evidence and verification

[Comparison](comparison.png), [before recording](before/toolbar-and-scroll.webm), [Chromium recording](after/toolbar-and-scroll.webm), [WebKit recording](after-webkit/toolbar-and-scroll.webm). Each includes abrupt retraction/return, gradual retraction, rapid reversal and the Sun approach. Grey below a smaller captured viewport belongs to the recorder's fixed frame, not the page.

| Measured retraction, 719→844px | Before | Chromium after | WebKit after |
| --- | ---: | ---: | ---: |
| Largest sampled step, opening | 125px | 14.01px | 14.89px |
| Distinct rounded control positions | 2 | 25 | 25 |
| Largest sampled step, Sun approach | 125px | 13.74px | 17.23px |
| Gap below canvas | 0px | 0px | 0px |
| Controls extending below viewport | 0px | 0px | 0px |

These are recorded frame samples, not guaranteed device frame rates. [Raw before](before/measurements.json), [Chromium after](after/measurements.json), [WebKit after](after-webkit/measurements.json) include **all** sequences, including the immediate containment on abrupt shrink. Visual review of the frame sequences confirms the downward glide and a clean final resting position. No page errors occurred in these captures.

- **Type checking and production build passed. 142/142 Node tests passed.**
- **69/69 focused browser checks passed in the final combined run.** Existing 57 viewport/startup/mobile-control checks plus 12 new Chromium/WebKit checks for the actual intermediate movement, rapid reversal/containment, Pause and reduced motion, rotation/enlargement, delayed loading/Skip/failure and context loss/disposal. Both primary glide regressions failed against the original build before implementation. Assertions inspect actual positions and running effects, not preferred CSS strings.
- Existing matrix covers 280×653 through 2560×1080, including 1280×720, 1600×1000, 390×844, 740×900 and 1000×500. It retains fullscreen drawing-buffer limits, stable title placement, 200% text, keyboard access, orientation, pinch zoom, no-JavaScript access and paused/offscreen rendering suspension. This is the focused regression set, not a new full cinematic-suite run.
- Test host: **Apple M4 MacBook Air, 16GB**, Chromium **151.0.7922.34** and Playwright WebKit on macOS. Mobile viewports are emulated. Chromium's recording also holds the small viewport stable with the CDP override. WebKit emulation does not reproduce an actual iPhone toolbar. The supplied Android recording is physical-device evidence of the defect; no new physical-phone certification is claimed.
- Provider, API and submission requests are blocked in these checks. No real application, payment, mail or provider configuration change.

Delivered JavaScript **255,655B gzip** (+592B); homepage CSS **8,426B gzip** (+14B); media/geographic JSON **1,844,085B**, unchanged. Existing delivery/pixel budgets pass. One cached footer owner, at most one running effect, two observed elements and one resize listener; no per-frame layout measurements in product code, continuous render work, new geometry, textures or render targets. Review captures/logs are excluded from the served build.

Reproduce: `FOOTER_PHASE=after node scripts/capture-mobile-footer.mjs`, optionally `FOOTER_ENGINE=webkit` and `FOOTER_ORIGIN=https://aesirsolar.co.uk`. The full final check log is [browser-tests.log](browser-tests.log); build/type/Node logs sit alongside it.

## Release

Implementation is prepared for the existing GitHub/Vercel production route under the user's standing approval. Live verification and the final recoverable commit will be recorded here after deployment. Stripe, Supabase, mail, DNS and the separate Fasthosts retirement decision are unchanged.
