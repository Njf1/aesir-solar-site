/** Actual-mesh business camera clearance; no browser, renderer or project writes.
 * Portable after copying to scripts/. Outside checkout, pass --project=/absolute/path.
 * Optional --interior=/absolute/candidate.ts overrides only the interior owner.
 * --step=.0001 --boundary-step=.001 --output=/absolute/report.json
 * Defaults: 0/4.2/8.4 ambient seconds plus discovered carton/gate boundary phases.
 */
import * as T from 'three';
import {registerHooks} from 'node:module';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const arg=(name,fallback)=>process.argv.find(value=>value.startsWith(`--${name}=`))?.slice(name.length+3)??fallback;
const ROOT=path.resolve(arg('project',fileURLToPath(new URL('../',import.meta.url))));
const candidateInterior=arg('interior','')?path.resolve(arg('interior','')):null;
if(!existsSync(ROOT+'/src/experience/scene.ts'))throw new Error('Use --project=<experience project>; current scene.ts was not found.');
const loaded=new Map(),hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
function track(url){if(!url.startsWith('file:'))return;const file=fileURLToPath(url);if(!file.includes('/node_modules/')&&/\.(?:ts|mjs)$/.test(file))loaded.set(file,loaded.get(file)??hash(file));}
registerHooks({resolve(specifier,context,next){
 let resolved;
 if(candidateInterior&&context.parentURL&&specifier.startsWith('.')&&fileURLToPath(new URL(specifier,context.parentURL))===ROOT+'/src/experience/interior.ts')resolved=next(pathToFileURL(candidateInterior).href,context);
 else try{resolved=next(specifier,context);}catch(error){if(specifier.startsWith('.')&&!/\.[a-z]+$/i.test(specifier)&&context.parentURL){const url=new URL(specifier+'.ts',context.parentURL);if(existsSync(fileURLToPath(url)))resolved=next(url.href,context);}if(!resolved)throw error;}
 track(resolved.url);return resolved;
}});
const sceneFile=ROOT+'/src/experience/scene.ts',sceneSource=readFileSync(sceneFile,'utf8');loaded.set(sceneFile,hash(sceneFile));
function required(re,label){const result=sceneSource.match(re);if(!result)throw new Error(`Current scene.ts ${label} no longer matches the verifier; update its source adapter before claiming clearance.`);return result;}
const fov=Number(required(/new THREE\.PerspectiveCamera\(([\d.]+),/,'camera FOV')[1]);
const nearSource=required(/shot\.scene==='site'\?THREE\.MathUtils\.clamp\(this\.camera\.position\.distanceTo\(this\.pathCentre\.set\(\.\.\.shot\.pulse\)\)\*([\d.]+),p>([\d.]+)\?([\d.]+):([\d.]+),([\d.]+)\)/,'site near-plane expression');
const nearFactor=Number(nearSource[1]),nearThreshold=Number(nearSource[2]),nearLow=Number(nearSource[3]),nearEarly=Number(nearSource[4]),nearHigh=Number(nearSource[5]);
const businessThreshold=Number(required(/this\.business\.group\.visible=[^;]*&&p>([\d.]+)/,'business visibility')[1]);
const storageThreshold=Number(required(/this\.storage\.group\.visible=[^;]*&&p>([\d.]+)/,'storage visibility')[1]);
const moduleAt=file=>import(pathToFileURL(ROOT+'/'+file).href);
const [{sampleJourney},{framingFor,smooth},{operationState,BUSINESS_ROUTE,BUSINESS_ENTRY},{createCommercialSite},{createElectricalScene},{ELECTRICAL_PATHS,ELECTRICAL_PORTS},{BusinessScene},{createStorageScene},{STORAGE_PATHS,STORAGE_PORTS},{EnergyFlow}]=await Promise.all([
 moduleAt('src/experience/journey.ts'),moduleAt('src/experience/progress.ts'),moduleAt('src/experience/business-journey.ts'),moduleAt('src/experience/commercial.ts'),moduleAt('src/experience/electrical.ts'),moduleAt('src/experience/electrical-path.ts'),moduleAt('src/experience/business.ts'),moduleAt('src/experience/storage.ts'),moduleAt('src/experience/storage-path.ts'),moduleAt('src/experience/energy-flow.ts')]);
const canvas=()=>{const c={tagName:'CANVAS',width:0,height:0},ctx=new Proxy({canvas:c},{get:(o,p)=>p in o?o[p]:()=>{}});c.getContext=()=>ctx;return c;};globalThis.document={createElement:canvas};
const baseStep=Number(arg('step','.001')),boundaryStep=Number(arg('boundary-step',String(Math.max(baseStep,.001))));
for(const step of[baseStep,boundaryStep])if(!Number.isFinite(step)||step<=0||step>.02)throw new Error('Steps must be finite, positive and <=.02.');
const output=path.resolve(arg('output',ROOT+'/docs/experience/stage-seven/business-clearance.json'));
const campus=createCommercialSite('desktop'),electrical=createElectricalScene('desktop'),business=new BusinessScene(false),storage=createStorageScene('desktop');
function sourceFlow(owner,pathName){const match=required(new RegExp(`this\\.${owner}=new EnergyFlow\\(ELECTRICAL_PATHS\\.${pathName},([\\d.]+),(\\d+),(true|false)(?:,(true|false))?\\)`),owner+' geometry');return new EnergyFlow(ELECTRICAL_PATHS[pathName],Number(match[1]),Number(match[2]),match[3]==='true',match[4]==='true');}
const dcFlow=sourceFlow('dcFlow','dcPositive'),acFlow=sourceFlow('acFlow','acOutput');electrical.group.add(dcFlow.mesh,acFlow.mesh);
const groups=[['campus',campus.group],['electrical',electrical.group],['business',business.group],['storage',storage.group]];
const fullState={lighting:1,equipment:1,screen:1};
const events=[],wrapEvents=[];
if(arg('boundaries','true')!=='false'){
 if(typeof business.asset.motionSnapshot!=='function')throw new Error('Moving-boundary mode needs the refined interior motionSnapshot(); supply --interior or integrate it, or explicitly use --boundaries=false.');
 const interiorSource=readFileSync(candidateInterior??ROOT+'/src/experience/interior.ts','utf8');if(!/E=ease\(state\.equipment\)/.test(interiorSource)||!/activeTime=t\*E/.test(interiorSource))throw new Error('Current interior activity clock changed; update the critical-phase adapter before claiming moving clearance.');
 let previous=null;
 for(let i=0;i<=20000;i++){
  const time=i*.002;business.asset.render(fullState,time);const current=business.asset.motionSnapshot();
  if(previous){
   for(let c=0;c<current.cartonCentres.length;c++)if(Math.abs(current.cartonCentres[c]-previous.cartonCentres[c])>5){events.push({time,kind:'carton-wrap',carton:c});wrapEvents.push(time);}
   if(time<=10)for(let g=0;g<current.gateOpenings.length;g++){
    const classify=n=>n<=1e-8?'closed':n>=1-1e-8?'open':'moving';
    const before=classify(previous.gateOpenings[g]),after=classify(current.gateOpenings[g]);if(before!==after)events.push({time,kind:`gate-${before}-to-${after}`,gate:g});
   }
  }previous=current;
 }
}
const boundaryPhases=[...new Set(events.flatMap(event=>[event.time-.0021,event.time+.0001]).filter(t=>t>=0).map(t=>Number(t.toFixed(4))))].sort((a,b)=>a-b);
const scenarios=[...String(arg('ambient','0,4.2,8.4')).split(',').map(Number).map(time=>({name:`ambient-${time}`,kind:'ambient',time,step:baseStep})),...boundaryPhases.map(time=>({name:`active-boundary-${time}`,kind:'boundary',time,step:boundaryStep}))];
if(scenarios.some(s=>!Number.isFinite(s.time)||s.time<0))throw new Error('Ambient times must be finite and nonnegative.');
const V=(a)=>new T.Vector3(...a),tan=Math.tan(fov*Math.PI/360),epsilon=1e-9;
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
 const version=r.o instanceof T.InstancedMesh?r.o.instanceMatrix.version:0,geometryVersion=r.g.attributes.position.version;
 const worldChanged=!r.worldMatrix||r.worldMatrix.some((n,i)=>n!==r.o.matrixWorld.elements[i]);
 if(!force&&version===r.version&&geometryVersion===r.geometryVersion&&!worldChanged)return;
 if(force||geometryVersion!==r.geometryVersion)r.g.computeBoundingBox();r.geometryVersion=geometryVersion;r.worldMatrix=r.o.matrixWorld.elements.slice();
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
function nearFrustumCuts(r,it,camera,near,rx,ry){
 transform.multiplyMatrices(camera.matrixWorldInverse,it.matrix);const pos=r.g.attributes.position,idx=r.g.index,n=idx?idx.count:pos.count;
 const sx=rx/near,sy=ry/near,planes=[[0,0,1,near],[0,0,-1,0],[1,0,-sx,0],[-1,0,-sx,0],[0,1,-sy,0],[0,-1,-sy,0]];
 // Reject an entire transformed local bounding box outside any pyramid plane.
 // This is conservative even for a rotated instance and saves per-triangle clipping.
 const e=transform.elements,box=r.g.boundingBox;
 for(const[x,y,z,d]of planes){const a=x*e[0]+y*e[1]+z*e[2],b=x*e[4]+y*e[5]+z*e[6],c=x*e[8]+y*e[9]+z*e[10],offset=x*e[12]+y*e[13]+z*e[14]+d;
  if(offset+a*(a>=0?box.max.x:box.min.x)+b*(b>=0?box.max.y:box.min.y)+c*(c>=0?box.max.z:box.min.z)<-epsilon)return null;
 }
 for(let f=0;f<n;f+=3){
  let polygon=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(pos,idx?idx.getX(f+j):f+j).applyMatrix4(transform));
  for(const[a,b,c,d]of planes){
   if(!polygon.length)break;const next=[];
   for(let j=0;j<polygon.length;j++){const first=polygon[j],second=polygon[(j+1)%polygon.length],da=a*first.x+b*first.y+c*first.z+d,db=a*second.x+b*second.y+c*second.z+d;
    if(da>=-epsilon)next.push(first);if((da>=0)!==(db>=0))next.push(first.clone().lerp(second,da/(da-db)));
   }polygon=next;
  }
  triangleTests++;if(polygon.length){return{triangle:f/3,contact:polygon[0].clone().applyMatrix4(camera.matrixWorld).toArray()};}
 }return null;
}
// A thin box wholly before the near plane: neither the eye nor near rectangle
// intersects it, but its actual triangles intersect the excluded near-frustum volume.
const frustumSelfTest=(()=>{
 const g=new T.BoxGeometry(.04,.10,.02),mesh=new T.Mesh(g,new T.MeshBasicMaterial());mesh.position.set(0,0,-.45);const group=new T.Group();group.add(mesh);const r=makeRecords('diagnostic-self-test',group)[0],it=r.items[0],camera=new T.PerspectiveCamera(fov,1,1,10);camera.lookAt(0,0,-1);camera.updateMatrixWorld(true);
 const nearSlice=planeSlice(r,it,camera,1),plane=planeCuts(nearSlice,camera,1,tan,tan),volume=nearFrustumCuts(r,it,camera,1,tan,tan),eye=contains(r,it,new T.Vector3());
 if(eye||plane||!volume)throw new Error('Near-frustum blind-spot self-test failed');
 mesh.position.x=2;group.updateMatrixWorld(true);updateRecord(r,true);if(nearFrustumCuts(r,r.items[0],camera,1,tan,tan))throw new Error('Outside-frustum rejection self-test failed');
 g.dispose();mesh.material.dispose();return{thinRiserBeforeNearPlaneDetected:true,outsideFrustumRejected:true};
})();
const viewports=[['desktop',1600,1000],['laptop',1280,720],['mobile',390,844],['intermediate',740,900],['short',1000,500]];
const modes=['landscape','portrait','short'];
const results=[],poseSamples=[],from=new T.Vector3(),aim=new T.Vector3(),pulse=new T.Vector3();
let step=baseStep;
function pose(shot,p,camera,near,state){return {p,camera:shot.camera,target:shot.target,pulse:shot.pulse,up:shot.up,near,section:state.section,entry:state.entry,equipment:state.equipment,nearPlaneCorners:[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>new T.Vector3(x*near*tan*camera.aspect,y*near*tan,-near).applyMatrix4(camera.matrixWorld).toArray())};}
function append(view,type,p,r,it,extra,currentPose){const key=`${type}/${r.id}/${it.id}`;let current=view.open.get(key);if(!current||p-current.end>step*1.05){current={kind:type,object:{group:r.group,name:r.name,instanceId:it.id,geometry:r.type,transparent:r.transparent},start:p,end:p,samples:1,first:{...currentPose,...extra,bounds:{min:it.box.min.toArray(),max:it.box.max.toArray()}},last:{...currentPose,...extra}};view.open.set(key,current);view.collisions.push(current);}else{current.end=p;current.samples++;current.last={...currentPose,...extra};}view.hitSamples.add(p);}
for(const scenario of scenarios)for(const mode of modes){
 step=scenario.step;const samples=Math.round((6.08-4.08)/step)+1;
 const views=viewports.map(([name,w,h])=>({name,mode,scenario:scenario.name,ambientMode:scenario.kind,phaseSeconds:scenario.time,actualFraming:framingFor(w,h),isActualFraming:framingFor(w,h)===mode,width:w,height:h,aspect:w/h,camera:new T.PerspectiveCamera(fov,w/h,.1,2600),collisions:[],open:new Map(),hitSamples:new Set(),nearMin:Infinity,nearMax:0,minCameraAabbClearance:Infinity,minConservativeNearMargin:Infinity}));
 for(let i=0;i<samples;i++){
  const p=Number((4.08+i*step).toFixed(9)),s=sampleJourney(p,mode),state=operationState(p);from.set(...s.camera);aim.set(...s.target);pulse.set(...s.pulse);
  const near=T.MathUtils.clamp(from.distanceTo(pulse)*nearFactor,p>nearThreshold?nearLow:nearEarly,nearHigh);
  const E=smooth(state.equipment),ambient=scenario.kind==='ambient'?scenario.time:E>1e-9?scenario.time/E:0;
  campus.setOperation(state.section,state.screen,state.dusk);business.group.visible=p>businessThreshold;business.render(state,ambient);storage.group.visible=p>storageThreshold;storage.render(state,ambient);
  electrical.setProgress(s.conversion?.ac??1,state.graphOpacity);dcFlow.render(s.conversion?.energyU??1,0,.8*(1-state.dusk)*(1-smooth((p-4.45)/.15)));acFlow.render(s.conversion?.ac??1,0,.85*(1-smooth((p-4.7)/.16)));
  for(const[,group]of groups)group.updateMatrixWorld(true);for(const r of records)updateRecord(r);
  const candidates=[];const maxRadius=near*Math.sqrt(1+tan*tan*(1+4));
  for(const r of records){if(!visible(r.o)||(scenario.kind==='boundary'&&r.group!=='business'))continue;if(r.broad.distanceToPoint(from)>Math.max(maxRadius,1))continue;for(const it of r.items){const dist=it.box.distanceToPoint(from);if(dist<=Math.max(maxRadius,1)){const inside=contains(r,it,from);candidates.push({r,it,dist,inside});boxCandidates++;}}}
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
    if(!inside&&!cut){const intrusion=nearFrustumCuts(r,it,camera,near,rx,ry);if(intrusion){currentPose??=pose(s,p,camera,near,state);append(view,'camera-to-near-frustum',p,r,it,intrusion,currentPose);}}
   }
  }
  if(scenario.kind==='ambient'&&i%Math.max(1,Math.round(.02/step))===0)poseSamples.push({scenario:scenario.name,mode,p,camera:s.camera,target:s.target,pulse:s.pulse,near,section:state.section});
 }
 for(const view of views){const {camera,open,hitSamples,...data}=view;results.push({...data,samples,collisionSamples:hitSamples.size});}
 console.error(`clearance ${scenario.name}/${mode}: ${samples} poses × ${views.length} aspects; ${views.reduce((n,v)=>n+v.collisions.length,0)} collision intervals`);
}
const entryPoint=ELECTRICAL_PORTS.buildingEntry,paths=[['inverter-ac-end',ELECTRICAL_PATHS.acOutput,1],['interior-ac-start',BUSINESS_ROUTE,0],['storage-ac-start',STORAGE_PATHS.storageAC,0],['grid-ac-start',STORAGE_PATHS.gridAC,0]];
const entryMatches=paths.map(([name,path,t])=>({name,position:path.getPointAt(t).toArray(),error:path.getPointAt(t).distanceTo(entryPoint)}));
const nearJoin=modes.map(mode=>{const left=sampleJourney(4.25-1e-7,mode),right=sampleJourney(4.25+1e-7,mode);return {mode,p:4.25,pulseJump:V(left.pulse).distanceTo(V(right.pulse)),nearBefore:T.MathUtils.clamp(V(left.camera).distanceTo(V(left.pulse))*nearFactor,4.25>nearThreshold?nearLow:nearEarly,nearHigh),nearAfter:T.MathUtils.clamp(V(right.camera).distanceTo(V(right.pulse))*nearFactor,4.25>nearThreshold?nearLow:nearEarly,nearHigh)};});
const sourcesChanged=[...loaded].filter(([file,before])=>!existsSync(file)||hash(file)!==before).map(([file])=>file);
const result={recordedAt:new Date().toISOString(),project:ROOT,candidateInterior,sourceHashes:Object.fromEntries(loaded),sourcesChanged,
 method:{frustumSelfTest,progress:[4.08,6.08],baseStep,boundaryStep,fov,nearSource:nearSource[0],businessThreshold,storageThreshold,
  ambientSeconds:scenarios.filter(s=>s.kind==='ambient').map(s=>s.time),boundaryPhases,events,
  boundaryInterpretation:'Natural ambient scenarios use the supplied time. Boundary scenarios divide active phase by eased equipment so the moving mechanism reaches that boundary at every tested active progress. Only business geometry depends on these additional times; static campus/electrical/storage geometry was already tested in each full ambient scenario.',
  framingModes:modes,viewports,geometry:'Actual current world matrices, current position-buffer versions and actual triangles. Camera-centre solid containment, finite near-plane rectangle, and six-halfspace triangle clipping against the camera-to-near pyramid. Transparent guards and explanatory tube geometry are conservatively included.',
  limit:'Numerical sampling, not a continuous proof. Ready owners are assumed. No browser, GPU, performance or visual acceptance measurement. Source adapters fail closed when FOV/near/owner visibility/flow geometry expressions change.',ignored,recordCount:records.length,boxCandidates,triangleTests},
 entryMatches,entryPort:entryPoint.toArray(),nearJoin,results,poseSamples};
writeFileSync(output,JSON.stringify(result,null,2));
for(const owner of [dcFlow,acFlow,business,storage,electrical,campus])owner.dispose();
const collisions=results.filter(v=>v.collisions.length).map(v=>({scenario:v.scenario,view:v.name,mode:v.mode,isActualFraming:v.isActualFraming,samples:v.collisionSamples,intervals:v.collisions.map(c=>({kind:c.kind,start:c.start,end:c.end,name:c.object.name,instanceId:c.object.instanceId,group:c.object.group,first:c.first}))}));
console.log(JSON.stringify({output,sourcesChanged,scenarios:scenarios.length,samplePairs:results.reduce((n,v)=>n+v.samples,0),allIntervals:results.reduce((n,v)=>n+v.collisions.length,0),collisions,entryMatches},null,2));
if(results.some(v=>v.collisions.length)||sourcesChanged.length)process.exitCode=1;
