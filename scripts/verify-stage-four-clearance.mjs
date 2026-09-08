import * as T from 'three';
import {sampleJourney,sampleGuide} from '../src/experience/journey.ts';
import {conversionState} from '../src/experience/conversion-journey.ts';
import {siteToCell,cellToSite,siteDirectionToCell} from '../src/experience/panel-layout.ts';
import {CellScene} from '../src/experience/cell.ts';
import {createCommercialSite} from '../src/experience/commercial.ts';
import {createElectricalScene} from '../src/experience/electrical.ts';
const canvas=()=>{const c={tagName:'CANVAS',width:0,height:0},ctx=new Proxy({canvas:c},{get:(o,p)=>p in o?o[p]:()=>{}});c.getContext=()=>ctx;return c;};globalThis.document={createElement:canvas};
const campus=createCommercialSite('desktop'),electrical=createElectricalScene('desktop'),cell=CellScene.prepare(false);
const vec=a=>new T.Vector3(...a),tan=Math.tan(43*Math.PI/360);
function records(group){group.updateMatrixWorld(true);const result=[];group.traverse(o=>{
 if(!(o instanceof T.Mesh)||!o.visible)return;o.geometry.computeBoundingBox();
 const materials=[o.material].flat(),transparent=materials.every(m=>m.transparent),items=[];
 if(o instanceof T.InstancedMesh){for(let i=0;i<o.count;i++){const matrix=new T.Matrix4();o.getMatrixAt(i,matrix);matrix.premultiply(o.matrixWorld);const box=o.geometry.boundingBox.clone().applyMatrix4(matrix);if(box.isEmpty()||box.getSize(new T.Vector3()).lengthSq()<1e-18)continue;items.push({matrix,box,instanceId:i});}}
 else items.push({matrix:o.matrixWorld.clone(),box:o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)});
 const broad=new T.Box3();for(const item of items)broad.union(item.box);
 result.push({name:o.name,object:o,geometry:o.geometry,broad,items,transparent});
 });return result;}
electrical.setProgress(1);const exterior=[...records(campus.group),...records(electrical.group)];const cabinet=exterior.filter(record=>['Generic closed inverter enclosure','Unbranded inverter front cover'].includes(record.name));let lastSection=-1,interior=[];
function segmentHitsRect(a,b,rx,ry){let lo=0,hi=1;for(const [coord,limit] of [['x',rx],['y',ry]]){const start=a[coord],d=b[coord]-start;if(Math.abs(d)<1e-14){if(start< -limit||start>limit)return false;}else{let n=(-limit-start)/d,f=(limit-start)/d;if(n>f)[n,f]=[f,n];lo=Math.max(lo,n);hi=Math.min(hi,f);if(lo>hi)return false;}}return true;}
function planeCuts(record,item,camera,near){const pos=record.geometry.attributes.position,idx=record.geometry.index;const transform=new T.Matrix4().multiplyMatrices(camera.matrixWorldInverse,item.matrix),vertices=[new T.Vector3(),new T.Vector3(),new T.Vector3()],rx=near*tan*camera.aspect,ry=near*tan;let cuts=0;
 for(let f=0;f<(idx?idx.count:pos.count);f+=3){for(let j=0;j<3;j++)vertices[j].fromBufferAttribute(pos,idx?idx.getX(f+j):f+j).applyMatrix4(transform);const intersections=[];
  for(let j=0;j<3;j++){const a=vertices[j],b=vertices[(j+1)%3],da=a.z+near,db=b.z+near;if(da*db<0)intersections.push(a.clone().lerp(b,da/(da-db)));else if(Math.abs(da)<1e-10)intersections.push(a.clone());}
  if(intersections.length>=2&&segmentHitsRect(intersections[0],intersections[1],rx,ry))cuts++;
 }return cuts;}
function append(list,p,extra){const last=list.at(-1);if(last&&p-last.end<.00011&&JSON.stringify(last.detail)===JSON.stringify(extra))last.end=p;else list.push({start:p,end:p,detail:extra});}
const output=[];
for(const [mode,aspect] of [['landscape',1.6],['portrait',390/844],['short',2],['portrait',740/900],['landscape',1280/720]]){
 const camera=new T.PerspectiveCamera(43,aspect,.1,2600);const cuts=[],contained=[],photonOffscreen=[],currentOffscreen=[],waveformOffscreen=[],cabinetOffscreen=[];let minGuideDepth=Infinity,minNearMargin=Infinity,minAimDistance=Infinity;
 for(let i=22500;i<=40800;i++){
  const p=i/10000,s=sampleJourney(p,mode),state=conversionState(p),from=vec(s.camera),aim=vec(s.target),photon=vec(s.pulse),distance=from.distanceTo(aim);
  minAimDistance=Math.min(minAimDistance,distance);
  const near=s.scene==='cell'?T.MathUtils.clamp(distance*.002,.012,.08):T.MathUtils.clamp(from.distanceTo(photon)*.01,p>2.25?.0015:.05,3);
  camera.near=near;camera.position.copy(from);camera.up.set(...s.up);camera.lookAt(aim);camera.updateMatrixWorld();camera.updateProjectionMatrix();
  const clipRadius=near*Math.sqrt(1+tan*tan*(1+aspect*aspect));
  if(s.scene==='cell'&&state.section!==lastSection){cell.render(state,0);interior=records(cell.group);lastSection=state.section;}
  const meshes=s.scene==='cell'?interior:exterior;
  for(const record of meshes){if(record.broad.distanceToPoint(from)>clipRadius)continue;for(const item of record.items){const clearance=item.box.distanceToPoint(from)-clipRadius;minNearMargin=Math.min(minNearMargin,clearance);if(clearance>0)continue;
    const local=from.clone().applyMatrix4(item.matrix.clone().invert());if(record.geometry.type==='BoxGeometry'&&record.geometry.boundingBox.containsPoint(local))append(contained,p,{name:record.name,transparent:record.transparent,occluded:state.transition>=.98});
    const count=planeCuts(record,item,camera,near);if(count)append(cuts,p,{name:record.name,transparent:record.transparent,occluded:state.transition>=.98});
   }}
  if(s.pulseOpacity>.01){const ndc=photon.clone().project(camera);const z=-photon.clone().applyMatrix4(camera.matrixWorldInverse).z;minGuideDepth=Math.min(minGuideDepth,z-near);if(Math.abs(ndc.x)>1||Math.abs(ndc.y)>1||ndc.z< -1||ndc.z>1)append(photonOffscreen,p,{scene:s.scene,occluded:state.transition>=.98});}
  if(p>3.10&&p<3.73&&state.transition<.98){const ndc=photon.clone().project(camera);if(Math.abs(ndc.x)>1||Math.abs(ndc.y)>1||ndc.z< -1||ndc.z>1)append(currentOffscreen,p,{scene:s.scene});}
  if(p>=3.8&&state.ac>.15){let clipped=false;for(const record of cabinet)for(const item of record.items)for(const x of [item.box.min.x,item.box.max.x])for(const y of [item.box.min.y,item.box.max.y])for(const z of [item.box.min.z,item.box.max.z]){const ndc=new T.Vector3(x,y,z).project(camera);if(Math.abs(ndc.x)>1||Math.abs(ndc.y)>1||ndc.z< -1||ndc.z>1)clipped=true;}if(clipped)append(cabinetOffscreen,p,{scene:s.scene});const positions=electrical.overlay.geometry.attributes.position;let out=false;for(let j=0;j<positions.count;j++){const ndc=new T.Vector3().fromBufferAttribute(positions,j).applyMatrix4(electrical.overlay.matrixWorld).project(camera);if(Math.abs(ndc.x)>1||Math.abs(ndc.y)>1||ndc.z< -1||ndc.z>1)out=true;}if(out)append(waveformOffscreen,p,{scene:s.scene});}
 }
 output.push({mode,aspect,samples:18301,minAimDistance,minGuideDepth,cuts,contained,photonOffscreen,currentOffscreen,waveformOffscreen,cabinetOffscreen});
}
const joins=[];for(const mode of ['landscape','portrait','short'])for(const p of [2.25,2.38,3.08]){
 const before=sampleJourney(p-1e-7,mode),after=sampleJourney(p+1e-7,mode),left=x=>p===2.38?siteToCell(vec(x)):p===3.08?cellToSite(vec(x)):vec(x);
 joins.push({mode,p,camera:left(before.camera).distanceTo(vec(after.camera)),target:left(before.target).distanceTo(vec(after.target)),optical:p===3.08?'photon already absorbed; electrical cue is separate':left(before.pulse).distanceTo(vec(after.pulse)),transitionBefore:conversionState(p-1e-7).transition,transitionAfter:conversionState(p+1e-7).transition});
}
const before=sampleJourney(2.25-1e-7),after=sampleJourney(2.25+1e-7);
const trailSwitch={beforeLength:sampleGuide(before,0).distanceTo(sampleGuide(before,.1)),afterLength:sampleGuide(after,0).distanceTo(sampleGuide(after,.1)),tailWorldJump:sampleGuide(before,.1).distanceTo(sampleGuide(after,.1))};
console.log(JSON.stringify({note:'Actual triangle/near-plane intersections. Transparent aperture cuts and full transition coverage are explicitly tagged; not silently counted as passes. Current-front offscreen spans are composition indicators, not photon failures.',joins,trailSwitch,views:output},null,2));
cell.dispose();electrical.dispose();campus.dispose();
