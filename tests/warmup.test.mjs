import test from 'node:test';
import assert from 'node:assert/strict';
import {compileReady} from '../src/experience/warmup.ts';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function compiler(){let ready=false,reads=0,disposed=false;const material={},program={isReady:()=>ready};return{renderer:{compile:()=>new Set([material]),properties:{get(){reads++;if(disposed)throw new Error('Access after material disposal');return{currentProgram:program};}}},release(){ready=true;},dispose(){disposed=true;},get reads(){return reads;}};}
test('shader warmup stops its timer before material disposal after a timeout or context loss',async()=>{
 for(const reason of [undefined,new Error('chapter-timeout')]){
  const c=compiler(),lifetime=new AbortController(),promise=compileReady(c.renderer,{}, {},{},lifetime.signal);
  const rejection=assert.rejects(promise,reason?/chapter-timeout/:{name:'AbortError'});
  await delay(15);assert.ok(c.reads>0);lifetime.abort(reason);c.dispose();const reads=c.reads;await rejection;await delay(25);assert.equal(c.reads,reads,'no uncancellable poll survives disposal');
 }
});
test('warmup resolves after readiness, rejects compile errors and never starts after disposal',async()=>{
 const c=compiler(),life=new AbortController();const promise=compileReady(c.renderer,{},{},{},life.signal);await delay(15);c.release();await promise;
 const reads=c.reads;await delay(20);assert.equal(c.reads,reads);
 await assert.rejects(compileReady({compile(){throw new Error('shader-error');},properties:{}},{},{},{},new AbortController().signal),/shader-error/);
 const cancelled=new AbortController();cancelled.abort();await assert.rejects(compileReady({compile(){assert.fail('compile after disposal');},properties:{}},{},{},{},cancelled.signal),{name:'AbortError'});
});
