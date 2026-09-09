import {configuration,services,verifySignature,retrieveApplication,verifyPayment,respondError,PaymentError,checkMerchant} from '../lib/solar-payments.js';
export const config={api:{bodyParser:false}};
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).end();}
 try{
  const cfg=configuration();let size=0;const chunks=[];
  for await(const chunk of req){const bytes=Buffer.from(chunk);size+=bytes.length;if(size>262144)throw new PaymentError('body_too_large',413);chunks.push(bytes);}
  const raw=Buffer.concat(chunks);verifySignature(raw,req.headers['stripe-signature'],process.env.STRIPE_WEBHOOK_SECRET);
  let event;try{event=JSON.parse(raw);}catch{throw new PaymentError('invalid_event',400);}
  if(event.livemode!==cfg.livemode||event.account)throw new PaymentError('wrong_account_or_mode',400);
  if(!['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type))return res.status(200).json({received:true});
  const session=event.data?.object;
  if(!/^evt_[A-Za-z0-9]+$/.test(event.id||'')||!/^cs_[A-Za-z0-9_]+$/.test(session?.id||''))throw new PaymentError('invalid_event',400);
  if(session.metadata?.protocol!=='solar-v1')return res.status(200).json({received:true,ignored:true});
  const svc=services(cfg);await checkMerchant(svc,cfg);
  const app=await retrieveApplication(svc,session.metadata.solar_application_id);
  const result=await verifyPayment(svc,cfg,app,session.id,event.id);
  if(result.status!=='paid')throw new PaymentError('payment_not_confirmed');
  return res.status(200).json({received:true});
 }catch(error){return respondError(res,error);}
}
