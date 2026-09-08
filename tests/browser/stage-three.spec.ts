import {test,expect,type Page} from '@playwright/test';
const origin='http://127.0.0.1:4173';
const snapshot=(page:Page)=>page.evaluate(()=>(window as any).__experience.snapshot());
async function ready(page:Page){await page.goto('/experience?inspect=1');await page.waitForFunction(()=>(window as any).__experience?.snapshot().ready);}
async function scroll(page:Page,p:number){
 await page.evaluate(p=>{const j=document.querySelector('#journey') as HTMLElement;window.scrollTo(0,j.getBoundingClientRect().top+scrollY+p/Number(j.dataset.duration)*(j.offsetHeight-innerHeight));},p);
}
async function move(page:Page,p:number){
 await scroll(page,p);
 await expect.poll(async()=>(await snapshot(page)).progress).toBeCloseTo(p,2);
 await page.waitForTimeout(120);
}
function deferred(){let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);return {gate,release};}
async function allReady(page:Page){await page.waitForFunction(()=>{const s=(window as any).__experience.snapshot();return s.siteStatus==='ready'&&s.regionStatus==='ready'&&s.earthStatus==='ready';});}
test.beforeEach(async({page})=>{await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());});

for(const [kind,asset,heldScene] of [['region','**/region-land-*.json','earth'],['site',/\/site-(?!layout-)[^/]+\.js$/,'region']] as const){
 test(`delayed ${kind} assets hold a truthful earlier view then resume without another scroll`,async({page})=>{
  const load=deferred(),requests:string[]=[];
  await page.route(asset,async route=>{requests.push(route.request().url());await load.gate;await route.continue().catch(()=>{});});
  try{
   await ready(page);expect(requests).toEqual([]);await move(page,2.12);
   await page.waitForFunction(kind=>(window as any).__experience.snapshot()[`${kind}Status`]==='loading',kind);
   await expect.poll(()=>requests.length).toBe(1);await expect.poll(async()=>(await snapshot(page)).shot.scene).toBe(heldScene);
   const held=await snapshot(page);expect(held.failed).toBe(false);expect(held.shot.scene).toBe(heldScene);
   await expect(page.locator('[data-copy="6"]')).toHaveAttribute('aria-hidden','true');
   await expect(page.locator('header .apply-link')).toBeVisible();
   load.release();await allReady(page);
   await expect.poll(async()=>(await snapshot(page)).shot.scene).toBe('site');
   await expect(page.locator('[data-copy="6"]')).toHaveAttribute('aria-hidden','false');
   expect((await snapshot(page)).progress).toBeCloseTo(held.progress,5);expect(requests.length).toBe(1);
  }finally{load.release();}
 });
}

test('reversing both cloud handoffs reuses warmed resources and exactly restores the authored shots',async({page})=>{
 await ready(page);await move(page,1.4);await page.waitForFunction(()=>(window as any).__experience.snapshot().regionStatus==='ready');await move(page,2.15);await allReady(page);
 // Render each region and both array/detail distances once before taking memory baselines.
 for(const p of [.925,1.29,1.31,1.4,1.54,1.56,1.72,1.94,2.25,2.15])await move(page,p);
 const reference=await snapshot(page),before={geometries:reference.geometries,textures:reference.textures};
 for(const p of [2.25,2.10,1.94,1.72,1.56,1.54,1.4,1.31,1.29,.925,1.29,1.31,1.4,1.54,1.56,1.72,1.94,2.15]){
  await move(page,p);const s=await snapshot(page);expect(s.failed).toBe(false);expect(s.trailHeadError).toBeLessThan(.00005);
  expect(s.geometries).toBe(before.geometries);expect(s.textures).toBe(before.textures);await expect(page.locator('#canvas-host canvas')).toHaveCount(1);
 }
 const reversed=await snapshot(page);for(const key of ['camera','target','pulse','tangent','up'])reversed.shot[key].forEach((n:number,i:number)=>expect(Math.abs(n-reference.shot[key][i])).toBeLessThan(.02));
});

test('all five reduced-motion stills have matching readable HTML and no advancing ambient time',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await ready(page);
 const initialTime=(await snapshot(page)).ambientTime;
 for(const [name,scene,copy] of [['sun','solar','1'],['earth','earth','3'],['britain','region','4'],['roof','site','5'],['panel','site','6'],['britain','region','4'],['sun','solar','1']] as const){
  await page.locator(`[data-still="${name}"]`).click();await expect(page.locator(`[data-still="${name}"]`)).toHaveAttribute('aria-pressed','true');
  await expect.poll(async()=>(await snapshot(page)).shot.scene).toBe(scene);
  await expect(page.locator(`[data-copy="${copy}"]`)).toHaveAttribute('aria-hidden','false');
  await expect(page.locator(`#still-views button[aria-pressed="true"]`)).toHaveCount(1);
  const s=await snapshot(page);expect(s.ambientTime).toBe(initialTime);expect(s.failed).toBe(false);
 }
 await expect(page.locator('#pause-motion')).toBeHidden();await expect(page.locator('#journey')).not.toHaveClass(/is-enhanced/);
 await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeFocused();await expect(page.locator('.primary-button')).toHaveAttribute('href','/apply.html');
});

for(const [kind,asset,message] of [['region','**/region-land-*.json','regional view'],['site',/\/site-(?!layout-)[^/]+\.js$/,'roof view']] as const){
 test(`failed ${kind} assets preserve the service and cannot restart after preferences change`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await page.route(asset,route=>route.abort());
  await ready(page);await scroll(page,2.12);await page.waitForFunction(()=>(window as any).__experience.snapshot().failed);
  await expect(page.locator('#fallback-status')).toContainText(message);await expect(page.locator('#canvas-host canvas')).toHaveCount(0);
  await expect(page.locator('#application-details')).toBeInViewport();await expect(page.locator('.primary-button')).toHaveAttribute('href','/apply.html');
  await page.emulateMedia({reducedMotion:'reduce'});await page.emulateMedia({reducedMotion:'no-preference'});
  expect((await snapshot(page)).failed).toBe(true);await expect(page.locator('#still-views')).toBeHidden();await expect(page.locator('#pause-motion')).toBeHidden();expect(errors).toEqual([]);
 });
}

test('rapid keyboard skip stays at the application while regional loading finishes offscreen',async({page})=>{
 const load=deferred();await page.route('**/region-land-*.json',async route=>{await load.gate;await route.continue().catch(()=>{});});
 try{await ready(page);await move(page,2.12);await page.waitForFunction(()=>(window as any).__experience.snapshot().regionStatus==='loading');
  await page.locator('.skip-link').focus();await page.keyboard.press('Enter');await expect(page.locator('#application-details')).toBeFocused();
  await page.waitForTimeout(150);const time=(await snapshot(page)).ambientTime;load.release();await allReady(page);await page.waitForTimeout(250);
  await expect(page.locator('#application-details')).toBeInViewport();expect((await snapshot(page)).ambientTime).toBe(time);expect((await snapshot(page)).onscreen).toBe(false);
 }finally{load.release();}
});
for(const [kind,asset]of [['region','**/region-land-*.json'],['site',/\/site-(?!layout-)[^/]+\.js$/]]as const){
 test(`${kind} loading is bounded and late completion cannot resurrect disposed resources`,async({page})=>{
  const load=deferred();await page.route(asset,async route=>{await load.gate;await route.continue().catch(()=>{});});
  try{await ready(page);await move(page,2.12);await page.waitForFunction(()=>(window as any).__experience.snapshot().failed,{},{timeout:15000});
   await expect(page.locator('#canvas-host canvas')).toHaveCount(0);await expect(page.locator('#application-details')).toBeInViewport();load.release();await page.waitForTimeout(350);
   expect((await snapshot(page)).failed).toBe(true);await expect(page.locator('#canvas-host canvas')).toHaveCount(0);await expect(page.locator('header .apply-link')).toBeVisible();
  }finally{load.release();}
 });
}
test('new scene copy remains separate from controls with enlarged text',async({page})=>{
 await page.setViewportSize({width:1280,height:720});await ready(page);
 await page.evaluate(()=>{for(const e of document.querySelectorAll<HTMLElement>('h1,h2,h3,p,button,a,li'))e.style.fontSize=`${parseFloat(getComputedStyle(e).fontSize)*2}px`;});
 for(const p of [1.13,1.4,1.72,2.12]){
  await move(page,p);if(p>1.49)await allReady(page);else await page.waitForFunction(()=>(window as any).__experience.snapshot().regionStatus==='ready');
  const layout=await page.evaluate(()=>{const panel=[...document.querySelectorAll<HTMLElement>('[data-copy]')].find(e=>parseFloat(e.style.opacity)>.15)!;return{bottom:Math.max(...[...panel.children].map(e=>e.getBoundingClientRect().bottom)),footer:document.querySelector('.chapter-footer')!.getBoundingClientRect().top,width:document.documentElement.scrollWidth,viewport:innerWidth};});
  expect(layout.bottom).toBeLessThan(layout.footer);expect(layout.width).toBe(layout.viewport);
 }
});

for(const cause of ['timeout','context loss']){
 test(`pending GPU shader readiness cancels cleanly on ${cause}`,async({page})=>{
  await page.addInitScript(()=>{const original=WebGL2RenderingContext.prototype.getProgramParameter;const w=window as any;w.__blockWarmup=false;w.__warmupPolls=0;
   WebGL2RenderingContext.prototype.getProgramParameter=function(program,pname){if(pname===0x91B1&&w.__blockWarmup){w.__warmupPolls++;return false;}return original.call(this,program,pname);};
  });
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);await move(page,1.2);await page.waitForFunction(()=>(window as any).__experience.snapshot().regionStatus==='ready');
  await page.evaluate(()=>(window as any).__blockWarmup=true);await move(page,2.12);await page.waitForFunction(()=>(window as any).__warmupPolls>0);
  if(cause==='context loss')await page.locator('#canvas-host canvas').evaluate((c:HTMLCanvasElement)=>c.getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext());
  await page.waitForFunction(()=>(window as any).__experience.snapshot().failed,{},{timeout:15000});await expect(page.locator('#canvas-host canvas')).toHaveCount(0);
  await page.evaluate(()=>(window as any).__blockWarmup=false);await page.waitForTimeout(150);expect(errors).toEqual([]);await expect(page.locator('#application-details')).toBeInViewport();
 });
}
