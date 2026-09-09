import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
 await page.route('**/*',route=>{
  const url=new URL(route.request().url());
  return url.origin==='http://127.0.0.1:4173'&&!url.pathname.startsWith('/api/')?route.continue():route.abort();
 });
});

for(const [width,height] of [[1280,720],[1600,1000],[390,844],[740,900],[1000,500]]){
 test(`first paint waits for the distant Sun at ${width}×${height}`,async({page})=>{
  await page.setViewportSize({width,height});
  let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);
  await page.route('**/scene-*.js',async route=>{await gate;await route.continue().catch(()=>{});});
  await page.addInitScript(()=>{
   (window as any).__startupFrames=[];
   const sample=()=>{
    const stage=document.querySelector('#stage'),poster=document.querySelector('.scene-fallback'),canvas=document.querySelector('#canvas-host');
    if(stage&&poster&&canvas){
     const state=(window as any).__experience?.snapshot();
     (window as any).__startupFrames.push({poster:getComputedStyle(poster).visibility,canvas:Number(getComputedStyle(canvas).opacity),ready:state?.ready,progress:state?.renderedProgress,camera:state?.shot?.camera});
    }
    if((window as any).__startupFrames.length<200)requestAnimationFrame(sample);
   };requestAnimationFrame(sample);
  });
  try{
   await page.goto('/?inspect=1',{waitUntil:'domcontentloaded'});
   await page.locator('.scene-fallback img').evaluate((img:HTMLImageElement)=>img.decode());
   await expect(page.locator('.scene-fallback img')).toBeHidden();
   await expect(page.locator('h1')).toBeVisible();
   await expect(page.locator('header .apply-link')).toHaveAttribute('href','/apply.html');
   await expect(page.locator('.skip-link')).toBeVisible();
   await expect(page.locator('#canvas-host')).toHaveCSS('opacity','0');
   await page.waitForTimeout(150);release();
   await page.waitForFunction(()=>(window as any).__experience?.snapshot().ready);
   await expect(page.locator('#canvas-host')).toHaveCSS('opacity','1');
   const frames=await page.evaluate(()=>(window as any).__startupFrames);
   expect(frames.some((f:any)=>!f.ready)).toBe(true);
   expect(frames.every((f:any)=>f.poster==='hidden')).toBe(true);
   const visible=frames.filter((f:any)=>f.canvas>0);
   expect(visible.length).toBeGreaterThan(0);
   for(const f of visible){expect(f.ready).toBe(true);expect(f.progress).toBe(0);expect(f.camera[2]).toBeGreaterThan(1199);}
   await page.evaluate(()=>{const j=document.querySelector('#journey') as HTMLElement;scrollTo(0,.15/6.08*(j.offsetHeight-innerHeight));});
   await page.waitForFunction(()=>(window as any).__experience.snapshot().renderedProgress>.14);
   expect(await page.evaluate(()=>(window as any).__experience.snapshot().shot.camera[2])).toBeLessThan(300);
  }finally{release();}
 });
}

test('failed renderer reveals the deliberate still only after failure',async({page})=>{
 await page.route('**/scene-*.js',route=>route.abort());
 await page.goto('/?inspect=1');
 await expect(page.locator('#stage')).toHaveClass(/is-fallback/);
 await expect(page.locator('.scene-fallback img')).toBeVisible();
 await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeFocused();
});

test('no JavaScript keeps the composed still and immediate application',async({browser})=>{
 const page=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
 await page.goto('http://127.0.0.1:4173/');
 await expect(page.locator('.scene-fallback img')).toBeVisible();
 await expect(page.locator('header .apply-link')).toHaveAttribute('href','/apply.html');
 await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeInViewport();
 await page.close();
});

test('reload and returning from the application preserve the distant opening',async({page})=>{
 await page.goto('/?inspect=1');
 for(let visit=0;visit<3;visit++){
  await page.waitForFunction(()=>(window as any).__experience?.snapshot().ready);
  await expect(page.locator('.scene-fallback img')).toBeHidden();
  expect(await page.evaluate(()=>(window as any).__experience.snapshot().shot.camera[2])).toBeGreaterThan(1199);
  if(visit===0)await page.reload();
  if(visit===1){await page.locator('header .apply-link').click();await expect(page).toHaveURL(/apply.html/);await page.goBack();}
 }
});
