import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {createBusinessInterior} from '../src/experience/interior.ts';import {sampleJourney} from '../src/experience/journey.ts';import {ABSORPTION_POINT} from '../src/experience/conversion-journey.ts';import {framingFor} from '../src/experience/progress.ts';
import {geographicTransitionUniforms,updateGeographicTransition} from '../src/experience/geographic-transition.ts';
import {EnergyFlow} from '../src/experience/energy-flow.ts';
import {countrysideParcels} from '../src/experience/countryside.ts';

test('absorption stays resolved in the central viewing field in all required viewport shapes',()=>{
 for(const[w,h]of[[1280,720],[1600,1000],[390,844],[740,900],[1000,500]])for(const p of[2.655,2.675,2.685,2.71,2.76]){
  const shot=sampleJourney(p,framingFor(w,h)),camera=new T.PerspectiveCamera(43,w/h,.01,2600);camera.position.set(...shot.camera);camera.up.set(...shot.up);camera.lookAt(...shot.target);camera.updateMatrixWorld();
  const point=ABSORPTION_POINT.clone().project(camera),edge=ABSORPTION_POINT.clone().add(new T.Vector3(.7,0,0)).project(camera);
  assert.ok(Math.abs(point.x)<.72&&point.y>-.68&&point.y<.5,`${w}x${h}/${p} focal event ${point.toArray()}`);
  assert.ok(Math.hypot((edge.x-point.x)*w/2,(edge.y-point.y)*h/2)>15,'local response has a readable extent without enlarging the incident guide');
 }
});

test('geographic layers conceal only bounded joins and restore the same directional state in reverse',()=>{
 const u=geographicTransitionUniforms(),frames=[];
 for(let i=0;i<=500;i++){const p=1.20+i*.001;updateGeographicTransition(u,p,390/844);frames.push([p,u.uGeoKind.value,u.uGeoSweep.value,u.uGeoConceal.value]);assert.ok(u.uGeoConceal.value>=0&&u.uGeoConceal.value<=1);if(u.uGeoConceal.value===1)assert.ok(Math.abs(p-1.30)<=.00401||Math.abs(p-1.55)<=.00401);}
 for(const f of frames.reverse()){updateGeographicTransition(u,f[0],390/844);assert.deepEqual([u.uGeoKind.value,u.uGeoSweep.value,u.uGeoConceal.value],f.slice(1));}
 for(const p of[1.30,1.55]){updateGeographicTransition(u,p,16/9);assert.equal(u.uGeoConceal.value,1);}
 const parcels=countrysideParcels();assert.ok(parcels.length<150);const area=parcels.reduce((n,p)=>n+Math.abs(p.points.reduce((n,a,i)=>{const b=p.points[(i+1)%p.points.length];return n+a[0]*b[1]-b[0]*a[1];},0))/2,0);assert.ok(Math.abs(area-1024**2)<1e-6);assert.deepEqual(countrysideParcels(),parcels);
});

test('moving cartons and contact artwork share one deterministic clock and safe spacing',()=>{
 for(const tier of['mobile','desktop']){const owner=createBusinessInterior(tier);try{
  const contacts=owner.group.getObjectByName('Selective interior support and attached carton contacts'),mat=new T.Matrix4();assert.ok(contacts);
  const attributes=contacts.geometry.attributes.position,matrices=contacts.instanceMatrix;let wraps=0,previous=null;
  for(let i=0;i<=1600;i++){const time=i*.025;owner.render({lighting:1,equipment:1,screen:1},time);const state=owner.motionSnapshot(),centres=state.cartonCentres;
   for(let c=0;c<4;c++){contacts.getMatrixAt(contacts.count-4+c,mat);assert.ok(Math.abs(mat.elements[12]-centres[c])<2e-6);if(previous&&Math.abs(centres[c]-previous[c])>5){wraps++;assert.ok(centres[c]<-28.6||centres[c]>-15.4,'recirculation stays within covered endpoints');}
    for(let k=c+1;k<4;k++){const d=Math.abs(centres[c]-centres[k]);assert.ok(Math.min(d,14.4-d)>3.5,'products cannot overlap on the indexing belt');}
   }
   assert.equal(contacts.geometry.attributes.position,attributes);assert.equal(contacts.instanceMatrix,matrices);previous=centres;
  }assert.ok(wraps>=4);
  owner.render({lighting:1,equipment:.7,screen:1},5.2);const saved=owner.motionSnapshot(),savedMatrix=Array.from(contacts.instanceMatrix.array);owner.render({lighting:1,equipment:1,screen:1},33);owner.render({lighting:1,equipment:.7,screen:1},5.2);assert.deepEqual(owner.motionSnapshot(),saved);assert.deepEqual(Array.from(contacts.instanceMatrix.array),savedMatrix);
 }finally{owner.dispose();owner.dispose();}}
});


test('end-on DC acquisition has an attached soft source face without per-frame geometry allocation',()=>{
 const path=new T.LineCurve3(new T.Vector3(),new T.Vector3(0,0,10)),open=new EnergyFlow(path,.035,32,false),capped=new EnergyFlow(path,.035,32,false,true);
 try{const ray=new T.Raycaster(new T.Vector3(0,0,-2),new T.Vector3(0,0,1));open.mesh.updateMatrixWorld(true);capped.mesh.updateMatrixWorld(true);
  assert.equal(ray.intersectObject(open.mesh).length,0,'the original open tube is invisible exactly end-on');
  const hits=ray.intersectObject(capped.mesh);assert.ok(hits.length);assert.ok(Math.abs(hits[0].distance-2)<1e-6,'the closure stays at the actual exported route source');
  assert.equal(capped.geometryBytes-open.geometryBytes,222);assert.equal(capped.mesh.geometry.index.count-open.mesh.geometry.index.count,15);
  const position=capped.mesh.geometry.attributes.position,index=capped.mesh.geometry.index;
  for(const u of[.004,.05,1,.05,.004]){capped.render(u,5,.8);assert.equal(capped.mesh.geometry.attributes.position,position);assert.equal(capped.mesh.geometry.index,index);}
 }finally{open.dispose();capped.dispose();}
});
