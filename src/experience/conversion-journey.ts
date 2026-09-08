import {Vector3,CatmullRomCurve3} from 'three';
import {clamp,smooth,mix,fadeWindow,type Framing,type Vec3} from './progress.ts';
import {STAGE_THREE_END,JOURNEY_END,CELL_SWITCH,CELL_EXIT,chapterAt} from './timeline.ts';
import {HERO_ANCHOR,HERO_NORMAL} from './site-layout.ts';
import {PANEL_ROTATION,PANEL_NORMAL,PANEL_DOWN,TARGET_CELL_WORLD,siteToCell,cellToSite,siteDirectionToCell} from './panel-layout.ts';
import {ELECTRICAL_PATHS,ELECTRICAL_ANCHORS} from './electrical-path.ts';
import type {JourneyShot} from './journey.ts';
const v=(a:Vec3)=>new Vector3(...a),a=(v:Vector3)=>v.toArray() as Vec3;
export const ABSORPTION_POINT=new Vector3(-.9,0,0);
export const MODULE_RETURN_CAMERA=new Vector3(-10,11.32,8.68);
export const MODULE_JUNCTION=HERO_ANCHOR.clone().addScaledVector(PANEL_NORMAL,-.058).add(new Vector3(0,-.02,-.28).applyQuaternion(PANEL_ROTATION));
export interface ConversionState{section:number;absorption:number;extraction:number;incident:number;energyU:number;ac:number;transition:number;transitionKind:'glass'|'contact';}
export function conversionState(p:number):ConversionState{
 const absorption=smooth((p-2.655)/.055),extraction=smooth((p-2.71)/.14);
 return{section:smooth((p-2.40)/.12),absorption,extraction,incident:1-absorption,
 energyU:smooth((p-CELL_EXIT)/(.65)),ac:smooth((p-3.80)/.18),
 transition:Math.max(fadeWindow(p,2.348,2.375,2.385,2.416),fadeWindow(p,3.052,3.075,3.085,3.112)),
 transitionKind:p<2.8?'glass':'contact'};
}
export const conversionCopy=(p:number)=>[
 fadeWindow(p,2.42,2.455,2.515,2.555),
 fadeWindow(p,2.60,2.635,2.795,2.845),
 fadeWindow(p,3.17,3.205,3.40,3.47),
 fadeWindow(p,3.62,3.665,3.76,3.80),
];
function makeCurve(points:Vector3[]){const c=new CatmullRomCurve3(points,false,'centripetal');c.arcLengthDivisions=1800;c.updateArcLengths();return c;}
const glassPath=makeCurve([HERO_ANCHOR.clone().addScaledVector(HERO_NORMAL,.045),HERO_ANCHOR.clone().addScaledVector(PANEL_NORMAL,.04).lerp(TARGET_CELL_WORLD.clone().addScaledVector(PANEL_NORMAL,.04),.65),TARGET_CELL_WORLD.clone().addScaledVector(PANEL_NORMAL,.02)]);
const photonPath=makeCurve([new Vector3(0,1.8,0),new Vector3(-.4,1.1,.03),ABSORPTION_POINT]);
/** Monotone, distance-based schedule. Interior landmarks retain speed; stationary
 * endpoints permit clean reversible coordinate joins without spring state. */
function authored(points:Vector3[],knots:number[]){
 const curve=makeCurve(points),lens=curve.getLengths(1800),total=curve.getLength();
 const ys=points.map((_,i)=>{const index=i/(points.length-1)*1800,lo=Math.floor(index);return mix(lens[lo],lens[Math.min(1800,lo+1)],index-lo)/total;});
 const slopes=ys.slice(1).map((n,i)=>(n-ys[i])/(knots[i+1]-knots[i])),ms=ys.map((_,i)=>i===0||i===ys.length-1?0:2*slopes[i-1]*slopes[i]/(slopes[i-1]+slopes[i]));
 return{curve,point(p:number,target=new Vector3()){
  if(p<=knots[0])return curve.getPointAt(0,target);if(p>=knots.at(-1)!)return curve.getPointAt(1,target);
  const i=knots.findIndex(k=>p<k)-1,span=knots[i+1]-knots[i],t=(p-knots[i])/span;
  const u=(2*t*t*t-3*t*t+1)*ys[i]+(-2*t*t*t+3*t*t)*ys[i+1]+(t*t*t-2*t*t+t)*ms[i]*span+(t*t*t-t*t)*ms[i+1]*span;
  return curve.getPointAt(clamp(u),target);
 }};
}
const CELL_ENTRY_CAMERA=TARGET_CELL_WORLD.clone().addScaledVector(PANEL_NORMAL,.10).addScaledVector(PANEL_DOWN,.09);
const CELL_ENTRY_AIM=TARGET_CELL_WORLD.clone();
const cellKnots=[CELL_SWITCH,2.52,2.70,2.88,2.965,3.018,3.055,CELL_EXIT];
const cellCamera=authored([siteToCell(CELL_ENTRY_CAMERA),new Vector3(6.8,3.5,7.8),new Vector3(6.2,2.5,7.2),new Vector3(5.5,3.4,9),new Vector3(8,12,-28),new Vector3(-4,10,-64),new Vector3(-4,-10,-67),siteToCell(MODULE_RETURN_CAMERA)],cellKnots);
const cellAim=authored([siteToCell(CELL_ENTRY_AIM),new Vector3(-3,0,0),new Vector3(-3,-.05,0),new Vector3(-1,-.1,0),new Vector3(-3,0,-10),new Vector3(-4,-.4,-24),siteToCell(MODULE_JUNCTION),siteToCell(MODULE_JUNCTION)],cellKnots);
const dcKnots=[CELL_EXIT,3.145,3.25,3.40,3.51,3.63,3.75,3.91,JOURNEY_END];
const dcCamera=authored([MODULE_RETURN_CAMERA,new Vector3(-10,14.5,8.68),new Vector3(-6,14,16.5),new Vector3(-21,14,28.5),new Vector3(-45,15,28),new Vector3(-48,7,25),new Vector3(-46,3.2,21.5),new Vector3(-45.8,2.8,18),new Vector3(-46.8,2.8,18)],dcKnots);
const dcAim=authored([MODULE_JUNCTION,new Vector3(-10,11.25,10.5),new Vector3(-10,11.2,21),new Vector3(-28,11.3,23.3),new Vector3(-40.5,10,23.3),new Vector3(-40.5,4,20.3),new Vector3(-40.6,2.4,17),new Vector3(-40.6,2.35,15.8),new Vector3(-40.6,2.35,15.8)],dcKnots);
export function extendConversion(progress:number,mode:Framing,accepted:JourneyShot):JourneyShot{
 const p=clamp(progress,STAGE_THREE_END,JOURNEY_END),state=conversionState(p);
 const shot={...accepted,chapter:chapterAt(p),cloudOpacity:0,conversion:state,pulseOpacity:0} as JourneyShot;
 if(p<CELL_SWITCH){
  const t=smooth((p-STAGE_THREE_END)/(CELL_SWITCH-STAGE_THREE_END));
  shot.camera=a(v(accepted.camera).lerp(CELL_ENTRY_CAMERA,t));shot.target=a(v(accepted.target).lerp(CELL_ENTRY_AIM,t));
  shot.guidePath='glass';shot.guideU=t;shot.pulse=a(glassPath.getPointAt(t));shot.tangent=a(glassPath.getTangentAt(t));shot.pulseOpacity=.95;shot.trailLength=mix(.10,.035,t);return shot;
 }
 if(p<CELL_EXIT){
  const cam=cellCamera.point(p),aim=cellAim.point(p),adapt=Math.sin(Math.PI*clamp((p-CELL_SWITCH)/(CELL_EXIT-CELL_SWITCH)))**2;
  if(mode==='portrait'){cam.sub(aim).multiplyScalar(1+adapt*.62).add(aim);aim.y+=adapt*2.3;}
  if(mode==='short'){cam.y+=adapt*1.2;cam.z+=adapt*1.4;}
  const tiltBlend=smooth((p-CELL_SWITCH)/.10)*(1-smooth((p-2.99)/.09));
  shot.up=a(siteDirectionToCell(new Vector3(0,1,0)).lerp(new Vector3(0,1,0),tiltBlend).normalize());
  shot.scene='cell';shot.camera=a(cam);shot.target=a(aim);shot.guidePath='cell';shot.guideU=smooth((p-CELL_SWITCH)/(2.67-CELL_SWITCH));
  shot.pulse=a(photonPath.getPointAt(shot.guideU));shot.tangent=a(photonPath.getTangentAt(shot.guideU));shot.pulseOpacity=.95*state.incident;shot.trailLength=.8;return shot;
 }
 const cam=dcCamera.point(p),aim=dcAim.point(p),adapt=smooth((p-CELL_EXIT)/.12);
 if(mode==='portrait'){const late=smooth((p-3.52)/.16);cam.sub(aim).multiplyScalar(1+adapt*(.25+.70*late)).add(aim);cam.y+=adapt*(1-late)*1.3;aim.y+=late*.54;cam.lerp(new Vector3(-53,4.3,17.3),late);aim.lerp(new Vector3(-40.6,3.1,16.95),late);aim.lerp(ELECTRICAL_PATHS.dcPositive.getPointAt(state.energyU),.5*fadeWindow(p,3.15,3.22,3.57,3.68));}
 if(mode==='short')cam.y+=Math.sin(Math.PI*(p-CELL_EXIT)/(JOURNEY_END-CELL_EXIT))**2*.65;
 shot.scene='site';shot.camera=a(cam);shot.target=a(aim);shot.up=[0,1,0];shot.pulse=a(ELECTRICAL_PATHS.dcPositive.getPointAt(state.energyU));shot.tangent=a(ELECTRICAL_PATHS.dcPositive.getTangentAt(state.energyU));shot.guidePath='site';shot.pulseOpacity=0;return shot;
}
export function conversionGuideDistance(shot:JourneyShot,behind:number){const path=shot.guidePath==='glass'?glassPath:photonPath;return shot.guideU*path.getLength()-Math.max(0,behind);}
export function sampleConversionGuide(shot:JourneyShot,behind:number,target=new Vector3()){
 const distance=conversionGuideDistance(shot,behind),path=shot.guidePath==='glass'?glassPath:photonPath;
 if(distance<0&&shot.guidePath==='cell')return siteToCell(glassPath.getPointAt(clamp(1+distance/50/glassPath.getLength()),target),target);
 return path.getPointAt(clamp(distance/path.getLength()),target);
}
export function conversionGuideTangent(shot:JourneyShot,behind:number,target=new Vector3()){
 const distance=conversionGuideDistance(shot,behind),path=shot.guidePath==='glass'?glassPath:photonPath;
 if(distance<0&&shot.guidePath==='cell')return siteDirectionToCell(glassPath.getTangentAt(clamp(1+distance/50/glassPath.getLength()),target),target);
 return path.getTangentAt(clamp(distance/path.getLength()),target);
}

