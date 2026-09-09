import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {anchorViewport} from '../src/experience/viewport.ts';
test('opening the lower viewport preserves point positions and apparent size in CSS pixels',()=>{
 for(const [width,reference,heights] of [[390,719,[719,844,769,819,719]],[820,1060,[1060,1180,1060]],[844,330,[330,390,330]]]){
  const c=new PerspectiveCamera(43,1,.012,2600),points=[new Vector3(0,0,-2),new Vector3(.15,.4,-2),new Vector3(-.2,-.3,-3)];
  let first;
  for(const h of heights){anchorViewport(c,width,h,reference);const pixels=points.map(p=>{const v=p.clone().project(c);return[(v.x+1)*width/2,(1-v.y)*h/2];});
   if(!first)first=pixels;else pixels.forEach((p,i)=>p.forEach((n,j)=>assert.ok(Math.abs(n-first[i][j])<1e-9)));
   // Check actual near-frustum corners: bottom coverage grows while the top and
   // horizontal bounds remain those of the original view.
   const top=new Vector3(-1,1,-1).unproject(c),bottom=new Vector3(1,-1,-1).unproject(c);
   assert.ok(Math.abs((top.y-bottom.y)/(2*.012*Math.tan(43*Math.PI/360))-h/reference)<1e-9);
  }
 }
});
test('ordinary desktop projection is identical and rotation can select a new reference',()=>{
 const a=new PerspectiveCamera(43,1600/1000,.1,2600),b=new PerspectiveCamera(43,1,.1,2600);
 anchorViewport(b,1600,1000,1000);assert.deepEqual(b.projectionMatrix.elements,a.projectionMatrix.elements);
 anchorViewport(b,844,390,330);assert.equal(b.view.fullHeight,330);assert.equal(b.aspect,844/330);
 anchorViewport(b,390,844,719);assert.equal(b.view.fullHeight,719);assert.equal(b.aspect,390/719);
});
