import {test,expect,type Page} from '@playwright/test';
test.use({isMobile:true,hasTouch:true,deviceScaleFactor:1});
test.beforeEach(async({page})=>{
 await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin==='http://127.0.0.1:4173'&&!u.pathname.startsWith('/api/')?r.continue():r.abort();});
});
const snap=(page:Page)=>page.evaluate(()=>(window as any).__experience.snapshot());
async function boot(page:Page,width:number,height:number,difference=0){
 await page.setViewportSize({width,height});
 const cdp=await page.context().newCDPSession(page);
 let release!:()=>void;const gate=new Promise<void>(r=>release=r);
 await page.route('**/scene-*.js',async r=>{await gate;await r.continue().catch(()=>{});});
 try{
  await page.goto('/?inspect=1',{waitUntil:'domcontentloaded'});
  // The protocol override belongs to the loaded frame, not its preceding about:blank.
  await cdp.send('Emulation.setSmallViewportHeightDifferenceOverride',{difference});
  release();await page.waitForFunction(()=>(window as any).__experience?.snapshot().ready);
 }finally{release();}
 return cdp;
}
async function move(page:Page,p:number){
 await page.evaluate(p=>{const j=document.querySelector('#journey') as HTMLElement,s=document.querySelector('#stage') as HTMLElement;scrollTo(0,p/6.08*(j.offsetHeight-s.offsetHeight));},p);
 await expect.poll(async()=>(await snap(page)).renderedProgress).toBeCloseTo(p,2);
}
async function fillsViewport(page:Page){
 await expect.poll(()=>page.evaluate(()=>{
  const s=document.querySelector('#stage')!.getBoundingClientRect(),c=document.querySelector('canvas')!.getBoundingClientRect();
  const q=(window as any).__experience.snapshot().quality,buffer=document.querySelector('canvas')!;
  return Math.max(Math.abs(s.top),Math.abs(s.bottom-visualViewport!.height),Math.abs(c.bottom-s.bottom),Math.abs(c.width-innerWidth),Math.abs(q.height-s.height),Math.abs(buffer.height-Math.floor(q.height*q.pixelRatio)),Math.abs(buffer.width-Math.floor(q.width*q.pixelRatio)));
 })).toBeLessThanOrEqual(1);
 const m=await page.evaluate(()=>{
  const q=(window as any).__experience.snapshot().quality,c=document.querySelector('canvas')!,f=document.querySelector('.chapter-footer')!.getBoundingClientRect(),a=document.querySelector('header .apply-link')!.getBoundingClientRect();
  return {pixels:c.width*c.height,budget:q.tier==='mobile'?850000:2000000,overflow:document.documentElement.scrollWidth-innerWidth,controls:[f,a].every(r=>r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=visualViewport!.height+1)};
 });
 expect(m.pixels).toBeLessThanOrEqual(m.budget);expect(m.overflow).toBeLessThanOrEqual(1);expect(m.controls).toBe(true);
}

for(const [width,height,difference] of [[280,653,100],[320,568,100],[360,800,120],[390,780,125],[412,915,160],[430,932,140],[600,600,0],[740,900,100],[820,1180,120],[667,375,60],[844,390,70],[1000,500,80],[1280,720,0],[1600,1000,0],[2560,1080,0]]){
 test(`full canvas with collapsed browser bars at ${width}×${height}, small viewport −${difference}px`,async({page})=>{
  await boot(page,width,height,difference);await fillsViewport(page);
  for(const p of [.15,.295,.315,.36,.295]){await move(page,p);await fillsViewport(page);}
 });
}

test('toolbar expansion/collapse preserves distance, direction and paused pixels',async({page})=>{
 const cdp=await boot(page,390,655);await move(page,.315);await page.locator('#pause-motion').click();
 const paused=await snap(page);
 const travel=await page.evaluate(()=>{const j=document.querySelector('#journey') as HTMLElement,s=document.querySelector('#stage') as HTMLElement;return j.offsetHeight-s.offsetHeight;});
 for(const height of [680,705,730,755,780,755,730,705,680,655]){
  await page.setViewportSize({width:390,height});await cdp.send('Emulation.setSmallViewportHeightDifferenceOverride',{difference:height-655});
  await fillsViewport(page);
  expect(await page.evaluate(()=>{const j=document.querySelector('#journey') as HTMLElement,s=document.querySelector('#stage') as HTMLElement;return j.offsetHeight-s.offsetHeight;})).toBe(travel);
  const state=await snap(page);expect(state.ambientTime).toBe(paused.ambientTime);expect(state.renderedProgress).toBe(paused.renderedProgress);expect(state.shot).toEqual(paused.shot);
 }
 await page.evaluate(()=>(window as any).__experience.resetTiming());await page.waitForTimeout(150);expect((await snap(page)).frameIntervals).toEqual([]);
 await page.locator('#pause-motion').click();await move(page,.295);await fillsViewport(page);
});

test('rotation keeps the same chapter while camera projection and canvas resize',async({page})=>{
 const cdp=await boot(page,390,844,125);await move(page,.295);
 for(const [width,height,difference] of [[844,390,60],[390,844,125],[740,900,100],[390,844,125]]){
  await page.setViewportSize({width,height});await cdp.send('Emulation.setSmallViewportHeightDifferenceOverride',{difference});
  await fillsViewport(page);await page.waitForTimeout(350);
  expect((await snap(page)).renderedProgress).toBeCloseTo(.295,2);
 }
});

test('last frame fills the viewport and hands off without an empty pinned tail',async({page})=>{
 await boot(page,390,844,140);await move(page,6.03);await fillsViewport(page);
 await move(page,6.08);await fillsViewport(page);
 const boundary=await page.evaluate(()=>({offer:document.querySelector('#application-details')!.getBoundingClientRect().top,bottom:document.querySelector('#stage')!.getBoundingClientRect().bottom}));
 expect(Math.abs(boundary.offer-boundary.bottom)).toBeLessThanOrEqual(1);
 await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeFocused();
});

test('reduced motion stills fill the dynamic viewport with no long scroll',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await boot(page,390,844,125);
 await fillsViewport(page);expect(await page.locator('#journey').evaluate(e=>e.clientHeight)).toBe(844);
 for(const name of ['sun','cell','business','aesir']){await page.locator(`[data-still="${name}"]`).click();await page.waitForTimeout(200);await fillsViewport(page);}
 await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeInViewport();
});

test('unavailable WebGL preserves a full-height fallback and immediate application',async({page})=>{
 await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type:any,...args:any[]){if(String(type).startsWith('webgl'))return null;return (original as any).call(this,type,...args);};});
 await page.setViewportSize({width:390,height:844});await page.goto('/?inspect=1');await page.waitForFunction(()=>(window as any).__experience?.snapshot().failed);
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setSmallViewportHeightDifferenceOverride',{difference:125});
 await expect.poll(()=>page.locator('#stage').evaluate(e=>e.clientHeight)).toBe(844);
 await expect(page.locator('.scene-fallback img')).toBeVisible();await expect(page.locator('header .apply-link')).toBeVisible();
 await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeFocused();
});

test('no-JavaScript picture fills the current viewport when browser bars retract',async({browser})=>{
 const page=await browser.newPage({javaScriptEnabled:false,isMobile:true,viewport:{width:390,height:844}});
 await page.goto('http://127.0.0.1:4173/');const cdp=await page.context().newCDPSession(page);
 await cdp.send('Emulation.setSmallViewportHeightDifferenceOverride',{difference:125});
 await expect.poll(()=>page.locator('#stage').evaluate(e=>e.clientHeight)).toBe(844);
 await expect(page.locator('.scene-fallback img')).toBeVisible();await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeInViewport();await page.close();
});

test('pinch zoom retains canvas coverage without resetting the journey',async({page})=>{
 const cdp=await boot(page,390,844,125);await move(page,.295);const before=await snap(page);
 for(const scale of [2,1.5,1]){
  await cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:scale});await page.waitForTimeout(150);
  const coverage=await page.locator('canvas').evaluate(e=>{const r=e.getBoundingClientRect(),v=visualViewport!;return r.left<=v.offsetLeft&&r.top<=v.offsetTop&&r.right>=v.offsetLeft+v.width-1&&r.bottom>=v.offsetTop+v.height-1;});
  expect(coverage).toBe(true);expect((await snap(page)).renderedProgress).toBe(before.renderedProgress);
 }
});

test('rotation after Skip keeps the offer focused and rendering suspended',async({page})=>{
 const cdp=await boot(page,390,844,125);await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeFocused();
 await expect.poll(async()=>(await snap(page)).onscreen).toBe(false);
 await page.setViewportSize({width:844,height:390});await cdp.send('Emulation.setSmallViewportHeightDifferenceOverride',{difference:60});await page.waitForTimeout(400);
 await expect(page.locator('#application-details')).toBeInViewport();await expect(page.locator('#application-details')).toBeFocused();
 await page.evaluate(()=>(window as any).__experience.resetTiming());await page.waitForTimeout(150);expect((await snap(page)).frameIntervals).toEqual([]);
});

test.describe('high-density mobile screen',()=>{
 test.use({deviceScaleFactor:3});
 test('the bounded drawing buffer covers the complete CSS viewport',async({page})=>{
  await boot(page,430,932,140);await move(page,.315);await fillsViewport(page);
  const s=await snap(page);expect(s.quality.pixelRatio).toBeLessThanOrEqual(1.25);expect(await page.evaluate(()=>devicePixelRatio)).toBe(3);
 });
});
