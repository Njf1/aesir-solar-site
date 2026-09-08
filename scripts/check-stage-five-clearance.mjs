/** Read-only dense camera-centre + actual near-plane rectangle diagnostic.
 * Run with Node 24. Optional: --step=0.0001 --output=/private/tmp/...json.
 * Uses actual campus, interior, electrical and storage geometry. No renderer required.
 */
import * as T from 'three';
import {registerHooks} from 'node:module';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
registerHooks({resolve(specifier,context,next){try{return next(specifier,context);}catch(e){if(specifier.startsWith('.')&&!/\.[a-z]+$/i.test(specifier)&&context.parentURL){const u=new URL(specifier+'.ts',context.parentURL);if(existsSync(fileURLToPath(u)))return next(u.href,context);}throw e;}}});
const ROOT=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,'');
const moduleAt=file=>import(pathToFileURL(ROOT+'/'+file).href);
const sourceFiles=['src/experience/business-journey.ts','src/experience/commercial.ts','src/experience/interior.ts','src/experience/business.ts','src/experience/electrical.ts','src/experience/electrical-path.ts','src/experience/storage.ts','src/experience/storage-path.ts','src/experience/scene.ts','src/experience/timeline.ts'];
const hashes=()=>Object.fromEntries(sourceFiles.filter(f=>existsSync(ROOT+'/'+f)).map(f=>[f,createHash('sha256').update(readFileSync(ROOT+'/'+f)).digest('hex')]));
const sourceHashes=hashes();
const [{sampleJourney},{framingFor,smooth},{operationState,BUSINESS_ROUTE,BUSINESS_ENTRY},{createCommercialSite},{createElectricalScene},{ELECTRICAL_PATHS,ELECTRICAL_PORTS},{BusinessScene},{createStorageScene},{STORAGE_PATHS,STORAGE_PORTS},{EnergyFlow}]=await Promise.all([
 moduleAt('src/experience/journey.ts'),moduleAt('src/experience/progress.ts'),moduleAt('src/experience/business-journey.ts'),moduleAt('src/experience/commercial.ts'),moduleAt('src/experience/electrical.ts'),moduleAt('src/experience/electrical-path.ts'),moduleAt('src/experience/business.ts'),moduleAt('src/experience/storage.ts'),moduleAt('src/experience/storage-path.ts'),moduleAt('src/experience/energy-flow.ts')]);
const canvas=()=>{const c={tagName:'CANVAS',width:0,height:0},ctx=new Proxy({canvas:c},{get:(o,p)=>p in o?o[p]:()=>{}});c.getContext=()=>ctx;return c;};globalThis.document={createElement:canvas};
const step=Number(process.argv.find(a=>a.startsWith('--step='))?.slice(7)??.0001);
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'docs/experience/stage-five/clearance.json';
const campus=createCommercialSite('desktop'),electrical=createElectricalScene('desktop'),business=new BusinessScene(false),storage=createStorageScene('desktop');
const dcFlow=new EnergyFlow(ELECTRICAL_PATHS.dcPositive,.026,176),acFlow=new EnergyFlow(ELECTRICAL_PATHS.acOutput,.021,64);electrical.group.add(dcFlow.mesh,acFlow.mesh);
const groups=[['campus',campus.group],['electrical',electrical.group],['business',business.group],['storage',storage.group]];
const V=(a)=>new T.Vector3(...a),tan=Math.tan(43*Math.PI/360),epsilon=1e-9;
let recordId=0,triangleTests=0,boxCandidates=0;
const ignored=[];
function visible(o){for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;}
function makeRecords(label,group){group.updateMatrixWorld(true);const out=[];group.traverse(o=>{
 if(!(o instanceof T.Mesh))return;
 if(o.name.startsWith('Restrained contact shading')){ignored.push({group:label,name:o.name,reason:'Explicit depth-coplanar analytic floor contact shading at Y=.316; nonphysical shadow artwork only.'});return;}
 const g=o.geometry;g.computeBoundingBox();const materials=[o.material].flat();
 const r={id:++recordId,group:label,name:o.name,o,g,transparent:materials.every(m=>m.transparent),type:g.type,version:-1,worldVersion:'',items:[],broad:new T.Box3()};
 updateRecord(r,true);out.push(r);
 });return out;}
function updateRecord(r,force=false){
 const version=r.o instanceof T.InstancedMesh?r.o.instanceMatrix.version:0;
 if(!force&&version===r.version)return;
 r.version=version;r.broad.makeEmpty();const n=r.o instanceof T.InstancedMesh?r.o.count:1;
 for(let i=0;i<n;i++){
  const it=r.items[i]??={id:i,matrix:new T.Matrix4(),inverse:new T.Matrix4(),box:new T.Box3(),scale:new T.Vector3()};r.items[i]=it;
  if(r.o instanceof T.InstancedMesh)r.o.getMatrixAt(i,it.matrix);else it.matrix.identity();it.matrix.premultiply(r.o.matrixWorld);it.inverse.copy(it.matrix).invert();it.box.copy(r.g.boundingBox).applyMatrix4(it.matrix);it.scale.setFromMatrixScale(it.matrix);r.broad.union(it.box);
 }
 r.items.length=n;
}
const records=groups.flatMap(([label,g])=>makeRecords(label,g));
const local=new T.Vector3(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),hit=new T.Vector3(),transform=new T.Matrix4();
const rays=[V([1,.317,.173]).normalize(),V([.127,1,.379]).normalize(),V([.293,.157,1]).normalize()];
function contains(r,it,point){
 local.copy(point).applyMatrix4(it.inverse);if(!r.g.boundingBox.containsPoint(local))return false;
 if(r.type==='BoxGeometry')return true;if(r.type==='PlaneGeometry')return false;
 let votes=0;const pos=r.g.attributes.position,idx=r.g.index,n=idx?idx.count:pos.count;
 for(const dir of rays){const ray=new T.Ray(local,dir),distances=[];for(let f=0;f<n;f+=3){a.fromBufferAttribute(pos,idx?idx.getX(f):f);b.fromBufferAttribute(pos,idx?idx.getX(f+1):f+1);c.fromBufferAttribute(pos,idx?idx.getX(f+2):f+2);if(ray.intersectTriangle(a,b,c,false,hit)){const d=hit.distanceTo(local);if(d<1e-8)return true;distances.push(d);}}
 distances.sort((a,b)=>a-b);let unique=0,last=-Infinity;for(const d of distances)if(d-last>1e-7){unique++;last=d;}if(unique%2)votes++;
 }return votes>=2;
}
function clippedSegment(a,b,rx,ry){let lo=0,hi=1;for(const [axis,limit]of [['x',rx],['y',ry]]){const x=a[axis],d=b[axis]-x;if(Math.abs(d)<1e-14){if(x< -limit-epsilon||x>limit+epsilon)return null;}else{let first=(-limit-x)/d,last=(limit-x)/d;if(first>last)[first,last]=[last,first];lo=Math.max(lo,first);hi=Math.min(hi,last);if(lo>hi+epsilon)return null;}}return a.clone().lerp(b,Math.max(0,lo));}
const verts=[new T.Vector3(),new T.Vector3(),new T.Vector3()];
function planeSlice(r,it,camera,near){
 transform.multiplyMatrices(camera.matrixWorldInverse,it.matrix);const pos=r.g.attributes.position,idx=r.g.index,n=idx?idx.count:pos.count,segments=[];let centreCoplanar=false;
 for(let f=0;f<n;f+=3){triangleTests++;for(let j=0;j<3;j++)verts[j].fromBufferAttribute(pos,idx?idx.getX(f+j):f+j).applyMatrix4(transform);const intersections=[];
  for(let j=0;j<3;j++){const x=verts[j],y=verts[(j+1)%3],dx=x.z+near,dy=y.z+near;if(dx*dy<0)intersections.push(x.clone().lerp(y,dx/(dx-dy)));else if(Math.abs(dx)<epsilon)intersections.push(x.clone());}
  if(intersections.length>=2)segments.push([intersections[0],intersections[1]]);
  if(intersections.length===3&&new T.Triangle(verts[0],verts[1],verts[2]).containsPoint(new T.Vector3(0,0,-near)))centreCoplanar=true;
 }
 return {segments,centreCoplanar};
}
function planeCuts(slice,camera,near,rx,ry){let cuts=0,first;
 for(const [a,b] of slice.segments){const p=clippedSegment(a,b,rx,ry);if(p){cuts++;first??=p.applyMatrix4(camera.matrixWorld).toArray();}}
 if(slice.centreCoplanar){cuts++;first??=new T.Vector3(0,0,-near).applyMatrix4(camera.matrixWorld).toArray();}
 return cuts?{triangles:cuts,contact:first}:null;
}
const viewports=[['desktop',1600,1000],['laptop',1280,720],['mobile',390,844],['intermediate',740,900],['short',1000,500]];
const modes=['landscape','portrait','short'];
const results=[],poseSamples=[],from=new T.Vector3(),aim=new T.Vector3(),pulse=new T.Vector3();
const samples=Math.round((6.08-4.08)/step)+1;
function pose(shot,p,camera,near,state){return {p,camera:shot.camera,target:shot.target,pulse:shot.pulse,up:shot.up,near,section:state.section,entry:state.entry,equipment:state.equipment,nearPlaneCorners:[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>new T.Vector3(x*near*tan*camera.aspect,y*near*tan,-near).applyMatrix4(camera.matrixWorld).toArray())};}
function append(view,type,p,r,it,extra,currentPose){const key=`${type}/${r.id}/${it.id}`;let current=view.open.get(key);if(!current||p-current.end>step*1.05){current={kind:type,object:{group:r.group,name:r.name,instanceId:it.id,geometry:r.type,transparent:r.transparent},start:p,end:p,samples:1,first:{...currentPose,...extra,bounds:{min:it.box.min.toArray(),max:it.box.max.toArray()}},last:{...currentPose,...extra}};view.open.set(key,current);view.collisions.push(current);}else{current.end=p;current.samples++;current.last={...currentPose,...extra};}view.hitSamples.add(p);}
for(const mode of modes){
 const views=viewports.map(([name,w,h])=>({name,mode,actualFraming:framingFor(w,h),isActualFraming:framingFor(w,h)===mode,width:w,height:h,aspect:w/h,camera:new T.PerspectiveCamera(43,w/h,.1,2600),collisions:[],open:new Map(),hitSamples:new Set(),nearMin:Infinity,nearMax:0,minCameraAabbClearance:Infinity,minConservativeNearMargin:Infinity}));
 for(let i=0;i<samples;i++){
  const p=Number((4.08+i*step).toFixed(9)),s=sampleJourney(p,mode),state=operationState(p);from.set(...s.camera);aim.set(...s.target);pulse.set(...s.pulse);
  const near=T.MathUtils.clamp(from.distanceTo(pulse)*.01,.0015,3);
  campus.setOperation(state.section,state.screen,state.dusk);business.group.visible=p>4.18;business.render(state,0);storage.group.visible=p>4.92;storage.render(state,0);
  electrical.setProgress(s.conversion?.ac??1,state.graphOpacity);dcFlow.render(s.conversion?.energyU??1,0,.8*(1-state.dusk)*(1-smooth((p-4.45)/.15)));acFlow.render(s.conversion?.ac??1,0,.85*(1-smooth((p-4.7)/.16)));
  for(const r of records)updateRecord(r);
  const candidates=[];const maxRadius=near*Math.sqrt(1+tan*tan*(1+4));
  for(const r of records){if(!visible(r.o))continue;if(r.broad.distanceToPoint(from)>Math.max(maxRadius,1))continue;for(const it of r.items){const dist=it.box.distanceToPoint(from);if(dist<=Math.max(maxRadius,1)){const inside=contains(r,it,from);candidates.push({r,it,dist,inside});boxCandidates++;}}}
  for(const view of views){const camera=view.camera;camera.position.copy(from);camera.up.set(...s.up);camera.lookAt(aim);camera.near=near;camera.updateMatrixWorld(true);camera.updateProjectionMatrix();view.nearMin=Math.min(view.nearMin,near);view.nearMax=Math.max(view.nearMax,near);
   const radius=near*Math.sqrt(1+tan*tan*(1+view.aspect*view.aspect)),rx=near*tan*view.aspect,ry=near*tan;let currentPose;
   for(const candidate of candidates){const {r,it,dist,inside}=candidate;view.minCameraAabbClearance=Math.min(view.minCameraAabbClearance,dist);view.minConservativeNearMargin=Math.min(view.minConservativeNearMargin,dist-radius);if(dist>radius)continue;
    if(inside){currentPose??=pose(s,p,camera,near,state);let penetration=null;if(r.type==='BoxGeometry'){local.copy(from).applyMatrix4(it.inverse);penetration=Math.min(...['x','y','z'].flatMap(k=>[(local[k]-r.g.boundingBox.min[k])*it.scale[k],(r.g.boundingBox.max[k]-local[k])*it.scale[k]]));}append(view,'camera-centre',p,r,it,{penetrationMetres:penetration},currentPose);}
    candidate.slice??=planeSlice(r,it,camera,near);const cut=planeCuts(candidate.slice,camera,near,rx,ry);if(cut){currentPose??=pose(s,p,camera,near,state);append(view,'near-plane-rectangle',p,r,it,cut,currentPose);}
    else if(r.type!=='PlaneGeometry'){
      // A fully enclosed rectangle contains its centre. Any partially enclosed
      // rectangle crosses the solid's boundary, already tested by its plane slices.
      if(candidate.nearCentreContained===undefined){const q=new T.Vector3(0,0,-near).applyMatrix4(camera.matrixWorld);candidate.nearCentreContained=contains(r,it,q);candidate.nearCentre=q.toArray();}
      if(candidate.nearCentreContained){currentPose??=pose(s,p,camera,near,state);append(view,'near-plane-enclosed',p,r,it,{contact:candidate.nearCentre},currentPose);}
    }
   }
  }
  if(i%Math.round(.02/step)===0)poseSamples.push({mode,p,camera:s.camera,target:s.target,pulse:s.pulse,near,section:state.section});
 }
 for(const view of views){const {camera,open,hitSamples,...data}=view;results.push({...data,samples,collisionSamples:hitSamples.size});}
 console.error(`clearance ${mode}: ${samples} poses × ${views.length} aspects; ${views.reduce((n,v)=>n+v.collisions.length,0)} collision intervals`);
}
const entryPoint=ELECTRICAL_PORTS.buildingEntry,paths=[['inverter-ac-end',ELECTRICAL_PATHS.acOutput,1],['interior-ac-start',BUSINESS_ROUTE,0],['storage-ac-start',STORAGE_PATHS.storageAC,0],['grid-ac-start',STORAGE_PATHS.gridAC,0]];
const entryMatches=paths.map(([name,path,t])=>({name,position:path.getPointAt(t).toArray(),error:path.getPointAt(t).distanceTo(entryPoint)}));
const nearJoin=modes.map(mode=>{const left=sampleJourney(4.25-1e-7,mode),right=sampleJourney(4.25+1e-7,mode);return {mode,p:4.25,pulseJump:V(left.pulse).distanceTo(V(right.pulse)),nearBefore:T.MathUtils.clamp(V(left.camera).distanceTo(V(left.pulse))*.01,.0015,3),nearAfter:T.MathUtils.clamp(V(right.camera).distanceTo(V(right.pulse))*.01,.0015,3)};});
const finalHashes=hashes(),sourcesChanged=sourceFiles.filter(f=>sourceHashes[f]!==finalHashes[f]);
const result={recordedAt:new Date().toISOString(),sourceHashes,sourcesChanged,method:{progress:[4.08,6.08],step,framingModes:modes,aspectCoverage:'All five viewports × all three framings; isActualFraming identifies real responsive pairings.',tier:'desktop geometry, including all actual transparent guards, electrical objects, optional storage and root-owned interior containment/energy geometry',ambientTime:0,near:'clamp(distance(camera, shot.pulse) × .01, .0015, 3), vertical FOV 43°',geometry:'Actual world instance matrices updated after campus.setOperation and business/storage render. AABB broadphase; exact local BoxGeometry containment or majority parity tests for other volumes; exact triangle intersection with the finite near-plane rectangle, plus enclosed rectangle centres.',limit:'Dense numerical sampling, not a formal continuous-collision proof. Hardware/browser performance is not measured. Current entire shader mesh geometry is conservatively tested even when fragment uniforms fade parts of an otherwise visible mesh. Moving packaging head is sampled at ambientTime0; its complete 0.14m stroke is far beyond the camera route, but other ambient phases are not independently sampled.',ignored,recordCount:records.length,boxCandidates,triangleTests},entryMatches,entryPort:entryPoint.toArray(),entryPortExports:{business:BUSINESS_ENTRY.toArray(),storage:STORAGE_PORTS.buildingAC.toArray()},nearJoin,results,poseSamples};
writeFileSync(output,JSON.stringify(result,null,2));
for(const owner of [dcFlow,acFlow,business,storage,electrical,campus])owner.dispose();
console.log(JSON.stringify({output,sourcesChanged,actualViews:results.filter(v=>v.isActualFraming).map(v=>({name:v.name,mode:v.mode,collisionSamples:v.collisionSamples,intervals:v.collisions.map(c=>({kind:c.kind,start:c.start,end:c.end,name:c.object.name,instanceId:c.object.instanceId,group:c.object.group}))})),allIntervals:results.reduce((n,v)=>n+v.collisions.length,0),entryMatches,nearJoin},null,2));
if(results.some(v=>v.collisions.length))process.exitCode=1;
