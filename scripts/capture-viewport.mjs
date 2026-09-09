import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {launchOptions} from './browser-options.mjs';
import assert from 'node:assert/strict';
const phase=process.env.VIEWPORT_PHASE||'before',origin=process.env.VIEWPORT_ORIGIN||'http://127.0.0.1:4173';
const root=`docs/experience/mobile-viewport/${phase}`;await mkdir(root,{recursive:true});
const browser=await chromium.launch(launchOptions),results=[];
for(const [name,width,height,difference] of [['phone',390,780,125],['tall-phone',412,915,160]]){
 const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1,recordVideo:{dir:root,size:{width,height}}});
 const page=await context.newPage(),cdp=await context.newCDPSession(page),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 let release;const gate=new Promise(resolve=>release=resolve);
 await page.route('**/*',async r=>{const u=new URL(r.request().url());if(u.origin!==origin||u.pathname.startsWith('/api/'))return r.abort();if(/\/scene-[^/]+\.js$/.test(u.pathname))await gate;await r.continue();});
 await page.goto(`${origin}/?inspect=1`,{waitUntil:'domcontentloaded'});
 // Navigation resets this frame-scoped override; apply it to the loaded document.
 await cdp.send('Emulation.setSmallViewportHeightDifferenceOverride',{difference});
 release();await page.waitForFunction(()=>window.__experience?.snapshot().ready);await page.waitForTimeout(350);
 const frames=[];
 const points=[0,.15,.295,.315,.36,.295,...(phase==='before'?[]:[.925,2.21,2.68,4.60,6.03])];
 for(const p of points){
  await page.evaluate(p=>{const j=document.querySelector('#journey'),s=document.querySelector('#stage');scrollTo(0,p/6.08*(j.offsetHeight-s.offsetHeight));},p);
  if(phase!=='before')await page.waitForFunction(p=>Math.abs(window.__experience.snapshot().renderedProgress-p)<.003,p,{timeout:30000});
  await page.waitForTimeout(550);
  const state=await page.evaluate(()=>{const rect=id=>{const b=document.querySelector(id).getBoundingClientRect();return {top:b.top,bottom:b.bottom,width:b.width,height:b.height};};return {viewport:{width:innerWidth,height:innerHeight,visualHeight:visualViewport.height},stage:rect('#stage'),canvas:rect('canvas'),footer:rect('.chapter-footer'),snapshot:window.__experience.snapshot()};});
  if(phase!=='before'){assert.ok(Math.abs(state.viewport.height-state.stage.bottom)<=1);assert.ok(Math.abs(state.canvas.bottom-state.stage.bottom)<=1);}
  frames.push({p,...state});await page.screenshot({path:`${root}/${name}-${p.toFixed(3)}.png`});
 }
 const video=page.video();await context.close();await video.saveAs(`${root}/${name}.webm`);await video.delete();
 results.push({name,width,height,difference,errors,frames});
}
await writeFile(`${root}/observations.json`,JSON.stringify({browser:browser.version(),origin,phase,method:'CDP small/large viewport difference with mobile input emulation',results},null,2));
await browser.close();console.log(JSON.stringify(results.map(r=>({name:r.name,errors:r.errors,frames:r.frames.map(f=>({p:f.p,actual:f.snapshot.renderedProgress,viewport:f.viewport.height,stage:f.stage.height,gap:f.viewport.height-f.stage.bottom}))})),null,2));
