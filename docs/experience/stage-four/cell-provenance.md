# CellScene handoff — frozen 8 September 2026

File: `src/experience/cell.ts`

SHA-256: `c5f072461e4049ef57d7fb49dcf4f1de2813e6bd8d45b461cbe68532ab9202ec`

Root owns all subsequent changes. No project checkout was edited.

## API

```ts
const cell = new CellScene().prepare(mobile);
// Static CellScene.prepare(mobile) is also supported.
scene.add(cell.group);
cell.render({ section, absorption, extraction, incident }, ambientTime);
cell.snapshot();
cell.dispose();
```

`prepare` is synchronous and returns the instance. The owner supplies lights, camera, guide, chapter visibility and ambient-clock suspension. No asynchronous media loading is required. Values are finite-clamped to 0..1; geometry is allocated once. Only transforms, instance matrices and shader uniforms change while rendering. No per-frame geometry or texture creation occurs.

Read-only anchors are exposed on the instance:

- `absorptionPoint = (-0.9, 0, 0)` — between shared contact positions; original contact grid remains complete.
- `frontCollection = (0, .09, -2.459375)`.
- `rearCollection = (4.1175, -.62, 1.7706875)`.
- `junction = (-4.3875, -3.1, -11.465625)` — exact existing selected-module junction registration.

The full selected-module frame/backing and 144 aligned cells provide grounded context. Neighbor contacts are procedural material details derived from `PANEL.busFractions` / `PANEL.fingerFractions`; selected contacts are enlarged geometry. Main silicon front surface is Y=0, selected rear contact about −.66, glass .35..8. Four frame centres use corrected Y=−.35; module backing centre is −1.5. Two underside cable proxies reproduce existing exterior control points, radius and topology.

## Section and science behavior

The glass/encapsulant aperture opens over the selected cell, while a foreground slice of its wafer is removed to expose a restrained junction band and rear collecting contact. Layers remain attached to the module. The exact closed state uses one unbroken protective pane to avoid internal transparent-box seams. `section=1, absorption=1, extraction=.5` is a meaningful still.

The local absorption field is separate from the root-owned white-gold guide. Front/rear extraction channels use subdued blue-white broad modulation without named particle markers or physical speed claims. The rear channel is explicitly a faint educational overlay through the remaining opaque wafer (`depthTest=false`), not an exposed physical wire in silicon. The scene owner retains explanatory HTML and terminates the incident guide independently.

`incident` is clamped and retained in state/snapshots for coherent owner sequencing; it does not create a duplicate incident beam.

## Verification

- Strict TypeScript check against the current shared panel layout passes.
- Forward/backward rendering at section 0, .01, .15, .45, .75 and 1 reconstructs all instance matrices, object positions, scales and active instance counts exactly.
- All transform values remain finite.
- Shared shader fractions are checked against `PANEL` at compilation-hook construction.
- Full backing, four frame centres/scales, junction centre, eight lead control points and local glass top were checked against existing site transforms. Maximum registration error: **1.54 × 10⁻⁶ cell units**, due to Float32 instance matrices. Junction/lead error is approximately 10⁻¹³.
- Double disposal is safe; meshes detach and all owned buffers/materials are disposed.
- Isolated headless Google Chrome rendered open, closed and absorption states with **zero console/page errors**. Temporary studio lighting was used to inspect geometry and shader compilation; this does not validate the root experience's camera, composition, lighting or phone performance.

| Maximum active resources | Desktop | Mobile |
| --- | ---: | ---: |
| Geometry + instance buffer bytes | 44,500 | 33,556 |
| Triangles | 3,322 | 2,874 |
| Base draw calls | 17 | 17 |
| Texture bytes | 0 | 0 |

Diagnostic captures are `/private/tmp/aesir-cell-verify/open.png`, `closed.png`, and `absorption.png`. They are developer checks, not approved hero captures. Runtime registration/reversal checks remain in `/private/tmp/aesir-cell-verify/check.mjs`.

## Integrated delivery

Final authored sources are [cell.ts](../../../src/experience/cell.ts), [panel-layout.ts](../../../src/experience/panel-layout.ts) and [conversion-journey.ts](../../../src/experience/conversion-journey.ts). Created for this project, 8 September 2026, with Codex assistance; no external model or artwork is incorporated. Final integration darkens the silicon and context, tightens the camera, enlarges the localized response and preserves one shared contact layout. Final captures, transfer, owner buffers and rendered counts are in the [stage-four handoff](README.md). The temporary isolated checks above are historical development evidence, not served assets.
