import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {sampleJourney,sampleGuide,journeyCopy} from '../src/experience/journey.ts';
import {conversionState,ABSORPTION_POINT,MODULE_RETURN_CAMERA,MODULE_JUNCTION} from '../src/experience/conversion-journey.ts';
import {PANEL,SELECTED_CELL,CELL_SCALE,PANEL_NORMAL,PANEL_RIGHT,PANEL_DOWN,TARGET_CELL_WORLD,cellLayout,moduleUV,panelPoint,siteToCell,cellToSite,siteDirectionToCell} from '../src/experience/panel-layout.ts';
import {HERO_ANCHOR} from '../src/experience/site-layout.ts';
import {STILL_VIEWS,CELL_SWITCH,CELL_EXIT,STAGE_THREE_END,JOURNEY_END,CHAPTERS} from '../src/experience/timeline.ts';
import {CellScene} from '../src/experience/cell.ts';
import {createCommercialSite} from '../src/experience/commercial.ts';
import {createElectricalScene} from '../src/experience/electrical.ts';
import {ELECTRICAL_PATHS,ELECTRICAL_ANCHORS,ELECTRICAL_PORTS} from '../src/experience/electrical-path.ts';
import {EnergyFlow} from '../src/experience/energy-flow.ts';
import {CELL_BUDGET,ELECTRICAL_BUDGET} from '../src/experience/budgets.ts';
const modes=['landscape','portrait','short'],v=a=>new T.Vector3(...a);
const near=(a,b,e,label)=>assert.ok(a.distanceTo(b)<=e,`${label}: ${a.distanceTo(b)} > ${e}`);
const approx=(a,b,e,label)=>assert.ok(Math.abs(a-b)<=e,`${label}: ${a} != ${b}`);
function fakeCanvas(){const canvas={tagName:'CANVAS',width:0,height:0,rects:[]};const state={canvas,fillStyle:'',fillRect(x,y,w,h){canvas.rects.push({style:this.fillStyle,x,y,w,h});},createLinearGradient(){return{addColorStop(){}};},createRadialGradient(){return{addColorStop(){}};}};canvas.getContext=()=>new Proxy(state,{get:(o,p)=>p in o?o[p]:()=>{}});return canvas;}
function withCanvas(fn){const old=globalThis.document;globalThis.document={createElement:()=>fakeCanvas()};try{return fn();}finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}}
function named(group,name){let found;group.traverse(o=>{if(o.name===name)found=o;});assert.ok(found,`authored object missing: ${name}`);return found;}
function heroGlass(asset){const mesh=asset.group.children.find(o=>o.name.startsWith('PV glass and cells'));assert.ok(mesh);asset.group.updateMatrixWorld(true);let matrix;for(let i=0;i<mesh.count;i++){const m=new T.Matrix4();mesh.getMatrixAt(i,m);m.premultiply(mesh.matrixWorld);if(new T.Vector3().setFromMatrixPosition(m).distanceTo(HERO_ANCHOR)<1e-5){matrix=m;break;}}assert.ok(matrix,'actual hero glass instance');return{mesh,matrix,inverse:matrix.clone().invert()};}

// These tests compare the layout contract to the actual exterior drawing and
// actual interior instances, so a copied but unused constant cannot make them pass.
test('all exterior raster cells and their UVs register to the actual hero glass',()=>withCanvas(()=>{
 for(const tier of ['mobile','desktop']){const asset=createCommercialSite(tier);try{
  const {mesh,inverse}=heroGlass(asset),canvas=mesh.material.map.image,rects=canvas.rects.filter(r=>r.style.startsWith('rgb('));
  assert.equal(rects.length,PANEL.rows*PANEL.cols);
  for(let row=0;row<PANEL.rows;row++)for(let col=0;col<PANEL.cols;col++){
   const cell=cellLayout(row,col),r=rects[row*PANEL.cols+col],local=panelPoint(cell.x,0,cell.z).applyMatrix4(inverse),uv=moduleUV(cell.x,cell.z);
   approx(local.x+.5,uv.u,3e-7,'actual glass u');approx(local.y+.5,uv.v,3e-7,'actual glass v');
   approx((r.x+r.w/2)/canvas.width,uv.u,1e-12,'raster column centre');approx((r.y+r.h/2)/canvas.height,1-uv.v,1e-12,'raster row centre');
   approx(r.w/canvas.width,cell.width/PANEL.glassWidth,1e-12,'raster cell width');approx(r.h/canvas.height,cell.length/PANEL.glassLength,1e-12,'raster cell length');
   assert.ok(r.x>0&&r.y>0&&r.x+r.w<canvas.width&&r.y+r.h<canvas.height,'cells stay inside frame');
  }
 }finally{asset.dispose();}}
}));

test('selected cell, neighbours, protective glass and underside junction share exterior coordinates',()=>{
 const cell=CellScene.prepare(false);try{
  near(siteToCell(TARGET_CELL_WORLD),new T.Vector3(0,.8,0),1e-10,'registered glass surface');
  for(const point of [HERO_ANCHOR,TARGET_CELL_WORLD,panelPoint(-.4,.02,.9),MODULE_RETURN_CAMERA,MODULE_JUNCTION])near(cellToSite(siteToCell(point)),point,1e-12,'world/local round trip');
  near(PANEL_RIGHT.clone().cross(PANEL_NORMAL),PANEL_DOWN,1e-12,'right handed panel basis');
  const neighbors=named(cell.group,'143 neighboring silicon cells'),body=named(cell.group,'Selected silicon absorber');
  cell.group.updateMatrixWorld(true);let index=0;
  for(let row=0;row<PANEL.rows;row++)for(let col=0;col<PANEL.cols;col++){
   const layout=cellLayout(row,col),m=new T.Matrix4();if(row===SELECTED_CELL.row&&col===SELECTED_CELL.col)m.copy(body.matrixWorld);else{neighbors.getMatrixAt(index++,m);m.premultiply(neighbors.matrixWorld);}
   near(cellToSite(new T.Vector3(0,.5,0).applyMatrix4(m)),panelPoint(layout.x,-.016,layout.z),2e-7,`cell ${row}/${col} surface`);
  }
  near(cellToSite(cell.junction),MODULE_JUNCTION,1e-12,'same underside junction');near(cell.absorptionPoint,ABSORPTION_POINT,1e-12,'sampler and geometry absorption anchor');
  assert.ok(Math.abs(SELECTED_CELL.x)>SELECTED_CELL.width/2,'chosen cell does not cover the central column seam');
  assert.ok(Math.abs(SELECTED_CELL.z)>SELECTED_CELL.length/2+PANEL.centreGap/2,'chosen cell clears the half-cell split');
  const glass=named(cell.group,'Protective glass with sectional opening'),m=new T.Matrix4();glass.getMatrixAt(0,m);
  for(const x of [-.5,.5])for(const z of [-.5,.5]){const point=cellToSite(new T.Vector3(x,.5,z).applyMatrix4(m));approx(point.clone().sub(HERO_ANCHOR).dot(PANEL_NORMAL),0,1e-7,'closed glass top is the original exterior plane');}
 }finally{cell.dispose();}
});

test('the teaching aperture reveals only the selected absorber and reverses without moving the stack',()=>{
 const cell=CellScene.prepare(false);try{
  const glass=named(cell.group,'Protective glass with sectional opening'),encap=named(cell.group,'Encapsulant with sectional opening'),body=named(cell.group,'Selected silicon absorber');
  const before={glass:Array.from(glass.instanceMatrix.array),encap:Array.from(encap.instanceMatrix.array),body:body.position.toArray(),scale:body.scale.toArray()};
  const ray=new T.Raycaster(ABSORPTION_POINT.clone().add(new T.Vector3(0,5,0)),new T.Vector3(0,-1,0));cell.group.updateMatrixWorld(true);
  const closed=ray.intersectObjects([glass,encap,body],false);assert.equal(closed[0]?.object,glass,'closed layer lies above the cell');
  cell.render({section:1,absorption:1,extraction:1,incident:0},0);cell.group.updateMatrixWorld(true);
  const open=ray.intersectObjects([glass,encap,body],false);assert.equal(open[0]?.object,body,'aperture exposes silicon, not a floating pane');
  body.geometry.computeBoundingBox();const local=ABSORPTION_POINT.clone().applyMatrix4(body.matrixWorld.clone().invert());assert.ok(body.geometry.boundingBox.containsPoint(local),'optical endpoint remains in selected silicon');
  assert.equal(cell.snapshot().state.incident,0);
  cell.render({section:0,absorption:0,extraction:0,incident:1},0);
  assert.deepEqual(Array.from(glass.instanceMatrix.array),before.glass);assert.deepEqual(Array.from(encap.instanceMatrix.array),before.encap);assert.deepEqual(body.position.toArray(),before.body);assert.deepEqual(body.scale.toArray(),before.scale);
 }finally{cell.dispose();}
});

test('absorption finishes before extraction and the optical guide never travels down the circuit',()=>{
 let prior={section:0,absorption:0,extraction:0,energyU:0,ac:0};
 for(let i=Math.round(STAGE_THREE_END*1000);i<=Math.round(JOURNEY_END*1000);i++){
  const p=i/1000,s=sampleJourney(p),state=conversionState(p);
  for(const key of ['section','absorption','extraction','energyU','ac']){assert.ok(state[key]>=prior[key]-1e-12,`${key} runs backward at${p}`);assert.ok(state[key]>=0&&state[key]<=1);}
  approx(state.incident+state.absorption,1,1e-12,'incident light ends with absorption');
  if(state.extraction>0){assert.equal(state.absorption,1,'collection must follow absorption');assert.equal(s.pulseOpacity,0,'the original photon must have ended');}
  if(state.energyU>0){assert.equal(state.extraction,1);assert.ok(p>=CELL_EXIT);assert.equal(s.pulseOpacity,0);}
  if(state.ac>0)assert.equal(state.energyU,1,'AC cue follows arrival at the inverter');
  prior=state;
 }
 assert.equal(sampleJourney(2.71).pulseOpacity,0);near(v(sampleJourney(2.71).pulse),ABSORPTION_POINT,1e-10,'photon ends at the absorber');
});

test('new chapter states and HTML stills reconstruct identically in reverse',()=>{
 const points=Array.from({length:916},(_,i)=>STAGE_THREE_END+i*.002).filter(p=>p<=JOURNEY_END);points.push(CELL_SWITCH,CELL_EXIT,JOURNEY_END);
 for(const mode of modes){const forward=points.map(p=>sampleJourney(p,mode));for(let i=points.length-1;i>=0;i--){const s=sampleJourney(points[i],mode);assert.deepEqual(s,forward[i]);for(const key of ['camera','target','pulse','tangent','up'])assert.ok(s[key].every(Number.isFinite));assert.ok(v(s.camera).distanceTo(v(s.target))>.001);approx(v(s.up).length(),1,1e-10,'unit camera up');if(s.pulseOpacity>.001)near(sampleGuide(s,0),v(s.pulse),1e-9,'visible optical head');}}
 for(const [name,p]of Object.entries(STILL_VIEWS)){const s=sampleJourney(p),copy=journeyCopy(p,true);assert.equal(copy.filter(x=>x>.5).length,1,`${name}: one readable HTML view`);assert.ok(copy.every(x=>x>=0&&x<=1));assert.ok((s.conversion?.transition??s.cloudOpacity)<.01,`${name}: must not be an opaque transition`);}
 assert.equal(sampleJourney(STILL_VIEWS.cell).scene,'cell');assert.equal(sampleJourney(STILL_VIEWS.dc).scene,'site');assert.equal(conversionState(STILL_VIEWS.inverter).ac,1);
 for(let i=1;i<CHAPTERS.length;i++)assert.equal(CHAPTERS[i].start,CHAPTERS[i-1].end);
});

test('camera and aim are continuous through both scale joins and the original panel stop',()=>{
 const h=1e-6;
 for(const mode of modes)for(const p of [STAGE_THREE_END,CELL_SWITCH,CELL_EXIT]){
  const frame=(value,k)=>k<0?(p===CELL_SWITCH?siteToCell(v(value)):p===CELL_EXIT?cellToSite(v(value)):v(value)):v(value);
  for(const key of ['camera','target']){
   const points=[-2,-1,0,1,2].map(k=>frame(sampleJourney(p+k*h,mode)[key],k));const[m2,m1,c,p1,p2]=points;
   near(m1,p1,.001,`${mode} ${key} C0 ${p}`);
   const left=c.clone().multiplyScalar(3).addScaledVector(m1,-4).add(m2).divideScalar(2*h),right=c.clone().multiplyScalar(-3).addScaledVector(p1,4).addScaledVector(p2,-1).divideScalar(2*h);
   near(left,right,.005*Math.max(1,left.length(),right.length()),`${mode} ${key} C1 ${p}`);
  }
  if(p===CELL_SWITCH){const before=sampleJourney(p-h,mode),after=sampleJourney(p+h,mode);near(siteToCell(v(before.pulse)),v(after.pulse),.001,'same optical point through glass rebase');near(siteDirectionToCell(v(before.up)),v(after.up),1e-6,'same orientation through glass rebase');}
  if(p!==STAGE_THREE_END)assert.equal(conversionState(p).transition,1,'scale handoff is explicitly covered');
 }
 near(v(sampleJourney(CELL_EXIT).camera),MODULE_RETURN_CAMERA,1e-10,'exact macro return camera');near(v(sampleJourney(CELL_EXIT).target),MODULE_JUNCTION,1e-10,'exact macro return aim');
});

test('incoming optical trail remains attached and keeps its prefix at the new glass path',()=>{
 const eps=1e-7;
 for(const mode of modes){const before=sampleJourney(STAGE_THREE_END-eps,mode),after=sampleJourney(STAGE_THREE_END+eps,mode);for(let i=0;i<=20;i++)near(sampleGuide(before,i*.005),sampleGuide(after,i*.005),.0001,`trail prefix ${mode} ${i}`);}
 for(let i=0;i<=150;i++){const p=STAGE_THREE_END+(2.70-STAGE_THREE_END)*i/150,s=sampleJourney(p);if(s.pulseOpacity>.001){near(sampleGuide(s,0),v(s.pulse),1e-9,'optical head');near(sampleGuide(s,-1),v(s.pulse),1e-9,'negative trail distance stays at head');}}
});

function resources(group){const geometries=new Set(),materials=new Set(),instances=new Set(),textures=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.isInstancedMesh)instances.add(o);for(const m of[o.material].flat().filter(Boolean)){materials.add(m);for(const item of Object.values(m))if(item?.isTexture)textures.add(item);}});return{geometries,materials,instances,textures,all:new Set([...geometries,...materials,...instances,...textures])};}
function actualBytes(group){const r=resources(group);let n=0;for(const g of r.geometries)n+=Object.values(g.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(g.index?.array.byteLength??0);for(const mesh of r.instances)n+=mesh.instanceMatrix.array.byteLength+(mesh.instanceColor?.array.byteLength??0);return n;}
function actualTriangles(group){let n=0;group.traverse(o=>{if(o.isMesh)n+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);});return n;}
function disposalAudit(group){const r=resources(group),counts=new Map([...r.all].map(x=>[x,0]));for(const x of r.all)x.addEventListener('dispose',()=>counts.set(x,counts.get(x)+1));return()=>{for(const[x,count]of counts)assert.equal(count,1,`${x.type||x.name}: dispose count`);assert.equal(group.children.length,0);};}

test('cell and electrical allocations fit actual buffer budgets and release every owned resource once',()=>{
 for(const mobile of[false,true]){
  const cell=CellScene.prepare(mobile);let cellDispose;
  try{const stats=cell.snapshot();assert.equal(actualBytes(cell.group),stats.geometryBytes);assert.equal(actualTriangles(cell.group),stats.triangles);assert.ok(stats.geometryBytes<=CELL_BUDGET.geometryBytes);assert.ok(stats.triangles<=CELL_BUDGET.triangles);assert.ok(stats.baseDrawCalls<=CELL_BUDGET.baseDrawCalls);assert.equal(resources(cell.group).textures.size,0);cellDispose=disposalAudit(cell.group);}finally{cell.dispose();cell.dispose();}cellDispose();
  const asset=createElectricalScene(mobile?'mobile':'desktop'),dc=new EnergyFlow(ELECTRICAL_PATHS.dcPositive,.026,176,true),ac=new EnergyFlow(ELECTRICAL_PATHS.acOutput,.021,64,false);asset.group.add(dc.mesh,ac.mesh);
  let audit;try{assert.equal(actualBytes(asset.group),asset.stats.geometryBytes+dc.geometryBytes+ac.geometryBytes);assert.ok(actualBytes(asset.group)<=ELECTRICAL_BUDGET.geometryBytes);assert.ok(actualTriangles(asset.group)<=ELECTRICAL_BUDGET.triangles);assert.ok(asset.stats.drawCalls+2<=ELECTRICAL_BUDGET.baseDrawCalls);assert.equal(resources(asset.group).textures.size,0);audit=disposalAudit(asset.group);}finally{dc.dispose();ac.dispose();asset.dispose();asset.dispose();}audit();
 }
});

test('electrical paths meet the authored source and distinct inverter ports without geometric cable waves',()=>{
 near(ELECTRICAL_PATHS.dcPositive.getPointAt(0),ELECTRICAL_ANCHORS.dcSourcePositive,1e-12,'DC source+');near(ELECTRICAL_PATHS.dcNegative.getPointAt(0),ELECTRICAL_ANCHORS.dcSourceNegative,1e-12,'DC source−');
 for(const[key,port]of[['dcPositive',ELECTRICAL_PORTS.dcPositive],['dcNegative',ELECTRICAL_PORTS.dcNegative],['acOutput',ELECTRICAL_PORTS.buildingEntry]])near(ELECTRICAL_PATHS[key].getPointAt(1),port,1e-12,`${key} endpoint`);
 near(ELECTRICAL_PATHS.acOutput.getPointAt(0),ELECTRICAL_PORTS.acOutput,1e-12,'AC has its own output gland');
 assert.ok(ELECTRICAL_PORTS.dcPositive.distanceTo(ELECTRICAL_PORTS.dcNegative)>.1);assert.ok(ELECTRICAL_PORTS.dcNegative.distanceTo(ELECTRICAL_PORTS.acOutput)>.1);
 for(const path of Object.values(ELECTRICAL_PATHS))for(let i=0;i<=300;i++){assert.ok(path.getPointAt(i/300).toArray().every(Number.isFinite));approx(path.getTangentAt(i/300).length(),1,1e-8,'unit route tangent');}
 const asset=createElectricalScene('desktop');try{asset.setProgress(0);assert.equal(asset.overlay.visible,false);asset.setProgress(1);assert.equal(asset.overlay.visible,true);asset.setProgress(0);assert.equal(asset.overlay.visible,false);assert.ok(asset.overlay.name.includes('voltage versus time'),'waveform is a separate teaching overlay');}finally{asset.dispose();}
});

const tan=Math.tan(43*Math.PI/360);
function records(group){group.updateMatrixWorld(true);const result=[];group.traverse(o=>{
 if(!(o instanceof T.Mesh)||!o.visible)return;o.geometry.computeBoundingBox();
 const materials=[o.material].flat(),transparent=materials.every(m=>m.transparent),items=[];
 if(o instanceof T.InstancedMesh){for(let i=0;i<o.count;i++){const matrix=new T.Matrix4();o.getMatrixAt(i,matrix);matrix.premultiply(o.matrixWorld);const box=o.geometry.boundingBox.clone().applyMatrix4(matrix);if(box.isEmpty()||box.getSize(new T.Vector3()).lengthSq()<1e-18)continue;items.push({matrix,box,instanceId:i});}}
 else items.push({matrix:o.matrixWorld.clone(),box:o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)});
 const broad=new T.Box3();for(const item of items)broad.union(item.box);
 result.push({name:o.name,object:o,geometry:o.geometry,broad,items,transparent});
 });return result;}

function segmentHitsRect(a,b,rx,ry){let lo=0,hi=1;for(const [coord,limit] of [['x',rx],['y',ry]]){const start=a[coord],d=b[coord]-start;if(Math.abs(d)<1e-14){if(start< -limit||start>limit)return false;}else{let n=(-limit-start)/d,f=(limit-start)/d;if(n>f)[n,f]=[f,n];lo=Math.max(lo,n);hi=Math.min(hi,f);if(lo>hi)return false;}}return true;}
function planeCuts(record,item,camera,near){const pos=record.geometry.attributes.position,idx=record.geometry.index;const transform=new T.Matrix4().multiplyMatrices(camera.matrixWorldInverse,item.matrix),vertices=[new T.Vector3(),new T.Vector3(),new T.Vector3()],rx=near*tan*camera.aspect,ry=near*tan;let cuts=0;
 for(let f=0;f<(idx?idx.count:pos.count);f+=3){for(let j=0;j<3;j++)vertices[j].fromBufferAttribute(pos,idx?idx.getX(f+j):f+j).applyMatrix4(transform);const intersections=[];
  for(let j=0;j<3;j++){const a=vertices[j],b=vertices[(j+1)%3],da=a.z+near,db=b.z+near;if(da*db<0)intersections.push(a.clone().lerp(b,da/(da-db)));else if(Math.abs(da)<1e-10)intersections.push(a.clone());}
  if(intersections.length>=2&&segmentHitsRect(intersections[0],intersections[1],rx,ry))cuts++;
 }return cuts;}


test('new near planes do not cut visible cell/campus solids in five framings',()=>withCanvas(()=>{
 const campus=createCommercialSite('desktop'),electrical=createElectricalScene('desktop'),cell=CellScene.prepare(false);
 try{
  electrical.setProgress(1);const exterior=[...records(campus.group),...records(electrical.group)];
  for(const [mode,aspect]of[['landscape',1.6],['portrait',390/844],['short',2],['portrait',740/900],['landscape',1280/720]]){
   const camera=new T.PerspectiveCamera(43,aspect,.1,2600);let lastSection=-1,interior=[];
   for(let i=0;i<=915;i++){
    const p=STAGE_THREE_END+(JOURNEY_END-STAGE_THREE_END)*i/915,s=sampleJourney(p,mode),state=conversionState(p),from=v(s.camera),aim=v(s.target);
    const nearPlane=s.scene==='cell'?T.MathUtils.clamp(from.distanceTo(aim)*.002,.012,.08):T.MathUtils.clamp(from.distanceTo(v(s.pulse))*.01,p>STAGE_THREE_END?.0015:.05,3);
    camera.near=nearPlane;camera.position.copy(from);camera.up.set(...s.up);camera.lookAt(aim);camera.updateMatrixWorld();camera.updateProjectionMatrix();
    const clipRadius=nearPlane*Math.sqrt(1+tan*tan*(1+aspect*aspect));
    if(s.scene==='cell'&&state.section!==lastSection){cell.render(state,0);interior=records(cell.group);lastSection=state.section;}
    for(const record of s.scene==='cell'?interior:exterior){if(record.broad.distanceToPoint(from)>clipRadius)continue;for(const item of record.items){
     if(item.box.distanceToPoint(from)>clipRadius)continue;
     const local=from.clone().applyMatrix4(item.matrix.clone().invert());
     assert.ok(!(record.geometry.type==='BoxGeometry'&&record.geometry.boundingBox.containsPoint(local)),`${mode} ${p}: camera inside ${record.name} (transparent=${record.transparent}; transition=${state.transition})`);
     assert.equal(planeCuts(record,item,camera,nearPlane),0,`${mode} ${p}: near plane cuts ${record.name} (transparent=${record.transparent}; transition=${state.transition})`);
    }}
    if(s.pulseOpacity>.01&&state.transition<.98){const head=v(s.pulse).project(camera);assert.ok(Math.abs(head.x)<1&&Math.abs(head.y)<1&&head.z> -1&&head.z<1,`${mode} ${p}: incident photon left the frame`);}
   }
  }
 }finally{cell.dispose();electrical.dispose();campus.dispose();}
}));

test('the complete inverter cabinet and voltage-versus-time overlay fit the late views',()=>{
 const asset=createElectricalScene('desktop');try{
  asset.setProgress(1);asset.group.updateMatrixWorld(true);
  const objects=[asset.overlay,named(asset.group,'Generic closed inverter enclosure'),named(asset.group,'Unbranded inverter front cover')],points=[];
  for(const object of objects){object.geometry.computeBoundingBox();const box=object.geometry.boundingBox;for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z])points.push({name:object.name,point:new T.Vector3(x,y,z).applyMatrix4(object.matrixWorld)});}
  for(const[mode,aspect]of[['landscape',1.6],['portrait',390/844],['short',2],['portrait',740/900],['landscape',1280/720]]){
   const camera=new T.PerspectiveCamera(43,aspect,.0015,2600);
   for(let i=0;i<=120;i++){const p=3.8+(JOURNEY_END-3.8)*i/120;if(conversionState(p).ac<=.15)continue;const s=sampleJourney(p,mode);camera.position.set(...s.camera);camera.up.set(...s.up);camera.lookAt(...s.target);camera.updateMatrixWorld();
    for(const{name,point}of points){const ndc=point.clone().project(camera);assert.ok(Math.abs(ndc.x)<1&&Math.abs(ndc.y)<1&&ndc.z> -1&&ndc.z<1,`${mode} ${p}: ${name} clipped at ${ndc.toArray()}`);}
   }
  }
 }finally{asset.dispose();}
});

test('the independent current reveal remains visible while the camera follows DC routing',()=>{
 for(const[mode,aspect]of[['landscape',1.6],['portrait',390/844],['short',2],['portrait',740/900],['landscape',1280/720]]){
  const camera=new T.PerspectiveCamera(43,aspect,.0015,2600);
  for(let i=0;i<=630;i++){const p=3.10+i*.001,s=sampleJourney(p,mode),front=v(s.pulse);camera.position.set(...s.camera);camera.up.set(...s.up);camera.lookAt(v(s.target));camera.updateMatrixWorld();
   const ndc=front.project(camera);assert.ok(Math.abs(ndc.x)<=1&&Math.abs(ndc.y)<=1&&ndc.z>=-1&&ndc.z<=1,`${mode}/${aspect} DC reveal front clipped at${p}: ${ndc.toArray()}`);
  }
 }
});
