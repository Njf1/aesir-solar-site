import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sampleJourney} from '../src/experience/journey.ts';
import {CHAPTERS,JOURNEY_END,SCROLL_VIEWPORTS_PER_UNIT,STILL_VIEWS} from '../src/experience/timeline.ts';
const baseline=JSON.parse(readFileSync(new URL('./fixtures/stage-three-poses.json',import.meta.url),'utf8'));
const originalFields=Object.keys(baseline.samples[0]).filter(k=>!['mode','p'].includes(k));
test('the extension preserves every captured old pose at the same scroll unit',()=>{
 for(const old of baseline.samples){const current=sampleJourney(old.p,old.mode);
  for(const key of originalFields){
   const actual=current[key],expected=old[key],label=`${old.mode} p${old.p} ${key}`;
   if(Array.isArray(expected)){assert.equal(actual.length,expected.length,label);expected.forEach((n,i)=>assert.ok(Math.abs(actual[i]-n)<=1e-6,`${label}[${i}]: ${actual[i]} != ${n}`));}
   else if(typeof expected==='number')assert.ok(Math.abs(actual-expected)<=1e-6,`${label}: ${actual} != ${expected}`);
   else assert.equal(actual,expected,label);
  }
 }
});
test('new duration adds scroll while old chapters and stills retain their positions',()=>{
 assert.equal(SCROLL_VIEWPORTS_PER_UNIT,5.6);assert.equal(SCROLL_VIEWPORTS_PER_UNIT*baseline.end,12.6);
 assert.ok(JOURNEY_END>baseline.end,'this test is for the completed stage04 extension');
 assert.deepEqual(CHAPTERS.slice(0,baseline.chapters.length).map(({start,end})=>({start,end})),baseline.chapters.map(({start,end})=>({start,end})));
 for(const [key,value] of Object.entries(baseline.stills))assert.equal(STILL_VIEWS[key],value,`${key} still moved`);
 for(const mode of ['landscape','portrait','short'])assert.deepEqual(sampleJourney(JOURNEY_END+1,mode),sampleJourney(JOURNEY_END,mode));
});
