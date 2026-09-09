import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import { cp, mkdir, readdir, readFile, writeFile, rm, rename, lstat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
// Generated candidate only. Stage from an allowlist, then atomically replace the
// known output directory. Source, original checkout and neighbouring paths survive.
const root=new URL('../',import.meta.url),release=new URL('.release/',root),staging=new URL('.release-staging/',root),previous=new URL('.release-previous/',root);
execFileSync('python3',[fileURLToPath(new URL('build.py',root))],{cwd:fileURLToPath(root),stdio:'inherit'});
for(const location of [release,staging,previous]){try{if((await lstat(location)).isSymbolicLink())throw Error('Generated output must not be a symlink');}catch(e){if(e.code!=='ENOENT')throw e;}}
await rm(staging,{recursive:true,force:true});await mkdir(staging,{recursive:true});
const staticFiles=['solar.html','suitability.html','guide.css','apply.html','simulator.html','faq.html','contact.html','terms.html','privacy.html','refunds.html','success.html','style.css','site.css','site.js','app.js','favicon.svg','data'];
for(const file of staticFiles)await cp(new URL(file,root),new URL(file,staging),{recursive:true});
await cp(new URL('.preview-build/',root),staging,{recursive:true});
await cp(new URL('experience.html',staging),new URL('index.html',staging));
await writeFile(new URL('robots.txt',staging),'User-agent: *\nDisallow: /\n');
const manifest=[];async function inventory(dir,prefix=''){for(const e of await readdir(dir,{withFileTypes:true})){const rel=prefix+e.name;if(e.isDirectory())await inventory(new URL(e.name+'/',dir),rel+'/');else manifest.push(rel);}}
const config=JSON.parse(await readFile(new URL('vercel.json',root),'utf8'));
// The root Vercel build owns server functions in api/. This output is public static content only; no handler source, helper or package files are copied here.
config.buildCommand='';config.outputDirectory='.';
await writeFile(new URL('vercel.json',staging),JSON.stringify(config,null,2)+'\n');
await inventory(staging);await writeFile(new URL('output-manifest.json',staging),JSON.stringify({owner:'scripts/assemble.mjs',localCandidate:true,files:manifest.sort()},null,2)+'\n');
await rm(previous,{recursive:true,force:true});
try{await rename(release,previous);}catch(e){if(e.code!=='ENOENT')throw e;}
try{await rename(staging,release);}catch(e){try{await rename(previous,release);}catch{}throw e;}
await rm(previous,{recursive:true,force:true});
const sizes=[];for(const file of await readdir(new URL('experience-assets/',release))){const data=await readFile(new URL(`experience-assets/${file}`,release));sizes.push({file,bytes:data.length,gzip:gzipSync(data).length,sha256:createHash('sha256').update(data).digest('hex')});}
const mediaBytes=sizes.filter(x=>/\.(webp|png|jpg|glb|ktx2|json)$/.test(x.file)).reduce((n,x)=>n+x.bytes,0);
const totalJS=sizes.filter(x=>x.file.endsWith('.js')).reduce((n,x)=>n+x.gzip,0);
const region=sizes.find(x=>/^region-land-.*\.json$/.test(x.file));
const regionCode=sizes.find(x=>/^region-.*\.js$/.test(x.file));
const siteCode=sizes.find(x=>/^site-(?!layout).*\.js$/.test(x.file));
const cellCode=sizes.find(x=>/^cell-.*\.js$/.test(x.file)),electricalCode=sizes.find(x=>/^electrical-.*\.js$/.test(x.file)),flowCode=sizes.find(x=>/^energy-flow-.*\.js$/.test(x.file));
const businessCode=sizes.find(x=>/^business-(?!journey).*\.js$/.test(x.file)),storageCode=sizes.find(x=>/^storage-(?!path).*\.js$/.test(x.file));
const incremental={businessCodeGzipBytes:businessCode?.gzip??0,storageCodeGzipBytes:storageCode?.gzip??0,cellCodeGzipBytes:cellCode?.gzip??0,electricalCodeGzipBytes:electricalCode?.gzip??0,flowCodeGzipBytes:flowCode?.gzip??0,regionRawBytes:region?.bytes??0,regionGzipBytes:region?.gzip??0,regionCodeGzipBytes:regionCode?.gzip??0,siteCodeGzipBytes:siteCode?.gzip??0,budgets:{businessCodeGzip:12000,storageCodeGzip:10000,cellCodeGzip:8000,electricalCodeGzip:8000,flowCodeGzip:2000,regionRaw:550000,regionGzip:180000,regionCodeGzip:10000,siteCodeGzip:20000}};
const pass=incremental.businessCodeGzipBytes<=12000&&incremental.storageCodeGzipBytes<=10000&&incremental.cellCodeGzipBytes<=8000&&incremental.electricalCodeGzipBytes<=8000&&incremental.flowCodeGzipBytes<=2000&&totalJS<=750000&&mediaBytes<=2000000&&incremental.regionRawBytes<=550000&&incremental.regionGzipBytes<=180000&&incremental.regionCodeGzipBytes<=10000&&incremental.siteCodeGzipBytes<=20000;
const report={measuredAt:new Date().toISOString(),files:sizes,newJavaScriptGzipBytes:totalJS,budgetBytes:750000,newMediaBytes:mediaBytes,mediaBudgetBytes:2000000,incremental,pass};
await mkdir(new URL('docs/experience/',root),{recursive:true});
await writeFile(new URL('docs/experience/asset-sizes.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({release:'.release',...report,files:undefined},null,2));
if(!pass)process.exitCode=1;
