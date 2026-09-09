import {test,expect,type Page} from '@playwright/test';

async function startSamples(page:Page){
 await page.evaluate(()=>{
  (window as any).__footerSamples=[];(window as any).__sampleFooter=true;
  function sample(){
   if(!(window as any).__sampleFooter)return;
   const f=document.querySelector('.chapter-footer')!.getBoundingClientRect(),s=document.querySelector('#stage')!.getBoundingClientRect();
   (window as any).__footerSamples.push({y:f.top-s.top,bottom:f.bottom-s.top,height:s.height});requestAnimationFrame(sample);
  }sample();
 });
}
async function samples(page:Page){return page.evaluate(()=>{(window as any).__sampleFooter=false;return (window as any).__footerSamples as {y:number,bottom:number,height:number}[];});}
async function settled(page:Page){
 await expect.poll(()=>page.locator('.chapter-footer').evaluate(e=>({
  running:e.getAnimations().filter(a=>a.playState==='running').length,
  gap:Math.round(document.querySelector('#stage')!.getBoundingClientRect().bottom-e.getBoundingClientRect().bottom),
 }))).toEqual({running:0,gap:28});
}
export function footerTests(engine:string){
 test.beforeEach(async({page})=>{
  await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin==='http://127.0.0.1:4173'&&!u.pathname.startsWith('/api/')&&r.request().method()==='GET'?r.continue():r.abort();});
  await page.setViewportSize({width:390,height:719});
 });
 async function boot(page:Page){await page.goto('/?inspect=1');await page.waitForFunction(()=>(window as any).__experience?.snapshot().ready);await page.waitForTimeout(500);}
 test(`${engine}: bottom controls glide through an abrupt browser-height expansion`,async({page})=>{
  await boot(page);await startSamples(page);
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(700);
  const frames=await samples(page),start=frames[0].y,end=frames.at(-1)!.y;
  expect(end-start).toBeCloseTo(125,0);
  const intermediate=frames.filter(f=>f.height===844&&f.y>start+2&&f.y<end-2);
  expect(new Set(intermediate.map(f=>Math.round(f.y))).size).toBeGreaterThanOrEqual(4);
  expect(Math.max(...frames.slice(1).map((f,i)=>Math.abs(f.y-frames[i].y)))).toBeLessThan(80);
  expect(frames.every(f=>f.bottom<=f.height+1)).toBe(true);await settled(page);
 });
 test(`${engine}: rapid toolbar reversal stays contained and leaves no animation running`,async({page})=>{
  await boot(page);await startSamples(page);
  for(const height of [744,794,844,769,819,744,719]){await page.setViewportSize({width:390,height});await page.waitForTimeout(65);}
  await page.waitForTimeout(650);const frames=await samples(page);
  expect(frames.every(f=>f.y>=0&&f.bottom<=f.height+1)).toBe(true);await settled(page);
  expect(await page.locator('header .apply-link').getAttribute('href')).toBe('/apply.html');
 });
 test(`${engine}: Pause and reduced motion settle controls without a continuing animation`,async({page})=>{
  await boot(page);await page.locator('#pause-motion').focus();await page.keyboard.press('Enter');
  const before=await page.evaluate(()=>(window as any).__experience.snapshot());
  await page.setViewportSize({width:390,height:844});await settled(page);
  const after=await page.evaluate(()=>(window as any).__experience.snapshot());
  expect(after.ambientTime).toBe(before.ambientTime);expect(after.renderedProgress).toBe(before.renderedProgress);
  await page.evaluate(()=>(window as any).__experience.resetTiming());await page.waitForTimeout(180);
  expect((await page.evaluate(()=>(window as any).__experience.snapshot())).frameIntervals).toEqual([]);
  await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('#still-views')).toBeVisible();
  await page.setViewportSize({width:390,height:719});await expect.poll(()=>page.locator('body').getAttribute('data-framing')).toBe('portrait');await settled(page);
  const grid=await page.locator('#still-views').boundingBox();expect(grid!.y+grid!.height).toBeLessThanOrEqual(719);
  await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeFocused();
 });
 test(`${engine}: rotation and enlarged controls reflow directly into the available screen`,async({page})=>{
  await boot(page);await page.setViewportSize({width:390,height:844});await page.waitForTimeout(80);
  await page.setViewportSize({width:1000,height:500});
  await expect.poll(()=>page.locator('body').getAttribute('data-framing')).toBe('short');
  await expect.poll(()=>page.locator('.chapter-footer').evaluate(e=>e.getAnimations().length)).toBe(0);
  await page.addStyleTag({content:'.scroll-cue,#pause-motion{font-size:22px!important}'});
  await page.setViewportSize({width:390,height:719});await expect.poll(()=>page.locator('body').getAttribute('data-framing')).toBe('portrait');await settled(page);
  const f=await page.locator('.chapter-footer').boundingBox();expect(f!.y+f!.height).toBeLessThanOrEqual(719);expect(f!.x+f!.width).toBeLessThanOrEqual(390);
  await page.locator('#pause-motion').focus();await page.keyboard.press('Enter');await expect(page.locator('#pause-motion')).toHaveAttribute('aria-pressed','true');
 });
 test(`${engine}: footer works during delayed loading; Skip and failure release its animation`,async({page})=>{
  let release!:()=>void;const gate=new Promise<void>(r=>release=r);
  await page.route('**/scene-*.js',async r=>{await gate;await r.abort().catch(()=>{});});
  try{
   await page.goto('/?inspect=1',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector<HTMLElement>('.chapter-footer')!.style.transform!=='');
   await startSamples(page);await page.setViewportSize({width:390,height:844});await page.waitForTimeout(700);
   const frames=await samples(page);
   expect(new Set(frames.map(f=>Math.round(f.y))).size).toBeGreaterThanOrEqual(5);
   await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeFocused();
   release();await page.waitForFunction(()=>(window as any).__experience?.snapshot().failed);
   expect(await page.locator('.chapter-footer').evaluate(e=>({animations:e.getAnimations().length,transform:(e as HTMLElement).style.transform}))).toEqual({animations:0,transform:''});
   await expect(page.locator('header .apply-link')).toHaveAttribute('href','/apply.html');
  }finally{release();}
 });
 test(`${engine}: context loss during the glide disposes the effect and retains application access`,async({page})=>{
  await boot(page);await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>page.locator('.chapter-footer').evaluate(e=>e.getAnimations().length)).toBe(1);
  await page.locator('canvas').evaluate(e=>e.getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext());
  await page.waitForFunction(()=>(window as any).__experience.snapshot().failed);
  expect(await page.locator('.chapter-footer').evaluate(e=>({animations:e.getAnimations().length,transform:(e as HTMLElement).style.transform}))).toEqual({animations:0,transform:''});
  await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeFocused();
 });
}
