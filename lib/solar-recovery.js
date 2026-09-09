import {verifyPayment,PaymentError} from './solar-payments.js';

// Keyset pagination advances past unresolved rows and remains stable when a
// confirmation removes earlier rows from the pending set. No payment is created.
export async function reconcileApplications(svc,cfg,{pageSize=50,maxApplications=500,after=null,until=new Date().toISOString(),maxSessionPages=20}={}){
 if(!Number.isInteger(pageSize)||pageSize<1||pageSize>100||!Number.isInteger(maxApplications)||maxApplications<1||maxApplications>5000||!Number.isFinite(Date.parse(until)))throw new PaymentError('invalid_recovery_options',400);
 if(after&&(!Number.isFinite(Date.parse(after.created_at))||!/^[a-f0-9-]{36}$/.test(after.id)))throw new PaymentError('invalid_recovery_cursor',400);
 let cursor=after,checked=0,paid=0,unresolved=0,exhausted=false;
 while(checked<maxApplications){
  const limit=Math.min(pageSize,maxApplications-checked);
  const query=new URLSearchParams({status:'in.(saved,awaiting_payment)',livemode:'eq.'+cfg.livemode,order:'created_at.asc,id.asc',limit:String(limit),created_at:'lte.'+until});
  if(cursor)query.set('or',`(created_at.gt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.gt.${cursor.id}))`);
  const rows=await svc.db('solar_applications?'+query);
  if(!rows.length){exhausted=true;break;}
  for(const app of rows){
   checked++;cursor={created_at:app.created_at,id:app.id};
   try{
    let id=app.session_id;
    if(!id){
     const start=Math.floor(Date.parse(app.created_at)/1000)-60,matches=[];let startingAfter,pages=0,more;
     do{
      const q=new URLSearchParams({limit:'100','created[gte]':String(start),'created[lte]':String(start+7260)});
      if(startingAfter)q.set('starting_after',startingAfter);
      const result=await svc.stripe('checkout/sessions?'+q);pages++;
      for(const s of result.data)if(s.metadata?.solar_application_id===app.id&&s.metadata?.protocol==='solar-v1')matches.push(s.id);
      more=result.has_more;startingAfter=result.data.at(-1)?.id;
      if(more&&!startingAfter)throw new PaymentError('invalid_provider_page');
     }while(more&&pages<maxSessionPages);
     if(more||matches.length!==1){unresolved++;continue;}id=matches[0];
    }
    const result=await verifyPayment(svc,cfg,app,id,`reconcile:${id}`);
    if(result.status==='paid')paid++;else unresolved++;
   }catch{unresolved++;}
  }
  if(rows.length<limit){exhausted=true;break;}
 }
 return {mode:cfg.livemode?'live':'test',checked,paid,unresolved,until,complete:exhausted,next:exhausted?null:cursor};
}
