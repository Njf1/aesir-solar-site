import {chromium,webkit} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {launchOptions} from './browser-options.mjs';
import assert from 'node:assert/strict';
const phase=process.env.CONTROLS_PHASE||'before',origin=process.env.CONTROLS_ORIGIN||'http://127.0.0.1:4173';
const root=`docs/experience/mobile-controls/${phase}`;await mkdir(root,{recursive:true});
const results=[];
for(const engine of [chromium,webkit]){
 const browser=await engine.launch(engine===chromium?launchOptions:{headless:true});
 for(const [width,height] of [[390,844],[375,667]]){
  const name=`${engine.name()}-${width}x${height}`,context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:2,recordVideo:{dir:root,size:{width,height}}});
  const page=await context.newPage(),errors=[],warnings=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='warning')warnings.push(m.text());});
  await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin!==origin||u.pathname.startsWith('/api/')||r.request().method()!=='GET'?r.abort():r.continue();});
  await page.goto(`${origin}/?inspect=1`);
  await page.waitForFunction(()=>window.__experience?.snapshot().ready||window.__experience?.snapshot().failed);
  const frames=[];
  for(const p of [0,.295,.9,1.4,.9]){
   await page.evaluate(p=>{const j=document.querySelector('#journey'),s=document.querySelector('#stage');scrollTo(0,p/6.08*(j.offsetHeight-s.offsetHeight));},p);
   await page.waitForFunction(p=>Math.abs(window.__experience.snapshot().renderedProgress-p)<.004,p,{timeout:30000});
   await page.waitForTimeout(500);
   const state=await page.evaluate(()=>{
    const read=selector=>{const e=document.querySelector(selector),s=getComputedStyle(e),b=e.getBoundingClientRect(),r=document.createRange();r.selectNodeContents(e);return {font:s.fontSize,textAdjust:s.getPropertyValue('-webkit-text-size-adjust'),background:s.backgroundColor,rect:b.toJSON(),content:[...r.getClientRects()].map(r=>r.toJSON())};};
    const bottom=document.querySelector('.skip-link').getBoundingClientRect().bottom;
    return {skip:read('.skip-link'),apply:read('.apply-link'),heading:read('[data-copy="1"] h2'),copyGaps:[...document.querySelectorAll('[data-copy]')].filter(e=>Number(getComputedStyle(e).opacity)>.15).map(e=>e.getBoundingClientRect().top-bottom),framing:document.body.dataset.framing,snapshot:window.__experience.snapshot()};
   });
   if(phase!=='before'){assert.equal(state.skip.background,'rgba(0, 0, 0, 0)');assert.ok(state.skip.rect.height>=44);assert.ok(state.copyGaps.every(g=>g>=10));}
   frames.push({p,...state});await page.screenshot({path:`${root}/${name}-${p.toFixed(3)}.png`});
  }
  await page.locator('.skip-link').click();await page.locator('.editorial-footer').scrollIntoViewIfNeeded();await page.screenshot({path:`${root}/${name}-footer.png`});
  if(phase!=='before'){
   await page.locator('.image-credit a').click();await page.screenshot({path:`${root}/${name}-credits.png`});
   await page.goBack();await page.waitForFunction(()=>window.__experience?.snapshot().ready);
   await page.evaluate(()=>{const nodes=[...document.querySelectorAll('h1,h2,h3,p,button,a,li')],sizes=nodes.map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);for(const [e,size] of sizes)e.style.fontSize=`${size*2}px`;});
   await page.evaluate(()=>{const j=document.querySelector('#journey'),s=document.querySelector('#stage');scrollTo(0,1.4/6.08*(j.offsetHeight-s.offsetHeight));});
   await page.waitForFunction(()=>Math.abs(window.__experience.snapshot().renderedProgress-1.4)<.004);await page.waitForTimeout(300);
   await page.screenshot({path:`${root}/${name}-200percent.png`});
  }
  const video=page.video();await context.close();await video.saveAs(`${root}/${name}.webm`);await video.delete();
  assert.deepEqual(errors,[]);assert.deepEqual(warnings,[]);results.push({engine:engine.name(),version:browser.version(),width,height,errors,warnings,frames});
 }
 await browser.close();
}
await writeFile(`${root}/observations.json`,JSON.stringify({phase,origin,method:'Playwright mobile-input contexts on macOS Chromium/WebKit, not physical phones',results},null,2));
console.log(JSON.stringify(results.map(r=>({engine:r.engine,width:r.width,errors:r.errors,warnings:r.warnings,skip:r.frames[0].skip})),null,2));
