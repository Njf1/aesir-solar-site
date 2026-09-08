# Stage seven final independent scene review

Read-only review of the final experience source, 8 September 2026. Scope: material/shader changes, selected-cell aperture and optical/electrical handoff, electrical/storage routes, working-bay motion, pavement receivers, lazy-owner disposal, adaptive sphere replacement and numerical clearance. No checkout edits or provider requests. No browser or performance work was performed for the last two art updates.

**No unresolved substantive runtime, ownership or scientific-continuity defect found.** The previously reported apron-pool feather issue is fixed: the shader clips both elevated pools to the actual service-apron bounds. The electrical triangle budget now correctly includes the five source-cap triangles.

## Final resource numbers

Actual traversal counts unique geometry attributes/indices plus each instance matrix/color buffer. Triangles include all instances, including hidden or collapsed geometry; base draws are generated mesh counts, not frame-specific GPU calls. Raw buffers are not transfer bytes or process memory.

| Complete owner | Desktop bytes / triangles / base draws | Mobile bytes / triangles / base draws | Cap bytes / triangles / base draws |
|---|---:|---:|---:|
| Site campus + ground/two road planes | 552,128 / 100,394 / 44 | 534,728 / 91,338 / 44 | 1,200,000 / 140,000 / 52 |
| Cell + module collection overlay | 72,852 / 4,250 / 18 | 61,908 / 3,802 / 18 | 250,000 / 15,000 / 25 |
| Electrical + capped DC/AC overlays | 244,830 / 11,099 / 17 | 171,726 / 8,515 / 17 | 350,000 / 20,000 / 25 |
| Business interior + supported tray/flow | 82,584 / 10,696 / 24 | 75,576 / 9,528 / 24 | 420,000 / 22,000 / 27 |
| Optional storage including its paths | 88,972 / 7,762 / 16 | 62,936 / 6,404 / 16 | 220,000 / 14,000 / 20 |

The site row adds280 bytes/6 triangles/3 draws for its three explicit ground/road planes to direct campus traversal. SiteScene's existing snapshot reports campus-only triangles/draws but full-group geometryBytes; use the table's full-owner figures. Cell-owned geometry is48,468 desktop /37,524 mobile; its module overlay adds24,384 bytes/960 triangles/one draw. Final electrical overlays add61,086 bytes/2,405 triangles/two draws.

Every provided owner byte/triangle/draw statistic matches actual traversal. Across both tiers,420 distinct geometry/material/InstancedMesh events each disposed exactly once after invoking each owner dispose twice. The separate capped/uncapped flow check also confirms one disposal per geometry/material. No new geometry object, texture, light or target was introduced by the final pavement/cap changes. Business retains its two non-shadow practical lights; cell/electrical/storage use zero texture assets.

Final incremental detail cost, relative to the predeclared hardware/interior baseline: **34,734 bytes,10 base draws,5,925 desktop /5,669 mobile triangles**, within40,000 bytes/10 draws/7,000 triangles. This includes the final contact replacement, pavement pools/source lenses and DC source cap. The last cap alone adds exactly222 bytes,6 vertices and5 triangles with no draw or owner increase.

Evidence: `/private/tmp/aesir-stage-seven-assets/final-resource-check.json` and `/private/tmp/aesir-stage-seven-assets/source-cap-check.json`. Compressed build transfer and GPU texture/target costs remain the root's separate measurements.

## Final fixes verified

The two apron receiver planes have centres4mm above the actual top surface (.078→.082) and now discard coverage outside x42..62 /z−38.5..40.5. Other pool centres remain4mm above road (.045→.049) and pavement (.230→.234). Upward plane normals, ordinary depth testing, no depth writes and finite zero-alpha boundaries are retained. This resolves the former37mm feather offset over the lower roadway. Pole/canopy lenses reuse existing boxes; the new instances introduce no camera obstruction in the current clearance sample.

The DC source cap is registered to `getPointAt(0)` and faces the negative source tangent. All five triangles have outward winding, all six vertex normals match, and UVs encode a soft centre-to-rim fade on the same energy overlay. Maximum measured source-plane deviation is0.000000556m, consistent with Float32 position precision. Construction is once-only; no render-loop geometry allocation is added. The conservative verifier includes the full cap geometry even where its shader alpha is small.

## Current clearance evidence

`/private/tmp/aesir-stage-seven-assets/final-cap-clearance.json` is the current capped-source/receiver-clipped run:81,405 camera/near-frustum sample pairs,27 natural/moving-boundary scenarios ×15 viewport/framing rigs ×201 poses at.01 progress spacing. Zero collisions, no ignored geometry, no source changes during execution. Its22 resolved source hashes are checked against disk. The current adapter passes the optional capSource argument rather than silently omitting the cap; patch supplied at `/private/tmp/aesir-stage-seven-assets/clearance-cap-adapter.patch`.

The earlier dense repository report records1,620,405 pairs with zero collisions. It predates the last pool/cap/shader changes, so it must not be described as an exact latest-source run. The final bounded check uses all five aspects and all three framings, camera-centre containment, actual triangles, finite near rectangle and the full eye-to-near-frustum volume. Transparent geometry stays included. Natural scenarios include all current campus/electrical/storage geometry; additional gate/carton boundary scenarios cover the time-dependent business mechanism. This remains sampled evidence, not a continuous mathematical proof or hardware performance measurement.

## Continuity and ownership

The optical guide terminates at selected-silicon absorption; distinct blue collection/energy overlays continue through the registered contacts, module junction, DC route, inverter and shared AC entry. All shared AC endpoint errors are zero at(−40.14,.74,13.7). Visible explanations retain the distinction between photon and charge carriers, continuing illumination/connected-circuit requirements, and voltage-over-time rather than a physical cable waveform. Optional storage remains a separate converter on an AC branch with a DC pair to the battery; finite capacity, losses and no automatic-backup claim are retained.

The connected aperture reuses its buffers; section state is deterministic and reversible. Mechanisms and attached carton contact shading share supplied ambient time, so pause/still views freeze the same state. Flow owners remove themselves before parent disposal. Shadow invalidation includes owner visibility and section/focus changes; the practical lights introduce no shadow targets.

A previously requested single Chromium resource-count probe identified the orientation discrepancy exactly: crossing760px disposes the old photosphere sphere (count75→74), and the replacement registers on the next visible Sun render (74→75). Only that sphere changes, 80×52↔128×83 segments; textures stayed8 and all synchronized Sun/business samples restored75. Wait for new quality dimensions before visiting Sun and polling the original count; do not loosen arbitrary resource-growth assertions. Compact evidence: `/private/tmp/aesir-stage-seven-assets/orientation-geometry-summary.json`. This was desktop emulation, not physical-phone or frame-time validation.
