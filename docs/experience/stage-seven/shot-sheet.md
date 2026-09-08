# Stage seven shot sheet — intentional refinements

Reviewed source dbb8197; local candidate only. The 6.08 units / 34.048 useful viewport heights, 23 meanings and 12 stills remain. Camera changes are intentional under prompt 07, not an extension or renormalisation. All optical/site/cell anchors, Sun direction, same campus and application destination remain authoritative.

| Boundary / range | Eye, direction and scale reference | Light / copy / occlusion decision |
| --- | --- | --- |
| Opening → approach, .16 | Tiny source grows directly into the Sun; retain first-scroll response. | Quiet black opening; original title clears. Derivative filtering removes unresolved surface noise. |
| Sun → acquisition, .39 | Visible limb → white-gold head; turn behind the shared distance path. | Surface radiance has a broader warm hierarchy; asymmetric attached prominences remain. No star tunnel or camera shake. |
| Acquisition → flight, .51 | Head stays ahead as the limb recedes. | Straight-alpha glow and trail output; concentrated core, trail remains behind. |
| Flight → Earth, .75 | Directional guide and growing daylight Earth remain the destination. | Existing orbit and light direction preserved; no new crescent. |
| Earth → Britain, 1–1.36 | Europe then Britain; coastline and guide establish destination before rebase at 1.30. | High, blue atmospheric strata sweep diagonally with two rates of parallax. Complete conceal only at 1.296–1.304; signed reveal continues the same direction. |
| Britain → atmosphere, 1.49 | Same indicative Midlands target; descending guide establishes the site arrival. | Low cloud banks have a darker underside and larger forms than the orbital passage. Conceal at 1.546–1.554 hides the necessary site-scale change. |
| Atmosphere → building, 1.65 | Warehouse silhouette, road, entrance and roof arrays establish scale. | Existing daylight; varied, subdued countryside parcels replace the repeated lattice. Illustrative site is separate from the dated real record. |
| Building → array, 1.84 | Camera descends to the deliberate module row. | Roof detail retains shared batching; shadow coverage narrows to the roof instead of wasting texels on distant ground. |
| Array → panel, 2.06 | Same hero module/guide anchor; row edges establish continuity. | Recessed module backing removes coplanar frame-side interference. No blur over the subject. |
| Panel → glass, 2.25–2.48 | Same registered cell, glass reflection and normal, then enlarged section. | One connected glass and encapsulation pane per layer removes internal joining faces. Narrower macro shadow volume, selective casters and lower glass opacity improve depth. Glass sweep retains the scale handoff. |
| Glass → cell, 2.46 | Exposed semiconductor and contacts remain attached to the module. | Camera comes closer and portrait aim centres the selected absorber. The short explanation leads the event, then clears. |
| Absorption → collection, 2.655–2.85 | White-gold incident cue ends at the silicon; a local response then the cool contact overlay. | Larger resolved field response; no optical guide after absorption, no atomic/electron animation. Continuing light and a connected circuit remain in HTML. Image-only event after the statement. |
| Cell → contacts, 2.82 | Front and rear collection lead to the same module interconnection. | Selective illuminated contact detail; rear path explicitly an explanatory section overlay. |
| Contacts → DC, 3.052–3.112 | Module backing, registered junction and lead loops provide the structural passage and arrival anchor. | Reduce near-black screen veil to 24%; real structure carries the occlusion. First 0.4% of DC path is visible at return, within half a module width of the exported source. A brief through-section energy overlay remains readable during the rise; normal depth testing resumes at 3.23. The early reveal feather is bounded by the acquired length; a soft five-triangle closure keeps the tube visible end-on at its actual source. |
| DC → inverter, 3.54 | Supported tray, wall descent and original DC ports lead into the enclosure. | Original generic bevel/rim/louvre/gland detail; shared materials and bounded batches. No equipment rating or complete wiring claim. |
| Inverter → AC, 3.84 | Input/output ports and continuous antialiased waveform explain conversion. | Waveform remains voltage versus time; energy-flow overlay has a separate meaning. |
| AC → entry, 4.08–4.32 | Actual AC output → buildingEntry → overhead distribution. | Graph clears before movement. Camera enters obliquely through the real facade opening, passing beside the riser instead of centring it. Permission/commissioning caption precedes activation. |
| Entry → business, 4.32–4.84 | Practical light on surfaces → equipment → screen. | Daylight remains. Cartons now advance with the conveyor and dwell for the head; covered ends conceal deterministic recirculation. Warm workspace image hold follows copy. |
| Business → optional storage, 4.84–5.15 | Return through the opening to a separate converter/battery branch. | Daylight charging only; generic cabinet construction refined. Labels remain attached to owned equipment. |
| Charge → later use, 5.15–5.40 | Same branch, reversed directional overlay and finite stored-state change. | Dusk motivates later use; PV contribution dims. No simultaneous charge/discharge or automatic backup claim. |
| Later use → grid, 5.40–5.67 | Pause at service connection scale before widening to campus. | Camera moves closer to the selected grid cabinet/route; copy waits until the route is established. Import only; no opposing arrows. |
| Grid → journey, 5.67–5.88 | Widen from the connected site to the warm operating campus. | Technical overlays subside; short payoff lines appear separately. |
| Journey → Aesir / offer, 5.88–6.08 | Settled same-campus composition, crisp vector identity and inline application action. | Finite warm light pools on the actual pavement connect existing fittings to the entrance; gold recalls the opening. No revived photon. Native offer immediately follows, with Skip and header action throughout. |

## Pose fixture policy

The original stage-three and stage-four fixtures remain in recovery history and the original fixture files are unchanged. `stage-seven-refined-poses.json` stores only changed fields from the stage-four sampling set (402 records / 943 fields): macro camera/aim in 2.38–3.08, the reduced contact veil, and the DC prefix/derived guide fields in 3.08–3.73. Tests reject overrides outside these named fields/ranges. All unaffected fields retain exact comparisons. New operation camera changes are covered by dense reversal, C1 entry, actual mesh/near-volume clearance and visual review rather than pretending old poses were unchanged.

## Colour and shadow decisions

Pinned Three 0.185.1; no dependency upgrade. Physical and custom surface materials use the renderer's working-linear lighting and output conversion. Additive guide/flow layers now provide straight linear RGB and coverage alpha once; previous guide/corona layers multiplied alpha twice. No full-screen bloom, depth of field or resolution increase. PMREM remains linear and uses the supported .04 blur. PCFShadowMap stays explicit.

Roof / hero / cell shadow focus reduces XY coverage and scales near/far, depth bias and normal bias together, at unchanged 2048/1024 maps. Macro glass and sub-texel fingers do not cast noisy shadows; selected silicon/backing/busbars carry depth. Cached invalidation includes focus, section state and late owner readiness. Closely overlapping array frame/back faces were geometry interference, not a problem solved by a larger shadow map.

Primary references checked against pinned implementation: [Three colour management](https://threejs.org/manual/en/color-management.html), [Three shadows](https://threejs.org/manual/en/shadows.html), installed `WebGLPrograms`, `ShaderChunk`, `PMREMGenerator` and shadow renderer source. Accessed 8 September 2026. Solar/geographic/scientific source provenance from earlier handoffs remains; new detail is original authored geometry/shading, not a scientific measurement or manufacturer product.
