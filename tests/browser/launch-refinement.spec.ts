import {test,expect} from '@playwright/test';
const views=[['laptop',1280,720],['desktop',1600,1000],['portrait',390,844],['intermediate',740,900],['short',1000,500]] as const;
for(const[name,width,height]of views)test(`supporting guidance remains readable at enlarged text: ${name}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height},javaScriptEnabled:false});const page=await context.newPage(),requests:string[]=[];
 await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin==='http://127.0.0.1:4173'&&!u.pathname.startsWith('/api/')?r.continue():r.abort();});page.on('request',r=>requests.push(r.url()));
 for(const slug of['solar','suitability','faq']){
  await page.goto(`http://127.0.0.1:4173/${slug}.html`);
  await page.evaluate(()=>{for(const e of document.querySelectorAll<HTMLElement>('h1,h2,h3,p,a,summary,li,label,td,th,figcaption,dt,dd'))e.style.fontSize=`${parseFloat(getComputedStyle(e).fontSize)*2}px`;});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  await expect(page.locator('header a[href="/apply.html"]')).toBeVisible();
  if(slug==='solar'){
   const record=page.locator('#recorded-generation');await expect(record).toContainText('24 August 2026');await expect(record).toContainText('206.41');await expect(record).toContainText('kWh per hour interval');
   const detail=record.locator('details:has(table)');await detail.locator('summary').click();await expect(record.locator('table')).toBeVisible();await expect(record.locator('table tbody tr')).toHaveCount(15);
  }
  if(slug==='faq'){await expect(page.locator('main')).toContainText('paperwork');await expect(page.locator('a[href="/refunds.html"]').first()).toHaveCount(1);}
 }
 expect(requests.some(u=>/\/(scene|three|business|site)-[^/]+\.js/.test(u))).toBe(false);await expect(page.locator('canvas')).toHaveCount(0);await context.close();
});
test('short homepage keeps offer first and sends further detail to complete native pages',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 const order=await page.locator('main > section, main .conversion, main .editorial-section').evaluateAll(es=>es.map(e=>e.id).filter(Boolean));expect(order.indexOf('application-details')).toBeLessThan(order.indexOf('application-process'));
 await page.locator('.skip-link').click();await expect(page.locator('#application-details')).toBeFocused();
 await expect(page.locator('#application-details')).toContainText('£250 fee + £50 VAT');
 await page.locator('#check a[href="/suitability.html"]').click();await expect(page).toHaveURL(/\/suitability\.html$/);await expect(page.locator('#eligibility-checker')).toHaveCount(1);
 await page.goBack();await expect(page).toHaveURL(/#application-details$/);
 await page.locator('#application-faqs a[href="/faq.html"]').click();await expect(page).toHaveURL(/\/faq\.html$/);
 await page.locator('header a[href="/apply.html"]').click();await expect(page.locator('#applyForm [name]')).toHaveCount(19);await expect(page.locator('#agree')).toHaveAttribute('required','');await expect(page.locator('#privacy')).toHaveAttribute('required','');
});
