import {chromium} from '@playwright/test';
import {writeFile, mkdir} from 'node:fs/promises';
import {launchOptions} from './browser-options.mjs';

// Run from the experience project after copying into scripts/. These are browser
// requestAnimationFrame intervals on this host, not GPU timings or phone measurements.
const origin = process.env.EXPERIENCE_ORIGIN || 'http://127.0.0.1:4173';
const folder = 'docs/experience/stage-four';
const views = [['desktop',1600,1000,1],['laptop',1280,720,1],['mobile',390,844,3],['intermediate',740,900,1],['short',1000,500,1]];
const holds = [['Sun',.36],['Earth',.935],['Panel',2.235],['Cell absorption',2.68],['Contacts',2.88],['DC route',3.33],['Inverter',3.96]];
// Include both sides of the glass and contact coordinate joins, and the absorption
// handoff between the incident guide and the electrical-energy explanation.
const checkpoints = [2.18,2.235,2.30,2.347,2.374,2.379,2.381,2.386,2.417,2.455,2.52,2.60,2.655,2.68,2.71,2.76,2.82,2.88,2.965,3.018,3.051,3.074,3.079,3.081,3.086,3.113,3.145,3.205,3.25,3.33,3.40,3.51,3.63,3.75,3.80,3.84,3.90,3.96,4.02,4.08];
const reports = [];
const browser = await chromium.launch(launchOptions);
await mkdir(`${folder}/motion`, {recursive:true});

const snapshot = page => page.evaluate(() => window.__experience.snapshot());
const clean = ({frameIntervals, ...state}) => state;
function memory(state) { return {geometries:state.geometries, textures:state.textures, shadowEstimatedBytes:state.shadowEstimatedBytes}; }
async function installGuard(page, report) {
  page.on('pageerror', e => report.errors.push({type:'pageerror',message:e.message}));
  page.on('console', m => {
    if (m.type()==='error') report.errors.push({type:'console',message:m.text()});
    if (m.type()==='warning') report.warnings.push(m.text());
  });
  await page.addInitScript(() => performance.setResourceTimingBufferSize(2500));
  await page.route('**/*', route => {
    const request=route.request(), url=new URL(request.url());
    if (url.origin!==origin) {report.blockedRequests.push(request.url()); return route.abort();}
    if (url.pathname.startsWith('/api/') || !['GET','HEAD'].includes(request.method())) {
      report.mockedRequests.push({url:request.url(),method:request.method()});
      return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Local verification: provider requests disabled."}'});
    }
    return route.continue();
  });
}
async function waitForShot(page, p) {
  await page.waitForFunction(p => {
    const s=window.__experience?.snapshot();
    if (!s) return false;
    if (s.failed) return true;
    return s.ready && Math.abs(s.progress-p)<.003 &&
      (p<=.635 || s.earthStatus==='ready') && (p<=1.235 || s.regionStatus==='ready') &&
      (p<=1.49 || s.siteStatus==='ready') && (p<=2.34 || s.cellStatus==='ready') &&
      (p<=3.05 || s.electricalStatus==='ready');
  }, p, {timeout:20000});
  const state=await snapshot(page);
  if (state.failed) throw new Error(`Scene fallback at requested progress ${p}`);
}
async function scroll(page, p) {
  await page.evaluate(p => {
    const j=document.querySelector('#journey');
    scrollTo(0,j.getBoundingClientRect().top+scrollY+p/Number(j.dataset.duration)*(j.offsetHeight-innerHeight));
  }, p);
  await waitForShot(page,p);
  await page.waitForTimeout(140);
}
async function resources(page) {
  return page.evaluate(() => performance.getEntriesByType('resource').map(e => ({
    name:new URL(e.name).pathname,encoded:e.encodedBodySize,decodedBody:e.decodedBodySize,
    transfer:e.transferSize,duration:e.duration,initiatorType:e.initiatorType,
  })));
}
function resourceTotals(items) {
  return items.reduce((a,e)=>({requests:a.requests+1,encoded:a.encoded+e.encoded,decodedBody:a.decodedBody+e.decodedBody,transfer:a.transfer+e.transfer}),{requests:0,encoded:0,decodedBody:0,transfer:0});
}
async function layout(page) {
  return page.evaluate(() => {
    const visible=e=>{if(!e)return false;for(let n=e;n;n=n.parentElement){const c=getComputedStyle(n);if(c.display==='none'||c.visibility==='hidden'||Number(c.opacity)<.15)return false;}return e.getBoundingClientRect().width>0;};
    const rect=e=>e.getBoundingClientRect().toJSON();
    const copies=[...document.querySelectorAll('[data-copy]')].filter(visible).map(e=>({id:e.dataset.copy,text:e.innerText,rect:rect(e),children:[...e.children].filter(visible).map(c=>({text:c.innerText,rect:rect(c)}))}));
    return {viewport:{width:innerWidth,height:innerHeight},documentWidth:document.documentElement.scrollWidth,framing:document.body.dataset.framing,scene:document.body.dataset.scene,chapter:document.querySelector('#stage').dataset.chapter,copies,
      controls:[...document.querySelectorAll('.site-header,.skip-link,.chapter-footer')].filter(visible).map(e=>({selector:e.className,rect:rect(e)})),
      annotations:[...document.querySelectorAll('[data-inverter-label],.process-note')].filter(visible).map(e=>({text:e.innerText,rect:rect(e)}))};
  });
}
function shotDifference(a,b) {
  const changes={};
  for(const key of ['camera','target','pulse','tangent','up'])
    if(a?.[key]&&b?.[key])changes[key]=Math.max(...a[key].map((n,i)=>Math.abs(n-b[key][i])));
  return changes;
}

try {
  for(const [name,width,height,dpr] of views) {
    const report={name,width,height,dpr,errors:[],warnings:[],blockedRequests:[],mockedRequests:[],problems:[],measures:[],motion:[]};
    reports.push(report);
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr});
    try {
      await installGuard(page,report);
      await page.goto(`${origin}/experience?inspect=1`);
      await page.waitForFunction(()=>{const s=window.__experience?.snapshot();return s?.ready||s?.failed;},{},{timeout:20000});
      if((await snapshot(page)).failed)throw new Error('Opening failed');
      report.initialResources=await resources(page);
      report.initialState=clean(await snapshot(page));
      report.initialResourceTotals=resourceTotals(report.initialResources);
      report.gpu=await page.evaluate(()=>{const gl=document.querySelector('#canvas-host canvas')?.getContext('webgl2');const ext=gl?.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null;});
      report.userAgent=await page.evaluate(()=>navigator.userAgent);
      for(const [label,p] of holds) {
        await scroll(page,p);await page.waitForTimeout(500);
        await page.evaluate(()=>window.__experience.resetTiming());
        await page.waitForTimeout(4000);
        const state=await snapshot(page),frames=state.frameIntervals.filter(Number.isFinite).sort((a,b)=>a-b);
        const percentile=q=>frames.length?frames[Math.min(frames.length-1,Math.floor(frames.length*q))]:null;
        if(!frames.length)report.problems.push(`No animation-frame samples in ${label}`);
        report.measures.push({label,requestedProgress:p,state:clean(state),samples:frames.length,
          mean:frames.length?frames.reduce((a,b)=>a+b,0)/frames.length:null,p50:percentile(.5),p95:percentile(.95),p99:percentile(.99),
          over33:frames.filter(n=>n>33.4).length,layout:await layout(page)});
        await page.screenshot({path:`${folder}/motion/${name}-${label.toLowerCase().replaceAll(' ','-')}-hold.png`});
      }
      // Warm every authored view before comparing counts. Shader compilation and
      // first visibility must not be misreported as a reverse-scroll resource leak.
      for(const p of checkpoints)await scroll(page,p);
      report.warmedResources=await resources(page);
      const baseMemory=memory(await snapshot(page)),reference=new Map();
      report.reverseBaseline={...baseMemory,resourceRequests:report.warmedResources.length};
      for(const [pass,positions] of [['forward',checkpoints],['reverse',[...checkpoints].reverse()],['repeat',checkpoints]]) {
        for(const p of positions) {
          await scroll(page,p);
          const state=clean(await snapshot(page)),entry={pass,requestedProgress:p,state};
          const counts=memory(state);
          for(const key of Object.keys(baseMemory))if(counts[key]!==baseMemory[key])report.problems.push(`${pass} ${p}: ${key} ${counts[key]} != warmed ${baseMemory[key]}`);
          if(state.failed)report.problems.push(`${pass} ${p}: scene failed`);
          if(pass==='forward')reference.set(p,state);
          else {
            entry.shotDifference=shotDifference(reference.get(p)?.shot,state.shot);
            if(Object.values(entry.shotDifference).some(n=>n>.025))report.problems.push(`${pass} ${p}: authored shot was not restored`);
          }
          if(pass!=='repeat')entry.layout=await layout(page);
          report.motion.push(entry);
          if(pass!=='repeat'&&['laptop','mobile'].includes(name))await page.screenshot({path:`${folder}/motion/${name}-${String(p).replace('.','')}-${pass}.png`});
        }
      }
      report.finalResources=await resources(page);
      report.finalResourceTotals=resourceTotals(report.finalResources);
      report.reverseResourceStable=report.finalResources.length===report.warmedResources.length;
      if(!report.reverseResourceStable)report.problems.push('Additional resource requests occurred after the complete warm tour');
      report.canvasCount=await page.locator('#canvas-host canvas').count();
      if(report.canvasCount!==1)report.problems.push(`Expected one canvas, found ${report.canvasCount}`);
      await page.locator('.skip-link').focus();await page.keyboard.press('Enter');await page.waitForTimeout(200);
      report.application=await page.evaluate(()=>({activeElement:document.activeElement?.id,top:document.querySelector('#application-details').getBoundingClientRect().top,href:document.querySelector('.primary-button').getAttribute('href'),state:window.__experience.snapshot()}));
      const ambient=report.application.state.ambientTime;await page.waitForTimeout(250);
      report.application.ambientFrozen=(await snapshot(page)).ambientTime===ambient;
      report.application.state=clean(report.application.state);
      if(report.application.activeElement!=='application-details'||report.application.href!=='/apply.html'||!report.application.ambientFrozen)report.problems.push('Application focus, route or offscreen suspension check failed');
      await page.screenshot({path:`${folder}/motion/${name}-application-handoff.png`});
    } catch(error) {report.problems.push(String(error.stack||error));}
    finally {await page.close();}
    console.log(name,report.measures.map(m=>({chapter:m.label,p50:m.p50,p95:m.p95})),{errors:report.errors.length,warnings:report.warnings.length,problems:report.problems});
    await writeFile(`${folder}/verification.json`,JSON.stringify({browser:browser.version(),recordedAt:new Date().toISOString(),measurement:'Headless desktop browser; mobile dimensions and DPR are emulated. RAF intervals are not GPU timings. Resource decodedBody bytes are HTTP body size, not decoded texture memory.',reports},null,2));
  }
  const summary=reports.map(r=>({viewport:`${r.width}×${r.height}`,dpr:r.dpr,gpu:r.gpu,errors:r.errors,warnings:r.warnings,problems:r.problems,initialResourceTotals:r.initialResourceTotals,finalResourceTotals:r.finalResourceTotals,reverseResourceStable:r.reverseResourceStable,
    chapters:r.measures.map(m=>({chapter:m.label,samples:m.samples,p50:m.p50,p95:m.p95,drawCalls:m.state.drawCalls,triangles:m.state.triangles,geometries:m.state.geometries,textures:m.state.textures,shadowEstimatedBytes:m.state.shadowEstimatedBytes,earth:m.state.earth,cell:m.state.cell,electrical:m.state.electrical,cellOverlayBytes:m.state.cellOverlayBytes,electricalOverlayBytes:m.state.electricalOverlayBytes}))}));
  await writeFile(`${folder}/performance-summary.json`,JSON.stringify(summary,null,2));
  if(reports.some(r=>r.problems.length||r.errors.length))process.exitCode=1;
} finally {await browser.close();}
