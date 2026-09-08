import {chromium} from '@playwright/test';import {writeFile,mkdir} from 'node:fs/promises';import {launchOptions} from './browser-options.mjs';
const browser=await chromium.launch(launchOptions),root='docs/experience/stage-four';await mkdir(root+'/captures',{recursive:true});
const views=[['desktop',1600,1000,1],['laptop',1280,720,1],['mobile',390,844,3],['intermediate',740,900,1],['short',1000,500,1]];
const frames=[['panel',2.24],['glass',2.36],['cell',2.52],['absorption',2.68],['collected',2.77],['contacts',2.88],['contact-handoff',3.085],['module-return',3.113],['dc-route',3.33],['inverter',3.70],['conversion',3.96]];
const selectedViews=process.env.EXPERIENCE_CAPTURE_VIEWS?.split(','),selectedFrames=process.env.EXPERIENCE_CAPTURE_FRAMES?.split(','),reports=[];
for(const[name,width,height,dpr]of views.filter(v=>!selectedViews||selectedViews.includes(v[0]))){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr}),messages=[];
 page.on('pageerror',e=>messages.push({type:'pageerror',text:e.message}));page.on('console',m=>{if(['error','warning'].includes(m.type()))messages.push({type:m.type(),text:m.text()});});
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4173/')?r.continue():r.abort());
 await page.goto('http://127.0.0.1:4173/experience?inspect=1');await page.waitForFunction(()=>window.__experience?.snapshot().ready||window.__experience?.snapshot().failed);
 const states=[];
 for(const[label,p]of frames.filter(f=>!selectedFrames||selectedFrames.includes(f[0]))){
  await page.evaluate(p=>{const j=document.querySelector('#journey');scrollTo(0,p/Number(j.dataset.duration)*(j.offsetHeight-innerHeight));},p);
  await page.waitForFunction(p=>{const s=window.__experience.snapshot();return s.failed||(s.siteStatus==='ready'&&(p<2.34||s.cellStatus==='ready')&&(p<3.05||s.electricalStatus==='ready'));},p);
  await page.waitForTimeout(450);await page.screenshot({path:root+'/captures/'+name+'-'+label+'.png'});
  states.push({label,...await page.evaluate(()=>window.__experience.snapshot()),copy:await page.locator('[data-copy]').evaluateAll(es=>es.map(e=>({text:e.textContent.trim(),opacity:getComputedStyle(e).opacity,rect:e.getBoundingClientRect().toJSON()})))});
 }
 await page.locator('.skip-link').click();await page.screenshot({path:root+'/captures/'+name+'-application.png'});reports.push({name,width,height,dpr,messages,states});await page.close();
}
await writeFile(root+'/capture-observations'+(selectedViews?'-'+selectedViews.join('-'):'')+(selectedFrames?'-'+selectedFrames.join('-'):'')+'.json',JSON.stringify({browser:browser.version(),recordedAt:new Date().toISOString(),reports},null,2));console.log(reports.map(r=>({name:r.name,messages:r.messages})));await browser.close();

