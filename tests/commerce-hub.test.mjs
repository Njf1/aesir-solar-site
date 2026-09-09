// No environment files, merchant credentials, databases or provider traffic.
// The public API schema defines a top-level retrieval model; creation is wrapped.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {solarPaymentConfig, commerceSignature, buildSolarCheckout, createSolarPayments, verifySolarCheckout} from '../lib/commerce-hub.js';
const env={NODE_ENV:'production',VERCEL_ENV:'preview',SOLAR_TYL_MODE:'sandbox',SOLAR_TYL_API_KEY:'fixture-key',SOLAR_TYL_API_SECRET:'fixture-secret',SOLAR_TYL_STORE_ID:'999990001',SOLAR_CHECKOUT_ORIGIN:'https://solar.example.invalid'};
const attempt={merchantTransactionId:'AES-TEST-UNIQUE-1',amountPence:30000,currency:'GBP'};
const expected={...attempt,checkoutId:'fixture-checkout-1',storeId:env.SOLAR_TYL_STORE_ID,mode:'sandbox'};
const result=()=>({storeId:expected.storeId,checkoutId:expected.checkoutId,orderId:'gateway-generated-order',requestSent:{merchantTransactionId:expected.merchantTransactionId},transactionType:'SALE',transactionStatus:'APPROVED',approvedAmount:{total:300,currency:'GBP'},ipgTransactionDetails:{ipgTransactionId:'fixture-transaction-1',transactionResult:'APPROVED',approvalCode:'Y:fixture'},paymentMethodUsed:{cards:{cardNumber:'fixture-not-for-storage'}}});
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const created=()=>({checkout:{storeId:expected.storeId,checkoutId:expected.checkoutId,redirectionUrl:'https://checkout-lane.com/?checkoutId=fixture-checkout-1'}});

for(const overrides of [
 {VERCEL_ENV:'production'}, {VERCEL_ENV:'production',NATWEST_ALLOW_SANDBOX:'1'},
 {VERCEL_ENV:undefined,NODE_ENV:'production'}, {SOLAR_TYL_MODE:'live'},
 {SOLAR_TYL_MODE:''}, {SOLAR_TYL_API_KEY:''}, {SOLAR_TYL_API_SECRET:''}, {SOLAR_TYL_STORE_ID:''},
 {SOLAR_CHECKOUT_ORIGIN:'https://attacker@example.invalid'}, {SOLAR_CHECKOUT_ORIGIN:'http://solar.example.invalid'},
 {SOLAR_CHECKOUT_ORIGIN:'https://solar.example.invalid/path'}, {SOLAR_CHECKOUT_ORIGIN:'https://solar.example.invalid/?next=x'},
 {SOLAR_CHECKOUT_ORIGIN:'https://solar.example.invalid/#x'}, {VERCEL_ENV:'unknown'}
]) test('Solar payment configuration refuses '+JSON.stringify(overrides),()=>assert.throws(()=>solarPaymentConfig({...env,...overrides})));

test('Solar payment environments use exact official endpoints and never legacy/Premier credentials',()=>{
 assert.equal(solarPaymentConfig(env).apiBase,'https://prod.emea.api.fiservapps.com/sandbox/exp/v1');
 assert.equal(solarPaymentConfig({...env,VERCEL_ENV:'production',SOLAR_TYL_MODE:'live'}).apiBase,'https://prod.emea.api.fiservapps.com/exp/v1');
 assert.throws(()=>solarPaymentConfig({TYL_STORE_ID:'999990001',TYL_SHARED_SECRET:'fixture',NATWEST_API_KEY:'fixture',NATWEST_API_SECRET:'fixture'}));
});

test('Solar checkout sends the exact signed bytes, fixed fee/VAT and trusted callback origin',async()=>{
 let calls=0;
 const client=createSolarPayments(env,{requestId:()=> 'fixed-request-id',now:()=>123456789,fetchImpl:async(url,options)=>{
  calls++;assert.equal(url,'https://prod.emea.api.fiservapps.com/sandbox/exp/v1/checkouts');
  assert.equal(options.method,'POST');assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');
  const b=JSON.parse(options.body);assert.deepEqual(b,buildSolarCheckout(solarPaymentConfig(env),attempt));
  assert.deepEqual(b.transactionAmount,{total:300,currency:'GBP',components:{subtotal:250,vatAmount:50}});
  assert.equal(b.checkoutSettings.webHooksUrl,'https://solar.example.invalid/api/tyl-notify');
  assert.equal(b.checkoutSettings.redirectBackUrls.successUrl,'https://solar.example.invalid/success.html?ref=AES-TEST-UNIQUE-1');
  const signature=createHmac('sha256','fixture-secret').update('fixture-keyfixed-request-id123456789'+options.body).digest('base64');
  assert.equal(options.headers['Message-Signature'],signature);assert.equal(options.headers['Api-Key'],'fixture-key');
  return json(created(),201);
 }});
 const r=await client.createCheckout({...attempt,amountGBP:'0.01',origin:'https://attacker.invalid'});
 assert.equal(calls,1);assert.equal(r.amountPence,30000);assert.equal(r.storeId,expected.storeId);assert.equal(r.mode,'sandbox');
 assert.doesNotMatch(JSON.stringify(r),/fixture-secret|fixture-key|cardNumber/);
});

test('invalid expected attempts cannot initiate a provider request',async()=>{
 const client=createSolarPayments(env,{fetchImpl:async()=>{assert.fail('must not call provider');}});
 for(const change of [{amountPence:1},{currency:'USD'},{merchantTransactionId:'a/b'},{merchantTransactionId:'a'.repeat(41)}]) await assert.rejects(client.createCheckout({...attempt,...change}),/invalid_expected_attempt/);
});

test('GET signs an empty body and queries only the stored expected checkout',async()=>{
 const client=createSolarPayments(env,{requestId:()=> 'fixed-get-id',now:()=>42,fetchImpl:async(url,options)=>{
  assert.equal(url,'https://prod.emea.api.fiservapps.com/sandbox/exp/v1/checkouts/fixture-checkout-1');
  assert.equal(options.method,'GET');assert.equal(options.body,undefined);
  assert.equal(options.headers['Message-Signature'],commerceSignature('fixture-key','fixture-secret','fixed-get-id','42',''));
  return json(result());
 }});
 const r=await client.verifyCheckout(expected);assert.equal(r.state,'approved');assert.equal(r.transactionId,'fixture-transaction-1');
 assert.doesNotMatch(JSON.stringify(r),/cardNumber|paymentMethodUsed|approvalCode|fixture-secret/);
});

test('checkout, merchant, attempt and sale identity are verified before payment acceptance',()=>{
 for(const change of [{checkoutId:'another'},{storeId:'999990002'},{requestSent:{merchantTransactionId:'AES-OTHER'}},{requestSent:undefined},{transactionType:'PRE-AUTH'},{checkoutId:undefined}]) assert.throws(()=>verifySolarCheckout({...result(),...change},expected));
 assert.throws(()=>verifySolarCheckout({checkout:result()},expected),/checkout_mismatch/,'the creation wrapper is not a retrieval response');
});

test('missing, invalid, partial or wrong-currency approved amounts never authorize work',()=>{
 for(const amount of [undefined,null,{}, {total:null,currency:'GBP'},{total:0,currency:'GBP'},{total:300}, {total:300,currency:'USD'}, {total:299.99,currency:'GBP'}, {total:300.001,currency:'GBP'}, {total:'300xyz',currency:'GBP'}, {total:'',currency:'GBP'}]) assert.throws(()=>verifySolarCheckout({...result(),approvedAmount:amount},expected),/amount_or_currency_mismatch/);
 assert.equal(verifySolarCheckout({...result(),approvedAmount:{total:'300.00',currency:'GBP'}},expected).state,'approved');
});

test('contradictory or incomplete approval detail never authorizes work',()=>{
 for(const detail of [undefined,{}, {ipgTransactionId:'x',approvalCode:'N:fixture'}, {ipgTransactionId:'x',approvalCode:'?:fixture'}, {ipgTransactionId:'x',approvalCode:'Y:fixture',transactionResult:'DECLINED'}, {ipgTransactionId:'x',approvalCode:'Y:fixture',transactionStatus:'FAILED'}]) assert.throws(()=>verifySolarCheckout({...result(),ipgTransactionDetails:detail},expected),/inconsistent_approval/);
});

test('documented waiting, decline and partial states remain separate from approved sales',()=>{
 for(const [status,state] of [['INITIATED','pending'],['WAITING','pending'],['FAILED','declined'],['DECLINED','declined'],['FRAUD','declined'],['PARTIAL','review']]) assert.equal(verifySolarCheckout({...result(),transactionStatus:status,approvedAmount:undefined,ipgTransactionDetails:undefined},expected).state,state);
 for(const status of ['PAID','SUCCESS','COMPLETED',undefined]) assert.throws(()=>verifySolarCheckout({...result(),transactionStatus:status},expected),/unknown_payment_status/);
});

test('a saved attempt from another store or environment never reaches the provider',async()=>{
 const client=createSolarPayments(env,{fetchImpl:async()=>assert.fail('must not call provider')});
 for(const change of [{mode:'live'},{storeId:'999990002'},{checkoutId:'../another'}]) await assert.rejects(client.verifyCheckout({...expected,...change}),/invalid_expected_attempt/);
});

test('a created checkout must belong to this store and redirect to the hosted provider',async()=>{
 for(const patch of [{storeId:'999990002'},{checkoutId:''},{redirectionUrl:'https://attacker.invalid/'},{redirectionUrl:'http://checkout-lane.com/'},{redirectionUrl:'https://checkout-lane.com.attacker.invalid/'},{redirectionUrl:'https://user@checkout-lane.com/'}]){
  const client=createSolarPayments(env,{fetchImpl:async()=>json({checkout:{...created().checkout,...patch}},201)});
  await assert.rejects(client.createCheckout(attempt),e=>e.uncertain===true,'a checkout may have been created; do not blindly retry');
 }
});

test('provider failures are bounded, contain no response/customer text and are not automatically retried',async()=>{
 for(const status of [400,401,403,429,500]){
  let calls=0;const client=createSolarPayments(env,{fetchImpl:async()=>{calls++;return json({secret:'must never escape'},status);}});
  await assert.rejects(client.createCheckout(attempt),e=>e.message==='provider_http_'+status && e.uncertain===![400,401,403].includes(status));assert.equal(calls,1);
 }
 for(const response of [new Response('{broken',{status:201}),new Response('x'.repeat(65537),{status:201})]){
  const client=createSolarPayments(env,{fetchImpl:async()=>response});
  await assert.rejects(client.createCheckout(attempt),e=>e.uncertain===true);
 }
});

test('an interrupted creation is uncertain and aborts instead of starting another checkout',async()=>{
 let calls=0;
 const client=createSolarPayments(env,{timeoutMs:10,fetchImpl:async(_,opts)=>{calls++;return new Promise((resolve,reject)=>opts.signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')),{once:true}));}});
 await assert.rejects(client.createCheckout(attempt),e=>e.code==='provider_timeout'&&e.uncertain===true);assert.equal(calls,1);
});

test('local terms, privacy and shared supporting pages identify the user-confirmed legal merchant',async()=>{
 assert.match(await readFile('terms.html','utf8'),/Aesir Limited, trading as Aesir Solar/);
 assert.match(await readFile('privacy.html','utf8'),/Aesir Limited, trading as Aesir Solar, is the data controller/);
 for(const slug of ['apply','success','contact','refunds']) assert.match(await readFile(slug+'.html','utf8'),/Aesir Solar is a trading name of Aesir Limited/);
});
