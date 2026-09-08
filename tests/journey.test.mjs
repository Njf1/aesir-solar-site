import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3,PerspectiveCamera} from 'three';
import {sampleJourney,EARTH_POSITION,EARTH_SWITCH,framingFor,copyOpacities} from '../src/experience/progress.ts';
import {pointOnLightPath,tangentOnLightPath,trailSample,FLIGHT_LENGTH,TRAIL_LENGTH} from '../src/experience/path.ts';
const modes=['landscape','portrait','short'];
const norm=v=>Math.hypot(...v);
const subtract=(a,b)=>a.map((n,i)=>n-b[i]);
const toWorld=(shot,key)=>shot[key].map((v,i)=>v+(shot.scene==='earth'?EARTH_POSITION[i]:0));
const near=(actual,expected,tolerance,label)=>assert.ok(norm(subtract(actual,expected))<=tolerance,`${label}: error ${norm(subtract(actual,expected))}`);

test('all framings reverse the same world camera, target and guide, including origin rebasing',()=>{
 for(const mode of modes){
  const forwards=Array.from({length:1001},(_,i)=>sampleJourney(i/1000,mode));
  for(let i=1000;i>=0;i--){
   const shot=sampleJourney(i/1000,mode);
   assert.deepEqual(shot,forwards[i],`${mode} p=${i/1000}`);
   for(const key of ['camera','target','pulse','tangent'])assert.ok(shot[key].every(Number.isFinite),`${key} finite`);
   assert.ok(norm(subtract(shot.target,shot.camera))>.1,'camera has a usable look direction');
   near(toWorld(shot,'pulse'),pointOnLightPath(shot.flight).toArray(),1e-9,'guide stays on one world path');
   assert.ok(Math.abs(norm(shot.tangent)-1)<1e-10,'unit path tangent');
  }
  for(const p of [EARTH_SWITCH,.75,.95]){
   const before=sampleJourney(p-1e-7,mode),after=sampleJourney(p+1e-7,mode);
   for(const key of ['camera','target','pulse'])near(toWorld(before,key),toWorld(after,key),.001,`${mode} ${key} continuity at ${p}`);
  }
  assert.deepEqual(sampleJourney(-1,mode),sampleJourney(0,mode));
  assert.deepEqual(sampleJourney(2,mode),sampleJourney(1,mode));
  assert.deepEqual(sampleJourney(NaN,mode),sampleJourney(0,mode));
 }
});

test('arrival begins and settles with continuous camera and target velocity',()=>{
 const h=1e-5;
 for(const mode of modes)for(const p of [.75,.95])for(const key of ['camera','target']){
  const at=k=>toWorld(sampleJourney(p+k*h,mode),key);
  const [m2,m1,c,p1,p2]=[-2,-1,0,1,2].map(at);
  const left=c.map((v,i)=>(3*v-4*m1[i]+m2[i])/(2*h));
  const right=c.map((v,i)=>(-3*v+4*p1[i]-p2[i])/(2*h));
  const error=norm(subtract(left,right));
  const tolerance=.01*Math.max(1,norm(left),norm(right));
  assert.ok(error<tolerance,`${mode} ${key} p=${p}: velocity discontinuity ${error}, tolerance ${tolerance}`);
 }
});

test('camera stays outside the photosphere and Earth during acquisition and arrival',()=>{
 for(const mode of modes)for(let i=0;i<=1000;i++){
  const p=i/1000,shot=sampleJourney(p,mode);
  if(p<.60)assert.ok(norm(toWorld(shot,'camera'))>=12.999,`${mode}: entered Sun clearance at ${p}`);
  if(p>=EARTH_SWITCH)assert.ok(norm(subtract(toWorld(shot,'camera'),EARTH_POSITION))>10.25,`${mode}: entered Earth at ${p}`);
 }
});

test('distance-based trail begins at the guide and measures seven units behind it',()=>{
 for(const head of [0,.001,.025,.12,.47,.83,.96,1]){
  near(trailSample(head,0).toArray(),pointOnLightPath(head).toArray(),1e-12,'leading sample at guide');
  near(trailSample(head,-3).toArray(),pointOnLightPath(head).toArray(),1e-12,'negative behind never puts trail ahead');
  let previous=trailSample(head,0),length=0;
  for(let i=1;i<=300;i++){
   const next=trailSample(head,TRAIL_LENGTH*i/300);length+=previous.distanceTo(next);previous=next;
  }
  assert.ok(Math.abs(length-Math.min(TRAIL_LENGTH,head*FLIGHT_LENGTH))<.025,`arc length at ${head}: ${length}`);
  assert.ok(tangentOnLightPath(head).clone().cross(new Vector3(0,1,0)).length()>.1,'stable trail/chase basis');
 }
});

test('framing includes short landscape and copy windows remain readable',()=>{
 assert.equal(framingFor(1440,1000),'landscape');
 assert.equal(framingFor(390,844),'portrait');
 assert.equal(framingFor(760,1000),'portrait');
 assert.equal(framingFor(900,500),'short');
 for(let i=0;i<=1000;i++){
  const opacity=copyOpacities(i/1000);assert.ok(opacity.every(n=>n>=0&&n<=1));
  assert.ok(opacity.filter(n=>n>.15).length<=1,'avoid two readable chapter overlays at once');
 }
});


test('the acquired guide stays on screen at every intermediate flight position',()=>{
 for(const [mode,aspect] of [['landscape',1.6],['portrait',390/844],['short',2]]){
  const camera=new PerspectiveCamera(43,aspect,.1,2600);
  for(let i=400;i<=760;i++){
   const shot=sampleJourney(i/1000,mode);camera.position.set(...shot.camera);camera.lookAt(...shot.target);camera.updateMatrixWorld();
   const head=new Vector3(...shot.pulse).project(camera);
   assert.ok(Math.abs(head.x)<.93&&Math.abs(head.y)<.8&&head.z<1,`${mode} p=${i/1000}: guide outside safe frame ${head.toArray()}`);
  }
 }
});
