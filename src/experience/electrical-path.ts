import * as THREE from 'three';
import { HERO_ANCHOR, HERO_NORMAL, ROOF_Y } from './site-layout.ts';

/** Original, generic electrical illustration. Local metres match the existing campus.
 * This represents a DC route from the larger rooftop array, not a complete string design.
 * The separate waveform overlay describes voltage versus time, never cable shape.
 */
export type ElectricalTier = 'mobile' | 'desktop';
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const clamp = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));
const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const tilt = Math.atan2(HERO_NORMAL.z, HERO_NORMAL.y);
const heroCentre = HERO_ANCHOR.clone().addScaledVector(HERO_NORMAL, -.058);
const source = (side: number) => V(side * .09, -.13, .10).applyAxisAngle(V(1, 0, 0), tilt).add(heroCentre);

export const ELECTRICAL_PORTS = {
  dcPositive: V(-40.425, 1.567, 17.76),
  dcNegative: V(-40.425, 1.567, 17.91),
  acOutput: V(-40.425, 1.567, 18.29),
  buildingEntry: V(-40.14, .74, 13.7),
};
export const ELECTRICAL_ANCHORS = {
  heroGlass: HERO_ANCHOR.clone(), dcSourcePositive: source(1), dcSourceNegative: source(-1),
  inverterCentre: V(-40.405, 2.34, 18), inverterFront: V(-40.62, 2.34, 18),
  roofPerimeter: V(-24.5, ROOF_Y + .245, 23.3), parapetSaddle: V(-40.2, ROOF_Y + .57, 23.3),
  westDescent: V(-40.47, 7.2, 23.3),
  overlayCentre: V(-40.645, 2.39, 15.86),
  dcLabel: V(-40.66, 2.99, 15.29), acLabel: V(-40.66, 2.99, 16.39),
  timeLabel: V(-40.66, 1.84, 15.86),
  ...ELECTRICAL_PORTS,
};

/** Rounded, bounded bends; all getPointAt/getTangentAt consumers share this distance lookup. */
function roundedPath(nodes: THREE.Vector3[], radius = .16) {
  const path = new THREE.CurvePath<THREE.Vector3>();
  let from = nodes[0].clone();
  for (let i = 1; i < nodes.length - 1; i++) {
    const a = nodes[i - 1], b = nodes[i], c = nodes[i + 1];
    const r = Math.min(radius, b.distanceTo(a) * .28, c.distanceTo(b) * .28);
    const enter = b.clone().addScaledVector(a.clone().sub(b).normalize(), r);
    const leave = b.clone().addScaledVector(c.clone().sub(b).normalize(), r);
    path.add(new THREE.LineCurve3(from, enter));
    path.add(new THREE.QuadraticBezierCurve3(enter, b.clone(), leave));
    from = leave;
  }
  path.add(new THREE.LineCurve3(from, nodes[nodes.length - 1].clone()));
  path.arcLengthDivisions = 1400; path.updateArcLengths(); return path;
}
function dcNodes(side: number, port: THREE.Vector3) {
  const wx = -40.47 + side * .015;
  return [source(side), V(-10 + side * .025, ROOF_Y + .13, 10.42), V(-10 + side * .025, ROOF_Y + .13, 22.11),
    V(-10 + side * .025, ROOF_Y + .13, 22.70), V(-10 + side * .025, ROOF_Y + .245, 23.3 + side * .035),
    V(-38.9, ROOF_Y + .245, 23.3 + side * .035), V(-39.37, ROOF_Y + .57, 23.3 + side * .035),
    V(wx, ROOF_Y + .57, 23.3 + side * .035), V(wx, 3.63 + side * .025, 23.3 + side * .035),
    V(wx, 3.63 + side * .025, 17.18 + side * .025), V(wx, 1.27 - side * .025, 17.18 + side * .025),
    V(wx, 1.27 - side * .025, port.z), V(port.x, 1.34, port.z), port.clone()];
}
export const ELECTRICAL_ROUTE_NODES = {
  dcPositive: dcNodes(1, ELECTRICAL_PORTS.dcPositive),
  dcNegative: dcNodes(-1, ELECTRICAL_PORTS.dcNegative),
  acOutput: [ELECTRICAL_PORTS.acOutput.clone(), V(-40.425, 1.14, 18.29), V(-40.46, .74, 18.29), V(-40.46, .74, 13.7), ELECTRICAL_PORTS.buildingEntry.clone()],
};
export const ELECTRICAL_PATHS = {
  dcPositive: roundedPath(ELECTRICAL_ROUTE_NODES.dcPositive),
  dcNegative: roundedPath(ELECTRICAL_ROUTE_NODES.dcNegative),
  acOutput: roundedPath(ELECTRICAL_ROUTE_NODES.acOutput, .18),
};
