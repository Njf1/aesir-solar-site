import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {validateRecordedGeneration,renderRecordedGeneration,recordedGenerationPlugin} from '../scripts/recorded-generation.mjs';

const source=JSON.parse(await readFile(new URL('../data/premier-composites.json',import.meta.url),'utf8'));
const fixture=()=>structuredClone(source);
const experienceFile=fileURLToPath(new URL('../experience.html',import.meta.url));
const token='<!-- RECORDED_GENERATION -->';
const valid=input=>{
  const result=validateRecordedGeneration(input);
  assert.equal(result.ok,true,JSON.stringify(result));
  return result.data;
};
const unavailable=input=>{
  assert.equal(validateRecordedGeneration(input).ok,false);
  const html=renderRecordedGeneration(input);
  assert.match(html,/<h2 id="recorded-title">Recorded generation is unavailable\./);
  assert.match(html,/href="\/apply\.html"/);
  assert.doesNotMatch(html,/<svg|data-kwh=|>0(?:\.00)?<|<script/i);
  return html;
};

test('the supplied dated record keeps its independent daily total and approximate readings',()=>{
  const original=JSON.stringify(source),data=valid(source);
  assert.equal(data.siteName,'Premier Composites');
  assert.equal(data.location,'Lincolnshire, England');
  assert.equal(data.monitoring,'Tigo Energy Intelligence (EI)');
  assert.equal(data.dateISO,'2026-08-24');
  assert.equal(data.dateLabel,'24 August 2026');
  assert.equal(data.dailyKwh,206.41);
  assert.equal(data.hourlySumKwh,205.15);
  assert.equal(data.recordedHourCount,15);
  assert.deepEqual(data.missingHours,[]);
  assert.equal(data.hours[0].hour,'06');
  assert.equal(data.hours.at(-1).hour,'20');
  assert.deepEqual(data.hours.find(item=>item.hour==='13'),{hour:'13',valueKwh:29});
  assert.equal(JSON.stringify(source),original,'validation must not mutate the supplied record');
});

test('static output exposes source, date, an accessible chart and a native table without telemetry or unsupported fields',()=>{
  const html=renderRecordedGeneration(source);
  for(const text of ['Premier Composites','Lincolnshire, England','Tigo Energy Intelligence (EI)','24 August 2026'])assert.ok(html.includes(text));
  assert.match(html,/<time datetime="2026-08-24">24 August 2026<\/time>/);
  assert.match(html,/<strong>206\.41<\/strong>/);
  assert.match(html,/<h2 id="recorded-title">Recorded generation example<\/h2>/);
  assert.match(html,/Supplied transcription from Tigo Energy Intelligence/);
  assert.match(html,/Not independently verified/);
  assert.match(html,/No Aesir installation or customer endorsement is claimed/);
  assert.match(html,/The 879-module campus is a separate illustration/);
  assert.match(html,/<figcaption>[^<]*kWh per hour interval/);
  assert.match(html,/approximate chart readings/);
  assert.match(html,/<svg[^>]*role="img"[^>]*aria-labelledby="recorded-chart-title recorded-chart-description"/);
  assert.match(html,/<title id="recorded-chart-title">Approximate hourly generation/);
  assert.match(html,/<desc id="recorded-chart-description">15 recorded hourly estimates/);
  assert.match(html,/<details[^>]*>[\s\S]*<summary>Approximate hourly readings<\/summary>/);
  assert.match(html,/<th scope="col">Approximate energy \(kWh per hour interval\)<\/th>/);
  assert.equal((html.match(/<th scope="row">/g)||[]).length,15);
  assert.equal((html.match(/class="recorded-generation__bar"/g)||[]).length,15);
  assert.match(html,/<th scope="row">20:00<\/th><td>0\.05<\/td>/);
  assert.doesNotMatch(html,/205\.15|<script|<canvas|fetch\(|onload=|\/api\/|income_equivalent|Solis|system kWp|reclaimed|trees planted/i);
});

test('the chart resizes horizontally without shrinking its readable axis labels',()=>{
  const html=renderRecordedGeneration(source),svg=html.match(/<svg[\s\S]*?<\/svg>/)[0];
  assert.match(svg,/width="100%" height="260"/);
  assert.doesNotMatch(svg,/viewBox=/);
  assert.match(svg,/<text[^>]+font-size="14"/);
  assert.match(svg,/<rect x="[\d.]+%"[^>]+width="[\d.]+%"/);
  const labels=[...svg.matchAll(/<text[^>]*>(\d\d):00<\/text>/g)].map(match=>match[1]);
  assert.deepEqual(labels,['06','09','12','15','18']);
});

test('numeric zero remains a valid recorded value, distinct from unavailable data',()=>{
  const input=fixture();input.day_sample.pv_production_kwh=0;
  for(const hour of Object.keys(input.day_sample.hourly_kwh))if(!hour.startsWith('_'))input.day_sample.hourly_kwh[hour]=0;
  const data=valid(input),html=renderRecordedGeneration(input);
  assert.equal(data.dailyKwh,0);assert.equal(data.hourlySumKwh,0);
  assert.ok(data.hours.every(reading=>reading.valueKwh===0));
  assert.match(html,/<strong>0\.00<\/strong>/);
  assert.equal((html.match(/data-kwh="0"/g)||[]).length,15);
  assert.match(html,/<circle[^>]*r="2\.5"/,'a recorded zero has a baseline marker');
  assert.doesNotMatch(html,/NaN|Infinity|unavailable|Not recorded/);
});

test('an absent internal hour is shown as missing, never fabricated as zero or padded to a whole day',()=>{
  const input=fixture();delete input.day_sample.hourly_kwh['10'];
  const data=valid(input),html=renderRecordedGeneration(input);
  assert.equal(data.recordedHourCount,14);assert.equal(data.hours.length,15);
  assert.deepEqual(data.missingHours,['10']);
  assert.deepEqual(data.hours.find(reading=>reading.hour==='10'),{hour:'10',valueKwh:null});
  assert.match(html,/<g class="recorded-generation__missing" data-hour="10">/);
  assert.match(html,/<th scope="row">10:00<\/th><td>Not recorded<\/td>/);
  assert.match(html,/Hours not recorded in the supplied data are shown as gaps, not zero/);
  assert.doesNotMatch(html,/data-hour="10" data-kwh="0"|<th scope="row">00:00|<th scope="row">21:00/);
});

test('missing, nonnumeric and impossible daily values render a coherent application fallback',()=>{
  for(const value of [undefined,null,'0','206.41',false,true,-1,NaN,Infinity,-Infinity,Number.MAX_SAFE_INTEGER+1]){
    const input=fixture();input.day_sample.pv_production_kwh=value;unavailable(input);
  }
  const absent=fixture();delete absent.day_sample.pv_production_kwh;unavailable(absent);
});

test('malformed hourly readings are not coerced into valid energy or zero',()=>{
  for(const value of [undefined,null,'0','3.4',false,-.1,NaN,Infinity,{},[]]){
    const input=fixture();input.day_sample.hourly_kwh['11']=value;unavailable(input);
  }
  for(const hour of ['6','24','-1','06:00','12.5','<script>']){
    const input=fixture();input.day_sample.hourly_kwh[hour]=1;unavailable(input);
  }
  const empty=fixture();empty.day_sample.hourly_kwh={_source:'No hourly readings supplied'};unavailable(empty);
  const overflow=fixture();overflow.day_sample.hourly_kwh={_source:'Recorded', '06':Number.MAX_SAFE_INTEGER,'07':1};unavailable(overflow);
});

test('required location and measurement provenance cannot silently disappear',()=>{
  for(const key of ['name','location','monitoring','source']){
    const input=fixture();delete input.site[key];unavailable(input);
  }
  for(const value of ['', 'inferred', 'derived']){
    const input=fixture();input.day_sample.source=value;unavailable(input);
  }
  const absentHourlySource=fixture();delete absentHourlySource.day_sample.hourly_kwh._source;unavailable(absentHourlySource);
  for(const value of [null,[],{},'record',42])unavailable(value);
  for(const field of ['site','day_sample']){
    const input=fixture();input[field]=[];unavailable(input);
  }
});

test('calendar validation rejects rollover dates and accepts actual Gregorian leap days',()=>{
  for(const date of ['2026-02-29','1900-02-29','2026-02-30','2026-04-31','2026-13-01','2026-00-10','2026-01-00','0000-01-01','2026-8-24','24/08/2026','2026-08-24T00:00:00Z',null]){
    const input=fixture();input.day_sample.date=date;unavailable(input);
  }
  for(const date of ['2024-02-29','2000-02-29','2026-12-31']){
    const input=fixture();input.day_sample.date=date;assert.equal(valid(input).dateISO,date);
  }
});

test('a historical record does not expire or change its date as the wall clock advances',()=>{
  const before=renderRecordedGeneration(source),now=Date.now;
  try{Date.now=()=>Date.UTC(2049,0,1);assert.equal(renderRecordedGeneration(source),before);}
  finally{Date.now=now;}
});

test('source strings are escaped in HTML and SVG rather than becoming executable markup',()=>{
  const input=fixture();
  input.site.name='</title><script>alert("site")</script>';
  input.site.location='<img src=x onerror="alert(1)">';
  input.site.monitoring='A & B "portal"';
  input.day_sample.hourly_kwh._source='<svg onload="alert(1)">';
  const html=renderRecordedGeneration(input);
  assert.match(html,/&lt;\/title&gt;&lt;script&gt;alert\(&quot;site&quot;\)&lt;\/script&gt;/);
  assert.match(html,/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(html,/A &amp; B &quot;portal&quot;/);
  assert.doesNotMatch(html,/<script|<img|<svg onload|<\/title><script/i);
});

test('tiny positive readings are not rounded into a false recorded zero',()=>{
  const input=fixture();input.day_sample.pv_production_kwh=.001;
  input.day_sample.hourly_kwh={_source:'Recorded small amount','06':.001};
  const html=renderRecordedGeneration(input);
  assert.equal(valid(input).dailyKwh,.001);
  assert.match(html,/<strong>&lt;0\.01<\/strong>/);
  assert.match(html,/data-kwh="0\.001"/);
  assert.match(html,/<td>&lt;0\.01<\/td>/);
  assert.doesNotMatch(html,/NaN|Infinity/);
});

test('the HTML transform rereads data, renders success and safely handles malformed or missing files',async t=>{
  const directory=await mkdtemp(path.join(tmpdir(),'aesir-recorded-generation-'));
  t.after(()=>rm(directory,{recursive:true,force:true}));
  const dataURL=pathToFileURL(path.join(directory,'record.json'));
  const plugin=recordedGenerationPlugin({dataURL}),transform=plugin.transformIndexHtml.handler;
  const context={filename:experienceFile,path:'/experience.html'};
  const template=`<section aria-labelledby="recorded-title">${token}</section>`;
  await writeFile(dataURL,JSON.stringify(source));
  const success=await transform(template,context);
  assert.match(success,/<strong>206\.41<\/strong>/);
  assert.match(success,/<svg/);assert.match(success,/<table/);assert.doesNotMatch(success,/RECORDED_GENERATION|<script/);
  const changed=fixture();changed.day_sample.pv_production_kwh=0;
  await writeFile(dataURL,JSON.stringify(changed));
  assert.match(await transform(template,context),/<strong>0\.00<\/strong>/,'new transforms must not use stale cached data');
  for(const text of ['{bad json','null','{}']){
    await writeFile(dataURL,text);
    const failure=await transform(template,context);
    assert.match(failure,/Recorded generation is unavailable/);assert.match(failure,/href="\/apply\.html"/);
    assert.doesNotMatch(failure,/<svg|RECORDED_GENERATION/);
  }
  await rm(dataURL);
  assert.match(await transform(template,context),/Recorded generation is unavailable/);
});

test('the build hook leaves every other route and token-free HTML unchanged',async()=>{
  const transform=recordedGenerationPlugin().transformIndexHtml.handler;
  const template=`<h1>Existing route</h1>${token}`;
  for(const filename of ['apply.html','index.html','terms.html']){
    assert.equal(await transform(template,{filename:path.join(path.dirname(experienceFile),filename),path:`/${filename}`}),template);
  }
  assert.equal(await transform(template,{path:'/experience.html'}),template);
  const noToken='<h1>No recorded example here</h1>';
  assert.equal(await transform(noToken,{filename:experienceFile,path:'/experience.html'}),noToken);
});
