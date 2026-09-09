import {test,expect} from '@playwright/test';
export function touchQualityTests(engine:string){
 for(const [width,height] of [[820,1180],[1180,820],[844,390]])test(`${engine}: touch device keeps mobile resources at ${width}×${height}`,async({page})=>{
  await page.setViewportSize({width,height});
  await page.addInitScript(()=>Object.defineProperty(navigator,'hardwareConcurrency',{value:8,configurable:true}));
  await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin==='http://127.0.0.1:4173'&&!u.pathname.startsWith('/api/')&&r.request().method()==='GET'?r.continue():r.abort();});
  await page.goto('/?inspect=1');await page.waitForFunction(()=>(window as any).__experience?.snapshot().ready);
  const snapshot=()=>page.evaluate(()=>(window as any).__experience.snapshot());
  expect((await snapshot()).quality.tier).toBe('mobile');
  for(const [w,h] of [[height,width],[width,height]]){
   await page.setViewportSize({width:w,height:h});
   await expect.poll(async()=>{const q=(await snapshot()).quality;return [q.width,q.height,q.tier];}).toEqual([w,h,'mobile']);
   const q=(await snapshot()).quality;expect(q.pixelRatio).toBeLessThanOrEqual(1.25);expect(w*h*q.pixelRatio**2).toBeLessThanOrEqual(850001);
  }
  await page.evaluate(()=>{const j=document.querySelector<HTMLElement>('#journey')!,s=document.querySelector<HTMLElement>('#stage')!;scrollTo(0,6.03/6.08*(j.offsetHeight-s.offsetHeight));});
  await page.waitForFunction(()=>(window as any).__experience.snapshot().storageStatus==='ready');
  const warm=await snapshot();
  expect(warm.earth.variant).toBe('mobile');
  await page.setViewportSize({width:height,height:width});await page.waitForTimeout(250);
  const rotated=await snapshot();expect(rotated.quality.tier).toBe('mobile');expect(rotated.site.textureBytes).toBe(warm.site.textureBytes);expect(rotated.geometries).toBe(warm.geometries);expect(rotated.textures).toBe(warm.textures);
  await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeFocused();
 });
}
