import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('application controller has exactly one payment initializer and no old shop or alternate-processor escape',async()=>{
  const controller=await readFile('app.js','utf8');
  assert.doesNotMatch(controller,/add-to-cart|aesir\.addedAt|checkoutUrl|fallbackCheckout|tryStripe|FORM_ENDPOINT|https:\/\/aesirsolar\.co\.uk\/cart/);
  assert.deepEqual([...controller.matchAll(/fetch\(['"](\/api\/(?:tyl-)?checkout)['"]/g)].map(m=>m[1]),['/api/tyl-checkout']);
  assert.doesNotMatch(controller,/Saving your details and opening|nothing is lost/);
  assert.match(controller,/controller\.abort\(\)/);
});

test('payment policy copy matches the Tyl-only candidate without changing the fee or refund policy',async()=>{
  for(const slug of ['terms','privacy']){
    const text=await readFile(`templates/site/${slug}.html`,'utf8');
    assert.match(text,/Tyl by NatWest/);assert.doesNotMatch(text,/Stripe|fallback routes/);
  }
  const application=await readFile('.release/apply.html','utf8');
  for(const value of ['£250.00','£50.00','£300.00'])assert.ok(application.includes(value));
  for(const link of ['terms.html','refunds.html','privacy.html'])assert.ok(application.includes(`href="${link}"`));
});
