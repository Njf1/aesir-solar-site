import {test,expect,type Page} from '@playwright/test';
const origin='http://127.0.0.1:4173';
const snapshot=(page:Page)=>page.evaluate(()=>(window as any).__experience.snapshot());
async function ready(page:Page){await page.goto('/experience?inspect=1');await page.waitForFunction(()=>(window as any).__experience?.snapshot().ready);}
async function scroll(page:Page,p:number){await page.evaluate(p=>{const j=document.querySelector('#journey') as HTMLElement;scrollTo(0,j.getBoundingClientRect().top+scrollY+p/Number(j.dataset.duration)*(j.offsetHeight-innerHeight));},p);}
async function move(page:Page,p:number){await scroll(page,p);await expect.poll(async()=>(await snapshot(page)).progress).toBeCloseTo(p,2);await page.waitForTimeout(120);}
function deferred(){let release!:()=>void;const gate=new Promise<void>(r=>release=r);return{gate,release};}
async function allReady(page:Page){await page.waitForFunction(()=>{const s=(window as any).__experience.snapshot();return ['earth','region','site','cell','electrical'].every(k=>s[`${k}Status`]==='ready');});}
// electrical-path is an eager, shared data chunk: do not accidentally block it with electrical-*.
const assets=[
 {kind:'cell',asset:/\/cell-[^/]+\.js$/,requested:2.62,heldScene:'site',heldMaximum:2.34,scene:'cell',copy:'8',message:'cell view'},
 {kind:'electrical',asset:/\/electrical-(?!path-)[^/]+\.js$/,requested:3.72,heldScene:'cell',heldMaximum:3.05,scene:'site',copy:'10',message:'inverter view'},
] as const;
test.beforeEach(async({page})=>{await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());});
for(const info of assets){
 test(`delayed ${info.kind} holds the actual earlier scene and resumes the same scroll`,async({page})=>{
  const load=deferred(),requests:string[]=[];await page.route(info.asset,async r=>{requests.push(r.request().url());await load.gate;await r.continue().catch(()=>{});});
  try{
   await ready(page);expect(requests).toEqual([]);await move(page,info.requested);
   await page.waitForFunction(kind=>(window as any).__experience.snapshot()[`${kind}Status`]==='loading',info.kind);
   await expect.poll(()=>requests.length).toBe(1);await expect.poll(async()=>(await snapshot(page)).shot.scene).toBe(info.heldScene);
   const held=await snapshot(page);expect(held.failed).toBe(false);expect(held.progress).toBeCloseTo(info.requested,2);
   await expect(page.locator(`[data-copy="${info.copy}"]`)).toHaveAttribute('aria-hidden','true');
   await expect(page.locator('#inverter-annotations')).toBeHidden();await expect(page.locator('header .apply-link')).toBeVisible();
   load.release();await page.waitForFunction(kind=>(window as any).__experience.snapshot()[`${kind}Status`]==='ready',info.kind);
   await expect.poll(async()=>(await snapshot(page)).shot.scene).toBe(info.scene);
   await expect(page.locator(`[data-copy="${info.copy}"]`)).toHaveAttribute('aria-hidden','false');
   expect((await snapshot(page)).progress).toBeCloseTo(held.progress,5);expect(requests).toHaveLength(1);
  }finally{load.release();}
 });
 test(`failed ${info.kind} preserves usable application access and cannot restart`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.route(info.asset,r=>r.abort());
  await ready(page);await scroll(page,info.requested);await page.waitForFunction(()=>(window as any).__experience.snapshot().failed);
  await expect(page.locator('#fallback-status')).toContainText(info.message);await expect(page.locator('#canvas-host canvas')).toHaveCount(0);
  await expect(page.locator('#application-details')).toBeInViewport();await expect(page.locator('.primary-button')).toHaveAttribute('href','/apply.html');
  await page.emulateMedia({reducedMotion:'reduce'});await page.emulateMedia({reducedMotion:'no-preference'});
  expect((await snapshot(page)).failed).toBe(true);await expect(page.locator('#still-views')).toBeHidden();await expect(page.locator('#pause-motion')).toBeHidden();await expect(page.locator('#inverter-annotations')).toBeHidden();expect(errors).toEqual([]);
 });
 test(`${info.kind} deadline disposes the scene and late module completion cannot resurrect it`,async({page})=>{
  const load=deferred(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.route(info.asset,async r=>{await load.gate;await r.continue().catch(()=>{});});
  try{
   await ready(page);await scroll(page,info.requested);await page.waitForFunction(kind=>(window as any).__experience.snapshot()[`${kind}Status`]==='loading',info.kind);
   await page.waitForFunction(()=>(window as any).__experience.snapshot().failed,{},{timeout:15000});
   await expect(page.locator('#canvas-host canvas')).toHaveCount(0);await expect(page.locator('#application-details')).toBeInViewport();
   load.release();await page.waitForTimeout(350);expect((await snapshot(page)).failed).toBe(true);
   await expect(page.locator('#canvas-host canvas')).toHaveCount(0);await expect(page.locator('header .apply-link')).toBeVisible();expect(errors).toEqual([]);
  }finally{load.release();}
 });
}
test('all eight reduced-motion stills have matching HTML, distinct selection and no advancing ambient clock',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await ready(page);
 const initialTime=(await snapshot(page)).ambientTime;
 for(const [name,scene,copy] of [['sun','solar','1'],['earth','earth','3'],['britain','region','4'],['roof','site','5'],['panel','site','6'],['cell','cell','8'],['dc','site','9'],['inverter','site','10'],['panel','site','6'],['cell','cell','8'],['sun','solar','1']] as const){
  await page.locator(`[data-still="${name}"]`).click();await expect(page.locator(`[data-still="${name}"]`)).toHaveAttribute('aria-pressed','true');
  await expect.poll(async()=>(await snapshot(page)).shot.scene).toBe(scene);await expect(page.locator(`[data-copy="${copy}"]`)).toHaveAttribute('aria-hidden','false');
  await expect(page.locator('#still-views button[aria-pressed="true"]')).toHaveCount(1);
  const s=await snapshot(page);expect(s.ambientTime).toBe(initialTime);expect(s.failed).toBe(false);
  if(name==='inverter'){await expect(page.locator('#inverter-annotations')).toBeVisible();expect(s.shot.pulseOpacity).toBe(0);expect(s.dcFlow.travel).toBe(1);}
 }
 await expect(page.locator('#pause-motion')).toBeHidden();await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeFocused();
});
test('a delayed selected cell still refreshes its scene and copy when ready without another click',async({page})=>{
 const load=deferred();await page.route(assets[0].asset,async r=>{await load.gate;await r.continue().catch(()=>{});});
 try{await page.emulateMedia({reducedMotion:'reduce'});await ready(page);await page.locator('[data-still="cell"]').click();
  await page.waitForFunction(()=>(window as any).__experience.snapshot().cellStatus==='loading');await expect(page.locator('[data-copy="8"]')).toHaveAttribute('aria-hidden','true');
  load.release();await expect.poll(async()=>(await snapshot(page)).shot.scene).toBe('cell');await expect(page.locator('[data-copy="8"]')).toHaveAttribute('aria-hidden','false');
  await expect(page.locator('[data-still="cell"]')).toHaveAttribute('aria-pressed','true');expect((await snapshot(page)).ambientTime).toBe(0);
 }finally{load.release();}
});
test('repeated scale, cell and circuit reversals restore states without allocating more GPU resources',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);await move(page,4.02);await allReady(page);
 const poses=[.925,1.4,1.72,1.94,2.25,2.37,2.39,2.50,2.70,2.76,2.92,3.02,3.07,3.09,3.40,3.90,4.02];
 // Warm every scene, glass aperture, array LOD, circuit and shadow pass before taking the baseline.
 for(const p of poses)await move(page,p);const reference=await snapshot(page),counts={geometries:reference.geometries,textures:reference.textures};
 for(const p of [...poses].reverse().concat(poses)){
  await move(page,p);const s=await snapshot(page);expect(s.failed).toBe(false);expect(s.geometries).toBe(counts.geometries);expect(s.textures).toBe(counts.textures);
  await expect(page.locator('#canvas-host canvas')).toHaveCount(1);
  if(s.shot.pulseOpacity>.01)expect(s.trailHeadError).toBeLessThan(.00005);
  if(p>=2.71)expect(s.shot.pulseOpacity).toBe(0);
 }
 const returned=await snapshot(page);for(const key of ['camera','target','pulse','tangent','up'])returned.shot[key].forEach((n:number,i:number)=>expect(Math.abs(n-reference.shot[key][i])).toBeLessThan(.02));
 expect(returned.cell).toEqual(reference.cell);expect(returned.dcFlow).toEqual(reference.dcFlow);expect(errors).toEqual([]);
});

for(const info of assets){
 test(`rapid keyboard skip remains at the application after late ${info.kind} completion`,async({page})=>{
  const load=deferred();await page.route(info.asset,async r=>{await load.gate;await r.continue().catch(()=>{});});
  try{await ready(page);await move(page,info.requested);await page.waitForFunction(kind=>(window as any).__experience.snapshot()[`${kind}Status`]==='loading',info.kind);
   await page.locator('.skip-link').focus();await page.keyboard.press('Enter');await expect(page.locator('#application-details')).toBeFocused();
   await page.waitForTimeout(150);const time=(await snapshot(page)).ambientTime;load.release();
   await page.waitForFunction(kind=>(window as any).__experience.snapshot()[`${kind}Status`]==='ready',info.kind);await page.waitForTimeout(250);
   await expect(page.locator('#application-details')).toBeFocused();await expect(page.locator('#application-details')).toBeInViewport();
   expect((await snapshot(page)).ambientTime).toBe(time);expect((await snapshot(page)).onscreen).toBe(false);
  }finally{load.release();}
 });
 for(const cause of ['timeout','context loss'])test(`${info.kind} pending GPU readiness cancels cleanly on ${cause}`,async({page})=>{
  await page.addInitScript(()=>{const original=WebGL2RenderingContext.prototype.getProgramParameter;const w=window as any;w.__blockWarmup=false;w.__warmupPolls=0;
   WebGL2RenderingContext.prototype.getProgramParameter=function(program,pname){if(pname===0x91B1&&w.__blockWarmup){w.__warmupPolls++;return false;}return original.call(this,program,pname);};
  });
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);
  // Stop before the next owner prefetch threshold so only the target compiler is held.
  const prerequisite=info.kind==='cell'?'site':'cell';await move(page,info.kind==='cell'?2.05:2.76);
  await page.waitForFunction(kind=>(window as any).__experience.snapshot()[`${kind}Status`]==='ready',prerequisite);
  expect((await snapshot(page))[`${info.kind}Status`]).toBe('idle');
  await page.evaluate(()=>(window as any).__blockWarmup=true);await scroll(page,info.requested);await page.waitForFunction(()=>(window as any).__warmupPolls>0);
  if(cause==='context loss')await page.locator('#canvas-host canvas').evaluate((c:HTMLCanvasElement)=>c.getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext());
  await page.waitForFunction(()=>(window as any).__experience.snapshot().failed,{},{timeout:15000});await expect(page.locator('#canvas-host canvas')).toHaveCount(0);
  const before=await page.evaluate(()=>(window as any).__warmupPolls);await page.waitForTimeout(150);expect(await page.evaluate(()=>(window as any).__warmupPolls)).toBe(before);
  await page.evaluate(()=>(window as any).__blockWarmup=false);await page.waitForTimeout(150);
  await expect(page.locator('#canvas-host canvas')).toHaveCount(0);await expect(page.locator('#application-details')).toBeInViewport();expect(errors).toEqual([]);
 });
}

test('context loss after inverter reveal removes its DOM labels as well as the canvas',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);await move(page,3.90);await allReady(page);
 await expect(page.locator('#inverter-annotations')).toBeVisible();
 await page.locator('#canvas-host canvas').evaluate((c:HTMLCanvasElement)=>c.getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext());
 await page.waitForFunction(()=>(window as any).__experience.snapshot().failed);await expect(page.locator('#canvas-host canvas')).toHaveCount(0);
 await expect(page.locator('#inverter-annotations')).toBeHidden();await expect(page.locator('#application-details')).toBeInViewport();
 await expect(page.locator('.primary-button')).toHaveAttribute('href','/apply.html');expect(errors).toEqual([]);
});


test('inverter labels stay separate from copy in enlarged text and reduced-motion stills',async({page})=>{
 await page.setViewportSize({width:1280,height:720});await ready(page);
 await page.evaluate(()=>{const sizes=[...document.querySelectorAll<HTMLElement>('h1,h2,p,button,a,[data-inverter-label]')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)] as const);for(const[e,size]of sizes)e.style.fontSize=`${size*2}px`;});
 await move(page,3.72);await allReady(page);await expect(page.locator('[data-copy="10"]')).toHaveAttribute('aria-hidden','false');await expect(page.locator('#inverter-annotations')).toBeHidden();
 await move(page,3.84);await expect(page.locator('[data-copy="10"]')).toHaveAttribute('aria-hidden','true');await expect(page.locator('#inverter-annotations')).toBeVisible();
 await page.reload();await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-still="inverter"]').click();await allReady(page);
 const overlaps=await page.evaluate(()=>{const copy=document.querySelector('[data-copy="10"]')!;const text=[...copy.children].map(e=>e.getBoundingClientRect());return [...document.querySelectorAll('[data-inverter-label]')].filter(e=>{const b=e.getBoundingClientRect();return text.some(a=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top);}).map(e=>e.textContent);});
 expect(overlaps).toEqual([]);
});
