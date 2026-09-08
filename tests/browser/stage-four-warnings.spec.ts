// Draft destination: tests/browser/stage-four-warnings.spec.ts.
// Uses the assembled local preview, current inspect API and accepted stage03 poses.
import {test,expect,type Page} from '@playwright/test';
const origin='http://127.0.0.1:4173';
const snapshot=(page:Page)=>page.evaluate(()=>(window as any).__experience.snapshot());
async function move(page:Page,p:number){
 await page.evaluate(p=>{const j=document.querySelector('#journey') as HTMLElement;scrollTo(0,j.getBoundingClientRect().top+scrollY+p/Number(j.dataset.duration)*(j.offsetHeight-innerHeight));},p);
 await expect.poll(async()=>(await snapshot(page)).progress).toBeCloseTo(p,2);await page.waitForTimeout(120);
}
for(const [name,viewport] of [['desktop',{width:1600,height:1000}],['portrait',{width:390,height:844}]] as const){
 test(`${name}: first site entry and repeated entries produce no console warnings`,async({page})=>{
  const consoleIssues:string[]=[],pageErrors:string[]=[],siteRequests:string[]=[];
  page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')consoleIssues.push(`${m.type()}: ${m.text()}`);});
  page.on('pageerror',e=>pageErrors.push(e.message));
  page.on('request',r=>{if(/\/site-(?!layout-)[^/]+\.js$/.test(new URL(r.url()).pathname))siteRequests.push(r.url());});
  await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await page.setViewportSize(viewport);await page.goto('/experience?inspect=1');await page.waitForFunction(()=>(window as any).__experience?.snapshot().ready);
  await move(page,1.72);await page.waitForFunction(()=>{const s=(window as any).__experience.snapshot();return s.siteStatus==='ready'&&s.shot.scene==='site';});
  await page.waitForTimeout(150);
  expect(consoleIssues,'first construction/warmup/first shadow render').toEqual([]);expect(pageErrors).toEqual([]);
  for(const p of [2.23,1.40,.925,1.40,1.72,2.23,1.40,1.72])await move(page,p);
  await expect(page.locator('#canvas-host canvas')).toHaveCount(1);expect(siteRequests).toHaveLength(1);
  expect((await snapshot(page)).failed).toBe(false);expect(consoleIssues,'repeated shadow/material entry').toEqual([]);expect(pageErrors).toEqual([]);
 });
}
