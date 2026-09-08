import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

/** Build-time only. Validates the supplied recorded fields; it does not verify the
 * measurement independently, infer equipment ratings, or call a telemetry API. */
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const TOKEN='<!-- RECORDED_GENERATION -->';
const experienceFile=fileURLToPath(new URL('../experience.html',import.meta.url));
const defaultDataURL=new URL('../data/premier-composites.json',import.meta.url);
const own=(object,key)=>Object.hasOwn(object,key);
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
const text=value=>typeof value==='string'&&value.trim().length>0&&value.length<=300&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
const energy=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=Number.MAX_SAFE_INTEGER;
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const number=new Intl.NumberFormat('en-GB',{maximumFractionDigits:2});
const dailyNumber=new Intl.NumberFormat('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2});
const axisNumber=new Intl.NumberFormat('en-GB',{maximumFractionDigits:4});
const formatEnergy=(value,daily=false)=>value>0&&value<.01?'<0.01':(daily?dailyNumber:number).format(value);
function dateParts(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
  const [year,month,day]=value.split('-').map(Number),leap=year%4===0&&(year%100!==0||year%400===0);
  const lengths=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
  return year>=1&&month>=1&&month<=12&&day>=1&&day<=lengths[month-1]?{year,month,day}:null;
}

/** @param {unknown} input */
export function validateRecordedGeneration(input){
  const errors=[];
  const error=(path,code)=>errors.push({path,code});
  if(!object(input))return {ok:false,errors:[{path:'$',code:'invalid-object'}]};
  const site=own(input,'site')?input.site:null,day=own(input,'day_sample')?input.day_sample:null;
  if(!object(site))error('site','invalid-object');
  if(!object(day))error('day_sample','invalid-object');
  if(errors.length)return {ok:false,errors};
  for(const key of ['name','location','monitoring'])if(!own(site,key)||!text(site[key]))error(`site.${key}`,'invalid-text');
  if(!own(site,'source')||site.source!=='measured')error('site.source','unverified-source');
  if(!own(day,'source')||day.source!=='measured')error('day_sample.source','unverified-source');
  const date=own(day,'date')?dateParts(day.date):null;
  if(!date)error('day_sample.date','invalid-date');
  if(!own(day,'pv_production_kwh')||!energy(day.pv_production_kwh))error('day_sample.pv_production_kwh','invalid-number');
  const raw=own(day,'hourly_kwh')?day.hourly_kwh:null;
  const values=[];
  if(!object(raw))error('day_sample.hourly_kwh','invalid-object');
  else{
    if(!own(raw,'_source')||!text(raw._source))error('day_sample.hourly_kwh._source','invalid-text');
    for(const [hour,value]of Object.entries(raw)){
      if(hour.startsWith('_'))continue; // Metadata is not an hour or an energy value.
      if(!/^(?:[01]\d|2[0-3])$/.test(hour)){error(`day_sample.hourly_kwh.${hour}`,'invalid-hour');continue;}
      if(!energy(value)){error(`day_sample.hourly_kwh.${hour}`,'invalid-number');continue;}
      values.push({hour:Number(hour),valueKwh:value});
    }
    if(!values.length)error('day_sample.hourly_kwh','missing-hours');
  }
  const sum=values.reduce((total,reading)=>total+reading.valueKwh,0);
  if(!Number.isFinite(sum)||sum>Number.MAX_SAFE_INTEGER)error('day_sample.hourly_kwh','invalid-sum');
  if(errors.length)return {ok:false,errors};
  values.sort((a,b)=>a.hour-b.hour);
  const byHour=new Map(values.map(reading=>[reading.hour,reading.valueKwh]));
  const hours=[],missingHours=[];
  for(let hour=values[0].hour;hour<=values.at(-1).hour;hour++){
    const valueKwh=byHour.has(hour)?byHour.get(hour):null;
    hours.push({hour:String(hour).padStart(2,'0'),valueKwh});
    if(valueKwh===null)missingHours.push(String(hour).padStart(2,'0'));
  }
  return {ok:true,data:{
    siteName:site.name.trim(),location:site.location.trim(),monitoring:site.monitoring.trim(),
    dateISO:day.date,dateLabel:`${date.day} ${MONTHS[date.month-1]} ${String(date.year).padStart(4,'0')}`,
    dailyKwh:day.pv_production_kwh,hourlySource:raw._source.trim(),hours,
    // Kept for provenance/testing. The chart does not substitute this approximate
    // sum for the independently supplied daily total, or display it as that total.
    hourlySumKwh:Number(sum.toFixed(8)),recordedHourCount:values.length,missingHours,
  }};
}
function unavailable(){
  return `<div class="recorded-generation__unavailable" role="note">
  <h2 id="recorded-title">Recorded generation is unavailable.</h2>
  <p>This dated record could not be loaded or validated. Application details remain available.</p>
  <a href="/apply.html">Start your application <span aria-hidden="true">→</span></a>
</div>`;
}
function chart(data){
  // Percentages resize the plot horizontally; SVG text keeps its actual 14px size.
  // The containing stylesheet preserves this fixed height, including on phones.
  const height=260,left=12,right=2,top=26,bottom=36,plotWidth=100-left-right,plotHeight=height-top-bottom;
  const maximum=Math.max(...data.hours.map(reading=>reading.valueKwh??0));
  const rough=(maximum===0?1:Math.max(maximum,.01))/3,power=10**Math.floor(Math.log10(rough)),fraction=rough/power;
  const step=(fraction<=1?1:fraction<=2?2:fraction<=5?5:10)*power;
  const ceiling=Math.ceil((maximum===0?1:Math.max(maximum,.01))/step)*step;
  const round=n=>Number(n.toFixed(4));
  const ticks=[];
  for(let i=0;i<=Math.round(ceiling/step);i++){
    const value=i*step,y=round(top+plotHeight-value/ceiling*plotHeight);
    ticks.push(`<g class="recorded-generation__grid"><line x1="${left}%" y1="${y}" x2="${100-right}%" y2="${y}" stroke="currentColor" opacity=".18"/><text class="recorded-generation__tick" x="${left-2}%" y="${y+5}" text-anchor="end" fill="currentColor" font-size="14">${escape(axisNumber.format(value))}</text></g>`);
  }
  const slot=plotWidth/data.hours.length,barWidth=slot*.7;
  const bars=data.hours.map(({hour,valueKwh},index)=>{
    const x=round(left+index*slot+(slot-barWidth)/2),centre=round(left+(index+.5)*slot),base=top+plotHeight;
    const label=Number(hour)%3===0||data.hours.length<3?`<text class="recorded-generation__tick" x="${centre}%" y="${height-12}" text-anchor="middle" fill="currentColor" font-size="14">${hour}:00</text>`:'';
    if(valueKwh===null)return `<g class="recorded-generation__missing" data-hour="${hour}"><title>${hour}:00: not recorded</title><rect x="${x}%" y="${top}" width="${round(barWidth)}%" height="${plotHeight}" fill="none" stroke="currentColor" stroke-dasharray="3 5" opacity=".24"/>${label}</g>`;
    const barHeight=round(valueKwh/ceiling*plotHeight),y=round(base-barHeight);
    const zero=valueKwh===0?`<circle cx="${centre}%" cy="${base}" r="2.5"/>`:'';
    return `<g class="recorded-generation__bar" fill="currentColor" data-hour="${hour}" data-kwh="${valueKwh}"><title>${hour}:00: approximately ${escape(formatEnergy(valueKwh))} kWh</title><rect x="${x}%" y="${y}" width="${round(barWidth)}%" height="${barHeight}" rx="2"/>${zero}${label}</g>`;
  }).join('\n');
  return `<svg class="recorded-generation__chart" xmlns="http://www.w3.org/2000/svg" width="100%" height="${height}" role="img" aria-labelledby="recorded-chart-title recorded-chart-description" focusable="false">
  <title id="recorded-chart-title">Approximate hourly generation on ${escape(data.dateLabel)}</title>
  <desc id="recorded-chart-description">${data.recordedHourCount} recorded hourly estimates from ${data.hours[0].hour}:00 to ${data.hours.at(-1).hour}:00. Values are listed in the hourly readings table below.${data.missingHours.length?' Dashed columns mark hours not recorded in the source.':''}</desc>
  <text class="recorded-generation__tick" x="${left}%" y="16" fill="currentColor" font-size="14">kWh</text>
  ${ticks.join('\n')}
  ${bars}
</svg>`;
}

/** Returns static semantic HTML. All data text is escaped; no source string can
 * become markup, a URL, a style or executable code. Invalid data is never shown as zero. */
export function renderRecordedGeneration(input){
  const result=validateRecordedGeneration(input);if(!result.ok)return unavailable();
  const data=result.data;
  const rows=data.hours.map(({hour,valueKwh})=>`<tr><th scope="row">${hour}:00</th><td>${valueKwh===null?'Not recorded':escape(formatEnergy(valueKwh))}</td></tr>`).join('\n');
  return `<div class="recorded-generation__intro">
  <h2 id="recorded-title">Recorded generation example</h2>
  <p>A supplied historical record, separate from the illustrative site in the journey.</p>
</div>
<dl class="recorded-generation__meta">
  <div><dt>Site</dt><dd>${escape(data.siteName)}</dd></div>
  <div><dt>Location</dt><dd>${escape(data.location)}</dd></div>
  <div><dt>Recorded date</dt><dd><time datetime="${data.dateISO}">${escape(data.dateLabel)}</time></dd></div>
  <div><dt>Source</dt><dd>Supplied transcription from ${escape(data.monitoring)}</dd></div>
</dl>
<p class="recorded-generation__total"><strong>${escape(formatEnergy(data.dailyKwh,true))}</strong> <span>kWh recorded that day</span></p>
<p class="recorded-generation__note">Daily total transcribed from the Tigo portal. Not independently verified. This is a historical record, not a live feed or a forecast. No Aesir installation or customer endorsement is claimed. The 879-module campus is a separate illustration.</p>
<figure class="recorded-generation__figure">
  ${chart(data)}
  <figcaption>Approximate hourly readings transcribed from the portal, in kWh per hour interval. The daily total is supplied separately from these approximate chart readings.</figcaption>
</figure>
<p class="recorded-generation__note">Supplied hourly source note: ${escape(data.hourlySource)}.${data.missingHours.length?' Hours not recorded in the supplied data are shown as gaps, not zero.':''}</p>
<details class="recorded-generation__readings">
  <summary>Approximate hourly readings</summary>
  <table class="recorded-generation__table">
    <caption>Approximate hourly generation at ${escape(data.siteName)} on ${escape(data.dateLabel)} (kWh per hour interval)</caption>
    <thead><tr><th scope="col">Hour shown</th><th scope="col">Approximate energy (kWh per hour interval)</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</details>`;
}

/** The same HTML hook runs in Vite development and production builds. Preview and
 * assembled delivery serve its already rendered HTML; no browser data request is added. */
export function recordedGenerationPlugin({dataURL=defaultDataURL}={}){
  return {name:'recorded-generation-static-html',transformIndexHtml:{order:'pre',async handler(html,context){
    if(!context.filename||path.resolve(context.filename)!==experienceFile||!html.includes(TOKEN))return html;
    let input=null;try{input=JSON.parse(await readFile(dataURL,'utf8'));}catch{/* Missing or malformed source keeps the static application route usable. */}
    return html.replace(TOKEN,renderRecordedGeneration(input));
  }}};
}
