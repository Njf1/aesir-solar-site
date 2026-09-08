import type {WebGLRenderer,Object3D,Camera,Scene} from 'three';
/** Three r185 compileAsync owns an uncancellable timer. Poll the same program
 * readiness through an owned AbortSignal, so a chapter deadline/context loss can
 * settle the promise and stop polling before materials or renderer are disposed. */
export function compileReady(renderer:Pick<WebGLRenderer,'compile'|'properties'>,object:Object3D,camera:Camera,scene:Scene,signal:AbortSignal):Promise<void>{
 return new Promise((resolve,reject)=>{
  let timer:ReturnType<typeof setTimeout>|undefined,settled=false;
  const cleanup=()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);};
  const fail=(error:unknown)=>{if(settled)return;settled=true;cleanup();reject(error);};
  const abort=()=>fail(signal.reason??new DOMException('Scene disposed','AbortError'));
  if(signal.aborted){abort();return;}signal.addEventListener('abort',abort,{once:true});
  try{
   const materials=renderer.compile(object,camera,scene);
   const check=()=>{
    if(settled)return;if(signal.aborted){abort();return;}
    try{
     for(const material of materials){
      const program=(renderer.properties.get(material) as {currentProgram?:{isReady():boolean}}).currentProgram;
      if(!program)throw new Error('Shader program unavailable');
      if(program.isReady())materials.delete(material);
     }
     if(materials.size===0){settled=true;cleanup();resolve();}
     else timer=setTimeout(check,10);
    }catch(error){fail(error);}
   };
   timer=setTimeout(check,10);
  }catch(error){fail(error);}
 });
}
