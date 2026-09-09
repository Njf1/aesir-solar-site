import {test,expect,type Page} from '@playwright/test';
const origin='http://127.0.0.1:4173';
async function move(page:Page,p:number){
 await page.evaluate(p=>{const j=document.querySelector<HTMLElement>('#journey')!,s=document.querySelector<HTMLElement>('#stage')!;scrollTo(0,p/6.08*(j.offsetHeight-s.offsetHeight));},p);
 await expect.poll(()=>page.evaluate(()=>(window as any).__experience.snapshot().renderedProgress)).toBeCloseTo(p,2);
}
async function clearControls(page:Page){
 const state=await page.evaluate(()=>{
  const e=document.querySelector<HTMLElement>('.skip-link')!,b=e.getBoundingClientRect(),s=getComputedStyle(e);
  const visible=[...document.querySelectorAll<HTMLElement>('[data-copy]')].filter(e=>Number(getComputedStyle(e).opacity)>.15);
  const range=document.createRange();range.selectNodeContents(e);
  return {height:b.height,width:b.width,background:s.backgroundColor,font:parseFloat(s.fontSize),
   contained:[...range.getClientRects()].every(r=>r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight),
   gaps:document.body.dataset.framing==='portrait'?visible.map(c=>c.getBoundingClientRect().top-b.bottom):[],overlap:visible.some(c=>{const walker=document.createTreeWalker(c,NodeFilter.SHOW_TEXT);let n;while(n=walker.nextNode()){const r=document.createRange();r.selectNodeContents(n);if([...r.getClientRects()].some(t=>t.width>0&&t.height>0&&t.left<b.right&&t.right>b.left&&t.top<b.bottom&&t.bottom>b.top))return true;}return false;}),overflow:document.documentElement.scrollWidth-innerWidth};
 });
 expect(state.height).toBeGreaterThanOrEqual(44);expect(state.width).toBeGreaterThanOrEqual(44);
 expect(state.background).toBe('rgba(0, 0, 0, 0)');expect(state.contained).toBe(true);expect(state.overlap).toBe(false);expect(state.overflow).toBeLessThanOrEqual(1);
 for(const gap of state.gaps)expect(gap).toBeGreaterThanOrEqual(10);
 await expect(page.locator('header .apply-link')).toHaveAttribute('href','/apply.html');
 await expect(page.locator('header .apply-link svg.action-arrow')).toHaveAttribute('aria-hidden','true');
 await expect(page.locator('.skip-link svg.action-arrow')).toHaveAttribute('focusable','false');
 expect(await page.locator('header .apply-link').innerText()).not.toMatch(/[↗⬆]/);
 return state;
}
export function controlsTests(engine:string){test.describe(`${engine} mobile controls`,()=>{
 test.beforeEach(async({page})=>{await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin&&!u.pathname.startsWith('/api/')&&r.request().method()==='GET'?r.continue():r.abort();});});
 for(const [width,height] of [[375,667],[390,844],[740,900],[1000,500],[1280,720],[1600,1000]])test(`quiet Skip, clear copy and reverse navigation at ${width}×${height}`,async({page})=>{
  const issues:string[]=[];page.on('pageerror',e=>issues.push(e.message));page.on('console',m=>{if(m.type()==='warning')issues.push(m.text());});
  await page.setViewportSize({width,height});await page.goto('/?inspect=1');await page.waitForFunction(()=>(window as any).__experience?.snapshot().ready);
  for(const p of [.295,.9,1.4,.9]){await move(page,p);const state=await clearControls(page);expect(state.font).toBe(width<760||height<=600?11:12);}
  await page.locator('.skip-link').focus();await expect(page.locator('.skip-link')).toBeFocused();
  expect(await page.locator('.skip-link').evaluate(e=>getComputedStyle(e).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Enter');await expect(page.locator('#application-details')).toBeFocused();
  await expect(page.locator('.primary-button')).toHaveAttribute('href','/apply.html');
  await page.goBack();await expect(page).not.toHaveURL(/#application-details$/);expect(issues).toEqual([]);
 });
 for(const viewport of [{width:390,height:844},{width:1280,height:720}])test(`explicit 200% text remains enlarged and clear of Skip at ${viewport.width}px`,async({page})=>{
  await page.setViewportSize(viewport);await page.goto('/?inspect=1');await page.waitForFunction(()=>(window as any).__experience?.snapshot().ready);
  await page.evaluate(()=>{
   const nodes=[...document.querySelectorAll<HTMLElement>('h1,h2,h3,p,button,a,li')];
   const sizes=nodes.map(e=>[e,parseFloat(getComputedStyle(e).fontSize)] as const);
   for(const [e,size] of sizes)e.style.fontSize=`${size*2}px`;
  });
  for(const p of [.295,1.4,.9]){await move(page,p);const state=await clearControls(page);expect(state.font).toBe(viewport.width===390?22:24);}
  const viewportMeta=await page.locator('meta[name="viewport"]').getAttribute('content');expect(viewportMeta).not.toMatch(/user-scalable\s*=\s*no|maximum-scale/);
  await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeFocused();
 });
 test('Skip works before the scene loads and keeps the correct destination',async({page})=>{
  let release!:()=>void;const gate=new Promise<void>(r=>release=r);
  await page.route('**/scene-*.js',async r=>{await gate;await r.continue().catch(()=>{});});
  try{
   await page.setViewportSize({width:390,height:844});await page.goto('/?inspect=1',{waitUntil:'domcontentloaded'});
   await clearControls(page);await page.locator('.skip-link').click();await expect(page).toHaveURL(/#application-details$/);
   await expect(page.locator('.primary-button')).toBeInViewport();release();
   await page.waitForFunction(()=>(window as any).__experience?.snapshot().ready);await expect(page.locator('#application-details')).toBeInViewport();
  }finally{release();}
 });
 test('image credits are a native, attributed destination without JavaScript or 3D',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),page=await context.newPage(),sceneRequests:string[]=[];
  await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin&&!u.pathname.startsWith('/api/')?r.continue():r.abort();});
  await page.goto('/');await expect(page.locator('.image-credit')).toHaveText('Image credits');
  await expect(page.locator('.skip-link')).toHaveAttribute('href','#application-details');
  page.on('request',r=>{if(/experience-assets|three|scene-/.test(r.url()))sceneRequests.push(r.url());});
  await page.locator('.image-credit a').click();await expect(page).toHaveURL(/\/solar(?:\.html)?#image-credits$/);
  const credits=page.locator('#image-credits');await expect(credits).toBeInViewport();await expect(credits).toContainText('NASA Earth Observatory');
  await expect(credits).toContainText('Reto Stöckli');await expect(credits).toContainText('Robert Simmon');await expect(credits).toContainText('Natural Earth');
  await expect(credits).toContainText('NASA does not endorse Aesir Solar');expect(sceneRequests).toEqual([]);
  await expect(page.locator('.guide-end .button')).toHaveCSS('color','rgb(5, 6, 8)');
  await expect(page.locator('header .apply-link')).toHaveAttribute('href','/apply.html');await context.close();
 });
});
}
