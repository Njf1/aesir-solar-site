import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
import {isIP} from 'node:net';
export const POLICY_VERSION='2026-09-09-stripe-v1';
export const AMOUNT=30000;
export class PaymentError extends Error {constructor(code,status=503){super(code);this.status=status;}}
export const digest=value=>createHash('sha256').update(value).digest('hex');
export function identity(body){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body?.applicationId||'')||!/^[a-f0-9]{64}$/.test(body?.accessToken||''))throw new PaymentError('invalid_reference',400);
 return {id:body.applicationId,tokenHash:digest(body.accessToken)};
}
export function validateApplication(body){
 const details={};
 for(const name of ['company','contact','email','phone','accreditation','address','postcode','mpan','inverter','typetest','kw','phases','storage','target','notes']){
  const value=body[name]??'';
  if(typeof value!=='string'||value.length>(name==='notes'?12000:name==='address'?2000:500))throw new PaymentError('invalid_'+name,400);
  details[name]=value.trim();
 }
 for(const field of ['contact','email','phone','address','postcode','inverter','kw'])if(!details[field])throw new PaymentError('missing_'+field,400);
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(details.email))throw new PaymentError('invalid_email',400);
 const postcode=details.postcode.toUpperCase().replace(/\s/g,'');
 if(!/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(postcode))throw new PaymentError('invalid_postcode',400);
 if(/^(BT|GY|JE|IM)/.test(postcode))throw new PaymentError('suitability_review',422);
 if(!['1','3'].includes(details.phases))throw new PaymentError('invalid_phases',400);
 if(!/^\d+(\.\d{1,2})?$/.test(details.kw)||Number(details.kw)<=0)throw new PaymentError('invalid_kw',400);
 if(details.storage&&(!/^\d+(\.\d+)?$/.test(details.storage)||!Number.isFinite(Number(details.storage))))throw new PaymentError('invalid_storage',400);
 if(details.mpan&&!/^\d{13}$/.test(details.mpan.replace(/\s/g,'')))throw new PaymentError('invalid_mpan',400);
 if(details.target&&(!/^\d{4}-\d{2}-\d{2}$/.test(details.target)||!Number.isFinite(Date.parse(details.target))||new Date(details.target).toISOString().slice(0,10)!==details.target))throw new PaymentError('invalid_target',400);
 if(body.acceptedTerms!==true||body.acceptedPrivacy!==true||body.agree!=='on'||body.privacy!=='on')throw new PaymentError('consents_required',400);
 for(const name of ['g100','eps']){if(typeof body[name]!=='boolean')throw new PaymentError('invalid_'+name,400);details[name]=body[name];}
 // Conservative screening, not certification: the form cannot establish
 // individual intrinsic ratings or the network's design decision.
 const current=Number(details.kw)*1000/(230*Number(details.phases));
 if(current<=16||current>=60||body.eps||(current>=32&&!body.g100))throw new PaymentError('suitability_review',422);
 return {...details,agree:true,privacy:true,acceptedTerms:true,acceptedPrivacy:true};
}
export function configuration(env=process.env){
 const mode=env.SOLAR_PAYMENT_MODE,key=env.STRIPE_SECRET_KEY||'';
 if(!env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_'))throw new PaymentError('payments_unavailable');
 if(!['test','live'].includes(mode)||!new RegExp(`^(sk|rk)_${mode}_`).test(key))throw new PaymentError('payments_unavailable');
 if(env.VERCEL_ENV==='production'&&mode!=='live')throw new PaymentError('payments_unavailable');
 if(mode==='live'&&env.SOLAR_LIVE_ENABLED!=='yes')throw new PaymentError('payments_unavailable');
 const origin=env.SOLAR_SITE_ORIGIN,allowed=['https://aesir-solar.vercel.app','https://aesirsolar.co.uk','https://www.aesirsolar.co.uk'];
 if(mode==='test'&&/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin||''))allowed.push(origin);
 if(mode==='test')allowed.push('http://127.0.0.1:4180');
 if(!allowed.includes(origin)||env.STRIPE_ACCOUNT_ID!=='acct_1S0LTfL9cBVV8DnX'||!/^txr_[A-Za-z0-9]+$/.test(env.STRIPE_TAX_RATE_ID||''))throw new PaymentError('payments_unavailable');
 if(env.SUPABASE_URL!=='https://gkxwaeoknypueqbcqhtl.supabase.co'||!env.SUPABASE_SECRET_KEY?.startsWith('sb_secret_'))throw new PaymentError('storage_unavailable');
 return {key,origin,livemode:mode==='live',account:env.STRIPE_ACCOUNT_ID,tax:env.STRIPE_TAX_RATE_ID,db:env.SUPABASE_URL,dbKey:env.SUPABASE_SECRET_KEY};
}
export function toForm(object,prefix='',out=new URLSearchParams()){
 for(const[k,v]of Object.entries(object)){if(v===undefined||v===null)continue;const name=prefix?`${prefix}[${k}]`:k;if(typeof v==='object')toForm(v,name,out);else out.append(name,String(v));}return out;
}
export function services(config,transport=fetch){
 async function request(url,options,kind){
  let response,data;
  try{response=await transport(url,{...options,signal:AbortSignal.timeout(10000)});data=await response.json();}catch{throw new PaymentError(kind+'_unavailable');}
  if(!response.ok&&kind==='storage'&&data.code==='P0429')throw new PaymentError('checkout_rate_limited',429);
  if(!response.ok)throw new PaymentError(kind==='storage'&&data.code==='22023'?'application_conflict':kind+'_unavailable',kind==='storage'&&data.code==='22023'?409:503);
  return data;
 }
 const stripe=(path,method='GET',body,key)=>request(`https://api.stripe.com/v1/${path}`,{method,headers:{Authorization:`Bearer ${config.key}`,'Stripe-Version':'2024-06-20',...(body?{'Content-Type':'application/x-www-form-urlencoded'}:{}),...(key?{'Idempotency-Key':key}:{})},...(body?{body:toForm(body).toString()}:{})},'payment');
 const db=(path,method='GET',body)=>request(`${config.db}/rest/v1/${path}`,{method,headers:{apikey:config.dbKey,'Content-Type':'application/json',Prefer:'return=representation'},...(body?{body:JSON.stringify(body)}:{})},'storage');
 return {stripe,db,rpc:(name,args)=>db(`rpc/${name}`,'POST',args)};
}
export async function checkMerchant(svc,cfg){
 const [account,tax]=await Promise.all([svc.stripe('account'),svc.stripe(`tax_rates/${cfg.tax}`)]);
 if(account.id!==cfg.account||tax.livemode!==cfg.livemode||tax.percentage!==20||tax.inclusive!==false||tax.active!==true)throw new PaymentError('merchant_configuration_mismatch');
}
export function sessionPayload(app,cfg){
 return {mode:'payment',payment_method_types:['card'],customer_email:app.details.email,client_reference_id:app.id,
 metadata:{solar_application_id:app.id,payload_hash:app.payload_hash,protocol:'solar-v1'},
 line_items:[{quantity:1,price_data:{currency:'gbp',unit_amount:25000,product_data:{name:'G99 Form A1-2 application service',description:'Preparation, submission and follow-up. £250 fee + £50 VAT = £300. Installation and network approval are not included.'}},tax_rates:[cfg.tax]}],
 success_url:`${app.checkout_origin}/success.html?application=${app.id}&session_id={CHECKOUT_SESSION_ID}`,
 cancel_url:`${app.checkout_origin}/apply.html?cancelled=1&application=${app.id}`,
 expires_at:Math.floor(new Date(app.created_at).getTime()/1000)+7200};
}
export function sessionMatches(s,app,cfg){
 if(!/^cs_[A-Za-z0-9_]+$/.test(s.id||'')||s.livemode!==cfg.livemode||app.livemode!==cfg.livemode||s.mode!=='payment'||s.client_reference_id!==app.id||s.metadata?.solar_application_id!==app.id||s.metadata?.payload_hash!==app.payload_hash||s.metadata?.protocol!=='solar-v1'||s.amount_total!==AMOUNT||s.currency!=='gbp'||s.total_details?.amount_tax!==5000||(app.session_id&&app.session_id!==s.id))throw new PaymentError('payment_mismatch',409);
}
export async function retrieveApplication(svc,id){
 const rows=await svc.db(`solar_applications?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
 if(!rows[0])throw new PaymentError('application_not_found',404);return rows[0];
}
export async function verifyPayment(svc,cfg,app,id,eventId){
 const session=await svc.stripe(`checkout/sessions/${encodeURIComponent(id)}?expand[]=payment_intent`);sessionMatches(session,app,cfg);
 if(session.payment_status!=='paid'||session.status!=='complete')return {id:app.id,status:session.status==='expired'?'expired':'awaiting_payment',session};
 const pi=session.payment_intent;
 if(!pi||typeof pi!=='object'||pi.status!=='succeeded'||pi.amount!==AMOUNT||pi.amount_received!==AMOUNT||pi.currency!=='gbp'||pi.livemode!==cfg.livemode)throw new PaymentError('payment_mismatch',409);
 const lines=await svc.stripe(`checkout/sessions/${encodeURIComponent(session.id)}/line_items?limit=2`);
 if(lines.has_more||lines.data?.length!==1||lines.data[0].quantity!==1||lines.data[0].amount_total!==AMOUNT)throw new PaymentError('payment_mismatch',409);
 return svc.rpc('solar_record_payment',{p_id:app.id,p_session_id:session.id,p_payment_intent_id:pi.id,p_livemode:cfg.livemode,p_amount:AMOUNT,p_currency:'gbp',p_event_id:eventId});
}
export function verifySignature(raw,header,secret,now=Math.floor(Date.now()/1000)){
 if(!secret?.startsWith('whsec_')||typeof header!=='string')throw new PaymentError('invalid_signature',400);
 const parts=header.split(',').map(p=>p.split('=')),stamps=parts.filter(([k])=>k==='t');
 if(stamps.length!==1||!/^\d+$/.test(stamps[0][1])||Math.abs(now-Number(stamps[0][1]))>300)throw new PaymentError('invalid_signature',400);
 const expected=createHmac('sha256',secret).update(`${stamps[0][1]}.`).update(raw).digest();
 if(!parts.some(([k,v])=>k==='v1'&&/^[a-f0-9]{64}$/.test(v)&&timingSafeEqual(expected,Buffer.from(v,'hex'))))throw new PaymentError('invalid_signature',400);
}
export function jsonBody(req){
 let body=req.body;
 if(typeof body==='string'){if(Buffer.byteLength(body)>24000)throw new PaymentError('body_too_large',413);try{body=JSON.parse(body);}catch{throw new PaymentError('invalid_body',400);}}
 if(!body||typeof body!=='object'||Array.isArray(body)||Buffer.byteLength(JSON.stringify(body))>24000)throw new PaymentError('invalid_body',400);return body;
}
export function respondError(res,e){return res.status(e instanceof PaymentError?e.status:503).json({error:e instanceof PaymentError?e.message:'temporarily_unavailable',contact:'/contact.html'});}
export function postOnly(req,res){res.setHeader('Cache-Control','no-store');if(req.method!=='POST'){res.setHeader('Allow','POST');res.status(405).json({error:'method_not_allowed'});return false;}return true;}

export function rateIdentity(req,cfg){
 const ip=process.env.VERCEL?req.headers['x-vercel-forwarded-for']:req.socket?.remoteAddress;
 if(typeof ip!=='string'||!isIP(ip))throw new PaymentError('request_identity_unavailable');
 const hash=value=>createHmac('sha256',cfg.dbKey).update(value).digest('hex');
 return {ip:hash('ip:'+ip),email:email=>hash('email:'+email.toLowerCase())};
}
