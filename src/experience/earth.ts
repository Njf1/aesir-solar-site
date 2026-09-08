import * as THREE from 'three';
import { EARTH_POSITION } from './progress';
import { surfaceVertex, earthFragment, atmosphereFragment, cloudFragment } from './shaders';
import dayDesktop from './assets/earth-day-4096.webp?url';
import dayMobile from './assets/earth-day-2048.webp?url';
import cloudsDesktop from './assets/earth-clouds-2048.webp?url';
import cloudsMobile from './assets/earth-clouds-1024.webp?url';

export class EarthScene {
  readonly group = new THREE.Group();
  private textures: THREE.Texture[] = [];
  private materials: THREE.ShaderMaterial[] = [];
  private geometries: THREE.BufferGeometry[] = [];
  private clouds?: THREE.Mesh;
  private disposed = false;
  private controller = new AbortController();
  private timeout = 0;
  private decodedBytes = 0;
  readonly variant: 'mobile' | 'desktop';
  private sunDirection = new THREE.Vector3(...EARTH_POSITION).negate().normalize();
  constructor(mobile: boolean) { this.variant = mobile ? 'mobile' : 'desktop'; }
  async prepare() {
    this.timeout = window.setTimeout(() => this.controller.abort(), 7000);
    try {
      // Only this variant and this next chapter are fetched. No later scene preload.
      const [day, cloud] = await Promise.all([
        this.texture(this.variant === 'mobile' ? dayMobile : dayDesktop, true),
        this.texture(this.variant === 'mobile' ? cloudsMobile : cloudsDesktop, false),
      ]);
      if (this.disposed) throw new Error('earth-disposed');
      const geometry = new THREE.SphereGeometry(10, this.variant === 'mobile' ? 80 : 128, 64);
      this.geometries.push(geometry);
      const uniforms = { uDay: {value: day}, uClouds: {value: cloud}, uLight: {value: this.sunDirection}, uTime: {value: 0}, uOpacity: {value: 1} };
      const surface = new THREE.ShaderMaterial({vertexShader:surfaceVertex,fragmentShader:earthFragment,uniforms,transparent:true});
      this.materials.push(surface);
      const land = new THREE.Mesh(geometry,surface);
      const cloudMaterial = new THREE.ShaderMaterial({vertexShader:surfaceVertex,fragmentShader:cloudFragment,uniforms:{...uniforms},transparent:true,depthWrite:false});
      this.materials.push(cloudMaterial);
      this.clouds = new THREE.Mesh(geometry,cloudMaterial);this.clouds.scale.setScalar(1.007);
      const atmosphere = new THREE.ShaderMaterial({vertexShader:surfaceVertex,fragmentShader:atmosphereFragment,uniforms:{uLight:{value:this.sunDirection},uOpacity:uniforms.uOpacity},transparent:true,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false});
      this.materials.push(atmosphere);
      const air = new THREE.Mesh(geometry,atmosphere);air.scale.setScalar(1.024);
      this.group.add(land,this.clouds,air);
      // Greenwich faces -Z; north remains up. Europe lies usefully above the disk centre.
      land.rotation.y = Math.PI / 2;this.clouds.rotation.y = Math.PI / 2;
      return this;
    } catch(error) { this.dispose();throw error; }
    finally {clearTimeout(this.timeout);}
  }
  private async texture(url: string, color: boolean) {
    const response = await fetch(url,{signal:this.controller.signal});
    if(!response.ok)throw new Error(`Earth texture ${response.status}`);
    const bitmap = await createImageBitmap(await response.blob(),{imageOrientation:'flipY',premultiplyAlpha:'none'});
    if(this.disposed){bitmap.close();throw new Error('earth-disposed');}
    const texture=new THREE.Texture(bitmap);texture.needsUpdate=true;texture.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;
    texture.anisotropy=4;texture.wrapS=THREE.RepeatWrapping;
    this.decodedBytes += bitmap.width*bitmap.height*4;
    this.textures.push(texture);return texture;
  }
  async warmup(renderer: THREE.WebGLRenderer, camera: THREE.Camera, scene: THREE.Scene) {
    // Upload and compile during the Sun chapter, before the distant planet enters the frame.
    for(const texture of this.textures)renderer.initTexture(texture);
    await renderer.compileAsync(this.group,camera,scene);
  }
  render(time:number, opacity:number) {
    // Very slow independent cloud advection, frozen by the owner's ambient clock.
    for(const material of this.materials){if(material.uniforms.uTime)material.uniforms.uTime.value=time;material.uniforms.uOpacity.value=opacity;}
  }
  snapshot(){return {variant:this.variant,decodedImageBytes:this.decodedBytes,textureBytesWithMipmaps:Math.round(this.decodedBytes*4/3)};}
  dispose() {
    if(this.disposed)return;this.disposed=true;clearTimeout(this.timeout);this.controller.abort();
    for(const texture of this.textures){(texture.image as ImageBitmap)?.close?.();texture.dispose();}
    for(const material of this.materials)material.dispose();for(const geometry of this.geometries)geometry.dispose();this.group.clear();this.group.removeFromParent();
  }
}
