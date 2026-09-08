// Browser regression coverage for operating scenes, bounded loading and reversal.
import {test,expect,type Page} from '@playwright/test';

const origin='http://127.0.0.1:4173';
const snapshot=(page:Page)=>page.evaluate(()=>(window as any).__experience.snapshot());
const owners=['earth','region','site','cell','electrical','business','storage'] as const;
// Exclude eager/shared authored-path chunks; block only the lazy scene entry module.
const assets=[
 {kind:'business',asset:/\/business-(?!journey-)[^/]+\.js$/,before:4.02,prerequisite:'electrical',hold:4.18,requested:4.55,copy:'12',still:'business',stillProgress:4.70,message:'business view'},
 {kind:'storage',asset:/\/storage-(?!(?:path|paths)-)[^/]+\.js$/,before:4.66,prerequisite:'business',hold:4.96,requested:5.07,copy:'13',still:'storage',stillProgress:5.09,message:'storage view'},
] as const;
type Asset=typeof assets[number];
function deferred(){let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);return{gate,release};}
async function ready(page:Page){await page.goto('/experience?inspect=1');await page.waitForFunction(()=>(window as any).__experience?.snapshot().ready);}
async function scroll(page:Page,p:number){await page.evaluate(p=>{const j=document.querySelector('#journey') as HTMLElement;scrollTo(0,j.getBoundingClientRect().top+scrollY+p/Number(j.dataset.duration)*(j.offsetHeight-innerHeight));},p);}
async function move(page:Page,p:number){await scroll(page,p);await expect.poll(async()=>(await snapshot(page)).progress).toBeCloseTo(p,2);await page.waitForTimeout(120);}
async function ownerReady(page:Page,kind:string){await page.waitForFunction(kind=>(window as any).__experience.snapshot()[`${kind}Status`]==='ready',kind);}
async function allReady(page:Page){await page.waitForFunction(kinds=>{const s=(window as any).__experience.snapshot();return kinds.every(k=>s[`${k}Status`]==='ready');},[...owners]);}
async function beforeOwner(page:Page,info:Asset){await move(page,info.before);await ownerReady(page,info.prerequisite);expect((await snapshot(page))[`${info.kind}Status`]).toBe('idle');}
async function fallbackVisible(page:Page,message?:string){
 await page.waitForFunction(()=>(window as any).__experience.snapshot().failed);
 if(message)await expect(page.locator('#fallback-status')).toContainText(message);
 await expect(page.locator('#canvas-host canvas')).toHaveCount(0);await expect(page.locator('#inverter-annotations')).toBeHidden();
 await expect(page.locator('#application-details')).toBeInViewport();await expect(page.locator('header .apply-link')).toBeVisible();
 await expect(page.locator('.primary-button')).toHaveAttribute('href','/apply.html');
}
function monitor(page:Page){const errors:string[]=[],warnings:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='warning')warnings.push(m.text());});return{errors,warnings};}
function expectShotEqual(actual:any,expected:any,tolerance=.02){
 expect(actual.scene).toBe(expected.scene);expect(actual.chapter).toBe(expected.chapter);
 for(const key of ['camera','target','pulse','tangent','up'])for(let i=0;i<3;i++)expect(Math.abs(actual[key][i]-expected[key][i]),`${key}[${i}]`).toBeLessThan(tolerance);
 expect(actual.pulseOpacity).toBe(expected.pulseOpacity);
}

test.beforeEach(async({page})=>{
 await page.route('**/*',route=>{
  const r=route.request(),url=new URL(r.url());if(url.origin!==origin)return route.abort();
  if(url.pathname.startsWith('/api/')||!['GET','HEAD'].includes(r.method()))return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Local regression: providers disabled"}'});
  return route.continue();
 });
});

for(const info of assets){
 test(`delayed ${info.kind} holds its exact earlier pose and copy, then resumes without another scroll`,async({page})=>{
  const load=deferred(),requests:string[]=[],issues=monitor(page);
  await page.route(info.asset,async route=>{requests.push(route.request().url());await load.gate;await route.continue().catch(()=>{});});
  try{
   await ready(page);await beforeOwner(page,info);expect(requests).toEqual([]);
   // Ask just beyond the cap to obtain the exact displayed hold, not a nearly equal native-scroll position.
   await move(page,info.hold+.005);await page.waitForFunction(kind=>(window as any).__experience.snapshot()[`${kind}Status`]==='loading',info.kind);
   await expect.poll(()=>requests.length).toBe(1);const atHold=await snapshot(page);
   await move(page,info.requested);const held=await snapshot(page);
   expect(held.failed).toBe(false);expect(held.progress).toBeCloseTo(info.requested,2);
   expectShotEqual(held.shot,atHold.shot,1e-8);expect(held.shot.operation).toEqual(atHold.shot.operation);
   await expect(page.locator(`[data-copy="${info.copy}"]`)).toHaveAttribute('aria-hidden','true');
   await expect(page.locator('#inverter-annotations')).toBeHidden();await expect(page.locator('header .apply-link')).toBeVisible();
   load.release();await ownerReady(page,info.kind);
   await expect.poll(async()=>(await snapshot(page)).shot.camera).not.toEqual(atHold.shot.camera);
   await expect(page.locator(`[data-copy="${info.copy}"]`)).toHaveAttribute('aria-hidden','false');
   const resumed=await snapshot(page);expect(resumed.progress).toBeCloseTo(held.progress,5);expect(resumed.shot.camera).not.toEqual(atHold.shot.camera);
   expect(requests).toHaveLength(1);expect(issues.errors).toEqual([]);expect(issues.warnings).toEqual([]);
  }finally{load.release();}
 });

 test(`failed ${info.kind} import preserves the service and cannot restart after preferences change`,async({page})=>{
  const issues=monitor(page);await page.route(info.asset,route=>route.abort());await ready(page);await beforeOwner(page,info);
  // Raw scroll: failure intentionally changes document height, so requested-progress polling could race fallback.
  await scroll(page,info.requested);await fallbackVisible(page,info.message);
  await page.emulateMedia({reducedMotion:'reduce'});await page.emulateMedia({reducedMotion:'no-preference'});
  expect((await snapshot(page)).failed).toBe(true);await expect(page.locator('#still-views')).toBeHidden();await expect(page.locator('#pause-motion')).toBeHidden();
  await expect(page.locator('#canvas-host canvas')).toHaveCount(0);expect(issues.errors).toEqual([]);
 });

 test(`${info.kind} import deadline removes the scene and late completion cannot resurrect it`,async({page})=>{
  const load=deferred(),issues=monitor(page);await page.route(info.asset,async route=>{await load.gate;await route.continue().catch(()=>{});});
  try{
   await ready(page);await beforeOwner(page,info);await scroll(page,info.requested);
   await page.waitForFunction(kind=>(window as any).__experience.snapshot()[`${kind}Status`]==='loading',info.kind);
   await page.waitForFunction(()=>(window as any).__experience.snapshot().failed,{},{timeout:15000});await fallbackVisible(page,info.message);
   load.release();await page.waitForTimeout(350);expect((await snapshot(page)).failed).toBe(true);
   await expect(page.locator('#canvas-host canvas')).toHaveCount(0);await expect(page.locator('#inverter-annotations')).toBeHidden();expect(issues.errors).toEqual([]);
  }finally{load.release();}
 });

 test(`rapid keyboard Skip remains at the application after late ${info.kind} completion`,async({page})=>{
  const load=deferred(),issues=monitor(page);await page.route(info.asset,async route=>{await load.gate;await route.continue().catch(()=>{});});
  try{
   await ready(page);await beforeOwner(page,info);await move(page,info.requested);
   await page.waitForFunction(kind=>(window as any).__experience.snapshot()[`${kind}Status`]==='loading',info.kind);
   await page.locator('.skip-link').focus();await page.keyboard.press('Enter');await expect(page.locator('#application-details')).toBeFocused();
   await page.waitForTimeout(150);const time=(await snapshot(page)).ambientTime;load.release();await ownerReady(page,info.kind);await page.waitForTimeout(250);
   await expect(page.locator('#application-details')).toBeFocused();await expect(page.locator('#application-details')).toBeInViewport();
   const s=await snapshot(page);expect(s.ambientTime).toBe(time);expect(s.onscreen).toBe(false);expect(s.failed).toBe(false);expect(issues.errors).toEqual([]);
  }finally{load.release();}
 });

 test(`a delayed ${info.still} still refreshes its selected scene and copy without another click`,async({page})=>{
  const load=deferred(),issues=monitor(page);await page.route(info.asset,async route=>{await load.gate;await route.continue().catch(()=>{});});
  try{
   await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await ready(page);const initialTime=(await snapshot(page)).ambientTime;
   await page.locator(`[data-still="${info.still}"]`).click();await page.waitForFunction(kind=>(window as any).__experience.snapshot()[`${kind}Status`]==='loading',info.kind);
   await expect(page.locator(`[data-copy="${info.copy}"]`)).toHaveAttribute('aria-hidden','true');load.release();await ownerReady(page,info.kind);
   await expect(page.locator(`[data-copy="${info.copy}"]`)).toHaveAttribute('aria-hidden','false');await expect(page.locator(`[data-still="${info.still}"]`)).toHaveAttribute('aria-pressed','true');
   const s=await snapshot(page);expect(s.progress).toBe(info.stillProgress);expect(s.ambientTime).toBe(initialTime);expect(s.shot.pulseOpacity).toBe(0);expect(s.failed).toBe(false);expect(issues.errors).toEqual([]);
  }finally{load.release();}
 });

 for(const cause of ['timeout','context loss'] as const)test(`${info.kind} pending GPU readiness cancels cleanly on ${cause}`,async({page})=>{
  await page.addInitScript(()=>{
   const original=WebGL2RenderingContext.prototype.getProgramParameter,w=window as any;w.__blockWarmup=false;w.__warmupPolls=0;
   WebGL2RenderingContext.prototype.getProgramParameter=function(program,pname){if(pname===0x91B1&&w.__blockWarmup){w.__warmupPolls++;return false;}return original.call(this,program,pname);};
  });
  const issues=monitor(page);await ready(page);await beforeOwner(page,info);
  await page.evaluate(()=>(window as any).__blockWarmup=true);await scroll(page,info.requested);await page.waitForFunction(()=>(window as any).__warmupPolls>0);
  if(cause==='context loss')await page.locator('#canvas-host canvas').evaluate((c:HTMLCanvasElement)=>c.getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext());
  await page.waitForFunction(()=>(window as any).__experience.snapshot().failed,{},{timeout:15000});await fallbackVisible(page,cause==='timeout'?info.message:undefined);
  const polls=await page.evaluate(()=>(window as any).__warmupPolls);await page.waitForTimeout(150);expect(await page.evaluate(()=>(window as any).__warmupPolls)).toBe(polls);
  await page.evaluate(()=>(window as any).__blockWarmup=false);await page.waitForTimeout(150);
  await expect(page.locator('#canvas-host canvas')).toHaveCount(0);expect((await snapshot(page)).failed).toBe(true);expect(issues.errors).toEqual([]);
 });

 test(`context loss in the ready ${info.kind} view leaves the application accessible`,async({page})=>{
  const issues=monitor(page);await ready(page);await move(page,info.requested);await ownerReady(page,info.kind);
  await expect(page.locator(`[data-copy="${info.copy}"]`)).toHaveAttribute('aria-hidden','false');
  await page.locator('#canvas-host canvas').evaluate((c:HTMLCanvasElement)=>c.getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext());
  await fallbackVisible(page);await expect(page.locator('#storage-annotations')).toBeHidden();await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('#still-views')).toBeHidden();expect(issues.errors).toEqual([]);
 });
}

for(const [name,viewport]of[['desktop',{width:1280,height:720}],['portrait',{width:390,height:844}]]as const){
 test(`${name}: four new stills preserve readable HTML, selection, frozen time and old still access`,async({page})=>{
  const issues=monitor(page);await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'reduce'});await ready(page);const time=(await snapshot(page)).ambientTime;
  for(const[still,p,copy]of[['business',4.70,'12'],['storage',5.09,'13'],['connected',5.56,'15'],['aesir',6.03,'18'],['inverter',4.02,'10'],['cell',2.76,'8'],['aesir',6.03,'18']]as const){
   await page.locator(`[data-still="${still}"]`).click();await expect(page.locator(`[data-still="${still}"]`)).toHaveAttribute('aria-pressed','true');
   if(p>4.18)await ownerReady(page,'business');if(p>4.96)await ownerReady(page,'storage');
   await expect(page.locator(`[data-copy="${copy}"]`)).toHaveAttribute('aria-hidden','false');await expect(page.locator('#still-views button[aria-pressed="true"]')).toHaveCount(1);
   const s=await snapshot(page);expect(s.progress).toBe(p);expect(s.ambientTime).toBe(time);expect(s.failed).toBe(false);expect(s.copyOpacities.filter((n:number)=>n>.5)).toHaveLength(1);
   if(p>4.14){expect(s.shot.pulseOpacity).toBe(0);await expect(page.locator('#inverter-annotations')).toBeHidden();}
   if(still==='storage'){expect(s.shot.operation.charge).toBeGreaterThan(0);expect(s.shot.operation.discharge).toBe(0);await expect(page.locator('[data-copy="13"]')).toContainText('OPTIONAL');}
   if(still==='connected'){expect(s.shot.operation.importFlow).toBeGreaterThan(0);expect(s.shot.operation.exportFlow).toBe(0);await expect(page.locator('[data-copy="15"]')).toContainText('WHEN THE GRID SUPPLIES POWER');}
  }
  await expect(page.locator('#pause-motion')).toBeHidden();await expect(page.locator('#journey')).not.toHaveClass(/is-enhanced/);
  await page.locator('.skip-link').focus();await page.keyboard.press('Enter');await expect(page.locator('#application-details')).toBeFocused();await expect(page.locator('.primary-button')).toHaveAttribute('href','/apply.html');
  expect(issues.errors).toEqual([]);expect(issues.warnings).toEqual([]);
 });

 test(`${name}: complete warmed reversal reuses new owners, buffers, textures and requests`,async({page})=>{
  test.setTimeout(90000);const issues=monitor(page),requests:string[]=[];
  page.on('request',r=>{if(r.url().startsWith(origin+'/experience-assets/'))requests.push(r.url());});
  await page.setViewportSize(viewport);await ready(page);await move(page,6.03);await allReady(page);
  const poses=[.925,1.40,1.72,1.94,2.235,2.39,2.52,2.76,2.92,3.09,3.40,3.90,4.02,4.14,4.18,4.25,4.32,4.55,4.70,4.96,5.07,5.25,5.36,5.53,5.70,5.86,6.03];
  // Warm every old/new scene, section, practical-light state, LOD, overlay and shadow before taking the baseline.
  for(const p of poses)await move(page,p);const baseline=await snapshot(page),requestCount=requests.length;
  expect(baseline.business.geometryBytes).toBeGreaterThan(0);expect(baseline.business.geometryBytes).toBeLessThanOrEqual(420000);
  expect(baseline.business.triangles).toBeLessThanOrEqual(22000);expect(baseline.business.drawCalls).toBeLessThanOrEqual(27);expect(baseline.business.pointLights).toBeLessThanOrEqual(2);expect(baseline.business.textureBytes).toBe(0);
  expect(baseline.storage.geometryBytes).toBeGreaterThan(0);expect(baseline.storage.geometryBytes).toBeLessThanOrEqual(220000);expect(baseline.storage.triangles).toBeLessThanOrEqual(14000);expect(baseline.storage.drawCalls).toBeLessThanOrEqual(20);expect(baseline.storage.textureBytes).toBe(0);
  const references=new Map<number,any>();
  for(const[pass,points]of[['forward',poses],['reverse',[...poses].reverse()],['repeat',poses]]as const){
   for(const p of points){await move(page,p);const s=await snapshot(page);expect(s.failed).toBe(false);await expect(page.locator('#canvas-host canvas')).toHaveCount(1);
    expect(s.geometries).toBe(baseline.geometries);expect(s.textures).toBe(baseline.textures);expect(s.shadowEstimatedBytes).toBe(baseline.shadowEstimatedBytes);
    if(pass==='forward')references.set(p,s);else{const expected=references.get(p);expectShotEqual(s.shot,expected.shot);if(s.shot.operation)for(const[k,n]of Object.entries(s.shot.operation))expect(Math.abs((n as number)-expected.shot.operation[k]),k).toBeLessThan(.02);}
    if(p>=2.71)expect(s.shot.pulseOpacity).toBe(0);
    if(s.shot.operation){const o=s.shot.operation;expect(o.charge*o.discharge).toBe(0);expect(o.importFlow*o.exportFlow).toBe(0);expect(o.stored).toBeGreaterThanOrEqual(0);expect(o.stored).toBeLessThanOrEqual(1);}
   }
  }
  expect(requests.length).toBe(requestCount);
  for(const info of assets)expect(requests.filter(url=>info.asset.test(new URL(url).pathname))).toHaveLength(1);
  const end=await snapshot(page);expect(end.business.geometryBytes).toBe(baseline.business.geometryBytes);expect(end.storage).toEqual(baseline.storage);
  for(const kind of ['business','storage']){const timing=end.readiness[kind];expect(timing.status).toBe('ready');for(const key of ['importAndBuildMs','compileMs','totalMs'])expect(Number.isFinite(timing[key]),`${kind}.${key}`).toBe(true);expect(timing.totalMs).toBeGreaterThanOrEqual(timing.compileMs);}
  expect(issues.errors).toEqual([]);expect(issues.warnings).toEqual([]);
 });
}

test('inverter labels clear before business entry and restore when reversing to the inverter',async({page})=>{
 await ready(page);await move(page,4.02);await ownerReady(page,'electrical');await expect(page.locator('#inverter-annotations')).toBeVisible();
 await move(page,4.145);await ownerReady(page,'business');await expect(page.locator('#inverter-annotations')).toBeHidden();
 await move(page,4.55);await expect(page.locator('[data-copy="12"]')).toHaveAttribute('aria-hidden','false');await expect(page.locator('#inverter-annotations')).toBeHidden();
 await move(page,4.02);await expect(page.locator('#inverter-annotations')).toBeVisible();
});

// Graph antialiasing is intentionally left to rendered pixel/visual inspection.
// A regex for fwidth or a projected nominal line width would not prove actual antialiasing.

test('enlarged storage labels fit the viewport and stay separate from the main statement',async({page})=>{
 await page.setViewportSize({width:1280,height:720});await ready(page);
 await page.evaluate(()=>{const sizes=[...document.querySelectorAll<HTMLElement>('h1,h2,p,button,a,[data-storage-label]')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)] as const);for(const[e,size]of sizes)e.style.fontSize=`${size*2}px`;});
 await move(page,5.07);await allReady(page);
 const layout=await page.evaluate(()=>{const copy=document.querySelector('[data-copy="13"]')!;const text:DOMRect[]=[];const walker=document.createTreeWalker(copy,NodeFilter.SHOW_TEXT);while(walker.nextNode()){if(!walker.currentNode.textContent?.trim())continue;const range=document.createRange();range.selectNodeContents(walker.currentNode);text.push(...range.getClientRects());}return [...document.querySelectorAll('[data-storage-label]')].map(e=>{const b=e.getBoundingClientRect();return {text:e.textContent,inViewport:b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight,overlap:text.some(a=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top)};});});
 expect(layout.filter(r=>!r.inViewport||r.overlap)).toEqual([]);
});

test('portrait still controls remain clear of the status message and retain real hit targets',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await ready(page);
 const checks=await page.evaluate(()=>{const status=document.querySelector('#fallback-status')!.getBoundingClientRect();return [...document.querySelectorAll('#still-views button')].map(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {height:r.height,hit:hit===e,overlap:r.left<status.right&&r.right>status.left&&r.top<status.bottom&&r.bottom>status.top};});});
 expect(checks).toHaveLength(12);expect(checks.every(r=>r.height>=44&&r.hit&&!r.overlap)).toBe(true);
});

test('application navigation and browser Back return to a usable ending',async({page})=>{
 await ready(page);await move(page,6.03);await allReady(page);
 await page.locator('header .apply-link').click();await expect(page).toHaveURL(/\/apply\.html$/);
 await page.goBack();await page.waitForFunction(()=>(window as any).__experience?.snapshot().ready);await allReady(page);
 await expect(page.locator('header .apply-link')).toHaveAttribute('href','/apply.html');
 await page.locator('.skip-link').focus();await page.keyboard.press('Enter');await expect(page.locator('#application-details')).toBeFocused();
});


test('cached shadows refresh for first storage readiness, visibility reversal and then remain settled',async({page})=>{
 const load=deferred();await page.route(assets[1].asset,async r=>{await load.gate;await r.continue().catch(()=>{});});
 try{
  await ready(page);await move(page,5.07);await page.waitForFunction(()=>(window as any).__experience.snapshot().storageStatus==='loading');
  const pending=await snapshot(page);expect(pending.shadowCasterKey.endsWith(':1:0')).toBe(true);
  load.release();await ownerReady(page,'storage');await page.waitForTimeout(150);const shown=await snapshot(page);
  expect(shown.shadowCasterKey.endsWith(':1:1')).toBe(true);expect(shown.shadowInvalidations).toBeGreaterThan(pending.shadowInvalidations);
  await page.waitForTimeout(180);expect((await snapshot(page)).shadowInvalidations).toBe(shown.shadowInvalidations);
  await move(page,5.33);await move(page,5.07);const daylight=await snapshot(page);
  await move(page,4.90);const hidden=await snapshot(page);expect(hidden.shadowCasterKey.endsWith(':1:0')).toBe(true);expect(hidden.shadowInvalidations).toBe(daylight.shadowInvalidations+1);
  await move(page,5.07);const again=await snapshot(page);expect(again.shadowCasterKey).toBe(daylight.shadowCasterKey);expect(again.shadowInvalidations).toBe(hidden.shadowInvalidations+1);
 }finally{load.release();}
});

for(const[name,viewport]of[['portrait',{width:390,height:844}],['short',{width:1000,height:500}]]as const)test(`${name}: scientific still notes clear the expanded controls`,async({page})=>{
 await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'reduce'});await ready(page);
 for(const[still,selector]of[['earth','.journey-note'],['cell','.process-note']]as const){
  await page.locator(`[data-still="${still}"]`).click();await expect.poll(async()=>(await snapshot(page))[still==='earth'?'earthStatus':'cellStatus']).toBe('ready');
  const collisions=await page.locator(selector).evaluate(e=>{const a=e.getBoundingClientRect();return [...document.querySelectorAll('#still-views button,#fallback-status')].filter(b=>{const r=b.getBoundingClientRect();return a.left<r.right&&a.right>r.left&&a.top<r.bottom&&a.bottom>r.top;}).map(e=>e.textContent);});
  expect(collisions).toEqual([]);
 }
});
