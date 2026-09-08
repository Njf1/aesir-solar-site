import * as THREE from 'three';

/** Original procedural illustration, 2026-09-08. No cloud image or weather claim.
 * Geographic landmarks, coordinate conventions and camera paths are unchanged.
 * Three 0.185.1: palette uniforms are Linear-sRGB, output is converted once.
 */
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(x:number)=>{const t=clamp(x);return t*t*(3-2*t);};

export function geographicTransitionUniforms(){
  return {
    uGeoKind:{value:0},uGeoSweep:{value:-1},uGeoConceal:{value:0},uGeoAspect:{value:1},
    uHighDeep:{value:new THREE.Color('#426c87')},
    uHighMid:{value:new THREE.Color('#adc5d0')},
    uHighLight:{value:new THREE.Color('#e1e7e4')},
    uLowDeep:{value:new THREE.Color('#6c7f89')},
    uLowMid:{value:new THREE.Color('#b7c1bf')},
    uLowLight:{value:new THREE.Color('#e4e6df')},
  };
}
export type GeographicUniforms=ReturnType<typeof geographicTransitionUniforms>;

/** Mutates existing uniforms only. No time integration, tween or per-frame object.
 * Full opacity is guaranteed at 1.296–1.304 / 1.546–1.554. Outside those tight
 * intervals the directional mask reveals the actual retained scene at its edges.
 * The original opacity windows still decide visibility and graceful loading holds.
 */
export function updateGeographicTransition(u:GeographicUniforms,p:number,aspect:number){
  const low=p>=1.425,join=low?1.55:1.30,start=low?1.485:1.235,end=low?1.635:1.36;
  const raw=p<join?(p-join)/(join-start):(p-join)/(end-join);
  u.uGeoKind.value=low?1:0;
  u.uGeoSweep.value=Math.max(-1,Math.min(1,raw));
  u.uGeoConceal.value=1-smooth((Math.abs(p-join)-.004)/.012);
  u.uGeoAspect.value=Math.max(.3,Math.min(4,aspect));
}

const geoDeclarations=/* glsl */`
uniform float uGeoKind,uGeoSweep,uGeoConceal,uGeoAspect;
uniform vec3 uHighDeep,uHighMid,uHighLight,uLowDeep,uLowMid,uLowLight;
float geoHash(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float geoNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(geoHash(i),geoHash(i+vec2(1.,0.)),f.x),mix(geoHash(i+vec2(0.,1.)),geoHash(i+1.),f.x),f.y);}
`;

const geoMain=/* glsl */`
// Work in a bounded aspect-corrected screen domain. The two layers travel at
// different rates along the same direction; ambient drift remains independent.
vec2 q=(vUv-.5)*vec2(uGeoAspect,1.);
float extent=max(1.,uGeoAspect);
vec2 p=q/extent;
float sweep=uGeoSweep;
float advance=1.-abs(sweep);
float drift=uTime*.004;
float alpha;vec3 color;
if(uGeoKind<.5){
  // High atmosphere: wide curved, directional blue strata; no cotton-white wipe.
  vec2 direction=vec2(.92,.39);
  float farLayer=geoNoise(q*vec2(1.6,3.0)+direction*(sweep*.32+drift));
  float nearLayer=geoNoise(q*vec2(3.8,7.2)+direction*(sweep*.79+drift*1.4)+7.3);
  float stratum=p.y*.69+p.x*.29+.12*p.x*p.x+(farLayer-.5)*.21;
  float frontier=mix(-.76,.78,smoothstep(0.,1.,sweep<=0.?advance:1.-advance));
  float aa=max(fwidth(stratum)*1.5,.025);
  float bank=1.-smoothstep(frontier-.17-aa,frontier+.17+aa,stratum);
  if(sweep>0.)bank=1.-bank;
  float wisps=smoothstep(.34,.78,nearLayer)*.18;
  float density=bank*(.64+farLayer*.24)+wisps*bank;
  float silver=exp(-abs(stratum-frontier)*12.)*.19;
  color=mix(uHighDeep,uHighMid,.36+farLayer*.48);
  color=mix(color,uHighLight,clamp(.11+nearLayer*.18+silver,0.,.55));
  alpha=clamp(density*.93*uOpacity,0.,.96);
}else{
  // Low cloud: larger banks, clear diagonal gaps and a darker near underside.
  vec2 direction=vec2(.82,-.57);
  float farLayer=geoNoise(q*vec2(2.25,2.5)+direction*(sweep*.38+drift));
  float nearLayer=geoNoise(q*vec2(4.4,3.2)+direction*(sweep*.96+drift*1.7)+11.7);
  float ridge=p.x*.58-p.y*.37+(farLayer-.5)*.42+(nearLayer-.5)*.12;
  float frontier=mix(-.80,.82,smoothstep(0.,1.,sweep<=0.?advance:1.-advance));
  float aa=max(fwidth(ridge)*1.5,.035);
  float bank=1.-smoothstep(frontier-.14-aa,frontier+.16+aa,ridge);
  if(sweep>0.)bank=1.-bank;
  float hollow=smoothstep(.24,.58,nearLayer);
  color=mix(uLowDeep,uLowMid,.37+farLayer*.52);
  color=mix(color,uLowLight,smoothstep(.30,.85,nearLayer)*.64);
  alpha=clamp(bank*(.76+hollow*.20)*uOpacity,0.,.96);
}
// At the origin change, the incoming and outgoing imagery is completely hidden.
// Colour still has depth at opacity 1; neither join becomes a uniform white card.
alpha=mix(alpha,1.,uGeoConceal);
gl_FragColor=vec4(color,alpha);
#include <colorspace_fragment>
`;

/** Replace only the geographic branch of the current transition shader. The two
 * existing glass/contact branches remain byte-for-byte intact, including their
 * accepted output. Do not also apply a generic output-appending helper to this
 * mixed shader: its early conversion return is intentional and independent.
 */
export function refineGeographicTransition(accepted:string){
  const marker='return;}vec2 uv=vUv+vec2(uTime*.002,0.);';
  if(accepted.split(marker).length!==2)throw new Error('Geographic transition marker changed');
  const prefix=accepted.slice(0,accepted.indexOf(marker))+'return;}';
  return geoDeclarations+prefix+geoMain+'}';
}
