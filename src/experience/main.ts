import {initSuitability} from './suitability';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { framingFor, smooth } from './progress';
import {journeyCopy} from './journey';
import {CHAPTERS,JOURNEY_END,SCROLL_VIEWPORTS_PER_UNIT,STILL_VIEWS,CELL_SWITCH,CELL_EXIT,chapterAt} from './timeline';
gsap.registerPlugin(ScrollTrigger);
const journey=document.querySelector<HTMLElement>('#journey')!;
const stage=document.querySelector<HTMLElement>('#stage')!;
const host=document.querySelector<HTMLElement>('#canvas-host')!;
const applicationDetails=document.querySelector<HTMLElement>('#application-details')!;
const skipLink=document.querySelector<HTMLElement>('.skip-link')!;
const pauseButton=document.querySelector<HTMLButtonElement>('#pause-motion')!;
const stillViews=document.querySelector<HTMLElement>('#still-views')!;
const status=document.querySelector<HTMLElement>('#fallback-status')!;
const bar=document.querySelector<HTMLElement>('#progress-bar')!;
const panels=Array.from(document.querySelectorAll<HTMLElement>('[data-copy]'));
const note=document.querySelector<HTMLElement>('.journey-note')!;
const processNote=document.querySelector<HTMLElement>('#process-note')!;
const scrollLabel=document.querySelector<HTMLElement>('#scroll-label')!;
journey.style.setProperty('--journey-travel',String(SCROLL_VIEWPORTS_PER_UNIT*JOURNEY_END*100));
journey.dataset.duration=String(JOURNEY_END);
const chapterLabel=document.querySelector<HTMLElement>('#chapter-label')!;
document.querySelector('#chapter-count')!.textContent=String(CHAPTERS.length);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let scene:import('./scene').SolarScene|undefined;
let trigger:ScrollTrigger|undefined,observer:IntersectionObserver|undefined,resizeObserver:ResizeObserver|undefined;
let paused=false,onscreen=true,detailsVisible=false,failed=false,disposed=false,ready=false;
let progress=0,frame=0,lastTime=0,lastMeasure=0;
let measuredTravel=0,restoringViewport=false;
let stillProgress=.285;
let configuredReduced:boolean|undefined;
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
  // Reserve the real control height, including browser/user text enlargement.
  // This is layout-only: resizing must not change the authored camera position.
  stage.style.setProperty('--copy-safe-top',`${mode==='portrait'?skipLink.offsetTop+skipLink.offsetHeight+12:0}px`);
}
frameLayout();
function stop(){cancelAnimationFrame(frame);frame=0;lastTime=0;lastMeasure=0;}
function canAnimate(){return ready&&!disposed&&!failed&&!paused&&!reduced.matches&&!document.hidden&&onscreen;}
function tick(now:number) {
  frame=0;
  // A simultaneous viewport change can coalesce a media-query notification.
  // Reconcile the actual preference before the animation loop suspends itself.
  if(ready&&configuredReduced!==reduced.matches){configureMotion();return;}
  if(!canAnimate())return;
  const dt=lastTime?(now-lastTime)/1000:0;lastTime=now;scene?.render(dt);
  if(lastMeasure&&timings.length<900)timings.push(now-lastMeasure);lastMeasure=now;
  frame=requestAnimationFrame(tick);
}
function resume(){if(canAnimate()&&!frame)frame=requestAnimationFrame(tick);}
function fallback(message:string) {
  if(disposed||failed)return;failed=true;ready=false;stop();trigger?.kill();observer?.disconnect();resizeObserver?.disconnect();scene?.dispose();scene=undefined;
  stage.classList.remove('is-ready');stage.classList.add('is-fallback');journey.classList.remove('is-enhanced');journey.classList.add('is-static');pauseButton.hidden=true;stillViews.hidden=true;status.textContent=message;
  updateCopy(0);document.body.classList.remove('at-details');
  if(location.hash==='#application-details'||progress>.16)document.querySelector('#application-details')?.scrollIntoView();
}
function onProgress(value:number) {
  if(restoringViewport)return;
  // ScrollTrigger can refresh before ResizeObserver on a rotation. Do not let
  // that temporary new distance overwrite the position we are about to restore.
  if(ready&&trigger&&!reduced.matches&&Math.abs(journeyTravel()-measuredTravel)>=1)return;
  if(failed||disposed)return;if(ready&&configuredReduced!==reduced.matches){configureMotion();return;}progress=Math.max(0,Math.min(JOURNEY_END,value));
  if(paused||reduced.matches)return;
  scene?.setProgress(progress);updateCopy(scene?.displayedProgress()??progress);resume();
}
function journeyTravel(){return Math.max(1,journey.offsetHeight-stage.offsetHeight);}
function reconcileTravel() {
  if(!trigger||reduced.matches)return;
  const next=journeyTravel();if(Math.abs(next-measuredTravel)<1)return;
  // Browser-bar motion leaves the small viewport/travel unchanged. A genuine
  // resize or rotation remeasures it, preserving the visitor's place in the film.
  const keepPosition=onscreen&&scrollY>=trigger.start-1&&scrollY<=trigger.start+measuredTravel+1;
  const keepDetails=detailsVisible&&document.activeElement===applicationDetails;
  const held=progress;measuredTravel=next;restoringViewport=true;
  try{trigger.refresh();if(keepDetails)applicationDetails.scrollIntoView();else if(keepPosition)window.scrollTo(0,trigger.start+held/JOURNEY_END*next);trigger.update();}
  finally{restoringViewport=false;}
  onProgress(keepPosition?held:trigger.progress*JOURNEY_END);
}
function configureMotion() {
  if(failed||disposed)return;configuredReduced=reduced.matches;trigger?.kill();stop();scene?.setFrozen(false);
  if(reduced.matches) {
    journey.classList.remove('is-enhanced');journey.classList.add('is-static');scene?.setProgress(stillProgress);updateCopy(scene?.displayedProgress()??stillProgress);scene?.render(0);
    pauseButton.hidden=true;stillViews.hidden=false;scrollLabel.textContent='EXPLORE THE STILL VIEWS';
    status.textContent='Reduced motion: still views. Application details are below.';
  } else {
    journey.classList.add('is-enhanced');journey.classList.remove('is-static');pauseButton.hidden=false;stillViews.hidden=true;status.textContent='';scrollLabel.textContent='SCROLL TO FOLLOW THE LIGHT';
    // Measure the sticky travel itself. ScrollTrigger's viewport may use 100vh
    // (the large viewport), which differs from the visible stage under mobile UI.
    measuredTravel=journeyTravel();
    trigger=ScrollTrigger.create({trigger:journey,start:'top top',end:()=>`+=${journeyTravel()}`,onUpdate:self=>onProgress(self.progress*JOURNEY_END),onRefresh:self=>onProgress(self.progress*JOURNEY_END)});
    progress=trigger.progress*JOURNEY_END;scene?.setProgress(progress);updateCopy(scene?.displayedProgress()??progress);scene?.render(0);
    // Still-view navigation temporarily releases the freeze. Returning to the
    // scrolling mode must reinstate it before delayed readiness can change a
    // composition whose control still says Resume.
    scene?.setFrozen(paused);if(paused)status.textContent='Motion paused. Scroll to the application details, or resume the journey.';resume();
  }
}
function togglePause() {
  paused=!paused;pauseButton.setAttribute('aria-pressed',String(paused));pauseButton.innerHTML=paused?'Resume motion <span aria-hidden="true">▷</span>':'Pause motion <span aria-hidden="true">Ⅱ</span>';
  if(paused){scene?.setFrozen(true);stop();status.textContent='Motion paused. Scroll to the application details, or resume the journey.';}
  else{scene?.setFrozen(false);status.textContent='';scene?.setProgress(progress);updateCopy(scene?.displayedProgress()??progress);resume();}
}
function changeStill(event:Event) {
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-still]');if(!button||!reduced.matches||failed)return;
  stillProgress=STILL_VIEWS[button.dataset.still as keyof typeof STILL_VIEWS]??STILL_VIEWS.sun;
  for(const b of stillViews.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b===button));
  scene?.setProgress(stillProgress);updateCopy(scene?.displayedProgress()??stillProgress);scene?.render(0);
}
function visibility(){if(document.hidden)stop();else if(ready&&configuredReduced!==reduced.matches)configureMotion();else resume();}
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
    observer=new IntersectionObserver(entries=>{for(const entry of entries){
      if(entry.target===applicationDetails){detailsVisible=entry.isIntersecting;continue;}
      onscreen=entry.isIntersecting;document.body.classList.toggle('at-details',!onscreen);if(!onscreen)stop();else resume();
    }},{threshold:.01,rootMargin:'-110px 0px 0px 0px'});observer.observe(stage);observer.observe(applicationDetails);
    resizeObserver=new ResizeObserver(()=>{
      if(!scene||failed)return;frameLayout();const resized=scene.resize();reconcileTravel();
      if(configuredReduced!==reduced.matches)configureMotion();
      // Changing a drawing buffer clears it. Repaint before this resize is
      // presented, including while paused; never advance the supplied clock.
      else if(resized&&onscreen&&!document.hidden)scene.render(0);
    });resizeObserver.observe(host);resizeObserver.observe(journey);resizeObserver.observe(skipLink);for(const panel of panels)resizeObserver.observe(panel);
    pauseButton.addEventListener('click',togglePause);stillViews.addEventListener('click',changeStill);document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',configureMotion);window.addEventListener('pagehide',onPageHide);window.addEventListener('pageshow',onPageShow);
  } catch(error) {console.error('Experience could not start:',error);fallback('A still moment from the journey. Application details are ready below.');}
  finally {clearTimeout(timeout);}
}
if(new URLSearchParams(location.search).has('inspect')) {
  Object.defineProperty(window,'__experience',{value:{snapshot:()=>({ready,failed,paused,onscreen,requestedProgress:progress,reduced:reduced.matches,framing:document.body.dataset.framing,duration:JOURNEY_END,...scene?.snapshot(),copyOpacities:journeyCopy(scene?.displayedProgress()??progress,reduced.matches),frameIntervals:[...timings]}),resetTiming:()=>{timings.length=0;lastMeasure=0;}}});
}
initSuitability();
void init();
