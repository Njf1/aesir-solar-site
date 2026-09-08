import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sampleJourney, clamp } from './progress';

gsap.registerPlugin(ScrollTrigger);
const journey = document.querySelector<HTMLElement>('#journey')!;
const stage = document.querySelector<HTMLElement>('#stage')!;
const host = document.querySelector<HTMLElement>('#canvas-host')!;
const pauseButton = document.querySelector<HTMLButtonElement>('#pause-motion')!;
const status = document.querySelector<HTMLElement>('#fallback-status')!;
const bar = document.querySelector<HTMLElement>('#progress-bar')!;
const title = document.querySelector<HTMLElement>('#chapter-title')!;
const label = document.querySelector<HTMLElement>('#chapter-label')!;
const description = document.querySelector<HTMLElement>('#chapter-description')!;
const caption = document.querySelector<HTMLElement>('#scene-caption')!;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let scene: import('./scene').SolarScene | undefined;
let trigger: ScrollTrigger | undefined;
let observer: IntersectionObserver | undefined;
let resizeObserver: ResizeObserver | undefined;
let paused = false, onscreen = true, failed = false, disposed = false;
let progress = 0, renderedChapter = -1, frame = 0, lastTime = 0, ready = false;
const timings:number[]=[];
let lastMeasure=0;
const chapters=[
  ['01 — THE SOURCE','ENERGY<br>BEGINS HERE.','An extraordinary journey.<br>A connection worth getting right.','SOL','OUR NEAREST STAR'],
  ['02 — A CLOSER LOOK','A star.<br>A source of<br>possibility.','Every solar installation begins<br>with energy from here.','THE PHOTOSPHERE','LIGHT, RELEASED INTO SPACE'],
  ['03 — THE DEPARTURE','One pulse.<br>A new direction.','Follow the energy.<br>Then take the next step on Earth.','THE JOURNEY CONTINUES','FROM LIGHT TO CONNECTION'],
];
function updateCopy(p:number){
  const ch=sampleJourney(p,innerWidth<760).chapter;
  if(ch!==renderedChapter){stage.dataset.chapter=String(ch);const c=chapters[ch];label.textContent=c[0];title.innerHTML=c[1];description.innerHTML=c[2];caption.children[0].textContent=c[3];caption.children[1].textContent=c[4];renderedChapter=ch;}
  bar.style.transform=`scaleX(${p})`;
}
function stop(){cancelAnimationFrame(frame);frame=0;lastTime=0;lastMeasure=0;}
function canAnimate(){return ready&&!disposed&&!failed&&!paused&&!reduced.matches&&!document.hidden&&onscreen;}
function tick(now:number){
  frame=0;if(!canAnimate())return;
  const dt=lastTime ? (now-lastTime)/1000 : 0;lastTime=now;
  scene?.render(dt);
  if(lastMeasure&&timings.length<600)timings.push(now-lastMeasure);lastMeasure=now;
  frame=requestAnimationFrame(tick);
}
function resume(){if(canAnimate()&&!frame)frame=requestAnimationFrame(tick);}
function fallback(message:string){
  if(disposed||failed)return;failed=true;ready=false;stop();trigger?.kill();observer?.disconnect();resizeObserver?.disconnect();scene?.dispose();scene=undefined;
  stage.classList.remove('is-ready');journey.classList.remove('is-enhanced');journey.classList.add('is-static');pauseButton.hidden=true;status.textContent=message;
  updateCopy(0);
}
function onProgress(value:number){
  if(failed||disposed)return;
  progress=clamp(value);
  if(paused||reduced.matches)return;
  scene?.setProgress(progress);updateCopy(progress);
  // Ambient loop owns active rendering. Scroll has no independent tween or camera timeline.
  resume();
}
function configureMotion(){
  if(failed||disposed)return;
  trigger?.kill();stop();
  if(reduced.matches){
    journey.classList.remove('is-enhanced');journey.classList.add('is-static');scene?.setProgress(.67);updateCopy(.67);scene?.render(0);pauseButton.hidden=true;
    status.textContent='Reduced motion: a still view of the Sun. Application details are below.';
  }else{
    journey.classList.add('is-enhanced');journey.classList.remove('is-static');pauseButton.hidden=false;status.textContent='';
    trigger=ScrollTrigger.create({trigger:journey,start:'top top',end:'bottom bottom',onUpdate:self=>onProgress(self.progress),onRefresh:self=>onProgress(self.progress)});
    progress=trigger.progress;scene?.setProgress(progress);updateCopy(progress);scene?.render(0);resume();
  }
}
function togglePause(){paused=!paused;pauseButton.setAttribute('aria-pressed',String(paused));pauseButton.innerHTML=paused?'Resume motion <span aria-hidden="true">▷</span>':'Pause motion <span aria-hidden="true">Ⅱ</span>';
  if(paused){stop();status.textContent='Motion paused. Scroll to the application details, or resume the journey.';}else{status.textContent='';scene?.setProgress(progress);updateCopy(progress);resume();}
}
function visibility(){if(document.hidden)stop();else resume();}
function destroy(){if(disposed)return;disposed=true;stop();trigger?.kill();observer?.disconnect();resizeObserver?.disconnect();scene?.dispose();reduced.removeEventListener('change',configureMotion);document.removeEventListener('visibilitychange',visibility);pauseButton.removeEventListener('click',togglePause);window.removeEventListener('pagehide',onPageHide);window.removeEventListener('pageshow',onPageShow);}
function onPageHide(e:PageTransitionEvent){if(e.persisted)stop();else destroy();}
function onPageShow(e:PageTransitionEvent){if(e.persisted){ScrollTrigger.refresh();resume();}}
async function init(){
  const timeout=window.setTimeout(()=>fallback('A still moment from the journey. Application details are ready below.'),12000);
  try{
    const {SolarScene}=await import('./scene');if(failed||disposed)return;
    scene=new SolarScene(host,fallback);await scene.prepare();if(failed||disposed){scene.dispose();return;}
    const atDetails=location.hash==='#application-details';
    ready=true;configureMotion();stage.classList.add('is-ready');
    if(atDetails)document.querySelector('#application-details')?.scrollIntoView();
    observer=new IntersectionObserver(entries=>{onscreen=entries[0].isIntersecting;document.body.classList.toggle('at-details',!onscreen);if(!onscreen)stop();else resume();},{threshold:.01,rootMargin:'-110px 0px 0px 0px'});observer.observe(stage);
    resizeObserver=new ResizeObserver(()=>{if(!scene||failed)return;scene.resize();if(paused||reduced.matches)scene.render(0);});resizeObserver.observe(host);
    pauseButton.addEventListener('click',togglePause);document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',configureMotion);window.addEventListener('pagehide',onPageHide);window.addEventListener('pageshow',onPageShow);
  }catch(error){console.error('Solar scene could not start:',error);fallback('A still moment from the journey. Application details are ready below.');}finally{clearTimeout(timeout);}
}
// Read-only instrumentation is opt-in for local QA; it cannot set progress or invoke business handlers.
if(new URLSearchParams(location.search).has('inspect')){
  Object.defineProperty(window,'__experience',{value:{snapshot:()=>({ready,failed,paused,onscreen,reduced:reduced.matches,...scene?.snapshot(),frameIntervals:[...timings]}),resetTiming:()=>{timings.length=0;lastMeasure=0;}}});
}
void init();
