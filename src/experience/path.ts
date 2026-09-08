import { CatmullRomCurve3, Vector3 } from 'three';

/** A single distance lookup owns core, trail and chase rig. No raw curve t is exposed. */
export const lightPath = new CatmullRomCurve3([
  new Vector3(-8.65, 3.0, 4.1),
  new Vector3(-12.7, 4.7, 8.8),
  new Vector3(-14, 6, 22),
  new Vector3(-6, 7, 52),
  new Vector3(6, 6, 100),
  new Vector3(16, 3, 160),
  new Vector3(18, 0, 215),
], false, 'centripetal');
lightPath.arcLengthDivisions = 1600;
lightPath.updateArcLengths();
export const FLIGHT_LENGTH = lightPath.getLength();
export const TRAIL_LENGTH = 7;
export const PATH_UP = new Vector3(0, 1, 0);
const clampDistance = (u: number) => Math.max(0, Math.min(1, u));
export function pointOnLightPath(u: number, target = new Vector3()) {
  return lightPath.getPointAt(clampDistance(u), target);
}
export function tangentOnLightPath(u: number, target = new Vector3()) {
  return lightPath.getTangentAt(clampDistance(u), target);
}
export function trailSample(head: number, behind: number, target = new Vector3()) {
  return pointOnLightPath(head - Math.max(0, behind) / FLIGHT_LENGTH, target);
}
