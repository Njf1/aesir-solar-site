// Dense analytic check against the actual authored meshes and their instance bounds.
// Stub only canvas painting; no browser/GPU/network. Bounds conservatively enclose
// every triangle, so positive camera-to-bounds clearance outside the near-frustum
// circumsphere proves no mesh enters the volume removed by the new near plane.
import * as THREE from 'three';
import {sampleJourney,sampleGuide} from '../src/experience/journey.ts';
import {createCommercialSite} from '../src/experience/commercial.ts';
const canvas=()=>{const c={tagName:'CANVAS',width:0,height:0},ctx=new Proxy({canvas:c},{get:(o,p)=>p in o?o[p]:()=>{}});c.getContext=()=>ctx;return c;};
globalThis.document={createElement:canvas};
const asset=createCommercialSite('desktop');asset.group.updateMatrixWorld(true);const bounds=[];
asset.group.traverse(o=>{
 if(!(o instanceof THREE.Mesh))return;
 if(o instanceof THREE.InstancedMesh){o.computeBoundingBox();const instances=[];o.geometry.computeBoundingBox();const matrix=new THREE.Matrix4();for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);matrix.premultiply(o.matrixWorld);instances.push(o.geometry.boundingBox.clone().applyMatrix4(matrix));}bounds.push({name:o.name,box:o.boundingBox.clone().applyMatrix4(o.matrixWorld),instances});}
 else {o.geometry.computeBoundingBox();bounds.push({name:o.name,box:o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)});}
});
const report=[];const from=new THREE.Vector3(),head=new THREE.Vector3(),forward=new THREE.Vector3(),point=new THREE.Vector3();const tan=Math.tan(43*Math.PI/360);
for(const [mode,aspect] of [['landscape',1.6],['portrait',390/844],['short',2],['portrait',740/900],['landscape',1280/720]]){
 let minMesh={margin:Infinity},minHead={margin:Infinity},minTrail={margin:Infinity},minHero={margin:Infinity},nearMin=Infinity,nearMax=0,failures=0;
 const glass=asset.group.children.find(o=>o.name.startsWith('PV glass and cells'));const matrix=new THREE.Matrix4(),centre=new THREE.Vector3();let heroMatrix;
 for(let i=0;i<glass.count;i++){glass.getMatrixAt(i,matrix);centre.setFromMatrixPosition(matrix);if(centre.distanceTo(asset.heroAnchor)<.02){heroMatrix=matrix.clone().premultiply(glass.matrixWorld);break;}}
 if(!heroMatrix)throw new Error('Authored hero glass not found');
 const heroCorners=[];for(const x of [-.5,.5])for(const y of [-.5,.5])heroCorners.push(new THREE.Vector3(x,y,0).applyMatrix4(heroMatrix));
 for(let i=0;i<=7000;i++){
  const p=1.55+i/10000,s=sampleJourney(p,mode);from.set(...s.camera);head.set(...s.pulse);forward.set(...s.target).sub(from).normalize();
  const distance=from.distanceTo(head),near=THREE.MathUtils.clamp(distance*.01,.05,3);nearMin=Math.min(nearMin,near);nearMax=Math.max(nearMax,near);
  const clipSphereRadius=near*Math.sqrt(1+tan*tan*(1+aspect*aspect));
  for(const {name,box,instances} of bounds){let margin=box.distanceToPoint(from)-clipSphereRadius;if(margin<1&&instances)margin=Math.min(...instances.map(b=>b.distanceToPoint(from)-clipSphereRadius));if(margin<minMesh.margin)minMesh={margin,p,name,near};if(margin<=0)failures++;}
  // Additional SiteScene terrain and access roads lie at y=-.52 and y=-.02.
  if(from.y-clipSphereRadius<=-.02)throw new Error('Near volume touches ground or road');
  const depth=head.clone().sub(from).dot(forward),headMargin=depth-near-.032*distance/20;
  if(headMargin<minHead.margin)minHead={margin:headMargin,p,depth,near};if(headMargin<=0)failures++;
  for(const corner of heroCorners){const margin=point.copy(corner).sub(from).dot(forward)-near;if(margin<minHero.margin)minHero={margin,p,near};if(margin<=0)failures++;}
  for(let j=0;j<=80;j++){
   const along=j/80;sampleGuide(s,along*s.trailLength,point);
   const radius=.025*(distance/20)*Math.sin(Math.PI*Math.sqrt(along))*Math.pow(1-along,1.2);
   const margin=point.sub(from).dot(forward)-radius-near;if(margin<minTrail.margin)minTrail={margin,p,along,near};if(margin<=0)failures++;
  }
 }
 report.push({mode,aspect,samples:7001,failures,nearMin,nearMax,minMesh,minHead,minHero,minTrail});
}
asset.dispose();console.log(JSON.stringify({meshBounds:bounds.length,results:report},null,2));if(report.some(r=>r.failures))process.exitCode=1;
