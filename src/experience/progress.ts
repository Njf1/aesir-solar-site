import { Vector3 } from 'three';
import { pointOnLightPath, tangentOnLightPath, FLIGHT_LENGTH } from './path.ts';
export type Vec3 = [number, number, number];
export type Framing = 'landscape' | 'portrait' | 'short';
export const PORTRAIT_WIDTH = 760;
export const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, Number.isFinite(n) ? n : 0));
export const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const framingFor = (width: number, height: number): Framing => height < 570 && width > height ? 'short' : width < PORTRAIT_WIDTH || width / height < .9 ? 'portrait' : 'landscape';
export function fadeWindow(p: number, a: number, b: number, c: number, d: number) {
  return smooth((p - a) / (b - a)) * (1 - smooth((p - c) / (d - c)));
}
// Names, start/end and fade windows deliberately share one authoritative chapter value.
export const COPY_WINDOWS = [
  [-.03, 0, .10, .16],
  [.16, .21, .27, .33],
  [.48, .53, .60, .65],
  [.86, .89, .95, .99],
] as const;
export function copyOpacities(p: number) { return COPY_WINDOWS.map(w => fadeWindow(p, w[0], w[1], w[2], w[3])); }
export const EARTH_SWITCH = .735;
export const EARTH_POSITION: Vec3 = [18, 0, 298];
const array = (v: Vector3): Vec3 => [v.x, v.y, v.z];
const blend = (a: Vec3, b: Vec3, t: number): Vec3 => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

export type Shot = {
  camera: Vec3; target: Vec3; pulse: Vec3; tangent: Vec3;
  flight: number; chapter: number; scene: 'solar' | 'earth';
  earthVisibility: number; pulseOpacity: number; sourceGlint: number;
};
export function sampleJourney(progress: number, framing: Framing | boolean = 'landscape'): Shot {
  const p = clamp(progress);
  const mode = typeof framing === 'boolean' ? framing ? 'portrait' : 'landscape' : framing;
  const portrait = mode === 'portrait';
  // The first deliberate scroll closes distance immediately. A short hold develops the limb.
  const approach = 1 - Math.pow(1 - clamp(p / .30), 1.3);
  const z = Math.exp(mix(Math.log(1200), Math.log(portrait ? 45 : 26.5), approach));
  const intimate = smooth((p - .30) / .09);
  const solarCamera: Vec3 = [mix(0, -1.5, intimate), 0, z - intimate * (portrait ? 2 : 1.8)];
  const solarTarget: Vec3 = [portrait ? 0 : -z * .26, portrait ? z * .16 + 1.5 : .7, 0];
  const acquisition = smooth((p - .39) / .12);
  const flightTime = clamp((p - .405) / .37);
  // Distance acceleration, not exponential time chasing; reversing reconstructs the same state.
  const flight = .96 * flightTime * flightTime;
  const pulse = pointOnLightPath(flight);
  const tangent = tangentOnLightPath(flight);
  const right = new Vector3().crossVectors(tangent, new Vector3(0, 1, 0)).normalize();
  const chaseDistance = mix(15, 12, smooth((p - .44) / .23));
  const chase = pulse.clone().addScaledVector(tangent, -chaseDistance).addScaledVector(right, portrait ? 1.2 : 4.2);
  chase.y += portrait ? 4.1 : 2.2;
  const aim = pointOnLightPath(flight + smooth((p-.46)/.05)*5 / FLIGHT_LENGTH);
  frameFlightAim(chase,aim,mode,p);
  const cameraSolar = blend(solarCamera, array(chase), acquisition);
  const turn=clamp((p-.39)/.12);
  cameraSolar[0]-=20*Math.pow(Math.sin(Math.PI*turn),2);
  // The acquisition arc skirts the photosphere; never interpolate through the star.
  const radius=Math.hypot(...cameraSolar), clearance=13.0;
  const difference=radius-clearance;
  const safeRadius=clearance+.5*(difference+Math.sqrt(difference*difference+.35));
  if(p<.60)for(let i=0;i<3;i++)cameraSolar[i]*=mix(safeRadius/radius,1,smooth((p-.55)/.05));
  const targetSolar = blend(solarTarget, array(aim), smooth((p-.34)/.11));
  // At a distant-earth view we subtract one bounded origin. Both camera and every retained
  // object use the same subtraction, so this coordinate change is pixel-identical in reverse.
  const arrival = clamp((p - .75) / .20);
  const startShot = ARRIVAL_POSES[mode];
  const endCamera: Vec3 = portrait ? [5, 5, -39] : mode === 'short' ? [-4, 6, -33] : [2, 5, -28];
  const endTarget: Vec3 = portrait ? [0, 8.6, 0] : [8.5, 1, 0];
  const rebasedCamera: Vec3 = [cameraSolar[0] - EARTH_POSITION[0], cameraSolar[1], cameraSolar[2] - EARTH_POSITION[2]];
  const rebasedTarget: Vec3 = [targetSolar[0] - EARTH_POSITION[0], targetSolar[1], targetSolar[2] - EARTH_POSITION[2]];
  const camera = p >= .75 ? hermite(startShot.pose.camera, endCamera, startShot.velocity.camera, arrival) : rebasedCamera;
  const target = p >= .75 ? hermite(startShot.pose.target, endTarget, startShot.velocity.target, arrival) : rebasedTarget;
  return {
    camera: p < EARTH_SWITCH ? cameraSolar : camera,
    target: p < EARTH_SWITCH ? targetSolar : target,
    pulse: p < EARTH_SWITCH ? array(pulse) : [pulse.x - EARTH_POSITION[0], pulse.y, pulse.z - EARTH_POSITION[2]],
    tangent: array(tangent), flight, chapter: p < .16 ? 0 : p < .48 ? 1 : p < .79 ? 2 : 3,
    scene: p < EARTH_SWITCH ? 'solar' : 'earth',
    earthVisibility: smooth((p - .605) / .04),
    pulseOpacity: smooth((p - .385) / .035) * (1 - smooth((p - .735) / .025)),
    sourceGlint: 1 - smooth((p - .045) / .10),
  };
}
function arrivalStart(mode: Framing, p = .75) {
  const flightTime = (p - .405) / .37;
  const u = .96 * flightTime * flightTime;
  const pulse = pointOnLightPath(u), tangent = tangentOnLightPath(u);
  const right = new Vector3().crossVectors(tangent, new Vector3(0, 1, 0)).normalize();
  const camera = pulse.clone().addScaledVector(tangent, -12).addScaledVector(right, mode === 'portrait' ? 1.2 : 4.2);
  camera.y += mode === 'portrait' ? 4.1 : 2.2;
  const target = pointOnLightPath(u + 5 / FLIGHT_LENGTH);
  frameFlightAim(camera,target,mode,p);
  camera.x -= EARTH_POSITION[0]; camera.z -= EARTH_POSITION[2];
  target.x -= EARTH_POSITION[0]; target.z -= EARTH_POSITION[2];
  return {camera: array(camera), target: array(target)};
}

function frameFlightAim(camera:Vector3,target:Vector3,mode:Framing,p:number) {
  if(mode!=='portrait')return;
  const earthAim=new Vector3(...EARTH_POSITION).sub(camera).normalize().multiplyScalar(camera.distanceTo(target)).add(camera);
  target.lerp(earthAim,.30*smooth((p-.53)/.07));
}

// C1 arrival: preserve incoming translation and aim velocity, then ease to a still orbit.
function hermite(a: Vec3, b: Vec3, velocity: Vec3, t: number): Vec3 {
  const t2=t*t,t3=t2*t;
  return a.map((v,i)=>(2*t3-3*t2+1)*v+(-2*t3+3*t2)*b[i]+(t3-2*t2+t)*velocity[i]*.20) as Vec3;
}
function arrivalPose(mode: Framing) {
  const epsilon=.00001, before=arrivalStart(mode,.75-epsilon),after=arrivalStart(mode,.75+epsilon);
  const derivative=(a:Vec3,b:Vec3)=>a.map((v,i)=>(b[i]-v)/(2*epsilon)) as Vec3;
  return {pose:arrivalStart(mode),velocity:{camera:derivative(before.camera,after.camera),target:derivative(before.target,after.target)}};
}
const ARRIVAL_POSES={landscape:arrivalPose('landscape'),portrait:arrivalPose('portrait'),short:arrivalPose('short')};
