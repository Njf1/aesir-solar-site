import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { launchOptions } from './browser-options.mjs';
const browser=await chromium.launch(launchOptions);
const reports=[];
for(const [name,viewport] of [['desktop',{width:1600,height:1000}],['mobile',{width:390,height:844}]]){
 const page=await browser.newPage({viewport,deviceScaleFactor:name==='mobile'?3:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:4173/')?route.continue():route.abort());
 await page.goto('http://127.0.0.1:4173/experience?inspect=1');
 await page.waitForFunction(()=>window.__experience?.snapshot().ready||window.__experience?.snapshot().failed);
 const states=[];
 for(const [chapter,progress] of [['opening',0],['sun',.68],['departure',.98]]){
  await page.evaluate(p=>{const j=document.querySelector('#journey');window.scrollTo(0,p*(j.offsetHeight-innerHeight));},progress);
  await page.waitForTimeout(900);
  await page.evaluate(()=>window.__experience.resetTiming());
  await page.waitForTimeout(4000);
  await page.screenshot({path:`docs/experience/captures/${name}-${chapter}.png`});
  states.push({chapter,...await page.evaluate(()=>window.__experience.snapshot())});
  if(chapter==='sun' && process.argv.includes('--write-posters')){
    const data=await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>resolve(document.querySelector('canvas').toDataURL('image/webp',.86)))));
    await writeFile(name==='desktop'?'experience-poster.webp':'experience-poster-mobile.webp',Buffer.from(data.split(',')[1],'base64'));
  }
 }
 const gpu=await page.evaluate(()=>{const gl=document.querySelector('canvas')?.getContext('webgl2');const ext=gl?.getExtension('WEBGL_debug_renderer_info');return ext?{vendor:gl.getParameter(ext.UNMASKED_VENDOR_WEBGL),renderer:gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)}:null;});
 reports.push({name,viewport,gpu,errors,states});await page.close();
}
await writeFile('docs/experience/capture-observations.json',JSON.stringify({browser:browser.version(),reports},null,2));
await browser.close();
console.log(JSON.stringify(reports.map(r=>({name:r.name,errors:r.errors,states:r.states.map(s=>({chapter:s.chapter,ready:s.ready,failed:s.failed,progress:s.progress,quality:s.quality}))})),null,2));
