# Stage seven incremental budget

Set before detail integration against dbb8197: 242,212 B JavaScript gzip; 1,844,085 B media/geographic JSON; 7,550 B experience CSS gzip. Existing ceilings remain 750,000 B JS / 2,000,000 B media. Mobile DPR≤1.25 /850,000 pixels; desktop≤1.5 /2,000,000. No global resolution increase.

Proposed original hardware/interior refinement: ≤40,000 incremental geometry/instance-buffer bytes, ≤10 added base draws, ≤7,000 added triangles, zero external images, textures, lights or render targets. The initial integrated hardware candidate uses 28,980 buffer bytes, 8 draws and 5,712 desktop /5,456 mobile triangles. Existing per-owner caps remain enforced by prepare-time assertions and actual resource traversal tests. Connected glass replaces existing geometry; atmospheric/terrain filtering adds uniforms/shader logic at the existing texture resolution. A small contact-depth pass may replace existing floor artwork within the same overall ceilings; final totals are recorded separately after integration.

Transfer is compressed delivery, not GPU storage. Baseline retained Earth+site textures/targets are about 102.33 MiB desktop / 25.58 MiB mobile before geometry/shadows/driver overhead. New hardware has no texture target allocation. Countryside remains one 1024²/512² map; PMREM remains 256/128; shadow maps 2048/1024. Raw buffer accounting includes instance matrices and colors. Process memory is not inferred from those estimates.

No speculative quality subsystem. Viewport/core heuristics still select quality, resizing updates renderer/Sun detail while cached Earth/site owners retain their initial texture tier. Orientation tests therefore report actual retained resources rather than claiming every owner was rebuilt. Cold readiness and settled frame intervals are measured separately; phone-sized Chromium views are emulation, not physical-phone validation.

## Final original detail increment

Final exact traversal: **34,734 bytes, 10 base draws, 5,925 desktop / 5,669 mobile triangles**, within the predeclared 40,000 / 10 / 7,000 envelope. Zero new textures, render targets, lights or downloaded media. This includes the hardware, moving-carton/contact refinements, seven finite dusk pavement receiver pools and seven source lenses, and the 222-byte / five-triangle soft DC source closure. The source closure is attached to the existing TubeGeometry and adds no draw or owner. The pools are clipped to the actual service-apron receiver boundary. Existing base-owner ceilings remain unchanged.

[Final resource traversal](final-resources.json) accounts for the geometry and instance buffers of each tier and [final scene review](final-scene-review.md) records exact disposal. The earlier 1,620,405-pair dense clearance predates the final transparent source closure and pavement detail; [final clearance](final-clearance.json) reruns 81,405 actual geometry/frustum pairs with matching final source hashes. Neither is a claim to measure process memory or every possible hardware/scroll state.

## Final served-file accounting

The completed build delivers 254,502 B of experience JavaScript gzip (+12,290 B over stage six), 7,800 B of experience CSS gzip (+250 B), and 1,844,085 B of media/geographic JSON across variants (unchanged). Including the supporting companion and unchanged application controller, all served browser JavaScript totals 262,670 B gzip. These remain below the original ceilings. Supporting pages do not import the experience bundle.

The final terminal-steadiness adjustment changes only the existing source-cap signal, from the moving-mark modulation to 0.90, below its previous 0.95 peak. Its geometry, draw count, opacity/dusk control, soft coverage and texture footprint are unchanged. Review screenshots and videos are documentation artifacts outside the served candidate allowlist, not first-load assets.
