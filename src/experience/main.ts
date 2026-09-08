import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { framingFor, smooth } from './progress';
import {journeyCopy} from './journey';
import {CHAPTERS,JOURNEY_END,SCROLL_VIEWPORTS_PER_UNIT,STILL_VIEWS,CELL_SWITCH,CELL_EXIT,chapterAt} from './timeline';
gsap.registerPlugin(ScrollTrigger);
const journey=document.querySelector<HTMLElement>('#journey')!;
const stage=document.querySelector<HTMLElement>('#stage')!;
const host=document.querySelector<HTMLElement>('#canvas-host')!;
const pauseButton=document.querySelector<HTMLButtonElement>('#pause-motion')!;
const stillViews=document.querySelector<HTMLElement>('#still-views')!;
const status=document.querySelector<HTMLElement>('#fallback-status')!;
const bar=document.querySelector<HTMLElement>('#progress-bar')!;
const panels=Array.from(document.querySelectorAll<HTMLElement>('[data-copy]'));
const note=document.querySelector<HTMLElement>('.journey-note')!;
const processNote=document.querySelector<HTMLElement>('#process-note')!;
const scrollLabel=document.querySelector<HTMLElement>('#scroll-label')!;
journey.style.setProperty('--journey-height',`${(1+SCROLL_VIEWPORTS_PER_UNIT*JOURNEY_END)*100}svh`);
journey.dataset.duration=String(JOURNEY_END);
const chapterLabel=document.querySelector<HTMLElement>('#chapter-label')!;
document.querySelector('#chapter-count')!.textContent=String(CHAPTERS.length);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let scene:import('./scene').SolarScene|undefined;
let trigger:ScrollTrigger|undefined,observer:IntersectionObserver|undefined,resizeObserver:ResizeObserver|undefined;
let paused=false,onscreen=true,failed=false,disposed=false,ready=false;
let progress=0,frame=0,lastTime=0,lastMeasure=0;
let stillProgress=.285;
const timings:number[]=[];
function updateCopy(p:number) {
  const opacity=journeyCopy(p,reduced.matches);
  for(let i=0;i<panels.length;i++) {
    panels[i].style.opacity=String(opacity[i]);panels[i].style.visibility=opacity[i]>.005?'visible':'hidden';
    panels[i].style.transform=`translateY(${(1-opacity[i])*10}px)`;
    panels[i].setAttribute('aria-hidden',String(opacity[i]<.15));panels[i].inert=opacity[i]<.15;
  }
  stage.style.setProperty('--read-shade',String(Math.max(...opacity.slice(5))));stage.style.setProperty('--visible-copy',String(Math.max(...opacity)));
  bar.style.transform=`scaleX(${p/JOURNEY_END})`;
  note.style.opacity=String(smooth((p-.83)/.05)*(1-smooth((p-1.05)/.08)));
  stage.dataset.chapter=CHAPTERS[chapterAt(p)].id;
  document.body.dataset.scene=p>=CELL_SWITCH&&p<CELL_EXIT?'cell':p>=1.55?'site':p>=1.30?'region':'space';
  const processOpacity=smooth((p-2.43)/.04)*(1-smooth((p-2.94)/.06));processNote.style.opacity=String(processOpacity);processNote.style.visibility=processOpacity>.005?'visible':'hidden';processNote.setAttribute('aria-hidden',String(processOpacity<.15));
  chapterLabel.textContent=CHAPTERS[chapterAt(p)].label;
  if(!reduced.matches)scrollLabel.textContent=p>=5.67?'SCROLL TO APPLICATION DETAILS':p>=2.71?'SCROLL TO FOLLOW THE ENERGY':'SCROLL TO FOLLOW THE LIGHT';
}
function frameLayout() {
  const width=stage.clientWidth,mode=framingFor(width,stage.clientHeight);
  document.body.dataset.framing=mode;
  const expected=mode==='portrait'?Math.max(34,Math.min(54,width*.08)):mode==='short'?Math.max(28,Math.min(48,width*.044)):Math.max(40,Math.min(84,width*.053));
  const font=parseFloat(getComputedStyle(panels[0].querySelector('h1')!).fontSize);
  document.body.dataset.largeType=String(font>expected*1.4);
}
frameLayout();
function stop(){cancelAnimationFrame(frame);frame=0;lastTime=0;lastMeasure=0;}
function canAnimate(){return ready&&!disposed&&!failed&&!paused&&!reduced.matches&&!document.hidden&&onscreen;}
function tick(now:number) {
  frame=0;if(!canAnimate())return;
  const dt=lastTime?(now-lastTime)/1000:0;lastTime=now;scene?.render(dt);
  if(lastMeasure&&timings.length<900)timings.push(now-lastMeasure);lastMeasure=now;
  frame=requestAnimationFrame(tick);
}
function resume(){if(canAnimate()&&!frame)frame=requestAnimationFrame(tick);}
function fallback(message:string) {
  if(disposed||failed)return;failed=true;ready=false;stop();trigger?.kill();observer?.disconnect();resizeObserver?.disconnect();scene?.dispose();scene=undefined;
  stage.classList.remove('is-ready');journey.classList.remove('is-enhanced');journey.classList.add('is-static');pauseButton.hidden=true;stillViews.hidden=true;status.textContent=message;
  updateCopy(0);document.body.classList.remove('at-details');
  if(location.hash==='#application-details'||progress>.16)document.querySelector('#application-details')?.scrollIntoView();
}
function onProgress(value:number) {
  if(failed||disposed)return;progress=Math.max(0,Math.min(JOURNEY_END,value));
  if(paused||reduced.matches)return;
  scene?.setProgress(progress);updateCopy(scene?.displayedProgress()??progress);resume();
}
function configureMotion() {
  if(failed||disposed)return;trigger?.kill();stop();
  if(reduced.matches) {
    journey.classList.remove('is-enhanced');journey.classList.add('is-static');scene?.setProgress(stillProgress);updateCopy(scene?.displayedProgress()??stillProgress);scene?.render(0);
    pauseButton.hidden=true;stillViews.hidden=false;scrollLabel.textContent='EXPLORE THE STILL VIEWS';
    status.textContent='Reduced motion: still views. Application details are below.';
  } else {
    journey.classList.add('is-enhanced');journey.classList.remove('is-static');pauseButton.hidden=false;stillViews.hidden=true;status.textContent='';scrollLabel.textContent='SCROLL TO FOLLOW THE LIGHT';
    trigger=ScrollTrigger.create({trigger:journey,start:'top top',end:'bottom bottom',onUpdate:self=>onProgress(self.progress*JOURNEY_END),onRefresh:self=>onProgress(self.progress*JOURNEY_END)});
    progress=trigger.progress*JOURNEY_END;scene?.setProgress(progress);updateCopy(scene?.displayedProgress()??progress);scene?.render(0);resume();
  }
}
function togglePause() {
  paused=!paused;pauseButton.setAttribute('aria-pressed',String(paused));pauseButton.innerHTML=paused?'Resume motion <span aria-hidden="true">▷</span>':'Pause motion <span aria-hidden="true">Ⅱ</span>';
  if(paused){stop();status.textContent='Motion paused. Scroll to the application details, or resume the journey.';}
  else{status.textContent='';scene?.setProgress(progress);updateCopy(scene?.displayedProgress()??progress);resume();}
}
function changeStill(event:Event) {
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-still]');if(!button||!reduced.matches||failed)return;
  stillProgress=STILL_VIEWS[button.dataset.still as keyof typeof STILL_VIEWS]??STILL_VIEWS.sun;
  for(const b of stillViews.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b===button));
  scene?.setProgress(stillProgress);updateCopy(scene?.displayedProgress()??stillProgress);scene?.render(0);
}
function visibility(){if(document.hidden)stop();else resume();}
function destroy() {
  if(disposed)return;disposed=true;stop();trigger?.kill();observer?.disconnect();resizeObserver?.disconnect();scene?.dispose();
  reduced.removeEventListener('change',configureMotion);document.removeEventListener('visibilitychange',visibility);pauseButton.removeEventListener('click',togglePause);stillViews.removeEventListener('click',changeStill);window.removeEventListener('pagehide',onPageHide);window.removeEventListener('pageshow',onPageShow);
}
function onPageHide(e:PageTransitionEvent){if(e.persisted)stop();else destroy();}
function onPageShow(e:PageTransitionEvent){if(e.persisted){ScrollTrigger.refresh();resume();}}
async function init() {
  const timeout=window.setTimeout(()=>fallback('A still moment from the journey. Application details are ready below.'),12000);
  try {
    const {SolarScene}=await import('./scene');if(failed||disposed)return;
    scene=new SolarScene(host,fallback,()=>{if(!ready)return;updateCopy(scene?.displayedProgress()??progress);if(paused||reduced.matches)scene?.render(0);});
    await scene.prepare();if(failed||disposed){scene.dispose();return;}
    let anchorId=location.hash.slice(1);
    try{anchorId=decodeURIComponent(anchorId);}catch{/* An unknown or malformed fragment is not a rendering failure. */}
    const anchor=document.getElementById(anchorId);
    const contentAnchor=anchor&&!journey.contains(anchor)?anchor:undefined;ready=true;configureMotion();stage.classList.add('is-ready');
    if(contentAnchor)contentAnchor.scrollIntoView();
    observer=new IntersectionObserver(entries=>{onscreen=entries[0].isIntersecting;document.body.classList.toggle('at-details',!onscreen);if(!onscreen)stop();else resume();},{threshold:.01,rootMargin:'-110px 0px 0px 0px'});observer.observe(stage);
    resizeObserver=new ResizeObserver(()=>{if(!scene||failed)return;frameLayout();scene.resize();if(paused||reduced.matches)scene.render(0);});resizeObserver.observe(host);for(const panel of panels)resizeObserver.observe(panel);
    pauseButton.addEventListener('click',togglePause);stillViews.addEventListener('click',changeStill);document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',configureMotion);window.addEventListener('pagehide',onPageHide);window.addEventListener('pageshow',onPageShow);
  } catch(error) {console.error('Experience could not start:',error);fallback('A still moment from the journey. Application details are ready below.');}
  finally {clearTimeout(timeout);}
}
if(new URLSearchParams(location.search).has('inspect')) {
  Object.defineProperty(window,'__experience',{value:{snapshot:()=>({ready,failed,paused,onscreen,reduced:reduced.matches,framing:document.body.dataset.framing,duration:JOURNEY_END,...scene?.snapshot(),copyOpacities:journeyCopy(scene?.displayedProgress()??progress,reduced.matches),frameIntervals:[...timings]}),resetTiming:()=>{timings.length=0;lastMeasure=0;}}});
}
void init();
