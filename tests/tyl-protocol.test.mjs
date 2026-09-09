// Local fixtures only. No store credentials, provider requests or actual orders.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {parseTylFields, signTylRequest, verifyTylResult} from '../lib/tyl-protocol.js';
const secret='fixture-only-not-a-merchant-secret';
const expected={oid:'AES-TEST-123',txndatetime:'2026:09:09-10:00:00',amount:'300.00',currency:'826',store:'fixture-store'};
const fields=()=>({oid:expected.oid,txndatetime:expected.txndatetime,chargetotal:'300.00',currency:'826',storename:expected.store,txntype:'sale',approval_code:'Y:fixture',status:'APPROVED',ipgTransactionId:'fixture-transaction',hash_algorithm:'HMACSHA512'});
function signed(input=fields()){
 const data={...input};
 const values=Object.keys(data).filter(k=>data[k]!==''&&k!=='extended_response_hash').sort().map(k=>data[k]).join('|');
 data.extended_response_hash=createHmac('sha512',secret).update(values).digest('base64');
 return data;
}

test('direct Tyl request uses ASCII order and SHA-512 with the algorithm inside the signed fields',()=>{
 const request={timezone:'Europe/London',hash_algorithm:'HMACSHA512',currency:'826',chargetotal:'300.00',responseSuccessURL:'https://merchant.example.invalid/api/tyl-return',empty:''};
 const reference=createHmac('sha512',secret).update('300.00|826|HMACSHA512|https://merchant.example.invalid/api/tyl-return|Europe/London').digest('base64');
 assert.equal(signTylRequest(request,secret),reference);
 assert.throws(()=>signTylRequest({...request,hash_algorithm:'HMACSHA256'},secret),/invalid_algorithm/);
 assert.throws(()=>signTylRequest({...request,customParam_notes:'private'},secret),/custom_fields/);
});

test('direct Tyl callback accepts a signed approval only for the stored expected sale',()=>{
 const result=verifyTylResult(new URLSearchParams(signed()).toString(),expected,secret);
 assert.deepEqual(result,{attemptId:'AES-TEST-123',amountPence:30000,currency:'GBP',state:'paid',transactionId:'fixture-transaction'});
 assert.equal('email' in result,false,'result contains no billing or card data');
});

test('callback parser rejects duplicate keys, mixed-case duplicates, arrays and oversized inputs',()=>{
 for(const input of ['oid=a&oid=b','oid=a&OID=b',{oid:['a','b']},null,{},'oid='+ 'a'.repeat(32769),'oid=a%00b']) assert.throws(()=>parseTylFields(input));
 assert.equal(parseTylFields('oid=AES-TEST-123').oid,'AES-TEST-123');
});

test('signed wrong order, timestamp, price, currency, merchant or operation cannot settle this application',()=>{
 for(const change of [{oid:'AES-OTHER'},{txndatetime:'2026:09:09-10:00:01'},{chargetotal:'1.00'},{currency:'840'},{storename:'other-store'},{txntype:'preauth'}]) {
  assert.throws(()=>verifyTylResult(signed({...fields(),...change}),expected,secret),/unexpected_transaction/);
 }
 for(const change of [{amount:'1.00'},{currency:'840'},{oid:''},{store:''},{txndatetime:''}]) assert.throws(()=>verifyTylResult(signed(),{...expected,...change},secret),/invalid_expected_attempt/);
});

test('unsigned status/order edits and basic-hash-only replies never authorize fulfilment',()=>{
 const valid=signed();
 for(const change of [{oid:'AES-OTHER'},{status:'DECLINED'},{ipgTransactionId:'other-transaction'},{approval_code:'Y:other'}]) assert.throws(()=>verifyTylResult({...valid,...change},expected,secret),/unverified_response/);
 const basic={...fields(),response_hash:'a-basic-hash-is-not-an-order-signature'};
 assert.throws(()=>verifyTylResult(basic,expected,secret),/unverified_response/);
 assert.throws(()=>verifyTylResult({...valid,hash_algorithm:'HMACSHA256'},expected,secret),/invalid_algorithm/);
 assert.throws(()=>verifyTylResult({...valid,extended_response_hash:valid.extended_response_hash+'x'},expected,secret),/unverified_response/);
});

test('waiting and declined results stay distinct; contradictory status and approval codes are rejected',()=>{
 for(const [status,approval_code,state] of [['WAITING','?:fixture','pending'],['DECLINED','N:fixture','declined'],['FAILED','N:fixture','declined']]) {
  assert.equal(verifyTylResult(signed({...fields(),status,approval_code}),expected,secret).state,state);
 }
 for(const [status,approval_code] of [['APPROVED','N:fixture'],['APPROVED','?:fixture'],['WAITING','Y:fixture'],['DECLINED','Y:fixture']]) assert.throws(()=>verifyTylResult(signed({...fields(),status,approval_code}),expected,secret),/inconsistent_result/);
 assert.throws(()=>verifyTylResult(signed({...fields(),ipgTransactionId:''}),expected,secret),/missing_transaction_id/);
});
