import {execFileSync} from 'node:child_process';
import {chromium} from '@playwright/test';import {writeFile,mkdir} from 'node:fs/promises';import {launchOptions} from './browser-options.mjs';
// Assemble the current source before launching the capture browser.
execFileSync('npm',['run','build'],{stdio:'inherit'});
const browser=await chromium.launch(launchOptions),root='docs/experience/stage-five';await mkdir(root+'/captures',{recursive:true});
const views=[['desktop',1600,1000,1],['laptop',1280,720,1],['mobile',390,844,3],['intermediate',740,900,1],['short',1000,500,1]];
const frames=[['ac-output',4.02],['operating-note',4.20],['facade-opening',4.30],['business',4.50],['screen',4.65],['business-hold',4.75],['storage-charge',5.07],['storage-later',5.33],['grid',5.53],['long-journey',5.73],['connection',5.86],['brand',6.03]];
const selectedViews=process.env.EXPERIENCE_CAPTURE_VIEWS?.split(','),selectedFrames=process.env.EXPERIENCE_CAPTURE_FRAMES?.split(','),reports=[];
for(const[name,width,height,dpr]of views.filter(v=>!selectedViews||selectedViews.includes(v[0]))){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr}),messages=[];
 page.on('pageerror',e=>messages.push({type:'pageerror',text:e.message}));page.on('console',m=>{if(['error','warning'].includes(m.type()))messages.push({type:m.type(),text:m.text()});});
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4173/')?r.continue():r.abort());
 await page.goto('http://127.0.0.1:4173/experience?inspect=1');await page.waitForFunction(()=>window.__experience?.snapshot().ready||window.__experience?.snapshot().failed);
 const states=[];
 for(const[label,p]of frames.filter(f=>!selectedFrames||selectedFrames.includes(f[0]))){
  await page.evaluate(p=>{const j=document.querySelector('#journey');scrollTo(0,p/Number(j.dataset.duration)*(j.offsetHeight-innerHeight));},p);
  await page.waitForFunction(p=>{const s=window.__experience.snapshot();return s.failed||(s.siteStatus==='ready'&&(p<2.34||s.cellStatus==='ready')&&(p<3.05||s.electricalStatus==='ready')&&(p<4.18||s.businessStatus==='ready')&&(p<4.96||s.storageStatus==='ready'));},p);
  await page.waitForTimeout(450);await page.screenshot({path:root+'/captures/'+name+'-'+label+'.png'});
  states.push({label,...await page.evaluate(()=>window.__experience.snapshot()),copy:await page.locator('[data-copy]').evaluateAll(es=>es.map(e=>({text:e.textContent.trim(),opacity:getComputedStyle(e).opacity,rect:e.getBoundingClientRect().toJSON()})))});
 }
 await page.locator('.skip-link').click();await page.screenshot({path:root+'/captures/'+name+'-application.png'});reports.push({name,width,height,dpr,messages,states});await page.close();
}
await writeFile(root+'/capture-observations'+(selectedViews?'-'+selectedViews.join('-'):'')+(selectedFrames?'-'+selectedFrames.join('-'):'')+'.json',JSON.stringify({browser:browser.version(),recordedAt:new Date().toISOString(),reports},null,2));console.log(reports.map(r=>({name:r.name,messages:r.messages})));await browser.close();

