import {configuration,services,identity,retrieveApplication,verifyPayment,jsonBody,postOnly,respondError,PaymentError,checkMerchant,requestOrigin} from '../lib/solar-payments.js';
export default async function handler(req,res){
 if(!postOnly(req,res))return;
 try{
  const cfg=configuration();requestOrigin(req,cfg);
  const {id,tokenHash}=identity(jsonBody(req)),svc=services(cfg),app=await retrieveApplication(svc,id);
  if(app.livemode!==cfg.livemode)throw new PaymentError('application_not_found',404);
  if(app.token_hash!==tokenHash)throw new PaymentError('application_not_found',404);
  let status=app.status;
  if(status!=='paid'&&app.session_id){await checkMerchant(svc,cfg);status=(await verifyPayment(svc,cfg,app,app.session_id,`return:${app.session_id}`)).status;}
  return res.status(200).json({id,status,testMode:!cfg.livemode});
 }catch(error){return respondError(res,error);}
}
