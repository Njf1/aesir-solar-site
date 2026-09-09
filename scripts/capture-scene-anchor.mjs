import {chromium,webkit} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {launchOptions} from './browser-options.mjs';
import {sunPixels} from '../tests/browser/helpers/scene-anchor.ts';
const phase=process.env.ANCHOR_PHASE||'before',engine=process.env.ANCHOR_ENGINE||'chromium',origin=process.env.ANCHOR_ORIGIN||'http://127.0.0.1:4173';
const dir=`docs/experience/mobile-scene-anchor/${phase}-${engine}`;await mkdir(dir,{recursive:true});
const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{headless:true}:launchOptions);
const c=await browser.newContext({isMobile:true,hasTouch:true,viewport:{width:390,height:719},recordVideo:{dir,size:{width:390,height:844}}}),p=await c.newPage();
const report={engine,browser:browser.version(),origin,method:'Desktop touch emulation; CSS small viewport held at 719px while visible height changes. This does not simulate native browser window translation.',errors:[],rows:[]};
p.on('pageerror',e=>report.errors.push(e.message));
await p.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin&&!u.pathname.startsWith('/api/')&&r.request().method()==='GET'?r.continue():r.abort();});
await p.goto(origin+'/?inspect=1');await p.evaluate(()=>document.documentElement.style.setProperty('--scroll-unit','7.19px'));
await p.waitForFunction(()=>window.__experience?.snapshot().ready);await p.waitForTimeout(800);
async function move(value){await p.evaluate(value=>{const j=document.querySelector('#journey'),s=document.querySelector('#stage');scrollTo(0,value/6.08*(j.offsetHeight-s.offsetHeight));},value);await p.waitForFunction(v=>Math.abs(window.__experience.snapshot().renderedProgress-v)<.003,value);}
for(const progress of [.06,.15]){
 await move(progress);await p.locator('#pause-motion').click();
 for(const height of [719,844,769,819,719]){
  await p.setViewportSize({width:390,height});await p.waitForTimeout(100);
  report.rows.push({progress,height,sun:await sunPixels(p),state:await p.evaluate(()=>{const s=window.__experience.snapshot();return {progress:s.renderedProgress,view:s.view,quality:s.quality,ambientTime:s.ambientTime};})});
  await p.screenshot({path:`${dir}/p${progress}-${height}.jpg`,quality:94});await p.waitForTimeout(250);
 }
 await p.locator('#pause-motion').click();
}
for(const direction of [1,-1]){
 for(let i=0;i<28;i++){
  await move(.03+.22*(direction===1?i/27:1-i/27));
  if(i===6)await p.setViewportSize({width:390,height:844});
  if(i===19)await p.setViewportSize({width:390,height:719});
  await p.waitForTimeout(90);
 }
}
if(phase!=='before'){
 await p.setViewportSize({width:390,height:844});report.expandedViews=[];
 for(const [name,value] of [['close-sun',.315],['earth',.925],['panel',2.23],['cell',2.685],['inverter',4.02],['business',4.62],['storage',5.08],['brand',6.03]]){
  await move(value);await p.waitForTimeout(200);await p.screenshot({path:`${dir}/${name}.jpg`,quality:94});
  report.expandedViews.push({name,state:await p.evaluate(()=>{const s=window.__experience.snapshot();return {progress:s.renderedProgress,view:s.view,quality:s.quality,drawCalls:s.drawCalls,triangles:s.triangles,geometries:s.geometries,textures:s.textures};})});
 }
}
const video=p.video();await c.close();await video.saveAs(`${dir}/scroll-and-bars.webm`);await video.delete();await browser.close();
await writeFile(`${dir}/measurements.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report.rows.map(r=>({progress:r.progress,height:r.height,sun:r.sun})),null,2));
