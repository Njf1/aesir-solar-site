// Stage-seven route/content tests aligned with integrated source on 8 September 2026.
// Root owns final execution; generator/assembler mutations stay in isolated temp copies.
// Set AESIR_STAGE7_ROOT when running this draft outside the repository.
// Assembler/generator checks run only in an isolated copy under os.tmpdir().
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,mkdtemp,mkdir,cp,writeFile,rm,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const ROOT=process.env.AESIR_STAGE7_ROOT||'/Users/nick/Projects/Aesir Solar/experience-stage1';
const BASE='dbb8197';
const read=(file,root=ROOT)=>readFile(path.join(root,file),'utf8');
const files=async(dir,root=ROOT)=>(await readdir(path.join(root,dir),{withFileTypes:true})).flatMap(e=>e.isFile()?[`${dir}/${e.name}`]:[]);
const attributes=tag=>Object.fromEntries([...tag.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)].slice(1).map(m=>[m[1].toLowerCase(),m[2]??m[3]??m[4]??'']));
const tags=(html,name)=>[...html.matchAll(new RegExp(`<${name}\\b[^>]*>`,'gi'))].map(m=>attributes(m[0]));
const controls=html=>tags(html,'(?:input|select|textarea)').filter(a=>a.name);
const normal=html=>html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/\s+/g,' ').trim();
const names=['company','contact','email','phone','accreditation','address','postcode','mpan','inverter','typetest','kw','phases','storage','target','g100','eps','notes','agree','privacy'];
const supporting=['apply','success','contact','terms','privacy','refunds','simulator'];
const aliases=['top','main','gate','check','work','price','apply','realroof'];
const baseline=file=>execFileSync('git',['show',`${BASE}:${file}`],{cwd:ROOT});

test('provider routes, helpers, payment script, input data and pinned dependencies retain exact bytes',async()=>{
 const retained=[...await files('api'),...await files('lib'),...await files('data'),'app.js','package.json','package-lock.json'];
 assert.equal((await files('api')).length,5,'Do not silently add a new payment/provider route in this migration');
 for(const file of retained)assert.deepEqual(await readFile(path.join(ROOT,file)),baseline(file),file);
 // Known backend defects remain documented, not blessed as success criteria.
 const blockers=await read('docs/experience/backend-blockers.md');assert.match(blockers,/durab/i);assert.match(blockers,/idempoten/i);assert.match(blockers,/amount.*currency|currency.*amount/i);
});

test('compiled homepage is byte-identical at index and experience and contains genuine compatibility anchors',async()=>{
 const home=await read('.release/index.html'),experience=await read('.release/experience.html');assert.equal(home,experience);
 const ids=tags(home,'[a-z][a-z0-9:-]*').map(a=>a.id).filter(Boolean);
 for(const id of [...aliases,'application-details','solar-benefits','recorded-generation','application-process','application-faqs'])assert.equal(ids.filter(x=>x===id).length,1,id);
 assert.doesNotMatch(home,/<meta\b[^>]*http-equiv=["']refresh/i,'Home aliases must retain native fragment/query navigation without redirect');
 assert.doesNotMatch(home,/<script\b[^>]*src=["'][^"']*(?:^|\/)sim\.js(?:[?"'])/i);
 assert.doesNotMatch(home,/<script\b[^>]*src=["']\/?app\.js(?:[?"'])/i,'Marketing home must not load the legacy telemetry/payment script');
});

test('all named application controls retain their meaning and both consents remain distinct and unchecked',async()=>{
 const html=await read('.release/apply.html'),fields=controls(html),byName=new Map(fields.map(a=>[a.name,a]));
 assert.deepEqual([...byName.keys()],names);assert.equal(fields.length,19);
 assert.deepEqual(fields,controls(baseline('apply.html').toString('utf8')),'Every original named-control attribute survives, not only the field names');
 for(const name of ['contact','email','phone','address','postcode','inverter','kw','agree','privacy'])assert.ok('required'in byName.get(name),name);
 assert.equal(byName.get('email').type,'email');assert.equal(byName.get('phone').type,'tel');
 for(const[name,step]of[['kw','0.01'],['storage','0.1']]){assert.equal(byName.get(name).type,'number');assert.equal(byName.get(name).min,'0');assert.equal(byName.get(name).step,step);}
 assert.equal(byName.get('target').type,'date');assert.equal(byName.get('mpan').inputmode,'numeric');
 const supply=html.match(/<select\b[^>]*name=["']phases["'][^>]*>([\s\S]*?)<\/select>/i)?.[1];assert.ok(supply);assert.deepEqual(tags(supply,'option').map(a=>a.value),['1','3']);
 for(const name of ['agree','privacy']){assert.equal(byName.get(name).type,'checkbox');assert.ok(!('checked'in byName.get(name)),`${name} must not start checked`);}
 for(const href of ['terms.html','refunds.html','privacy.html'])assert.ok(tags(html,'a').some(a=>a.href===href||a.href===`/${href}`),href);
 const text=normal(html);assert.match(text,/£250(?:\.00)?/);assert.match(text,/£50(?:\.00)?/);assert.match(text,/£300(?:\.00)?/);assert.match(text,/network operator/i);
 // Browser tests below establish which label owns each link and the real focus/submit behaviour.
});

test('supporting pages are complete documents without the cinematic runtime or retired simulator runtime',async()=>{
 for(const slug of supporting){
  const html=await read(`.release/${slug}.html`);assert.match(html,/<!doctype html>/i,slug);assert.match(html,/<html\b[^>]*lang=["']en-GB/i,slug);assert.ok(tags(html,'main').some(a=>a.id==='main'),slug);
  assert.doesNotMatch(html,/<canvas\b|id=["']canvas-host["']|<script\b[^>]*(?:src\/experience\/main\.ts|\/(?:experience|scene|three(?:\.core)?)-[^"']+\.js|(?:^|\/)sim\.js)/i,slug);
  assert.ok(tags(html,'a').some(a=>a.href==='/'||a.href==='/index.html'||a.href==='index.html'),`${slug}: home route`);
 }
 const retired=normal(await read('.release/simulator.html'));
 assert.match(retired,/planning|retired|illustrat|estimate/i);assert.match(retired,/capacity|inverter|suitab|contact/i);
 assert.doesNotMatch(retired,/your (?:annual )?saving is|your payback is|validated against/i);
});

test('FAQ retirement keeps an explicit native destination in metadata and visible content',async()=>{
 const html=await read('.release/faq.html'),refresh=tags(html,'meta').find(a=>a['http-equiv']?.toLowerCase()==='refresh');
 assert.ok(refresh);assert.match(refresh.content,/url=\/?#application-faqs$/i);
 assert.ok(tags(html,'a').some(a=>a.href==='/#application-faqs'));
 assert.doesNotMatch(html,/<script\b[^>]*src=|FAQPage|45 days|single most common omission/i,'Retired bridge must not publish stale FAQ claims/runtime');
});

test('direct static success is unverified and provider-neutral even before JavaScript',async()=>{
 const html=await read('.release/success.html'),text=normal(html);
 assert.match(text,/not (?:yet )?(?:confirmed|verified)|cannot confirm|could not confirm|unverified|awaiting confirmation/i);
 assert.doesNotMatch(text,/payment received|your application is with us|we(?:’|')ve got your installation|Stripe has sent|receipt (?:has been|was) sent|you have not been charged/i);
 assert.ok(tags(html,'a').some(a=>a.href==='mailto:hello@aesirsolar.co.uk'));
});

test('recorded evidence remains static, dated and separate from the illustrative campus after homepage assembly',async()=>{
 const html=await read('.release/index.html'),record=html.match(/<section\b[^>]*id=["']recorded-generation["'][^>]*>([\s\S]*?)<\/section>/i)?.[1];assert.ok(record);
 assert.match(record,/<time\b[^>]*datetime=["']2026-08-24["']/);assert.match(record,/206\.41/);assert.match(normal(record),/kWh recorded that day/);
 assert.match(record,/Premier Composites/);assert.match(record,/Tigo/);assert.match(record,/historical/);assert.match(record,/approximate/i);assert.match(record,/not independently verified/i);
 assert.match(record,/<svg\b[^>]*role=["']img/);assert.match(record,/<table\b/);assert.doesNotMatch(record,/<!-- RECORDED_GENERATION -->|fetch\(|<canvas/i);
});

async function isolatedCopy(){
 const temp=await mkdtemp(path.join(tmpdir(),'aesir-stage-seven-contract-'));
 // Copy source/templates/scripts and the existing Vite output; never invoke the
 // original checkout's assembler. Large review evidence and dependencies are excluded.
 for(const entry of await readdir(ROOT,{withFileTypes:true})){
  if(['.git','node_modules','.release','docs','test-results','playwright-report'].includes(entry.name))continue;
  if(entry.isDirectory()&&!['scripts','src','templates','data','api','lib','.preview-build'].includes(entry.name))continue;
  if(entry.isFile()&&!/\.(?:py|mjs|js|ts|json|html|css|svg|txt|xml)$/.test(entry.name))continue;
  await cp(path.join(ROOT,entry.name),path.join(temp,entry.name),{recursive:true});
 }
 await mkdir(path.join(temp,'docs/experience'),{recursive:true});return temp;
}
async function manifest(dir){
 const out={};async function walk(at,relative=''){
  for(const entry of await readdir(at,{withFileTypes:true})){const key=relative?`${relative}/${entry.name}`:entry.name,p=path.join(at,entry.name);if(entry.isDirectory())await walk(p,key);else out[key]=createHash('sha256').update(await readFile(p)).digest('hex');}
 }await walk(dir);return Object.fromEntries(Object.entries(out).sort(([a],[b])=>a.localeCompare(b)));
}
const exists=async p=>{try{await stat(p);return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}};

test('the authoritative generator reproduces every supported source page in isolation',async()=>{
 const temp=await isolatedCopy();try{
  const generated=['terms','privacy','refunds','contact','faq','success','apply','simulator','index'];
  const expected=new Map(await Promise.all(generated.map(async slug=>[slug,await read(`${slug}.html`)])));
  const authoritative=await read('experience.html',temp);
  assert.equal(expected.get('index'),authoritative,'checked-in index is generated from the current authoritative experience');
  for(const slug of generated)await writeFile(path.join(temp,`${slug}.html`),'POISONED GENERATED FILE');
  execFileSync('python3',['build.py'],{cwd:temp,stdio:'pipe'});
  for(const slug of generated)assert.equal(await read(`${slug}.html`,temp),expected.get(slug),`${slug}: source and generator drift`);
  assert.equal(await read('experience.html',temp),authoritative,'generator never edits its homepage authority');
  execFileSync('python3',['build.py','--check'],{cwd:temp,stdio:'pipe'});
 }finally{await rm(temp,{recursive:true,force:true});}
});

test('repeated assembly removes stale routes/scripts, retains exact contracts and never changes neighbouring/source files',async()=>{
 const temp=await isolatedCopy();try{
  const sourceContracts=[...await files('api',temp),...await files('lib',temp),...await files('data',temp),'app.js','package.json','package-lock.json'];
  const before=new Map(await Promise.all(sourceContracts.map(async file=>[file,await readFile(path.join(temp,file))])));
  const release=path.join(temp,'.release');await mkdir(path.join(release,'obsolete-nested'),{recursive:true});
  for(const name of ['obsolete.html','sim.js','sim.css','obsolete-nested/old.js'])await writeFile(path.join(release,name),'STALE');
  await writeFile(path.join(temp,'neighbour-sentinel.txt'),'PRESERVE');
  execFileSync(process.execPath,[path.join(temp,'scripts/assemble.mjs')],{cwd:temp,stdio:'pipe'});
  const first=await manifest(release);
  for(const name of ['obsolete.html','sim.js','sim.css','obsolete-nested/old.js'])assert.equal(await exists(path.join(release,name)),false,name);
  assert.equal(await read('.release/index.html',temp),await read('.release/experience.html',temp));
  await writeFile(path.join(release,'stale-after-first-pass.html'),'STALE');
  execFileSync(process.execPath,[path.join(temp,'scripts/assemble.mjs')],{cwd:temp,stdio:'pipe'});
  assert.deepEqual(await manifest(release),first,'same prepared inputs produce identical delivery files on repeated assembly');
  for(const[file,bytes]of before){assert.deepEqual(await readFile(path.join(temp,file)),bytes,`source:${file}`);assert.deepEqual(await readFile(path.join(release,file)),bytes,`delivery:${file}`);}
  assert.equal(await read('neighbour-sentinel.txt',temp),'PRESERVE');
  const inventory=JSON.parse(await read('.release/output-manifest.json',temp));
  assert.equal(inventory.localCandidate,true);assert.equal(inventory.owner,'scripts/assemble.mjs');
  assert.deepEqual(inventory.files,Object.keys(first).filter(f=>f!=='output-manifest.json').sort(),'manifest accounts for every delivered file except itself');
  assert.match(await read('.release/robots.txt',temp),/Disallow: \//);
  for(const file of ['site.css','site.js','app.js'])assert.ok(first[file],file);
  for(const file of ['sim.js','sim.css','sitemap.xml'])assert.ok(!first[file],`retired:${file}`);
  assert.equal((await readdir(temp)).filter(name=>/^\.release(?:-|\.).*(?:tmp|staging)|^\.release-tmp/.test(name)).length,0,'no abandoned staging directory');
 }finally{await rm(temp,{recursive:true,force:true});}
});


test('full policy sections and consent distinctions survive with narrowly corrected implementation copy',async()=>{
 for(const slug of ['terms','privacy','refunds']){
  const original=baseline(`${slug}.html`).toString('utf8'),candidate=await read(`${slug}.html`);
  const headings=html=>[...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].map(m=>normal(m[1]));
  assert.deepEqual(headings(candidate),headings(original),slug);
  assert.doesNotMatch(candidate,/class=["']todo["']|to be inserted|Company no\. —/i);
 }
 const privacy=normal(await read('privacy.html')),refunds=normal(await read('refunds.html'));
 assert.match(privacy,/not automatically restored/);assert.match(privacy,/Tyl/);assert.match(privacy,/Stripe/);assert.match(privacy,/WooCommerce/);
 assert.doesNotMatch(privacy,/nothing is lost if the page reloads/);assert.match(refunds,/do not record a separate request/);assert.match(refunds,/statutory rights are unaffected/i);
});

test('suitability preserves unknown and zero distinctions and never creates a paid result',async()=>{
 const {assessSuitability}=await import(pathToFileURL(path.join(ROOT,'src/experience/suitability.ts')).href);
 const base={aggregateCurrent:'25',unitCurrent:'20',typeTested:'yes',existingKnown:'yes',g100:'no',eps:'no'};
 const cases=[
  [{aggregateCurrent:''},'unknown'],[{aggregateCurrent:'not a number'},'unknown'],[{aggregateCurrent:Infinity},'unknown'],[{aggregateCurrent:-1},'unknown'],
  [{typeTested:'unknown'},'unknown'],[{existingKnown:'unknown'},'unknown'],[{existingKnown:'no'},'unknown'],[{eps:'unknown'},'unknown'],
  [{aggregateCurrent:'0',unitCurrent:'0'},'zero'],[{aggregateCurrent:16,unitCurrent:16},'notification'],
  [{aggregateCurrent:32,unitCurrent:20},'boundary'],[{aggregateCurrent:60,unitCurrent:30,g100:'yes'},'boundary'],
  [{aggregateCurrent:61,unitCurrent:30,g100:'yes'},'outside'],[{aggregateCurrent:40,unitCurrent:33,g100:'yes'},'outside'],
  [{aggregateCurrent:25,unitCurrent:30},'inconsistent'],[{eps:'yes'},'review'],[{typeTested:'no'},'review'],
  [{aggregateCurrent:50,unitCurrent:30,g100:'unknown'},'limitation'],[{aggregateCurrent:50,unitCurrent:30,g100:'no'},'limitation'],
  [{aggregateCurrent:50,unitCurrent:30,g100:'yes'},'possible'],
  [{aggregateCurrent:21.74,unitCurrent:21.74,g100:'no'},'possible'],
 ];
 for(const[change,id]of cases){const result=assessSuitability({...base,...change});assert.equal(result.id,id,JSON.stringify(change));assert.equal(result.href,'/contact.html');assert.doesNotMatch(result.title,/you(?: are|'re) eligible|approved/i);}
 // A single >16 A unit below 32 A is not automatically SGI-2; current SGI-3
 // can waive export limitation at aggregate <=32 A. The UI must remain tentative.
 const single=assessSuitability({...base,aggregateCurrent:21.74,unitCurrent:21.74});assert.doesNotMatch(single.title+single.copy,/SGI.?2/);assert.match(single.copy,/intrinsic|documentation|documents/);
});
