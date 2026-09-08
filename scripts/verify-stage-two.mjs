import {chromium} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
import {launchOptions} from './browser-options.mjs';
const browser=await chromium.launch(launchOptions);
const folder='docs/experience/stage-two';await mkdir(`${folder}/motion`,{recursive:true});
const reports=[];
const views=[['desktop',1600,1000,1],['laptop',1280,720,1],['mobile',390,844,3],['intermediate',740,900,1],['short',1000,500,1]];
const scroll=async(page,p)=>{await page.evaluate(p=>{const j=document.querySelector('#journey');scrollTo(0,p*(j.offsetHeight-innerHeight));},p);await page.waitForTimeout(150);};
const clean=s=>{const{frameIntervals,...state}=s;return state;};
for(const [name,width,height,dpr]of views){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4173/')?r.continue():r.abort());
 await page.goto('http://127.0.0.1:4173/experience?inspect=1');await page.waitForFunction(()=>window.__experience?.snapshot().ready);
 const resources=()=>page.evaluate(()=>performance.getEntriesByType('resource').map(e=>({name:e.name.split('/').at(-1),encoded:e.encodedBodySize,decoded:e.decodedBodySize,transfer:e.transferSize,duration:e.duration})));
 const initial=await resources();const measures=[];
 for(const [label,p]of [['Sun',.36],['Earth',.935]]){
  await scroll(page,p);await page.waitForFunction(()=>window.__experience.snapshot().earthStatus==='ready');await page.waitForTimeout(350);await page.evaluate(()=>window.__experience.resetTiming());await page.waitForTimeout(4000);
  const snapshot=await page.evaluate(()=>window.__experience.snapshot()),frames=snapshot.frameIntervals.slice().sort((a,b)=>a-b);
  measures.push({label,state:clean(snapshot),samples:frames.length,mean:frames.reduce((a,b)=>a+b,0)/frames.length,p50:frames[Math.floor(frames.length*.5)],p95:frames[Math.floor(frames.length*.95)],p99:frames[Math.floor(frames.length*.99)],over33:frames.filter(n=>n>33.4).length});
 }
 const end=await resources();const motion=[];
 for(const p of [.32,.385,.405,.435,.465,.485,.515,.605,.62,.69,.734,.736,.751,.785,.86,.89,.975,.89,.751,.734,.605,.485,.435,.32]){
  await scroll(page,p);const state=clean(await page.evaluate(()=>window.__experience.snapshot()));
  motion.push(state);
  if(['desktop','mobile'].includes(name))await page.screenshot({path:`${folder}/motion/${name}-${p.toString().replace('.','')}-${motion.length>17?'reverse':'forward'}.png`});
 }
 const gpu=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),ex=gl.getExtension('WEBGL_debug_renderer_info');return ex?gl.getParameter(ex.UNMASKED_RENDERER_WEBGL):null;});
 reports.push({name,width,height,dpr,gpu,errors,initialResources:initial,finalResources:end,measures,motion});await page.close();console.log(name,measures.map(m=>({chapter:m.label,p50:m.p50,p95:m.p95})),errors);
}
await writeFile(`${folder}/verification.json`,JSON.stringify({browser:browser.version(),recordedAt:new Date().toISOString(),reports},null,2));await browser.close();
