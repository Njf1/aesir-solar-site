# Original inverter and representative containment asset — 8 September 2026

Final source: [electrical.ts](../../../src/experience/electrical.ts), [shared paths](../../../src/experience/electrical-path.ts), and [energy-flow overlay](../../../src/experience/energy-flow.ts). Original project artwork, authored 8 September 2026 with Codex assistance.

This is original procedural geometry/material/shader work. It uses no downloaded model, texture, manufacturer design, logo, rating label, external font or HDRI. The existing pinned Three.js 0.185.1 dependency is the only library. It adds to the current campus; it includes no copy of the site, building, ground or solar array.

## Interface and integration

The module imports `HERO_ANCHOR`, `HERO_NORMAL` and `ROOF_Y` from the existing `./site-layout` module. All positions remain in the same local metres, +Y up, west = −X.

Exports:

- `ELECTRICAL_ANCHORS`: hero glass, both exact existing hero-lead exits, perimeter/saddle/descent points, enclosure centre/front, explanatory-overlay anchors and port anchors.
- `ELECTRICAL_PORTS`: separate DC positive/return bottom glands, distinct AC bottom output gland, and sealed building-entry plate.
- `ELECTRICAL_ROUTE_NODES`: authored route controls.
- `ELECTRICAL_PATHS`: `dcPositive`, `dcNegative`, `acOutput` rounded CurvePaths. Sample every cue/reference using `getPointAt()` and `getTangentAt()` on these shared paths.
- `createElectricalScene(tier)`: returns `group`, `overlay`, `paths`, `ports`, `anchors`, `bounds`, `stats`, `setProgress(progress)` and idempotent `dispose()`.

Call `setProgress(p)` with local explanatory progress 0–1. It reveals both fixed voltage-versus-time references deterministically, with a steady positive DC line and an alternating AC sine. There is no elapsed-time clock, particle motion, invented frequency/phase/rating, or electrical simulation. Reversing progress reconstructs the same overlay. The 2D shader floats beside the cabinet and is separate from its generic status/control recess.

Essential explanations belong in accessible HTML. Suggested anchor labels: “DC input — steady reference”; “AC output — alternating”; “Voltage variation over time”. The DC trace is an idealised steady reference, not a claim that rooftop output stays constant. Identify this as a representative route from the larger array, not one module powering the building. The waveform describes electrical variation; it is not the shape of the output cable.

## Physical layout

The generic closed cabinet is approximately 1.04m wide × 1.50m high × .35m deep on the west warehouse wall near z18. Its mounting rails and standoffs touch the cladding; its back plate, gasket seam, rounded front, upper drip lip, rear fins and bottom compression glands provide identifiable scale. No internal circuit boards or claimed protection/connection ratings are invented.

DC pair: exact existing lead exits beneath the hero → existing covered x−10 tray → perimeter z23.3 → raised parapet saddle → outside west wall x approximately −40.47 → supported lateral run above the enclosure → separated side descent → two bottom input glands. The thicker AC output follows a distinct low wall route to a sealed building-entry plate at `[-40.14,.74,13.7]`. That plate leaves the later building-service design open.

The last panel row ends near z21.939. The new perimeter tray stays near z23.3, beyond the walking strip and inside the south parapet. The saddle reaches y11.63, clearing the existing cap top y11.4175. It does not pass through the parapet. Vertical and lateral runs have visible standoffs, rungs and retaining clips.

**Known layout interface:** the existing x−10 tray ends within the roof walkway zone (z22.265–22.835). This asset uses a visibly covered, supported crossover at that point; it does not claim that the crossover is an approved walking-surface or installation detail. If the shot requires an unobstructed service walkway, the owner must reroute that short crossing or revise the local walkway geometry. The western descent and enclosure do not intersect the office volume, which starts south of z23.

## Budgets and validation

| Tier | Base calls | Triangles | Geometry + instance buffers | Texture bytes |
|---|---:|---:|---:|---:|
| Mobile | 12 | 5,282 | 103,060B | 0 |
| Desktop | 12 | 7,866 | 176,164B | 0 |

237 repeated parts are instanced by geometry/material. Cable subdivisions are concentrated at bends, allowing smooth gland approaches without expensive uniform subdivision along 60 metres of straight route. The cabinet body casts a shadow; the thin front cover avoids duplicate shadow work and broad-shadow-map self-acne.

Strict TypeScript check passed against the pinned project types. Both tiers instantiate under budget. Both DC paths terminate exactly at their corresponding ports; the AC path terminates exactly at building entry. Progress sequence `0,.5,1,.5,0` and double disposal were exercised. Disposal releases owned geometries, materials and instance buffers, detaches the group, and creates no global listener or animation lifecycle.

Actual browser captures with the reused campus and simple owner-style directional/hemisphere lighting:

- `/private/tmp/aesir-electrical-review/inverter.png`
- `/private/tmp/aesir-electrical-review/route.png`
- `/private/tmp/aesir-electrical-review/saddle.png`

The isolated complete-campus review measured 74 calls /141,064 triangles at the inverter, including its one directional shadow pass. These are scene counts, not frame-time or real-device performance claims. The preview's projected HTML labels are inspection aids; integrate equivalent accessible labels into the real experience. The original checkout was not edited by this asset task.

## Final integration

The finished owner uses cool white for the DC reference and blue for AC, keeping both distinct from the absorbed gold incident guide. Both metre-scale flow overlays obey depth testing: cabling hidden by the building cannot appear as an unsupported line through the wall. The existing site, its environment and its cached shadow target are reused. Final integrated captures and budgets are in [README.md](README.md); temporary development captures above are not build assets.
