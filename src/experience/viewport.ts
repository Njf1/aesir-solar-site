import type {PerspectiveCamera} from 'three';

/** One CSS-resolved small viewport shared by copy framing and the camera.
 * It changes on real window resizing/rotation, not mobile toolbar retraction.
 */
export function createViewportReference(parent:HTMLElement){
  const element=document.createElement('span');
  element.dataset.viewportReference='';element.setAttribute('aria-hidden','true');
  element.style.cssText='position:absolute;top:0;left:0;width:0;height:calc(100 * var(--scroll-unit));visibility:hidden;pointer-events:none;contain:strict';
  parent.append(element);
  return {element,height:()=>element.clientHeight||parent.clientHeight,dispose:()=>element.remove()};
}

export function anchorViewport(camera:PerspectiveCamera,width:number,height:number,referenceHeight:number){
  // Extend the existing view downwards as browser bars retract. A conventional
  // centred aspect update rescales and shifts every projected object instead.
  // Full drawing-buffer coverage is retained; nothing stretches or slides.
  camera.setViewOffset(width,Math.max(1,referenceHeight),0,0,width,height);
}
