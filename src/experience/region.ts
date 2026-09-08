import {filterRegionalTerrain,refineRegionalWater} from './region-material.ts';
import * as THREE from 'three';
import {REGION_BUDGET,assertBudget} from './budgets';
import regionURL from './assets/region-land.json?url';
import {latLonToRegion,latLonToEarth} from './geography';
export type RegionData={polygons:{id:string;role:string;rings:number[][][]}[]};
export class RegionScene{
 readonly group=new THREE.Group();readonly globeOutline=new THREE.Group();
 private controller=new AbortController();private disposed=false;
 private geometries:THREE.BufferGeometry[]=[];private materials:THREE.Material[]=[];
 private bytes=0;private triangles=0;
 async prepare(){
  const response=await fetch(regionURL,{signal:this.controller.signal});if(!response.ok)throw new Error('region-fetch');
  const text=await response.text();this.bytes=new TextEncoder().encode(text).byteLength;
  if(this.disposed)throw new Error('region-disposed');
  const data=JSON.parse(text) as RegionData;
  const position:number[]=[],colors:number[]=[];const indices:number[]=[];
  const land=new THREE.Color('#62785e'),context=new THREE.Color('#425e59');
  for(const polygon of data.polygons){
   const rings=polygon.rings.map(r=>r.slice(0,-1).map(([lon,lat])=>{const v=latLonToRegion(lat,lon);return new THREE.Vector2(v.x,-v.z);}));
   const faces=THREE.ShapeUtils.triangulateShape(rings[0],rings.slice(1)),points=rings.flat();const offset=position.length/3;
   for(const v of points){position.push(v.x,.005,-v.y);const color=polygon.id==='great-britain'?land:context;colors.push(color.r,color.g,color.b);}
   for(const f of faces)indices.push(...f.map(i=>i+offset));
   if(polygon.id==='great-britain'){
    const linePoints=polygon.rings[0].map(([lon,lat])=>{const p=latLonToRegion(lat,lon);p.y=.024;return p;});
    const material=new THREE.LineBasicMaterial({color:'#dac795',transparent:true,opacity:.72});this.materials.push(material);
    const geometry=new THREE.BufferGeometry().setFromPoints(linePoints);this.geometries.push(geometry);this.group.add(new THREE.Line(geometry,material));
    const globeGeo=new THREE.BufferGeometry().setFromPoints(polygon.rings[0].map(([lon,lat])=>latLonToEarth(lat,lon,10.025)));this.geometries.push(globeGeo);
    const globeMat=new THREE.LineBasicMaterial({color:'#e6cc93',transparent:true,opacity:0});this.materials.push(globeMat);this.globeOutline.add(new THREE.Line(globeGeo,globeMat));
   }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();this.geometries.push(geometry);this.triangles=indices.length/3;
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,side:THREE.DoubleSide,transparent:true,depthWrite:false});material.onBeforeCompile=shader=>{
   shader.vertexShader='varying vec2 vGround;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGround=position.xz;');
   shader.fragmentShader=`varying vec2 vGround;
float hashLand(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noiseLand(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hashLand(i),hashLand(i+vec2(1,0)),f.x),mix(hashLand(i+vec2(0,1)),hashLand(i+1.),f.x),f.y);}
`+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float terrain=noiseLand(vGround*1.8)*.55+noiseLand(vGround*7.)*.3+noiseLand(vGround*29.)*.15;
diffuseColor.rgb*=.80+terrain*.38;diffuseColor.a*=1.-smoothstep(9.,14.,length(vGround));`);
  };filterRegionalTerrain(material);this.materials.push(material);this.group.add(new THREE.Mesh(geometry,material));
  const waterG=new THREE.PlaneGeometry(120,120),waterM=new THREE.MeshStandardMaterial({color:'#183e52',roughness:.68,metalness:.1});refineRegionalWater(waterM);this.geometries.push(waterG);this.materials.push(waterM);const water=new THREE.Mesh(waterG,waterM);water.rotation.x=-Math.PI/2;water.position.y=-.025;this.group.add(water);
  const stats=this.snapshot();assertBudget('region transfer',stats.transferBytes,REGION_BUDGET.rawBytes);assertBudget('region geometry',stats.geometryBytes,REGION_BUDGET.geometryBytes);assertBudget('region triangles',stats.triangles,REGION_BUDGET.triangles);
  return this;
 }
 emphasize(amount:number){this.globeOutline.traverse(o=>{if(o instanceof THREE.Line)(o.material as THREE.LineBasicMaterial).opacity=amount*.72;});}
 snapshot(){return{transferBytes:this.bytes,triangles:this.triangles,geometryBytes:this.geometries.reduce((n,g)=>n+Object.values(g.attributes).reduce((v,a)=>v+a.array.byteLength,0)+(g.index?.array.byteLength??0),0),textures:0};}
 dispose(){if(this.disposed)return;this.disposed=true;this.controller.abort();for(const g of this.geometries)g.dispose();for(const m of this.materials)m.dispose();this.group.clear();this.globeOutline.clear();this.group.removeFromParent();this.globeOutline.removeFromParent();}
}
