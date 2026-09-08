import {chromium} from '@playwright/test';
import {writeFile, mkdir} from 'node:fs/promises';
import os from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {launchOptions} from './browser-options.mjs';

// Copy to scripts/ and run from the experience project. No production/provider
// requests are permitted. Cold owner readiness and settled RAF timing are separate.
const origin=new URL(process.env.EXPERIENCE_ORIGIN||'http://127.0.0.1:4173').origin;
const folder='docs/experience/stage-five';
const views=[['desktop',1600,1000,1],['laptop',1280,720,1],['mobile',390,844,3],['intermediate',740,900,1],['short',1000,500,1]];
const holds=[['Sun',.36],['Earth',.935],['Panel',2.235],['Cell absorption',2.68],['Inverter',3.96],['Business',4.70],['Storage',5.09],['Later',5.33],['Grid',5.53],['Brand',6.03]];
const ownerSteps=[['earth',.18],['region',.90],['site',1.40],['cell',2.10],['electrical',2.86],['business',4.06],['storage',4.72]];
const ownerNames=ownerSteps.map(([name])=>name);
// Visibility/variant warmup includes both sides of new joins, active collection,
// interior lights/screens, stored energy, dusk, grid flow and final brand framing.
const checkpoints=[.36,.935,1.40,1.76,2.235,2.68,2.88,3.33,3.96,4.08,4.175,4.185,4.25,4.36,4.52,4.70,4.84,4.94,4.97,5.09,5.15,5.22,5.33,5.40,5.53,5.68,5.81,5.90,6.03];
const photographed=new Set(['Business','Storage','Grid']); // Six PNGs total.
const measurement='Four-second settled requestAnimationFrame intervals, not isolated GPU execution times. Each viewport uses a fresh incognito context with HTTP cache disabled by routing. Cold means the first owner load in that context; OS, browser-process and GPU-driver caches are not purged. Mobile viewport/DPR is desktop emulation, not a physical phone measurement. decodedBody bytes describe HTTP bodies, not decoded texture memory.';
const reports=[];
const hardware={platform:os.platform(),osRelease:os.release(),architecture:os.arch(),cpuModel:os.cpus()[0]?.model??null,logicalCpus:os.cpus().length,memoryBytes:os.totalmem(),node:process.version,modelIdentifier:null};
if(process.platform==='darwin'){
  try{hardware.modelIdentifier=(await promisify(execFile)('/usr/sbin/sysctl',['-n','hw.model'],{timeout:3000})).stdout.trim();}catch{}
}
const browser=await chromium.launch(launchOptions);
await mkdir(`${folder}/performance-captures`,{recursive:true});
const snap=page=>page.evaluate(()=>window.__experience.snapshot());
const clean=({frameIntervals,...state})=>state;
const statuses=state=>Object.fromEntries(ownerNames.map(name=>[name,state[`${name}Status`]??null]));
const memory=state=>({geometries:state.geometries,textures:state.textures,shadowEstimatedBytes:state.shadowEstimatedBytes});
const save=()=>writeFile(`${folder}/verification.json`,JSON.stringify({recordedAt:new Date().toISOString(),hardware,browser:browser.version(),launch:{headless:launchOptions.headless,executablePath:launchOptions.executablePath??null,args:launchOptions.args},measurement,reports},null,2));

async function guard(page,report){
  page.on('pageerror',e=>report.errors.push({type:'pageerror',message:e.message}));
  page.on('console',m=>{if(m.type()==='error')report.errors.push({type:'console',message:m.text()});if(m.type()==='warning')report.warnings.push(m.text());});
  page.on('request',r=>report.requests.push({url:r.url(),method:r.method(),type:r.resourceType()}));
  await page.addInitScript(()=>performance.setResourceTimingBufferSize(2500));
  await page.route('**/*',route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin!==origin){report.blockedRequests.push(request.url());return route.abort();}
    if(url.pathname.startsWith('/api/')||!['GET','HEAD'].includes(request.method())){
      report.mockedRequests.push({url:request.url(),method:request.method()});
      return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Local verification: provider requests disabled."}'});
    }
    return route.continue();
  });
}
async function resources(page){
  return page.evaluate(()=>{
    const pack=e=>({name:new URL(e.name).pathname,encoded:e.encodedBodySize,decodedBody:e.decodedBodySize,transfer:e.transferSize,duration:e.duration,initiatorType:e.initiatorType??'navigation'});
    return {navigation:performance.getEntriesByType('navigation').map(pack),resources:performance.getEntriesByType('resource').map(pack)};
  });
}
function totals(records){
  return [...records.navigation,...records.resources].reduce((a,e)=>({requests:a.requests+1,encoded:a.encoded+e.encoded,decodedBody:a.decodedBody+e.decodedBody,transfer:a.transfer+e.transfer}),{requests:0,encoded:0,decodedBody:0,transfer:0});
}
async function rawScroll(page,p){
  return page.evaluate(p=>{const j=document.querySelector('#journey'),requestedAt=performance.now();scrollTo(0,j.getBoundingClientRect().top+scrollY+p/Number(j.dataset.duration)*(j.offsetHeight-innerHeight));return requestedAt;},p);
}
async function allReady(page){
  await page.waitForFunction(names=>{const s=window.__experience?.snapshot();return s?.failed||(s?.ready&&names.every(name=>s[`${name}Status`]==='ready'));},ownerNames,{timeout:20000});
  const state=await snap(page);if(state.failed)throw new Error('Experience entered fallback while awaiting owners');
}
async function move(page,p){
  await rawScroll(page,p);
  await page.waitForFunction(({p,names})=>{const s=window.__experience?.snapshot();return s?.failed||(s?.ready&&Math.abs(s.progress-p)<.003&&names.every(name=>s[`${name}Status`]==='ready'));},{p,names:ownerNames},{timeout:20000});
  if((await snap(page)).failed)throw new Error(`Experience fallback at ${p}`);
  await page.waitForTimeout(140);
}
async function layout(page){
  return page.evaluate(()=>{
    const visible=e=>{for(let n=e;n;n=n.parentElement){const c=getComputedStyle(n);if(c.display==='none'||c.visibility==='hidden'||Number(c.opacity)<.15)return false;}return e.getBoundingClientRect().width>0;};
    const item=e=>({text:e.innerText,rect:e.getBoundingClientRect().toJSON()});
    return {viewport:{width:innerWidth,height:innerHeight},documentWidth:document.documentElement.scrollWidth,framing:document.body.dataset.framing,chapter:document.querySelector('#stage').dataset.chapter,
      copies:[...document.querySelectorAll('[data-copy]')].filter(visible).map(e=>({id:e.dataset.copy,...item(e),children:[...e.children].filter(visible).map(item)})),
      controls:[...document.querySelectorAll('.site-header,.skip-link,.chapter-footer')].filter(visible).map(item),
      annotations:[...document.querySelectorAll('[data-inverter-label],[data-storage-label],.process-note')].filter(visible).map(item)};
  });
}
function difference(a,b){
  const result={};for(const key of ['camera','target','pulse','tangent','up'])if(a?.[key]&&b?.[key])result[key]=Math.max(...a[key].map((n,i)=>Math.abs(n-b[key][i])));
  // Operating state must also reconstruct; ambient time intentionally advances.
  for(const key of new Set([...Object.keys(a?.operation??{}),...Object.keys(b?.operation??{})])){
    if(typeof a?.operation?.[key]==='number'&&typeof b?.operation?.[key]==='number')result[`operation.${key}`]=Math.abs(a.operation[key]-b.operation[key]);
  }
  return result;
}

try{
  for(const [name,width,height,dpr]of views){
    const report={name,width,height,dpr,errors:[],warnings:[],problems:[],blockedRequests:[],mockedRequests:[],requests:[],coldOwners:[],measures:[],reverse:[]};reports.push(report);
    // A fresh context ensures none of the later owners are already imported by
    // the page; the browser process and hardware are intentionally the same host.
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,serviceWorkers:'block',reducedMotion:'no-preference'});
    const page=await context.newPage();
    try{
      await guard(page,report);await page.goto(`${origin}/experience?inspect=1`);
      await page.waitForFunction(()=>{const s=window.__experience?.snapshot();return s?.ready||s?.failed;},{},{timeout:20000});
      if((await snap(page)).failed)throw new Error('Opening failed');
      report.openingReadyObservedMs=await page.evaluate(()=>performance.now());
      report.initialState=clean(await snap(page));report.initialResources=await resources(page);report.initialResourceTotals=totals(report.initialResources);
      report.environment=await page.evaluate(()=>{
        const gl=document.querySelector('#canvas-host canvas')?.getContext('webgl2'),ext=gl?.getExtension('WEBGL_debug_renderer_info');
        return {gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,userAgent:navigator.userAgent,hardwareConcurrency:navigator.hardwareConcurrency,deviceMemoryGiB:navigator.deviceMemory??null,devicePixelRatio,visibility:document.visibilityState};
      });
      // Trigger each next owner just after its current prefetch threshold. There
      // are no timed frame holds until this first-load series has fully finished.
      for(const [owner,p]of ownerSteps){
        const before=await snap(page),resourceStart=(await resources(page)).resources.length;
        const record={owner,triggerProgress:p,beforeStatus:before[`${owner}Status`],beforeOwners:statuses(before)};report.coldOwners.push(record);
        if(record.beforeStatus!=='idle')report.problems.push(`Cold ${owner}: expected idle before trigger, found ${record.beforeStatus}`);
        record.scrollRequestedAt=await rawScroll(page,p);
        await page.waitForFunction(owner=>{const s=window.__experience?.snapshot();return s?.failed||s?.[`${owner}Status`]==='ready';},owner,{timeout:15000});
        const after=await snap(page);record.readyObservedAt=await page.evaluate(()=>performance.now());
        record.observedRequestToReadyMs=record.readyObservedAt-record.scrollRequestedAt;
        record.afterStatus=after[`${owner}Status`]??'disposed';record.afterOwners=statuses(after);
        record.nativeTiming=after.readiness?.[owner]??null;
        record.addedResources=(await resources(page)).resources.slice(resourceStart);
        if(after.failed)throw new Error(`Cold ${owner} failed; previous view should have handed off to the HTML fallback`);
      }
      await allReady(page);report.readinessAfterCold=clean(await snap(page)).readiness??{};
      // Earth lacks the owner timing record; its observed wait is an upper bound
      // including ScrollTrigger and Playwright polling. Native business/storage
      // records separate import+construction from compile/warmup, without claiming
      // GPU execution time or excluding browser scheduling from those phases.
      report.coldResources=await resources(page);report.coldResourceTotals=totals(report.coldResources);
      for(const p of checkpoints)await move(page,p);
      await page.waitForTimeout(500);await allReady(page);
      report.warmedResources=await resources(page);report.warmedRequestCount=report.requests.length;
      const referenceMemory=memory(await snap(page));report.reverseBaseline=referenceMemory;
      report.warmedReadiness=(await snap(page)).readiness??{};

      for(const [label,p]of holds){
        await move(page,p);await page.waitForTimeout(650);await allReady(page);
        const before=await snap(page);
        if(before.paused||before.reduced||!before.onscreen)throw new Error(`${label} is not an active onscreen animation view`);
        await page.evaluate(()=>window.__experience.resetTiming());await page.waitForTimeout(4000);
        const state=await snap(page),frames=state.frameIntervals.filter(n=>Number.isFinite(n)&&n>0).sort((a,b)=>a-b);
        const percentile=q=>frames.length?frames[Math.min(frames.length-1,Math.floor(frames.length*q))]:null;
        if(!frames.length)report.problems.push(`${label}: no frame samples`);
        const measure={label,requestedProgress:p,sampleDurationMs:4000,settleBeforeSampleMs:650,samples:frames.length,
          mean:frames.length?frames.reduce((a,b)=>a+b,0)/frames.length:null,p50:percentile(.5),p95:percentile(.95),p99:percentile(.99),maximum:frames.at(-1)??null,
          over33:frames.filter(n=>n>33.4).length,over50:frames.filter(n=>n>50).length,state:clean(state),layout:await layout(page)};
        report.measures.push(measure);
        if(['laptop','mobile'].includes(name)&&photographed.has(label)){
          measure.capture=`${folder}/performance-captures/${name}-${label.toLowerCase()}.png`;await page.screenshot({path:measure.capture});
        }
      }
      const shots=new Map();
      for(const [pass,positions]of [['forward',checkpoints],['reverse',[...checkpoints].reverse()],['repeat',checkpoints]]){
        for(const p of positions){
          await move(page,p);const state=clean(await snap(page)),counts=memory(state),entry={pass,requestedProgress:p,progress:state.progress,memory:counts,shot:state.shot};
          for(const key of Object.keys(referenceMemory))if(counts[key]!==referenceMemory[key])report.problems.push(`${pass} ${p}: ${key} ${counts[key]} != warmed ${referenceMemory[key]}`);
          if(pass==='forward')shots.set(p,state.shot);else{
            entry.shotDifference=difference(shots.get(p),state.shot);
            if(Object.values(entry.shotDifference).some(n=>n>.025))report.problems.push(`${pass} ${p}: shot or operating state did not reconstruct`);
          }
          report.reverse.push(entry);
        }
      }
      report.finalResources=await resources(page);report.finalResourceTotals=totals(report.finalResources);
      report.reverseResourceStable=report.finalResources.resources.length===report.warmedResources.resources.length&&report.requests.length===report.warmedRequestCount;
      if(!report.reverseResourceStable)report.problems.push('Resource requests changed after the full warm tour');
      report.finalReadiness=(await snap(page)).readiness??{};
      report.ownerReadinessStable=JSON.stringify(report.finalReadiness)===JSON.stringify(report.warmedReadiness);
      if(!report.ownerReadinessStable)report.problems.push('An owner readiness record changed after warming');
      report.canvasCount=await page.locator('#canvas-host canvas').count();if(report.canvasCount!==1)report.problems.push(`Expected one renderer canvas, found ${report.canvasCount}`);
      await page.locator('.skip-link').focus();await page.keyboard.press('Enter');await page.waitForTimeout(200);
      const applicationState=await snap(page),ambient=applicationState.ambientTime;await page.waitForTimeout(250);
      report.application={...await page.evaluate(()=>({focused:document.activeElement?.id,top:document.querySelector('#application-details').getBoundingClientRect().top,href:document.querySelector('.primary-button').getAttribute('href')})),ambientFrozen:(await snap(page)).ambientTime===ambient,onscreen:(await snap(page)).onscreen};
      if(report.application.focused!=='application-details'||report.application.href!=='/apply.html'||!report.application.ambientFrozen)report.problems.push('Application focus, route or offscreen suspension failed');
    }catch(error){report.problems.push(String(error.stack||error));}
    finally{await context.close();await save();}
    console.log(name,{coldOwners:report.coldOwners.map(r=>({owner:r.owner,native:r.nativeTiming?.totalMs??null,observed:r.observedRequestToReadyMs})),settled:report.measures.map(m=>({chapter:m.label,p50:m.p50,p95:m.p95})),errors:report.errors.length,warnings:report.warnings.length,problems:report.problems});
  }
  const summary={hardware,browser:browser.version(),measurement,reports:reports.map(r=>({viewport:`${r.width}×${r.height}`,dpr:r.dpr,environment:r.environment,errors:r.errors,warnings:r.warnings,problems:r.problems,
    initialResourceTotals:r.initialResourceTotals,finalResourceTotals:r.finalResourceTotals,reverseResourceStable:r.reverseResourceStable,ownerReadinessStable:r.ownerReadinessStable,
    coldOwners:r.coldOwners.map(c=>({owner:c.owner,beforeStatus:c.beforeStatus,afterStatus:c.afterStatus,observedRequestToReadyMs:c.observedRequestToReadyMs,nativeTiming:c.nativeTiming})),
    chapters:r.measures.map(m=>({chapter:m.label,samples:m.samples,p50:m.p50,p95:m.p95,p99:m.p99,maximum:m.maximum,drawCalls:m.state.drawCalls,triangles:m.state.triangles,geometries:m.state.geometries,textures:m.state.textures,shadowEstimatedBytes:m.state.shadowEstimatedBytes,quality:m.state.quality,earth:m.state.earth,cell:m.state.cell,business:m.state.business,storage:m.state.storage,electrical:m.state.electrical,cellOverlayBytes:m.state.cellOverlayBytes,electricalOverlayBytes:m.state.electricalOverlayBytes,capture:m.capture}))}))};
  await writeFile(`${folder}/performance-summary.json`,JSON.stringify(summary,null,2));
  if(reports.some(r=>r.errors.length||r.problems.length))process.exitCode=1;
}finally{await browser.close();}
