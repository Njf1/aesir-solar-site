# Slower mobile footer glide

9 September 2026, following the user's physical-phone review of the first fix. Baseline **09b22b8**, retained as `experience-mobile-footer-slow-before`.

The 460ms ease-out still felt abrupt because it moved **118.51px of the 125px distance in the first 300ms**. The prior tests proved continuity and containment, but did not establish the intended slower pace. The corrected treatment lasts **1800ms**, with `cubic-bezier(.42,0,.58,1)` for a gentle start and finish. It retains the existing anchor, reversal, visibility and disposal behaviour. No camera, copy, layout, application or provider change.

The strengthened browser assertions require less than15px of movement in the first300ms and more than1.3 seconds to approach the final position. Both failed on the old treatment; the final combined **69/69 browser checks** passed in Chromium and WebKit. Type checking, production build and **142/142 Node tests** also passed. Logs are alongside this file.

| 125px downward move | Previous live version | Slower Chromium | Slower WebKit |
| --- | ---: | ---: | ---: |
| Distance covered in first300ms | 118.51px | 7.02px | 6.87px |
| Time to within6px of destination | 317ms | 1533ms | 1529ms |
| Largest sampled frame step | 13.05px | 2.00px | 2.61px |
| Canvas gap / controls below viewport | 0px / 0px | 0px / 0px | 0px / 0px |

Reviewed recordings and sampled frames show the slower glide in the opening and Sun approach, with gradual viewport updates and rapid reversal also exercised. [Chromium motion](after/toolbar-and-scroll.webm), [WebKit motion](after-webkit/toolbar-and-scroll.webm), and their adjacent measurements retain all sequences. The intentional immediate containment when browser bars abruptly remove screen space remains unchanged; no claim is made to animate native browser chrome itself.

Tests ran on the same **Apple M4 MacBook Air,16GB**, Chromium151.0.7922.34 and desktop Playwright WebKit with mobile viewport emulation. No physical Android/iPhone retest was available here. Provider/API/submission requests were blocked. Pause, reduced motion, fallback, context loss, keyboard access, enlargement, orientation and full-screen coverage remain checked by the focused suite.

JavaScript: **255,664B gzip** (+9B from the previous fix); CSS **8,426B gzip**, media **1,844,085B**, unchanged. Same single bounded compositor effect; no added rendering loop, geometry, texture, listener or dependency. Original site checkout untouched.

Release verification will be recorded after the existing authorised GitHub/Vercel deployment.
