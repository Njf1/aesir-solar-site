# Interior contact candidate and iteration-one visual review

Reviewed **2026-09-08**, using the existing stage-seven `iteration-1` PNGs at 1280×720 and 390×844, and current read-only source. The owner has subsequently changed commercial frame faces/backing and is preparing a closer cell camera. The points below describe those supplied captures, **not an assessment of the unreviewed iteration-two result**.

## Concrete observations from the images

| Frame | Visible issue | What would resolve it |
| --- | --- | --- |
| Panel 2.230, desktop/mobile | The metal frame's inner edge has a dark serrated strip; pale rails dominate the surface while the guide remains a small, readable point. | The owner's coplanar-face/backing corrections directly address the serration. Review those new frames before adding material brightness or detail. |
| Cell 2.655 | Dense, similarly bright neighbouring grids dominate the field. The selected absorber and its contacts have only modest material/scale separation. On mobile the supporting sentence crosses the light grey horizon. | The closer authored camera should improve the specimen hierarchy. Recheck the supporting copy against the actual new horizon, and keep a recognisable difference between the selected silicon and the fine metallic contacts. |
| Cell 2.760 | The blue transfer event is a very faint narrow wisp against the selected cell, while the surrounding grid remains the largest visual structure. Mobile keeps a large empty black band above the horizon. | Judge the event at the new camera distance while stopped, not only during its motion. The image should make the selected contact/absorber easy to find without searching the grid. |
| Interior 4.650 | Desk, chair, conveyor and racks are identifiable. The large six existing floor patches do not establish the individual support contacts, particularly the chair castors, desk feet and conveyor feet. The practical-light pool remains visible beneath objects almost as though they were absent. | Replace broad uniform patches with local contact occlusion on their actual receivers. Keep the existing two point lights. A small material-response adjustment can separate painted housings from bare rails after contact is established. |
| Final 6.030 | The warm office is a clear point of interest and copy placement is usable in both captures. Dense roof stippling and the large repeated field polygons remain visible in the darker background. | Reassess the roof after the owner’s frame changes and the surroundings after the separate countryside candidate. No final-camera or brand-copy replacement is warranted from these frames. |

The 4.650 title/copy is in its scheduled fade. Its low opacity in that still should not be mistaken for a steady-state text colour. The mobile 2.655 horizon crossing is a distinct composition issue to check against the new camera.

## The depth problem includes small physical clearances

The floor top is **y=.300**. Current desk feet start at **.3325**, the workstation pedestal at **.330**, and chair castors at **.313**. Those are actual gaps of **32.5 / 30 / 13 mm**, respectively. Contact artwork can ground the presentation but does not change these clearances.

If the owner wants these pieces to rest directly on the floor, the minimal source adjustments are desk-feet centre **.365 → .3325**, workstation pedestal centre **.68 → .65**, and chair-castor centre **.375 → .362**. Their upper connections still overlap their existing supports. The optional contact candidate below does not move any physical geometry; its X/Z footprints remain valid with these downward adjustments. Conveyor adjustable feet already reach the floor.

The four moving cartons currently have bottom **1.320**, while the tread tops are **1.340**. Raising the four on-belt carton constructor Y values by **.020** would place their bottoms on the tread; the existing `carton()` function carries seams/tape/labels with each box. The candidate recognises either current or corrected height and uses the tread as its receiver.

## Candidate: one draw, attached receivers

`interior-contact.ts` replaces the old six broad contact patches. It uses **57 static contact footprints and four attached carton contacts**, all in one InstancedMesh. Core regions lie below their actual support or object, followed by a short smooth feather. There are no isolated black ellipses, hard alpha discards or new projected light shadows.

Static contacts cover actual column plates, conveyor feet, bench legs, rack plates, pallet runners on their shelves, desk/monitor supports, chair castors and pallet-truck wheels. A few broad low-opacity regions stay underneath the low belt/bench rather than beneath tall empty equipment space. Elevated pallet and carton contacts use their shelf surfaces, not the concrete floor.

Moving contacts read the existing **Packed cartons** instance matrices after the owner's animation update. They have no independent clock, progress, easing, hidden mechanism or loop approximation. A shader clip limits them to the finite conveyor receiver, including when cartons pass through the existing transfer hoods. Pausing or reversing reproduces exactly the current owned carton locations. The contact group is a child of the existing interior, so hiding or disposing that owner cannot leave a visible patch behind.

The fragment uses `THREE.Color` input in working-linear colour space, normal blending with straight alpha, one output conversion, depth testing and no depth writes. It receives/casts no light shadow. This is deliberately identified as original contact-occlusion illustration, not a physical simulation of the two practical lights.

## Exact ownership and stats integration

1. Copy the helper alongside the interior source and import:

```ts
import {createInteriorContacts, refineInteriorMaterialResponse} from './interior-contact';
```

2. Remove the existing block beginning `// Local soft contact shading` through the six `instance('Restrained contact shading', ...)` calls. Do not remove the shared `plane` geometry, which the monitor also uses. Do not layer both passes together; the helper throws if the old contact batch is still present.

3. Immediately after the existing `for (const b of batches.values())` loop has built the instance batches, create the replacement:

```ts
const contacts = createInteriorContacts(group);
group.add(contacts.group);
instances += contacts.stats.instances;
// Optional, independent material-only treatment:
refineInteriorMaterialResponse(group);
```

4. At the end of the existing `render()` function, after carton/head/gate/slat matrices are updated:

```ts
contacts.render();
```

5. Current group traversal already counts this mesh's draw, triangles and instance matrices. After summing the existing owned geometries, add only its remaining buffers:

```ts
geometryBytes += contacts.stats.staticBufferBytes;
```

Do not add its entire `geometryBytes` again, because the traversal already counted the instance matrix. No new point light or texture stat is required.

6. In `dispose()`, call `contacts.dispose()` **before** the existing `group.traverse(...InstancedMesh.dispose...)`. The helper detaches its group and releases its own mesh/geometry/material exactly once; the subsequent traversal then handles only the original owner resources. Do not also add its geometry/material to `geometries` / `materials`.

## Optional material response

`refineInteriorMaterialResponse(group)` changes only roughness/metalness, deduplicated by material identity:

| Existing material | Current roughness / metalness | Candidate |
| --- | --- | --- |
| Painted shell | .57 / .25 | .46 / .08 |
| Structural steel | .48 / .56 | .40 / .63 |
| Bare silver metal | .31 / .77 | .27 / .83 |

Original colours, practical intensity, environment, geometry and all emissive/screen logic are unchanged. This makes painted housings mostly dielectric and keeps the tighter reflection on bare rails. It is an artistic starting point requiring the owner's actual light/camera review, not a product-material specification.

## Cost and checks

The replacement costs **1 draw, 122 triangles, 61 instances and 5,020 GPU-buffer bytes** in either tier. That includes **3,904 instance-matrix bytes + 1,116 other buffer bytes**. It replaces an existing contact draw, so the net draw-count change is zero. No new textures, render targets, light/shadow maps, providers or dependencies are introduced.

Strict TypeScript passes against pinned Three 0.185.1 / installed types 0.185.4. `cpu-checks.json` records **3,220 samples per tier** across forward/reverse cycles, repeated pauses, disabled/partial equipment state and multiple carton wraps. Maximum contact-to-carton X/Z attachment error is **0**. Buffer identities remain stable; disposal fires once per owned resource. The receiver test permits a 1e-5 metre tolerance for the existing Float32 instance-matrix representation at the belt endpoints.

**No browser/GPU compilation or visual result for this candidate is claimed.** The source code and contact pattern are original procedural artwork authored on 2026-09-08. No photograph, bitmap, imported equipment model or licence-bearing new asset was used. Colour/output treatment follows the previously verified [Three colour-management manual](https://threejs.org/manual/en/color-management.html) and the pinned runtime source.

Before acceptance, inspect the desk feet/castors, conveyor feet, a carton approaching each hood, the paused dwell and a complete concealed wrap. Check both the lit and unlit business moments; low-opacity contact artwork should remain subordinate to the real supports and receiver material.
