// This suite imports handlers directly. fetch is always mocked; .invalid URLs cannot create orders.
import test from 'node:test';
import assert from 'node:assert/strict';
import tyl from '../api/tyl-checkout.js';
import stripe from '../api/checkout.js';
import returned from '../api/tyl-return.js';
import {responseHash} from '../lib/tyl.js';
const response=()=>({code:0,headers:{},body:null,setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(b){this.body=b;return this;},redirect(n,url){this.code=n;this.location=url;return this;}});
const request=(body={},method='POST')=>({method,headers:{origin:'https://local.example.invalid'},body,query:{}});
const dummy={email:'dummy@example.invalid',company:'Example',contact:'Test Person',phone:'0000000000',address:'Example Site',postcode:'AA1 1AA',inverter:'Illustrative inverter',kw:'5',phases:'1',acceptedTerms:true,acceptedPrivacy:true,amountGBP:'0.01'};
test('preserved payment contracts with dummy credentials and no network',async()=>{
 const keys=['TYL_STORE_ID','TYL_SHARED_SECRET','TYL_GATEWAY_URL','STRIPE_SECRET_KEY','STRIPE_TAX_RATE_ID'];const prior=Object.fromEntries(keys.map(k=>[k,process.env[k]]));const oldFetch=globalThis.fetch;
 let sent;
 try{
  Object.assign(process.env,{TYL_STORE_ID:'dummy-store',TYL_SHARED_SECRET:'dummy-secret-not-a-credential',TYL_GATEWAY_URL:'https://gateway.example.invalid',STRIPE_SECRET_KEY:'dummy-stripe-not-a-credential'});delete process.env.STRIPE_TAX_RATE_ID;
  globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.stripe.com/v1/checkout/sessions');sent=new URLSearchParams(options.body);return {ok:true,json:async()=>({url:'https://checkout.example.invalid',id:'dummy-session'})};};
  let res=response();await tyl(request(dummy),res);assert.equal(res.code,200);assert.equal(res.body.fields.chargetotal,'300.00');assert.equal(res.body.fields.currency,'826');assert.equal(res.body.net,'250.00');assert.equal(res.headers['Cache-Control'],'no-store');assert.ok(res.body.fields.hashExtended);assert.equal(res.body.fields.customParam_kw,'5');
  res=response();await stripe(request(dummy),res);assert.equal(res.code,200);assert.equal(sent.get('line_items[0][quantity]'),'1');assert.equal(sent.get('line_items[0][price_data][unit_amount]'),'30000');assert.equal(sent.get('line_items[0][price_data][currency]'),'gbp');assert.equal(sent.get('metadata[accepted_terms]'),'yes');
  process.env.STRIPE_TAX_RATE_ID='txr_dummy';await stripe(request(dummy),response());assert.equal(sent.get('line_items[0][price_data][unit_amount]'),'25000');assert.equal(sent.get('line_items[0][tax_rates][0]'),'txr_dummy');
  for(const fn of [tyl,stripe]){res=response();await fn(request({email:'invalid'}),res);assert.equal(res.code,400);res=response();await fn(request({},'GET'),res);assert.equal(res.code,405);}
  const ts='2026:09:08-12:00:00';
  for(const [approval_code,status,path] of [['Y:dummy','APPROVED','/success?order=dummy-order'],['?:dummy','WAITING','/apply?payment=pending'],['N:dummy','DECLINED','/apply?payment=declined&reason=']]){
   const body={approval_code,status,chargetotal:'300.00',currency:'826',storename:'dummy-store',txndatetime:ts,oid:'dummy-order'};body.response_hash=responseHash(body,process.env.TYL_SHARED_SECRET);res=response();await returned({...request(body),query:{ts}},res);assert.equal(res.code,303);assert.equal(res.location,path);
  }
 }finally{globalThis.fetch=oldFetch;for(const k of keys)if(prior[k]===undefined)delete process.env[k];else process.env[k]=prior[k];}
});
