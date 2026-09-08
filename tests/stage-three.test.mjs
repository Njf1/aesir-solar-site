import test from 'node:test';
import {readFileSync} from 'node:fs';
import {sampleJourney as acceptedJourney} from '../src/experience/progress.ts';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {sampleJourney,sampleGuide,guideTangent,journeyCopy} from '../src/experience/journey.ts';
import {EARTH_POSITION} from '../src/experience/progress.ts';
import {latLonToEarth,earthToLatLon,earthToRegion,directionToRegion,regionToSite,LOCAL_UP,LOCAL_EAST,LOCAL_SOUTH,SUN_LOCAL} from '../src/experience/geography.ts';
import {CHAPTERS,JOURNEY_END,SCROLL_VIEWPORTS_PER_UNIT,STILL_VIEWS} from '../src/experience/timeline.ts';
import {HERO_ANCHOR,HERO_NORMAL,ROOF_Y} from '../src/experience/site-layout.ts';
import {createCommercialSite} from '../src/experience/commercial.ts';
const modes=['landscape','portrait','short'],v=a=>new THREE.Vector3(...a);
const near=(a,b,epsilon,label)=>assert.ok(a.distanceTo(b)<=epsilon,`${label}: ${a.distanceTo(b)} > ${epsilon}`);
function rightFrame(point,p){return p===.735?point.clone().sub(v(EARTH_POSITION)):p===1.3?earthToRegion(point):p===1.55?regionToSite(point):point;}

test('new chapters extend the scroll distance while retaining the accepted first unit',()=>{
 assert.equal(SCROLL_VIEWPORTS_PER_UNIT,5.6);assert.equal(JOURNEY_END,2.25);
 assert.deepEqual(CHAPTERS.slice(0,5).map(({start,end})=>[start,end]),[[0,.16],[.16,.39],[.39,.51],[.51,.75],[.75,1]]);
 for(let i=1;i<CHAPTERS.length;i++)assert.equal(CHAPTERS[i].start,CHAPTERS[i-1].end);
 assert.deepEqual(Object.keys(STILL_VIEWS),['sun','earth','britain','roof','panel']);
 for(const p of Object.values(STILL_VIEWS)){
  const s=sampleJourney(p);assert.ok(s.cloudOpacity<.01,'still must not be an opaque transition');
  assert.equal(journeyCopy(p,true).filter(o=>o>.5).length,1,'each still has exactly one readable HTML chapter');
 }
});

test('geographic convention and directional sunlight agree across coordinate systems',()=>{
 for(const [lat,lon,point] of [[0,0,[0,0,-10]],[0,90,[-10,0,0]],[0,-90,[10,0,0]],[90,0,[0,10,0]]])near(latLonToEarth(lat,lon),v(point),1e-12,`cardinal ${lat},${lon}`);
 for(const [lat,lon] of [[54,-2],[52.5,-1.85],[50.1,-5.7],[58.6,-3.1],[-33.9,151.2]]){
  const back=earthToLatLon(latLonToEarth(lat,lon));assert.ok(Math.abs(back.lat-lat)<1e-10);assert.ok(Math.abs(back.lon-lon)<1e-10);
 }
 const basis=[LOCAL_EAST,LOCAL_UP,LOCAL_SOUTH];for(const n of basis)assert.ok(Math.abs(n.length()-1)<1e-12);
 for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.ok(Math.abs(basis[i].dot(basis[j]))<1e-12);
 near(LOCAL_EAST.clone().cross(LOCAL_UP),LOCAL_SOUTH,1e-12,'right handed frame');
 near(SUN_LOCAL,directionToRegion(v(EARTH_POSITION).negate().normalize()),1e-12,'Sun remains in the original world direction');
 assert.ok(SUN_LOCAL.y>0,'selected daytime region is lit from above');
});

test('all chapters reconstruct identical finite shots in reverse and attach the trail head exactly',()=>{
 for(const mode of modes){
  const forward=Array.from({length:2251},(_,i)=>sampleJourney(i/1000,mode));
  for(let i=2250;i>=0;i--){
   const s=sampleJourney(i/1000,mode);assert.deepEqual(s,forward[i]);
   for(const key of ['camera','target','pulse','up','tangent'])assert.ok(s[key].every(Number.isFinite),`${mode} ${key} ${i}`);
   assert.ok(v(s.camera).distanceTo(v(s.target))>.1);
   near(sampleGuide(s,0),v(s.pulse),1e-10,'trail head');near(sampleGuide(s,-3),v(s.pulse),1e-10,'negative distance is clamped');
   assert.ok(Math.abs(guideTangent(s,0).length()-1)<1e-9);
  }
  assert.deepEqual(sampleJourney(-1,mode),sampleJourney(0,mode));
  assert.deepEqual(sampleJourney(3,mode),sampleJourney(JOURNEY_END,mode));
  assert.deepEqual(sampleJourney(NaN,mode),sampleJourney(0,mode));
 }
});

test('guide, camera, aim and up stay continuous through rebasing and obscured scale handoffs',()=>{
 const epsilon=1e-7;
 for(const mode of modes)for(const p of [.735,1.30,1.55]){
  const before=sampleJourney(p-epsilon,mode),after=sampleJourney(p+epsilon,mode);
  for(const key of ['camera','target','pulse'])near(rightFrame(v(before[key]),p),v(after[key]),.001,`${mode} ${key} ${p}`);
  for(const key of ['tangent','up']){
   const a=p===1.3?directionToRegion(v(before[key])):v(before[key]);assert.ok(a.angleTo(v(after[key]))<.001,`${mode} ${key} ${p}`);
  }
  if(p!==.735){assert.equal(before.cloudOpacity,1);assert.equal(after.cloudOpacity,1);}
 }
});

test('camera, aim and guide settle continuously at handoffs without pauses at new interior landmarks',()=>{
 const h=1e-6;
 for(const mode of modes)for(const p of [.735,1.30,1.55,1.72,1.84,1.94,2.10,2.25])for(const key of ['camera','target','pulse']){
  const at=k=>{const point=v(sampleJourney(p+k*h,mode)[key]);return k<0?rightFrame(point,p):point;};
  const [m2,m1,c,p1,p2]=[-2,-1,0,1,2].map(at);
  const left=c.clone().multiplyScalar(3).addScaledVector(m1,-4).add(m2).divideScalar(2*h);
  const right=c.clone().multiplyScalar(-3).addScaledVector(p1,4).addScaledVector(p2,-1).divideScalar(2*h);
  // Three's arc-length inversion uses a piecewise linear lookup: tolerate its small
  // numerical speed steps, while catching the former 18/80-unit mode-offset jolts.
  const tolerance=(p>1.55&&p<2.25?.03:.002)*Math.max(1,left.length(),right.length());
  assert.ok(left.distanceTo(right)<tolerance,`${mode} ${key} ${p}: ${left.distanceTo(right)} > ${tolerance}`);
  if(p>1.55&&p<2.25&&key==='pulse')assert.ok(Math.min(left.length(),right.length())>1,'guide must not stop at an interior landmark');
 }
});

test('the approach, roof entry and array glide occupy authored scroll landmarks',()=>{
 const landmarks=[
  [1.55,[115,135,165],[20,70,35]],
  [1.72,[82,74,105],[30,36,22]],
  [1.84,[45,35,44],[28,15,10]],
  [1.94,[20,19.5,20],[12,12.8,10]],
  [2.10,[-4,14.3,14.8],[-7,12.4,10]],
 ];
 for(const [p,camera,guide] of landmarks){const s=sampleJourney(p);near(v(s.camera),v(camera),1e-9,`camera landmark ${p}`);near(v(s.pulse),v(guide),1e-9,`guide landmark ${p}`);}
 let last=-1;for(let i=15500;i<=22500;i++){const s=sampleJourney(i/10000);assert.ok(s.guideU>=last,'guide reverses along the roof');last=s.guideU;}
 for(const mode of modes){const end=sampleJourney(JOURNEY_END,mode);near(v(end.pulse),HERO_ANCHOR.clone().addScaledVector(HERO_NORMAL,.045),1e-9,'guide stops above glass');assert.ok(v(end.camera).sub(HERO_ANCHOR).dot(HERO_NORMAL)>.7);}
});

test('the exposed guide stays in frame and clear of the Earth and roof at every sampled step',()=>{
 for(const [mode,aspect] of [['landscape',1.6],['portrait',390/844],['short',2]]){
  const camera=new THREE.PerspectiveCamera(43,aspect,.1,2600);
  for(let i=7350;i<=22500;i++){
   const p=i/10000,s=sampleJourney(p,mode);
   if(s.scene==='earth'){assert.ok(v(s.camera).length()>10.25,`Earth camera ${p}`);assert.ok(v(s.pulse).length()>10.59,`Earth guide ${p}`);}
   if(s.scene==='site'&&Math.abs(s.camera[0])<40&&Math.abs(s.camera[2])<24)assert.ok(s.camera[1]-ROOF_Y>1.0,`roof camera ${p}`);
   if(s.cloudOpacity>=.98)continue;
   camera.position.set(...s.camera);camera.up.set(...s.up);camera.lookAt(...s.target);camera.updateMatrixWorld();
   const ndc=v(s.pulse).project(camera);assert.ok(Math.abs(ndc.x)<.93&&Math.abs(ndc.y)<.85&&ndc.z> -1&&ndc.z<1,`${mode} p=${p}: guide ${ndc.toArray()}`);
  }
 }
});

function fakeCanvas(){const canvas={tagName:'CANVAS',width:0,height:0};const context=new Proxy({canvas},{get:(o,p)=>p in o?o[p]:()=>{}});canvas.getContext=()=>context;return canvas;}
test('authored geometry leaves the camera-to-guide sightline clear and agrees with the landing anchor',()=>{
 const originalDocument=globalThis.document;globalThis.document={createElement:name=>{assert.equal(name,'canvas');return fakeCanvas();}};
 let asset;
 try{
  asset=createCommercialSite('desktop');asset.group.updateMatrixWorld(true);
  near(asset.heroAnchor,HERO_ANCHOR,1e-6,'live mesh anchor');near(asset.heroNormal,HERO_NORMAL,1e-6,'live mesh normal');
  const ray=new THREE.Raycaster();for(const mode of modes)for(let i=0;i<=180;i++){
   const p=1.635+(JOURNEY_END-1.635)*i/180,s=sampleJourney(p,mode),from=v(s.camera),delta=v(s.pulse).sub(from);
   ray.set(from,delta.clone().normalize());ray.near=.001;ray.far=delta.length()-.002;
   const hit=ray.intersectObject(asset.group,true)[0];assert.equal(hit,undefined,`${mode} p=${p}: guide hidden by ${hit?.object.name}`);
  }
 }finally{asset?.dispose();if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument;}
});

test('accepted Sun, flight and Earth camera poses retain their physical scroll positions',()=>{
 for(const mode of modes)for(let i=0;i<=1000;i++){
  const p=i/1000,old=acceptedJourney(p,mode),next=sampleJourney(p,mode);
  assert.deepEqual(next.camera,old.camera);assert.deepEqual(next.target,old.target);
  if(p<.735)assert.deepEqual(next.pulse,old.pulse);
 }
});
test('known landmarks and the illustrative origin land on Britain, with Ireland kept separate',()=>{
 const data=JSON.parse(readFileSync(new URL('../src/experience/assets/region-land.json',import.meta.url)));
 const marks=JSON.parse(readFileSync(new URL('../docs/experience/stage-three/landmarks.json',import.meta.url))).landmarks;
 const contains=(ring,[x,y])=>{let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const [xi,yi]=ring[i],[xj,yj]=ring[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
 }return inside;};
 const gb=data.polygons.find(p=>p.id==='great-britain'),ireland=data.polygons.find(p=>p.id==='ireland');
 for(const mark of marks){const inGB=contains(gb.rings[0],mark.coordinates);assert.equal(inGB,!['Belfast','Dublin'].includes(mark.name),mark.name);if(!inGB)assert.ok(contains(ireland.rings[0],mark.coordinates));}
 assert.ok(contains(gb.rings[0],[-1.85,52.5]));
 assert.ok(marks.find(m=>m.name==='Inverness').coordinates[1]>marks.find(m=>m.name==='London').coordinates[1]);
});
test('commercial resources fit incremental budgets and each owned object disposes exactly once',()=>{
 const originalDocument=globalThis.document;globalThis.document={createElement:()=>fakeCanvas()};
 try{for(const quality of ['mobile','desktop']){
  const asset=createCommercialSite(quality),resources=new Set(),counts=new Map();
  asset.group.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.isInstancedMesh)resources.add(o);for(const m of [o.material].flat().filter(Boolean)){resources.add(m);for(const val of Object.values(m))if(val?.isTexture)resources.add(val);}});
  for(const r of resources){counts.set(r,0);r.addEventListener('dispose',()=>counts.set(r,counts.get(r)+1));}
  assert.ok(asset.stats.drawCalls<=52);assert.ok(asset.stats.triangles<=140000);assert.ok(asset.stats.arrayCoverage>.5&&asset.stats.arrayCoverage<.65);
  assert.ok(asset.stats.textureBytes<=(quality==='mobile'?524288:2097152));
  asset.dispose();asset.dispose();for(const [r,count] of counts)assert.equal(count,1,r.type||r.name);assert.equal(asset.group.children.length,0);
 }}finally{if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument;}
});
