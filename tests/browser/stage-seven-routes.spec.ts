// Proposed tests/browser/stage-seven.spec.ts — aligned with integrated source.
// Not browser-executed by this subtask. CHECK matches the final native form.
// Tests never contact a provider or submit a real application.
import {test,expect,type Page,type Browser} from '@playwright/test';

const ORIGIN='http://127.0.0.1:4173';
const CHECK={root:'#eligibility-checker',aggregate:'aggregateCurrent',unit:'unitCurrent',tt:'typeTested',eps:'eps',g100:'g100',existing:'existingKnown'};
const ALIASES=['top','main','gate','check','work','price','apply','realroof'] as const;
const FIELDS=['company','contact','email','phone','accreditation','address','postcode','mpan','inverter','typetest','kw','phases','storage','target','g100','eps','notes','agree','privacy'];
const FILM=/(?:\/experience-[^/]+\.js|\/scene-[^/]+\.js|\/three(?:\.core)?-[^/]+\.js|\/earth-(?:day|clouds)-|\/business-(?!journey)[^/]+\.js|\/storage-(?!path)[^/]+\.js|\/src\/experience\/main\.ts)/;

async function isolated(page:Page){
 const errors:string[]=[],requests:{url:string;method:string}[]=[],unexpected:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>requests.push({url:request.url(),method:request.method()}));
 await page.route('**/*',async route=>{
  const request=route.request(),u=new URL(request.url());
  if(u.origin!==ORIGIN){unexpected.push(request.url());return route.abort();}
  if(u.pathname.startsWith('/api/')||!['GET','HEAD'].includes(request.method()))return route.fulfill({status:503,contentType:'application/json',body:'{"error":"local_preview_only"}'});
  return route.continue();
 });
 return {errors,requests,unexpected,api:()=>requests.filter(r=>new URL(r.url).pathname.startsWith('/api/')),film:()=>requests.filter(r=>FILM.test(new URL(r.url).pathname))};
}
async function noJs(browser:Browser,run:(page:Page,traffic:Awaited<ReturnType<typeof isolated>>)=>Promise<void>){
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});try{const page=await context.newPage();await run(page,await isolated(page));}finally{await context.close();}
}
function clean(traffic:Awaited<ReturnType<typeof isolated>>){expect(traffic.errors).toEqual([]);expect(traffic.unexpected).toEqual([]);}
async function showChecker(page:Page){await page.goto('/suitability.html#eligibility-checker');const checker=page.locator(CHECK.root);await expect(checker).toBeInViewport();return checker;}
async function choose(page:Page,name:string,value:'yes'|'no'|'unknown'){
 const select=page.locator(`${CHECK.root} select[name="${name}"]`);
 if(await select.count())await select.selectOption(value);
 else await page.locator(`${CHECK.root} input[name="${name}"][value="${value}"]`).check();
}
async function assertContactOnlyResult(page:Page){
 const root=page.locator(CHECK.root),status=root.getByRole('status');await expect(status).not.toBeEmpty();
 const hrefs=await root.locator('a:visible').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')||''));
 expect(hrefs.some(h=>/^\/?contact(?:\.html)?(?:[?#]|$)|^mailto:hello@aesirsolar\.co\.uk/.test(h))).toBe(true);
 expect(hrefs.filter(h=>/^\/?apply(?:\.html)?(?:[?#]|$)|cart|checkout|add-to-cart/i.test(h))).toEqual([]);
 await expect(root.locator('button[type="submit"]')).toHaveCount(0);
}

test('homepage route forms preserve queries and serve the same experience without a navigation redirect',async({page})=>{
 const traffic=await isolated(page);await page.emulateMedia({reducedMotion:'reduce'});
 for(const route of ['/', '/index','/index.html','/experience','/experience.html']){
  const response=await page.goto(`${route}?campaign=route-contract&keep=%26value#application-process`);expect(response?.status()).toBe(200);
  expect(response?.request().redirectedFrom()).toBeNull();expect(new URL(page.url()).search).toBe('?campaign=route-contract&keep=%26value');expect(new URL(page.url()).hash).toBe('#application-process');
  await expect(page.locator('#application-process').getByRole('heading').first()).toBeInViewport();await expect(page.locator('header a[href="/apply.html"]')).toBeVisible();
 }
 expect(traffic.api()).toEqual([]);clean(traffic);
});

test('every legacy fragment is a native no-JS destination with focus and browser Back',async({browser})=>{
 await noJs(browser,async(page,traffic)=>{
  await page.goto('/index.html?source=legacy');
  // A real native link provides a focused origin even for compatibility anchors
  // no longer promoted by the new navigation. No page implementation is patched.
  for(const id of ALIASES){
   await page.evaluate(id=>{document.querySelector('#route-test-origin')?.remove();const a=document.createElement('a');a.id='route-test-origin';a.href=`#${id}`;a.textContent=`Test native ${id} destination`;document.body.append(a);},id);
   const origin=page.locator('#route-test-origin');await origin.focus();await page.keyboard.press('Enter');
   await expect(page).toHaveURL(new RegExp(`#${id}$`));const anchor=page.locator(`[id="${id}"]`);await expect(anchor).toHaveCount(1);
   const state=await anchor.evaluate(e=>{const r=e.getBoundingClientRect();return {top:r.top,view:innerHeight,focused:document.activeElement===e,hidden:!!e.closest('[hidden],[aria-hidden="true"],[inert]')};});
   expect(state.hidden).toBe(false);expect(state.top).toBeGreaterThanOrEqual(-1);expect(state.top).toBeLessThan(state.view);expect(state.focused,`${id} accepts native fragment focus`).toBe(true);
   await page.goBack();expect(new URL(page.url()).search).toBe('?source=legacy');expect(new URL(page.url()).hash).toBe('');
  }
  expect(traffic.api()).toEqual([]);expect(traffic.film()).toEqual([]);clean(traffic);
 });
});

test('supporting routes and clean-URL equivalents contain real content without starting the film',async({page})=>{
 const traffic=await isolated(page);
 for(const slug of ['apply','success','contact','terms','privacy','refunds','simulator'])for(const suffix of ['','.html']){
  const response=await page.goto(`/${slug}${suffix}?route=retained`);expect(response?.status()).toBe(200);
  await expect(page.locator('main')).toBeVisible();await expect(page.getByRole('heading',{level:1})).not.toBeEmpty();await expect(page.locator('canvas')).toHaveCount(0);
  expect(new URL(page.url()).search).toBe('?route=retained');
 }
 expect(traffic.film()).toEqual([]);expect(traffic.requests.filter(r=>/\/sim\.js(?:\?|$)/.test(r.url))).toEqual([]);expect(traffic.api()).toEqual([]);clean(traffic);
});

test('the full FAQ page works without JavaScript and preserves the complete native answers',async({browser})=>{
 await noJs(browser,async(page,traffic)=>{
  await page.goto('/faq.html');await expect(page).toHaveURL(/\/faq\.html$/);
  const section=page.locator('#application-faqs');await expect(section.getByRole('heading').first()).toBeInViewport();await expect(section.locator('details')).not.toHaveCount(0);
  await expect(section).toContainText('£300');await expect(section).toContainText(/approval|timing/i);const refund=section.locator('a[href="/refunds.html"]').first();await expect(refund).toHaveCount(1);const refundDetail=refund.locator('xpath=ancestor::details[1]');if(await refundDetail.count()&&!await refundDetail.evaluate(e=>(e as HTMLDetailsElement).open))await refundDetail.locator('summary').click();await expect(refund).toBeVisible();
  expect(traffic.film()).toEqual([]);expect(traffic.api()).toEqual([]);clean(traffic);
 });
});

test('all nineteen form names, units, options and separate unchecked consent meanings survive the reskin',async({page})=>{
 const traffic=await isolated(page);await page.goto('/apply.html');const form=page.locator('#applyForm');
 expect(await form.locator('input[name],select[name],textarea[name]').evaluateAll(nodes=>nodes.map(e=>e.getAttribute('name')))).toEqual(FIELDS);
 for(const name of ['contact','email','phone','address','postcode','inverter','kw','agree','privacy'])await expect(form.locator(`[name="${name}"]`)).toHaveAttribute('required','');
 await expect(form.locator('[name="email"]')).toHaveAttribute('type','email');await expect(form.locator('[name="phone"]')).toHaveAttribute('type','tel');
 await expect(form.locator('[name="kw"]')).toHaveAttribute('step','0.01');await expect(form.locator('[name="storage"]')).toHaveAttribute('step','0.1');
 await expect(form.locator('[name="target"]')).toHaveAttribute('type','date');expect(await form.locator('[name="phases"] option').evaluateAll(nodes=>nodes.map(n=>(n as HTMLOptionElement).value))).toEqual(['1','3']);
 for(const name of ['agree','privacy'])await expect(form.locator(`[name="${name}"]`)).not.toBeChecked();
 const agreement=form.locator('label:has(input[name="agree"])'),privacy=form.locator('label:has(input[name="privacy"])');
 await expect(agreement).toContainText(/terms/i);await expect(agreement).toContainText(/refund/i);await expect(privacy).toContainText(/network operator/i);
 for(const[owner,file]of[[agreement,'terms'],[agreement,'refunds'],[privacy,'privacy']]as const)await expect(owner.locator(`a[href$="${file}.html"]`)).toHaveCount(1);
 await expect(page.locator('main')).toContainText(/£250(?:\.00)?/);await expect(page.locator('main')).toContainText(/£50(?:\.00)?/);await expect(page.locator('main')).toContainText(/£300(?:\.00)?/);
 expect(traffic.api()).toEqual([]);clean(traffic);
});

test('existing prefill keys keep their meanings and payment submission sends the full dummy contract only to a local fixture',async({page})=>{
 const traffic=await isolated(page);
 await page.addInitScript(()=>localStorage.setItem('aesir.prefill',JSON.stringify({kw:'5.00',phases:3,g100:true,eps:false})));
 await page.goto('/apply?campaign=preserved');const form=page.locator('#applyForm');
 await expect(form.locator('[name="kw"]')).toHaveValue('5.00');await expect(form.locator('[name="phases"]')).toHaveValue('3');await expect(form.locator('[name="g100"]')).toBeChecked();await expect(form.locator('[name="eps"]')).not.toBeChecked();
 const values={company:'Offline Test Ltd',contact:'Test Applicant',email:'test@example.invalid',phone:'0000000000',accreditation:'TEST-ONLY',address:'1 Test Street',postcode:'SW1A 1AA',mpan:'1012345678345',inverter:'Dummy inverter',typetest:'DUMMY/00000',kw:'5.00',storage:'4.2',target:'2027-01-14',notes:'Offline fixture only — do not create an application'};
 for(const[name,value]of Object.entries(values))await form.locator(`[name="${name}"]`).fill(value);
 await form.locator('[name="agree"]').check();await form.locator('[name="privacy"]').check();
 let submitted:any,hosted:any;
 // Registered after the generic guard: Playwright's newest matching route wins.
 await page.route(`${ORIGIN}/api/tyl-checkout`,async route=>{submitted=route.request().postDataJSON();await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({action:`${ORIGIN}/__test__/hosted-payment`,fields:{fixture:'only'},orderId:'LOCAL-TEST',amount:'300.00',net:'250.00'})});});
 await page.route(`${ORIGIN}/__test__/hosted-payment`,async route=>{hosted={method:route.request().method(),body:route.request().postData()};await route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><h1>Intercepted local payment fixture</h1>'});});
 await form.locator('#submitBtn').click();await expect(page.getByRole('heading',{name:'Intercepted local payment fixture'})).toBeVisible();
 for(const[name,value]of Object.entries(values))expect(submitted[name],name).toBe(value);
 expect(submitted.phases).toBe('3');expect(submitted.g100).toBe(true);expect(submitted.eps).toBe(false);expect(submitted.acceptedTerms).toBe(true);expect(submitted.acceptedPrivacy).toBe(true);expect(submitted.amountGBP).toBe('300.00');expect(Number.isFinite(Date.parse(submitted.submittedAt))).toBe(true);
 expect(hosted).toEqual({method:'POST',body:'fixture=only'});expect(traffic.api().map(r=>new URL(r.url).pathname)).toEqual(['/api/tyl-checkout']);clean(traffic);
});

test('payment return query variants survive and never announce an unverified charge, receipt or received application',async({page})=>{
 const traffic=await isolated(page);
 for(const route of ['/success','/success.html?session_id=cs_test_offline','/success?order=LOCAL%26ORDER','/apply?cancelled=1','/apply.html?payment=pending','/apply?payment=unverified','/apply?payment=declined&reason=fixture','/success?order=unknown&session_id=unknown']){
  await page.goto(route);expect(new URL(page.url()).search).toBe(new URL(route,ORIGIN).search);
  const visible=await page.locator('main').innerText();expect(visible).not.toMatch(/payment received|Stripe has sent|we(?:’|')ve got your installation|your application is with us|you have not been charged|receipt (?:has been|was) sent/i);
  if(route.startsWith('/success'))expect(visible).toMatch(/not (?:yet )?(?:confirmed|verified)|cannot confirm|could not confirm|unverified|awaiting confirmation/i);
  if(route.includes('cancelled=1'))expect(visible).toMatch(/cancel|not completed|not confirmed/i);
 }
 expect(traffic.api()).toEqual([]);expect(traffic.film()).toEqual([]);clean(traffic);
});

test('no JavaScript leaves a deliberate non-submitting application path and a truthful unverified success page',async({browser})=>{
 await noJs(browser,async(page,traffic)=>{
  await page.goto('/apply.html');const submit=page.locator('#submitBtn');
  expect(!await submit.isVisible()||await submit.isDisabled(),'No-JS must not submit personal fields to the current URL').toBe(true);
  await expect(page.locator('main')).toContainText(/JavaScript|email|contact/i);await expect(page.locator('#application-availability a[href="mailto:hello@aesirsolar.co.uk"]').first()).toBeVisible();
  await page.locator('[name="company"]').fill('Offline no-JS check');await page.locator('[name="company"]').press('Enter');expect(new URL(page.url()).search).toBe('');
  expect(new URL(page.url()).search).toBe('');
  await page.goto('/success.html?order=UNVERIFIED');const content=await page.locator('main').innerText();expect(content).toMatch(/not (?:yet )?(?:confirmed|verified)|cannot confirm|unverified|awaiting confirmation/i);expect(content).not.toMatch(/payment received|Stripe has sent|application is with us/i);
  expect(traffic.api()).toEqual([]);expect(traffic.film()).toEqual([]);clean(traffic);
 });
});

test('checker starts unknown and every result leads only to suitability contact',async({page})=>{
 const traffic=await isolated(page);const checker=await showChecker(page);await expect(checker.getByRole('status')).toContainText(/enter|unknown|confirm|information|review/i);await assertContactOnlyResult(page);
 for(const scenario of[
  {aggregate:'10',unit:'10',tt:'yes',eps:'no',g100:'no',existing:'yes'},
  {aggregate:'21.74',unit:'21.74',tt:'yes',eps:'no',g100:'no',existing:'yes'},
  {aggregate:'50',unit:'30',tt:'yes',eps:'no',g100:'yes',existing:'yes'},
  {aggregate:'70',unit:'35',tt:'yes',eps:'no',g100:'yes',existing:'yes'},
  {aggregate:'25',unit:'20',tt:'unknown',eps:'unknown',g100:'unknown',existing:'unknown'},
 ]as const){
  await checker.locator(`[name="${CHECK.aggregate}"]`).fill(scenario.aggregate);await checker.locator(`[name="${CHECK.unit}"]`).fill(scenario.unit);
  for(const[key,name]of[['tt',CHECK.tt],['eps',CHECK.eps],['g100',CHECK.g100],['existing',CHECK.existing]]as const)await choose(page,name,scenario[key]);
  await assertContactOnlyResult(page);
  if(scenario.aggregate==='70')await expect(checker.getByRole('status')).toContainText(/outside|beyond|standard|review|scope/i);
  if(scenario.tt==='unknown')await expect(checker.getByRole('status')).toContainText(/unknown|confirm|information|review/i);
 }
 // Clearing a formerly plausible value must remove stale positive guidance.
 await checker.locator(`[name="${CHECK.aggregate}"]`).fill('');await expect(checker.getByRole('status')).toContainText(/enter|missing|unknown|confirm|information/i);await assertContactOnlyResult(page);
 expect(traffic.api()).toEqual([]);clean(traffic);
});

test('marketing, retirement and contact reading never request payment or live telemetry',async({page})=>{
 const traffic=await isolated(page);await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');for(const id of ['application-details','solar-benefits','recorded-generation','application-process','application-faqs'])await page.locator(`#${id}`).evaluate(e=>e.scrollIntoView());
 for(const route of ['/contact.html','/simulator.html','/terms.html','/privacy.html','/refunds.html'])await page.goto(route);
 expect(traffic.api()).toEqual([]);expect(traffic.requests.filter(r=>!['GET','HEAD'].includes(r.method))).toEqual([]);clean(traffic);
});

test('unknown local routes remain genuine 404s and provider paths cannot become marketing HTML',async({request})=>{
 for(const route of ['/not-a-real-route','/not-a-real-route.html']){const response=await request.get(route);expect(response.status()).toBe(404);expect(await response.text()).not.toContain('id="journey"');}
 // The loopback preview is explicitly isolated. This never targets deployment.
 for(const route of ['/api/checkout','/api/tyl-checkout','/api/tyl-return','/api/tyl-notify','/api/tigo']){
  const response=await request.get(`${ORIGIN}${route}`);expect(response.status()).toBe(503);expect(response.headers()['content-type']).toContain('application/json');expect(await response.text()).toContain('local_preview_only');
 }
});


test('failed or delayed application-controller loading keeps a non-submitting email fallback and preserves return context',async({page})=>{
 const traffic=await isolated(page);
 await page.route(`${ORIGIN}/app.js`,route=>route.abort());
 await page.goto('/apply.html?payment=unverified');
 await expect(page.locator('#submitBtn')).toBeDisabled();await expect(page.locator('#application-availability')).toBeVisible();
 await expect(page.locator('#payStatus')).toContainText(/could not confirm/i);
 await page.locator('[name="company"]').fill('Offline blocked-controller fixture');await page.locator('[name="company"]').press('Enter');
 expect(new URL(page.url()).search).toBe('?payment=unverified');expect(traffic.api()).toEqual([]);
 await page.unroute(`${ORIGIN}/app.js`);
 let release!:()=>void;const held=new Promise<void>(resolve=>{release=resolve;});
 await page.route(`${ORIGIN}/app.js`,async route=>{await held;await route.continue();});
 try{
  await page.goto('/apply.html?campaign=delayed',{waitUntil:'commit'});
  await expect(page.locator('#submitBtn')).toBeDisabled();await expect(page.locator('#application-availability')).toBeVisible();
  await page.locator('[name="company"]').fill('Offline delayed-controller fixture');await page.locator('[name="company"]').press('Enter');
  expect(new URL(page.url()).search).toBe('?campaign=delayed');expect(traffic.api()).toEqual([]);
 }finally{release();}
 await expect(page.locator('#submitBtn')).toBeEnabled();await expect(page.locator('#application-availability')).toBeHidden();clean(traffic);
});

test('untrusted return references are text and ordinary support headings keep the application link',async({page})=>{
 const traffic=await isolated(page);
 await page.goto('/success.html?order=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E');
 await expect(page.locator('#return-reference code')).toHaveText('<img src=x onerror=alert(1)>');await expect(page.locator('#return-reference img')).toHaveCount(0);
 for(const route of ['/success.html','/contact.html','/simulator.html','/terms.html','/privacy.html','/refunds.html']){
  await page.goto(route);await expect(page.locator('header a[href="/apply.html"]')).toHaveText(/Start your application/);
 }
 expect(traffic.api()).toEqual([]);expect(traffic.film()).toEqual([]);clean(traffic);
});


test('enlarged application text reflows paired controls and keeps the selected supply readable',async({page})=>{
 for(const width of[1000,1600]){
  await page.setViewportSize({width,height:500});await page.goto('/apply.html');
  await page.evaluate(()=>{const nodes=[...document.querySelectorAll<HTMLElement>('h1,h2,h3,p,a,label,li,input,select,textarea,button')],sizes=nodes.map(e=>[e,parseFloat(getComputedStyle(e).fontSize)] as const);for(const[e,size]of sizes)e.style.fontSize=`${size*2}px`;});
  await expect(page.locator('body')).toHaveAttribute('data-large-form','true');
  const supply=page.locator('select[name="phases"]');const fit=await supply.evaluate((e:HTMLSelectElement)=>{const style=getComputedStyle(e),ctx=document.createElement('canvas').getContext('2d')!;ctx.font=style.font;return{needed:ctx.measureText(e.selectedOptions[0].text).width+parseFloat(style.paddingLeft)+parseFloat(style.paddingRight)+24,available:e.clientWidth};});expect(fit.available).toBeGreaterThan(fit.needed);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  const flow=await page.evaluate(()=>{const main=document.querySelector('main')!.getBoundingClientRect(),order=document.querySelector('.apply-side')!.getBoundingClientRect(),footer=document.querySelector('footer')!.getBoundingClientRect();return{orderBottom:order.bottom,mainBottom:main.bottom,footerTop:footer.top};});
  expect(flow.orderBottom).toBeLessThanOrEqual(flow.mainBottom);expect(flow.orderBottom).toBeLessThan(flow.footerTop);
  await expect(page.locator('input[name="target"]')).toHaveAttribute('type','date');await expect(page.locator('input[name="agree"]')).toBeEnabled();await expect(page.locator('input[name="privacy"]')).toBeEnabled();
 }
});
