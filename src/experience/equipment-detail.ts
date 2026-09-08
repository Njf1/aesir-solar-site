import * as THREE from 'three';
import {ELECTRICAL_PORTS,ELECTRICAL_ANCHORS} from './electrical-path.ts';
import {STORAGE_PORTS,STORAGE_ANCHORS} from './storage-path.ts';

/** Original, generic service hardware. Campus metres and existing ports are retained.
 * No downloaded asset, texture, light, rating, label, product or construction claim. */
const V=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
/** A flat-shaded 44-triangle chamfer, deliberately cheaper than a subdivided rounded box. */
export function createChamferGeometry(inset=.075){
  const outer=.5,inner=.5-inset,positions:number[]=[];
  const face=(points:number[][])=>{for(let i=1;i<points.length-1;i++)positions.push(...points[0],...points[i],...points[i+1]);};
  const orient=(points:number[][])=>{
    const a=V(...points[0] as [number,number,number]),b=V(...points[1] as [number,number,number]),c=V(...points[2] as [number,number,number]);
    const normal=b.sub(a).cross(c.sub(a)),centre=points.reduce((sum,p)=>sum.add(V(...p as [number,number,number])),V(0,0,0));
    if(normal.dot(centre)<0)points.reverse();face(points);
  };
  for(let axis=0;axis<3;axis++)for(const sign of[-1,1]){
    const u=(axis+1)%3,v=(axis+2)%3;
    orient([[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>{const p=[0,0,0];p[axis]=sign*outer;p[u]=a*inner;p[v]=b*inner;return p;}));
  }
  for(let along=0;along<3;along++)for(const signA of[-1,1])for(const signB of[-1,1]){
    const a=(along+1)%3,b=(along+2)%3;
    orient([[-inner,outer,inner],[inner,outer,inner],[inner,inner,outer],[-inner,inner,outer]].map(([t,x,y])=>{const p=[0,0,0];p[along]=t;p[a]=signA*x;p[b]=signB*y;return p;}));
  }
  for(const x of[-1,1])for(const y of[-1,1])for(const z of[-1,1])orient([[x*outer,y*inner,z*inner],[x*inner,y*outer,z*inner],[x*inner,y*inner,z*outer]]);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}
export type EquipmentDetailKind='inverter'|'storage';
export function createEquipmentDetail(kind:EquipmentDetailKind){
  const group=new THREE.Group();group.name=`Original ${kind} service hardware refinement`;
  const chamfer=createChamferGeometry(),cube=new THREE.BoxGeometry(1,1,1),hex=new THREE.CylinderGeometry(1,1,1,6);
  const finish=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.40,metalness:.52});
  const recess=new THREE.MeshStandardMaterial({color:0x263438,roughness:.83,metalness:.04});
  const batches=[{geometry:chamfer,material:finish,rows:[] as {matrix:THREE.Matrix4;color:number}[],name:'Chamfered lips and handle rims'},
    {geometry:hex,material:finish,rows:[] as {matrix:THREE.Matrix4;color:number}[],name:'Hexagonal fasteners and gland nuts'},
    {geometry:cube,material:recess,rows:[] as {matrix:THREE.Matrix4;color:number}[],name:'Recessed seams and fastener slots'}];
  const identity=new THREE.Quaternion(),normalX=new THREE.Quaternion().setFromAxisAngle(V(0,0,1),Math.PI/2);
  const bounds=new THREE.Box3(),temporary=new THREE.Box3();
  function add(batch:number,p:THREE.Vector3,s:THREE.Vector3,color=0xaab8b9,q=identity){const matrix=new THREE.Matrix4().compose(p,q,s);batches[batch].rows.push({matrix,color});temporary.copy(batches[batch].geometry.boundingBox??(batches[batch].geometry.computeBoundingBox(),batches[batch].geometry.boundingBox!)).applyMatrix4(matrix);bounds.union(temporary);}
  function strip(x:number,y:number,z:number,depth:number,height:number,width:number,color=0xaebbb9){add(0,V(x,y,z),V(depth,height,width),color);}
  function slot(x:number,y:number,z:number,depth:number,height:number,width:number){add(2,V(x,y,z),V(depth,height,width));}
  function screw(x:number,y:number,z:number,r=.010){add(1,V(x,y,z),V(r,.006,r),0x9daeb1,normalX);slot(x-.0037,y,z,.0015,.0024,r*1.03);}
  function handle(x:number,y:number,z:number,height:number){
    slot(x+.002,y,z,.006,height+.026,.067);strip(x-.003,y,z,.016,height,.040,0x718488);
    for(const sy of[-1,1])strip(x+.006,y+sy*(height*.43),z,.021,.027,.051,0x85979a);
  }
  const envelopes:Record<string,{min:number[];max:number[]}>={};
  function envelope(name:string,fn:()=>void){const first=batches.map(b=>b.rows.length);fn();const box=new THREE.Box3();batches.forEach((b,bi)=>b.rows.slice(first[bi]).forEach(row=>box.union(temporary.copy(b.geometry.boundingBox!).applyMatrix4(row.matrix))));envelopes[name]={min:box.min.toArray(),max:box.max.toArray()};}
  if(kind==='inverter'){
    const front=ELECTRICAL_ANCHORS.inverterFront.x+.016,cy=ELECTRICAL_ANCHORS.inverterCentre.y,cz=ELECTRICAL_ANCHORS.inverterCentre.z;
    envelope('inverter front trim',()=>{
      // A folded inner-cover edge stays inside the existing 1.04 x 1.50m silhouette.
      for(const s of[-1,1]){strip(front,cy+s*.646,cz,.012,.018,.840);strip(front,cy,cz+s*.423,.012,1.290,.016);}
      slot(front-.007,cy-.255,cz,.002,.007,.806);
      handle(front-.009,cy-.10,cz+.348,.16);
      for(const z of[-.391,.391])for(const y of[-.60,.59])screw(front-.011,cy+y,cz+z,.009);
      // Vents are visibly folded lips rather than black holes claiming a cutaway.
      for(let i=0;i<5;i++){strip(front-.006,cy-.48+i*.036,cz-.035,.017,.014,.51,0x809297);slot(front-.015,cy-.490+i*.036,cz-.035,.002,.004,.484);}
    });
    envelope('existing inverter cable entries',()=>{for(const [key,port]of Object.entries(ELECTRICAL_PORTS)){if(key==='buildingEntry')continue;const r=key==='acOutput'?.030:.023;add(1,port.clone().add(V(0,.005,0)),V(r,.017,r),0x8f9fa2);}});
  }else{
    envelope('battery front trim',()=>{
      const x=STORAGE_ANCHORS.batteryFront.x-.017;
      for(const z of[-6.18,-5.22]){
        for(const y of[.585,2.395])strip(x,y,z,.011,.015,.827,0x99aaa9);
        handle(x-.010,1.36,z+.31,.225);
        for(const y of[.91,2.05]){strip(x-.004,y,z-.38,.020,.068,.035,0xaab8ba);screw(x-.016,y,z-.38,.007);}
        for(let i=0;i<7;i++)strip(x-.002,.681+i*.032,z,.019,.008,.556,0x8b9b9d);
      }
    });
    envelope('converter front trim',()=>{
      const x=STORAGE_ANCHORS.converterFront.x-.020;
      for(const y of[.59,2.025])strip(x,y,-3.42,.012,.017,.625,0x9baeb0);
      for(const z of[-3.74,-3.10])strip(x,1.305,z,.012,1.43,.013,0x9baeb0);
      handle(x-.008,1.20,-3.15,.16);
      for(const y of[.67,1.99])for(const z of[-3.715,-3.125])screw(x-.014,y,z,.009);
    });
    envelope('grid cabinet front trim',()=>{
      const x=STORAGE_ANCHORS.gridFront.x-.012;
      for(const z of[-15.352,-14.648]){
        for(const y of[.595,2.135])strip(x,y,z,.012,.015,.603,0x85999d);
        handle(x-.008,1.35,z+(z<-15?.23:-.23),.17);
      }
      for(const z of[-15.61,-14.39])for(const y of[.68,2.05])screw(x-.014,y,z,.008);
    });
    envelope('existing storage and grid cable entries',()=>{
      for(const key of['converterAC','converterDC','converterDCReturn','batteryDC','batteryDCReturn','gridBuildingSide','gridExternalSide'] as const)add(1,STORAGE_PORTS[key].clone().add(V(0,-.022,0)),V(.026,.015,.026),0x93a5a7);
    });
  }
  let geometryBytes=0,triangles=0,instances=0;
  const color=new THREE.Color();
  for(const b of batches){
    const mesh=new THREE.InstancedMesh(b.geometry,b.material,b.rows.length);mesh.name=b.name;
    b.rows.forEach(({matrix,color:hex},index)=>{mesh.setMatrixAt(index,matrix);if(b.material===finish)mesh.setColorAt(index,color.setHex(hex));});mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    mesh.castShadow=false;mesh.receiveShadow=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();group.add(mesh);
    geometryBytes+=mesh.instanceMatrix.array.byteLength+(mesh.instanceColor?.array.byteLength??0);triangles+=(b.geometry.index?.count??b.geometry.attributes.position.count)/3*b.rows.length;instances+=b.rows.length;
  }
  for(const g of[chamfer,cube,hex])geometryBytes+=Object.values(g.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(g.index?.array.byteLength??0);
  const stats={geometryBytes,triangles,instances,drawCalls:batches.length,textureBytes:0,pointLights:0};let disposed=false;
  if(geometryBytes>18000||triangles>4000)throw new Error(`Equipment detail budget exceeded: ${JSON.stringify(stats)}`);
  return{group,bounds,envelopes,stats,dispose(){if(disposed)return;disposed=true;group.traverse(o=>{if(o instanceof THREE.InstancedMesh)o.dispose();});for(const g of[chamfer,cube,hex])g.dispose();finish.dispose();recess.dispose();group.clear();group.removeFromParent();}};
}
