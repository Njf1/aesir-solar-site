import {chromium} from '@playwright/test';
import {writeFile,mkdir,unlink} from 'node:fs/promises';
import {launchOptions} from './browser-options.mjs';

const origin=process.env.EXPERIENCE_ORIGIN||'http://127.0.0.1:4173';
const root='docs/experience/stage-four';
const browser=await chromium.launch(launchOptions);
const observations={recordedAt:new Date().toISOString(),browser:browser.version(),zoom:[],stills:[],keyboard:null,video:null};
const moments=[['opening',0],['sun',.24],['flight',.55],['earth',.935],['panel',2.12],['glass',2.48],['absorption',2.68],['contacts',2.88],['dc',3.33],['inverter-copy',3.84],['inverter',3.96],['handoff',4.08]];
const stillViews=[['sun',.285],['earth',.925],['britain',1.4],['roof',1.76],['panel',2.23],['cell',2.76],['dc',3.40],['inverter',4.02],['cell',2.76],['panel',2.23]];
await mkdir(`${root}/captures`,{recursive:true});await mkdir(`${root}/motion`,{recursive:true});
const clean=({frameIntervals,...state})=>state;
const snap=page=>page.evaluate(()=>window.__experience.snapshot());
async function guard(page,record) {
  record.errors=[];record.warnings=[];record.blockedRequests=[];record.mockedRequests=[];
  page.on('pageerror',e=>record.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')record.errors.push(m.text());if(m.type()==='warning')record.warnings.push(m.text());});
  await page.route('**/*',route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.hostname==='fonts.googleapis.com'){record.mockedRequests.push({url:request.url(),method:request.method(),reason:'Existing application font CSS mocked; no external request'});return route.fulfill({status:200,contentType:'text/css',body:''});}
    if(url.origin!==origin){record.blockedRequests.push(request.url());return route.abort();}
    if(url.pathname.startsWith('/api/')||!['GET','HEAD'].includes(request.method())){record.mockedRequests.push({url:request.url(),method:request.method()});return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Local verification: provider requests disabled."}'});}
    return route.continue();
  });
}
async function ready(page) {
  await page.goto(`${origin}/experience?inspect=1`);
  await page.waitForFunction(()=>{const s=window.__experience?.snapshot();return s?.ready||s?.failed;},{},{timeout:20000});
  if((await snap(page)).failed)throw new Error('Experience opening failed');
}
async function awaitChapter(page,p,still=false) {
  await page.waitForFunction(({p,still})=>{
    const s=window.__experience?.snapshot();if(!s)return false;if(s.failed)return true;
    return s.ready&&(still||Math.abs(s.progress-p)<.003)&&(p<=.635||s.earthStatus==='ready')&&(p<=1.235||s.regionStatus==='ready')&&(p<=1.49||s.siteStatus==='ready')&&(p<=2.34||s.cellStatus==='ready')&&(p<=3.05||s.electricalStatus==='ready');
  },{p,still},{timeout:20000});
  if((await snap(page)).failed)throw new Error(`Experience fallback at ${p}`);
  await page.waitForTimeout(180);
}
async function scroll(page,p) {
  await page.evaluate(p=>{const j=document.querySelector('#journey');scrollTo(0,j.getBoundingClientRect().top+scrollY+p/Number(j.dataset.duration)*(j.offsetHeight-innerHeight));},p);
  await awaitChapter(page,p);
}
async function layout(page) {
  return page.evaluate(()=>{
    const visible=e=>{if(!e)return false;for(let n=e;n;n=n.parentElement){const c=getComputedStyle(n);if(c.display==='none'||c.visibility==='hidden'||Number(c.opacity)<.15)return false;}return e.getBoundingClientRect().width>0;};
    const describe=e=>({text:e.innerText,rect:e.getBoundingClientRect().toJSON(),fontSize:getComputedStyle(e).fontSize});
    return {framing:document.body.dataset.framing,largeType:document.body.dataset.largeType,width:document.documentElement.scrollWidth,viewport:{width:innerWidth,height:innerHeight},activeElement:{tag:document.activeElement?.tagName,id:document.activeElement?.id,text:document.activeElement?.textContent},
      visibleCopy:[...document.querySelectorAll('[data-copy]')].filter(visible).map(e=>({copy:e.dataset.copy,...describe(e),children:[...e.children].filter(visible).map(describe)})),
      annotations:[...document.querySelectorAll('[data-inverter-label],.process-note')].filter(visible).map(describe),
      controls:[...document.querySelectorAll('.site-header,.skip-link,.chapter-footer,#still-views button')].filter(visible).map(describe),
      application:{top:document.querySelector('#application-details').getBoundingClientRect().top,href:document.querySelector('.primary-button').getAttribute('href')}};
  });
}
async function skip(page) {
  await page.locator('.skip-link').focus();await page.keyboard.press('Enter');await page.waitForTimeout(180);
  const state=await snap(page),time=state.ambientTime;await page.waitForTimeout(250);
  return {layout:await layout(page),state:clean(state),ambientFrozen:(await snap(page)).ambientTime===time};
}
const save=()=>writeFile(`${root}/zoom-observations.json`,JSON.stringify(observations,null,2));

try {
  // 640×360 CSS pixels at DPR2 is the layout equivalent of a 1280×720 desktop
  // display at 200% browser zoom. This does not manipulate Chrome's native zoom UI.
  for(const [name,width,height,dpr] of [['zoom-200',640,360,2],['text-200',1280,720,1]]) {
    const record={name,width,height,dpr,method:name==='zoom-200'?'200% browser-zoom viewport equivalent':'Each original text size is measured first, then doubled once',states:[]};observations.zoom.push(record);
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr});
    try {
      await guard(page,record);await ready(page);
      if(name==='text-200')await page.evaluate(()=>{
        // Read all sizes before changing parents; nested text must not double twice.
        const sizes=[...document.querySelectorAll('h1,h2,h3,p,button,a,li,[data-inverter-label],#scroll-label')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);
        for(const [e,size]of sizes)e.style.fontSize=`${size*2}px`;
      });
      for(const [label,p]of moments) {
        await scroll(page,p);const state=clean(await snap(page));
        record.states.push({label,requestedProgress:p,state,layout:await layout(page)});
        await page.screenshot({path:`${root}/captures/${name}-${label}.png`});
      }
      record.application=await skip(page);await page.screenshot({path:`${root}/captures/${name}-application.png`});
    } catch(e) {record.problem=String(e.stack||e);process.exitCode=1;}
    finally {await page.close();await save();}
  }

  // All eight still chapters, including a backwards revisit after electrical load.
  for(const [name,width,height,dpr] of [['laptop',1280,720,1],['mobile',390,844,3]]) {
    const record={name,width,height,dpr,states:[]};observations.stills.push(record);
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr,reducedMotion:'reduce'});
    try {
      await guard(page,record);await ready(page);
      const initialTime=(await snap(page)).ambientTime;
      for(const [index,[name,p]]of stillViews.entries()) {
        await page.locator(`[data-still="${name}"]`).click();await awaitChapter(page,p,true);
        const before=await snap(page);await page.waitForTimeout(250);const after=await snap(page);
        record.states.push({name,requestedProgress:p,state:clean(after),ambientFrozen:before.ambientTime===after.ambientTime&&after.ambientTime===initialTime,selected:await page.locator('#still-views [aria-pressed="true"]').count(),layout:await layout(page)});
        await page.screenshot({path:`${root}/captures/reduced-${record.name}-${index}-${name}.png`});
      }
      record.application=await skip(page);await page.screenshot({path:`${root}/captures/reduced-${name}-application.png`});
      if(record.states.some(s=>!s.ambientFrozen||s.selected!==1))throw new Error('Reduced-motion still changed ambient time or selection');
    } catch(e) {record.problem=String(e.stack||e);process.exitCode=1;}
    finally {await page.close();await save();}
  }

  const keyboard={tabOrder:[]};observations.keyboard=keyboard;
  const keyboardPage=await browser.newPage({viewport:{width:1280,height:720}});
  try {
    await guard(keyboardPage,keyboard);await ready(keyboardPage);
    for(let i=0;i<4;i++){await keyboardPage.keyboard.press('Tab');keyboard.tabOrder.push(await keyboardPage.evaluate(()=>({tag:document.activeElement?.tagName,id:document.activeElement?.id,className:document.activeElement?.className,text:document.activeElement?.textContent})));}
    await keyboardPage.locator('#pause-motion').focus();await keyboardPage.keyboard.press('Enter');
    const paused=await snap(keyboardPage);await keyboardPage.waitForTimeout(250);const held=await snap(keyboardPage);
    keyboard.pause={paused:held.paused,ambientFrozen:paused.ambientTime===held.ambientTime};
    await keyboardPage.keyboard.press('Enter');await keyboardPage.waitForTimeout(200);keyboard.resumed=!(await snap(keyboardPage)).paused;
    keyboard.application=await skip(keyboardPage);
    if(!keyboard.pause.paused||!keyboard.pause.ambientFrozen||!keyboard.resumed||keyboard.application.layout.activeElement.id!=='application-details')throw new Error('Keyboard pause, resume or skip focus failed');
  } catch(e) {keyboard.problem=String(e.stack||e);process.exitCode=1;}
  finally {await keyboardPage.close();await save();}

  // Continuous native scrolling; the first pass includes natural next-chapter
  // prefetch. The reverse pass revisits exactly the same authored coordinates.
  const recording={segments:[[2.18,4.08,35000],[4.08,2.18,30000]],samples:[]};observations.video=recording;
  const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:`${root}/motion`,size:{width:1280,height:720}}});
  const page=await context.newPage();const video=page.video();
  try {
    await guard(page,recording);await ready(page);await scroll(page,2.18);await page.waitForTimeout(600);
    for(const [from,to,duration]of recording.segments) {
      const samples=await page.evaluate(async({from,to,duration})=>{
        const j=document.querySelector('#journey'),startY=j.getBoundingClientRect().top+scrollY,distance=(j.offsetHeight-innerHeight)/Number(j.dataset.duration),samples=[];
        await new Promise(resolve=>{const start=performance.now();let previous=-1;function frame(now){const t=Math.min(1,(now-start)/duration),p=from+(to-from)*t;scrollTo(0,startY+p*distance);const second=Math.floor((now-start)/1000);if(second!==previous||t===1){previous=second;const {frameIntervals,...state}=window.__experience.snapshot();samples.push({elapsed:now-start,requestedProgress:p,state});}if(t<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
        return samples;
      },{from,to,duration});
      recording.samples.push({from,to,duration,samples});await awaitChapter(page,to);await page.waitForTimeout(600);
    }
    recording.application=await skip(page);await page.screenshot({path:`${root}/captures/video-application-handoff.png`});await page.waitForTimeout(1000);
    await page.locator('.primary-button').click();await page.waitForLoadState('domcontentloaded');await page.waitForTimeout(1000);
    recording.apply={url:page.url(),title:await page.title(),forms:await page.locator('form').count(),fields:await page.locator('input,select,textarea').count()};
    await page.screenshot({path:`${root}/captures/video-apply.png`});
    if(new URL(page.url()).pathname!=='/apply.html')throw new Error('Application handoff did not reach /apply.html');
  } catch(e) {recording.problem=String(e.stack||e);process.exitCode=1;}
  finally {
    await context.close();
    const destination=`${root}/motion/journey-forward-reverse.webm`;
    await video.saveAs(destination);const original=await video.path();if(!original.endsWith('/journey-forward-reverse.webm'))await unlink(original);
    recording.path=destination;await save();
  }
  if([...observations.zoom,...observations.stills,keyboard,recording].some(r=>r.errors?.length))process.exitCode=1;
  console.log('Stage-four zoom, text, still, keyboard and video observations written to',root);
} finally {await browser.close();}
