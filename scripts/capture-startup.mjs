import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {launchOptions} from './browser-options.mjs';
import assert from 'node:assert/strict';
const phase=process.env.STARTUP_PHASE||'before';
const base=process.env.STARTUP_URL||'http://127.0.0.1:4173';
const out=`docs/experience/startup-flash/${phase}`;
await mkdir(out,{recursive:true});
const browser=await chromium.launch(launchOptions),reports=[];
for(const [name,width,height] of [['laptop',1280,720],['mobile',390,844]]){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,recordVideo:{dir:out,size:{width,height}}});
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 let release;const gate=new Promise(resolve=>release=resolve);
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!==base||url.pathname.startsWith('/api/')||!['GET','HEAD'].includes(route.request().method()))return route.abort();
  if(/\/scene-[^/]+\.js$/.test(url.pathname))await gate;
  await route.continue();
 });
 await page.goto(`${base}/?inspect=1`,{waitUntil:'domcontentloaded'});
 await page.locator('.scene-fallback img').evaluate(img=>img.decode());
 await page.waitForTimeout(400);
 await page.screenshot({path:`${out}/${name}-loading.png`});
 const loading=await page.locator('.scene-fallback img').evaluate(e=>({src:e.currentSrc,width:e.naturalWidth,height:e.naturalHeight,visibility:getComputedStyle(e).visibility,canvasVisible:getComputedStyle(document.querySelector('#canvas-host')).opacity}));
 assert.equal(loading.visibility,phase==='before'?'visible':'hidden');assert.equal(loading.canvasVisible,'0');
 release();await page.waitForFunction(()=>window.__experience?.snapshot().ready);
 await page.waitForTimeout(800);
 await page.screenshot({path:`${out}/${name}-ready.png`});
 const opening=await page.evaluate(()=>window.__experience.snapshot());
 assert.equal(opening.renderedProgress,0);assert.ok(opening.shot.camera[2]>1199);assert.deepEqual(errors,[]);
 await page.evaluate(()=>{const j=document.querySelector('#journey');scrollTo(0,.15/6.08*(j.offsetHeight-innerHeight));});await page.waitForTimeout(600);
 await page.screenshot({path:`${out}/${name}-approach.png`});
 await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(600);
 const returns=[];
 if(phase!=='before'){
  const start=performance.now();await page.reload();await page.waitForFunction(()=>window.__experience?.snapshot().ready);
  returns.push({kind:'reload',readyMs:performance.now()-start,progress:await page.evaluate(()=>window.__experience.snapshot().renderedProgress)});
  await page.locator('header .apply-link').click();await page.waitForURL(/\/apply(?:\.html)?$/);
  assert.equal(await page.locator('#applyForm [name]').count(),19);assert.equal(await page.locator('canvas').count(),0);
  await page.goBack();await page.waitForFunction(()=>window.__experience?.snapshot().ready);
  returns.push({kind:'Back',progress:await page.evaluate(()=>window.__experience.snapshot().renderedProgress)});
  assert.ok(returns.every(r=>r.progress===0));assert.equal(await page.locator('.scene-fallback img').isVisible(),false);
 }
 const video=page.video();await context.close();await video.saveAs(`${out}/${name}-load-approach.webm`);await video.delete();
 reports.push({name,viewport:{width,height},loading,opening,returns,errors});
}
await writeFile(`${out}/observations.json`,JSON.stringify({base,phase,browser:browser.version(),sceneImportHeld:true,reports},null,2));
await browser.close();
console.log(JSON.stringify(reports.map(({name,loading,errors})=>({name,loading,errors})),null,2));
