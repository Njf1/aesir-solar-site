import * as THREE from 'three';

/** Original contact-occlusion artwork, 2026-09-08. This is not a new shadow light,
 * AO target or a simulated directional shadow. The core lies under the actual
 * supported object; a short feather darkens only the adjoining receiver.
 * Replace the old six broad contact patches, rather than stacking this over them.
 */
type Contact={x:number;y:number;z:number;width:number;depth:number;feather:number;opacity:number;belt?:boolean};
type CartonContact={sourceIndex:number;instanceIndex:number;width:number;depth:number;feather:number};
const FLOOR=.3015,BELT=1.342;
const LINE_START=-29.2,LINE_END=-14.8,LINE_Z=13.5;

const vertex=/* glsl */`
attribute vec4 aContact;
varying vec2 vUv;varying vec4 vContact;varying vec2 vReceiverPoint;
void main(){
  vUv=uv;vContact=aContact;
  vec4 p=instanceMatrix*vec4(position,1.);
  vReceiverPoint=p.xz;
  gl_Position=projectionMatrix*modelViewMatrix*p;
}`;
const fragment=/* glsl */`
uniform vec3 uContactTint;
varying vec2 vUv;varying vec4 vContact;varying vec2 vReceiverPoint;
void main(){
  vec2 q=abs(vUv-.5)*2.;
  // The flat core is hidden below the footprint. The exposed feather has neither
  // a dark ellipse silhouette nor a discontinuous discard boundary.
  vec2 outside=max(vec2(0.),q-vContact.xy)/max(vec2(.001),1.-vContact.xy);
  float distanceToFoot=length(outside);
  float aa=max(fwidth(distanceToFoot),.003);
  float softness=1.-smoothstep(0.,1.+aa,distanceToFoot);
  float alpha=vContact.z*softness*softness;
  if(vContact.w>.5){
    // A wrapped carton never leaves a detached patch outside the finite belt.
    // Its plane is clipped to the receiver, including the covered end hoods.
    float clipX=smoothstep(-29.2,-29.17,vReceiverPoint.x)*(1.-smoothstep(-14.83,-14.8,vReceiverPoint.x));
    float clipZ=smoothstep(12.86,12.89,vReceiverPoint.y)*(1.-smoothstep(14.11,14.14,vReceiverPoint.y));
    alpha*=clipX*clipZ;
  }
  gl_FragColor=vec4(uContactTint,alpha);
  #include <colorspace_fragment>
}`;

function staticContacts(){
  const contacts:Contact[]=[];
  const add=(x:number,z:number,width:number,depth:number,feather=.07,opacity=.18,y=FLOOR)=>contacts.push({x,y,z,width,depth,feather,opacity});
  // Narrow contacts beneath the actual portal base plates, not beneath the roof.
  for(const z of[4.2,21.3])for(const x of[-35,-6.7])add(x,z,.66,.68,.075,.15);
  // Conveyor adjustable feet; tall machinery does not get a giant black rectangle.
  for(const x of[-28.6,-24.4,-20.2,-15.4])for(const z of[12.85,14.15])add(x,z,.18,.18,.075,.19);
  // A very faint broad occlusion stays under the opaque low belt.
  add(-22,13.5,13.8,1.1,.48,.048);
  // Packing bench and the nearby pallet truck.
  for(const x of[-29,-26.1,-23.2])for(const z of[7.05,8.15])add(x,z,.08,.08,.055,.19);
  add(-26.1,7.6,5.9,1.0,.24,.055);
  for(const z of[17.57,18.03])add(-29.53,z,.145,.115,.055,.18);
  add(-31.02,17.8,.28,.17,.055,.18);
  // Storage uprights are held by these real plates. Pallet runners are shaded on
  // their shelves; no floor decal pretends the raised pallets sit on concrete.
  for(const z of[5.8,9.7,13.6,17.5,21.1])for(const x of[-9.8,-7.5])add(x,z,.35,.33,.07,.16);
  const cargo:[number,number][]=[[.78,7.3],[.78,11.65],[2.28,8.3],[2.28,15.2],[3.78,11.2],[.78,19.2]];
  for(const [shelfY,z] of cargo)for(const dx of[-.63,.63])add(-8.65+dx,z,.14,1.33,.065,.15,shelfY+.0385);
  // Desk floor contacts, conservative tabletop contact beneath the monitor base.
  for(const z of[18.05,20.35])add(-22,z,1.48,.15,.055,.17);
  add(-21.73,20.1,.87,.43,.09,.14);
  add(-22,19.2,1.40,2.40,.34,.045);
  add(-21.70,19.2,.45,.54,.025,.11,1.146);
  for(let i=0;i<5;i++){
    const angle=i/5*Math.PI*2;
    add(-23.25+Math.cos(angle)*.39,19.2+Math.sin(angle)*.39,.11,.065,.055,.18);
  }
  // These two cartons stand on the packing bench's lower shelf, not the floor.
  add(-27.55,7.6,.83,.92,.045,.12,.6035);
  add(-24.1,7.6,.93,.96,.045,.12,.6035);
  return contacts;
}

/** Call after the interior's material batches have been built. The single dynamic
 * source is the already owned kraft-carton batch. The wrapper reads its matrices
 * after asset.render(), so it has no separate clock, easing, pause or loop state.
 */
export function createInteriorContacts(interior:THREE.Group){
  const existing=interior.getObjectByName('Restrained contact shading — material batch');
  if(existing)throw new Error('Remove the old six contact patches before adding their replacement');
  let cartons:THREE.InstancedMesh|undefined;
  interior.traverse(object=>{if(object instanceof THREE.InstancedMesh&&object.name==='Packed cartons — material batch')cartons=object;});
  if(!cartons)throw new Error('Owned carton batch is required for attached contact shading');
  const contacts=staticContacts(),moving:CartonContact[]=[];
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),scale=new THREE.Vector3(),rotation=new THREE.Quaternion();
  for(let index=0;index<cartons.count;index++){
    cartons.getMatrixAt(index,matrix);matrix.decompose(position,rotation,scale);
    if(Math.abs(position.z-LINE_Z)<.001&&Math.abs(position.y-scale.y/2-1.32)<.025&&scale.x>.8&&scale.x<1.1){
      const instanceIndex=contacts.length;
      contacts.push({x:position.x,y:BELT,z:LINE_Z,width:scale.x,depth:scale.z,feather:.045,opacity:.13,belt:true});
      moving.push({sourceIndex:index,instanceIndex,width:scale.x,depth:scale.z,feather:.045});
    }
  }
  if(moving.length!==4)throw new Error(`Expected four owned belt cartons, found ${moving.length}`);
  const geometry=new THREE.PlaneGeometry(1,1),parameters=new Float32Array(contacts.length*4);
  contacts.forEach((contact,index)=>parameters.set([
    contact.width/(contact.width+2*contact.feather),contact.depth/(contact.depth+2*contact.feather),contact.opacity,contact.belt?1:0,
  ],index*4));
  geometry.setAttribute('aContact',new THREE.InstancedBufferAttribute(parameters,4));
  const material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,
    uniforms:{uContactTint:{value:new THREE.Color('#26312c')}},
    transparent:true,depthWrite:false,depthTest:true,toneMapped:false,
    blending:THREE.NormalBlending,premultipliedAlpha:false,
  });
  const mesh=new THREE.InstancedMesh(geometry,material,contacts.length);
  mesh.name='Selective interior support and attached carton contacts';mesh.frustumCulled=false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.castShadow=false;mesh.receiveShadow=false;
  const flat=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
  for(let i=0;i<contacts.length;i++){
    const contact=contacts[i];position.set(contact.x,contact.y,contact.z);
    scale.set(contact.width+2*contact.feather,contact.depth+2*contact.feather,1);
    mesh.setMatrixAt(i,matrix.compose(position,flat,scale));
  }
  mesh.instanceMatrix.needsUpdate=true;
  const group=new THREE.Group();group.name='Owned interior contact refinement';group.add(mesh);
  let disposed=false;
  function render(){
    if(disposed)return;
    for(const contact of moving){
      cartons!.getMatrixAt(contact.sourceIndex,matrix);
      position.set(matrix.elements[12],BELT,matrix.elements[14]);
      scale.set(contact.width+2*contact.feather,contact.depth+2*contact.feather,1);
      mesh.setMatrixAt(contact.instanceIndex,matrix.compose(position,flat,scale));
    }
    mesh.instanceMatrix.needsUpdate=true;
  }
  render();
  const staticBufferBytes=Object.values(geometry.attributes).reduce((sum,a)=>sum+a.array.byteLength,0)+(geometry.index?.array.byteLength??0);
  const stats={drawCalls:1,triangles:contacts.length*2,instances:contacts.length,
    staticBufferBytes,instanceMatrixBytes:mesh.instanceMatrix.array.byteLength,
    geometryBytes:staticBufferBytes+mesh.instanceMatrix.array.byteLength,textures:0,targets:0,lights:0};
  function dispose(){if(disposed)return;disposed=true;mesh.dispose();geometry.dispose();material.dispose();group.clear();group.removeFromParent();}
  return {group,mesh,render,dispose,stats,
    attachmentSnapshot:()=>moving.map(contact=>{
      cartons!.getMatrixAt(contact.sourceIndex,matrix);const cartonX=matrix.elements[12],cartonZ=matrix.elements[14];
      mesh.getMatrixAt(contact.instanceIndex,matrix);
      return {cartonX,cartonZ,contactX:matrix.elements[12],contactZ:matrix.elements[14],receiverY:matrix.elements[13],withinReceiver:cartonX>=LINE_START-1e-5&&cartonX<LINE_END+1e-5};
    })};
}

/** Optional bounded material response. Preserve original colours/geometry and all
 * practical intensities. Painted enclosure faces are mostly dielectric; the bare
 * silver contact rails have the more metallic, tighter reflection. No new shader.
 */
export function refineInteriorMaterialResponse(interior:THREE.Group){
  const seen=new Set<THREE.Material>(),changed:string[]=[];
  interior.traverse(object=>{
    if(!(object instanceof THREE.Mesh))return;
    for(const material of Array.isArray(object.material)?object.material:[object.material]){
      if(!(material instanceof THREE.MeshStandardMaterial)||seen.has(material))continue;seen.add(material);
      const color=material.color.getHex();
      if(color===0xc4c9bf){material.roughness=.46;material.metalness=.08;changed.push('painted shell');}
      else if(color===0x41565b){material.roughness=.40;material.metalness=.63;changed.push('structural steel');}
      else if(color===0xa6b5b8){material.roughness=.27;material.metalness=.83;changed.push('bare silver metal');}
    }
  });
  return changed;
}
