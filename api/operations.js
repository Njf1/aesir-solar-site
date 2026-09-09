import {configuration,services,checkMerchant,respondError} from '../lib/solar-payments.js';
import {deliverAlerts,authorizedCron,verifyMail} from '../lib/solar-alerts.js';
import {reconcileApplications} from '../lib/solar-recovery.js';
export const config={maxDuration:300};
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return res.status(405).end();}
 if(!authorizedCron(req))return res.status(401).json({error:'unauthorized'});
 try{
  const cfg=configuration(),svc=services(cfg),name='recovery-'+(cfg.livemode?'live':'test');
  if(req.method==='HEAD'){
   await checkMerchant(svc,cfg);await svc.db('solar_applications?select=id&limit=1');await verifyMail();
   return res.status(200).end();
  }
  const lease=await svc.rpc('solar_claim_operation',{p_name:name});
  if(!lease?.lease_token)return res.status(200).json({busy:true});
  await checkMerchant(svc,cfg);
  const recovery=await reconcileApplications(svc,cfg,{maxApplications:3,maxSessionPages:2,after:lease.cursor,until:lease.cutoff});
  const alerts=await deliverAlerts(svc,cfg,{limit:3});
  await svc.rpc('solar_finish_operation',{p_name:name,p_token:lease.lease_token,p_cursor:recovery.next,p_complete:recovery.complete});
  return res.status(alerts.failed?503:200).json({checked:recovery.checked,recovered:recovery.paid,complete:recovery.complete,...alerts});
 }catch(e){return respondError(res,e);}
}
