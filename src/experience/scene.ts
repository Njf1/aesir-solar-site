import * as THREE from 'three';
import { sampleJourney, framingFor, EARTH_POSITION } from './progress';
import { pointOnLightPath, tangentOnLightPath, TRAIL_LENGTH, FLIGHT_LENGTH } from './path';
import { selectQuality } from './quality';
import { surfaceVertex, surfaceFragment, glowVertex, coronaFragment, pulseFragment, prominenceVertex, prominenceFragment, trailVertex, trailFragment } from './shaders';
import { EarthScene } from './earth';

const TRAIL_RINGS = 80, TRAIL_SIDES = 6;
export class SolarScene {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(43, 1, .1, 2600);
  private solar = new THREE.Group();
  private photosphere: THREE.Mesh;
  private corona: THREE.Mesh;
  private pulse: THREE.Mesh;
  private sourceGlint: THREE.Mesh;
  private pulseCore: THREE.Mesh;
  private trail: THREE.Mesh;
  private stars: THREE.Points;
  private earth?: EarthScene;
  private earthDeadline = 0;
  private earthStatus: 'idle' | 'loading' | 'ready' | 'failed' = 'idle';
  private materials: THREE.Material[] = [];
  private geometries: THREE.BufferGeometry[] = [];
  private ambientTime = 0;
  private progress = 0;
  private width = 0;
  private height = 0;
  private shaderOK = true;
  private disposed = false;
  private quality;
  private lastFlight = -1;
  private pathCentre = new THREE.Vector3();
  private pathTangent = new THREE.Vector3();
  private pathRight = new THREE.Vector3();
  private pathNormal = new THREE.Vector3();
  private up = new THREE.Vector3(0, 1, 0);
  private projectionHead = new THREE.Vector3();
  private projectionNext = new THREE.Vector3();
  private lastShot = sampleJourney(0);
  private trailHeadError = 0;

  constructor(private host: HTMLElement, private onFailure: (reason: string) => void, private onAssetReady: () => void = () => {}) {
    this.quality = selectQuality(host.clientWidth, host.clientHeight, devicePixelRatio, navigator.hardwareConcurrency);
    this.renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x050608, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;
    this.renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
      this.shaderOK = false;
      console.error('Experience shader:', gl.getProgramInfoLog(program), gl.getShaderInfoLog(vertex), gl.getShaderInfoLog(fragment));
    };
    this.renderer.domElement.addEventListener('webglcontextlost', this.contextLost);
    const sphere = this.geometry(new THREE.SphereGeometry(10, this.quality.segments, Math.round(this.quality.segments*.65)));
    const photosphere = this.material(new THREE.ShaderMaterial({
      vertexShader: surfaceVertex, fragmentShader: surfaceFragment,
      defines: { DETAIL: this.quality.detail }, uniforms: { uTime: { value: 0 } },
    }));
    this.photosphere = new THREE.Mesh(sphere, photosphere);this.solar.add(this.photosphere);
    const glowMaterial = this.material(new THREE.ShaderMaterial({
      vertexShader: glowVertex, fragmentShader: coronaFragment,
      defines: { DETAIL: this.quality.detail }, uniforms: { uTime: { value: 0 } },
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    this.corona = new THREE.Mesh(this.geometry(new THREE.PlaneGeometry(40,40)),glowMaterial);
    this.solar.add(this.corona);this.scene.add(this.solar);this.makeProminences();
    const pulseMat = this.material(new THREE.ShaderMaterial({ vertexShader:glowVertex,fragmentShader:pulseFragment,
      uniforms:{uOpacity:{value:0}},transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false }));
    this.sourceGlint = new THREE.Mesh(this.geometry(new THREE.PlaneGeometry(1,1)),this.material(pulseMat.clone()));
    this.scene.add(this.sourceGlint);
    this.pulse = new THREE.Mesh(this.geometry(new THREE.PlaneGeometry(1,1)),pulseMat);
    this.pulseCore = new THREE.Mesh(this.geometry(new THREE.SphereGeometry(.032,12,8)),this.material(new THREE.MeshBasicMaterial({color:0xfff8e8,toneMapped:false})));
    this.scene.add(this.pulse,this.pulseCore);
    const trailGeometry = this.makeTrail();
    this.trail = new THREE.Mesh(trailGeometry,this.material(new THREE.ShaderMaterial({vertexShader:trailVertex,fragmentShader:trailFragment,
      uniforms:{uOpacity:{value:0}},transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})));
    this.trail.frustumCulled = false;this.scene.add(this.trail);
    this.stars = this.makeStars();this.scene.add(this.stars);this.resize();
  }
  private geometry<T extends THREE.BufferGeometry>(g:T):T {this.geometries.push(g);return g;}
  private material<T extends THREE.Material>(m:T):T {this.materials.push(m);return m;}

  private makeProminences() {
    // A dominant rooted arcade at the acquired limb, two quiet secondary structures.
    const structures = [
      {angle:2.70,height:2.15,span:1.95,strands:9},
      {angle:2.43,height:.57,span:.62,strands:4},
      {angle:-.68,height:.35,span:.45,strands:3},
    ];
    for(const [cluster, config] of structures.entries()) {
      const radial = new THREE.Vector3(Math.cos(config.angle),Math.sin(config.angle),.045).normalize();
      const along = new THREE.Vector3(-Math.sin(config.angle),Math.cos(config.angle),0);
      for(let k=0;k<config.strands;k++) {
        const pts:THREE.Vector3[]=[];
        const spread=(k/(config.strands-1)-.5), height=config.height*(.72+.3*Math.pow(Math.sin(k*1.7+.3),2));
        for(let i=0;i<=52;i++) {
          const t=i/52, arch=Math.pow(Math.sin(t*Math.PI),.72)*(.87+.18*t);
          const p=radial.clone().multiplyScalar(9.98+arch*height);
          p.addScaledVector(along,(t-.5)*config.span*(.75+.25*Math.pow(Math.sin(k*2.4),2))+arch*(spread*.55+Math.sin(t*5+k)*.09));
          p.z += Math.sin(t*Math.PI)*(.18+spread*.6);
          p.normalize().multiplyScalar(9.98+arch*height);pts.push(p);
        }
        const curve=new THREE.CatmullRomCurve3(pts);
        const material=this.material(new THREE.ShaderMaterial({vertexShader:prominenceVertex,fragmentShader:prominenceFragment,
          uniforms:{uTime:{value:0},uSeed:{value:k*.7+cluster},uOpacity:{value:(cluster===0?.38:.25)+(1-Math.abs(spread))*.2}},
          transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
        this.solar.add(new THREE.Mesh(this.geometry(new THREE.TubeGeometry(curve,52,cluster===0?.035:.014,5,false)),material));
        if(cluster===0&&k===4){
          const body=this.material(material.clone());body.uniforms.uOpacity.value=.12;
          this.solar.add(new THREE.Mesh(this.geometry(new THREE.TubeGeometry(curve,52,.22,7,false)),body));
        }
      }
    }
  }
  private makeStars() {
    let seed=67;const rand=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
    const positions:number[]=[];
    for(let i=0;i<150;i++) {
      const z=rand()*2-1, angle=rand()*Math.PI*2, r=Math.sqrt(1-z*z);
      positions.push(r*Math.cos(angle)*1800,z*1800,r*Math.sin(angle)*1800);
    }
    const g=this.geometry(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    return new THREE.Points(g,this.material(new THREE.PointsMaterial({color:0x77818c,size:1,transparent:true,opacity:.3,sizeAttenuation:false,depthWrite:false})));
  }
  private makeTrail() {
    const geometry=this.geometry(new THREE.BufferGeometry());
    const positions=new Float32Array((TRAIL_RINGS+1)*(TRAIL_SIDES+1)*3);
    const uv=new Float32Array((TRAIL_RINGS+1)*(TRAIL_SIDES+1)*2);
    const along=new Float32Array((TRAIL_RINGS+1)*(TRAIL_SIDES+1));const indices:number[]=[];
    for(let i=0;i<=TRAIL_RINGS;i++)for(let j=0;j<=TRAIL_SIDES;j++){
      const index=i*(TRAIL_SIDES+1)+j;uv[index*2]=i/TRAIL_RINGS;uv[index*2+1]=j/TRAIL_SIDES;along[index]=i/TRAIL_RINGS;
      if(i<TRAIL_RINGS&&j<TRAIL_SIDES){const a=index,b=index+TRAIL_SIDES+1;indices.push(a,b,a+1,b,b+1,a+1);}
    }
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));geometry.setAttribute('aAlong',new THREE.BufferAttribute(along,1));geometry.setIndex(indices);return geometry;
  }
  private updateTrail(head: number) {
    if(head===this.lastFlight)return;this.lastFlight=head;
    const attribute=this.trail.geometry.getAttribute('position') as THREE.BufferAttribute;
    for(let i=0;i<=TRAIL_RINGS;i++) {
      const along=i/TRAIL_RINGS;
      const u=Math.max(0,head-along*TRAIL_LENGTH/FLIGHT_LENGTH);
      pointOnLightPath(u,this.pathCentre);tangentOnLightPath(u,this.pathTangent);
      this.pathRight.crossVectors(this.pathTangent,this.up).normalize();this.pathNormal.crossVectors(this.pathRight,this.pathTangent).normalize();
      // The leading ring has zero radius at precisely the guide point: no geometry can protrude.
      const radius=.025*Math.sin(Math.PI*Math.sqrt(along))*Math.pow(1-along,1.2);
      for(let j=0;j<=TRAIL_SIDES;j++) {
        const angle=j/TRAIL_SIDES*Math.PI*2,c=Math.cos(angle)*radius,s=Math.sin(angle)*radius;
        attribute.setXYZ(i*(TRAIL_SIDES+1)+j,this.pathCentre.x+this.pathRight.x*c+this.pathNormal.x*s,this.pathCentre.y+this.pathRight.y*c+this.pathNormal.y*s,this.pathCentre.z+this.pathRight.z*c+this.pathNormal.z*s);
      }
    }
    attribute.needsUpdate=true;
    pointOnLightPath(head,this.pathCentre);
    this.trailHeadError=Math.hypot(attribute.getX(0)-this.pathCentre.x,attribute.getY(0)-this.pathCentre.y,attribute.getZ(0)-this.pathCentre.z);
  }
  async prepare() {
    await this.renderer.compileAsync(this.scene,this.camera);
    if(this.disposed)return;this.render(0);
    if(!this.shaderOK)throw new Error('shader-compilation');
    this.host.appendChild(this.renderer.domElement);
  }
  prefetchEarth() {
    if(this.earthStatus!=='idle'||this.disposed)return;
    this.earthStatus='loading';
    const earth=new EarthScene(this.quality.tier==='mobile');this.earth=earth;
    const prepare=earth.prepare().then(async()=>{
      if(this.disposed)return;
      await earth.warmup(this.renderer,this.camera,this.scene);
    });
    const deadline=new Promise<void>((_,reject)=>{this.earthDeadline=window.setTimeout(()=>reject(new Error('earth-timeout')),8000);});
    void Promise.race([prepare,deadline]).then(()=>{
      if(this.disposed){earth.dispose();return;}
      this.scene.add(earth.group);this.earthStatus='ready';this.onAssetReady();
    }).catch(()=>{if(!this.disposed){this.earthStatus='failed';this.onFailure('Earth could not load. Application details are ready below.');}})
      .finally(()=>clearTimeout(this.earthDeadline));
  }
  setProgress(value:number){this.progress=value;if(value>.16)this.prefetchEarth();}
  resize() {
    this.width=this.host.clientWidth;this.height=this.host.clientHeight;
    const next=selectQuality(this.width,this.height,devicePixelRatio,navigator.hardwareConcurrency);
    if(next.tier!==this.quality.tier) {
      for(const material of this.materials)if(material instanceof THREE.ShaderMaterial && material.defines.DETAIL){material.defines.DETAIL=next.detail;material.needsUpdate=true;}
      const old=this.photosphere.geometry;this.geometries=this.geometries.filter(g=>g!==old);old.dispose();
      this.photosphere.geometry=this.geometry(new THREE.SphereGeometry(10,next.segments,Math.round(next.segments*.65)));
    }
    this.quality=next;this.renderer.setPixelRatio(next.pixelRatio);this.renderer.setSize(this.width,this.height,false);
    this.camera.aspect=this.width/Math.max(1,this.height);this.camera.updateProjectionMatrix();
  }
  render(delta:number) {
    if(this.disposed)return;
    this.ambientTime+=Math.min(delta,.05);
    const p=this.earthStatus==='loading'?Math.min(this.progress,.635):this.progress;
    const shot=sampleJourney(p,framingFor(this.width,this.height));this.lastShot=shot;
    const offset=shot.scene==='earth'?EARTH_POSITION:[0,0,0];
    this.solar.position.set(-offset[0],-offset[1],-offset[2]);
    this.camera.position.set(...shot.camera);this.camera.up.copy(this.up);this.camera.lookAt(...shot.target);this.camera.updateMatrixWorld();
    this.corona.quaternion.copy(this.camera.quaternion);
    this.sourceGlint.quaternion.copy(this.camera.quaternion);this.sourceGlint.position.set(-offset[0],-offset[1],11-offset[2]);
    this.sourceGlint.scale.setScalar(Math.max(1,shot.camera[2])*.16);
    (this.sourceGlint.material as THREE.ShaderMaterial).uniforms.uOpacity.value=shot.sourceGlint*4;
    this.sourceGlint.visible=shot.sourceGlint>.001;
    for(const material of this.materials)if(material instanceof THREE.ShaderMaterial&&material.uniforms.uTime)material.uniforms.uTime.value=this.ambientTime;
    this.pulse.position.set(...shot.pulse);this.pulseCore.position.copy(this.pulse.position);
    this.pulse.quaternion.copy(this.camera.quaternion);
    this.projectionHead.copy(this.pulse.position).project(this.camera);
    this.projectionNext.copy(this.pulse.position).add(this.pathTangent.set(...shot.tangent)).project(this.camera);
    this.pulse.rotateZ(Math.atan2((this.projectionNext.y-this.projectionHead.y)*this.height,(this.projectionNext.x-this.projectionHead.x)*this.width));
    this.pulse.scale.setScalar(Math.max(.8,this.camera.position.distanceTo(this.pulse.position)*.16));
    (this.pulse.material as THREE.ShaderMaterial).uniforms.uOpacity.value=shot.pulseOpacity*2.2;
    this.pulse.visible=shot.pulseOpacity>.001;this.pulseCore.visible=this.pulse.visible;
    this.updateTrail(shot.flight);this.trail.position.set(-offset[0],-offset[1],-offset[2]);
    this.trail.visible=this.pulse.visible;(this.trail.material as THREE.ShaderMaterial).uniforms.uOpacity.value=shot.pulseOpacity*.7;
    // Fixed celestial directions, not nearby star particles moving past the viewer.
    this.stars.position.copy(this.camera.position);
    if(this.earth&&this.earthStatus==='ready') {
      this.earth.group.position.set(EARTH_POSITION[0]-offset[0],0,EARTH_POSITION[2]-offset[2]);
      this.earth.group.visible=shot.earthVisibility>.001;
      this.earth.render(this.ambientTime,shot.earthVisibility);
    }
    this.renderer.render(this.scene,this.camera);
    if(!this.shaderOK)this.onFailure('The live scene is unavailable. Application details are ready below.');
  }
  displayedProgress(){return this.earthStatus==='loading'?Math.min(this.progress,.635):this.progress;}
  snapshot() {
    return {progress:this.progress,ambientTime:this.ambientTime,quality:this.quality,shot:this.lastShot,
      trailHeadError:this.trailHeadError,earthStatus:this.earthStatus,earth:this.earth?.snapshot(),
      drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,
      geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures};
  }
  private contextLost=(event:Event)=>{event.preventDefault();this.onFailure('The live scene is unavailable. Application details are ready below.');};
  dispose() {
    if(this.disposed)return;this.disposed=true;this.renderer.domElement.removeEventListener('webglcontextlost',this.contextLost);
    clearTimeout(this.earthDeadline);this.earth?.dispose();for(const m of this.materials)m.dispose();for(const g of this.geometries)g.dispose();
    this.scene.clear();this.renderer.renderLists.dispose();this.renderer.dispose();this.renderer.domElement.remove();
  }
}
