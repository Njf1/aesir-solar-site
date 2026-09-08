# DC reacquisition: shader reveal suppression

Read-only diagnosis on **2026-09-08**, using current source plus `stage-seven/iteration-3/laptop-3.080.png`, `laptop-3.112.png` and the associated capture observations. No shared edit or browser/GPU test was performed.

The DC cue is present on screen but its initial reveal is mostly faded away. A backward fade designed as **2.5% of the complete 60.924 m route** covers 1.523 m. At p3.08 only **.4% / .244 m** of the route is revealed. The fade therefore reaches behind the route's beginning and suppresses even its source. The camera also looks nearly along the tube, so the retained silhouette softening further reduces the visible side surfaces.

This should look like a short blue electrical flow becoming readable at the existing lead. Currently the shader gives the source only **.245 reveal** and the nominal head only **.098 reveal**, before band modulation, silhouette falloff and the 24% contact veil. At p3.112 the source still has only **.573 reveal**. By p3.17, the revealed route is long enough for the existing feather to behave normally, matching the observed recovery.

## Minimal proposal

Keep `alongWidth` and replace only the reveal calculation:

```glsl
float revealBack=max(alongWidth,min(.025,uTravel*.5));
float reveal=1.-smoothstep(
  uTravel-revealBack,
  uTravel+max(.006,alongWidth),
  vUv.x
);
```

The backward feather is limited to half the current reveal until enough of the route exists. The existing pixel-width floor remains. The forward feather, electrical band phase, palette, alpha convention, side softening, tube geometry, route sampling and time policy stay unchanged. There is no new sphere, photon-like head or brightness multiplier.

At **uTravel ≥ .05**, `uTravel*.5 >= .025`, so this reduces **exactly** to the old formula, including when the derivative footprint exceeds .025. Current p3.17 is u=.055997 and is unchanged. The modification is continuous and stateless in reverse.

`early-reveal.ts` supplies the exact guarded string replacement. To affect **only DC**, apply it just after creating the existing DC EnergyFlow and before `compileReady`:

```ts
import {preserveInitialEnergyReveal} from './early-reveal';

this.dcFlow = new EnergyFlow(ELECTRICAL_PATHS.dcPositive, .035, 176, false);
this.dcFlow.mesh.material.fragmentShader = preserveInitialEnergyReveal(
  this.dcFlow.mesh.material.fragmentShader,
);
```

This is before the material's first compilation, so no extra runtime shader change or render-loop mutation is needed. Editing the shared `linearEnergyFlowFragment` instead would also strengthen the first 5% of AC, cell-module and business flow reveals; the DC-only splice preserves those accepted users.

## Evidence and limits

- **On screen:** the exact source projects to approximately **(581,492)** at p3.08 in 1280×720, and **(600,360)** at p3.112. It is in front of the camera. The matched capture's source and camera values agree with the CPU calculation.
- **The source is below the aim, legitimately:** `MODULE_JUNCTION` projects to (640,360) at p3.08. Its .406 m separation from `dcSourcePositive` is the already authored physical lead loop. This is a framing contributor, not a broken path/anchor registration. No anchor change is needed for this shader fix.
- **Depth/order:** the current DC material has depthTest=false before 3.23, renderOrder=7 and visible uTravel/uOpacity values after CELL_EXIT. The p3.08 veil has opacity .24; it can dim the cue but cannot explain its absence at p3.112, where the veil is zero. The visible pale trace in 3.112 agrees with a weak additive overlay.
- **Geometry sampling:** route length / 176 segments is .346 m, but measured maximum centreline chord error in the first 2% is only **4.85 mm**, compared with the **35 mm overlay radius**. Increasing segment count is not a supported first fix for disappearance.
- **Side-view attenuation:** p3.08 is nearly end-on to the uncapped tube. In a CPU visible-triangle estimate using the minimum along-footprint .001, peak dim-band alpha rises **.0195 → .1151**, and weighted contribution rises about **6.5×** with the proposal. At p3.112 peak dim-band alpha rises **.1155 → .24**. The p3.17 estimate is identical to baseline. These are shader/projection estimates, not rasterized GPU measurements; actual `fwidth`, subpixel coverage and ambient band phase affect individual pixels.
- **Exact longer-route preservation:** `feather-checks.json` records **288,576 identical comparisons** for uTravel≥.05 across six derivative footprints and a sampled UV range. Values stay finite and within [0,1] in the entry checks.

Resources added: **zero GPU buffers, triangles, draws, textures, render targets, uniforms or lights**. The guarded helper is original code. Existing Three colour/output handling is retained without modification.

Root should inspect p3.08, 3.09, 3.10, 3.112 and 3.17 after the DC-only splice, including a stopped dim band phase. That rendered review remains the acceptance check.

## Integrated GPU follow-up

The shared energy shader now bounds the backward reveal feather to half the acquired route. GPU review also exposed the open end when the camera looks nearly along the cable. The DC overlay alone therefore closes its source with five triangles and a soft interpolated rim (222 additional buffer bytes), on the actual arc-length path source. It adds no separate light, particle, owner or draw; the other energy paths remain open. The small cool source face is an energy-flow overlay, not a resurrected photon. The regular path fade is unchanged once uTravel≥.05. Final captures and motion include3.08,3.095,3.112 and3.17 in both directions.
