import {Vector3,CatmullRomCurve3} from 'three';
import {clamp,smooth,mix,fadeWindow,type Framing,type Vec3} from './progress.ts';
import {STAGE_FOUR_END,JOURNEY_END,chapterAt} from './timeline.ts';
import {ELECTRICAL_PORTS,ELECTRICAL_PATHS} from './electrical-path.ts';
import type {JourneyShot} from './journey.ts';

export interface OperationState {
 section:number;lighting:number;equipment:number;screen:number;entry:number;graphOpacity:number;
 charge:number;discharge:number;stored:number;dusk:number;importFlow:number;exportFlow:number;routeOpacity:number;
}
/** Separate moments, not a simulation of a live installation. Continuing daylight
 * precedes warm practical activation. The later storage example has finite capacity;
 * its AC converter is a separate branch, and grid import follows discharge. */
export function operationState(p:number):OperationState {
 return {section:smooth((p-4.20)/.10),lighting:smooth((p-4.355)/.085),equipment:smooth((p-4.435)/.12),screen:smooth((p-4.55)/.10),
 entry:smooth((p-4.10)/.26),graphOpacity:1-smooth((p-4.085)/.055),
 charge:fadeWindow(p,4.985,5.015,5.105,5.14),discharge:fadeWindow(p,5.29,5.32,5.405,5.43),
 stored:.24+.38*smooth((p-4.99)/.13)-.16*smooth((p-5.31)/.10),dusk:smooth((p-5.17)/.14),
 importFlow:fadeWindow(p,5.43,5.47,5.56,5.62),exportFlow:0,
 routeOpacity:fadeWindow(p,4.10,4.20,4.68,4.80)};
}
export const operationCopy=(p:number)=>[
 fadeWindow(p,4.145,4.175,4.27,4.31),
 fadeWindow(p,4.39,4.425,4.61,4.67),
 fadeWindow(p,4.985,5.02,5.095,5.14),
 fadeWindow(p,5.20,5.24,5.35,5.405),
 fadeWindow(p,5.49,5.52,5.56,5.61),
 fadeWindow(p,5.67,5.71,5.755,5.79),
 fadeWindow(p,5.81,5.845,5.885,5.925),
 fadeWindow(p,5.95,6.00,6.10,6.15),
];
export const BUSINESS_ENTRY=ELECTRICAL_PORTS.buildingEntry.clone();
export const BUSINESS_AIM=new Vector3(-22,1.8,13.5);
export const BUSINESS_ROUTE=new CatmullRomCurve3([
 BUSINESS_ENTRY.clone(),new Vector3(-39.6,.74,13.7),new Vector3(-38.9,2.7,13.7),
 new Vector3(-37.8,6.8,13.7),new Vector3(-29,6.8,13.7),new Vector3(-25,6.8,13.7),
],false,'centripetal');
BUSINESS_ROUTE.arcLengthDivisions=1200;BUSINESS_ROUTE.updateArcLengths();
const V=(x:number,y:number,z:number)=>new Vector3(x,y,z);
const knots=[4.08,4.19,4.32,4.48,4.66,4.82,4.94,5.07,5.25,5.39,5.53,5.69,5.86,6.08];
function authored(points:Vector3[]) {
 const curve=new CatmullRomCurve3(points,false,'centripetal');curve.arcLengthDivisions=1800;curve.updateArcLengths();
 const lens=curve.getLengths(1800),length=curve.getLength(),ys=points.map((_,i)=>{const f=i/(points.length-1)*1800,j=Math.floor(f);return mix(lens[j],lens[Math.min(1800,j+1)],f-j)/length;});
 const slopes=ys.slice(1).map((y,i)=>(y-ys[i])/(knots[i+1]-knots[i]));
 const derivatives=ys.map((_,i)=>i===0||i===ys.length-1||slopes[i-1]*slopes[i]<=0?0:2*slopes[i-1]*slopes[i]/(slopes[i-1]+slopes[i]));
 return(p:number)=>{if(p<=knots[0])return points[0].clone();if(p>=knots.at(-1)!)return points.at(-1)!.clone();
  const i=knots.findIndex(k=>p<k)-1,d=knots[i+1]-knots[i],t=(p-knots[i])/d;
  const u=(2*t*t*t-3*t*t+1)*ys[i]+(-2*t*t*t+3*t*t)*ys[i+1]+(t*t*t-2*t*t+t)*d*derivatives[i]+(t*t*t-t*t)*d*derivatives[i+1];
  return curve.getPointAt(clamp(u));};
}
const rigs=new Map<Framing,{camera:ReturnType<typeof authored>;aim:ReturnType<typeof authored>}>();
export function extendBusiness(progress:number,mode:Framing,accepted:JourneyShot):JourneyShot {
 const p=clamp(progress,STAGE_FOUR_END,JOURNEY_END),state=operationState(p);
 let rig=rigs.get(mode);
 if(!rig){
  const camera=[new Vector3(...accepted.camera),V(-47,3.2,11.6),V(-42,3.7,10.4),V(-34,3.8,10.9),V(-32,3.8,19),V(-36,4.1,13.8),V(-44,4.9,12),V(-49.5,3.2,-5.4),V(-49.5,3.2,-5.4),V(-55,6.5,-8),V(-53,6.2,-8.5),V(-96,46,72),V(-104,51,94),V(-104,51,94)];
  const aim=[new Vector3(...accepted.target),BUSINESS_ENTRY.clone().add(V(0,.7,0)),V(-27,2.4,14.7),V(-22,1.8,13.5),V(-22,1.9,16.8),V(-26,2.3,14.0),V(-39,2.6,7),V(-40.8,1.7,-8.4),V(-40.8,1.7,-8.4),V(-40.7,1.5,-6.5),V(-40.6,1.9,-20.0),V(-4,5,10),V(-25,8,-12),V(-25,8,-12)];
  if(mode==='portrait'){
   camera[1].x=-49;camera[2].x=-43;camera[2].z=10.6;camera[3]=V(-35.7,4.7,10.9);aim[3]=V(-22,3.2,14.0);camera[4]=V(-34,4.5,18.2);aim[4]=V(-22,3.5,19.2);
   for(const i of [7,8]){camera[i].x=-56;camera[i].y=4.6;aim[i].y=2.9;aim[i].z=-4.6;}
   camera[9]=V(-62,10,-8);aim[9].y=3.6;
   for(let i=10;i<camera.length;i++){if(i>=11)aim[i]=V(-2,9,8);camera[i].sub(aim[i]).multiplyScalar(i>=11?1.72:1.40).add(aim[i]);aim[i].y+=i>=11?15:1.4;}
  }
  if(mode==='short'){for(const i of[3,4,7,8])camera[i].y+=.5;}
  rig={camera:authored(camera),aim:authored(aim)};rigs.set(mode,rig);
 }
 const pulse=new Vector3(...accepted.pulse).lerp(BUSINESS_ROUTE.getPointAt(state.entry),smooth((p-STAGE_FOUR_END)/.15));
 return {...accepted,chapter:chapterAt(p),scene:'site',camera:rig.camera(p).toArray() as Vec3,target:rig.aim(p).toArray() as Vec3,up:[0,1,0],pulse:pulse.toArray() as Vec3,pulseOpacity:0,cloudOpacity:0,operation:state};
}
