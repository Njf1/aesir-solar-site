import {CurvePath, LineCurve3, QuadraticBezierCurve3, Vector3} from 'three';
import {ELECTRICAL_PORTS} from './electrical-path.ts';

/** Original AC-coupled example, in the existing campus's local metres (+Y up).
 * This is an explanatory arrangement, not a complete electrical design.
 * Every building-side branch starts at the established AC building entry.
 */
const V=(x:number,y:number,z:number)=>new Vector3(x,y,z);
const wall=ELECTRICAL_PORTS.buildingEntry.x;
export const STORAGE_PORTS={
  buildingAC: ELECTRICAL_PORTS.buildingEntry.clone(),
  converterAC: V(wall-.37,.475,-3.15),
  converterDC: V(wall-.46,.475,-3.70),
  converterDCReturn: V(wall-.53,.475,-3.80),
  batteryDC: V(wall-.46,.475,-4.88),
  batteryDCReturn: V(wall-.53,.475,-4.98),
  gridBuildingSide: V(wall-.37,.475,-14.63),
  gridExternalSide: V(wall-.42,.475,-15.40),
  gridBeyondSite: V(-45.8,-.30,66),
};
export const STORAGE_ANCHORS={
  batteryCentre: V(wall-.425,1.49,-5.7),
  batteryFront: V(wall-.80,1.49,-5.7),
  converterCentre: V(wall-.40,1.305,-3.42),
  converterFront: V(wall-.735,1.305,-3.42),
  gridCentre: V(wall-.37,1.365,-15),
  gridFront: V(wall-.68,1.365,-15),
  storedIndicator: V(wall-.827,1.92,-6.25),
  batteryLabel: V(wall-.84,2.75,-5.7),
  converterLabel: V(wall-.78,2.37,-3.42),
  dcLinkLabel: V(wall-.65,.67,-4.35),
  gridLabel: V(wall-.76,2.55,-15),
  buriedRouteLabel: V(-43,.40,-12.3),
  storageView: V(-46.7,2.8,-3.5),
  gridView: V(-46.3,2.6,-12.5),
  serviceBus: V(wall-.32,.74,8.4),
  ...STORAGE_PORTS,
};

function rounded(nodes:Vector3[],radius=.13){
  const path=new CurvePath<Vector3>();let from=nodes[0].clone();
  for(let i=1;i<nodes.length-1;i++){
    const a=nodes[i-1],b=nodes[i],c=nodes[i+1],r=Math.min(radius,b.distanceTo(a)*.28,b.distanceTo(c)*.28);
    const enter=b.clone().addScaledVector(a.clone().sub(b).normalize(),r),leave=b.clone().addScaledVector(c.clone().sub(b).normalize(),r);
    path.add(new LineCurve3(from,enter));path.add(new QuadraticBezierCurve3(enter,b.clone(),leave));from=leave;
  }
  path.add(new LineCurve3(from,nodes[nodes.length-1].clone()));path.arcLengthDivisions=1400;path.updateArcLengths();return path;
}
export const STORAGE_ROUTE_NODES={
  // Positive direction: shared AC connection -> separate converter -> battery.
  storageAC:[STORAGE_PORTS.buildingAC.clone(),V(wall-.32,.74,13.7),V(wall-.32,.74,-2.61),V(wall-.32,.405,-2.61),V(wall-.37,.405,-3.15),STORAGE_PORTS.converterAC.clone()],
  batteryDC:[STORAGE_PORTS.converterDC.clone(),V(wall-.46,.415,-3.70),V(wall-.46,.415,-4.88),STORAGE_PORTS.batteryDC.clone()],
  batteryDCReturn:[STORAGE_PORTS.converterDCReturn.clone(),V(wall-.53,.415,-3.80),V(wall-.53,.415,-4.98),STORAGE_PORTS.batteryDCReturn.clone()],
  // Positive direction: building -> grid cabinet -> buried connection (export).
  // Import uses these exact curves with the animation direction reversed.
  // This run uses the rear service gap (x=-40.185), rather than cutting through
  // the storage cabinets whose rear faces begin at x=-40.225 / -40.240.
  gridAC:[STORAGE_PORTS.buildingAC.clone(),V(wall-.045,.57,13.7),V(wall-.045,.57,-14.00),V(wall-.045,.405,-14.00),V(wall-.37,.405,-14.63),STORAGE_PORTS.gridBuildingSide.clone()],
  gridDescent:[STORAGE_PORTS.gridExternalSide.clone(),V(wall-.42,.10,-15.40),V(wall-.42,-.30,-15.40)],
  buriedGrid:[STORAGE_PORTS.gridExternalSide.clone(),V(wall-.42,-.30,-15.40),V(-43,-.30,-15.40),V(-43,-.30,39),V(-45.8,-.30,43),STORAGE_PORTS.gridBeyondSite.clone()],
  // Deliberately a surface annotation of the buried route, not a physical cable.
  // The two paving edges use separate levels: asphalt ~.05m, footpath top .23m.
  gridMarker:[V(wall-.42,.078,-15.40),V(-41.52,.078,-15.40),V(-41.68,.239,-15.40),V(-43,.239,-15.40),V(-43,.239,38.92),V(-43,.078,39.16),V(-45.8,.078,43),V(-45.8,.078,63.7)],
};
export const STORAGE_PATHS={
  storageAC:rounded(STORAGE_ROUTE_NODES.storageAC,.12),
  batteryDC:rounded(STORAGE_ROUTE_NODES.batteryDC,.055),
  batteryDCReturn:rounded(STORAGE_ROUTE_NODES.batteryDCReturn,.055),
  gridAC:rounded(STORAGE_ROUTE_NODES.gridAC,.12),
  gridDescent:rounded(STORAGE_ROUTE_NODES.gridDescent,.05),
  buriedGrid:rounded(STORAGE_ROUTE_NODES.buriedGrid,.6),
  gridMarker:rounded(STORAGE_ROUTE_NODES.gridMarker,.07),
};
