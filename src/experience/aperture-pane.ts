import * as THREE from 'three';

/** Original connected pane with a rectangular section aperture. 32 triangles,
 * 2240 GPU-buffer bytes; 1 draw/material. Replaces four adjoining transparent
 * boxes, removing their hidden internal faces. No new maps/targets or lights.
 * The outer boundary and thickness stay fixed; the aperture grows around (0,0).
 * Existing glass and encapsulant can each own one instance of this geometry.
 */
export class AperturePaneGeometry extends THREE.BufferGeometry {
  private corners = new Float32Array(16 * 3);
  private cornerMap = new Uint8Array(64);
  private positionData = new Float32Array(64 * 3);
  private pos: THREE.BufferAttribute;
  private left: number; private right: number; private north: number; private south: number;
  constructor(cx: number, cz: number, width: number, depth: number, y: number, thickness: number) {
    super();
    if (![cx,cz,width,depth,y,thickness].every(Number.isFinite) || width<=0 || depth<=0 || thickness<=0) throw new Error('Invalid pane bounds');
    this.left=cx-width/2; this.right=cx+width/2; this.north=cz-depth/2; this.south=cz+depth/2;
    if (!(this.left<0&&this.right>0&&this.north<0&&this.south>0)) throw new Error('Aperture origin must lie inside pane');
    const normals=new Float32Array(64*3),uvs=new Float32Array(64*2),indices=new Uint16Array(96);
    let quad=0;
    const add=(a:number,b:number,c:number,d:number,nx:number,ny:number,nz:number)=>{
      const base=quad*4;this.cornerMap.set([a,b,c,d],base);
      for(let v=0;v<4;v++){normals.set([nx,ny,nz],(base+v)*3);uvs.set([v===1||v===2?1:0,v>=2?1:0],(base+v)*2);}
      indices.set([base,base+1,base+2,base,base+2,base+3],quad*6);quad++;
    };
    const outerNormals=[[0,0,-1],[1,0,0],[0,0,1],[-1,0,0]];
    for(let i=0;i<4;i++){
      const j=(i+1)%4;
      add(i,i+4,j+4,j,0,1,0);             // top ring
      add(i+8,j+8,j+12,i+12,0,-1,0);     // bottom ring
      const[nx,ny,nz]=outerNormals[i];
      add(i,j,j+8,i+8,nx,ny,nz);          // outer perimeter only
      add(i+4,i+12,j+12,j+4,-nx,-ny,-nz); // actual exposed aperture wall
    }
    const xs=[this.left,this.right,this.right,this.left],zs=[this.north,this.north,this.south,this.south];
    for(let i=0;i<16;i++){
      this.corners[i*3+1]=y+(i<8?1:-1)*thickness/2;
      if(i%8<4){this.corners[i*3]=xs[i%4];this.corners[i*3+2]=zs[i%4];}
    }
    this.pos=new THREE.BufferAttribute(this.positionData,3).setUsage(THREE.DynamicDrawUsage);
    this.setAttribute('position',this.pos);this.setAttribute('normal',new THREE.BufferAttribute(normals,3));
    this.setAttribute('uv',new THREE.BufferAttribute(uvs,2));this.setIndex(new THREE.BufferAttribute(indices,1));
    this.boundingBox=new THREE.Box3(new THREE.Vector3(this.left,y-thickness/2,this.north),new THREE.Vector3(this.right,y+thickness/2,this.south));
    this.boundingSphere=this.boundingBox.getBoundingSphere(new THREE.Sphere());
    this.setAperture(0,0);
  }
  setAperture(width:number,depth:number) {
    if(!Number.isFinite(width)||!Number.isFinite(depth))throw new Error('Non-finite aperture');
    const hw=THREE.MathUtils.clamp(width/2,0,Math.min(-this.left,this.right));
    const hd=THREE.MathUtils.clamp(depth/2,0,Math.min(-this.north,this.south));
    // No per-frame objects or GPU reallocation. At zero the inner wall collapses
    // and the top/bottom rings become a single closed, non-overlapping pane.
    for(let i=0;i<4;i++)for(let floor=0;floor<2;floor++){
      const c=i+4+floor*8;
      this.corners[c*3]=(i===1||i===2)?hw:-hw;
      this.corners[c*3+2]=i<2?-hd:hd;
    }
    for(let i=0;i<64;i++){
      const c=this.cornerMap[i]*3;
      this.positionData[i*3]=this.corners[c];this.positionData[i*3+1]=this.corners[c+1];this.positionData[i*3+2]=this.corners[c+2];
    }
    this.pos.needsUpdate=true;
  }
}
