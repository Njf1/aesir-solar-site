# Stable mobile chapter copy

9 September 2026. Baseline **a71f762**, retained as `experience-mobile-copy-before`. The user supplied an 18.57-second, 1080×2340, 60fps phone screen recording showing the opening heading and eyebrow shift on scrolling. The original remains in Downloads; [source metadata](recording-source.json) records its hash without publishing the browser's other open tabs.

## Diagnosis and correction

Quarter-second review of the recording around 12–17 seconds shows browser bars returning/retracting and the text subsequently moving relative to the fixed site controls. Two authored effects explain that relative movement:

- Chapter `top` positions used percentages of the dynamic full-screen stage. At 390px width, expanding the content viewport from719px to844px moved the opening title **27.5px** downward while the scroll progress stayed unchanged.
- `updateCopy()` also translated text down by up to10px as its opacity fell. The measured early-scroll pass moved the title **9.26px**, and reversed that move on the way back.

All27 chapter-copy positions now use the existing stable small-viewport unit, with the same authored proportions and measured Skip-safe minimum. The full-screen canvas still follows `100dvh`; changing the text anchor does not bring back the old cropped-canvas defect. Copy fades in place without the added translation. The camera, timing, native scroll, 23 chapter meanings, 12 stills and accessible text remain intact.

The browser itself still moves the entire page when its own bars appear; the site does not suppress browser controls, zoom or native scrolling. The repaired movement is the extra displacement of the text within the page. [CSS viewport definitions](https://www.w3.org/TR/css-values-4/#viewport-relative-lengths), checked9 September2026, distinguish stable small units from changing dynamic units. Older engines without small-viewport units retain the existing vh fallback; no new universal physical-device claim is made.

## Measured result

| Reproduction | Before | After |
| --- | ---: | ---: |
| Title movement during browser-bar expansion/retraction | 27.5px | **0px** |
| Title movement during forward/reverse fade | 9.26px | **0px** |
| Uncovered pixels below the canvas | 0px | **0px** |

[Matched comparison](comparison.jpg), [before measurements](before/measurements.json), [after measurements](after/measurements.json), [before motion](before/toolbar-and-scroll.webm), [after motion](after/toolbar-and-scroll.webm). Visual review confirmed the title/eyebrow keep their separation from Skip and the composition remains full height.

## Verification

- Type checking and production build passed; **142/142 Node tests** passed.
- **57/57 focused browser checks** passed: viewport, startup and mobile-control suites, including Chromium and Playwright WebKit. Five new regressions cover toolbar movement from two small viewport heights, reversible opening/Sun fades, lazy still readiness and no-JavaScript copy stability. The three primary new checks failed on the original implementation before the fix.
- The first post-fix browser run was56/57: the new still test inspected copy before the requested chapter owner became ready. It now waits for that specific authoritative still progress, then checks the copy; the complete57-check run passed. No product readiness behaviour was weakened.
- Existing viewport matrix spans280×653 through2560×1080, including1280×720,1600×1000,390×844,740×900 and1000×500. Coverage includes toolbar reversal, Pause/clock freeze, orientation,200% text, pinch zoom, Skip/focus before readiness, fallback, offscreen suspension and the application handoff. This is the focused suite, not a new full cinematic-suite run.
- Actual test host: Apple M4 MacBook Air,16GB. Chromium mobile viewport controls are emulated using CDP's small-viewport-height override. WebKit tests run on the desktop host. The supplied recording is physical-phone evidence of the defect; a remote retest of that physical phone was not performed.
- No provider requests, real applications, payments or messages in these checks. Stripe, Supabase, SMTP, DNS and application contracts were not changed. The separate Fasthosts mailbox/hosting retirement remains pending the email-provider decision.

JavaScript is **255,063B gzip** (−19B); homepage CSS **8,412B gzip** (+30B); media/geographic JSON unchanged at **1,844,085B**. No new runtime dependency, scene resource, drawing buffer or continuous layout measurement was introduced. Existing delivery/pixel limits pass. Captures and review logs are excluded from the served build.

Reproduce: `COPY_PHASE=after node scripts/capture-mobile-copy.mjs`; optionally set `COPY_ORIGIN` to the verified public origin. Requests outside that origin and all API/submission requests are blocked. The scene and capture script measure actual rendered/DOM positions rather than asserting a preferred CSS string.

## Release

Implementation **05250a5** is pushed to GitHub main and the working branch, with `experience-mobile-copy-fixed` retained. Vercel production **dpl_87etKwqF5Wdxo8e22wMx55xXLCN3** (`aesir-solar-8hammtmom-aesir.vercel.app`) reports **Ready** and serves **https://aesirsolar.co.uk/**. The public page's hashed assets match the tested build. The CLI refreshed its expired session for inspection; no provider configuration changed.

[Real-domain measurements](production/measurements.json) independently confirm **0px** title movement during toolbar expansion/retraction and forward/reverse fades, **0px** uncovered canvas and no page errors. [Live frame](production/height-844.png) and [live motion](production/toolbar-and-scroll.webm) were captured with provider/API/submission requests blocked. Original `/Users/nick/Projects/Aesir Solar/site` remains untouched. Later evidence-only commits do not change the implementation.
