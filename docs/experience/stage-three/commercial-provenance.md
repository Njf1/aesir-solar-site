# Original commercial-site asset

Delivered source: [`src/experience/commercial.ts`](../../../src/experience/commercial.ts), integrated by [`site.ts`](../../../src/experience/site.ts).

Created 8 September 2026 as original procedural geometry and CanvasTexture artwork for the Aesir Solar experience. No downloaded images, third-party model, real property survey, brand, manufacturer layout, logo or font is used. The design depicts a composite modern British light-industrial campus. It is a cinematic architectural illustration, not a construction, structural, electrical or planning drawing.

## Integration

```ts
import { createCommercialSite } from './commercial';
const campus = createCommercialSite('desktop'); // or 'mobile'
scene.add(campus.group);
// All coordinates are local metres in campus.group: +Y up, north = -Z, south = +Z.
const heroWorld = campus.group.localToWorld(campus.heroAnchor.clone());
// Rotate heroNormal by the group's world normal matrix when the group is transformed.
```

Return shape: `group`, `heroAnchor`, `heroNormal`, `roofY`, `bounds`, `stats`, `dispose`.

- Warehouse: 80 × 48 metres; roof reference height 11.06m. South office bar steps forward, with a taller entrance, timber finish, broad canopy and occupied roof terrace.
- Four dock doors and working yard are east (+X); north plant and vents, rooflights, eastern bins/pallet stacks/electrical enclosure, landscaped western edge, southern parking and access road give the future camera specific destinations.
- 879 modules, nominal 1.134 × 2.278m, face south at 9° tilt. Total module area 2,270.68m², **59.13% of warehouse roof area**. Clear zones surround three rooflights and rear HVAC.
- Hero glass centre: `[-10, 11.447285923754519, 10.009073198972333]`.
- Hero normal: `[0, 0.9876883405951378, 0.15643446504023087]`.
- Full site bounds: min `[-79,-0.5100000054,-65]`, max `[79,12.7599998079,71]`.

The owner supplies directional light, environment/sky, contact shadows, renderer configuration and camera. The module supplies no animation or global handlers. Textures are generated synchronously with a 2D canvas; no network requests occur. The owner warms the group using `compileReady` with its lifetime AbortSignal; timeout and disposal cancel all owned polling before removing materials. This avoids Three r185's uncancellable `compileAsync` polling. The helper uses the pinned version's internal program-readiness interface; rerun cancellation regressions on Three upgrades. A browser or GPU driver that blocks synchronously cannot be preempted by a JavaScript deadline. The ground patch is deliberately finite; the integrated wrapper blends it into extended landscape.

## Geometry and memory budgets

| Tier | Base draw calls (conservative) | Geometry triangles including close hero | Instances | Canvas texture | Decoded RGBA | With mipmaps |
|---|---:|---:|---:|---|---:|---:|
| Mobile | 39 | 96,286 | 8,481 | 256 × 512 | 524,288B | 699,051B |
| Desktop | 39 | 115,710 | 9,480 | 512 × 1024 | 2,097,152B | 2,796,203B |

Repeated geometry is material-batched into 36 instanced meshes, including a hero-contact LOD. Fine busbar geometry is visible within 3m on mobile / 4.5m on desktop. Small aluminium frames and clamps receive shadows; the full module backs cast the array footprint, avoiding redundant tiny shadow casters.

In an isolated desktop Chrome headless review at 1440 × 1000, using one 2048² shadow-casting directional light, the complete site measured **64 rendered calls / 133,246 triangles**, and the close hero measured **58 calls / 147,458 triangles** including that shadow pass. These are one-frame scene counts, not frame-time or real-device performance results. Owner lighting and extra scene objects will change the totals.

## Verification and review captures

Typechecked against the existing Three.js 0.185.1 / strict TypeScript configuration. Both quality modes were instantiated, bounds/anchors/counts checked, and `dispose()` called twice without errors. `dispose()` releases instancing buffers, geometries, materials and texture resources; it clears the generated canvas backing stores and detaches the group. It never disposes resources supplied by the owner.

Four actual rendered captures reviewed:

- `/private/tmp/aesir-commercial-review/site.png`
- `/private/tmp/aesir-commercial-review/front.png`
- `/private/tmp/aesir-commercial-review/roof.png`
- `/private/tmp/aesir-commercial-review/hero.png`

The review used deliberately plain sky lighting to inspect geometry. The stepped office volume, dock positions, rooflight gaps and module frame/cell alignment are visible. Final art direction, regional transition, guide travel, responsive safe areas and performance measurements belong to the integrated experience.

## Integrated treatment

The scene wrapper adds an original irregular field-parcel canvas (1024² desktop /512² mobile), extended access road and original procedural sky/reflection cards. Broad warm daylight follows `SUN_LOCAL`; cooler hemisphere fill and one cached soft directional shadow establish the architecture. Portrait haze density accounts for the wider camera distance. Module roughness/clearcoat were tuned against the actual roof and glass captures; no downloaded HDRI or manufacturer image is used.

The environment is generated once at 256/128 cube resolution, then its temporary geometry/materials and PMREM scratch targets are disposed. The retained environment estimate includes its half-float RGBA texture and depth storage. Field/module decoded pixels, mipmaps, geometry/instance buffers and the shadow target are reported separately in the stage-three handoff. The selected panel ends with its visible contacts and guide above the glass; the cell interior is explicitly unbuilt.
