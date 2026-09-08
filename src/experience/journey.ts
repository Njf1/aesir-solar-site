import {extendConversion,conversionGuideDistance,conversionGuideTangent,sampleConversionGuide,conversionCopy,type ConversionState} from './conversion-journey.ts';
import {CatmullRomCurve3,Vector3} from 'three';
import {sampleJourney as sampleAccepted,clamp,smooth,mix,copyOpacities as acceptedCopy,fadeWindow,EARTH_POSITION,type Vec3,type Framing,type Shot} from './progress.ts';
import {pointOnLightPath,tangentOnLightPath,FLIGHT_LENGTH} from './path.ts';
import {REGION_SWITCH,SITE_SWITCH,JOURNEY_END,STAGE_THREE_END,STILL_VIEWS,chapterAt} from './timeline.ts';
import {LOCAL_UP,LOCAL_SOUTH,LOCAL_EAST,REGION_ORIGIN,earthToRegion,directionToRegion,SITE_ORIGIN,SITE_TRANSITION_SCALE,regionToSite} from './geography.ts';
import {HERO_ANCHOR,HERO_NORMAL} from './site-layout.ts';
const v=(a:Vec3)=>new Vector3(...a),arr=(v:Vector3)=>v.toArray() as Vec3;
const tupleMix=(a:Vec3,b:Vec3,t:number)=>a.map((n,i)=>mix(n,b[i],t)) as Vec3;
const curve=(points:Vector3[])=>{const c=new CatmullRomCurve3(points,false,'centripetal');c.arcLengthDivisions=1600;c.updateArcLengths();return c;};
const GUIDE_JOIN=.735;
const start=sampleAccepted(GUIDE_JOIN),orbitalStart=v(start.pulse);
const orbitalPath=curve([orbitalStart,orbitalStart.clone().addScaledVector(v(start.tangent),28),new Vector3(.6,3,-48),new Vector3(1,5,-22),new Vector3(.9,7.5,-12),REGION_ORIGIN.clone().addScaledVector(LOCAL_UP,.6)]);
const orbitalLength=orbitalPath.getLength();
const incomingGuideSpeed=pointOnLightPath(sampleAccepted(GUIDE_JOIN+.00001).flight).distanceTo(pointOnLightPath(sampleAccepted(GUIDE_JOIN-.00001).flight))/.00002;
const orbitCamera=REGION_ORIGIN.clone().addScaledVector(LOCAL_UP,4.8).addScaledVector(LOCAL_SOUTH,2.8).addScaledVector(LOCAL_EAST,.3);
const orbitTarget=REGION_ORIGIN.clone();
const siteGuidePath=curve([new Vector3(20,70,35),new Vector3(30,36,22),new Vector3(28,15.0,10),new Vector3(12,12.8,10),new Vector3(-7,12.4,10),HERO_ANCHOR.clone().addScaledVector(HERO_NORMAL,.045)]);
const SITE_CAMERA_START=new Vector3(115,135,165),SITE_AIM_START=new Vector3(0,12,0);
const siteCameraPath=curve([SITE_CAMERA_START,new Vector3(82,74,105),new Vector3(45,35,44),new Vector3(20,19.5,20),new Vector3(-4,14.3,14.8),HERO_ANCHOR.clone().add(new Vector3(.38,.66,.9))]);
const siteAimPath=curve([SITE_AIM_START,new Vector3(0,10,0),new Vector3(13,12,8),new Vector3(5,12,10),HERO_ANCHOR.clone(),HERO_ANCHOR.clone().addScaledVector(HERO_NORMAL,.02)]);
const regionCameraStart=earthToRegion(orbitCamera),regionAimStart=earthToRegion(orbitTarget);
const regionCameraEnd=SITE_CAMERA_START.clone().multiplyScalar(SITE_TRANSITION_SCALE).add(SITE_ORIGIN),regionAimEnd=SITE_AIM_START.clone().multiplyScalar(SITE_TRANSITION_SCALE).add(SITE_ORIGIN);
const regionGuideStart=earthToRegion(orbitalPath.getPointAt(1)),regionGuideEnd=siteGuidePath.getPointAt(0).multiplyScalar(SITE_TRANSITION_SCALE).add(SITE_ORIGIN);
const regionGuidePath=curve([regionGuideStart,regionGuideStart.clone().addScaledVector(directionToRegion(orbitalPath.getTangentAt(1)),.7),regionGuideEnd.clone().addScaledVector(siteGuidePath.getTangentAt(0),-.7),regionGuideEnd]);
// Each curve is still sampled by distance. These monotone distance schedules place
// its authored landmarks at useful scroll positions without stopping at every knot.
const siteKnots=[1.55,1.72,1.84,1.94,2.10,2.25];
function distanceSchedule(path:CatmullRomCurve3){
 const lengths=path.getLengths(1600),total=lengths[1600];
 const ys=siteKnots.map((_,i)=>lengths[i*320]/total);
 const slopes=ys.slice(1).map((y,i)=>(y-ys[i])/(siteKnots[i+1]-siteKnots[i]));
 const ms=ys.map((_,i)=>i===0||i===ys.length-1?0:2*slopes[i-1]*slopes[i]/(slopes[i-1]+slopes[i]));
 return(p:number)=>{const i=Math.max(0,Math.min(siteKnots.length-2,siteKnots.findIndex(x=>p<x)-1));
  if(p>=STAGE_THREE_END)return 1;const span=siteKnots[i+1]-siteKnots[i];return hermite(ys[i],ys[i+1],ms[i]*span,ms[i+1]*span,clamp((p-siteKnots[i])/span));};
}
const cameraDistance=distanceSchedule(siteCameraPath),aimDistance=distanceSchedule(siteAimPath),guideDistance=distanceSchedule(siteGuidePath);
export type JourneyShot=Omit<Shot,'scene'> & {scene:'solar'|'earth'|'region'|'site'|'cell';up:Vec3;guidePath:'solar'|'orbital'|'region'|'site'|'glass'|'cell';guideU:number;trailLength:number;cloudOpacity:number;regionEmphasis:number;guideScale:number;conversion?:ConversionState};
function hermite(a:number,b:number,m0:number,m1:number,t:number){return(2*t*t*t-3*t*t+1)*a+(-2*t*t*t+3*t*t)*b+(t*t*t-2*t*t+t)*m0+(t*t*t-t*t)*m1;}
function orbitalU(p:number){if(p<=.95)return clamp(hermite(0,.94,incomingGuideSpeed/orbitalLength*.215,.025,clamp((p-GUIDE_JOIN)/.215)));const t=clamp((p-.95)/.35);return hermite(.94,1,.025/.215*.35,0,t);}
export function journeyCopy(p:number,still=false){
 if(still){const index=Object.values(STILL_VIEWS).findIndex(value=>value===p);if(index>=0){const values=Array(11).fill(0);values[[1,3,4,5,6,8,9,10][index]]=1;return values;}}
 const first=acceptedCopy(p);return [...first,
 Math.max(fadeWindow(p,1.025,1.07,1.20,1.24),fadeWindow(p,1.345,1.375,1.40,1.43)),
 fadeWindow(p,1.65,1.69,1.77,1.83),fadeWindow(p,2.06,2.10,2.16,2.21),...conversionCopy(p)];
}
export function sampleJourney(progress:number,mode:Framing='landscape'):JourneyShot{
 const p=clamp(progress,0,STAGE_THREE_END),accepted=sampleAccepted(Math.min(1,p),mode);
 let shot:JourneyShot={...accepted,up:[0,1,0],guidePath:'solar',guideU:accepted.flight,trailLength:7,cloudOpacity:0,regionEmphasis:0,guideScale:1};
 if(p>=GUIDE_JOIN){const u=orbitalU(p);shot.pulse=arr(orbitalPath.getPointAt(u));shot.tangent=arr(orbitalPath.getTangentAt(u));shot.guidePath='orbital';shot.guideU=u;shot.pulseOpacity=1;shot.trailLength=mix(7,.35,smooth((p-.84)/.16));}
 if(p>1&&p<REGION_SWITCH){
  const t=smooth((p-1)/(REGION_SWITCH-1));
  const endCam=orbitCamera.clone().addScaledVector(LOCAL_UP,mode==='portrait'?2:0);
  // The camera rises around the sphere towards Britain's outward normal, with north held up.
  const first=v(sampleAccepted(1,mode).camera),radius=mix(first.length(),endCam.length(),t);
  shot.camera=arr(first.normalize().lerp(endCam.clone().normalize(),t).normalize().multiplyScalar(radius));
  shot.target=tupleMix(sampleAccepted(1,mode).target,arr(orbitTarget),t);
  shot.up=arr(new Vector3(0,1,0).lerp(LOCAL_SOUTH.clone().negate(),t).normalize());
 }
 if(p>=REGION_SWITCH&&p<SITE_SWITCH){
  const t=smooth((p-REGION_SWITCH)/(SITE_SWITCH-REGION_SWITCH));
  const first=regionCameraStart.clone();if(mode==='portrait')first.y+=2*6.371;
  const end=regionCameraEnd.clone();if(mode==='portrait'){const expanded=SITE_CAMERA_START.clone().add(new Vector3(0,50,25)).sub(SITE_AIM_START).multiplyScalar(2.6).add(SITE_AIM_START);end.copy(expanded.multiplyScalar(SITE_TRANSITION_SCALE).add(SITE_ORIGIN));}
  shot.camera=arr(first.lerp(end,t));shot.target=arr(regionAimStart.clone().lerp(regionAimEnd,t));
  // Finish changing from geographic north-up to a normal oblique aerial rig under the cloud.
  shot.up=arr(new Vector3(0,0,-1).lerp(new Vector3(0,1,0),smooth((p-REGION_SWITCH)/.09)).normalize());
  shot.scene='region';shot.guidePath='region';shot.guideU=t;shot.pulse=arr(regionGuidePath.getPointAt(t));shot.tangent=arr(regionGuidePath.getTangentAt(t));shot.trailLength=.65;shot.guideScale=6.371;
 }
 if(p>=SITE_SWITCH){
  const t=clamp((p-SITE_SWITCH)/(STAGE_THREE_END-SITE_SWITCH));
  // Shared distance samples; positional schedules are independent of render/scroll direction.
  const travel=guideDistance(p);
  const camera=siteCameraPath.getPointAt(cameraDistance(p)),target=siteAimPath.getPointAt(aimDistance(p));
  if(mode==='portrait'){camera.add(new Vector3(0,50*Math.pow(1-travel,2),25*Math.pow(1-travel,2)));target.lerp(siteGuidePath.getPointAt(travel),smooth((p-1.68)/.22)*.92);camera.sub(target).multiplyScalar(1+1.6*(1-smooth((p-1.78)/.3))).add(target);}
  if(mode==='short')camera.add(new Vector3(15*Math.pow(Math.sin(Math.PI*t),2),10*Math.pow(Math.sin(Math.PI*t),2),0));
  shot.camera=arr(camera);shot.target=arr(target);shot.up=[0,1,0];shot.scene='site';shot.guidePath='site';shot.guideU=travel;shot.pulse=arr(siteGuidePath.getPointAt(travel));shot.tangent=arr(siteGuidePath.getTangentAt(travel));shot.trailLength=mix(8,.10,smooth(t));shot.guideScale=.9;
 }
 shot.chapter=chapterAt(p);shot.regionEmphasis=fadeWindow(p,1.035,1.10,1.24,1.29);
 // Full cloud occlusion hides the two scale changes; all values are reconstructed in reverse.
 const cloud=(p:number,a:number,b:number,c:number,d:number)=>fadeWindow(p,a,b,c,d);
 shot.cloudOpacity=Math.max(cloud(p,1.235,1.29,1.31,1.36),cloud(p,1.485,1.54,1.56,1.635));
 if(p>=SITE_SWITCH)shot.pulseOpacity=.95;
 return progress>STAGE_THREE_END?extendConversion(progress,mode,shot):shot;
}
export function sampleGuide(shot:JourneyShot,behind:number,target=new Vector3()){
 if(shot.guidePath==='glass'&&conversionGuideDistance(shot,behind)<0)return siteGuidePath.getPointAt(clamp(1+conversionGuideDistance(shot,behind)/siteGuidePath.getLength()),target);
 if(shot.guidePath==='glass'||shot.guidePath==='cell')return sampleConversionGuide(shot,behind,target);
 if(shot.guidePath==='solar')return pointOnLightPath(shot.guideU-Math.max(0,behind)/FLIGHT_LENGTH,target);
 const path=shot.guidePath==='orbital'?orbitalPath:shot.guidePath==='region'?regionGuidePath:siteGuidePath;
 const distance=shot.guideU*path.getLength()-Math.max(0,behind);
 if(distance<0&&shot.guidePath==='orbital')return pointOnLightPath(start.flight+distance/FLIGHT_LENGTH,target).sub(new Vector3(...EARTH_POSITION));
 return path.getPointAt(clamp(distance/path.getLength()),target);
}
export function guideTangent(shot:JourneyShot,behind:number,target=new Vector3()){
 if(shot.guidePath==='glass'&&conversionGuideDistance(shot,behind)<0)return siteGuidePath.getTangentAt(clamp(1+conversionGuideDistance(shot,behind)/siteGuidePath.getLength()),target);
 if(shot.guidePath==='glass'||shot.guidePath==='cell')return conversionGuideTangent(shot,behind,target);
 if(shot.guidePath==='solar')return tangentOnLightPath(shot.guideU-Math.max(0,behind)/FLIGHT_LENGTH,target);
 const path=shot.guidePath==='orbital'?orbitalPath:shot.guidePath==='region'?regionGuidePath:siteGuidePath;
 return path.getTangentAt(clamp(shot.guideU-Math.max(0,behind)/path.getLength()),target);
}
