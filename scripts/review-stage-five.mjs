import {spawn} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
const root='docs/experience/stage-five';
const commands=[['npm',['run','typecheck']],['npm',['test']],['npm',['run','test:browser']],[process.execPath,['scripts/capture-stage-five.mjs']],[process.execPath,['scripts/inspect-stage-five.mjs']],[process.execPath,['scripts/inspect-stage-five-responsive-motion.mjs']],[process.execPath,['scripts/verify-stage-five.mjs']]];
const results=[];
for(const[command,args]of commands){
 const name=[command==='npm'?'npm':'node',...args].join(' ');console.log(`Starting ${name}`);const startedAt=new Date().toISOString(),start=Date.now();let output='';
 const code=await new Promise((resolve,reject)=>{const p=spawn(command,args,{stdio:['ignore','pipe','pipe']});for(const stream of[p.stdout,p.stderr])stream.on('data',chunk=>{output+=chunk.toString();process.stdout.write(chunk);});p.on('error',reject);p.on('close',resolve);});
 const record={command:name,startedAt,elapsedMs:Date.now()-start,exitCode:code};results.push(record);
 const log=`review-${results.length}.log`;await writeFile(`${root}/${log}`,output);record.log=log;await writeFile(`${root}/review-checks.json`,JSON.stringify({results},null,2)+'\n');
 if(code!==0){process.exitCode=1;break;}
}
