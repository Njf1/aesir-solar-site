import * as THREE from 'three';
import { sampleJourney } from './progress';
import { selectQuality } from './quality';
import { surfaceVertex, surfaceFragment, glowVertex, coronaFragment, pulseFragment } from './shaders';

export class SolarScene {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(43, 1, .1, 4500);
  private solar = new THREE.Group();
  private photosphere: THREE.Mesh;
  private corona: THREE.Mesh;
  private pulse: THREE.Mesh;
  private sourceGlint: THREE.Mesh;
  private pulseCore: THREE.Mesh;
  private trail: THREE.Mesh;
  private materials: THREE.Material[] = [];
  private geometries: THREE.BufferGeometry[] = [];
  private ambientTime = 0;
  private progress = 0;
  private width = 0;
  private height = 0;
  private shaderOK = true;
  private disposed = false;
  private quality;
  constructor(private host: HTMLElement, private onFailure: (reason: string) => void) {
    this.quality = selectQuality(host.clientWidth, host.clientHeight, devicePixelRatio, navigator.hardwareConcurrency);
    this.renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x050608, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.debug.onShaderError = (gl, program, vertex, fragment) => { this.shaderOK = false; console.error("Solar shader:", gl.getProgramInfoLog(program), gl.getShaderInfoLog(vertex), gl.getShaderInfoLog(fragment)); };
    this.renderer.domElement.addEventListener('webglcontextlost', this.contextLost);
    const sphere = this.geometry(new THREE.SphereGeometry(10, this.quality.segments, Math.round(this.quality.segments*.65)));
    const photosphere = this.material(new THREE.ShaderMaterial({
      vertexShader: surfaceVertex, fragmentShader: surfaceFragment,
      defines: { DETAIL: this.quality.detail }, uniforms: { uTime: { value: 0 } },
    }));
    this.photosphere=new THREE.Mesh(sphere, photosphere);
    this.solar.add(this.photosphere);
    const glowMaterial = this.material(new THREE.ShaderMaterial({
      vertexShader: glowVertex, fragmentShader: coronaFragment,
      defines: { DETAIL: this.quality.detail }, uniforms: { uTime: { value: 0 } },
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    this.corona = new THREE.Mesh(this.geometry(new THREE.PlaneGeometry(36,36)),glowMaterial);
    this.solar.add(this.corona);
    this.scene.add(this.solar);
    this.makeFlares();
    const pulseMat = this.material(new THREE.ShaderMaterial({ vertexShader:glowVertex,fragmentShader:pulseFragment,
      uniforms:{uOpacity:{value:0}},transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false }));
    this.sourceGlint=new THREE.Mesh(this.geometry(new THREE.PlaneGeometry(1,1)),this.material(pulseMat.clone()));
    this.scene.add(this.sourceGlint);
    this.pulse=new THREE.Mesh(this.geometry(new THREE.PlaneGeometry(10,10)),pulseMat);
    this.pulseCore = new THREE.Mesh(this.geometry(new THREE.SphereGeometry(.032,12,8)),this.material(new THREE.MeshBasicMaterial({color:0xfff4d6,toneMapped:false})));
    this.scene.add(this.pulse,this.pulseCore);
    const curve=new THREE.CubicBezierCurve3(new THREE.Vector3(9.4,2.8,2),new THREE.Vector3(16,3.5,9),new THREE.Vector3(26,4.6,21),new THREE.Vector3(37,5.5,32));
    this.trail = new THREE.Mesh(this.geometry(new THREE.TubeGeometry(curve,100,.055,5,false)),this.material(new THREE.ShaderMaterial({
      vertexShader:glowVertex,
      fragmentShader:'uniform float uHead; uniform float uOpacity; varying vec2 vUv; void main(){float a=smoothstep(uHead-.18,uHead,vUv.x)*uOpacity;gl_FragColor=vec4(vec3(1.,.73,.34)*a,a);}',
      uniforms:{uHead:{value:0},uOpacity:{value:0}},transparent:true,blending:THREE.AdditiveBlending,depthWrite:false
    })));
    this.scene.add(this.trail);
    this.makeStars();
    this.resize();
  }
  private geometry<T extends THREE.BufferGeometry>(g:T):T {this.geometries.push(g);return g;}
  private material<T extends THREE.Material>(m:T):T {this.materials.push(m);return m;}
  private makeFlares() {
    // Fixed, bounded prominence loops attached to the spherical limb, never orbiting particles.
    for(let k=0;k<9;k++){
      const angle=k*2.399+0.25;
      const radial=new THREE.Vector3(Math.cos(angle),Math.sin(angle),.03).normalize();
      const tangent=new THREE.Vector3(-Math.sin(angle),Math.cos(angle),0);
      const pts:THREE.Vector3[]=[];
      const size=.3+(k%3)*.2;
      for(let i=0;i<=40;i++){
        const t=i/40;const p=radial.clone().multiplyScalar(9.95+Math.sin(t*Math.PI)*size);
        p.addScaledVector(tangent,(t-.5)*size*1.7);p.z+=Math.sin(t*Math.PI)*.15;pts.push(p);
      }
      const curve=new THREE.CatmullRomCurve3(pts);
      this.solar.add(new THREE.Mesh(this.geometry(new THREE.TubeGeometry(curve,40,.014,4,false)),this.material(new THREE.MeshBasicMaterial({color:0xffb057,transparent:true,opacity:.48,blending:THREE.AdditiveBlending,toneMapped:false}))));
    }
  }
  private makeStars(){
    let seed=67;const rand=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
    const positions:number[]=[];
    for(let i=0;i<240;i++)positions.push((rand()-.5)*2400,(rand()-.5)*1400,-400-rand()*1100);
    const g=this.geometry(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    const mat=this.material(new THREE.PointsMaterial({color:0x88888e,size:1.2,transparent:true,opacity:.43,sizeAttenuation:false,depthWrite:false}));
    this.scene.add(new THREE.Points(g,mat));
  }
  async prepare(){
    await this.renderer.compileAsync(this.scene,this.camera);
    if(this.disposed)return;
    this.render(0);
    if(!this.shaderOK)throw new Error('shader-compilation');
    this.host.appendChild(this.renderer.domElement);
  }
  setProgress(value:number){this.progress=value;}
  resize(){
    this.width=this.host.clientWidth;this.height=this.host.clientHeight;
    const next=selectQuality(this.width,this.height,devicePixelRatio,navigator.hardwareConcurrency);
    if(next.tier!==this.quality.tier){
      for(const material of this.materials)if(material instanceof THREE.ShaderMaterial && material.defines.DETAIL){material.defines.DETAIL=next.detail;material.needsUpdate=true;}
      const old=this.photosphere.geometry;this.geometries=this.geometries.filter(g=>g!==old);old.dispose();
      this.photosphere.geometry=this.geometry(new THREE.SphereGeometry(10,next.segments,Math.round(next.segments*.65)));
    }
    this.quality=next;
    this.renderer.setPixelRatio(this.quality.pixelRatio);this.renderer.setSize(this.width,this.height,false);
    this.camera.aspect=this.width/Math.max(1,this.height);this.camera.updateProjectionMatrix();
  }
  render(delta:number){
    if(this.disposed)return;
    this.ambientTime+=Math.min(delta,.05);
    const shot=sampleJourney(this.progress,this.width<760);
    this.camera.position.set(...shot.camera);this.camera.lookAt(...shot.target);
    this.corona.quaternion.copy(this.camera.quaternion);
    this.sourceGlint.quaternion.copy(this.camera.quaternion);
    this.sourceGlint.position.set(0,0,11);
    this.sourceGlint.scale.setScalar(shot.camera[2]*.16);
    (this.sourceGlint.material as THREE.ShaderMaterial).uniforms.uOpacity.value=(1-THREE.MathUtils.smoothstep(this.progress,.22,.44))*4.;
    for(const m of this.materials)if(m instanceof THREE.ShaderMaterial && m.uniforms.uTime)m.uniforms.uTime.value=this.ambientTime;
    this.pulse.position.set(...shot.pulse);this.pulse.quaternion.copy(this.camera.quaternion);this.pulseCore.position.copy(this.pulse.position);
    const opacity=THREE.MathUtils.smoothstep(this.progress,.78,.83);
    (this.pulse.material as THREE.ShaderMaterial).uniforms.uOpacity.value=opacity;
    this.pulseCore.visible=opacity>0;
    // The final 18% is the visible light trail; draw range is reversible, with no allocation per frame.
    this.trail.geometry.setDrawRange(Math.max(0,Math.floor((shot.departure-.18)*100))*30,Math.min(18,Math.floor(shot.departure*100))*30);
    (this.trail.material as THREE.ShaderMaterial).uniforms.uOpacity.value=opacity*.75;
    (this.trail.material as THREE.ShaderMaterial).uniforms.uHead.value=shot.departure;
    this.renderer.render(this.scene,this.camera);
  }
  snapshot(){return {progress:this.progress,ambientTime:this.ambientTime,quality:this.quality,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures};}
  private contextLost=(event:Event)=>{event.preventDefault();this.onFailure('The live scene is unavailable. The application details are ready below.');};
  dispose(){if(this.disposed)return;this.disposed=true;this.renderer.domElement.removeEventListener('webglcontextlost',this.contextLost);for(const m of this.materials)m.dispose();for(const g of this.geometries)g.dispose();this.scene.clear();this.renderer.renderLists.dispose();this.renderer.dispose();this.renderer.domElement.remove();}
}
