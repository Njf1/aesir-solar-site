import * as THREE from 'three';

/** Original bounded stage-seven candidates, authored 2026-09-08.
 * No textures, render targets, lights, dependencies or temporal history.
 * Source/CPU checked against pinned Three 0.185.1; GPU/art review remains required.
 */
function replaceOnce(source: string, match: string, replacement: string) {
  if (source.split(match).length !== 2) throw new Error(`Expected one shader marker: ${match.slice(0, 64)}`);
  return source.replace(match, replacement);
}

/** Fade only unresolved Sun detail towards its mean; broad activity is unchanged.
 * fwidth is evaluated unconditionally. Ambient time and scroll remain independent.
 * This changes shader detail sampling, not renderer exposure or the palette.
 */
export function filterSolarFineDetail(source: string) {
  source = replaceOnce(source,
    'float granule=noise3(p*315.+warp*13.+drift*7.);',
    `vec3 granuleDomain=p*315.+warp*13.+drift*7.;
     float granuleFootprint=max(length(dFdx(granuleDomain)),length(dFdy(granuleDomain)));
     float granuleWeight=1.-smoothstep(.45,1.35,granuleFootprint);
     float granule=noise3(granuleDomain);`);
  source = replaceOnce(source,
    'float fine=noise3(p*620.+drift*10.);',
    `vec3 fineDomain=p*620.+drift*10.;
     float fineFootprint=max(length(dFdx(fineDomain)),length(dFdy(fineDomain)));
     float fineWeight=1.-smoothstep(.40,1.20,fineFootprint);
     float fine=mix(.5,noise3(fineDomain),fineWeight);`);
  return replaceOnce(source,'float lanes=smoothstep(.28,.65,granule);',
    'float lanes=mix(.5,smoothstep(.28,.65,granule),granuleWeight);');
}

/** The existing cell hook already gets Three's complete PBR/output pipeline.
 * Only attenuate its unfiltered procedural sine frequencies as they pass Nyquist.
 * Wrap, rather than replace, its existing hook and cache identity.
 */
export function filterCellFineDetail(material: THREE.Material) {
  const previous = material.onBeforeCompile;
  const cacheKey = material.customProgramCacheKey.bind(material);
  const previousKey = cacheKey();
  material.onBeforeCompile = function (shader, renderer) {
    previous.call(this, shader, renderer);
    const match = 'float fineGrain=sin(vCellPoint.x*531.+sin(vCellPoint.z*167.)*.65)*sin(vCellPoint.z*263.);';
    if (!shader.fragmentShader.includes(match)) return;
    shader.fragmentShader = replaceOnce(shader.fragmentShader, match,
      `float finePhaseX=vCellPoint.x*531.+sin(vCellPoint.z*167.)*.65;
       float finePhaseZ=vCellPoint.z*263.;
       float phaseFootprint=max(fwidth(finePhaseX),fwidth(finePhaseZ));
       float fineWeight=1.-smoothstep(1.3,3.14159265,phaseFootprint);
       float fineGrain=sin(finePhaseX)*sin(finePhaseZ)*fineWeight;`);
  };
  material.customProgramCacheKey = () => `${previousKey}|aesir-cell-detail-filter-v1`;
  material.needsUpdate = true;
}

/** ShaderMaterial alone does not invoke output conversion. All candidates below
 * emit straight (unpremultiplied) Linear-sRGB RGB + separate coverage alpha.
 * THREE.AdditiveBlending + premultipliedAlpha:false then applies alpha ONCE.
 * Direct canvas additive compositing is still display-buffer blending; this is
 * not a claim of a new HDR linear-compositing post pipeline.
 */
export function configureLinearAdditive(material: THREE.ShaderMaterial) {
  material.transparent = true;
  material.blending = THREE.AdditiveBlending;
  material.premultipliedAlpha = false;
  material.toneMapped = false;
  material.depthWrite = false;
  material.needsUpdate = true;
  // Caller chooses depthTest for the explicitly through-section rear overlay.
}
export const overlayVertex = /* glsl */ `varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;

// Supply uTint with new THREE.Color(0xffedca), already working-linear.
// Re-tune opacity after replacing the old a-squared output; do not multiply RGB by a.
export const stablePulseFragment = /* glsl */ `
uniform float uOpacity; uniform vec3 uTint; varying vec2 vUv;
void main(){
  vec2 p=(vUv-.5)*2.;
  float pixel=max(length(dFdx(p)),length(dFdy(p)));
  // A resolved Gaussian core plus soft halo: no long subpixel cross-shaped ray.
  float width=max(.026,pixel*.72);
  float core=exp(-dot(p,p)/(width*width));
  float halo=exp(-length(p)*9.)*.10;
  float a=clamp((core*.72+halo)*uOpacity,0.,1.);
  gl_FragColor=vec4(uTint,a);
  #include <colorspace_fragment>
}`;

// Uses current trail vertex's aAlong/vAlong registration; no path changes.
export const linearTrailFragment = /* glsl */ `
uniform float uOpacity; uniform vec3 uTint; varying float vAlong; varying vec2 vUv;
void main(){
  float taper=pow(1.-vAlong,3.5)*(1.-smoothstep(.45,.85,vAlong));
  float edge=pow(max(0.,sin(vUv.y*3.14159265)),.8);
  gl_FragColor=vec4(uTint,clamp(taper*edge*uOpacity,0.,1.));
  #include <colorspace_fragment>
}`;

export const energyFlowVertex = /* glsl */ `
varying vec2 vUv; varying vec3 vViewNormal; varying vec3 vToCamera;
void main(){
  vUv=uv; vec4 viewPoint=modelViewMatrix*vec4(position,1.);
  vViewNormal=normalMatrix*normal; vToCamera=-viewPoint.xyz;
  gl_Position=projectionMatrix*viewPoint;
}`;

// EnergyFlow candidate, retaining existing phase/time/arc-length uniforms.
// Pair with energyFlowVertex: camera-facing falloff softens the tube silhouette.
// Supply uTint = new THREE.Color(0x59bdee); phase derivatives are not taken across fract.
export const linearEnergyFlowFragment = /* glsl */ `
varying vec2 vUv; varying vec3 vViewNormal; varying vec3 vToCamera;
uniform float uTravel,uTime,uOpacity,uRepeats; uniform vec3 uTint;
void main(){
  float routeU=max(0.,vUv.x);
  float alongWidth=max(fwidth(routeU),.001);
  // Do not feather away the entire first few centimetres of an acquired route.
  float revealBack=max(alongWidth,min(.025,uTravel*.5));
  float reveal=1.-smoothstep(uTravel-revealBack,uTravel+max(.006,alongWidth),routeU);
  float continuousPhase=routeU*uRepeats-uTime*.20;
  float phase=fract(continuousPhase);
  float resolved=1.-smoothstep(.22,.60,fwidth(continuousPhase));
  float bar=smoothstep(.08,.14,phase)*(1.-smoothstep(.34,.40,phase));
  bar=mix(.26,bar,resolved);
  float facing=abs(dot(normalize(vViewNormal),normalize(vToCamera)));
  float across=smoothstep(0.,.38,facing);
  float capCoverage=vUv.x<0.?smoothstep(0.,.7,vUv.y):1.;
  // Keep the fixed collection terminal readable between moving flow marks.
  // Its steady level is below the existing bar peak; this is not another head.
  float signal=vUv.x<0.?.90:(.30+.65*bar);
  float a=clamp(uOpacity*reveal*signal*across*capCoverage,0.,1.);
  gl_FragColor=vec4(uTint,a);
  #include <colorspace_fragment>
}`;

/** Append exactly one output transform to the existing cell absorption/collection
 * main. Their straight-alpha output is already correct. Collection uColor from
 * THREE.Color is already linear; do not convert it again.
 * For absorption's raw vec3 palette, first replace its endpoints with linear
 * THREE.Color uniforms. Do not use this helper on shaders with early main returns.
 */
export function withLinearOutput(fragment: string) {
  if (fragment.includes('#include <colorspace_fragment>')) return fragment;
  if (/\breturn\s*;/.test(fragment)) throw new Error('Output helper does not handle early returns');
  const last = fragment.lastIndexOf('}');
  if (last < 0) throw new Error('No shader main closing brace');
  return fragment.slice(0,last)+'\n#include <colorspace_fragment>\n'+fragment.slice(last);
}

/** Selective macro depth: no glass block, no shadows cast by sub-texel fingers,
 * and no noisy shadow receiving on the thin contacts themselves.
 * Call once after CellScene.prepare(), before the first macro shadow map update.
 */
export function configureCellMacroDepth(group: THREE.Group) {
  const cast = new Set([
    'Full module backing', 'Selected silicon absorber',
    'Selected cell front busbars', 'Front collection continuation',
  ]);
  const receive = new Set([
    'Full module backing', '143 neighboring silicon cells', 'Selected silicon absorber',
  ]);
  const result = {casters: [] as string[], receivers: [] as string[]};
  group.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = cast.has(object.name);
    object.receiveShadow = receive.has(object.name);
    if (object.castShadow) result.casters.push(object.name);
    if (object.receiveShadow) result.receivers.push(object.name);
  });
  return result;
}
