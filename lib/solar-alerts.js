import nodemailer from 'nodemailer';
import {timingSafeEqual} from 'node:crypto';
import {PaymentError} from './solar-payments.js';

export function mailConfiguration(env=process.env){
 if(env.SMTP_HOST!=='smtp.livemail.co.uk'||env.SMTP_USER!=='hello@aesirsolar.co.uk'||!env.SMTP_PASSWORD||
 !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(env.SOLAR_OPERATIONS_EMAIL||''))throw new PaymentError('mail_unavailable');
 return {recipient:env.SOLAR_OPERATIONS_EMAIL,options:{host:env.SMTP_HOST,port:465,secure:true,
 auth:{user:env.SMTP_USER,pass:env.SMTP_PASSWORD},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:20000,
 disableFileAccess:true,disableUrlAccess:true,tls:{minVersion:'TLSv1.2'}}};
}
export function authorizedCron(req,env=process.env){
 const expected=env.CRON_SECRET,header=req.headers.authorization;
 if(!expected||expected.length<32||typeof header!=='string')return false;
 const a=Buffer.from('Bearer '+expected),b=Buffer.from(header);
 return a.length===b.length&&timingSafeEqual(a,b);
}
export async function verifyMail(env=process.env){
 const transport=nodemailer.createTransport(mailConfiguration(env).options);
 try{await transport.verify();}finally{transport.close();}
}
export function alertMessage(row,recipient){
 if(!/^[a-f0-9-]{36}$/.test(row.application_id)||row.amount_pence!==30000||typeof row.livemode!=='boolean')throw new PaymentError('invalid_alert');
 const test=row.livemode?'':'[TEST — no real payment] ';
 // Plain text only; applicant-supplied strings never become headers or links.
 const d=row.details||{};
 return {from:{name:'Aesir Solar',address:'hello@aesirsolar.co.uk'},to:recipient,
 subject:test+'Paid G99 application — '+row.application_id.slice(0,8),
 messageId:`<solar-application-${row.application_id}@aesirsolar.co.uk>`,
 text:`${test}A new application is ready for your attention.\n\nReference: ${row.application_id}\n${row.livemode?'Verified payment':'Verified Stripe TEST payment'}: £250 fee + £50 VAT = £300 total.\n\nThe complete installation details and consents are saved in the private Solar database.\nOpen the solar_operator_queue view in the Table Editor:\nhttps://supabase.com/dashboard/project/gkxwaeoknypueqbcqhtl/editor\n\nMatch the reference above. Review suitability and the supplied documents before preparing/submitting the G99 application. This payment is not network approval.\n\nApplicant: ${d.contact||'See saved application'}\nCompany: ${d.company||'Not supplied'}\n\nUpdate the matching solar_work_items row as work progresses: ready → in_progress → awaiting_applicant/submitted → completed.\n\nA retry can repeat this email if the mail server accepted it before an interrupted acknowledgement. The reference identifies the same single work item; do not start another application.`};
}
export async function deliverAlerts(svc,cfg,{env=process.env,limit=1,applicationId=null,createTransport=nodemailer.createTransport}={}){
 const mail=mailConfiguration(env),transport=createTransport(mail.options);let sent=0,failed=0;
 try{
  for(let i=0;i<Math.min(Math.max(limit,0),5);i++){
   const row=await svc.rpc('solar_claim_alert',{p_livemode:cfg.livemode,p_id:applicationId});
   if(!row)break;
   let accepted=false;
   try{
    const result=await transport.sendMail(alertMessage(row,mail.recipient));
    accepted=!!result.accepted?.some(x=>String(x).toLowerCase()===mail.recipient.toLowerCase());
    if(!accepted)throw new Error('recipient not accepted');
    const saved=await svc.rpc('solar_finish_alert',{p_id:row.application_id,p_token:row.lease_token,p_sent:true,p_uncertain:false});
    if(!saved)throw new Error('alert lease lost');
    sent++;
   }catch{
    failed++;
    // No raw provider errors or application details enter platform logs.
    try{await svc.rpc('solar_finish_alert',{p_id:row.application_id,p_token:row.lease_token,p_sent:false,p_uncertain:accepted});}catch{}
   }
  }
 }finally{transport.close();}
 return {sent,failed};
}
