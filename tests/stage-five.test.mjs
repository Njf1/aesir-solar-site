import {execFileSync} from 'node:child_process';import {tmpdir} from 'node:os';import {join} from 'node:path';import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import * as T from 'three';
import {sampleJourney,journeyCopy} from '../src/experience/journey.ts';
import {operationState,BUSINESS_ROUTE,BUSINESS_ENTRY} from '../src/experience/business-journey.ts';
import {STAGE_FOUR_END,JOURNEY_END,SCROLL_VIEWPORTS_PER_UNIT,STILL_VIEWS,CHAPTERS} from '../src/experience/timeline.ts';
import {ELECTRICAL_PATHS,ELECTRICAL_PORTS} from '../src/experience/electrical-path.ts';
import {STORAGE_PATHS,STORAGE_PORTS} from '../src/experience/storage-path.ts';
import {BusinessScene} from '../src/experience/business.ts';import {createStorageScene} from '../src/experience/storage.ts';import {createCommercialSite} from '../src/experience/commercial.ts';
import {BUSINESS_BUDGET,STORAGE_BUDGET} from '../src/experience/budgets.ts';
const v=a=>new T.Vector3(...a),near=(a,b,e=1e-8)=>assert.ok(a.distanceTo(b)<e,`${a.toArray()} != ${b.toArray()}`);
const fixture=JSON.parse(readFileSync(new URL('./fixtures/stage-four-poses.json',import.meta.url)));
function withCanvas(fn){const old=globalThis.document;globalThis.document={createElement:()=>{const c={tagName:'CANVAS',width:0,height:0};c.getContext=()=>new Proxy({canvas:c},{get:(o,p)=>p in o?o[p]:()=>{}});return c;}};try{return fn();}finally{globalThis.document=old;}}
function values(group){const r=[];group.traverse(o=>{if(o instanceof T.InstancedMesh)r.push([...o.instanceMatrix.array]);if(o instanceof T.Light)r.push(o.intensity);if(o instanceof T.Mesh)for(const m of[o.material].flat())if(m instanceof T.ShaderMaterial)r.push(JSON.stringify(m.uniforms));});return r;}

test('all stage-four camera and guide fields retain their exact accepted scroll positions',()=>{
 assert.equal(STAGE_FOUR_END,4.08);assert.ok(Math.abs(STAGE_FOUR_END*SCROLL_VIEWPORTS_PER_UNIT-22.848)<1e-10);
 assert.equal(CHAPTERS[15].end,4.08);assert.ok(JOURNEY_END>4.08);
 for(const {mode,p,shot}of fixture.records){const current=sampleJourney(p,mode);for(const key of Object.keys(shot)){if(key==='chapter'&&p===4.08)continue;assert.deepEqual(current[key],shot[key],`${mode}/${p}/${key}`);}}
 for(const [name,p]of Object.entries({sun:.285,earth:.925,britain:1.4,roof:1.76,panel:2.23,cell:2.76,dc:3.4,inverter:4.02}))assert.equal(STILL_VIEWS[name],p);
});

test('new camera joins the settled inverter smoothly and every operation pose reverses exactly',()=>{
 const h=1e-6;
 for(const mode of['landscape','portrait','short']){
  for(const key of['camera','target']){const left=v(sampleJourney(4.08-h,mode)[key]),mid=v(sampleJourney(4.08,mode)[key]),right=v(sampleJourney(4.08+h,mode)[key]);near(left,right,.0001);assert.ok(right.clone().sub(mid).divideScalar(h).length()<.03,'settled join must not accelerate suddenly');}
  const points=Array.from({length:1001},(_,i)=>4.08+i*.002),shots=points.map(p=>sampleJourney(p,mode));
  for(let i=points.length-1;i>=0;i--){assert.deepEqual(sampleJourney(points[i],mode),shots[i]);const s=shots[i];assert.equal(s.pulseOpacity,0);for(const k of['camera','target','up'])assert.ok(s[k].every(Number.isFinite));assert.ok(v(s.camera).distanceTo(v(s.target))>.1);}
  assert.deepEqual(sampleJourney(JOURNEY_END+10,mode),sampleJourney(JOURNEY_END,mode));
 }
});

test('activation and the storage/grid conditions have ordered, mutually consistent phases',()=>{
 let old=operationState(4.08);
 for(let i=4080;i<=6080;i++){const p=i/1000,s=operationState(p);for(const [k,n]of Object.entries(s)){assert.ok(n>=0&&n<=1,`${k} must be bounded`);}
  assert.equal(s.charge*s.discharge,0);assert.equal(s.importFlow*s.exportFlow,0);assert.equal(s.discharge*s.importFlow,0);
  if(s.equipment>0)assert.ok(s.lighting>.7,'workspace lights precede equipment');if(s.screen>0)assert.ok(s.equipment>.8,'screen follows equipment');
  if(s.charge>.01)assert.equal(s.dusk,0,'charging moment is daytime');if(s.discharge>.01)assert.ok(s.dusk>.8,'discharging moment is later');
  if(p>=4.99&&p<=5.12)assert.ok(s.stored>=old.stored);if(p>=5.31&&p<=5.41)assert.ok(s.stored<=old.stored);
  assert.ok(s.stored>.2&&s.stored<.7,'neither instantly full nor unlimited');if(p>4.14)assert.equal(s.graphOpacity,0);
  old=s;
 }
 assert.equal(operationState(4.30).lighting,0);assert.equal(operationState(4.70).screen,1);
});

test('the same AC entry connects the working bay and separately converted optional battery branch',()=>{
 near(ELECTRICAL_PATHS.acOutput.getPointAt(1),ELECTRICAL_PORTS.buildingEntry);near(BUSINESS_ENTRY,ELECTRICAL_PORTS.buildingEntry);near(BUSINESS_ROUTE.getPointAt(0),BUSINESS_ENTRY);
 const pairs=[['storageAC','buildingAC','converterAC'],['batteryDC','converterDC','batteryDC'],['batteryDCReturn','converterDCReturn','batteryDCReturn'],['gridAC','buildingAC','gridBuildingSide'],['buriedGrid','gridExternalSide','gridBeyondSite']];
 for(const[k,a,b]of pairs){near(STORAGE_PATHS[k].getPointAt(0),STORAGE_PORTS[a]);near(STORAGE_PATHS[k].getPointAt(1),STORAGE_PORTS[b]);}
 assert.ok(STORAGE_PORTS.converterAC.distanceTo(STORAGE_PORTS.converterDC)>.3);assert.ok(STORAGE_PORTS.batteryDC.distanceTo(STORAGE_PORTS.converterDC)>1,'battery is not connected directly to AC');
});

test('the facade opens a real clearance while retaining the inverter mounting wall and reverses exactly',()=>withCanvas(()=>{
 const campus=createCommercialSite('desktop');try{campus.setOperation(0,0,0);const original=values(campus.group);const ray=z=>new T.Raycaster(new T.Vector3(-42,3,z),new T.Vector3(1,0,0),0,3).intersectObject(campus.group,true);
 campus.group.updateMatrixWorld(true);assert.ok(ray(13.7).length>0,'closed west shell');campus.setOperation(1,1,1);campus.group.updateMatrixWorld(true);assert.equal(ray(13.7).length,0,'camera entry has an actual opening');assert.ok(ray(18).length>0,'inverter retains a wall behind it');
 campus.setOperation(0,0,0);assert.deepEqual(values(campus.group),original);
 }finally{campus.dispose();}
}));

test('new owners count all owned buffers and release every geometry/material/instance once',()=>{
 for(const tier of['desktop','mobile'])for(const type of['business','storage']){
  const owner=type==='business'?new BusinessScene(tier==='mobile'):createStorageScene(tier),group=owner.group,budget=type==='business'?BUSINESS_BUDGET:STORAGE_BUDGET;
  owner.render(operationState(5.07),2);let buffers=0,draws=0,triangles=0;const gs=new Set(),ms=new Set(),is=new Set();group.traverse(o=>{if(o instanceof T.Mesh){draws++;gs.add(o.geometry);for(const m of[o.material].flat())ms.add(m);triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o instanceof T.InstancedMesh?o.count:1);}if(o instanceof T.InstancedMesh){buffers+=o.instanceMatrix.array.byteLength+(o.instanceColor?.array.byteLength??0);is.add(o);}});
  for(const g of gs){buffers+=Object.values(g.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(g.index?.array.byteLength??0);}
  const stats=type==='business'?owner.snapshot():owner.stats;assert.equal(stats.geometryBytes,buffers);assert.equal(stats.drawCalls,draws);assert.equal(stats.triangles,triangles);assert.ok(buffers<=budget.geometryBytes);assert.ok(triangles<=budget.triangles);assert.ok(draws<=budget.baseDrawCalls);assert.equal(stats.textureBytes,0);
  const counts=new Map([...gs,...ms,...is].map(o=>[o,0]));for(const o of counts.keys())o.addEventListener('dispose',()=>counts.set(o,counts.get(o)+1));owner.dispose();owner.dispose();assert.equal(group.children.length,0);for(const n of counts.values())assert.equal(n,1);
 }
});

test('lights, equipment, screen, storage level and flow uniforms reconstruct from state and frozen time',()=>{
 const business=new BusinessScene(false),storage=createStorageScene('desktop');try{
  for(const p of[4.31,4.39,4.50,4.70,5.07,5.33,5.53,6.03]){const state=operationState(p);business.render(state,5.4);storage.render(state,5.4);const b=values(business.group),s=values(storage.group);business.render(operationState(6.03),81);storage.render(operationState(5.33),81);business.render(state,5.4);storage.render(state,5.4);assert.deepEqual(values(business.group),b);assert.deepEqual(values(storage.group),s);}
  business.render(operationState(4.70),0);const lamps=[];business.group.traverse(o=>{if(o instanceof T.PointLight)lamps.push(o);});assert.equal(lamps.length,2);assert.ok(lamps.every(l=>l.intensity>1&&!l.castShadow),'bounded real light illuminates surfaces');
 }finally{business.dispose();storage.dispose();}
});

test('all twelve still views expose one HTML statement and the ending has no resurrected photon',()=>{
 assert.equal(Object.keys(STILL_VIEWS).length,12);
 for(const p of Object.values(STILL_VIEWS)){const copy=journeyCopy(p,true);assert.equal(copy.length,19);assert.equal(copy.filter(n=>n>.5).length,1);}
 for(const p of[4.70,5.09,5.56,6.03])assert.equal(sampleJourney(p).pulseOpacity,0);
 const html=readFileSync(new URL('../experience.html',import.meta.url),'utf8');assert.match(html,/id="chapter-count"><\/span>/);assert.match(html,/Illustration of operation after the required permissions and commissioning/);assert.match(html,/does not automatically provide backup/);assert.match(html,/879 modules are illustrative/);
});

// The full delivery diagnostic uses a 0.0001 step. The regression samples every
// 0.004 unit against actual triangles and instance matrices across all 15 rigs.
test('camera and finite near-plane remain clear of actual campus, interior and service equipment',()=>{
 const output=join(tmpdir(),'aesir-stage-five-clearance-'+process.pid+'.json');
 execFileSync(process.execPath,['scripts/check-stage-five-clearance.mjs','--step=0.004','--output='+output],{stdio:'pipe',timeout:90000});
 const report=JSON.parse(readFileSync(output));assert.equal(report.results.length,15);
 assert.ok(report.results.every(r=>r.collisionSamples===0));assert.ok(report.entryMatches.every(e=>e.error===0));
});
