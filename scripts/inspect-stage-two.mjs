import {chromium}from'@playwright/test';import{writeFile,mkdir}from'node:fs/promises';import{launchOptions}from'./browser-options.mjs';
const browser=await chromium.launch(launchOptions),root='docs/experience/stage-two';await mkdir(`${root}/captures`,{recursive:true});
const results=[];
// A 1280x720 display at 200% browser zoom exposes a 640x360 CSS viewport.
for(const [name,width,height,dpr] of [['zoom-200',640,360,2],['text-200',1280,720,1]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr});
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4173/')?r.continue():r.abort());
 await page.goto('http://127.0.0.1:4173/experience?inspect=1');await page.waitForFunction(()=>window.__experience?.snapshot().ready);
 if(name==='text-200')await page.evaluate(()=>{for(const e of document.querySelectorAll('h1,h2,h3,p,button,a,li'))e.style.fontSize=`${parseFloat(getComputedStyle(e).fontSize)*2}px`;});
 const states=[];
 for(const [label,p]of [['opening',0],['sun',.24],['flight',.55],['earth',.935]]){
  await page.evaluate(p=>{const j=document.querySelector('#journey');scrollTo(0,p*(j.offsetHeight-innerHeight));},p);if(p>.16)await page.waitForFunction(()=>window.__experience.snapshot().earthStatus==='ready');await page.waitForTimeout(200);
  await page.screenshot({path:`${root}/captures/${name}-${label}.png`});
  states.push(await page.evaluate(()=>({progress:window.__experience.snapshot().progress,framing:document.body.dataset.framing,width:document.documentElement.scrollWidth,viewport:innerWidth,visible:[...document.querySelectorAll('[data-copy]')].filter(e=>parseFloat(e.style.opacity)>.15).map(e=>({text:e.textContent,rect:e.getBoundingClientRect().toJSON()}))})));
 }
 await page.locator('.skip-link').click();await page.screenshot({path:`${root}/captures/${name}-application.png`});
 results.push({name,width,height,dpr,states});await page.close();
}
await writeFile(`${root}/zoom-observations.json`,JSON.stringify(results,null,2));
const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:`${root}/motion`,size:{width:1280,height:720}}});
const page=await context.newPage();await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4173/')?r.continue():r.abort());
await page.goto('http://127.0.0.1:4173/experience?inspect=1');await page.waitForFunction(()=>window.__experience?.snapshot().ready);await page.waitForTimeout(600);
for(const [from,to,duration]of [[0,1,16000],[1,.30,10000],[.30,.95,9500]]){
 await page.evaluate(async({from,to,duration})=>{const j=document.querySelector('#journey'),distance=j.offsetHeight-innerHeight;await new Promise(resolve=>{const start=performance.now();function frame(now){const t=Math.min(1,(now-start)/duration);scrollTo(0,(from+(to-from)*t)*distance);if(t<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});},{from,to,duration});await page.waitForTimeout(600);
}
await page.locator('.skip-link').click();await page.waitForTimeout(1000);const video=page.video();await context.close();await video.saveAs(`${root}/motion/journey-forward-reverse.webm`);const original=await video.path();if(!original.endsWith('journey-forward-reverse.webm'))await import('node:fs/promises').then(fs=>fs.unlink(original));
await browser.close();console.log(results);
