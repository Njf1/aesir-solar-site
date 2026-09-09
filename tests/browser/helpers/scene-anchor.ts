import {test,expect,type Page} from '@playwright/test';
import {Matrix4,Vector3} from 'three';
export async function sunPixels(page:Page){
 const data=(await page.screenshot()).toString('base64');
 return page.evaluate(async data=>{
  const img=new Image();img.src=`data:image/png;base64,${data}`;await img.decode();
  const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
  const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0);const rgba=ctx.getImageData(0,0,img.width,img.height).data;
  let x=0,y=0,n=0;const rows:number[]=[];
  for(let py=270;py<img.height-20;py++)for(let px=40;px<img.width-40;px++){
   const i=(py*img.width+px)*4,r=rgba[i],g=rgba[i+1],b=rgba[i+2];
   if(r>160&&g>115&&r-b>22){x+=px;y+=py;n++;rows.push(py);}
  }
  // Compare the disc's bright core, excluding isolated prominence/glow pixels
  // whose visibility changes under the viewport-relative readability gradient.
  return {x:x/n,y:y/n,height:rows[Math.floor(n*.9)]-rows[Math.floor(n*.1)],count:n};
 },data);
}
export async function anchorBoot(page:Page){
 await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin==='http://127.0.0.1:4173'&&!u.pathname.startsWith('/api/')&&r.request().method()==='GET'?r.continue():r.abort();});
 await page.setViewportSize({width:390,height:719});await page.goto('/?inspect=1');
 // Desktop automation has no browser toolbar. Hold its small viewport constant
 // while changing the visible viewport; both CSS layout and camera read this.
 await page.evaluate(()=>document.documentElement.style.setProperty('--scroll-unit','7.19px'));
 await page.waitForFunction(()=>(window as any).__experience?.snapshot().ready);
 await page.locator('#canvas-host').evaluate(async e=>{for(const a of e.getAnimations())await a.finished;});
}
export async function anchorMove(page:Page,p:number){
 await page.evaluate(p=>{const j=document.querySelector<HTMLElement>('#journey')!,s=document.querySelector<HTMLElement>('#stage')!;scrollTo(0,p/6.08*(j.offsetHeight-s.offsetHeight));},p);
 await expect.poll(()=>page.evaluate(()=>(window as any).__experience.snapshot().renderedProgress)).toBeCloseTo(p,3);
}
export function sceneAnchorTests(engine:string){
 for(const progress of [0.06,.15])test(`${engine}: actual Sun pixels stay anchored at ${progress} when browser bars move`,async({page})=>{
  await anchorBoot(page);await anchorMove(page,progress);await page.locator('#pause-motion').click();
  const before=await sunPixels(page);expect(before.count).toBeGreaterThan(3);
  for(const height of [844,769,819,719]){
   await page.setViewportSize({width:390,height});await expect.poll(()=>page.locator('canvas').evaluate(e=>e.clientHeight)).toBe(height);
   await page.waitForTimeout(80);const after=await sunPixels(page);
   expect(Math.abs(after.y-before.y)).toBeLessThan(1.5);expect(Math.abs(after.x-before.x)).toBeLessThan(1.5);
   expect(Math.abs(after.height-before.height)).toBeLessThanOrEqual(2);
  }
  await page.evaluate(()=>(window as any).__experience.resetTiming());await page.waitForTimeout(120);
  expect(await page.evaluate(()=>(window as any).__experience.snapshot().frameIntervals)).toEqual([]);
 });
 test(`${engine}: actual projection stays anchored through every scene and repeated reversal`,async({page})=>{
  await anchorBoot(page);
  const snapshot=()=>page.evaluate(()=>(window as any).__experience.snapshot());
  const projected=(s:any,point:number[])=>{
   const v=new Vector3(...point).applyMatrix4(new Matrix4().fromArray(s.view.worldInverse)).applyMatrix4(new Matrix4().fromArray(s.view.projection));
   return [(v.x+1)*s.quality.width/2,(1-v.y)*s.quality.height/2];
  };
  for(const p of [.315,.58,.925,1.36,1.75,2.23,2.455,2.685,3.094,4.02,4.62,5.08,6.03,2.685,.315]){
   await anchorMove(page,p);await page.locator('#pause-motion').click();const before=await snapshot();
   for(const height of [844,769,719]){
    await page.setViewportSize({width:390,height});await expect.poll(async()=>(await snapshot()).quality.height).toBe(height);
    const after=await snapshot();expect(after.shot).toEqual(before.shot);expect(after.ambientTime).toBe(before.ambientTime);
    for(const point of [before.shot.target,before.shot.pulse])projected(after,point).forEach((n,i)=>expect(Math.abs(n-projected(before,point)[i])).toBeLessThan(.001));
   }
   await page.locator('#pause-motion').click();
  }
 });
 test(`${engine}: browser bars cannot switch framing and rotate the authored camera`,async({page})=>{
  await anchorBoot(page);await page.setViewportSize({width:820,height:850});
  await page.evaluate(()=>document.documentElement.style.setProperty('--scroll-unit','8.5px'));
  await expect.poll(()=>page.evaluate(()=>{const s=(window as any).__experience.snapshot();return [s.quality.width,s.view.referenceHeight];})).toEqual([820,850]);
  await anchorMove(page,.235);await page.locator('#pause-motion').click();
  const snapshot=()=>page.evaluate(()=>(window as any).__experience.snapshot());
  await expect.poll(async()=>(await snapshot()).framing).toBe('landscape');const before=await snapshot();
  await page.setViewportSize({width:820,height:1050});await expect.poll(async()=>(await snapshot()).quality.height).toBe(1050);
  const after=await snapshot();expect(after.framing).toBe('landscape');expect(after.shot).toEqual(before.shot);
  // A real resize/rotation updates the reference instead of locking a stale mode.
  await page.evaluate(()=>document.documentElement.style.removeProperty('--scroll-unit'));
  await page.setViewportSize({width:390,height:844});await expect.poll(async()=>(await snapshot()).framing).toBe('portrait');
 });
 test(`${engine}: still views anchor and context loss disposes the viewport reference`,async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await anchorBoot(page);
  for(const name of ['sun','cell','business','aesir']){
   await page.locator(`[data-still="${name}"]`).click();await page.waitForTimeout(400);
   const before=await page.evaluate(()=>(window as any).__experience.snapshot());
   await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);
   const after=await page.evaluate(()=>(window as any).__experience.snapshot());
   expect(after.view.referenceHeight).toBe(719);expect(after.ambientTime).toBe(before.ambientTime);
   await page.setViewportSize({width:390,height:719});
  }
  await page.evaluate(()=>{const c=document.querySelector('canvas')!;c.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));});
  await expect(page.locator('[data-viewport-reference]')).toHaveCount(0);
  await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeFocused();
 });
}
