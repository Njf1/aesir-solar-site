import {chromium} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
import {launchOptions} from './browser-options.mjs';
const browser=await chromium.launch(launchOptions),folder='docs/experience/stage-three';await mkdir(`${folder}/motion`,{recursive:true});
const reports=[];
const views=[['desktop',1600,1000,1],['laptop',1280,720,1],['mobile',390,844,3],['intermediate',740,900,1],['short',1000,500,1]];
const scroll=async(page,p)=>{await page.evaluate(p=>{const j=document.querySelector('#journey');scrollTo(0,p/Number(j.dataset.duration)*(j.offsetHeight-innerHeight));},p);await page.waitForTimeout(150);};
const clean=s=>{const{frameIntervals,...state}=s;return state;};
for(const [name,width,height,dpr]of views){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4173/')?r.continue():r.abort());
 await page.goto('http://127.0.0.1:4173/experience?inspect=1');await page.waitForFunction(()=>window.__experience?.snapshot().ready);
 const resources=()=>page.evaluate(()=>performance.getEntriesByType('resource').map(e=>({name:e.name.split('/').at(-1),encoded:e.encodedBodySize,decoded:e.decodedBodySize,transfer:e.transferSize,duration:e.duration})));
 const initial=await resources(),measures=[];
 for(const [label,p]of [['Sun',.36],['Earth',.935],['Region',1.4],['Building',1.74],['Panel',2.235]]){
  await scroll(page,p);await page.waitForFunction(p=>{const s=window.__experience.snapshot();return s.failed||(s.earthStatus==='ready'&&(p<1.235||s.regionStatus==='ready')&&(p<1.49||s.siteStatus==='ready'));},p);
  await page.waitForTimeout(500);await page.evaluate(()=>window.__experience.resetTiming());await page.waitForTimeout(4000);
  const snapshot=await page.evaluate(()=>window.__experience.snapshot()),frames=snapshot.frameIntervals.slice().sort((a,b)=>a-b);
  measures.push({label,state:clean(snapshot),samples:frames.length,mean:frames.reduce((a,b)=>a+b,0)/frames.length,p50:frames[Math.floor(frames.length*.5)],p95:frames[Math.floor(frames.length*.95)],p99:frames[Math.floor(frames.length*.99)],over33:frames.filter(n=>n>33.4).length});
 }
 const end=await resources(),motion=[];
 for(const [i,p]of [.735,.78,.86,.975,1.05,1.20,1.26,1.29,1.31,1.35,1.42,1.48,1.53,1.56,1.61,1.65,1.78,1.84,2.01,2.16,2.21,2.25,2.16,2.01,1.84,1.61,1.53,1.48,1.35,1.29,1.20,.975].entries()){
  await scroll(page,p);motion.push(clean(await page.evaluate(()=>window.__experience.snapshot())));
  if(['laptop','mobile'].includes(name))await page.screenshot({path:`${folder}/motion/${name}-${p.toString().replace('.','')}-${i>21?'reverse':'forward'}.png`});
 }
 const gpu=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),ex=gl.getExtension('WEBGL_debug_renderer_info');return ex?gl.getParameter(ex.UNMASKED_RENDERER_WEBGL):null;});
 reports.push({name,width,height,dpr,gpu,errors,initialResources:initial,finalResources:end,measures,motion});await page.close();console.log(name,measures.map(m=>({chapter:m.label,p50:m.p50,p95:m.p95})),errors);
}
await writeFile(`${folder}/verification.json`,JSON.stringify({browser:browser.version(),recordedAt:new Date().toISOString(),reports},null,2));
const summary=reports.map(r=>({viewport:`${r.width}×${r.height}`,gpu:r.gpu,errors:r.errors,chapters:r.measures.map(m=>({chapter:m.label,samples:m.samples,p50:m.p50,p95:m.p95,drawCalls:m.state.drawCalls,triangles:m.state.triangles,geometries:m.state.geometries,textures:m.state.textures,shadowEstimatedBytes:m.state.shadowEstimatedBytes}))}));
await writeFile(`${folder}/performance-summary.json`,JSON.stringify(summary,null,2));await browser.close();
