// Stage six adds ordinary document content after the existing rendered journey.
// These checks never submit the form or permit a provider/network write.
import {test,expect,type Page,type Locator} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {renderRecordedGeneration} from '../../scripts/recorded-generation.mjs';

const origin='http://127.0.0.1:4173';
const anchors=['solar-benefits','recorded-generation','application-process','application-faqs'] as const;
const sample=JSON.parse(readFileSync(new URL('../../data/premier-composites.json',import.meta.url),'utf8'));
const hours=Object.entries(sample.day_sample.hourly_kwh).filter(([k])=>/^\d{2}$/.test(k)).map(([hour,value])=>[Number(hour),Number(value)] as const).sort(([a],[b])=>a-b);
const snapshot=(page:Page)=>page.evaluate(()=>(window as any).__experience?.snapshot());
async function isolate(page:Page){
 await page.route('**/*',route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.origin!==origin)return route.abort();
  if(url.pathname.startsWith('/api/')||!['GET','HEAD'].includes(request.method()))return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Local stage-six checks: providers disabled"}'});
  return route.continue();
 });
}
function monitor(page:Page){
 const errors:string[]=[],warnings:string[]=[],attempts:{url:string;method:string}[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='warning')warnings.push(m.text());});
 // Original apply.html requests Google Fonts; isolate() blocks those reads too.
 page.on('request',request=>{const url=new URL(request.url()),unexpectedExternal=/^https?:$/.test(url.protocol)&&url.origin!==origin&&!['https://fonts.googleapis.com','https://fonts.gstatic.com'].includes(url.origin);if(unexpectedExternal||url.pathname.startsWith('/api/')||!['GET','HEAD'].includes(request.method()))attempts.push({url:request.url(),method:request.method()});});
 return {errors,warnings,attempts};
}
async function ready(page:Page,hash=''){
 await page.goto(`/experience?inspect=1${hash}`);
 await page.waitForFunction(()=>{const s=(window as any).__experience?.snapshot();return s?.ready||s?.failed;});
 expect((await snapshot(page)).failed).toBe(false);
}
async function follow(page:Page,id:typeof anchors[number]){
 const link=page.locator(`a[href="#${id}"]`).first();await expect(link).toHaveCount(1);
 await link.focus();await page.keyboard.press('Enter');
 await expect(page).toHaveURL(new RegExp(`#${id}$`));
 const section=page.locator(`#${id}`);await expect(section).toBeFocused();
 await expect(section.getByRole('heading').first()).toBeInViewport();
 return section;
}
async function openHourlyTable(section:Locator){
 const details=section.locator('details:has(table)');
 if(await details.count()){
  const first=details.first();if(!await first.evaluate(e=>(e as HTMLDetailsElement).open))await first.locator('summary').click();
 }
 await expect(section.locator('table')).toBeVisible();
}
async function checkRecordedSample(page:Page){
 const section=page.locator('#recorded-generation');
 await expect(section).toContainText(/24\s+August\s+2026|2026-08-24/);
 await expect(section).toContainText('206.41');await expect(section).toContainText(/kWh/);
 await expect(section).toContainText(/Tigo/i);await expect(section).toContainText(/Premier Composites/);
 await expect(section).toContainText(/recorded|historical/i);await expect(section).toContainText(/approximat/i);
 const visibleRecord=await section.innerText();expect(visibleRecord).toMatch(/24\s+August\s+2026|2026-08-24/);expect(visibleRecord).toMatch(/206\.41/);expect(visibleRecord).toMatch(/Tigo/i);expect(visibleRecord).toMatch(/approximat/i);
 // A truthful sentence saying “not live” is allowed; an affirmative live/today label is not.
 const falseCurrentLabels=await section.locator('h2,h3,h4,dt,figcaption,caption,time,[role="status"]').evaluateAll(nodes=>nodes.map(n=>n.textContent?.trim()??'').filter(t=>/^(?:today\b|live(?:\s+(?:data|generation|output|monitoring))?\s*$)/i.test(t)));
 expect(falseCurrentLabels).toEqual([]);
 const svg=section.locator('svg').first();await expect(svg).toBeVisible();
 const svgSemantics=await svg.evaluate(e=>({role:e.getAttribute('role'),label:e.getAttribute('aria-label'),labelledBy:e.getAttribute('aria-labelledby'),title:e.querySelector('title')?.textContent,description:e.querySelector('desc')?.textContent}));
 expect(svgSemantics.role).toBe('img');expect(Boolean(svgSemantics.label||svgSemantics.labelledBy||svgSemantics.title)).toBe(true);
 const bars=await svg.locator('.recorded-generation__bar').evaluateAll(nodes=>nodes.map(node=>{const rect=node.querySelector('rect')!;return {hour:Number(node.getAttribute('data-hour')),value:Number(node.getAttribute('data-kwh')),x:parseFloat(rect.getAttribute('x')!),y:Number(rect.getAttribute('y')),height:Number(rect.getAttribute('height'))};}));
 expect(bars).toHaveLength(hours.length);const scale=bars[0].height/bars[0].value,base=bars[0].y+bars[0].height;
 for(let i=0;i<hours.length;i++){const [hour,kwh]=hours[i],bar=bars[i];expect(bar.hour).toBe(hour);expect(bar.value).toBe(kwh);expect(bar.height).toBeGreaterThan(0);expect(Math.abs(bar.height-kwh*scale)).toBeLessThan(.005);expect(Math.abs(bar.y+bar.height-base)).toBeLessThan(.001);if(i)expect(bar.x).toBeGreaterThan(bars[i-1].x);}

 await openHourlyTable(section);
 const rows=await section.locator('table tbody tr').evaluateAll(rows=>rows.map(row=>[...row.querySelectorAll('td,th')].map(cell=>cell.textContent?.trim()??'')));
 expect(rows).toHaveLength(hours.length);
 for(const[hour,kwh]of hours){
  const row=rows.find(cells=>Number(cells[0].match(/^\s*(\d{1,2})(?::00)?/)?.[1])===hour);
  expect(row,`recorded hour ${hour}`).toBeDefined();
  expect(Number(row![1].replace(/[^\d.\-]/g,'')),`approximate reading at ${hour}:00`).toBe(kwh);
 }
 // The portal total is not silently replaced by the sum of approximate bar readings.
 expect(hours.reduce((n,[,v])=>n+v,0)).not.toBe(sample.day_sample.pv_production_kwh);
 const totalText=await section.innerText();expect(totalText).toContain(String(sample.day_sample.pv_production_kwh));
}

test.beforeEach(async({page})=>{await isolate(page);});

test('new section links use native hash navigation, keyboard focus and usable browser Back',async({page})=>{
 const issues=monitor(page);await ready(page);
 for(const id of anchors){
  const section=await follow(page,id);await expect(section).toHaveAttribute('tabindex','-1');
  const heading=section.getByRole('heading').first();
  const pos=await heading.evaluate(e=>({top:e.getBoundingClientRect().top,headerBottom:document.querySelector('header')!.getBoundingClientRect().bottom}));
  expect(pos.top).toBeGreaterThanOrEqual(pos.headerBottom-2);
 }
 await page.goBack();await expect(page).toHaveURL(/#application-process$/);
 await expect(page.locator('#application-process').getByRole('heading').first()).toBeInViewport();
 await page.locator('#application-process').focus();await page.keyboard.press('Tab');
 const focus=await page.evaluate(()=>({tag:document.activeElement?.tagName,href:document.activeElement?.getAttribute('href')}));
 expect(['A','SUMMARY','BUTTON']).toContain(focus.tag);expect(focus.href??'').not.toMatch(/^javascript:/);
 expect(issues.errors).toEqual([]);expect(issues.warnings).toEqual([]);expect(issues.attempts).toEqual([]);
});

test('a recorded-generation deep link survives delayed scene startup and leaves Apply immediately available',async({page})=>{
 let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);const issues=monitor(page);
 await page.route(/\/scene-[^/]+\.js$/,async route=>{await gate;await route.continue().catch(()=>{});});
 try{
  await page.goto('/experience?inspect=1#recorded-generation',{waitUntil:'domcontentloaded'});
  await expect(page.locator('header .apply-link')).toHaveAttribute('href','/apply.html');
  await expect(page.locator('#recorded-generation').getByRole('heading').first()).toBeInViewport();
  await follow(page,'application-process');release();await page.waitForFunction(()=>(window as any).__experience?.snapshot().ready);
  await expect(page).toHaveURL(/#application-process$/);await expect(page.locator('#application-process')).toBeFocused();
  await expect(page.locator('#application-process').getByRole('heading').first()).toBeInViewport();
  expect(issues.errors).toEqual([]);expect(issues.attempts).toEqual([]);
 }finally{release();}
});

test('recorded generation remains dated and attributed, with matching approximate hourly table and accessible SVG',async({page})=>{
 const issues=monitor(page);await ready(page);await follow(page,'recorded-generation');await checkRecordedSample(page);
 expect(issues.errors).toEqual([]);expect(issues.warnings).toEqual([]);expect(issues.attempts).toEqual([]);
});

test('all application actions preserve the existing form, consents and browser return without submitting',async({page})=>{
 const issues=monitor(page);await ready(page);await follow(page,'application-process');
 const actions=await page.locator('a').evaluateAll(nodes=>nodes.filter(a=>/^(?:start|begin|apply)\b/i.test(a.textContent?.trim()??'')).map(a=>({text:a.textContent,href:a.getAttribute('href')})));
 expect(actions.length).toBeGreaterThanOrEqual(2);expect(actions.filter(a=>a.href!=='/apply.html')).toEqual([]);
 const link=page.locator('#application-process a[href="/apply.html"]').first();await expect(link).toBeVisible();
 await link.focus();await page.keyboard.press('Enter');await expect(page).toHaveURL(/\/apply\.html$/);
 const form=page.locator('#applyForm');await expect(form).toBeVisible();
 const names=await form.locator('[name]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('name')));
 expect(names).toEqual(expect.arrayContaining(['company','contact','email','phone','accreditation','address','postcode','mpan','inverter','typetest','kw','phases','storage','target','g100','eps','notes','agree','privacy']));
 for(const name of ['agree','privacy']){await expect(form.locator(`[name="${name}"]`)).toHaveAttribute('required','');await expect(form.locator(`[name="${name}"]`)).not.toBeChecked();}
 await expect(form.locator('[name="agree"]').locator('..')).toContainText(/terms of service.*refund policy/);
 await expect(form.locator('[name="privacy"]').locator('..')).toContainText(/sharing.*network operator/);
 await expect(page.locator('#submitBtn')).toContainText('£300.00');expect(await page.locator('#canvas-host canvas').count()).toBe(0);
 await page.goBack();await page.waitForFunction(()=>(window as any).__experience?.snapshot().ready);
 await expect(page).toHaveURL(/#application-process$/);await expect(page.locator('#application-process').getByRole('heading').first()).toBeInViewport();
 expect(issues.errors).toEqual([]);expect(issues.attempts).toEqual([]);
});

test('FAQ uses native details and retains fee, uncertainty, support and policy destinations',async({page})=>{
 const issues=monitor(page);await ready(page);const section=await follow(page,'application-faqs');
 const details=section.locator('details');expect(await details.count()).toBeGreaterThanOrEqual(3);
 const closedIndex=await details.evaluateAll(items=>items.findIndex(e=>!(e as HTMLDetailsElement).open));expect(closedIndex).toBeGreaterThanOrEqual(0);const first=details.nth(closedIndex),summary=first.locator('summary');await summary.focus();await page.keyboard.press('Enter');await expect(first).toHaveAttribute('open','');
 await page.keyboard.press('Enter');await expect(first).not.toHaveAttribute('open','');
 for(const item of await details.all())if(!await item.evaluate(e=>(e as HTMLDetailsElement).open))await item.locator('summary').click();
 await expect(section).toContainText(/£300/);await expect(section).toContainText(/£250/);await expect(section).toContainText(/VAT/);
 const decision=section.locator('details').filter({has:page.locator('summary').filter({hasText:/approval|timescale/i})}).first();await expect(decision).toContainText(/No\.|not guaranteed|cannot guarantee|can't guarantee/i);await expect(decision).toContainText(/network operator/i);
 const hrefs=await section.locator('a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
 expect(hrefs).toEqual(expect.arrayContaining(['/contact.html','/refunds.html']));
 expect(issues.errors).toEqual([]);expect(issues.attempts).toEqual([]);
});

test('reading every new section suspends rendered work and returning to the journey resumes it',async({page})=>{
 const issues=monitor(page);await ready(page);
 for(const id of anchors){
  await follow(page,id);await expect.poll(async()=>(await snapshot(page)).onscreen).toBe(false);
  const before=await snapshot(page);await page.waitForTimeout(180);const after=await snapshot(page);
  expect(after.ambientTime).toBe(before.ambientTime);expect(after.failed).toBe(false);
 }
 const time=(await snapshot(page)).ambientTime;await page.locator('a[href="#main"]').last().click();
 await expect.poll(async()=>(await snapshot(page)).onscreen).toBe(true);await expect.poll(async()=>(await snapshot(page)).ambientTime).toBeGreaterThan(time);
 expect(issues.errors).toEqual([]);expect(issues.attempts).toEqual([]);
});

test('reduced motion keeps all twelve stills and makes the complete HTML continuation independently readable',async({page})=>{
 const issues=monitor(page);await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await ready(page);
 await expect(page.locator('#still-views button')).toHaveCount(12);await expect(page.locator('[data-still="sun"]')).toHaveAttribute('aria-pressed','true');
 const time=(await snapshot(page)).ambientTime;
 for(const id of anchors){await follow(page,id);expect((await snapshot(page)).ambientTime).toBe(time);}
 await checkRecordedSample(page);await expect(page.locator('#journey')).not.toHaveClass(/is-enhanced/);
 await page.locator('a[href="#main"]').last().click();await expect(page.locator('[data-still="sun"]')).toHaveAttribute('aria-pressed','true');
 expect((await snapshot(page)).ambientTime).toBe(time);expect(issues.errors).toEqual([]);expect(issues.attempts).toEqual([]);
});

test('no JavaScript preserves new anchors, historical proof, native FAQ and the existing application destination',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),page=await context.newPage();await isolate(page);const issues=monitor(page);
 try{
  await page.goto('/experience#solar-benefits');
  for(const id of anchors){await follow(page,id);await expect(page.locator(`#${id}`)).not.toBeEmpty();}
  await checkRecordedSample(page);await expect(page.locator('canvas')).toHaveCount(0);
  const faqDetails=page.locator('#application-faqs details'),closedIndex=await faqDetails.evaluateAll(items=>items.findIndex(e=>!(e as HTMLDetailsElement).open));expect(closedIndex).toBeGreaterThanOrEqual(0);const first=faqDetails.nth(closedIndex);await first.locator('summary').focus();await page.keyboard.press('Enter');await expect(first).toHaveAttribute('open','');
  await expect(page.locator('header .apply-link')).toHaveAttribute('href','/apply.html');expect(issues.attempts).toEqual([]);
 }finally{await context.close();}
});

test('failed scene startup retains the new content, recorded proof and application access',async({page})=>{
 await page.route(/\/scene-[^/]+\.js$/,route=>route.abort());await page.goto('/experience?inspect=1');
 await page.waitForFunction(()=>(window as any).__experience?.snapshot().failed);await expect(page.locator('#canvas-host canvas')).toHaveCount(0);
 for(const id of anchors)await follow(page,id);
 await checkRecordedSample(page);await expect(page.locator('header .apply-link')).toHaveAttribute('href','/apply.html');
});

for(const[name,viewport]of[['desktop',{width:1280,height:720}],['portrait',{width:390,height:844}]]as const)test(`${name}: 200% text preserves new section reading, actions and table without horizontal page overflow`,async({page})=>{
 const issues=monitor(page);await page.setViewportSize(viewport);await ready(page);
 await page.evaluate(ids=>{
  const nodes=ids.flatMap(id=>[...document.querySelectorAll<HTMLElement>(`#${id} h2,#${id} h3,#${id} h4,#${id} p,#${id} li,#${id} dt,#${id} dd,#${id} a,#${id} summary,#${id} th,#${id} td,#${id} caption,#${id} figcaption`)]);
  const sizes=[...new Set(nodes)].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)] as const);for(const[e,size]of sizes)e.style.fontSize=`${size*2}px`;
 },[...anchors]);
 for(const id of anchors){
  const section=await follow(page,id);if(id==='recorded-generation')await openHourlyTable(section);
  if(id==='application-faqs')for(const d of await section.locator('details').all())if(!await d.evaluate(e=>(e as HTMLDetailsElement).open))await d.locator('summary').click();
  const layout=await section.evaluate(section=>{
   const bad:string[]=[];const walker=document.createTreeWalker(section,NodeFilter.SHOW_TEXT);while(walker.nextNode()){
    const node=walker.currentNode,parent=node.parentElement;if(!node.textContent?.trim()||!parent||parent.closest('svg')||getComputedStyle(parent).visibility==='hidden')continue;
    const range=document.createRange();range.selectNodeContents(node);for(const r of range.getClientRects())if(r.width&&r.height&&(r.left< -1||r.right>innerWidth+1))bad.push(node.textContent.trim().slice(0,70));
   }
   return {pageWidth:document.documentElement.scrollWidth,viewport:innerWidth,bad};
  });
  expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewport+1);expect(layout.bad).toEqual([]);
 }
 expect(issues.errors).toEqual([]);expect(issues.attempts).toEqual([]);
});

test('payoff application link is focusable only in its visible chapter and has a real hit target',async({page})=>{
 const issues=monitor(page);await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await ready(page);
 const copy=page.locator('[data-copy="18"]'),action=copy.locator('a[href="/apply.html"]');
 await expect(action).toBeHidden();expect(await copy.evaluate(e=>(e as HTMLElement).inert)).toBe(true);
 await action.evaluate(e=>(e as HTMLElement).focus());await expect(action).not.toBeFocused();
 await page.locator('[data-still="aesir"]').click();await page.waitForFunction(()=>{const s=(window as any).__experience?.snapshot();return s?.failed||s?.storageStatus==='ready';});expect((await snapshot(page)).failed).toBe(false);await expect(copy).toHaveAttribute('aria-hidden','false');
 await expect(action).toBeVisible();expect(await copy.evaluate(e=>(e as HTMLElement).inert)).toBe(false);
 await action.focus();await expect(action).toBeFocused();
 const hit=await action.evaluate(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.width>0&&r.height>=44&&hit!==null&&e.contains(hit);});expect(hit).toBe(true);
 await page.locator('[data-still="sun"]').click();await expect(copy).toHaveAttribute('aria-hidden','true');expect(await copy.evaluate(e=>(e as HTMLElement).inert)).toBe(true);
 await action.evaluate(e=>(e as HTMLElement).focus());await expect(action).not.toBeFocused();
 expect(issues.errors).toEqual([]);expect(issues.warnings).toEqual([]);expect(issues.attempts).toEqual([]);
});

// Replace only the build-time recorded block in an otherwise real assembled page.
// The fixture is fulfilled on one exact loopback URL; source JSON is never written.
function recordedFixtureHTML(input:unknown){
 const html=readFileSync(new URL('../../.release/experience.html',import.meta.url),'utf8');
 const section=/<section\b[^>]*\bid="recorded-generation"[^>]*>/.exec(html);
 if(!section||section.index===undefined)throw new Error('Built recorded-generation section is missing');
 const start=section.index+section[0].length,after=html.indexOf('<div class="monitoring-meaning"',start);
 if(after<start)throw new Error('Built recorded-generation continuation is missing');
 return html.slice(0,start)+'\n'+renderRecordedGeneration(input)+'\n'+html.slice(after);
}
async function serveRecordedFixture(page:Page,fixture:string,input:unknown){
 const url=`${origin}/experience?fixture=${fixture}`,html=recordedFixtureHTML(input);
 await page.route(candidate=>candidate.href===url,route=>route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}));
 await page.goto(url+'#recorded-generation');
}

test.describe('recorded generation static data fixtures',()=>{
 test.use({javaScriptEnabled:false});
 test('a valid recorded zero remains 0.00 with zero bars and readings, rather than unavailable or missing',async({page})=>{
  const issues=monitor(page),zero=structuredClone(sample);zero.day_sample.pv_production_kwh=0;
  for(const key of Object.keys(zero.day_sample.hourly_kwh))if(/^\d{2}$/.test(key))zero.day_sample.hourly_kwh[key]=0;
  await serveRecordedFixture(page,'zero',zero);const section=page.locator('#recorded-generation');
  await expect(section.locator('.recorded-generation__total strong')).toHaveText('0.00');
  await expect(section.locator('.recorded-generation__total')).toContainText('kWh recorded that day');
  await expect(section.locator('time')).toHaveAttribute('datetime','2026-08-24');await expect(section).toContainText('Tigo');
  await expect(section.locator('.recorded-generation__unavailable')).toHaveCount(0);await expect(section.locator('.recorded-generation__missing')).toHaveCount(0);
  await expect(section.locator('svg[role="img"]')).toBeVisible();const bars=section.locator('.recorded-generation__bar');await expect(bars).toHaveCount(hours.length);
  expect(await bars.evaluateAll(nodes=>nodes.every(node=>node.getAttribute('data-kwh')==='0'&&Number(node.querySelector('rect')?.getAttribute('height'))===0&&node.querySelector('circle')!==null))).toBe(true);
  await openHourlyTable(section);expect(await section.locator('table tbody td').allTextContents()).toEqual(Array(hours.length).fill('0'));
  await expect(section.locator('table')).not.toContainText('Not recorded');await expect(page.locator('header .apply-link')).toHaveAttribute('href','/apply.html');
  await expect(page.locator('canvas')).toHaveCount(0);expect(issues.errors).toEqual([]);expect(issues.attempts).toEqual([]);
 });
 test('a malformed record shows unavailable without a chart or invented total and keeps the real application link working',async({page})=>{
  const issues=monitor(page),invalid=structuredClone(sample);delete invalid.day_sample.pv_production_kwh;
  await serveRecordedFixture(page,'invalid',invalid);const section=page.locator('#recorded-generation'),notice=section.locator('.recorded-generation__unavailable');
  await expect(notice).toBeVisible();await expect(notice).toContainText('Recorded generation is unavailable.');
  await expect(notice).toContainText('could not be loaded or validated');await expect(section.locator('svg,table,.recorded-generation__total')).toHaveCount(0);
  await expect(notice).not.toContainText(/0\.00|206\.41/);const apply=notice.locator('a[href="/apply.html"]');await expect(apply).toBeVisible();
  await apply.focus();await page.keyboard.press('Enter');await expect(page).toHaveURL(/\/apply\.html$/);await expect(page.locator('#applyForm')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);expect(issues.errors).toEqual([]);expect(issues.attempts).toEqual([]);
 });
});

for(const layout of[
 {name:'390px portrait with all text doubled',normal:{width:390,height:844},target:{width:390,height:844},dpr:1,doubleText:true,framing:'portrait'},
 {name:'640×360 DPR2 zoom-equivalent short viewport',normal:{width:1000,height:500},target:{width:640,height:360},dpr:2,doubleText:false,framing:'short'},
]as const)test.describe(layout.name,()=>{
 test.use({viewport:layout.normal,deviceScaleFactor:layout.dpr});
 test('keeps the operating caption readable and all twelve still labels, payoff and status accessible',async({page})=>{
  const issues=monitor(page);await ready(page);
  // Test the ordinary-motion qualification before switching to the reduced still.
  await page.evaluate(p=>{const j=document.querySelector<HTMLElement>('#journey')!;scrollTo(0,j.getBoundingClientRect().top+scrollY+p/Number(j.dataset.duration)*(j.offsetHeight-innerHeight));},4.20);
  await page.waitForFunction(()=>{const s=(window as any).__experience?.snapshot();return s?.failed||s?.businessStatus==='ready';});
  expect((await snapshot(page)).failed).toBe(false);
  const operating=page.locator('[data-copy="11"] .operation-context');
  await expect(page.locator('[data-copy="11"]')).toHaveAttribute('aria-hidden','false');
  await expect(operating).toHaveText('Illustration of operation after the required permissions and commissioning.');
  const caption=await operating.evaluate(e=>{
   const range=document.createRange();range.selectNodeContents(e);const bounds=e.getBoundingClientRect();
   return {font:parseFloat(getComputedStyle(e).fontSize),contained:[...range.getClientRects()].every(r=>r.left>=Math.max(0,bounds.left)-1&&r.right<=Math.min(innerWidth,bounds.right)+1&&r.top>=0&&r.bottom<=innerHeight)};
  });
  expect(caption.font).toBeGreaterThanOrEqual(16);expect(caption.contained).toBe(true);
  await expect(page.locator('body')).toHaveAttribute('data-framing',layout.framing);

  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize(layout.target);await page.evaluate(()=>scrollTo(0,0));
  await page.locator('[data-still="aesir"]').click();
  await page.waitForFunction(()=>{const s=(window as any).__experience?.snapshot();return s?.failed||s?.storageStatus==='ready';});
  expect((await snapshot(page)).failed).toBe(false);
  const copy=page.locator('[data-copy="18"]'),action=copy.locator('.payoff-action');
  await expect(copy).toHaveAttribute('aria-hidden','false');
  if(layout.doubleText){
   await page.evaluate(()=>{
    const nodes=[...document.querySelectorAll<HTMLElement>('h1,h2,h3,p,a,li,dt,dd,button,summary,th,td,figcaption,caption')];
    const sizes=nodes.map(e=>[e,parseFloat(getComputedStyle(e).fontSize)] as const);for(const[e,size]of sizes)e.style.fontSize=`${size*2}px`;
   });
   await expect(page.locator('body')).toHaveAttribute('data-large-type','true');
  }
  await expect(page.locator('body')).toHaveAttribute('data-framing',layout.framing);
  expect(await page.evaluate(()=>devicePixelRatio)).toBe(layout.dpr);
  const controls=page.locator('#still-views button');await expect(controls).toHaveCount(12);
  await expect(controls).toHaveText(['Sun','Earth','Britain','Roof','Panel','Cell','DC route','Inverter','Business','Storage','Grid','Aesir']);
  await expect(page.locator('#still-views button[aria-pressed="true"]')).toHaveAttribute('data-still','aesir');
  const controlLayout=await controls.evaluateAll(nodes=>nodes.map(e=>{
   const r=e.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
   return {label:e.textContent,contained:[...range.getClientRects()].every(t=>t.left>=r.left-1&&t.right<=r.right+1&&t.top>=r.top-1&&t.bottom<=r.bottom+1),inViewport:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,height:r.height,hit:hit!==null&&e.contains(hit)};
  }));
  for(const control of controlLayout){expect(control.contained,`${control.label} label remains inside its button`).toBe(true);expect(control.inViewport,`${control.label} remains in the viewport`).toBe(true);expect(control.height).toBeGreaterThanOrEqual(44);expect(control.hit,`${control.label} centre remains clickable`).toBe(true);}
  const overlaps=await copy.evaluate(e=>{
   const r=e.getBoundingClientRect();return [...document.querySelectorAll('#still-views button')].filter(b=>{const c=b.getBoundingClientRect();return r.left<c.right&&r.right>c.left&&r.top<c.bottom&&r.bottom>c.top;}).map(b=>b.textContent);
  });
  expect(overlaps,'payoff copy must not cover still controls').toEqual([]);
  for(const link of[page.locator('header .apply-link'),action])await expect(link).toHaveAttribute('href','/apply.html');
  await action.focus();await expect(action).toBeFocused();
  expect(await action.evaluate(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.height>=44&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&hit!==null&&e.contains(hit);})).toBe(true);
  const status=page.getByRole('status');
  await expect(status).toHaveText('Reduced motion: still views. Application details are below.');
  const statusLayout=await status.evaluate(e=>{const r=e.getBoundingClientRect(),css=getComputedStyle(e);return {width:r.width,height:r.height,accessible:!e.closest('[aria-hidden="true"],[inert]')&&css.display!=='none'&&css.visibility!=='hidden'};});
  expect(statusLayout.accessible).toBe(true);expect(statusLayout.width).toBeLessThanOrEqual(2);expect(statusLayout.height).toBeLessThanOrEqual(2);
  const time=(await snapshot(page)).ambientTime;await page.waitForTimeout(120);expect((await snapshot(page)).ambientTime).toBe(time);
  expect(issues.errors).toEqual([]);expect(issues.warnings).toEqual([]);expect(issues.attempts).toEqual([]);
 });
});


test('malformed percent fragments do not turn an otherwise ready journey into a rendering failure',async({page})=>{
 const issues=monitor(page);
 for(const hash of ['#%','#%E0%A4%A']){await ready(page,hash);await expect(page.locator('#canvas-host canvas')).toHaveCount(1);expect((await snapshot(page)).failed).toBe(false);await expect(page.locator('header .apply-link')).toHaveAttribute('href','/apply.html');}
 expect(issues.errors).toEqual([]);expect(issues.warnings).toEqual([]);
});
