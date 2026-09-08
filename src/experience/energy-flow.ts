import * as THREE from 'three';
/** A broad, repeating energy-flow overlay, not an electron or a recoloured photon.
 * A reveal front follows chapter distance; ambient modulation represents sustained
 * operation and is frozen by the owner's pause/reduced-motion time policy. */
export class EnergyFlow{
 readonly mesh:THREE.Mesh<THREE.TubeGeometry,THREE.ShaderMaterial>;
 constructor(path:THREE.Curve<THREE.Vector3>,radius:number,segments=120,through=false){
  const geometry=new THREE.TubeGeometry(path,segments,radius,5,false);
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:!through,blending:THREE.AdditiveBlending,toneMapped:false,
   uniforms:{uTravel:{value:0},uTime:{value:0},uOpacity:{value:0},uRepeats:{value:Math.max(3,path.getLength()/(radius*100))}},
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:`varying vec2 vUv;uniform float uTravel,uTime,uOpacity,uRepeats;
   void main(){float reveal=1.-smoothstep(uTravel-.025,uTravel+.006,vUv.x);float phase=fract(vUv.x*uRepeats-uTime*.20);
   float bar=smoothstep(.08,.14,phase)*(1.-smoothstep(.34,.40,phase));float across=.5+.5*sin(vUv.y*3.14159265);
   float a=uOpacity*reveal*(.30+.65*bar)*across;if(a<.004)discard;gl_FragColor=vec4(vec3(.35,.74,.93),a);}`});
  this.mesh=new THREE.Mesh(geometry,material);this.mesh.name='Illustrative electrical energy flow';this.mesh.renderOrder=7;this.mesh.visible=false;
 }
 render(travel:number,time:number,opacity:number){this.mesh.visible=opacity>.001&&travel>.001;const u=this.mesh.material.uniforms;u.uTravel.value=travel;u.uTime.value=time;u.uOpacity.value=opacity;}
 get geometryBytes(){const g=this.mesh.geometry;return Object.values(g.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(g.index?.array.byteLength??0);}
 dispose(){this.mesh.removeFromParent();this.mesh.geometry.dispose();this.mesh.material.dispose();}
}

