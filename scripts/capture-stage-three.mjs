import {chromium} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
import {launchOptions} from './browser-options.mjs';
const browser=await chromium.launch(launchOptions);
const folder='docs/experience/stage-three/captures';await mkdir(folder,{recursive:true});
const viewports=[['desktop',{width:1600,height:1000}],['laptop',{width:1280,height:720}],['mobile',{width:390,height:844}],['intermediate',{width:740,height:900}],['short',{width:1000,height:500}]];
const frames=[['earth-hold',.935],['orbit',1.13],['britain-globe',1.235],['cloud-to-region',1.30],['britain-region',1.385],['regional-descent',1.455],['atmosphere',1.59],['site-reveal',1.73],['array',1.95],['panel-approach',2.10],['panel',2.24]];
const subset=process.env.EXPERIENCE_CAPTURE_VIEWS?.split(',');const reports=[];
for(const [name,viewport] of viewports.filter(v=>!subset||subset.includes(v[0]))) {
 const page=await browser.newPage({viewport,deviceScaleFactor:name==='mobile'?3:1});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4173/')?r.continue():r.abort());
 await page.goto('http://127.0.0.1:4173/experience?inspect=1');await page.waitForFunction(()=>window.__experience?.snapshot().ready||window.__experience?.snapshot().failed);
 const states=[];
 for(const [label,p] of frames) {
  await page.evaluate(p=>{const j=document.querySelector('#journey');window.scrollTo(0,p/Number(j.dataset.duration)*(j.offsetHeight-innerHeight));},p);
  await page.waitForFunction(p=>{const s=window.__experience?.snapshot();return s?.failed||(s?.earthStatus==='ready'&&(p<1.235||s?.regionStatus==='ready')&&(p<1.49||s?.siteStatus==='ready'));},p);
  await page.waitForTimeout(500);await page.screenshot({path:`${folder}/${name}-${label}.png`});
  states.push({label,...await page.evaluate(()=>window.__experience.snapshot()),copy:await page.locator('[data-copy]').evaluateAll(es=>es.map(e=>({text:e.textContent.trim(),opacity:getComputedStyle(e).opacity,rect:e.getBoundingClientRect().toJSON()})))});
 }
 await page.locator('.skip-link').click();await page.screenshot({path:`${folder}/${name}-application.png`});
 const gpu=await page.evaluate(()=>{const gl=document.querySelector('canvas')?.getContext('webgl2');const ext=gl?.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null;});
 reports.push({name,viewport,errors,gpu,states});await page.close();
}
await writeFile(`docs/experience/stage-three/capture-observations${subset?'-'+subset.join('-'):''}.json`,JSON.stringify({browser:browser.version(),reports},null,2));await browser.close();console.log(reports.map(r=>({name:r.name,errors:r.errors,states:r.states.map(s=>({frame:s.label,progress:s.progress,scene:s.shot?.scene,failed:s.failed,trailHeadError:s.trailHeadError}))})));
