/** Smooth only the bottom controls' response to mobile browser-bar resizing.
 * The stage/canvas still resize immediately. No scene clock or animation loop
 * is involved: one compositor transform ends automatically after each resize.
 */
export function followViewportFooter(stage:HTMLElement,footer:HTMLElement,allowsMotion:()=>boolean){
  const measure=()=>{
    const width=stage.clientWidth,height=stage.clientHeight,size=footer.offsetHeight;
    return {width,height,top:height-size-parseFloat(getComputedStyle(footer).getPropertyValue('--footer-inset')),size};
  };
  let previous=measure(),animation:Animation|undefined,disposed=false;
  // A top-anchored transform does not jump when the parent changes height,
  // even on browsers delivering their resize notification a frame later.
  footer.style.top='0';footer.style.bottom='auto';
  footer.style.transform=`translateY(${previous.top}px)`;
  function settle(){animation?.cancel();animation=undefined;}
  function update(){
    if(disposed)return;
    const next=measure(),old=previous;
    if(next.width===old.width&&next.height===old.height&&next.top===old.top&&next.size===old.size)return;
    const from=new DOMMatrixReadOnly(getComputedStyle(footer).transform).m42;
    previous=next;settle();footer.style.transform=`translateY(${next.top}px)`;
    const toolbarResize=next.width===old.width&&next.size===old.size&&next.height!==old.height;
    if(!toolbarResize||!allowsMotion()||!footer.animate)return;
    // A browser may also report a smaller viewport all at once. Never ease a
    // control from behind its returning toolbar; keep an 8px clearance, then
    // settle back to the authored inset. Rotation/reflow deliberately snap fit.
    const start=Math.max(0,Math.min(from,next.height-next.size-8));
    if(Math.abs(start-next.top)<.5)return;
    animation=footer.animate([{transform:`translateY(${start}px)`},{transform:`translateY(${next.top}px)`}],{
      // Take time to accelerate as well as settle. The previous short ease-out
      // front-loaded most of the distance and still felt like a snap on a phone.
      duration:1800,easing:'cubic-bezier(.42,0,.58,1)',fill:'both',
    });
    const current=animation;current.onfinish=()=>{if(animation===current)settle();};
  }
  const observer=new ResizeObserver(update);observer.observe(stage);observer.observe(footer);
  // Window resize runs before animation-frame callbacks; ResizeObserver also
  // catches late dynamic-unit changes and control/text reflow before paint.
  window.addEventListener('resize',update);
  return {settle,dispose(){if(disposed)return;disposed=true;observer.disconnect();window.removeEventListener('resize',update);settle();footer.style.removeProperty('top');footer.style.removeProperty('bottom');footer.style.removeProperty('transform');}};
}
