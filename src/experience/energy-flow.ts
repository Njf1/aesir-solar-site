import * as THREE from 'three';
import {energyFlowVertex,linearEnergyFlowFragment} from './render-detail.ts';
/** A broad, repeating energy-flow overlay, not an electron or a recoloured photon.
 * A reveal front follows chapter distance; ambient modulation represents sustained
 * operation and is frozen by the owner's pause/reduced-motion time policy. */
export class EnergyFlow{
 readonly mesh:THREE.Mesh<THREE.TubeGeometry,THREE.ShaderMaterial>;
 constructor(path:THREE.Curve<THREE.Vector3>,radius:number,segments=120,through=false,capSource=false){
  const geometry=new THREE.TubeGeometry(path,segments,radius,5,false);
  // The acquired cable can be viewed nearly end-on. Close that end with the
  // same directional overlay; an open tube otherwise shows almost no surface.
  if(capSource){
   const oldP=geometry.getAttribute('position'),oldN=geometry.getAttribute('normal'),oldUV=geometry.getAttribute('uv'),count=oldP.count,radial=geometry.parameters.radialSegments;
   const positions=new Float32Array((count+radial+1)*3),normals=new Float32Array(positions.length),uvs=new Float32Array((count+radial+1)*2);
   positions.set(oldP.array);normals.set(oldN.array);uvs.set(oldUV.array);
   const centre=path.getPointAt(0),normal=path.getTangentAt(0).negate();
   centre.toArray(positions,count*3);normal.toArray(normals,count*3);uvs[count*2]=-1;uvs[count*2+1]=1;
   for(let i=0;i<radial;i++){positions.set([oldP.getX(i),oldP.getY(i),oldP.getZ(i)],(count+1+i)*3);normal.toArray(normals,(count+1+i)*3);uvs[(count+1+i)*2]=-1;uvs[(count+1+i)*2+1]=0;}
   const indices=Array.from(geometry.index!.array),edgeA=new THREE.Vector3().fromBufferAttribute(oldP,0).sub(centre),edgeB=new THREE.Vector3().fromBufferAttribute(oldP,1).sub(centre),forward=edgeA.cross(edgeB).dot(normal)>0;
   for(let i=0;i<radial;i++){const a=count+1+i,b=count+1+(i+1)%radial;indices.push(count,forward?a:b,forward?b:a);}
   geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));geometry.setIndex(indices);
  }
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:!through,blending:THREE.AdditiveBlending,toneMapped:false,
   uniforms:{uTint:{value:new THREE.Color(0x79cef2)},uTravel:{value:0},uTime:{value:0},uOpacity:{value:0},uRepeats:{value:Math.max(3,path.getLength()/(radius*100))}},
   vertexShader:energyFlowVertex,fragmentShader:linearEnergyFlowFragment});
  this.mesh=new THREE.Mesh(geometry,material);this.mesh.name='Illustrative electrical energy flow';this.mesh.renderOrder=7;this.mesh.visible=false;
 }
 render(travel:number,time:number,opacity:number){this.mesh.visible=opacity>.001&&travel>.001;const u=this.mesh.material.uniforms;u.uTravel.value=travel;u.uTime.value=time;u.uOpacity.value=opacity;}
 get geometryBytes(){const g=this.mesh.geometry;return Object.values(g.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(g.index?.array.byteLength??0);}
 dispose(){this.mesh.removeFromParent();this.mesh.geometry.dispose();this.mesh.material.dispose();}
}

