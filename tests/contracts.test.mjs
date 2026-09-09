import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { sampleJourney } from '../src/experience/progress.ts';
import { selectQuality } from '../src/experience/quality.ts';

test('camera and guide retrace identically, including boundaries',()=>{
  for(const mobile of [false,true]){
    const forwards=Array.from({length:101},(_,i)=>sampleJourney(i/100,mobile));
    for(let i=100;i>=0;i--)assert.deepEqual(sampleJourney(i/100,mobile),forwards[i]);
    for(const boundary of [.16,.33,.39,.45,.51,.6,.75,.95]){
      const before=sampleJourney(boundary-.000001,mobile),after=sampleJourney(boundary+.000001,mobile);
      for(let i=0;i<3;i++)assert.ok(Math.abs(before.camera[i]-after.camera[i])<.01);
    }
    assert.deepEqual(sampleJourney(-1,mobile),sampleJourney(0,mobile));
    assert.deepEqual(sampleJourney(2,mobile),sampleJourney(1,mobile));
  }
});
test('resolution obeys DPR and total-pixel caps',()=>{
  for(const [w,h,dpr,cores] of [[390,844,3,6],[1920,1080,2,12],[3840,2160,3,16]]){
    const q=selectQuality(w,h,dpr,cores);assert.ok(w*h*q.pixelRatio**2<=(q.tier==='mobile'?850000:2000000)+1);assert.ok(q.pixelRatio<=1.5);
  }
});
test('untouched operational contracts retain their original bytes through the approved presentation migration',async()=>{
  const files=execFileSync('git',['ls-tree','-r','--name-only','c61643f'],{encoding:'utf8'}).trim().split('\n').filter(x=>x.startsWith('api/')||x.startsWith('lib/')||x.startsWith('data/')||['app.js','package-lock.json','sim.js','sim.css'].includes(x));
  for(const file of files){const baseline=execFileSync('git',['show',`c61643f:${file}`]);assert.deepEqual(await readFile(file),baseline,file);}
  const cfg=JSON.parse(await readFile('vercel.json','utf8')),old=JSON.parse(execFileSync('git',['show','c61643f:vercel.json']));assert.equal(cfg.cleanUrls,old.cleanUrls);assert.equal(cfg.trailingSlash,old.trailingSlash);assert.deepEqual(cfg.headers.filter(h=>h.source!=='/api/(.*)'),old.headers.filter(h=>h.source!=='/api/(.*)'));assert.equal(cfg.buildCommand,'npm run build');assert.equal(cfg.outputDirectory,'.release');assert.equal(cfg.headers.find(h=>h.source==='/api/(.*)').headers[0].value,'no-store');
});
test('assembled pages, anchors, functions and no-SPA routing survive',async()=>{
  for(const page of ['apply','simulator','faq','contact','terms','privacy','refunds','success'])assert.deepEqual(await readFile(`.release/${page}.html`),await readFile(`${page}.html`));
  const home=await readFile('.release/index.html','utf8');for(const id of ['top','gate','check','realroof','work','price','apply','main'])assert.ok(home.includes(`id="${id}"`),id);
  for(const file of await readdir('api'))await assert.rejects(readFile(`.release/api/${file}`),{code:'ENOENT'},'server source must not be public static output');
  const cfg=JSON.parse(await readFile('.release/vercel.json','utf8'));assert.equal(cfg.cleanUrls,true);assert.equal(cfg.rewrites,undefined);
  const html=await readFile('.release/experience.html','utf8');for(const href of ['/apply.html','/suitability.html','/contact.html','#application-details'])assert.ok(html.includes(`href="${href}"`));
  for(const page of ['apply','contact','terms','privacy','refunds'])assert.ok(!(await readFile(`.release/${page}.html`,'utf8')).includes('experience-assets'));
});
