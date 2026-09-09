import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileApplications} from '../lib/solar-recovery.js';
const stamp='2026-09-09T10:00:00.000Z';
function fixture(count){
 const apps=Array.from({length:count},(_,n)=>({id:`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`,created_at:stamp,session_id:'cs_test_'+n,livemode:false,payload_hash:'hash',details:{},status:'awaiting_payment'}));
 const paid=new Set(),seen=[];
 const svc={db:async path=>{
  const q=new URLSearchParams(path.split('?')[1]);let cursor=q.get('or')?.match(/id.gt.([a-f0-9-]+)/)?.[1];
  return apps.filter(a=>!paid.has(a.id)&&(!cursor||a.id>cursor)).slice(0,Number(q.get('limit')));
 },stripe:async path=>{
  if(path.includes('line_items'))return {has_more:false,data:[{quantity:1,amount_total:30000}]};
  const id=path.split('/')[2].split('?')[0],a=apps.find(a=>a.session_id===id);seen.push(a.id);
  return {id,livemode:false,mode:'payment',client_reference_id:a.id,metadata:{solar_application_id:a.id,payload_hash:'hash',protocol:'solar-v1'},amount_total:30000,currency:'gbp',total_details:{amount_tax:5000},status:a===apps.at(-1)?'complete':'open',payment_status:a===apps.at(-1)?'paid':'unpaid',payment_intent:{id:'pi_fixture',status:'succeeded',amount:30000,amount_received:30000,currency:'gbp',livemode:false}};
 },rpc:async(_,args)=>{paid.add(args.p_id);return {status:'paid'};}};
 return {svc,apps,seen,paid};
}
test('recovery passes 100 unresolved applications and finds a later paid one',async()=>{const f=fixture(121),r=await reconcileApplications(f.svc,{livemode:false},{pageSize:25});assert.equal(r.checked,121);assert.equal(r.paid,1);assert.equal(r.unresolved,120);assert.equal(r.complete,true);assert.equal(new Set(f.seen).size,121);});
test('bounded recovery returns a stable resumable cursor even with tied timestamps',async()=>{const f=fixture(8);const first=await reconcileApplications(f.svc,{livemode:false},{pageSize:3,maxApplications:5});assert.equal(first.complete,false);assert.equal(first.next.id,f.apps[4].id);const last=await reconcileApplications(f.svc,{livemode:false},{after:first.next,until:first.until,pageSize:3});assert.equal(last.checked,3);assert.equal(last.paid,1);assert.equal(new Set(f.seen).size,8);});
test('recovery rejects injected cursor and invalid limits before database access',async()=>{const f=fixture(1);await assert.rejects(reconcileApplications(f.svc,{livemode:false},{after:{created_at:stamp,id:'bad),id.gt.any'}}));await assert.rejects(reconcileApplications(f.svc,{livemode:false},{maxApplications:0}));assert.equal(f.seen.length,0);});

test('live admission hashes the trusted request IP and email rather than storing them',async()=>{
 const {rateIdentity}=await import('../lib/solar-payments.js');const original=process.env.VERCEL;
 try{process.env.VERCEL='1';const cfg={dbKey:'sb_secret_fixture'},r=rateIdentity({headers:{'x-vercel-forwarded-for':'203.0.113.7','x-forwarded-for':'attacker'}},cfg);assert.match(r.ip,/^[a-f0-9]{64}$/);assert.equal(r.email('Example@Test.invalid'),r.email('example@test.invalid'));assert.notEqual(r.ip,r.email('203.0.113.7'));assert.throws(()=>rateIdentity({headers:{'x-forwarded-for':'203.0.113.7'}},cfg));}
 finally{if(original===undefined)delete process.env.VERCEL;else process.env.VERCEL=original;}
});
test('database admission limit is a recoverable 429 without disclosing storage errors',async()=>{
 const {services}=await import('../lib/solar-payments.js');const svc=services({db:'https://example.invalid',dbKey:'private'},async()=>new Response(JSON.stringify({code:'P0429',message:'private database detail'}),{status:400}));await assert.rejects(svc.rpc('solar_prepare_limited',{}),e=>e.status===429&&e.message==='checkout_rate_limited');
});
