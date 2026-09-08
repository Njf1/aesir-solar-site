import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {sampleJourney,sampleGuide,journeyCopy} from '../src/experience/journey.ts';
import {conversionState,ABSORPTION_POINT,MODULE_RETURN_CAMERA,MODULE_JUNCTION} from '../src/experience/conversion-journey.ts';
import {PANEL,SELECTED_CELL,CELL_SCALE,PANEL_NORMAL,PANEL_RIGHT,PANEL_DOWN,TARGET_CELL_WORLD,cellLayout,moduleUV,panelPoint,siteToCell,cellToSite,siteDirectionToCell} from '../src/experience/panel-layout.ts';
import {HERO_ANCHOR} from '../src/experience/site-layout.ts';
import {STILL_VIEWS,CELL_SWITCH,CELL_EXIT,STAGE_THREE_END,STAGE_FOUR_END as JOURNEY_END,CHAPTERS} from '../src/experience/timeline.ts';
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
  const glass=named(cell.group,'Protective glass with sectional opening'),positions=glass.geometry.attributes.position;glass.geometry.computeBoundingBox();
  let topVertices=0;for(let i=0;i<positions.count;i++)if(Math.abs(positions.getY(i)-glass.geometry.boundingBox.max.y)<1e-6){
   const point=cellToSite(new T.Vector3().fromBufferAttribute(positions,i).applyMatrix4(glass.matrixWorld));
   approx(point.clone().sub(HERO_ANCHOR).dot(PANEL_NORMAL),0,1e-7,'every actual pane top vertex lies on the original exterior plane');topVertices++;
  }assert.ok(topVertices>=4,'registered physical glass surface exists');
 }finally{cell.dispose();}
});

test('the teaching aperture reveals only the selected absorber and reverses without moving the stack',()=>{
 const cell=CellScene.prepare(false);try{
  const glass=named(cell.group,'Protective glass with sectional opening'),encap=named(cell.group,'Encapsulant with sectional opening'),body=named(cell.group,'Selected silicon absorber');
  const before={glass:Array.from(glass.geometry.attributes.position.array),encap:Array.from(encap.geometry.attributes.position.array),body:body.position.toArray(),scale:body.scale.toArray()};
  const buffers=[glass,encap].map(o=>({geometry:o.geometry,position:o.geometry.attributes.position,index:o.geometry.index,normal:o.geometry.attributes.normal,uv:o.geometry.attributes.uv}));
  const ray=new T.Raycaster(ABSORPTION_POINT.clone().add(new T.Vector3(0,5,0)),new T.Vector3(0,-1,0));cell.group.updateMatrixWorld(true);
  const closed=ray.intersectObjects([glass,encap,body],false);assert.equal(closed[0]?.object,glass,'closed layer lies above the cell');
  cell.render({section:1,absorption:1,extraction:1,incident:0},0);cell.group.updateMatrixWorld(true);
  const open=ray.intersectObjects([glass,encap,body],false);assert.equal(open[0]?.object,body,'aperture exposes silicon, not a floating pane');
  body.geometry.computeBoundingBox();const local=ABSORPTION_POINT.clone().applyMatrix4(body.matrixWorld.clone().invert());assert.ok(body.geometry.boundingBox.containsPoint(local),'optical endpoint remains in selected silicon');
  assert.equal(cell.snapshot().state.incident,0);
  cell.render({section:0,absorption:0,extraction:0,incident:1},0);
  assert.deepEqual(Array.from(glass.geometry.attributes.position.array),before.glass);assert.deepEqual(Array.from(encap.geometry.attributes.position.array),before.encap);assert.deepEqual(body.position.toArray(),before.body);assert.deepEqual(body.scale.toArray(),before.scale);
  for(const [i,pane]of[glass,encap].entries()){assert.equal(pane.geometry,buffers[i].geometry);for(const key of['position','normal','uv'])assert.equal(pane.geometry.attributes[key],buffers[i][key],'reversal reuses GPU attributes');assert.equal(pane.geometry.index,buffers[i].index);}
 }finally{cell.dispose();}
});

test('connected panes retain their outer bounds and have only real aperture walls at every section',()=>{
 const cell=CellScene.prepare(false);try{
  const panes=[named(cell.group,'Protective glass with sectional opening'),named(cell.group,'Encapsulant with sectional opening')];
  const W=SELECTED_CELL.width*CELL_SCALE,D=SELECTED_CELL.length*CELL_SCALE,outerArea=PANEL.glassWidth*PANEL.glassLength*CELL_SCALE**2;
  const original=panes.map(p=>({geometry:p.geometry,position:p.geometry.attributes.position,index:p.geometry.index,normal:p.geometry.attributes.normal,uv:p.geometry.attributes.uv,box:p.geometry.boundingBox.clone()}));
  const baselineBytes=cell.snapshot().geometryBytes,frames=[];
  for(const section of[0,.001,.1,.3,.6,1]){
   cell.render({section,absorption:0,extraction:0,incident:1},0);cell.group.updateMatrixWorld(true);
   const eased=section*section*(3-2*section),hw=(W+.20)*eased/2,hd=(D+.28)*eased/2;
   for(const[paneIndex,pane]of panes.entries()){
    const g=pane.geometry,pos=g.attributes.position,idx=g.index,box=g.boundingBox;let topArea=0;
    assert.equal(g,original[paneIndex].geometry);assert.deepEqual(box,original[paneIndex].box);assert.equal(g.attributes.position,original[paneIndex].position);assert.equal(g.index,original[paneIndex].index);
    for(let f=0;f<idx.count;f+=3){
     const points=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(pos,idx.getX(f+j))),cross=points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])),area=cross.length()/2;
     if(area<1e-8)continue;
     assert.ok(points.every(q=>box.clone().expandByScalar(1e-5).containsPoint(q)),'pane vertices remain bounded');
     if(points.every(q=>Math.abs(q.y-box.max.y)<1e-6)){topArea+=area;assert.ok(cross.y>0,'glass top faces the incoming light');}
     else if(points.every(q=>Math.abs(q.y-box.min.y)<1e-6))assert.ok(cross.y<0,'pane underside winding is outward');
     else{
      const outer=['x','z'].some(axis=>[box.min[axis],box.max[axis]].some(edge=>points.every(q=>Math.abs(q[axis]-edge)<1e-5)));
      const innerX=[-hw,hw].some(edge=>points.every(q=>Math.abs(q.x-edge)<1e-5&&Math.abs(q.z)<=hd+1e-5));
      const innerZ=[-hd,hd].some(edge=>points.every(q=>Math.abs(q.z-edge)<1e-5&&Math.abs(q.x)<=hw+1e-5));
      assert.ok(outer||innerX||innerZ,'no internal box-joining faces remain inside the connected pane');
     }
    }
    approx(topArea,outerArea-4*hw*hd,.001,'top triangles cover the pane exactly once outside its aperture');
   }
   // Every neighbour centre remains covered, including at the fully open section.
   for(let row=0;row<PANEL.rows;row++)for(let col=0;col<PANEL.cols;col++){
    if(row===SELECTED_CELL.row&&col===SELECTED_CELL.col)continue;const layout=cellLayout(row,col);
    const ray=new T.Raycaster(new T.Vector3((layout.x-SELECTED_CELL.x)*CELL_SCALE,2,(layout.z-SELECTED_CELL.z)*CELL_SCALE),new T.Vector3(0,-1,0));
    assert.equal(ray.intersectObject(panes[0],false)[0]?.object,panes[0],'selected aperture never uncovers another cell');
   }
   assert.equal(cell.snapshot().geometryBytes,baselineBytes);frames.push({section,vertices:panes.map(p=>Array.from(p.geometry.attributes.position.array))});
  }
  for(const frame of frames.reverse()){cell.render({section:frame.section,absorption:1,extraction:.5,incident:0},37);assert.deepEqual(panes.map(p=>Array.from(p.geometry.attributes.position.array)),frame.vertices,'each intermediate pane reconstructs exactly on reversal');}
 }finally{cell.dispose();}
});

test('macro detail preserves contact registration, explicit shadow roles and one output conversion',()=>{
 const cell=CellScene.prepare(false);try{
  const glasses=['Protective glass with sectional opening','Encapsulant with sectional opening'];
  for(const name of[...glasses,'Selected cell contact fingers']){const o=named(cell.group,name);assert.equal(o.castShadow,false);assert.equal(o.receiveShadow,false);}
  for(const name of['Full module backing','Selected silicon absorber','Selected cell front busbars','Front collection continuation'])assert.equal(named(cell.group,name).castShadow,true);
  for(const name of['Selected silicon absorber','143 neighboring silicon cells']){
   const material=named(cell.group,name).material,shader={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader,uniforms:{}};
   const key=material.customProgramCacheKey();material.onBeforeCompile(shader,{});
   assert.match(shader.fragmentShader,/fwidth\(finePhaseX\)/);assert.match(shader.fragmentShader,/float fineGrain=[^;]*fineWeight;/);assert.ok(shader.fragmentShader.includes('cellContactMask'),'the existing surface/contact material hook remains active');
   assert.equal(material.customProgramCacheKey(),key);assert.match(key,/aesir-cell-detail-filter-v1/);
  }
  for(const name of['Local absorption response — illustrative','Front current collection overlay','Rear current collection overlay']){
   const material=named(cell.group,name).material;assert.equal((material.fragmentShader.match(/#include <colorspace_fragment>/g)||[]).length,1);assert.equal(material.premultipliedAlpha,false);assert.equal(material.blending,T.AdditiveBlending);
  }
  assert.equal(named(cell.group,'Front current collection overlay').material.depthTest,true);assert.equal(named(cell.group,'Rear current collection overlay').material.depthTest,false,'through-section rear channel remains explicitly illustrative');
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
 const prefix=conversionState(CELL_EXIT).energyU;assert.ok(prefix>0,'return exposes an initial DC prefix');
 assert.ok(ELECTRICAL_PATHS.dcPositive.getPointAt(prefix).distanceTo(ELECTRICAL_ANCHORS.dcSourcePositive)<PANEL.width/2,'initial prefix stays at the registered module lead');
 assert.equal(conversionState(CELL_EXIT-1e-6).energyU,0,'DC prefix begins only after the macro chapter');
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
  if(p===CELL_SWITCH)assert.equal(conversionState(p).transition,1,'glass handoff remains covered');
  if(p===CELL_EXIT)approx(conversionState(p).transition,.24,1e-12,'registered contact handoff uses the intentional lighter cover');
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


// The connected pane is no longer BoxGeometry; test its actual closed volume,
// including the aperture, rather than silently losing camera-inside coverage.
function actualSolidContains(record,item,worldPoint){
 const point=worldPoint.clone().applyMatrix4(item.matrix.clone().invert()),g=record.geometry;
 if(!g.boundingBox.containsPoint(point)||g.type==='PlaneGeometry')return false;
 if(g.type==='BoxGeometry')return true;
 const pos=g.attributes.position,index=g.index,count=index?index.count:pos.count;let votes=0;
 for(const vector of[[1,.317,.173],[.127,1,.379],[.293,.157,1]]){
  const ray=new T.Ray(point,new T.Vector3(...vector).normalize()),hits=[],at=new T.Vector3();
  for(let f=0;f<count;f+=3){const q=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(pos,index?index.getX(f+j):f+j));
   if(ray.intersectTriangle(q[0],q[1],q[2],false,at)){const distance=at.distanceTo(point);if(distance<1e-8)return true;hits.push(distance);}
  }
  hits.sort((a,b)=>a-b);let unique=0,last=-Infinity;for(const distance of hits)if(distance-last>1e-7){unique++;last=distance;}if(unique%2)votes++;
 }return votes>=2;
}

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
     assert.ok(!actualSolidContains(record,item,from),`${mode} ${p}: camera inside ${record.name} (transparent=${record.transparent}; transition=${state.transition})`);
     assert.equal(planeCuts(record,item,camera,nearPlane),0,`${mode} ${p}: near plane cuts ${record.name} (transparent=${record.transparent}; transition=${state.transition})`);
     const nearCentre=new T.Vector3(0,0,-nearPlane).applyMatrix4(camera.matrixWorld);
     assert.ok(!actualSolidContains(record,item,nearCentre),`${mode} ${p}: near plane enclosed by ${record.name}`);
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
