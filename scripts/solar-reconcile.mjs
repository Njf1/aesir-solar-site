// Operator recovery for delayed webhooks. Uses server environment only; never
// creates payments or prints application details. Run after restoring a paused DB.
import {configuration,services,checkMerchant,verifyPayment} from '../lib/solar-payments.js';
const cfg=configuration(),svc=services(cfg);
await checkMerchant(svc,cfg);
let checked=0,paid=0,unresolved=0;
for(;;){
 const rows=await svc.db(`solar_applications?status=in.(saved,awaiting_payment)&livemode=eq.${cfg.livemode}&order=created_at.asc,id.asc&limit=100`);
 if(!rows.length)break;
 // Take a stable snapshot of IDs before mutations change the pending set.
 const pending=[];for(const app of rows)pending.push(app);
 for(const app of pending){
  checked++;
  try{
   let id=app.session_id;
   if(!id){
    const start=Math.floor(Date.parse(app.created_at)/1000)-60;
    let after;const matches=[];
    do{
     const result=await svc.stripe(`checkout/sessions?limit=100&created[gte]=${start}&created[lte]=${start+7260}${after?'&starting_after='+encodeURIComponent(after):''}`);
     for(const s of result.data)if(s.metadata?.solar_application_id===app.id&&s.metadata?.protocol==='solar-v1')matches.push(s.id);
     after=result.has_more?result.data.at(-1)?.id:undefined;
    }while(after);
    if(matches.length!==1){unresolved++;continue;}id=matches[0];
    // verifyPayment binds only a paid, independently checked session.
   }
   const result=await verifyPayment(svc,cfg,app,id,`reconcile:${id}`);
   if(result.status==='paid')paid++;else unresolved++;
  }catch{unresolved++;}
 }
 // Avoid offset arithmetic across mutations: this run is deliberately bounded
 // to the oldest batch. Rerun after resolving failures for further batches.
 break;
}
console.log(JSON.stringify({mode:cfg.livemode?'live':'test',checked,paid,unresolved,batchLimit:100}));
if(unresolved)process.exitCode=2;
