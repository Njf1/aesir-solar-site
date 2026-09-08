import { cp, mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
// Stage a separate deployment proposal. Never remove or overwrite the source site.
const root=new URL('../',import.meta.url), release=new URL('.release/',root);
await mkdir(release,{recursive:true});
await rm(new URL("experience-assets/",release),{recursive:true,force:true});
const staticFiles=['index.html','apply.html','simulator.html','faq.html','contact.html','terms.html','privacy.html','refunds.html','success.html','style.css','sim.css','app.js','sim.js','favicon.svg','robots.txt','sitemap.xml','data','api','lib','package.json','package-lock.json'];
for(const file of staticFiles)await cp(new URL(file,root),new URL(file,release),{recursive:true});
await cp(new URL('.preview-build/',root),release,{recursive:true});
const config=JSON.parse(await readFile(new URL('vercel.json',root),'utf8'));
// This file is a reviewable proposal only; the checked-in Vercel config remains unchanged.
config.buildCommand='';config.outputDirectory='.';
await writeFile(new URL('vercel.json',release),JSON.stringify(config,null,2)+'\n');
const sizes=[];for(const file of await readdir(new URL('experience-assets/',release))){const data=await readFile(new URL(`experience-assets/${file}`,release));sizes.push({file,bytes:data.length,gzip:gzipSync(data).length,sha256:createHash('sha256').update(data).digest('hex')});}
const mediaBytes=sizes.filter(x=>/\.(webp|png|jpg|glb|ktx2)$/.test(x.file)).reduce((n,x)=>n+x.bytes,0);
const totalJS=sizes.filter(x=>x.file.endsWith('.js')).reduce((n,x)=>n+x.gzip,0);
await writeFile(new URL('docs/experience/asset-sizes.json',root),JSON.stringify({measuredAt:new Date().toISOString(),files:sizes,newJavaScriptGzipBytes:totalJS,budgetBytes:750000,newMediaBytes:mediaBytes,mediaBudgetBytes:2000000,pass:totalJS<=750000&&mediaBytes<=2000000},null,2)+'\n');
console.log(JSON.stringify({release:'.release',newJavaScriptGzipBytes:totalJS,budgetBytes:750000,newMediaBytes:mediaBytes,mediaBudgetBytes:2000000,pass:totalJS<=750000&&mediaBytes<=2000000},null,2));
if(totalJS>750000||mediaBytes>2000000)process.exitCode=1;
