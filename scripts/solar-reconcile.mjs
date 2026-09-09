// Server-only operator recovery. A reported next cursor resumes the same scan;
// subsequent complete scans revisit transient failures. Never creates charges.
import {configuration,services,checkMerchant} from '../lib/solar-payments.js';
import {reconcileApplications} from '../lib/solar-recovery.js';
const cfg=configuration(),svc=services(cfg);
await checkMerchant(svc,cfg);
const after=process.env.SOLAR_RECOVERY_CURSOR?JSON.parse(process.env.SOLAR_RECOVERY_CURSOR):null;
const result=await reconcileApplications(svc,cfg,{after,...(process.env.SOLAR_RECOVERY_UNTIL?{until:process.env.SOLAR_RECOVERY_UNTIL}:{})});
console.log(JSON.stringify(result));
if(result.unresolved||!result.complete)process.exitCode=2;
