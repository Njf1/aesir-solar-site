# Join the light, arrive at Earth

The local preview now completes the continuous source → Sun → acquired light → flight → Earth → application-service sequence. Great Britain, the commercial roof, panel interior and electrical system are still future chapters. This is a cinematic scientific illustration with compressed distances and time, not a wavelength-faithful solar observation or a physically scaled visible photon.

[Open the local experience](http://127.0.0.1:4173/experience) · [Capture gallery](captures/index.html) · [Forward/reverse recording](motion/journey-forward-reverse.webm)

## Changes visitors see

- The first scroll closes visible distance immediately. The approach reaches the monumental Sun within the first 30% of the useful scroll, with a text-free close-up before departure. Broad active regions, fine granulation, directional detail, small luminous patches, a rooted asymmetric prominence and restrained corona have separate ambient motion. Pausing scroll leaves the surface alive; the motion control freezes it.
- The camera first acquires the guide near the limb, translates around the Sun, turns into its direction and settles behind it. The Sun passes out of frame. A shared arc-length lookup drives the guide, tapered trail and camera references; the former 2.22-unit head/rod mismatch is removed. The guide remains inside the tested safe frame throughout acquisition and flight, including 390px portrait.
- Earth enters gradually during flight. Locally served NASA surface and cloud composites resolve into a blue daylight globe with a thin atmospheric edge and Europe positioned for the next chapter. Lighting is derived from the scene's Sun-to-Earth direction. The origin changes by the same translation for every retained object and the camera, so reverse scrolling reconstructs the same view. A Hermite arrival preserves incoming camera/aim velocity and decelerates to a still orbital composition.
- Reversible HTML fade windows replace abrupt text swaps. Landscape, portrait and short-height camera framing use the same decision as CSS. The competing Sun caption is removed; the Earth illustration note has a quiet dark backing. Enlarged text reflows into a wider reading area while keeping the requested font size.
- Earth gives way to the existing HTML G99 service: preparation, submission and follow-up across Great Britain, £250 fee + £50 VAT = £300 total per application. Header application access, skip/focus, eligibility, contact, installer/property-owner distinction, legal links, original forms and consent fields are preserved.

## Reliability and verification

TypeScript checking, production build and **11 Node tests** pass. **17 browser regressions** pass, including the prior route/form/payment-mock checks and new coverage for reversible chapter transitions, guide/trail attachment, lazy Earth loading, delayed completion without another scroll, Earth fetch failure, decode timeout, late-bitmap disposal, reduced-motion Sun/Earth still views, and enlarged text. The browser checks submit no form and make no provider request.

Rendered reviews cover **1600×1000, 1280×720, 390×844 (DPR 3 emulation), 740×900 and 1000×500**. Captures include opening, approach, close-up, acquisition, early/mid-flight, Earth arrival/hold and service handoff. Additional captures bracket copy fades, acquisition, Earth emergence, the 73.5% origin change and 75% arrival join in both directions. The recording drives native scroll continuously forward, backward and forward again. Keyboard Tab/Enter reaches the persistent CTA and skip destination; browser Back restores the service section.

A 640×360 CSS viewport at DPR 2 checks the layout corresponding to a 1280×720 display at 200% browser zoom. A separate 200% text-size override at 1280×720 verifies statements and supporting text remain above the motion controls with no horizontal overflow. It is an explicit text enlargement test, not a claim that all browser/OS accessibility configurations were exercised.

One renderer is retained. Hidden/offscreen scenes suspend animation; page disposal releases textures, decoded bitmaps, meshes, materials and renderer resources. Reduced motion uses still-view buttons without long scrolling. No JavaScript, unavailable WebGL/imports and context loss retain the composed Sun fallback and HTML service. Only the next chapter is prefetched, after 16% progress; it uploads/compiles while the Sun is still in view. Loading is bounded to eight seconds across fetch, decode and GPU preparation. A late load holds a truthful flight composition; failure collapses the long journey and brings visitors already travelling to the service section.

## Delivery and measured performance

[Exact build sizes](../asset-sizes.json), [browser timing/network observations](verification.json), [capture states](capture-observations.json), and [zoom observations](zoom-observations.json) are retained.

- New JavaScript: **186,624 bytes gzip**, below the existing 750,000-byte ceiling.
- All delivered media variants, including both fallback posters: **1,340,840 bytes**, below the 2,000,000-byte ceiling.
- Earth adds **903,188 bytes desktop** or **239,546 bytes mobile**. Initial opening requests include neither Earth texture pair. Each session fetches only its selected pair; resizing reuses it rather than downloading a second pair.
- Selected Earth decoded pixels are **40 MiB desktop / 10 MiB mobile**. Estimated RGBA8 textures with mipmaps are **53.33 / 13.33 MiB**. These estimates exclude driver overhead, geometry, render buffers, browser caching and retained copies. WebP compresses transfer; it is not GPU block compression. The early storyboard's individual cloud estimate was exceeded, while the measured whole-milestone budget passes.
- The existing quality policy remains: capped DPR 1.25/1.5, maximum 0.85/2.0 million drawing-buffer pixels, adaptive photosphere segments and shader detail, no full-frame bloom or postprocessing targets. The fixed distant star field has no nearby rushing particles.

Final browser frame intervals (median / 95th percentile, milliseconds):

| CSS viewport | Sun | Earth |
| --- | --- | --- |
| 1600 × 1000 | 16.7 / 17.6 | 16.7 / 17.6 |
| 1280 × 720 | 16.7 / 17.6 | 16.7 / 17.6 |
| 390 × 844 | 16.7 / 17.6 | 16.7 / 17.6 |
| 740 × 900 | 16.7 / 17.6 | 16.7 / 17.3 |
| 1000 × 500 | 16.7 / 17.3 | 16.7 / 17.5 |

The compact [performance summary](performance-summary.json) is generated from the final local browser run. Four seconds are sampled per heavy view after settling; frame intervals are browser animation cadence, not isolated GPU timings or a thermal endurance test. Measurements used **Chrome for Testing 151.0.7922.34 on an Apple M4 MacBook Air (16 GB), ANGLE Metal**. No physical phone, Safari, Firefox, low-memory device, mobile network or sustained thermal run was measured. Phone-sized emulation does not establish real-phone performance.

## Sources and artistic limits

[Exact Earth source files, image-specific usage notes, credits, download date, transforms, dimensions, hashes and memory estimates](earth-assets.md) are recorded with a [machine-readable manifest](earth-assets.json). Surface: NASA Blue Marble Next Generation July 2004 base map, Reto Stöckli / NASA Earth Observatory. Clouds: NASA's historical Blue Marble cloud composite, Reto Stöckli / NASA GSFC, enhancements by Robert Simmon. The cloud image's legacy record now redirects; the verification limitation and official image URL are explicitly retained. Visible credit appears below the service footer. Source masters remain outside the served build.

The [solar reference study](solar-references.md) records NSO/DKIST, NASA/SDO and ESA/Solar Orbiter images, their creators, instrument/wavelength differences and terms. No reference pixels are redistributed in the Sun material. The prominence is a procedural artistic structure; it is not a magnetohydrodynamic simulation. Earth combines historical composites with authored lighting and ocean tint; it is not current weather or one dated satellite exposure. The current maps support an orbital view; a later Great Britain sequence needs a regional asset handoff rather than unlimited texture zoom.

## Checkpoint and scope

All work is in `/Users/nick/Projects/Aesir Solar/experience-stage1` on `experience/stage-two`. Before edits, checkout and the running port-4173 server were confirmed. The reviewed draft is retained at **`experience-stage-one-reviewed` / `9845462`**; stage-one notes/captures remain available. The original `/Users/nick/Projects/Aesir Solar/site` is untouched.

Original business pages, scripts, functions, routes and form/consent fields remain byte-identical to baseline `c61643f`; no providers, secrets, API contracts or production settings were changed. The local preview intentionally stubs `/api/*`. No publication or public homepage replacement occurred. The [audited application-storage, payment and fulfilment gaps](../backend-blockers.md) remain unresolved: this milestone improves the visual journey and application handoff, not the downstream processing system.

Reproduce captures with `node scripts/capture-stage-two.mjs`; continuous motion and text/zoom review with `node scripts/inspect-stage-two.mjs`; timing/network sampling with `node scripts/verify-stage-two.mjs`. Run those separately so simultaneous browser sessions do not contaminate frame measurements. Rebuild local Earth delivery assets with `python3 docs/experience/stage-two/optimize-earth-assets.py SOURCE_DIRECTORY OUTPUT_DIRECTORY` after obtaining the exact manifest sources; never put source masters in served assets.
