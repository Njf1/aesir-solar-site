import {chromium} from '@playwright/test';
import {writeFile,mkdir,unlink} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {launchOptions} from './browser-options.mjs';

// Copy this file into the project's scripts/ directory before running.
// One browser, four fresh contexts in sequence. No provider or application writes.
const projectRoot=fileURLToPath(new URL('../',import.meta.url));
const folder=path.join(projectRoot,'docs/experience/stage-five');
const motionFolder=path.join(folder,'motion');
const originURL=new URL(process.env.EXPERIENCE_ORIGIN||'http://127.0.0.1:4173');
if(!['http:','https:'].includes(originURL.protocol)||!['127.0.0.1','localhost','[::1]'].includes(originURL.hostname))throw new Error('Responsive motion inspection requires a loopback preview origin.');
const origin=originURL.origin;
const views=[['desktop',1600,1000,1],['mobile',390,844,3],['intermediate',740,900,1],['short',1000,500,1]];
const segments=[{name:'forward',from:4.08,to:6.08,duration:22000},{name:'reverse',from:6.08,to:4.02,duration:18000}];
const method='Sequential desktop Chromium recordings of native window.scrollTo driven by requestAnimationFrame: stage five forward 4.08→6.08 over 22 seconds, then reverse 6.08→4.02 over 18 seconds. Snapshot state is sampled about once per second, with exact requested progress and measured elapsed time. Business readiness is awaited before the forward segment; storage retains its natural next-chapter prefetch and bounded owner loading. Both segment endpoints await the required chapters. Video includes initial loading/positioning and short settled holds; segment page-clock timestamps identify the measured movement. These recordings show desktop viewport/DPR emulation, not physical-phone or sustained performance measurements.';
const report={recordedAt:new Date().toISOString(),origin,browser:null,method,views:[]};
const clean=({frameIntervals,...state})=>state;
const snap=page=>page.evaluate(()=>window.__experience.snapshot());
const json=(destination,value)=>writeFile(destination,JSON.stringify(value,null,2));
const save=()=>json(path.join(folder,'responsive-motion-observations.json'),report);
await mkdir(motionFolder,{recursive:true});

async function guard(page,record){
  record.errors=[];record.warnings=[];record.blockedRequests=[];record.mockedRequests=[];
  page.on('pageerror',e=>record.errors.push({type:'pageerror',message:e.message}));
  page.on('console',m=>{if(m.type()==='error')record.errors.push({type:'console',message:m.text()});if(m.type()==='warning')record.warnings.push(m.text());});
  await page.route('**/*',route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.hostname==='fonts.googleapis.com'){
      record.mockedRequests.push({url:request.url(),method:request.method(),reason:'Existing application font CSS mocked; no external request'});
      return route.fulfill({status:200,contentType:'text/css',body:''});
    }
    if(url.origin!==origin){record.blockedRequests.push({url:request.url(),method:request.method()});return route.abort();}
    if(url.pathname==='/api'||url.pathname.startsWith('/api/')||!['GET','HEAD'].includes(request.method())){
      record.mockedRequests.push({url:request.url(),method:request.method(),reason:'Provider and mutation requests disabled'});
      return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Local verification: provider requests disabled."}'});
    }
    return route.continue();
  });
}
async function ready(page){
  await page.goto(`${origin}/experience?inspect=1`,{waitUntil:'domcontentloaded',timeout:20000});
  await page.waitForFunction(()=>{const s=window.__experience?.snapshot();return s?.ready||s?.failed;},null,{timeout:20000});
  const state=await snap(page);
  if(state.failed)throw new Error('Experience opening failed');
  if(state.reduced||state.paused)throw new Error('Motion recording started in a reduced-motion or paused state');
  if(state.duration<6.08)throw new Error(`Stage-five duration unavailable: ${state.duration}`);
}
async function awaitChapter(page,p){
  await page.waitForFunction(p=>{
    const s=window.__experience?.snapshot();if(!s)return false;if(s.failed)return true;
    return s.ready&&Math.abs(s.progress-p)<.003&&(p<=.635||s.earthStatus==='ready')&&(p<=1.235||s.regionStatus==='ready')&&(p<=1.49||s.siteStatus==='ready')&&(p<=2.34||s.cellStatus==='ready')&&(p<=3.05||s.electricalStatus==='ready')&&(p<=4.18||s.businessStatus==='ready')&&(p<=4.96||s.storageStatus==='ready');
  },p,{timeout:20000});
  const state=await snap(page);if(state.failed)throw new Error(`Experience fallback while awaiting progress ${p}`);
  await page.waitForTimeout(180);
}
async function position(page,p){
  await page.evaluate(p=>{
    const journey=document.querySelector('#journey');
    const start=journey.getBoundingClientRect().top+window.scrollY;
    const distance=(journey.offsetHeight-window.innerHeight)/Number(journey.dataset.duration);
    window.scrollTo(0,start+p*distance);
  },p);
  await awaitChapter(page,p);
}
async function prepareAtStart(page){
  await position(page,4.08);
  // At p=4.08 the next-owner trigger has fired (>4.04). Await that bounded
  // preparation without jumping to later chapters or forcing their imports.
  await page.waitForFunction(()=>{const s=window.__experience?.snapshot();return s?.failed||(s?.ready&&s.businessStatus==='ready');},null,{timeout:20000});
  const state=await snap(page);if(state.failed)throw new Error('Business asset failed before responsive motion start');
  await page.waitForTimeout(600);
}
async function recordSegment(page,segment){
  return page.evaluate(async({name,from,to,duration})=>{
    const journey=document.querySelector('#journey');
    const startY=journey.getBoundingClientRect().top+window.scrollY;
    const distance=(journey.offsetHeight-window.innerHeight)/Number(journey.dataset.duration);
    if(!(Number.isFinite(distance)&&distance>0))throw new Error('Native scroll distance is unavailable');
    const samples=[];
    const sample=(elapsed,requestedProgress)=>{
      const {frameIntervals,...state}=window.__experience.snapshot();
      samples.push({elapsed,requestedProgress,scrollY:window.scrollY,state});
      if(state.failed)throw new Error(`Experience entered fallback during ${name} at requested progress ${requestedProgress}`);
      if(state.reduced||state.paused)throw new Error(`Motion stopped during ${name}`);
    };
    const startedAtPageMs=performance.now();sample(0,from);
    let problem=null;
    try{await new Promise((resolve,reject)=>{
      let raf=0,previousSecond=0,finished=false;
      const finish=error=>{if(finished)return;finished=true;clearTimeout(deadline);cancelAnimationFrame(raf);error?reject(error):resolve();};
      // A timer bounds an unexpectedly suspended RAF; this does not poll or sleep-loop.
      const deadline=setTimeout(()=>finish(new Error(`Native ${name} motion exceeded its deadline`)),duration+10000);
      const frame=now=>{
        if(finished)return;
        try{
          const elapsed=now-startedAtPageMs,t=Math.min(1,elapsed/duration),requestedProgress=from+(to-from)*t;
          window.scrollTo(0,startY+requestedProgress*distance);
          const second=Math.floor(elapsed/1000);
          if(second!==previousSecond||t===1){previousSecond=second;sample(elapsed,requestedProgress);}
          if(t<1)raf=requestAnimationFrame(frame);else finish();
        }catch(error){finish(error);}
      };
      raf=requestAnimationFrame(frame);
    });}catch(error){problem=String(error.stack||error);}
    return {name,from,to,duration,startedAtPageMs,endedAtPageMs:performance.now(),samples,...(problem?{problem}:{})};
  },segment);
}

const browser=await chromium.launch(launchOptions);report.browser=browser.version();
try{
  for(const [name,width,height,dpr] of views){
    const record={name,width,height,dpr,device:'Desktop Chromium viewport/DPR emulation; no physical phone',videoFrameSize:{width,height},segments:[],status:'preparing'};
    report.views.push(record);
    let context,page,video;
    try{
      context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,reducedMotion:'no-preference',recordVideo:{dir:motionFolder,size:{width,height}}});
      page=await context.newPage();video=page.video();page.setDefaultTimeout(20000);
      await guard(page,record);await ready(page);await prepareAtStart(page);
      record.prepared={state:clean(await snap(page)),environment:await page.evaluate(()=>({pageTimeMs:performance.now(),timeOrigin:performance.timeOrigin,viewport:{width:innerWidth,height:innerHeight},devicePixelRatio:window.devicePixelRatio,userAgent:navigator.userAgent,framing:document.body.dataset.framing}))};
      record.status='recording';await save();
      for(const segment of segments){
        const sampled=await recordSegment(page,segment);record.segments.push(sampled);
        if(sampled.problem)throw new Error(sampled.problem);
        await awaitChapter(page,segment.to);sampled.settledState=clean(await snap(page));
        sampled.settledAtPageMs=await page.evaluate(()=>performance.now());
        await page.waitForTimeout(600);await save();
      }
      record.finalState=clean(await snap(page));record.status='complete';
      if(record.errors.length){record.status='completed-with-errors';process.exitCode=1;}
    }catch(error){record.status='failed';record.problem=String(error.stack||error);process.exitCode=1;}
    finally{
      if(context){try{await context.close();}catch(error){record.errors??=[];record.errors.push({type:'context-close',message:String(error)});process.exitCode=1;}}
      if(video){
        try{
          const destination=path.join(motionFolder,`responsive-${name}-forward-reverse.webm`);
          await video.saveAs(destination);const original=await video.path();
          if(path.resolve(original)!==path.resolve(destination))await unlink(original);
          record.video=path.relative(projectRoot,destination);
        }catch(error){record.videoProblem=String(error.stack||error);record.status='failed';process.exitCode=1;}
      }
      const stateDestination=path.join(motionFolder,`responsive-${name}-states.json`);
      record.statesFile=path.relative(projectRoot,stateDestination);
      await json(stateDestination,{recordedAt:report.recordedAt,browser:report.browser,origin,method,...record});
      await save();
    }
    console.log(`${name}: ${record.status}; ${record.segments.length}/2 movement segments; ${record.errors?.length??0} errors, ${record.warnings?.length??0} warnings`);
  }
}finally{await browser.close();}
console.log('Responsive stage-five motion observations written to',folder);
