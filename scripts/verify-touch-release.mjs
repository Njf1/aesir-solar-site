import {webkit} from '@playwright/test';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const origin=process.env.SAFARI_ORIGIN||'https://aesirsolar.co.uk',dir='docs/experience/safari-performance/production';
await mkdir(dir,{recursive:true});
const sizes=JSON.parse(await readFile('docs/experience/asset-sizes.json','utf8'));
const html=await (await fetch(origin)).text(),report={date:new Date().toISOString(),origin,method:'Desktop WebKit touch emulation, controlled eight-core report; no physical-device or payment test.',assets:[],views:[]};
for(const f of sizes.files.filter(f=>/^(experience-.*\.(js|css)|scene-.*\.js)$/.test(f.file))){
 if(f.file.startsWith('experience-'))assert.ok(html.includes(f.file));
 const r=await fetch(`${origin}/experience-assets/${f.file}`);assert.equal(r.status,200);
 const hash=createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex');assert.equal(hash,f.sha256);
 report.assets.push({file:f.file,sha256:hash});
}
const browser=await webkit.launch({headless:true});report.browser=browser.version();
for(const [name,width,height] of [['tablet',820,1180],['phone',390,844]]){
 const c=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,isMobile:true,hasTouch:true}),p=await c.newPage(),row={name,errors:[],warnings:[]};report.views.push(row);
 await p.addInitScript(()=>Object.defineProperty(navigator,'hardwareConcurrency',{value:8,configurable:true}));
 await p.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin&&!u.pathname.startsWith('/api/')&&r.request().method()==='GET'?r.continue():r.abort();});
 p.on('pageerror',e=>row.errors.push(e.message));p.on('console',m=>{if(m.type()==='warning')row.warnings.push(m.text());});
 await p.goto(origin+'/?inspect=1');await p.waitForFunction(()=>window.__experience?.snapshot().ready);
 const snapshot=()=>p.evaluate(()=>window.__experience.snapshot());
 row.initialQuality=(await snapshot()).quality;assert.equal(row.initialQuality.tier,'mobile');
 await p.evaluate(()=>{const j=document.querySelector('#journey'),s=document.querySelector('#stage');scrollTo(0,.925/6.08*(j.offsetHeight-s.offsetHeight));});
 await p.waitForFunction(()=>Math.abs(window.__experience.snapshot().renderedProgress-.925)<.003);
 row.earth=(await snapshot()).earth;assert.equal(row.earth.variant,'mobile');
 await p.screenshot({path:`${dir}/${name}-earth.jpg`,quality:94});
 await p.setViewportSize({width:height,height:width});await p.waitForFunction(w=>window.__experience.snapshot().quality.width===w,height);
 row.rotatedQuality=(await snapshot()).quality;assert.equal(row.rotatedQuality.tier,'mobile');
 await p.locator('.skip-link').click();assert.equal(await p.locator('#application-details').evaluate(el=>document.activeElement===el),true);
 await p.waitForTimeout(250);await p.evaluate(()=>window.__experience.resetTiming());await p.waitForTimeout(250);
 row.offscreenFrames=(await snapshot()).frameIntervals.length;assert.equal(row.offscreenFrames,0);assert.deepEqual(row.errors,[]);assert.deepEqual(row.warnings,[]);
 await c.close();
}
await browser.close();await writeFile(`${dir}/verification.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
