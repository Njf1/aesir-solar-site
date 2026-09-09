// Local rendering and failure review only. All nonlocal traffic is blocked;
// all API/POST requests are intercepted before the server and no order is made.
import {chromium,webkit} from '@playwright/test';
import {launchOptions} from './browser-options.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:4173',root='docs/operations/checkout-migration';
await mkdir(root,{recursive:true});
const report={at:new Date().toISOString(),scope:'Local dummy form; simulated unavailable initializer. No payment, application or external request.',views:[]};
for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch(name==='chromium'?launchOptions:{headless:true});
 try{for(const [width,height] of [[1280,720],[1600,1000],[390,844],[740,900],[1000,500]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
  try{
   const page=await context.newPage(),external=[],api=[],errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',route=>{
    const req=route.request(),u=new URL(req.url());
    if(u.origin!==origin){external.push(req.url());return route.abort();}
    if(u.pathname.startsWith('/api/')||req.method()==='POST'){api.push(u.pathname);return route.fulfill({status:503,contentType:'application/json',body:'{"error":"local_preview_only"}'});}
    return route.continue();
   });
   await page.goto(origin+'/apply.html');
   for(const [field,value] of Object.entries({contact:'Local Test Applicant',email:'test@example.invalid',phone:'0000000000',address:'1 Fixture Street',postcode:'SW1A 1AA',inverter:'Illustrative test only',kw:'5'}))await page.locator(`[name="${field}"]`).fill(value);
   await page.locator('[name="agree"]').check();await page.locator('[name="privacy"]').check();await page.locator('#submitBtn').click();
   await page.locator('#formNote.err').waitFor();
   const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,focused:document.activeElement?.id,note:document.querySelector('#formNote').textContent,canSubmit:!document.querySelector('#submitBtn').disabled}));
   assert.equal(state.overflow,false);assert.equal(state.focused,'formNote');assert.equal(state.canSubmit,true);assert.match(state.note,/not confirmation/);
   assert.deepEqual(external,[]);assert.deepEqual(errors,[]);assert.deepEqual(api,['/api/tyl-checkout']);
   const file=`${root}/${name}-${width}x${height}-payment-unavailable.png`;
   await page.screenshot({path:file});
   if(width===390)await page.screenshot({path:`${root}/${name}-390-full-application.png`,fullPage:true});
   report.views.push({browser:name,version:browser.version(),width,height,...state,api,external,errors,capture:file});
  }finally{await context.close();}
 }}finally{await browser.close();}
}
await writeFile(`${root}/local-browser-review.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({views:report.views.length,pass:true,report:`${root}/local-browser-review.json`}));
