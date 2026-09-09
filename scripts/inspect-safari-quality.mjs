import {webkit,chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import os from 'node:os';
import {launchOptions} from './browser-options.mjs';
const phase=process.env.SAFARI_PHASE||'before',origin=process.env.SAFARI_ORIGIN||'http://127.0.0.1:4173';
const engine=process.env.SAFARI_ENGINE||'webkit',dir=`docs/experience/safari-performance/${phase}-${engine}`;
await mkdir(dir,{recursive:true});
const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{headless:true}:launchOptions);
const report={date:new Date().toISOString(),engine,browser:browser.version(),host:{cpu:os.cpus()[0].model,memoryGiB:os.totalmem()/2**30},method:'Desktop browser with touch/viewport emulation and a controlled 8-core report. Not a physical iPad/iPhone or a GPU-throttling test.',views:[]};
const snap=p=>p.evaluate(()=>window.__experience.snapshot());
async function move(p,value){await p.evaluate(value=>{const j=document.querySelector('#journey'),s=document.querySelector('#stage');scrollTo(0,value/6.08*(j.offsetHeight-s.offsetHeight));},value);await p.waitForFunction(value=>Math.abs(window.__experience.snapshot().renderedProgress-value)<.003,value);}
for(const [name,width,height,dpr] of [['ipad',820,1180,2],['iphone-landscape',844,390,3]]){
 const c=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,isMobile:true,hasTouch:true,recordVideo:{dir,size:{width:Math.min(width,820),height:Math.min(height,1180)}}}),p=await c.newPage();
 const row={name,errors:[],warnings:[],scenes:[]};report.views.push(row);
 await p.addInitScript(()=>Object.defineProperty(navigator,'hardwareConcurrency',{value:8,configurable:true}));
 p.on('pageerror',e=>row.errors.push(e.message));p.on('console',m=>{if(m.type()==='warning')row.warnings.push(m.text());});
 await p.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin&&!u.pathname.startsWith('/api/')&&r.request().method()==='GET'?r.continue():r.abort();});
 const start=Date.now();await p.goto(origin+'/?inspect=1');await p.waitForFunction(()=>window.__experience?.snapshot().ready);row.initialReadyMs=Date.now()-start;
 row.inputs=await p.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio,cores:navigator.hardwareConcurrency,touch:navigator.maxTouchPoints,coarse:matchMedia('(any-pointer:coarse)').matches,userAgent:navigator.userAgent}));
 for(const [scene,value] of [['sun',.32],['earth',.925],['panel',2.23],['cell',2.685],['inverter',4.02],['business',4.62],['storage',5.07],['brand',6.03]]){
  await move(p,value);await p.waitForTimeout(200);await p.evaluate(()=>window.__experience.resetTiming());await p.waitForTimeout(1400);
  const {frameIntervals,...s}=await snap(p),f=frameIntervals.sort((a,b)=>a-b);
  row.scenes.push({scene,p50:f[Math.floor(f.length*.5)],p95:f[Math.floor(f.length*.95)],max:f.at(-1),state:s});
  await p.screenshot({path:`${dir}/${name}-${scene}.jpg`,quality:94});
 }
 const before=await snap(p);row.rotations=[];
 for(const [w,h] of [[height,width],[width,height]]){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(300);const s=await snap(p);row.rotations.push({width:w,height:h,quality:s.quality,geometries:s.geometries,textures:s.textures,siteTextureBytes:s.site.textureBytes});}
 await p.evaluate(async()=>{
  const j=document.querySelector('#journey'),s=document.querySelector('#stage'),travel=j.offsetHeight-s.offsetHeight;
  for(const [from,to] of [[6.03,0],[0,6.03]])await new Promise(resolve=>{const start=performance.now();function tick(t){const u=Math.min(1,(t-start)/9000);scrollTo(0,(from+(to-from)*u)/6.08*travel);if(u<1)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});
 });
 const after=await snap(p);row.reversal={geometries:[before.geometries,after.geometries],textures:[before.textures,after.textures],siteTextureBytes:[before.site.textureBytes,after.site.textureBytes]};
 await p.locator('.skip-link').click();await p.waitForTimeout(200);await p.evaluate(()=>window.__experience.resetTiming());await p.waitForTimeout(200);row.offscreenFrames=(await snap(p)).frameIntervals.length;
 const video=p.video();await c.close();await video.saveAs(`${dir}/${name}-motion.webm`);await video.delete();
 await writeFile(`${dir}/measurements.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({name,quality:row.scenes[0].state.quality,resources:row.reversal,errors:row.errors,warnings:row.warnings}));
}
await browser.close();
