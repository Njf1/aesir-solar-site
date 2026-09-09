# Homepage startup flash

User-reported defect: a very large Sun appears briefly on a fresh homepage visit, then shrinks to the distant opening. Work starts from clean `f84af02` on `experience/launch-refinement`; recovery tag `experience-startup-before`. The original `site` checkout is unchanged.

## Cause and change

The close-up came from the full-screen `experience-poster*.webp` fallback, visible by default while the scene chunk and shaders loaded. It was a later shot presented before the opening, not an incorrect 3D camera pose. Holding the scene import reproduced it reliably at 1280×720 and 390×844. The loading captures show a visible poster while canvas opacity is zero; the ready captures show the correct camera at approximately z1200.

The default loading state now keeps the restrained dark opening, HTML title, Skip and application action. The existing fade reveals the canvas only after its correctly positioned frame is rendered. Explicit renderer/import/timeout/context-loss failure reveals the composed fallback. A more-specific `noscript` style preserves that image with JavaScript disabled, including after Vite moves stylesheet links in the built document. The initial focused run caught that built-style ordering issue; it was corrected before the final suite.

No camera, chapter timing, shader, asset, form, API or provider logic changes. No new image, renderer, animation frame loop or loading delay. All 23 chapter meanings and 12 still views remain.

## Evidence and verification

- [Before loading, desktop](before/laptop-loading.png) / [phone-sized](before/mobile-loading.png); [before motion](before/laptop-load-approach.webm).
- `after/` records the repaired loading, first ready frame, scroll approach and reverse on the same two viewports. The scene import is deliberately held so the otherwise brief initial state is reviewable; these recordings are not internet-load benchmarks.
- Eight focused browser checks cover first painted frames at 1280×720, 1600×1000, 390×844, 740×900 and 1000×500; failed scene import; no JavaScript; reload and returning from the application. They assert that the later-shot poster is never visible during a successful startup and that every visible initial canvas frame uses progress zero and the distant camera. Scrolling then advances the normal approach.
- Final checks passed: type checking, production build, **82/82 Node tests and 126/126 browser checks (full suite, 4.5 minutes)**. Logs are stored here. Existing checks cover reduced motion, context loss, late loads/Skip, pause/reversal, chapter resources and unchanged application contracts.

Host: Apple M4 MacBook Air, 16 GB. Browser: Chrome for Testing 151.0.7922.34, ANGLE Metal. Phone sizes are viewport emulation, not physical-phone validation. This focused fix does not add physical-device, broad Safari/Firefox or thermal certification.

Delivery: 254,773 B JavaScript gzip (previous 254,774), 8,099 B homepage CSS gzip (+12), 1,844,085 B media/geographic JSON (unchanged). Scene geometry, decoded textures, render targets and frame work are unchanged. The existing delivery ceilings and rendering caps remain.

## Release boundary

The user authorizes GitHub push and redeployment to the existing https://aesir-solar.vercel.app/ production alias. Search indexing remains disabled. No real application/payment, provider configuration change or message is part of testing. Existing durable intake/payment/fulfilment and telemetry limitations remain separate, as recorded in the [current handoff](../launch-refinement/README.md) and [backend blockers](../backend-blockers.md).

## Live result

Implementation `54ac2a0` is pushed to GitHub main and the working branch, with `experience-startup-fix-delivered` retained. Vercel production deployment `dpl_39Qnb2CVMsDiRhEhx1wpTbbP8SFA` is READY at **https://aesir-solar.vercel.app/**. [Deployment record](deployment.json).

[Live startup recordings and observations](production/observations.json) confirm the placeholder remains hidden before readiness at 1280×720 and 390×844, then the correct distant opening renders. Ordinary reload and browser Back both return to progress zero. Reload readiness in those warmed desktop-browser contexts was 369 / 325 ms; this is not cold-network or physical-phone performance. [Public route and scene verification](production-routes/verification.json) passes the 14 intended routes, expected missing-route/helper 404s, safe checkout GET rejection, key scenes, Skip and the original 19-control/two-consent form. No browser errors or warnings were observed. No form was submitted.
