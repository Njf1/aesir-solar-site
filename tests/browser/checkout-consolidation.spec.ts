import { test, expect, type Page } from '@playwright/test';

const ORIGIN = 'http://127.0.0.1:4173';
const ENDPOINT = ORIGIN + '/api/checkout';
const values = {contact:'Local Test',email:'test@example.invalid',phone:'0000000000',address:'1 Fixture Street',postcode:'SW1A 1AA',inverter:'TEST ONLY',kw:'5'};

async function prepare(page: Page) {
  const requests: string[] = [], escaped: string[] = [], errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', route => {
    const req = route.request(), url = new URL(req.url());
    if (url.origin !== ORIGIN) { escaped.push(req.url()); return route.abort(); }
    if (url.pathname.startsWith('/api/') || req.method() === 'POST') {
      requests.push(url.pathname);
      return route.fulfill({status:503,contentType:'application/json',body:'{"error":"local_preview_only"}'});
    }
    return route.continue();
  });
  await page.goto('/apply.html?campaign=checkout-review');
  for (const [name,value] of Object.entries(values)) await page.locator(`[name="${name}"]`).fill(value);
  await page.locator('[name="agree"]').check();
  await page.locator('[name="privacy"]').check();
  return {requests,escaped,errors};
}

async function expectContainedFailure(page: Page) {
  await expect(page).toHaveURL(ORIGIN + '/apply.html?campaign=checkout-review');
  const note = page.locator('#formNote');
  await expect(note).toContainText('Your entries remain on this page');
  await expect(note).toContainText('not confirmation');
  await expect(note).toBeFocused();
  await expect(note.locator('a')).toHaveAttribute('href','mailto:hello@aesirsolar.co.uk');
  await expect(page.locator('#submitBtn')).toBeEnabled();
  for (const [name,value] of Object.entries(values)) await expect(page.locator(`[name="${name}"]`)).toHaveValue(value);
  expect(await page.evaluate(() => localStorage.getItem('aesir.addedAt'))).toBeNull();
  expect(await page.locator('canvas').count()).toBe(0);
}

test('missing Stripe/storage setup stays in the new application with entries, contact and a truthful outcome',async({page}) => {
  const traffic = await prepare(page);
  await page.locator('#submitBtn').click();
  await expectContainedFailure(page);
  expect(traffic.requests).toEqual(['/api/checkout']);
  expect(traffic.escaped).toEqual([]); expect(traffic.errors).toEqual([]);
});

test('network, malformed JSON and invalid handoff responses never switch to Tyl or the old cart',async({page}) => {
  for (const mode of ['network','html','empty','invalid-fields']) {
    const traffic = await prepare(page);
    let attempts = 0;
    await page.route(ENDPOINT,route => {
      attempts++;
      if (mode === 'network') return route.abort('failed');
      if (mode === 'html') return route.fulfill({status:502,contentType:'text/html',body:'Upstream unavailable'});
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(mode === 'empty' ? {} : {action:ORIGIN+'/__test__/bad',fields:[]})});
    });
    await page.locator('#submitBtn').click();
    await expectContainedFailure(page);
    expect(attempts).toBe(1);expect(traffic.requests).toEqual([]);expect(traffic.escaped).toEqual([]);expect(traffic.errors).toEqual([]);
    await page.unroute(ENDPOINT);
    await page.unroute('**/*');
  }
});

test('a delayed handoff has a bounded wait and cannot create concurrent attempts',async({page}) => {
  const traffic = await prepare(page);
  await page.clock.install();
  let attempts = 0;
  await page.route(ENDPOINT,async route => {
    attempts++;
    await new Promise(resolve => setTimeout(resolve,1000));
    await route.abort().catch(() => {});
  });
  await page.locator('#submitBtn').click();
  await expect(page.locator('#submitBtn')).toBeDisabled();
  await page.locator('#applyForm').evaluate(form => (form as HTMLFormElement).requestSubmit());
  expect(attempts).toBe(1);
  await page.clock.fastForward(15001);
  await expectContainedFailure(page);
  expect(attempts).toBe(1);expect(traffic.escaped).toEqual([]);expect(traffic.errors).toEqual([]);
});

test('payment help and retained form entries fit narrow, intermediate and short screens',async({page}) => {
  for (const [width,height] of [[390,844],[740,900],[1000,500]]) {
    await page.setViewportSize({width,height});
    const traffic = await prepare(page);
    await page.locator('#submitBtn').click();
    await expectContainedFailure(page);
    await expect(page.locator('#formNote a')).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(traffic.escaped).toEqual([]);expect(traffic.errors).toEqual([]);
    await page.unroute('**/*');
  }
});


test('verified test return reports a test result while failed or unsigned returns stay unverified', async({page}) => {
  const id='f0000000-0000-4000-8000-000000000002';
  await page.addInitScript((id)=>localStorage.setItem('aesir.checkout',JSON.stringify({applicationId:id,accessToken:'a'.repeat(64)})),id);
  await page.route('**/api/application-status',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({id,status:'paid',testMode:true})}));
  await page.goto('/success.html?application='+id);
  await expect(page.locator('#payment-heading')).toHaveText('Test payment verified.');
  await expect(page.locator('#payment-status')).toContainText('No real money was taken');
  await expect(page.locator('#payment-caution')).toBeHidden();
  await page.goto('/success.html?application=f0000000-0000-4000-8000-000000000003');
  await expect(page.locator('#payment-heading')).toContainText('not verified');
});

test('retry retains the same private reference and full application after a network failure',async({page})=>{
  await prepare(page);const payloads:any[]=[];
  await page.route(ENDPOINT,route=>{payloads.push(route.request().postDataJSON());return route.fulfill({status:503,contentType:'application/json',body:'{}'});});
  await page.locator('#submitBtn').click();await expectContainedFailure(page);
  await page.locator('#submitBtn').click();await expectContainedFailure(page);
  expect(payloads.length).toBe(2);expect(payloads[0].applicationId).toBe(payloads[1].applicationId);expect(payloads[0].accessToken).toBe(payloads[1].accessToken);
});


test('cancellation restores details but leaves both consents for fresh confirmation',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('aesir.application',JSON.stringify({contact:'Restored Test',notes:'Complete retained note',g100:true,agree:'on',privacy:'on'}));
  });
  await page.goto('/apply.html?cancelled=1');
  await expect(page.locator('[name="contact"]')).toHaveValue('Restored Test');
  await expect(page.locator('[name="notes"]')).toHaveValue('Complete retained note');
  await expect(page.locator('[name="g100"]')).toBeChecked();
  await expect(page.locator('[name="agree"]')).not.toBeChecked();
  await expect(page.locator('[name="privacy"]')).not.toBeChecked();
});

test('checkout rate limits preserve entries and focus a useful contact explanation',async({page})=>{
 const traffic=await prepare(page);
 await page.route(ENDPOINT,route=>route.fulfill({status:429,contentType:'application/json',body:JSON.stringify({error:'checkout_rate_limited'})}));
 await page.locator('#submitBtn').click();
 await expect(page.locator('#formNote')).toContainText('Too many new payment attempts');
 await expect(page.locator('#formNote')).toBeFocused();
 await expect(page.locator('#formNote a')).toHaveAttribute('href','mailto:hello@aesirsolar.co.uk');
 for(const[name,value]of Object.entries(values))await expect(page.locator(`[name="${name}"]`)).toHaveValue(value);
 expect(traffic.escaped).toEqual([]);
});
