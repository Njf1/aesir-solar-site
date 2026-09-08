import {createCountrysideTexture} from './countryside.ts';
import * as THREE from 'three';
import {SITE_BUDGET,assertBudget} from './budgets';
import {createCommercialSite,type CommercialSite} from './commercial';
export class SiteScene{
 readonly group=new THREE.Group();private asset?:CommercialSite;private disposed=false;
 private geometries:THREE.BufferGeometry[]=[];private materials:THREE.Material[]=[];private textures:THREE.Texture[]=[];private environment?:THREE.WebGLRenderTarget;
 async prepare(mobile:boolean,renderer:THREE.WebGLRenderer){
  this.asset=createCommercialSite(mobile?'mobile':'desktop');this.group.add(this.asset.group);
  const texture=createCountrysideTexture(mobile);this.textures.push(texture);
  const groundG=new THREE.PlaneGeometry(1500,1500),groundM=new THREE.MeshStandardMaterial({map:texture,roughness:1});this.geometries.push(groundG);this.materials.push(groundM);const ground=new THREE.Mesh(groundG,groundM);ground.rotation.x=-Math.PI/2;ground.position.y=-.52;ground.receiveShadow=true;this.group.add(ground);
  const roadG=new THREE.PlaneGeometry(671,10),roadM=new THREE.MeshStandardMaterial({color:'#393c3a',roughness:1});this.geometries.push(roadG);this.materials.push(roadM);
  for(const x of [-414.5,414.5]){const road=new THREE.Mesh(roadG,roadM);road.rotation.x=-Math.PI/2;road.position.set(x,-.02,66);road.receiveShadow=true;this.group.add(road);}
  // Original sky dome/light cards supply broad, restrained architectural reflections.
  const sky=new THREE.Scene();sky.background=new THREE.Color('#b6ccdb');
  const skyG=new THREE.SphereGeometry(300,24,12),skyM=new THREE.ShaderMaterial({side:THREE.BackSide,vertexShader:'varying vec3 d;void main(){d=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 d;void main(){float h=normalize(d).y;vec3 c=mix(vec3(.30,.37,.29),vec3(.73,.85,.96),smoothstep(-.08,.12,h));c=mix(c,vec3(.24,.45,.67),smoothstep(.1,1.,h));gl_FragColor=vec4(c,1.);}'});
  sky.add(new THREE.Mesh(skyG,skyM));const cloudG=new THREE.PlaneGeometry(180,80),cloudM=new THREE.MeshBasicMaterial({color:'#f0f2ed',side:THREE.DoubleSide});const cloud=new THREE.Mesh(cloudG,cloudM);cloud.position.set(-90,90,-70);cloud.lookAt(0,0,0);sky.add(cloud);
  const pmrem=new THREE.PMREMGenerator(renderer);this.environment=pmrem.fromScene(sky,.04,.1,1000,{size:mobile?128:256});pmrem.dispose();skyG.dispose();skyM.dispose();cloudG.dispose();cloudM.dispose();
  const stats=this.snapshot();assertBudget('site geometry',stats.geometryBytes,SITE_BUDGET.geometryBytes);assertBudget('site triangles',stats.triangles??0,SITE_BUDGET.triangles);assertBudget('site base draws',(stats.drawCalls??0)+3,SITE_BUDGET.baseDrawCalls);const decoded=(stats.textureBytes??0)+stats.extraTextureBytes;assertBudget('site decoded textures',decoded,mobile?SITE_BUDGET.decodedMobile:SITE_BUDGET.decodedDesktop);assertBudget('site retained GPU estimate',decoded*4/3+stats.environmentEstimatedBytes+(mobile?1024:2048)**2*8,mobile?SITE_BUDGET.gpuMobile:SITE_BUDGET.gpuDesktop);
  return this;
 }
 get env(){return this.environment?.texture??null;}
 setOperation(section:number,activity:number,dusk:number){this.asset?.setOperation(section,activity,dusk);}
 snapshot(){return{...this.asset?.stats,geometryBytes:this.geometryBytes(),extraTextureBytes:this.textures.reduce((n,t)=>n+(t.image as {width:number;height:number}).width*(t.image as {width:number;height:number}).height*4,0),environmentEstimatedBytes:this.environment?this.environment.width*this.environment.height*12:0};}
 private geometryBytes(){
  let bytes=0;const seen=new Set<THREE.BufferGeometry>();
  this.group.traverse(o=>{
   if(o instanceof THREE.Mesh&&!seen.has(o.geometry)){seen.add(o.geometry);bytes+=(Object.values(o.geometry.attributes) as THREE.BufferAttribute[]).reduce((n,a)=>n+a.array.byteLength,0)+(o.geometry.index?.array.byteLength??0);}
   if(o instanceof THREE.InstancedMesh)bytes+=o.instanceMatrix.array.byteLength+(o.instanceColor?.array.byteLength??0);
  });return bytes;
 }

 dispose(){if(this.disposed)return;this.disposed=true;this.asset?.dispose();this.environment?.dispose();for(const x of this.textures){x.dispose();if(x.image instanceof HTMLCanvasElement)x.image.width=x.image.height=0;}for(const x of this.materials)x.dispose();for(const x of this.geometries)x.dispose();this.group.clear();this.group.removeFromParent();}
}
