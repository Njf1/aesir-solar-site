import {configuration,services,identity,validateApplication,digest,POLICY_VERSION,checkMerchant,sessionPayload,sessionMatches,verifyPayment,jsonBody,postOnly,respondError,PaymentError,rateIdentity,requestOrigin} from '../lib/solar-payments.js';
export default async function handler(req,res){
 if(!postOnly(req,res))return;
 try{
  const cfg=configuration();cfg.origin=requestOrigin(req,cfg);
  const body=jsonBody(req),{id,tokenHash}=identity(body),details=validateApplication(body),svc=services(cfg);
  await checkMerchant(svc,cfg);
  const rate=cfg.livemode?rateIdentity(req,cfg):null;
  const app=await svc.rpc(rate?'solar_prepare_limited':'solar_prepare',{p_id:id,p_token_hash:tokenHash,p_payload_hash:digest(JSON.stringify(details)),p_details:details,p_policy_version:POLICY_VERSION,p_livemode:cfg.livemode,p_origin:cfg.origin,...(rate?{p_ip_hash:rate.ip,p_email_hash:rate.email(details.email)}:{})});
  if(app.status==='paid')return res.status(200).json({id,status:'paid',url:`${app.checkout_origin}/success.html?application=${id}`});
  let session;
  if(app.session_id){
   const result=await verifyPayment(svc,cfg,app,app.session_id,`return:${app.session_id}`);
   if(result.status==='paid')return res.status(200).json({id,status:'paid',url:`${app.checkout_origin}/success.html?application=${id}`});
   session=result.session;
  }else{
   // Never recreate after Stripe's idempotency retention window. An uncertain
   // creation can be retried with identical bytes within the shorter 2h expiry.
   if(Date.now()-new Date(app.created_at).getTime()>5400000)throw new PaymentError('payment_reference_needs_review',409);
   session=await svc.stripe('checkout/sessions','POST',sessionPayload(app,cfg),`solar-v1:${id}`);
   sessionMatches(session,app,cfg);
   await svc.rpc('solar_bind',{p_id:id,p_session_id:session.id,p_livemode:cfg.livemode});
  }
  if(session.status==='expired')throw new PaymentError('payment_session_expired',409);
  if(session.status!=='open'||!session.url?.startsWith('https://checkout.stripe.com/'))throw new PaymentError('payment_reference_needs_review',409);
  return res.status(200).json({id,status:'awaiting_payment',url:session.url});
 }catch(error){return respondError(res,error);}
}
