# Aesir Solar — stage-one local implementation

The isolated preview implements the near-black opening, procedural Sun approach/hold and beginning of a white-gold pulse’s departure, followed by a complete HTML G99 application-service bridge. Earth, building and electrical chapters are designed in the storyboard but are not built. This milestone changes the visual experience; it does not repair intake or payments.

## Open and review

- **Running built preview:** [http://127.0.0.1:4173/experience](http://127.0.0.1:4173/experience)
- [Desktop and portrait capture gallery](captures/index.html), including opening, Sun, departure, bridge and no-JavaScript fallback.
- [Later storyboard and future asset manifest](storyboard.md).
- [Exact source-verified backend blockers, concrete examples and next bounded repair](backend-blockers.md).
- [Measured asset sizes](asset-sizes.json), [performance summary](performance-summary.json), [raw capture observations](capture-observations.json), [layout observations](layout-observations.json).

Working copy: `/Users/nick/Projects/Aesir Solar/experience-stage1`, branch `experience/stage-one`, based on `c61643f`. The original `/Users/nick/Projects/Aesir Solar/site` remains clean and unchanged. No ZIP was modified. No production credential, provider dashboard or external configuration was read or changed. No deployment, real payment, cart, application, message or order was submitted.

## Run locally

Use **Node 24.x**, tested with **24.15.0** (pinned in `.nvmrc`), npm 11.12.1. From this separate working copy:

```sh
npm ci
npm run typecheck
npm run build
npm test
npm run preview
```

The built preview listens on loopback port 4173. `EXPERIENCE_PORT` overrides it. `npm run dev -- --port 5173` provides Vite development with the same isolated `/experience` route. The local servers intentionally return JSON `503 local_preview_only` for `/api/*`; they do not call any provider. Production function sources are retained in the staged arrangement, not executed by these servers.

Browser checks: with the built preview running, use `npm run test:browser`. The runner uses Playwright’s installed matching Chromium when available, then an existing local macOS Chromium. `EXPERIENCE_BROWSER` can explicitly select a binary. On a new workstation, install the matching browser using `npx playwright install chromium`. The recorded run used the already-installed **Chrome for Testing 151.0.7922.34**, not Playwright 1.63’s default newer revision.

`node scripts/capture.mjs` captures and measures each chapter. Add `--write-posters` only to regenerate the renderer-derived fallback stills, then rebuild. `node scripts/inspect-layout.mjs` checks bridge/fallback layout. Browser automation blocks external requests; payment unit checks fully mock fetch and use dummy values and `.invalid` destinations.

## Build and deployment arrangement — proposal only

Vite reads only `experience.html` as its entry and writes to `.preview-build/`. Its `emptyOutDir` applies only to that generated directory. The assembly script copies the existing static pages, data, scripts, five functions and `lib/` to a separate `.release/` and overlays the compiled experience with hashed `experience-assets/`. It replaces only the generated asset directory on subsequent builds; it never cleans the source website. Source `vercel.json` is unchanged.

For a future Vercel release, the prepared `.release/` is the proposed deployment root: static HTML stays at the root, functions stay under `api/`, helper imports under `lib/`, and `cleanUrls: true` remains. The staged Vercel proposal explicitly disables another build and uses `outputDirectory: "."`. No SPA fallback or rewrite is installed. It has not been submitted to Vercel or certified with production provider callbacks. Existing broad API cache policy is retained as an audited release blocker, not endorsed.

| Preserved URL / contract | Verification |
| --- | --- |
| `/`, `/index.html`; `/apply`, `/simulator`, `/faq`, `/contact`, `/terms`, `/privacy`, `/refunds`, `/success` plus every `.html` form | HTTP checks against local route arrangement; each original HTML output is byte-identical. |
| Homepage `#top`, `#gate`, `#check`, `#realroof`, `#work`, `#price`, `#apply`, `#main` | All IDs verified in unchanged homepage. |
| `/api/tyl-checkout`, `/api/tyl-return`, `/api/tyl-notify`, `/api/checkout`, `/api/tigo` | Exact files retained; local HTTP checks assert JSON stubs, not SPA HTML; payment contracts tested offline. |
| Application field meanings, both consents, server pricing and environment-variable names | Existing form, app.js, API and helper bytes unchanged from `c61643f`. |
| No experience code on application/contact/legal pages | Verified original page bytes and absence of experience-assets imports. |

No `/start-application` route is invented. Existing generator ownership and all business handlers remain intact. Do not use this proposal for a public homepage cutover until the backend release gates below are proved.

## Implementation boundaries

- `experience.html`: complete semantic service explanation, net/VAT/gross price, three conversion paths, permanent application link and skip destination, without JavaScript.
- `src/experience/progress.ts`: one pure, clamped chapter-progress input; explicit camera/target values, logarithmic approach and cubic pulse path. Forward and reverse samples are identical. Native scrolling controls GSAP ScrollTrigger; no competing camera timeline or scroll hijacking.
- `scene.ts` / `shaders.ts`: one Three.js renderer and camera; original photosphere shader with multiscale warped value noise, granulation, active regions and luminous limb; additive corona and nine fixed prominence loops; bounded 240-point star field; a bright guide with a tapered trail. No video, downloaded texture/model or image-based imitation of the Sun. It is an artistic scientific illustration, not a physical solar simulation.
- `quality.ts`: mobile/desktop shader octaves and mesh segments, maximum DPR 1.25/1.5, total drawing-buffer caps 0.85/2.0 million pixels. Tier changes on resize rebuild only the photosphere and update shader defines; old geometry is disposed. Antialiasing is enabled; no full-frame bloom/postprocessing targets are allocated.
- `main.ts`: DOM overlays, readiness, progress, pause and lifecycle. Canvas mounts only after compile and first render. The 12-second loading failsafe, failed imports, shader failure and context loss retain the composed still and short document. Skip before readiness remains at the bridge after the canvas finishes. Reduced motion is a static solar composition without a long scroll chapter; ambient time freezes when paused, hidden, offscreen or reduced motion is active. Page exit disposes geometry/materials/render lists/renderer and removes owned listeners/observers. Browser Back remains native.
- `experience-poster*.webp`: original desktop/portrait stills captured directly from the scene canvas. These are fallback assets, not the live visual. No third-party media is included; no asset licence is outstanding for the implemented chapter. The inherited favicon is reused. New typography uses the local system sans serif; no new font download.

## Compatibility and provenance

Exact direct versions in package/lockfile: Three.js **0.185.1**, GSAP **3.15.0**, Vite **8.2.2**, TypeScript **7.0.2**, `@types/three` **0.185.4**, `@types/node` **24.10.1**, Playwright **1.63.0**. npm registry versions were read before pinning, and installation, TypeScript and production build succeeded. Dependency audit reported zero vulnerabilities at installation; that is not an ongoing security certification.

The stack follows the official [Three.js npm/Vite installation guide](https://threejs.org/manual/en/installation.html), [GSAP installation](https://gsap.com/docs/v3/Installation/) and [standalone ScrollTrigger progress API](https://gsap.com/docs/v3/Plugins/ScrollTrigger/). [Vite’s Node requirements](https://vite.dev/guide/) accept Node 24, and its multiple-page build keeps this separate from the existing HTML. [TypeScript installation guidance](https://www.typescriptlang.org/download/) supports project-local pinning. These were checked on 8 September 2026. Third-party package licences remain supplied in their npm packages; scene shaders and authored visual assets were written for this implementation.

## Observed verification and limits

`npm run typecheck`, the Vite/assembly build and **5 focused Node tests** passed. Tests cover camera continuity/reversal, quality caps, original-file preservation, output routes/anchors/functions and server-priced payment contracts with dummy credentials/mocked fetch.

**10 Chromium browser tests passed:** immediate CTA during delayed loading; skip preservation at delayed readiness; forward/reverse journey; pause; resize; keyboard focus; native application navigation and Back; no JavaScript; reduced motion; unavailable WebGL; context loss followed by motion-preference changes; failed bundle; offscreen pause; all page and API arrangements. Hidden-page handling was tested by simulating `document.hidden` plus the visibility event; it was not an OS-level background-tab power measurement. The additional 800×500 CSS-pixel check represents a 1600×1000 display at 200% page zoom; it is a layout equivalent, not an observed browser zoom gesture. It had no horizontal overflow.

Desktop and mobile compositions, bridge and fallbacks were visually inspected and refined. Final captures reported no console/page errors. Mobile frames use a 390×844 CSS viewport with emulated device scale 3, capped render DPR 1.25; captures are 1170×2532. Desktop viewport/capture is 1600×1000 with DPR 1. Fallback canvas stills are 1600×1000 and 487×1055 respectively.

Performance hardware: **MacBook Air, Apple M4, 10-core CPU/10-core GPU, 16 GB RAM**. Headless Chrome for Testing **151.0.7922.34**, ANGLE Metal renderer on Apple M4. Four-second samples at opening, Sun hold and departure measured approximately **60 fps**, with median **16.7 ms** and p95 **17.3–17.4 ms** frame intervals, at both viewport sizes on this Mac. See the exact sample counts in performance-summary.json. These are rAF frame intervals, not GPU timer-query measurements or a prolonged thermal test. The desktop target is observed at the tested viewport; the **real-mobile ≥30 fps target remains unmeasured**. No physical phone, Safari/iOS, Firefox, constrained-network Core Web Vitals, prolonged thermal behaviour or live provider certification was tested.

New JS is approximately **182 KB gzip**, below 750 KB. The live procedural scene needs **zero external 3D media**; both compressed fallback stills together are approximately **200 KB**, below 2 MB. The responsive picture selects one still at a time. Exact final bytes/hashes are in asset-sizes.json; no new font payload. Gzip sizes use Node gzipSync on the built files; the local server serves uncompressed files, and deployed HTTP compression has not been verified. Vite emits a raw-chunk size advisory for the dynamically loaded Three.js scene; its compressed total remains within budget and is measured, not hidden by changing the warning threshold.

## Public rollout gates

The complete exact register is [backend-blockers.md](backend-blockers.md). The next bounded repair must prove: **complete validated application saved before payment → stable application/order identity → verified expected amount/currency/final status → idempotent notification processing → one actionable fulfilment record**. The current visual milestone does not achieve that chain.

Specific unresolved issues include browser-only intake without restore, incomplete Tyl field handoff, email-only server validation, no Stripe webhook fulfilment, log-only Tyl notifications that acknowledge invalid signatures, unbound signed returns, unconditional static success/receipt claims, unsuitable-system checkout routing, ignored Stripe cancellation, non-idempotent retries, WooCommerce fallback without intake identity, unsafe no-JavaScript form submission, callback-origin and payment-cache boundaries, stale telemetry labelled current, and unconfirmed company/policy details. Actual provider behaviour, external WooCommerce settings and operational handling remain unverified. Keep homepage replacement blocked until these application/payment/fulfilment requirements and necessary content/suitability checks are proven.

## Changed-file summary

Only existing `package.json` and `.gitignore` changed in the isolated copy. Added: `experience.html`, the two fallback stills, six files in `src/experience/`, Vite/TypeScript/Playwright config, `.nvmrc`, package lock, build/preview/capture/browser helper scripts, focused unit/browser tests, and this navigable documentation/capture set. Every original business page, script, generator, data file, API/helper, source Vercel config and SEO file remains byte-identical to the baseline. No public homepage replacement occurred.
