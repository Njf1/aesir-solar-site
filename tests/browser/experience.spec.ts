import {test,expect} from '@playwright/test';
const gotoReady=async(page:any)=>{await page.goto('/experience?inspect=1');await page.waitForFunction(()=>window.__experience?.snapshot().ready);};
const scrollTo=async(page:any,p:number)=>{await page.evaluate((p:number)=>{const j=document.querySelector('#journey') as HTMLElement;scrollTo(0,p*(j.offsetHeight-innerHeight));},p);await page.waitForTimeout(250);};
test.beforeEach(async({page})=>{await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:4173/')?route.continue():route.abort());});
test('opening, reverse, pause, resize, skip and browser Back preserve access',async({page})=>{
 await gotoReady(page);await expect(page.locator('header a.apply-link')).toBeVisible();
 await scrollTo(page,.68);const before=await page.evaluate(()=>window.__experience.snapshot());await expect(page.locator('#chapter-title')).toContainText('A star.');
 await scrollTo(page,.98);await expect(page.locator('#chapter-title')).toContainText('One pulse.');
 await scrollTo(page,.68);const back=await page.evaluate(()=>window.__experience.snapshot());expect(Math.abs(back.progress-before.progress)).toBeLessThan(.002);
 await page.locator('#pause-motion').click();const a=await page.evaluate(()=>window.__experience.snapshot().ambientTime);await page.waitForTimeout(300);expect(await page.evaluate(()=>window.__experience.snapshot().ambientTime)).toBe(a);
 await scrollTo(page,.85);expect(await page.evaluate(()=>window.__experience.snapshot().ambientTime)).toBe(a);
 await page.setViewportSize({width:390,height:844});expect(await page.locator('header a.apply-link').isVisible()).toBe(true);
 await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeInViewport();await expect(page.locator('#application-details')).toBeFocused();
 await page.locator('.primary-button').click();await expect(page).toHaveURL(/apply.html/);expect(await page.locator('canvas').count()).toBe(0);
 await page.goBack();await expect(page.locator('#application-details')).toBeInViewport();
});
test('CTA works before readiness and skip remains at details when bundle finishes',async({page})=>{
 let release:()=>void=()=>{};const gate=new Promise<void>(resolve=>release=resolve);
 await page.route('**/scene-*.js',async route=>{await gate;await route.continue();});
 await page.goto('/experience?inspect=1',{waitUntil:'domcontentloaded'});
 await expect(page.locator('header a.apply-link')).toBeVisible();await expect(page.locator('header a.apply-link')).toHaveAttribute('href','/apply.html');
 await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeInViewport();
 release();await page.waitForFunction(()=>window.__experience?.snapshot().ready);await expect(page.locator('#application-details')).toBeInViewport();
});
test('no JavaScript retains service, price, links and short layout',async({browser})=>{
 const page=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
 await page.goto('/experience');await expect(page.locator('header a.apply-link')).toBeVisible();
 await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeInViewport();
 await expect(page.locator('.price-breakdown')).toContainText('£250 fee + £50 VAT');expect(await page.locator('canvas').count()).toBe(0);await page.close();
});
test('reduced motion freezes ambient time and removes extended scroll',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await gotoReady(page);
 const a=await page.evaluate(()=>window.__experience.snapshot().ambientTime);await page.waitForTimeout(300);expect(await page.evaluate(()=>window.__experience.snapshot().ambientTime)).toBe(a);
 await expect(page.locator('#pause-motion')).toBeHidden();expect(await page.locator('#journey').evaluate(e=>e.classList.contains('is-enhanced'))).toBe(false);
});
test('WebGL unavailable uses composed fallback and working links',async({page})=>{
 await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type:any,...rest:any[]){if(String(type).startsWith('webgl'))return null;return get.call(this,type,...rest);};});
 await page.goto('/experience?inspect=1');await page.waitForFunction(()=>window.__experience?.snapshot().failed);
 await expect(page.locator('.scene-fallback img')).toBeVisible();await expect(page.locator('header a.apply-link')).toBeVisible();await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeInViewport();
});
test('context loss stays in fallback when motion preference changes',async({page})=>{
 await gotoReady(page);await page.locator('canvas').evaluate((c:HTMLCanvasElement)=>{c.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();});
 await page.waitForFunction(()=>window.__experience.snapshot().failed);await page.emulateMedia({reducedMotion:'reduce'});await page.emulateMedia({reducedMotion:'no-preference'});
 await expect(page.locator('#pause-motion')).toBeHidden();expect(await page.locator('#journey').evaluate(e=>e.classList.contains('is-enhanced'))).toBe(false);
 await expect(page.locator('#fallback-status')).not.toBeEmpty();
});
test('failed scene bundle leaves usable HTML',async({page})=>{
 await page.route('**/scene-*.js',route=>route.abort());await page.goto('/experience');await expect(page.locator('#fallback-status')).not.toBeEmpty();
 await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeInViewport();await expect(page.locator('.primary-button')).toHaveAttribute('href','/apply.html');
});
test('offscreen stops the renderer and native keyboard reaches conversion',async({page})=>{
 await gotoReady(page);await page.keyboard.press('Tab');await expect(page.locator('.brand')).toBeFocused();await page.keyboard.press('Tab');await expect(page.locator('header .apply-link')).toBeFocused();await page.keyboard.press('Tab');await expect(page.locator('.skip-link')).toBeFocused();await page.keyboard.press('Enter');
 await page.waitForTimeout(250);const a=await page.evaluate(()=>window.__experience.snapshot());await page.waitForTimeout(300);const b=await page.evaluate(()=>window.__experience.snapshot());expect(b.ambientTime).toBe(a.ambientTime);expect(b.onscreen).toBe(false);
});
test('all preserved clean and html routes resolve; APIs are local stubs, never HTML',async({request})=>{
 for(const route of ['','index.html','experience','experience.html',...['apply','simulator','faq','contact','terms','privacy','refunds','success'].flatMap(p=>[p,`${p}.html`])])expect((await request.get(`/${route}`)).status(),route).toBe(200);
 for(const api of ['tyl-checkout','tyl-return','tyl-notify','checkout','tigo']){const r=await request.post(`/api/${api}`,{data:{email:'dummy@example.invalid'}});expect(r.status()).toBe(503);expect((await r.json()).error).toBe('local_preview_only');}
 expect((await request.get('/does-not-exist')).status()).toBe(404);
});
test('hidden-page lifecycle stops ambient work and resumes on visibility',async({page})=>{
 await gotoReady(page);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 const time=await page.evaluate(()=>window.__experience.snapshot().ambientTime);await page.waitForTimeout(300);expect(await page.evaluate(()=>window.__experience.snapshot().ambientTime)).toBe(time);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForTimeout(100);expect(await page.evaluate(()=>window.__experience.snapshot().ambientTime)).toBeGreaterThan(time);
});
