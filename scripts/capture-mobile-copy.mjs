import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {launchOptions} from './browser-options.mjs';
const phase=process.env.COPY_PHASE||'before',origin=process.env.COPY_ORIGIN||'http://127.0.0.1:4173';
const dir=`docs/experience/mobile-copy/${phase}`;await mkdir(dir,{recursive:true});
const browser=await chromium.launch(launchOptions);
const context=await browser.newContext({viewport:{width:390,height:719},isMobile:true,hasTouch:true,recordVideo:{dir,size:{width:390,height:844}}});
const page=await context.newPage(),cdp=await context.newCDPSession(page),rows=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin&&!u.pathname.startsWith('/api/')&&r.request().method()==='GET'?r.continue():r.abort();});
await page.goto(origin+'/?inspect=1');await page.waitForFunction(()=>window.__experience?.snapshot().ready);
async function record(name){
 await page.waitForTimeout(200);
 rows.push(await page.evaluate(name=>{
  const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom}};
  return {name,height:innerHeight,copy:rect('.copy-opening'),eyebrow:rect('.copy-opening .eyebrow'),title:rect('.copy-opening h1'),skip:rect('.skip-link'),canvas:rect('canvas'),opacity:getComputedStyle(document.querySelector('.copy-opening')).opacity,progress:window.__experience.snapshot().renderedProgress};
 },name));
 await page.screenshot({path:`${dir}/${name}.png`});
}
await record('bars-open');
for(const height of [744,769,794,819,844,819,794,769,744,719]){
 await page.setViewportSize({width:390,height});await cdp.send('Emulation.setSmallViewportHeightDifferenceOverride',{difference:height-719});
 await record('height-'+height+(rows.some(r=>r.name==='height-'+height)?'-reverse':''));
}
for(const p of [.06,.11,.135,.15,.135,.11,.06]){
 await page.evaluate(p=>{const j=document.querySelector('#journey'),s=document.querySelector('#stage');scrollTo(0,p/6.08*(j.offsetHeight-s.offsetHeight));},p);
 await page.waitForFunction(p=>Math.abs(window.__experience.snapshot().renderedProgress-p)<.003,p);
 await record('progress-'+p+(rows.some(r=>r.name==='progress-'+p)?'-reverse':''));
}
const video=page.video();await context.close();await video.saveAs(`${dir}/toolbar-and-scroll.webm`);await video.delete();
await writeFile(`${dir}/measurements.json`,JSON.stringify({browser:browser.version(),origin,method:'Desktop Chromium mobile emulation; toolbar height uses CDP small-viewport override',errors,rows},null,2));
await browser.close();console.log(JSON.stringify(rows.map(r=>({name:r.name,top:r.copy.top,opacity:r.opacity,canvasGap:r.height-r.canvas.bottom})),null,2));
