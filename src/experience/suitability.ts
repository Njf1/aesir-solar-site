/** Indicative current-edition guidance only. No paid-result CTA or prefill verdict.
 * Current G99 clauses/table differ at exact 32/60 A boundaries: refer for review.
 * Registered per-unit capacity and intrinsic limits still require documentation.
 */
export interface SuitabilityInput {aggregateCurrent:unknown;unitCurrent:unknown;typeTested:unknown;existingKnown:unknown;g100:unknown;eps:unknown}
const current=(v:unknown)=>typeof v==='number'?Number.isFinite(v)&&v>=0?v:null:typeof v==='string'&&v.trim()!==''&&Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null;
export function assessSuitability(v:SuitabilityInput){
 const aggregate=current(v.aggregateCurrent),unit=current(v.unitCurrent);
 const result=(id:string,title:string,copy:string)=>({id,title,copy,href:'/contact.html'});
 if(aggregate===null||unit===null||v.typeTested==='unknown'||v.existingKnown!=='yes'||v.eps==='unknown')return result('unknown','Some details still need confirmation.','Confirm the documented AC ratings, type-testing, existing generation and backup arrangement before choosing an application. Unknown is not a pass.');
 if(aggregate===0||unit===0)return result('zero','No generating output is identified.','A valid zero is not missing data. If generation is proposed, confirm its registered AC rating; a paid A1-2 application has not been established.');
 if(unit>aggregate)return result('inconsistent','Check the per-phase ratings.','The largest unit exceeds the stated aggregate. Confirm that the figures describe the same phase and all existing and proposed equipment.');
 if(v.typeTested!=='yes'||v.eps!=='no')return result('review','This arrangement needs a design review.','Type-testing and any island, EPS or backup operation need specific review. This guide cannot select a suitable paid A1-2 route for these answers.');
 if(unit>32||aggregate>60)return result('outside','A different connection route may be needed.','These ratings fall outside the small-generation A1-2 limits described here. Discuss the design and relevant operator process before paying.');
 if(aggregate===32||aggregate===60)return result('boundary','Confirm this boundary with the operator.','The current G99 summary table and detailed clauses use different wording at this boundary. Obtain confirmation for the actual arrangement.');
 if(aggregate<=16)return result('notification','An A1-2 application may not be needed.','A notification route may apply, subject to the equipment and installation conditions. Confirm the appropriate procedure rather than paying for an assumed A1-2 application.');
 if(aggregate>32&&v.g100!=='yes')return result('limitation','Export limitation needs confirmation.','This aggregate rating needs a suitable fully type-tested G100 scheme for the small-generation route described here. The limit and full design require review.');
 return result('possible','A1-2 may be a route to consider.','These answers may fall within a small-generation application route. Confirm intrinsic and registered unit ratings, equipment documents, export limits and the full arrangement with Aesir and the relevant operator before paying.');
}
export function initSuitability(){
 const form=document.querySelector<HTMLFormElement>('#eligibility-checker');if(!form)return;
 const update=()=>{const values=Object.fromEntries(new FormData(form).entries()) as unknown as SuitabilityInput,r=assessSuitability(values);form.dataset.result=r.id;document.querySelector('#suitability-result-title')!.textContent=r.title;document.querySelector('#suitability-result-copy')!.textContent=r.copy;};
 form.addEventListener('input',update);form.addEventListener('change',update);form.addEventListener('submit',event=>event.preventDefault());
}
