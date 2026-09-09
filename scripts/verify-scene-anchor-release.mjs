import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const origin='https://aesirsolar.co.uk',report={date:new Date().toISOString(),origin,files:[]};
const sizes=JSON.parse(await readFile('docs/experience/asset-sizes.json','utf8'));
const response=await fetch(origin);assert.equal(response.status,200);const html=await response.text();
for(const f of sizes.files.filter(f=>/^(experience-.*\.(js|css)|scene-.*\.js)$/.test(f.file))){
 if(f.file.startsWith('experience-'))assert.ok(html.includes(f.file));
 const r=await fetch(`${origin}/experience-assets/${f.file}`);assert.equal(r.status,200);
 const sha256=createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex');assert.equal(sha256,f.sha256);
 report.files.push({file:f.file,sha256});
}
await writeFile('docs/experience/mobile-scene-anchor/live-assets.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
