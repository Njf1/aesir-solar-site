// Draft destination: tests/browser/stage2.spec.ts. Requires the current assembled preview.
import {test,expect,type Page} from '@playwright/test';
const localOrigin='http://127.0.0.1:4173';
const earthFiles='**/earth-*.webp';
const snapshot=(page:Page)=>page.evaluate(()=>(window as any).__experience.snapshot());
const gotoReady=async(page:Page)=>{await page.goto('/experience?inspect=1');await page.waitForFunction(()=>(window as any).__experience?.snapshot().ready);};
async function move(page:Page,p:number){
 await page.evaluate(p=>{const j=document.querySelector('#journey') as HTMLElement;window.scrollTo(0,j.getBoundingClientRect().top+window.scrollY+p/Number(j.dataset.duration)*(j.offsetHeight-window.innerHeight));},p);
 await expect.poll(async()=>(await snapshot(page)).progress).toBeCloseTo(p,2);
 // Wait for the owner RAF to render the latest scroll state; never drive a second timeline.
 await page.waitForTimeout(120);
}
function nearArray(actual:number[],expected:number[],epsilon=.015){actual.forEach((v,i)=>expect(Math.abs(v-expected[i])).toBeLessThan(epsilon));}
function deferred(){let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);return {gate,release};}
test.beforeEach(async({page})=>{
 await page.route('**/*',route=>new URL(route.request().url()).origin===localOrigin?route.continue():route.abort());
});

test('Sun, flight and Earth copy follow the rendered reversible path',async({page})=>{
 await gotoReady(page);
 await expect(page.locator('[data-copy="0"]')).toHaveAttribute('aria-hidden','false');
 await move(page,.285);await expect(page.locator('[data-copy="1"]')).toHaveAttribute('aria-hidden','false');
 await expect(page.locator('[data-copy="1"] h2')).toContainText('OUR NEAREST');
 await move(page,.55);await expect(page.locator('[data-copy="2"]')).toHaveAttribute('aria-hidden','false');
 const reference=await snapshot(page);
 await move(page,.925);await page.waitForFunction(()=>{const s=(window as any).__experience.snapshot();return s.earthStatus==='ready'&&s.shot.scene==='earth';});
 await expect(page.locator('[data-copy="3"]')).toHaveAttribute('aria-hidden','false');
 await expect(page.locator('[data-copy="3"] h2')).toContainText('SUNLIGHT');
 await page.waitForFunction(()=>(window as any).__experience.snapshot().regionStatus==='ready');
 const complete=await snapshot(page);
 for(const p of [.80,.736,.734,.67,.55,.734,.736,.80,.925,.55]){
  await move(page,p);const state=await snapshot(page);
  expect(state.failed).toBe(false);expect(state.trailHeadError).toBeLessThan(.00002);
  expect(state.geometries).toBe(complete.geometries);
  expect(await page.locator('#canvas-host canvas').count()).toBe(1);
 }
 const reversed=await snapshot(page);
 expect(Math.abs(reversed.progress-reference.progress)).toBeLessThan(.0001);
 for(const key of ['camera','target','pulse','tangent'])nearArray(reversed.shot[key],reference.shot[key]);
 await expect(page.locator('header .apply-link')).toBeVisible();
});

test('Earth is lazy, a delayed load holds a truthful shot, then resumes without another scroll',async({page})=>{
 const load=deferred();const requests:string[]=[];
 await page.route(earthFiles,async route=>{requests.push(route.request().url());await load.gate;await route.continue().catch(()=>{});});
 try{
  await gotoReady(page);expect(requests).toEqual([]);expect((await snapshot(page)).earthStatus).toBe('idle');
  await move(page,.925);await page.waitForFunction(()=>(window as any).__experience.snapshot().earthStatus==='loading');
  expect(requests.length).toBe(2);
  const held=await snapshot(page);expect(held.shot.scene).toBe('solar');expect(held.failed).toBe(false);
  await expect(page.locator('[data-copy="3"]')).toHaveAttribute('aria-hidden','true');
  await expect(page.locator('header .apply-link')).toBeVisible();
  load.release();
  await page.waitForFunction(()=>{const s=(window as any).__experience.snapshot();return s.earthStatus==='ready'&&s.shot.scene==='earth';});
  await expect(page.locator('[data-copy="3"]')).toHaveAttribute('aria-hidden','false');
  expect((await snapshot(page)).progress).toBeCloseTo(held.progress,5);
 }finally{load.release();}
});

test('reduced motion switches Sun and Earth stills after delayed decoding without ambient motion',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 const load=deferred();const requests:string[]=[];
 await page.route(earthFiles,async route=>{requests.push(route.request().url());await load.gate;await route.continue().catch(()=>{});});
 try{
  await gotoReady(page);await expect(page.locator('#still-views')).toBeVisible();await expect(page.locator('#pause-motion')).toBeHidden();
  await expect(page.locator('#journey')).not.toHaveClass(/is-enhanced/);
  const time=(await snapshot(page)).ambientTime;
  await page.locator('[data-still="earth"]').click();
  await expect(page.locator('[data-still="earth"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('[data-still="sun"]')).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('[data-copy="3"]')).toHaveAttribute('aria-hidden','true');
  load.release();
  await page.waitForFunction(()=>{const s=(window as any).__experience.snapshot();return s.earthStatus==='ready'&&s.shot.scene==='earth';});
  await expect(page.locator('[data-copy="3"]')).toHaveAttribute('aria-hidden','false');
  let state=await snapshot(page);expect(state.earth.variant).toBe('mobile');expect(state.earth.decodedImageBytes).toBeGreaterThan(0);expect(state.earth.decodedImageBytes).toBeLessThanOrEqual(10*1024*1024);
  expect(requests.some(url=>url.includes('earth-day-2048'))).toBe(true);expect(requests.some(url=>url.includes('earth-clouds-1024'))).toBe(true);
  expect(requests.some(url=>url.includes('earth-day-4096')||url.includes('earth-clouds-2048'))).toBe(false);
  await page.waitForFunction(()=>(window as any).__experience.snapshot().regionStatus==='ready');state=await snapshot(page);
  const geometryCount=state.geometries;
  await page.waitForTimeout(300);expect((await snapshot(page)).ambientTime).toBe(time);
  await page.locator('[data-still="sun"]').click();expect((await snapshot(page)).shot.scene).toBe('solar');
  await expect(page.locator('[data-copy="1"]')).toHaveAttribute('aria-hidden','false');
  await page.locator('[data-still="earth"]').click();state=await snapshot(page);expect(state.shot.scene).toBe('earth');expect(state.geometries).toBe(geometryCount);
  expect(requests.length).toBe(2);expect(state.ambientTime).toBe(time);
  await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeInViewport();await expect(page.locator('.primary-button')).toBeVisible();
 }finally{load.release();}
});

test('failed Earth assets leave a composed fallback and cannot restart after preference changes',async({page})=>{
 const pageErrors:string[]=[];page.on('pageerror',error=>pageErrors.push(error.message));
 await page.route(earthFiles,route=>route.abort());
 await gotoReady(page);
 await page.evaluate(()=>{const j=document.querySelector('#journey') as HTMLElement;window.scrollTo(0,.55/Number(j.dataset.duration)*(j.offsetHeight-innerHeight));});
 await page.waitForFunction(()=>(window as any).__experience.snapshot().failed);
 await expect(page.locator('.scene-fallback img')).toBeVisible();await expect(page.locator('#fallback-status')).toContainText('Earth');
 expect(await page.locator('canvas').count()).toBe(0);await expect(page.locator('#journey')).not.toHaveClass(/is-enhanced/);
 await page.emulateMedia({reducedMotion:'reduce'});await page.emulateMedia({reducedMotion:'no-preference'});
 await expect(page.locator('#pause-motion')).toBeHidden();await expect(page.locator('#still-views')).toBeHidden();
 expect((await snapshot(page)).failed).toBe(true);expect(pageErrors).toEqual([]);
 await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeInViewport();await expect(page.locator('.primary-button')).toHaveAttribute('href','/apply.html');
});

test('Earth decode timeout is bounded and late bitmaps are disposed without resurrecting the scene',async({page})=>{
 await page.addInitScript(()=>{
  const w=window as any,decode=window.createImageBitmap.bind(window);
  let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);
  w.__releaseEarthDecode=release;w.__earthDecodesWaiting=0;w.__earthDecoded=0;w.__earthClosed=0;
  window.createImageBitmap=((...args:any[])=>{w.__earthDecodesWaiting++;return gate.then(async()=>{
   const bitmap=await (decode as any)(...args);w.__earthDecoded++;const close=bitmap.close.bind(bitmap);
   bitmap.close=()=>{w.__earthClosed++;close();};return bitmap;
  });}) as typeof window.createImageBitmap;
 });
 const pageErrors:string[]=[];page.on('pageerror',error=>pageErrors.push(error.message));
 try{
  await gotoReady(page);await move(page,.925);await page.waitForFunction(()=>(window as any).__earthDecodesWaiting===2);
  await page.waitForFunction(()=>(window as any).__experience.snapshot().failed,{},{timeout:15000});
  expect(await page.locator('canvas').count()).toBe(0);await expect(page.locator('#fallback-status')).not.toBeEmpty();
  await page.evaluate(()=>(window as any).__releaseEarthDecode());
  await page.waitForFunction(()=>{const w=window as any;return w.__earthDecoded===2&&w.__earthClosed===2;});
  expect((await snapshot(page)).failed).toBe(true);expect(await page.locator('canvas').count()).toBe(0);expect(pageErrors).toEqual([]);
  await expect(page.locator('header .apply-link')).toBeVisible();
 }finally{await page.evaluate(()=>(window as any).__releaseEarthDecode?.()).catch(()=>{});}
});

test('conversion service steps and original form contract remain usable',async({page})=>{
 await page.goto('/experience');await page.locator('.skip-link').click();
 await expect(page.locator('.process-steps li > span')).toHaveText(['01','02','03']);
 await expect(page.locator('.process-steps')).toContainText('contact, site and equipment details');
 await expect(page.locator('.process-steps')).toContainText('prepares the Form A1-2 application');
 await expect(page.locator('.process-steps')).toContainText('The operator decides the outcome');
 await expect(page.locator('.price-breakdown')).toContainText('£250 fee + £50 VAT');
 await expect(page.locator('.price')).toContainText('£300');
 await expect(page.locator('.scope-note').first()).toContainText('does not buy a solar installation or guarantee network approval');
 await page.locator('.primary-button').first().click();await expect(page).toHaveURL(/\/apply\.html$/);
 const names=await page.locator('#applyForm [name]').evaluateAll(elements=>elements.map(e=>e.getAttribute('name')));
 expect(names).toEqual(expect.arrayContaining(['company','contact','email','phone','accreditation','address','postcode','mpan','inverter','typetest','kw','phases','storage','target','g100','eps','notes','agree','privacy']));
 await expect(page.locator('#agree')).toHaveAttribute('required','');await expect(page.locator('#privacy')).toHaveAttribute('required','');
 expect(await page.locator('canvas').count()).toBe(0);
 // This test never submits the form or invokes a payment provider.
});

test('enlarged text reflows without clipping the statement or its supporting sentence',async({page})=>{
 await page.setViewportSize({width:1280,height:720});await gotoReady(page);
 await page.evaluate(()=>{for(const e of document.querySelectorAll<HTMLElement>('h1,h2,h3,p,button,a,li'))e.style.fontSize=`${parseFloat(getComputedStyle(e).fontSize)*2}px`;});
 await expect(page.locator('body')).toHaveAttribute('data-large-type','true');
 for(const p of [.24,.55,.935]){
  await move(page,p);await page.waitForFunction(()=>(window as any).__experience.snapshot().earthStatus==='ready');
  const layout=await page.evaluate(()=>{
   const panel=[...document.querySelectorAll<HTMLElement>('[data-copy]')].find(e=>parseFloat(e.style.opacity)>.15)!;
   const bottom=Math.max(...[...panel.children].map(e=>e.getBoundingClientRect().bottom));
   return {bottom,footer:document.querySelector('.chapter-footer')!.getBoundingClientRect().top,width:document.documentElement.scrollWidth,viewport:innerWidth};
  });
  expect(layout.bottom).toBeLessThan(layout.footer);expect(layout.width).toBe(layout.viewport);
 }
 await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeFocused();
});
