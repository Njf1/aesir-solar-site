// Encrypted operator backup. No plaintext PII or secrets in logs/repository.
// SOLAR_BACKUP_DIRECTORY must be a private location outside this repository.
import {readFile,writeFile,mkdir,realpath} from 'node:fs/promises';
import {randomBytes,createCipheriv,createDecipheriv,createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const directory=process.env.SOLAR_BACKUP_DIRECTORY;
if(!directory||!path.isAbsolute(directory))throw new Error('Set a private absolute SOLAR_BACKUP_DIRECTORY');
await mkdir(directory,{recursive:true,mode:0o700});
const target=await realpath(directory),root=await realpath(fileURLToPath(new URL('..',import.meta.url)));
if(target===root||target.startsWith(root+path.sep))throw new Error('Backups must stay outside the repository');
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
if(url!=='https://gkxwaeoknypueqbcqhtl.supabase.co'||!key?.startsWith('sb_secret_'))throw new Error('Solar database not configured');
const response=await fetch(url+'/rest/v1/rpc/solar_backup',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(30000)});
if(!response.ok)throw new Error('Backup snapshot unavailable');
const snapshot=await response.json();if(![1,2].includes(snapshot.schema_version))throw new Error('Unknown backup schema');
const plain=Buffer.from(JSON.stringify(snapshot)),keyFile=path.join(target,'backup.key');
let encryptionKey;try{encryptionKey=await readFile(keyFile);}catch(e){if(e.code!=='ENOENT')throw e;encryptionKey=randomBytes(32);await writeFile(keyFile,encryptionKey,{mode:0o600,flag:'wx'});}
if(encryptionKey.length!==32)throw new Error('Invalid backup encryption key');
const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',encryptionKey,iv),encrypted=Buffer.concat([cipher.update(plain),cipher.final()]);
const envelope={version:1,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:encrypted.toString('base64')};
const file=path.join(target,'solar-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json.enc');
await writeFile(file,JSON.stringify(envelope),{mode:0o600,flag:'wx'});
// Read it back from disk and authenticate every byte before reporting success.
const saved=JSON.parse(await readFile(file,'utf8')),decipher=createDecipheriv('aes-256-gcm',encryptionKey,Buffer.from(saved.iv,'base64'));
decipher.setAuthTag(Buffer.from(saved.tag,'base64'));
const restored=Buffer.concat([decipher.update(Buffer.from(saved.data,'base64')),decipher.final()]);
if(!restored.equals(plain))throw new Error('Backup verification failed');
console.log(JSON.stringify({encryptedFile:path.basename(file),bytes:encrypted.length,sha256:createHash('sha256').update(plain).digest('hex'),applications:snapshot.applications.length,workItems:snapshot.work_items.length,paymentEvents:snapshot.payment_events.length,roundTripVerified:true}));
