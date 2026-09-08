# Original optional storage and grid illustration

Authored **8 September 2026** for the existing Aesir Solar campus with Codex assistance. Integrated source: [`storage.ts`](../../../src/experience/storage.ts) and [`storage-path.ts`](../../../src/experience/storage-path.ts), driven by [`business-journey.ts`](../../../src/experience/business-journey.ts) and owned by [`scene.ts`](../../../src/experience/scene.ts).

Cabinet design, procedural geometry, materials, route annotation and flow shaders are original, generic artwork. No external mesh, image, texture, font, product data, manufacturer mark, rating or certification is used. Inputs are pinned Three.js **0.185.1** and the existing campus/metre coordinates and `electrical-path.ts` AC entry. [DOE and NGED sources](science.md) inform the explanation, not the artwork or a verified installation design. No source diagram was copied.

## Physical and explanatory arrangement

The selected example is **optional AC-coupled storage**: the existing PV inverter/business route remains, and a separate AC branch reaches a distinct bidirectional converter; a supported DC pair connects that converter to the battery. Both storage and grid AC branches begin exactly at `ELECTRICAL_PORTS.buildingEntry` **(−40.14, 0.74, 13.7)**.

- Battery centre **(−40.565, 1.49, −5.7)**: a generic closed enclosure approximately 2 m wide, 2 m high and 0.68 m deep, with feet, drip edge, ventilation and a small qualitative indication.
- Separate converter centre **(−40.54, 1.305, −3.42)**: approximately 0.84 × 1.63 × 0.60 m, with separate AC/DC connections and a supported battery lead pair.
- Grid cabinet centre **(−40.51, 1.365, −15)**: approximately 1.5 × 1.75 × 0.54 m, closed and unbranded, without invented protection or metering internals.

Cabinets face west. Pads leave the existing pedestrian strip clear; the longer grid route follows the rear service gap, avoiding the other cabinets. `buriedGrid` is the subsurface reference path. `gridMarker` is a flush **surface annotation**, not a physical exposed cable; its heights follow the existing path/asphalt. No network ownership boundary is asserted. DOM anchors support the visible “Optional battery” and “Storage converter” labels.

## State and ownership

`render({charge, discharge, stored, importFlow, exportFlow, dusk}, time)` clamps inputs. Charge minus discharge sets storage flow direction; export minus import sets grid direction. Opposing equal inputs cancel; a full illustrated store suppresses charging and an empty store suppresses discharge. Curve effects share distance-based sampling. The five-segment indication is an authored qualitative amount, not live state of charge, capacity, efficiency or runtime.

The integrated timeline shows distinct charging, later discharge and **import only**; `exportFlow` remains zero. The asset's reversible API does not mean an export vignette was delivered. Blue bands represent electrical energy routing, not individual electrons, measured transport speed or a power-flow calculation. Accessible HTML states finite capacity/power, losses and that backup requires a specifically designed system. No automatic backup, self-sufficiency, export approval or economic benefit is claimed.

The asset creates no light, texture, renderer, render target, own frame loop, listener, load or provider request. Geometry/materials/instances are allocated once; state changes update supplied uniforms and preallocated values. Disposal releases owned resources once, clears/detaches the group and makes later calls inert. Parent scene ownership controls visibility, light/environment changes, ambient time and asynchronous readiness.

The integrated storage budget is **220,000 B geometry/instance buffers, 14,000 triangles, 20 base draw calls, zero new texture bytes/lights and 10,000 B gzip lazy code**. All routes and effects count, including hidden flow/annotation meshes. Shared renderer/shadow/driver costs are separate. Exact final desktop/mobile counts, source SHA-256 values and delivered chunk bytes: **77,588 / 51,552 B desktop/mobile**, **5,122 / 3,764 triangles**, **13 base calls**, **158 instances**, **0 texture bytes/lights**. The final lazy storage chunk is **5,288 B gzip**. [Source/build hashes](checksums.json) and [integrated measurements](README.md) identify the delivery.

Earlier isolated studio counts and captures are development evidence, not final build measurements. Current regression source checks shared ports, phase separation, finite stored amount, state/time reconstruction, actual resource accounting and exactly-once disposal. Final actual-mesh clearance, browser lifecycle and visual/performance results are recorded in the [stage-five handoff](README.md). The layout specifies neither a real string/cable/protection design nor a commissioned or verified eligible A1-2 installation.
