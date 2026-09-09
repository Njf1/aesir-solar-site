import {chromium,webkit} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {launchOptions} from './browser-options.mjs';
const phase=process.env.FOOTER_PHASE||'before',origin=process.env.FOOTER_ORIGIN||'http://127.0.0.1:4173';
const engine=process.env.FOOTER_ENGINE||'chromium';
const dir=`docs/experience/mobile-footer/${phase}${engine==='webkit'?'-webkit':''}`;await mkdir(dir,{recursive:true});
const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{headless:true}:launchOptions);
const context=await browser.newContext({viewport:{width:390,height:719},isMobile:true,hasTouch:true,recordVideo:{dir,size:{width:390,height:844}}});
const page=await context.newPage(),cdp=engine==='chromium'?await context.newCDPSession(page):null,errors=[],rows=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin&&!u.pathname.startsWith('/api/')&&r.request().method()==='GET'?r.continue():r.abort();});
await page.goto(origin+'/?inspect=1');await page.waitForFunction(()=>window.__experience?.snapshot().ready);
await page.waitForTimeout(900);
async function sample(name,changes){
 await page.evaluate(()=>{
  window.__footerFrames=[];window.__footerSampling=true;
  const frame=t=>{
   if(!window.__footerSampling)return;
   const f=document.querySelector('.chapter-footer').getBoundingClientRect(),s=document.querySelector('#stage').getBoundingClientRect(),c=document.querySelector('canvas').getBoundingClientRect();
   window.__footerFrames.push({t,y:f.top-s.top,bottom:f.bottom,stage:s.height,canvasGap:s.bottom-c.bottom,title:document.querySelector('h1').getBoundingClientRect().top,scroll:scrollY});requestAnimationFrame(frame);
  };requestAnimationFrame(frame);
 });
 await page.waitForTimeout(100);
 for(const [height,delay] of changes){
  await page.setViewportSize({width:390,height});await cdp?.send('Emulation.setSmallViewportHeightDifferenceOverride',{difference:height-719});
  await page.waitForTimeout(delay);
 }
 await page.waitForTimeout(650);
 const frames=await page.evaluate(()=>{window.__footerSampling=false;return window.__footerFrames;});
 rows.push({name,frames});await page.screenshot({path:`${dir}/${name}.png`});
}
await sample('bars-retract',[[844,0]]);
await sample('bars-return',[[719,0]]);
await sample('gradual-retract',[[744,70],[769,70],[794,70],[819,70],[844,70]]);
await sample('rapid-reversal',[[794,70],[844,70],[769,70],[819,70],[719,70]]);
await page.evaluate(()=>{const j=document.querySelector('#journey'),s=document.querySelector('#stage');scrollTo(0,.235/6.08*(j.offsetHeight-s.offsetHeight));});
await page.waitForFunction(()=>Math.abs(window.__experience.snapshot().renderedProgress-.235)<.003);
await sample('sun-retract',[[844,0]]);await sample('sun-return',[[719,0]]);
const video=page.video();await context.close();await video.saveAs(`${dir}/toolbar-and-scroll.webm`);await video.delete();
const summaries=rows.map(({name,frames})=>({name,first:frames[0]?.y,last:frames.at(-1)?.y,maxStep:Math.max(...frames.slice(1).map((f,i)=>Math.abs(f.y-frames[i].y))),maxCanvasGap:Math.max(...frames.map(f=>Math.abs(f.canvasGap))),bottomOverrun:Math.max(...frames.map(f=>Math.max(0,f.bottom-f.stage))),intermediatePositions:new Set(frames.map(f=>Math.round(f.y))).size}));
await writeFile(`${dir}/measurements.json`,JSON.stringify({engine,browser:browser.version(),origin,method:'Desktop mobile viewport emulation; abrupt and progressive height updates. Chromium alone uses CDP stable small viewport override; this is not a physical mobile browser toolbar.',errors,summaries,rows},null,2));
await browser.close();console.log(JSON.stringify(summaries,null,2));
