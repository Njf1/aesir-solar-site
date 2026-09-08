import {test,expect,type Page} from '@playwright/test';
const origin='http://127.0.0.1:4173';const snap=(p:Page)=>p.evaluate(()=>(window as any).__experience.snapshot());
async function move(page:Page,p:number){await page.evaluate(p=>{const j=document.querySelector('#journey') as HTMLElement;scrollTo(0,p/6.08*(j.offsetHeight-innerHeight));},p);await expect.poll(async()=>(await snap(page)).progress).toBeCloseTo(p,2);}
async function ready(page:Page){await page.goto('/?inspect=1');await page.waitForFunction(()=>(window as any).__experience?.snapshot().ready);}
test.beforeEach(async({page})=>{await page.route('**/*',r=>{const q=r.request(),u=new URL(q.url());return u.origin===origin&&!u.pathname.startsWith('/api/')&&q.method()==='GET'?r.continue():r.abort();});});
for(const input of['pointer','keyboard']as const)test(`${input} Pause freezes composition and copy through delayed cell readiness`,async({page})=>{
 let release!:()=>void;const gate=new Promise<void>(r=>release=r);await page.route(/\/cell-[^/]+\.js$/,async r=>{await gate;await r.continue().catch(()=>{});});
 try{await ready(page);await move(page,2.685);await page.waitForFunction(()=>(window as any).__experience.snapshot().cellStatus==='loading');
  const pause=page.locator('#pause-motion');if(input==='pointer')await pause.click();else{await pause.focus();await page.keyboard.press('Enter');}
  const before=await snap(page);expect(before.paused).toBe(true);release();await page.waitForFunction(()=>(window as any).__experience.snapshot().cellStatus==='ready');await page.waitForTimeout(180);
  const after=await snap(page);expect(after.renderedProgress).toBe(before.renderedProgress);expect(after.shot).toEqual(before.shot);expect(after.copyOpacities).toEqual(before.copyOpacities);expect(after.ambientTime).toBe(before.ambientTime);
  await page.evaluate(()=>(window as any).__experience.resetTiming());await page.waitForTimeout(150);expect((await snap(page)).frameIntervals).toHaveLength(0);
  await pause.click();await expect.poll(async()=>(await snap(page)).renderedProgress).toBeCloseTo(2.685,2);expect((await snap(page)).shot.scene).toBe('cell');
 }finally{release();}
});
test('paused contact-to-DC handoff holds the actual view until resumed',async({page})=>{
 await ready(page);await move(page,3.08);await page.waitForFunction(()=>(window as any).__experience.snapshot().electricalStatus==='ready');await move(page,3.074);await page.locator('#pause-motion').focus();await page.keyboard.press('Space');const before=await snap(page);
 await page.evaluate(()=>{const j=document.querySelector('#journey') as HTMLElement;scrollTo(0,3.20/6.08*(j.offsetHeight-innerHeight));});await expect.poll(async()=>(await snap(page)).requestedProgress).toBeCloseTo(3.20,2);await page.waitForTimeout(160);const after=await snap(page);expect(after.shot).toEqual(before.shot);expect(after.renderedProgress).toBe(before.renderedProgress);expect(after.ambientTime).toBe(before.ambientTime);
 await page.keyboard.press('Space');await expect.poll(async()=>(await snap(page)).renderedProgress).toBeCloseTo(3.20,2);
});
test('Pause survives a reduced-motion round trip and delayed cell readiness',async({page})=>{
 let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);
 await page.route(/\/cell-[^/]+\.js$/,async route=>{await gate;await route.continue().catch(()=>{});});
 try{
  await ready(page);await move(page,2.685);await page.waitForFunction(()=>(window as any).__experience.snapshot().cellStatus==='loading');
  const pause=page.locator('#pause-motion');await pause.click();expect((await snap(page)).paused).toBe(true);
  await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('#still-views')).toBeVisible();await expect(pause).toBeHidden();
  await page.emulateMedia({reducedMotion:'no-preference'});await expect(page.locator('#still-views')).toBeHidden();await expect(pause).toBeVisible();
  await expect(pause).toHaveAttribute('aria-pressed','true');await expect(pause).toContainText('Resume motion');
  await expect(page.locator('#fallback-status')).toContainText('Motion paused');
  // The static/scroll layout switch may reposition the page. Pause must lock the
  // composition that was actually rendered in the restored layout, including a
  // loading hold, before an asynchronous owner can finish.
  await expect.poll(async()=>{const s=await snap(page);return s.paused&&s.frozenProgress===s.renderedProgress;}).toBe(true);
  const before=await snap(page);expect(before.cellStatus).toBe('loading');
  release();await page.waitForFunction(()=>(window as any).__experience.snapshot().cellStatus==='ready');await page.waitForTimeout(180);
  const after=await snap(page);expect(after.paused).toBe(true);expect(after.renderedProgress).toBe(before.renderedProgress);expect(after.frozenProgress).toBe(before.frozenProgress);
  expect(after.shot).toEqual(before.shot);expect(after.copyOpacities).toEqual(before.copyOpacities);expect(after.ambientTime).toBe(before.ambientTime);
  await pause.focus();await page.keyboard.press('Enter');await expect(pause).toHaveAttribute('aria-pressed','false');
  await move(page,2.685);await expect.poll(async()=>(await snap(page)).renderedProgress).toBeCloseTo(2.685,2);
  expect((await snap(page)).shot.scene).toBe('cell');expect((await snap(page)).frozenProgress).toBeNull();
 }finally{release();}
});
test('orientation changes obey pixel caps while cached owners remain bounded and reverseable',async({page})=>{
 await page.setViewportSize({width:390,height:844});await ready(page);await move(page,6.03);await page.waitForFunction(()=>(window as any).__experience.snapshot().storageStatus==='ready');const first=await snap(page);
 for(const size of[{width:900,height:390},{width:740,height:900},{width:1000,height:500},{width:390,height:844}]){await page.setViewportSize(size);await expect.poll(async()=>{const q=(await snap(page)).quality;return [q.width,q.height];}).toEqual([size.width,size.height]);await move(page,.32);await expect.poll(async()=>(await snap(page)).renderedProgress).toBeCloseTo(.32,2);await expect.poll(async()=>(await snap(page)).geometries).toBe(first.geometries);await move(page,2.685);await move(page,6.03);await page.waitForTimeout(160);const s=await snap(page);expect(s.failed).toBe(false);expect(s.quality.width*s.quality.height*s.quality.pixelRatio**2).toBeLessThanOrEqual((s.quality.tier==='mobile'?850000:2000000)+1);expect(s.textures).toBe(first.textures);expect(s.geometries).toBe(first.geometries);expect(s.site.textureBytes).toBe(first.site.textureBytes);expect(await page.locator('canvas').count()).toBe(1);}
});


test('a coalesced preference notification cannot stop motion with still controls hidden',async({page})=>{
 await page.addInitScript(()=>{const original=window.matchMedia;window.matchMedia=function(query:string){const m=original.call(window,query),add=m.addEventListener.bind(m);if(query==='(prefers-reduced-motion: reduce)')m.addEventListener=((type:string,listener:any,options:any)=>{if(type!=='change')add(type,listener,options);}) as typeof m.addEventListener;return m;};});
 await ready(page);await move(page,4.20);await page.waitForFunction(()=>(window as any).__experience.snapshot().businessStatus==='ready');await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('#still-views')).toBeVisible();await expect(page.locator('#pause-motion')).toBeHidden();await expect(page.locator('#journey')).toHaveClass(/is-static/);
 await page.locator('[data-still="aesir"]').click();await page.waitForFunction(()=>(window as any).__experience.snapshot().storageStatus==='ready');const before=await snap(page);await page.waitForTimeout(120);expect((await snap(page)).ambientTime).toBe(before.ambientTime);
 await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:740,height:900});await expect(page.locator('#still-views')).toBeHidden();await expect(page.locator('#pause-motion')).toBeVisible();expect((await snap(page)).failed).toBe(false);
});
