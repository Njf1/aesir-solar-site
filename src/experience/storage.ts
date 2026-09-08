import * as THREE from 'three';
import {STORAGE_ANCHORS,STORAGE_PATHS,STORAGE_PORTS} from './storage-path.ts';

/** Original unbranded storage/service equipment. No external assets, textures,
 * lights, manufacturer ratings, simulation outputs or construction specifications.
 * Optional AC-coupled illustration: a separate bidirectional converter sits between
 * the shared building AC connection and the battery's short representative DC pair.
 */
export type StorageTier='mobile'|'desktop';
export interface StorageState {
  charge:number;discharge:number;stored:number;importFlow:number;exportFlow:number;dusk:number;
}
export interface StorageScene {
  group:THREE.Group;
  equipment:THREE.Group;
  paths:typeof STORAGE_PATHS;
  ports:typeof STORAGE_PORTS;
  anchors:typeof STORAGE_ANCHORS;
  bounds:THREE.Box3;
  equipmentBounds:THREE.Box3;
  stats:{drawCalls:number;triangles:number;geometryBytes:number;textureBytes:number;instances:number};
  render(state:StorageState,time:number):void;
  dispose():void;
}
const V=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
const clamp=(v:number)=>Math.min(1,Math.max(0,Number.isFinite(v)?v:0));
type Packed={positions:number[];normals:number[];uvs:number[];routes:number[];indices:number[]};
type Batch={geometry:THREE.BufferGeometry;material:THREE.Material;matrices:THREE.Matrix4[];name:string};

export function createStorageScene(tier:StorageTier):StorageScene{
  const mobile=tier==='mobile',group=new THREE.Group(),equipment=new THREE.Group();
  group.name='Optional AC-coupled storage and illustrative grid connection';equipment.name='Original closed service cabinets';group.add(equipment);
  const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
  const ownG=<T extends THREE.BufferGeometry>(g:T):T=>{geometries.add(g);return g;};
  const ownM=<T extends THREE.Material>(m:T):T=>{materials.add(m);return m;};
  const material=(color:number,roughness:number,metalness=0)=>ownM(new THREE.MeshStandardMaterial({color,roughness,metalness}));
  const shell=material(0xc5cecb,.48,.24),trim=material(0x45565b,.43,.44),seal=material(0x1c2a2f,.87,.03);
  const metal=material(0x99aaad,.33,.67),concrete=material(0xa9aaa0,.92),cable=material(0x24363e,.78,.08);
  const darkFace=material(0x526669,.48,.25);
  const boxG=ownG(new THREE.BoxGeometry(1,1,1)),cylinderG=ownG(new THREE.CylinderGeometry(1,1,1,mobile?8:12));
  const identity=new THREE.Quaternion(),west=new THREE.Quaternion().setFromAxisAngle(V(0,1,0),-Math.PI/2);
  const batches=new Map<string,Batch>(),placement=new THREE.Object3D();
  const x=STORAGE_PORTS.buildingAC.x;
  function put(name:string,g:THREE.BufferGeometry,m:THREE.Material,p:THREE.Vector3,s:THREE.Vector3,q=identity){
    const key=g.uuid+m.uuid;let batch=batches.get(key);if(!batch){batch={geometry:g,material:m,matrices:[],name};batches.set(key,batch);}
    placement.position.copy(p);placement.scale.copy(s);placement.quaternion.copy(q);placement.updateMatrix();batch.matrices.push(placement.matrix.clone());
  }
  function box(name:string,m:THREE.Material,px:number,py:number,pz:number,w:number,h:number,d:number){put(name,boxG,m,V(px,py,pz),V(w,h,d));}
  function roundPanel(){
    const s=new THREE.Shape(),r=.025;
    s.moveTo(-.5+r,-.5);s.lineTo(.5-r,-.5);s.quadraticCurveTo(.5,-.5,.5,-.5+r);s.lineTo(.5,.5-r);s.quadraticCurveTo(.5,.5,.5-r,.5);
    s.lineTo(-.5+r,.5);s.quadraticCurveTo(-.5,.5,-.5,.5-r);s.lineTo(-.5,-.5+r);s.quadraticCurveTo(-.5,-.5,-.5+r,-.5);
    return ownG(new THREE.ExtrudeGeometry(s,{depth:.013,bevelEnabled:true,bevelSegments:1,bevelSize:.004,bevelThickness:.003,curveSegments:mobile?2:3}));
  }
  const panelG=roundPanel();
  const panel=(name:string,m:THREE.Material,px:number,py:number,pz:number,w:number,h:number)=>put(name,panelG,m,V(px,py,pz),V(w,h,1),west);

  // All hard equipment stays east of x=-41.05; the existing 2.8m footpath
  // occupies [-44.4,-41.6] and is kept clear, including cabinet foundations.
  for(const [z,width]of [[-5.7,2.22],[-3.42,1.07],[-15,1.72]]){
    box('Raised concrete equipment pads',concrete,x-.425,.245,z,.90,.22,width);
    for(const side of [-1,1])box('Raised equipment feet',trim,x-.43,.42,z+side*(width/2-.24),.58,.13,.16);
  }
  // Battery: a two-door weatherproof enclosure, restrained lower ventilation and
  // a finite storage indicator integrated into one front door, with no live data.
  box('Battery closed steel enclosure',shell,x-.425,1.49,-5.7,.68,2.00,2.0);
  box('Battery door gaskets',seal,x-.772,1.49,-5.7,.023,1.88,1.89);
  for(const z of [-6.18,-5.22]){
    panel('Battery inset front doors',shell,x-.785,1.49,z,.929,1.835);
    box('Battery vertical recessed handles',trim,x-.807,1.36,z+.31,.018,.225,.024);
    for(const y of [.91,2.05])box('Battery hinge straps',metal,x-.803,y,z-.38,.021,.060,.027);
    for(let i=0;i<7;i++)box('Battery lower protected ventilation',trim,x-.810,.675+i*.032,z,.019,.014,.57);
  }
  box('Battery protective drip cap',trim,x-.434,2.519,-5.7,.742,.055,2.075);
  box('Battery cap edge',metal,x-.794,2.511,-5.7,.026,.036,1.99);
  box('Battery lower kick rail',trim,x-.790,.534,-5.7,.042,.061,1.97);
  for(const z of [-6.44,-4.96])for(const y of [.70,2.28])box('Battery wall restraint brackets',metal,x-.060,y,z,.26,.10,.085);

  // Separate bidirectional converter: a narrower cabinet, external rear cooling
  // fins, its own drip lip and distinct AC and DC bottom gland positions.
  box('Separate bidirectional converter shell',darkFace,x-.40,1.305,-3.42,.60,1.63,.84);
  box('Converter front gasket',seal,x-.708,1.305,-3.42,.025,1.53,.74);
  panel('Converter service cover',shell,x-.722,1.305,-3.42,.713,1.50);
  box('Converter recessed front strip',trim,x-.746,1.68,-3.42,.020,.12,.48);
  box('Converter front handle',trim,x-.746,1.20,-3.15,.021,.16,.025);
  box('Converter drip canopy',trim,x-.410,2.153,-3.42,.686,.054,.914);
  for(let z=-3.80;z<=-3.05;z+=.078)box('Converter rear cooling fins',metal,x-.126,1.28,z,.11,1.12,.021);
  for(const y of [.78,1.85])box('Converter wall restraint brackets',metal,x-.051,y,-3.42,.23,.065,.65);
  for(const y of [.67,1.99])for(const z of [-3.715,-3.125])box('Converter cover fixings',metal,x-.749,y,z,.022,.025,.025);

  // A visually distinct service cabinet represents the agreed grid connection;
  // no internal switchgear, protection scheme or ratings are invented.
  box('Grid connection closed service cabinet',shell,x-.37,1.365,-15,.54,1.75,1.5);
  box('Grid cabinet perimeter gasket',seal,x-.648,1.365,-15,.021,1.64,1.405);
  for(const z of [-15.352,-14.648]){
    panel('Grid connection cabinet service doors',darkFace,x-.660,1.365,z,.679,1.59);
    box('Grid cabinet recessed handles',metal,x-.684,1.35,z+(z<-15?.23:-.23),.018,.17,.023);
  }
  box('Grid connection drip canopy',trim,x-.380,2.279,-15,.626,.06,1.588);
  box('Grid cabinet lower kick rail',trim,x-.67,.535,-15,.029,.060,1.47);
  for(const y of [.72,2.05])box('Grid cabinet wall restraints',metal,x-.040,y,-15,.23,.065,1.29);
  for(const z of [-15.61,-14.39])for(const y of [.68,2.05])box('Grid front hinge straps',metal,x-.687,y,z,.018,.045,.028);

  const glands=[STORAGE_PORTS.converterAC,STORAGE_PORTS.converterDC,STORAGE_PORTS.converterDCReturn,STORAGE_PORTS.batteryDC,STORAGE_PORTS.batteryDCReturn,STORAGE_PORTS.gridBuildingSide,STORAGE_PORTS.gridExternalSide];
  for(const port of glands){
    put('Sealed bottom cable glands',cylinderG,seal,port.clone().add(V(0,.012,0)),V(.022,.082,.022));
    put('Gland compression collars',cylinderG,metal,port.clone().add(V(0,.030,0)),V(.030,.020,.030));
  }
  // Low wall runs are attached to the existing plinth; no above-ground lead
  // crosses the pavement. AC branch and grid run remain distinct and supported.
  for(let z=13.05;z>-13.75;z-=1.35){
    const storageRun=z>-2.6;
    box('Wall cable standoffs',metal,storageRun?x-.13:x+.003,storageRun?.665:.57,z,storageRun?.22:.11,storageRun?.24:.085,.045);
    box('Grid cable retaining saddles',trim,x-.058,.57,z,.030,.066,.052);
    if(storageRun)box('Storage AC cable saddles',trim,x-.336,.74,z,.044,.066,.052);
  }
  // Small raised covered trough supporting the short DC pair in the gap between
  // converter and battery. Both leads enter bottom glands; AC never meets battery.
  box('DC pair support trough base',metal,x-.495,.373,-4.32,.25,.027,1.55);
  for(const side of [-1,1])box('DC pair trough side rails',trim,x-.495+side*.124,.406,-4.32,.015,.09,1.55);
  for(const z of [-3.92,-4.72])box('DC trough wall brackets',metal,x-.27,.37,z,.57,.04,.064);
  for(const z of [-3.95,-4.65])box('DC pair restrained saddles',trim,x-.495,.43,z,.21,.025,.035);
  box('Existing AC entry branch cover',trim,x-.135,.74,13.7,.31,.22,.21);
  // Flush marker studs communicate a buried service route, not a loose cable.
  for(const z of [-13,-5,3,11,19,27,35])box('Flush buried-route marker studs',metal,-43,.239,z,.085,.012,.18);

  function packed():Packed{return{positions:[],normals:[],uvs:[],routes:[],indices:[]};}
  const physical=packed(),flow=packed();
  function pathSamples(path:THREE.CurvePath<THREE.Vector3>){
    const points:THREE.Vector3[]=[],tangents:THREE.Vector3[]=[],distances:number[]=[];let d=0;
    for(const curve of path.curves){const count=curve instanceof THREE.LineCurve3?1:mobile?4:6;
      for(let i=points.length?1:0;i<=count;i++){const p=curve.getPointAt(i/count);if(points.length)d+=p.distanceTo(points[points.length-1]);points.push(p);tangents.push(curve.getTangentAt(i/count));distances.push(d);}}
    return{points,tangents,distances};
  }
  function appendTube(out:Packed,path:THREE.CurvePath<THREE.Vector3>,radius:number,route:number,sides:number,offset=0,flat=false){
    const {points,tangents,distances}=pathSamples(path),start=out.positions.length/3;
    const normal=V(1,0,0),binormal=V(0,0,0),radial=V(0,0,0);
    for(let i=0;i<points.length;i++){
      const t=tangents[i];normal.addScaledVector(t,-normal.dot(t));
      if(normal.lengthSq()<.00001){normal.set(Math.abs(t.x)<.9?1:0,Math.abs(t.x)<.9?0:1,0);normal.addScaledVector(t,-normal.dot(t));}
      normal.normalize();binormal.crossVectors(t,normal).normalize();
      if(flat){normal.crossVectors(V(0,1,0),t).normalize();binormal.set(0,1,0);}
      for(let j=0;j<=sides;j++){
        if(flat)radial.copy(normal).multiplyScalar(j===0?-radius:radius);
        else radial.copy(normal).multiplyScalar(Math.cos(j/sides*Math.PI*2)*radius).addScaledVector(binormal,Math.sin(j/sides*Math.PI*2)*radius);
        const p=points[i];out.positions.push(p.x+radial.x,p.y+radial.y,p.z+radial.z);out.normals.push(flat?0:radial.x/radius,flat?1:radial.y/radius,flat?0:radial.z/radius);out.uvs.push(distances[i]+offset,j/sides);out.routes.push(route);
        if(i&&j<sides){const b=start+i*(sides+1)+j,a=b-sides-1;out.indices.push(a,a+1,b,b,a+1,b+1);}
      }
    }
  }
  for(const path of [STORAGE_PATHS.storageAC,STORAGE_PATHS.gridAC,STORAGE_PATHS.gridDescent])appendTube(physical,path,.013,0,mobile?5:7);
  for(const path of [STORAGE_PATHS.batteryDC,STORAGE_PATHS.batteryDCReturn])appendTube(physical,path,.009,0,mobile?5:7);
  appendTube(flow,STORAGE_PATHS.storageAC,.025,0,mobile?4:5);
  appendTube(flow,STORAGE_PATHS.batteryDC,.021,0,mobile?4:5,STORAGE_PATHS.storageAC.getLength());
  appendTube(flow,STORAGE_PATHS.gridAC,.023,1,mobile?4:5);
  appendTube(flow,STORAGE_PATHS.gridMarker,.065,2,1,STORAGE_PATHS.gridAC.getLength(),true);
  function geometry(data:Packed,isFlow=false){
    const g=ownG(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(data.uvs,2));
    if(isFlow)g.setAttribute('route',new THREE.Float32BufferAttribute(data.routes,1));else g.setAttribute('normal',new THREE.Float32BufferAttribute(data.normals,3));
    g.setIndex(data.indices);g.computeBoundingBox();g.computeBoundingSphere();return g;
  }
  const cables=new THREE.Mesh(geometry(physical),cable);cables.name='Supported AC branches, battery DC pair and grid descent';cables.receiveShadow=true;group.add(cables);
  const flowMaterial=ownM(new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,
    uniforms:{uStorage:{value:0},uGrid:{value:0},uTime:{value:0}},
    vertexShader:'attribute float route;varying vec2 vUv;varying float vRoute;void main(){vUv=uv;vRoute=route;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform float uStorage;uniform float uGrid;uniform float uTime;varying vec2 vUv;varying float vRoute;
      void main(){float value=vRoute<.5?uStorage:uGrid;float strength=abs(value);float direction=value<0.?-1.:1.;
        float period=vRoute>1.5?3.8:1.1;float phase=fract((vUv.x-direction*uTime*1.2)/period);
        float band=smoothstep(.10,.20,phase)*(1.-smoothstep(.47,.68,phase));
        float edge=vRoute>1.5?smoothstep(0.,.18,vUv.y)*(1.-smoothstep(.82,1.,vUv.y)):1.;
        float alpha=strength*edge*(.035+.66*band)*(vRoute>1.5?.66:1.);
        if(alpha<.003)discard;gl_FragColor=vec4(mix(vec3(.12,.48,.73),vec3(.46,.82,1.),band),alpha);
      }`,
  }));
  const flowMesh=new THREE.Mesh(geometry(flow,true),flowMaterial);flowMesh.name='Explanatory electrical energy flow and buried-route annotation';flowMesh.renderOrder=9;flowMesh.visible=false;group.add(flowMesh);

  // A 13cm × 29cm five-segment indication; no capacity, runtime, performance or
  // state-of-charge measurement is claimed. It is a bounded authored illustration.
  box('Storage indication inset surround',trim,x-.810,1.92,-6.25,.026,.33,.17);
  const levelMaterial=ownM(new THREE.ShaderMaterial({
    uniforms:{uStored:{value:0},uDusk:{value:0}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform float uStored;uniform float uDusk;varying vec2 vUv;
      void main(){float row=floor(vUv.y*5.);float gap=smoothstep(.08,.16,fract(vUv.y*5.))*(1.-smoothstep(.77,.85,fract(vUv.y*5.)));
        float fill=clamp(uStored*5.-row,0.,1.);float lit=(1.-smoothstep(fill-.04,fill+.04,vUv.x))*step(.001,fill);
        vec3 color=vec3(.045,.075,.080)+gap*mix(vec3(.045,.080,.090),vec3(.23,.55,.66)*(1.+uDusk*.08),lit);
        gl_FragColor=vec4(color,1.);
      }`,
  }));
  const indicator=new THREE.Mesh(ownG(new THREE.PlaneGeometry(.13,.29)),levelMaterial);indicator.position.set(x-.827,1.92,-6.25);indicator.quaternion.copy(west);indicator.name='Small finite stored-energy indication';equipment.add(indicator);

  let instances=0;
  for(const batch of batches.values()){
    const mesh=new THREE.InstancedMesh(batch.geometry,batch.material,batch.matrices.length);mesh.name=batch.name;
    batch.matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();
    mesh.castShadow=batch.geometry!==panelG;mesh.receiveShadow=batch.geometry!==panelG;equipment.add(mesh);instances+=batch.matrices.length;
  }
  batches.clear();group.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(group),equipmentBounds=new THREE.Box3().setFromObject(equipment);
  let drawCalls=0,triangles=0,geometryBytes=0;
  group.traverse(o=>{if(o instanceof THREE.Mesh){drawCalls++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o instanceof THREE.InstancedMesh?o.count:1);}if(o instanceof THREE.InstancedMesh)geometryBytes+=o.instanceMatrix.array.byteLength;});
  for(const g of geometries){for(const attribute of Object.values(g.attributes))geometryBytes+=attribute.array.byteLength;if(g.index)geometryBytes+=g.index.array.byteLength;}
  const stats={drawCalls,triangles,geometryBytes,textureBytes:0,instances};let disposed=false;
  if(drawCalls>18||triangles>12000||geometryBytes>180000)throw new Error(`Storage asset budget exceeded: ${JSON.stringify(stats)}`);
  return{group,equipment,paths:STORAGE_PATHS,ports:STORAGE_PORTS,anchors:STORAGE_ANCHORS,bounds,equipmentBounds,stats,
    render(state:StorageState,time:number){
      if(disposed)return;
      const stored=clamp(state.stored),requestedStorage=clamp(state.charge)-clamp(state.discharge);
      // Conflicting inputs cancel rather than showing simultaneous opposing flows.
      // A visibly full store cannot keep charging; an empty store cannot discharge.
      const storage=requestedStorage>0&&stored>=.999||requestedStorage<0&&stored<=.001?0:requestedStorage;
      const grid=clamp(state.exportFlow)-clamp(state.importFlow);
      flowMaterial.uniforms.uStorage.value=storage;flowMaterial.uniforms.uGrid.value=grid;
      flowMaterial.uniforms.uTime.value=Number.isFinite(time)?time%3600:0;flowMesh.visible=Math.abs(storage)+Math.abs(grid)>.001;
      levelMaterial.uniforms.uStored.value=stored;levelMaterial.uniforms.uDusk.value=clamp(state.dusk);
    },
    dispose(){if(disposed)return;disposed=true;group.traverse(o=>{if(o instanceof THREE.InstancedMesh)o.dispose();});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();group.clear();group.removeFromParent();},
  };
}
