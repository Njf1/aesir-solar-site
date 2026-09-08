import * as THREE from 'three';

/** Original illustrative countryside, not an aerial survey or a customer site.
 * Replaces the existing 12x12 lattice, at the SAME canvas size and map footprint.
 * All work happens once in SiteScene.prepare(); no render-loop update or asset.
 */
export type Point=[number,number];
export type Parcel={points:Point[];tone:number;grain:number;angle:number;wooded:boolean};
const area=(p:Point[])=>Math.abs(p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a[0]*b[1]-b[0]*a[1];},0))*.5;
function halfPlane(points:Point[],nx:number,ny:number,offset:number,sign:number){
  const result:Point[]=[];
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length],da=(a[0]*nx+a[1]*ny-offset)*sign,db=(b[0]*nx+b[1]*ny-offset)*sign;
    if(da>=-1e-8)result.push(a);
    if((da<0)!==(db<0)){const t=da/(da-db);result.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}
  }return result;
}
export function countrysideParcels(){
  let seed=731;
  const rand=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
  const parcels:Parcel[]=[];
  function split(points:Point[],depth:number,orientation:number){
    const a=area(points);
    if(depth>=8||(depth>=4&&a<6500+rand()*14000)){
      parcels.push({points,tone:rand(),grain:rand(),angle:orientation,wooded:rand()<.095});return;
    }
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
    const wide=Math.max(...xs)-Math.min(...xs)>Math.max(...ys)-Math.min(...ys);
    // A shared broad alignment gives farms coherent geometry, while angled cuts
    // and different subdivision depths remove the repeated equal-sized grid.
    const angle=(wide?0:Math.PI/2)+orientation+(rand()-.5)*.21;
    const nx=Math.cos(angle),ny=Math.sin(angle),projection=points.map(p=>p[0]*nx+p[1]*ny);
    const min=Math.min(...projection),max=Math.max(...projection),offset=min+(max-min)*(.40+rand()*.20);
    const left=halfPlane(points,nx,ny,offset,1),right=halfPlane(points,nx,ny,offset,-1);
    if(left.length<3||right.length<3||Math.min(area(left),area(right))<1200){
      parcels.push({points,tone:rand(),grain:rand(),angle:orientation,wooded:false});return;
    }
    split(left,depth+1,orientation+(rand()-.5)*.08);
    split(right,depth+1,orientation+(rand()-.5)*.08);
  }
  split([[0,0],[1024,0],[1024,1024],[0,1024]],0,-.085);
  return parcels;
}

function trace(ctx:CanvasRenderingContext2D,points:Point[]){
  ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
}
const rgba=(r:number,g:number,b:number,a:number)=>`rgba(${r},${g},${b},${a})`;
export function paintCountryside(ctx:CanvasRenderingContext2D){
  ctx.fillStyle='#687456';ctx.fillRect(0,0,1024,1024);
  const parcels=countrysideParcels();
  const palette=['#737b63','#78816a','#818571','#7c8068','#6e7b60','#778368'];
  for(const parcel of parcels){
    trace(ctx,parcel.points);
    ctx.fillStyle=parcel.wooded?'#5e7057':palette[Math.floor(parcel.tone*palette.length)];ctx.fill();
    // A quiet boundary shadow and narrow hedge, with reduced contrast compared
    // with a dark outline around every field. Mipmaps remove unresolved edges.
    ctx.strokeStyle=rgba(65,84,55,.15);ctx.lineWidth=3.1;ctx.stroke();
    ctx.strokeStyle=rgba(62,83,50,.27);ctx.lineWidth=.8;ctx.stroke();
    ctx.save();ctx.clip();
    const xs=parcel.points.map(p=>p[0]),ys=parcel.points.map(p=>p[1]);
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    const wash=ctx.createLinearGradient(minX,minY,maxX,maxY);
    wash.addColorStop(0,rgba(230,226,178,.07));wash.addColorStop(1,rgba(41,61,46,.085));
    ctx.fillStyle=wash;ctx.fillRect(minX,minY,maxX-minX,maxY-minY);
    // Broad cultivation direction is faint and absent from many parcels. No
    // high-contrast dashed lines that become a second aliased grid at distance.
    if(!parcel.wooded&&parcel.grain>.55){
      ctx.translate((minX+maxX)/2,(minY+maxY)/2);ctx.rotate(parcel.angle+.16);
      ctx.strokeStyle=rgba(213,217,167,.035);ctx.lineWidth=2;
      const radius=Math.hypot(maxX-minX,maxY-minY);
      for(let y=-radius;y<=radius;y+=8+parcel.grain*4){ctx.beginPath();ctx.moveTo(-radius,y);ctx.lineTo(radius,y);ctx.stroke();}
    }
    ctx.restore();
  }
  // Broad soil/vegetation variation crosses property boundaries, preventing each
  // parcel from reading as one uniformly coloured tile. These are not new maps.
  const washes=[
    [160,220,260,45,66,44,.11],[710,170,340,231,214,158,.09],
    [790,730,300,47,71,45,.10],[260,790,310,215,213,164,.075],
  ];
  for(const [x,y,r,red,green,blue,alpha] of washes){
    const gradient=ctx.createRadialGradient(x,y,0,x,y,r);
    gradient.addColorStop(0,rgba(red,green,blue,alpha));gradient.addColorStop(1,rgba(red,green,blue,0));
    ctx.fillStyle=gradient;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  // The authoritative campus footprint, access-road extensions and service yard
  // remain actual geometry. Keep this same quiet central apron as the old map.
  const blend=ctx.createRadialGradient(512,512,65,512,512,145);
  blend.addColorStop(0,'#687456');blend.addColorStop(1,'#68745600');
  ctx.fillStyle=blend;ctx.fillRect(0,0,1024,1024);
  return {parcels:parcels.length,area:parcels.reduce((n,p)=>n+area(p.points),0)};
}
export function createCountrysideTexture(mobile:boolean){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=mobile?512:1024;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('countryside-canvas');
  if(mobile)ctx.scale(.5,.5);paintCountryside(ctx);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=mobile?2:4;return texture;
}
