import test from 'node:test';import assert from 'node:assert/strict';import*as T from 'three';
import{readFileSync}from'node:fs';
import{operationState}from'../src/experience/business-journey.ts';
import{sampleJourney}from'../src/experience/journey.ts';
import{createCommercialSite}from'../src/experience/commercial.ts';
import{createBusinessInterior}from'../src/experience/interior.ts';
import{renderRecordedSummary}from'../scripts/recorded-generation.mjs';
const V=a=>new T.Vector3(...a);
function withCanvas(fn){const old=globalThis.document;globalThis.document={createElement(){const c={width:0,height:0};c.getContext=()=>new Proxy({canvas:c,createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}});return c;}};try{return fn();}finally{globalThis.document=old;}}
test('actual corrugation ends above the plinth and the selected facade returns completely',()=>withCanvas(()=>{
 for(const tier of['desktop','mobile']){const a=createCommercialSite(tier),m=new T.Matrix4(),box=new T.Box3();try{
 const snapshots=[];let ribs=0;
 a.group.traverse(o=>{if(!(o instanceof T.InstancedMesh))return;snapshots.push([o,Array.from(o.instanceMatrix.array)]);if(!o.name.includes('cladding ribs'))return;o.geometry.computeBoundingBox();for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);box.copy(o.geometry.boundingBox).applyMatrix4(m);if(box.max.y>9.99&&box.min.y<2){assert.ok(box.min.y>=1.45999,'ribs must not share the plinth outer face below y=1.4');ribs++;}}});assert.ok(ribs>50);
 a.setOperation(operationState(4.60).section,1,0);assert.ok(snapshots.some(([o,values])=>values.some((x,i)=>x!==o.instanceMatrix.array[i])),'the actual facade opens');
 a.setOperation(operationState(6.03).section,1,1);for(const[o,values]of snapshots)assert.deepEqual(Array.from(o.instanceMatrix.array),values,'every original facade transform is restored');
 assert.equal(operationState(5.0).section,0);assert.equal(operationState(6.08).section,0);
 }finally{a.dispose();}}
}));
test('battery explanation holds one composed pose and closes the wall only after camera exit',()=>{
 for(const mode of['landscape','portrait','short']){
 const hold=sampleJourney(5.07,mode);for(let p=5.071;p<=5.269;p+=.002){const s=sampleJourney(p,mode);assert.ok(V(s.camera).distanceTo(V(hold.camera))<1e-8);assert.ok(V(s.target).distanceTo(V(hold.target))<1e-8);}
 for(let p=4.91;p<=4.975;p+=.001)assert.ok(sampleJourney(p,mode).camera[0]<-40.8,'camera remains outside the closing west facade');
 for(const p of[4.94,5.07,5.27,5.39]){const a=sampleJourney(p-1e-6,mode),b=sampleJourney(p+1e-6,mode);assert.ok(V(a.camera).distanceTo(V(b.camera))<.004);assert.ok(V(a.target).distanceTo(V(b.target))<.004);}
 }
});
test('the carton line is slower, cannot fast-forward with scroll activation, and keeps a steady clock',()=>{
 const a=createBusinessInterior('mobile');try{let prev;
 for(let i=0;i<=2400;i++){const t=i*.02;a.render({lighting:1,equipment:1,screen:1},t);const p=a.motionSnapshot().cartonCentres;if(prev)for(let j=0;j<4;j++){let d=p[j]-prev[j];if(d< -7)d+=14.4;assert.ok(d>=-1e-10&&d/.02<.38,'physical line speed stays below 0.38 m/s');}prev=p;}
 a.render({lighting:1,equipment:0,screen:0},141.7);const base=a.motionSnapshot().cartonCentres;for(const e of[.1,.3,.6,.9,1]){a.render({lighting:1,equipment:e,screen:1},141.7);assert.deepEqual(a.motionSnapshot().cartonCentres,base,'scroll reveal never multiplies elapsed time');}
 assert.ok(a.stats.drawCalls<=22);assert.equal(a.stats.textureBytes,0);
 }finally{a.dispose();}
});
test('compact recorded summary preserves zero and never manufactures a missing sample',()=>{
 const sample=JSON.parse(readFileSync(new URL('../data/premier-composites.json',import.meta.url)));sample.day_sample.pv_production_kwh=0;
 const zero=renderRecordedSummary(sample);assert.match(zero,/0\.00 kWh/);assert.match(zero,/2026-08-24/);assert.match(zero,/Tigo/);assert.match(zero,/not independently verified/);assert.doesNotMatch(zero,/unavailable/);
 for(const value of[null,{}, {...sample,day_sample:{...sample.day_sample,pv_production_kwh:null}}]){const missing=renderRecordedSummary(value);assert.match(missing,/unavailable/);assert.doesNotMatch(missing,/206\.41|0\.00/);assert.match(missing,/\/apply.html/);}
});
