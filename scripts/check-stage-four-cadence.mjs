import {chromium} from '@playwright/test';
import {launchOptions} from './browser-options.mjs';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch(launchOptions);
const page=await browser.newPage({viewport:{width:740,height:900},deviceScaleFactor:1});
const report={recordedAt:new Date().toISOString(),browser:browser.version(),viewport:'740×900',purpose:'Independent repeat of uniform 30 fps cadence in the full suite. Fresh browser, unchanged application.',errors:[],warnings:[],measures:[]};
page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='warning')report.warnings.push(m.text());if(m.type()==='error')report.errors.push(m.text());});
async function raw(label){const frames=await page.evaluate(()=>new Promise(resolve=>{const v=[];let start=0,last=0;function f(t){if(!start)start=t;if(last)v.push(t-last);last=t;if(t-start<4000)requestAnimationFrame(f);else resolve(v);}requestAnimationFrame(f);}));frames.sort((a,b)=>a-b);return {label,samples:frames.length,p50:frames[Math.floor(frames.length*.5)],p95:frames[Math.floor(frames.length*.95)]};}
try {
report.blankBefore=await raw('Empty document before');
await page.goto('http://127.0.0.1:4173/experience?inspect=1');
await page.waitForFunction(()=>window.__experience?.snapshot().ready);
report.environment=await page.evaluate(()=>({visibility:document.visibilityState,cores:navigator.hardwareConcurrency,dpr:devicePixelRatio,userAgent:navigator.userAgent}));
for(const [label,p] of [['Sun',.36],['Earth',.935],['Panel',2.235],['Cell absorption',2.68],['Contacts',2.88],['DC route',3.33],['Inverter',3.96]]) {
await page.evaluate(p=>{const j=document.querySelector('#journey');scrollTo(0,j.getBoundingClientRect().top+scrollY+p/Number(j.dataset.duration)*(j.offsetHeight-innerHeight));},p);
await page.waitForFunction(p=>{const s=window.__experience?.snapshot();return s?.ready&&Math.abs(s.progress-p)<.003&&(p<=2.34||s.cellStatus==='ready')&&(p<=3.05||s.electricalStatus==='ready');},p);
await page.waitForTimeout(600);await page.evaluate(()=>window.__experience.resetTiming());
const rawFrames=await raw(label),state=await page.evaluate(()=>window.__experience.snapshot());
const frames=state.frameIntervals.sort((a,b)=>a-b);delete state.frameIntervals;
report.measures.push({...rawFrames,appP50:frames[Math.floor(frames.length*.5)],appP95:frames[Math.floor(frames.length*.95)],state});console.log(label,rawFrames.p50,rawFrames.p95);
}
await page.locator('#pause-motion').click();report.paused=await raw('Scene paused');
await page.goto('about:blank');report.blankAfter=await raw('Empty document after');
await writeFile('docs/experience/stage-four/cadence-repeat.json',JSON.stringify(report,null,2));
console.log({blankBefore:report.blankBefore,paused:report.paused,blankAfter:report.blankAfter,errors:report.errors,warnings:report.warnings});
}finally{await browser.close();}
