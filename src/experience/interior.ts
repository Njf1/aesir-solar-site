import * as THREE from 'three';

/** Original selective work-bay illustration, authored 8 September 2026.
 * Same warehouse metres as commercial.ts: +Y up, south +Z. No campus/shell copy,
 * downloaded assets, textures, ratings, brands, live readings or wiring claims.
 * Owner supplies daylight/environment, chapter visibility and suspended ambient time.
 */
export type InteriorTier = 'desktop' | 'mobile';
export interface BusinessInteriorState { lighting: number; equipment: number; screen: number; }
export const INTERIOR_ANCHORS = {
  entry: new THREE.Vector3(-36, 3.1, 13.7),
  workBay: new THREE.Vector3(-22, 1.65, 13.5),
  packingBench: new THREE.Vector3(-26.5, 1.45, 7.6),
  conveyor: new THREE.Vector3(-21, 1.35, 13.5),
  desk: new THREE.Vector3(-22.0, 1.45, 19.2),
  screen: new THREE.Vector3(-21.66, 1.83, 19.2),
};
const clamp = (n: number) => Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
const ease = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
type Batch = { geometry: THREE.BufferGeometry; material: THREE.Material; matrices: THREE.Matrix4[]; name: string; mesh?: THREE.InstancedMesh };
type MovingPiece = { batch: Batch; index: number; position: THREE.Vector3; scale: THREE.Vector3; rotation: THREE.Quaternion };

export function createBusinessInterior(tier: InteriorTier) {
  const mobile = tier === 'mobile';
  const group = new THREE.Group(); group.name = 'Original selective business interior';
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  const batches = new Map<string, Batch>(), movingHead: MovingPiece[] = [];
  const ownG = <T extends THREE.BufferGeometry>(g: T): T => { geometries.add(g); return g; };
  const ownM = <T extends THREE.Material>(m: T): T => { materials.add(m); return m; };
  const standard = (color: number, roughness: number, metalness = 0) => ownM(new THREE.MeshStandardMaterial({ color, roughness, metalness }));
  const cube = ownG(new THREE.BoxGeometry(1, 1, 1));
  const cylinder = ownG(new THREE.CylinderGeometry(1, 1, 1, mobile ? 8 : 12));
  const plane = ownG(new THREE.PlaneGeometry(1, 1));
  const identity = new THREE.Quaternion(), acrossZ = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), Math.PI / 2);
  const west = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), -Math.PI / 2);
  const flat = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -Math.PI / 2);
  const tempMatrix = new THREE.Matrix4(), tempPosition = new THREE.Vector3();
  function instance(name: string, geometry: THREE.BufferGeometry, material: THREE.Material, position: THREE.Vector3, scale: THREE.Vector3, rotation = identity, moving = false) {
    const key = `${geometry.uuid}/${material.uuid}`;
    let batch = batches.get(key);
    if (!batch) { batch = { geometry, material, matrices: [], name }; batches.set(key, batch); }
    const index = batch.matrices.length;
    batch.matrices.push(new THREE.Matrix4().compose(position, rotation, scale));
    if (moving) movingHead.push({ batch, index, position, scale, rotation });
  }
  function box(name: string, mat: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number, rotation = identity, moving = false) {
    instance(name, cube, mat, V(x, y, z), V(sx, sy, sz), rotation, moving);
  }
  function rod(name: string, mat: THREE.Material, x: number, y: number, z: number, radius: number, length: number, rotation = identity) {
    instance(name, cylinder, mat, V(x, y, z), V(radius, length, radius), rotation);
  }
  function beam(name: string, mat: THREE.Material, a: THREE.Vector3, b: THREE.Vector3, width: number, depth: number) {
    instance(name, cube, mat, a.clone().add(b).multiplyScalar(.5), V(width, a.distanceTo(b), depth), new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()));
  }
  const floor = standard(0x8b9089, .92), steel = standard(0x41565b, .48, .56);
  const shell = standard(0xc4c9bf, .57, .25), rubber = standard(0x1b292d, .87, .05);
  const silver = standard(0xa6b5b8, .31, .77), timber = standard(0x927052, .91);
  const kraft = standard(0xb39570, .9), ochre = standard(0xc0a265, .64, .18);
  const guard = ownM(new THREE.MeshStandardMaterial({color:0xa1bfc0, roughness:.24, metalness:.05, transparent:true, opacity:.13, depthWrite:false}));
  const practical = ownM(new THREE.MeshStandardMaterial({color:0xc3c5ae, roughness:.34, emissive:0xffe1ac, emissiveIntensity:0}));
  const screenFace = ownM(new THREE.MeshStandardMaterial({color:0x0c2028, roughness:.33, metalness:.05, emissive:0x3b7987, emissiveIntensity:0}));
  const screenInk = ownM(new THREE.MeshStandardMaterial({color:0x183740, roughness:.4, emissive:0x96d0d2, emissiveIntensity:0}));
  const indicator = ownM(new THREE.MeshStandardMaterial({color:0x1e342f, roughness:.35, emissive:0x8cb9a0, emissiveIntensity:0}));

  // Only this work-bay floor is owned here. It shares the surrounding 0.30m datum.
  box('Selective concrete bay floor', floor, -21.5, .27, 12.5, 33, .06, 19);
  // Thin joints and a restrained walking-route edge, not an invented safety certification.
  for (const x of [-33, -25, -17, -9]) box('Concrete movement joints', steel, x, .303, 12.5, .016, .006, 18.8);
  for (const z of [6, 12, 18]) box('Concrete movement joints', steel, -21.5, .303, z, 32.8, .006, .016);
  for (const z of [10.65, 16.25]) box('Clear circulation edges', ochre, -25.0, .309, z, 24, .012, .055);

  // Selective portal structure, with web/flanges and attached bases. The west entry stays open.
  for (const z of [4.2, 21.3]) {
    for (const x of [-35, -6.7]) {
      box('Portal column webs', steel, x, 5.2, z, .15, 9.8, .30);
      for (const dz of [-.19, .19]) box('Portal column flanges', steel, x, 5.2, z + dz, .39, 9.8, .06);
      box('Portal base plates', silver, x, .36, z, .66, .12, .68);
      for (const dx of [-.22, .22]) for (const dz of [-.24, .24]) rod('Column hold-down heads', steel, x + dx, .437, z + dz, .035, .035);
      beam('Portal haunch braces', steel, V(x, 8.95, z), V(x + (x < -20 ? 2.1 : -2.1), 10.0, z), .16, .23);
    }
    box('Portal beam web', steel, -20.85, 10.03, z, 28.6, .30, .11);
    for (const y of [9.84, 10.22]) box('Portal beam flanges', steel, -20.85, y, z, 28.6, .075, .36);
  }
  for (const x of [-30, -20, -10]) box('Longitudinal roof tie', steel, x, 10.38, 12.75, .13, .15, 17.5);

  // A suspended twin practical gives the work machinery a legible pool of light.
  for (const z of [9.0, 15.8]) {
    for (const x of [-28.5, -19.5]) rod('Pendant support rods', steel, x, 7.20, z, .018, 5.9);
    box('Suspended practical housings', steel, -24, 4.24, z, 9.6, .18, .32);
    box('Practical diffuser', practical, -24, 4.135, z, 9.32, .034, .24);
  }

  // Guarded belt conveyor, adjustable feet, rolling support bed and a packaging gantry.
  const lineStart = -29.2, lineEnd = -14.8, lineZ = 13.5;
  box('Conveyor continuous belt', rubber, -22, 1.26, lineZ, 14.4, .12, 1.28);
  for (const z of [12.79, 14.21]) box('Conveyor side channels', silver, -22, 1.22, z, 14.65, .27, .11);
  for (const x of [-28.6, -24.4, -20.2, -15.4]) for (const z of [12.85, 14.15]) {
    box('Conveyor support legs', steel, x, .80, z, .085, .89, .085);
    rod('Conveyor levelling screw', silver, x, .38, z, .028, .15);
    rod('Conveyor adjustable feet', rubber, x, .329, z, .105, .058);
  }
  for (const x of [lineStart, lineEnd]) rod('Conveyor end drum', silver, x, 1.23, lineZ, .13, 1.23, acrossZ);
  for (const x of [-28, -23.8, -19.6, -15.8]) box('Conveyor cross frame', steel, x, .71, lineZ, .085, .10, 1.35);
  for (const x of [-27.4, -23.8, -20.2, -16.6]) {
    for (const z of [12.5, 14.5]) box('Machine guard stanchions', steel, x, 1.65, z, .06, 1.32, .06);
  }
  for (const z of [12.5, 14.5]) {
    box('Machine guard upper rail', ochre, -22, 2.24, z, 11.4, .055, .065);
    box('Machine guard lower rail', steel, -22, 1.08, z, 11.4, .055, .065);
    box('Transparent machine guard', guard, -22, 1.665, z, 11.3, 1.10, .018);
  }
  for (const z of [12.46, 14.54]) box('Packaging gantry columns', shell, -20.2, 2.0, z, .26, 2.5, .30);
  box('Packaging gantry bridge', shell, -20.2, 3.25, lineZ, .62, .27, 2.35);
  box('Gantry upper insert', steel, -20.52, 3.25, lineZ, .035, .15, 1.8);
  box('Packaging head', shell, -20.2, 2.35, lineZ, .88, .24, 1.18, identity, true);
  box('Packaging head lower face', rubber, -20.2, 2.205, lineZ, .80, .045, 1.08, identity, true);
  for (const z of [13.11, 13.89]) box('Head guide slides', silver, -20.2, 2.76, z, .055, .7, .055);
  box('Enclosed conveyor drive', steel, -24.3, .92, 14.36, .72, .44, .40);
  box('Conveyor control pedestal', steel, -24.9, 1.35, 15.18, .07, 1.30, .07);
  box('Conveyor control enclosure', shell, -24.9, 2.05, 15.18, .25, .60, .56);
  box('Machine control recess', rubber, -25.038, 2.10, 15.18, .024, .32, .41);
  box('Machine active indicator', indicator, -25.055, 2.10, 15.18, .015, .065, .19);
  rod('Unlabelled stop control', ochre, -25.06, 1.86, 15.18, .049, .025, new THREE.Quaternion().setFromAxisAngle(V(0,0,1),Math.PI/2));

  function carton(x: number, y: number, z: number, sx: number, sy: number, sz: number) {
    box('Packed cartons', kraft, x, y, z, sx, sy, sz);
    box('Carton top seam', timber, x, y + sy / 2 + .004, z, sx - .012, .009, .018);
    box('Carton sealing tape', shell, x, y + sy / 2 + .010, z, .09, .011, sz - .01);
    box('Blank dispatch label', shell, x - sx / 2 - .006, y + .05, z, .01, sy * .32, sz * .45);
  }
  carton(-26.5, 1.67, lineZ, 1.02, .70, .79);
  carton(-22.9, 1.60, lineZ, .91, .56, .74);
  carton(-20.2, 1.62, lineZ, .88, .60, .76);
  carton(-17.2, 1.70, lineZ, 1.04, .76, .83);

  // Fine belt slats visibly move only when equipment is enabled. Geometry is preallocated.
  const slatCount = 42, slats = new THREE.InstancedMesh(cube, steel, slatCount);
  slats.name = 'Slow moving conveyor tread'; slats.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  slats.castShadow = false; slats.receiveShadow = true; group.add(slats);
  const slatScale = V(.046, .018, 1.25);

  // North packing bench: warm top, lower shelf, open bins, scanner and supply rack.
  box('Packing bench top', timber, -26.1, 1.25, 7.6, 6.4, .12, 1.45);
  box('Packing bench edge', silver, -26.1, 1.17, 7.6, 6.48, .065, 1.51);
  for (const x of [-29.0, -26.1, -23.2]) for (const z of [7.05, 8.15]) box('Packing bench legs', steel, x, .77, z, .08, .92, .08);
  box('Bench lower shelf', steel, -26.1, .57, 7.6, 6.2, .065, 1.2);
  for (const x of [-28.7, -26.4, -24.1]) {
    box('Open supply bin base', ochre, x, 1.345, 7.6, .78, .07, .68);
    for (const z of [7.29, 7.91]) box('Open supply bin lips', ochre, x, 1.46, z, .78, .18, .035);
    for (const dx of [-.37, .37]) box('Open supply bin sides', ochre, x + dx, 1.46, 7.6, .035, .18, .62);
  }
  for (const x of [-29.15, -23.05]) box('Bench upper rack posts', steel, x, 2.16, 6.9, .055, 1.78, .055);
  box('Bench upper shelf', shell, -26.1, 2.79, 7.02, 6.22, .07, .50);
  box('Bench task light housing', steel, -26.1, 2.72, 7.03, 5.1, .08, .20);
  box('Bench task light', practical, -26.1, 2.67, 7.04, 4.97, .023, .16);
  box('Scanner base', rubber, -25.05, 1.37, 8.04, .25, .13, .27);
  beam('Scanner angled neck', steel, V(-25.05,1.40,8.04), V(-25.05,1.72,7.91), .06, .055);
  box('Scanner head', rubber, -25.05, 1.77, 7.87, .27, .13, .20, new THREE.Quaternion().setFromAxisAngle(V(1,0,0),-.32));
  box('Scanner optical face', indicator, -25.05, 1.76, 7.754, .16, .058, .012);
  carton(-27.55, .91, 7.6, .83, .60, .92);
  carton(-24.1, .83, 7.6, .93, .43, .96);

  // East storage is intentionally sparse. Open shelves and slatted pallets break up the mass.
  for (const z of [5.8, 9.7, 13.6, 17.5, 21.1]) for (const x of [-9.8, -7.5]) {
    box('Storage upright', steel, x, 2.78, z, .115, 4.95, .10);
    box('Storage foot', ochre, x, .39, z, .35, .17, .33);
  }
  for (const y of [.78, 2.28, 3.78]) for (const z of [7.75, 11.65, 15.55, 19.3]) {
    box('Storage shelf', shell, -8.65, y, z, 2.28, .075, 3.72);
    for (const x of [-9.82,-7.48]) box('Storage cross beam', ochre, x, y - .08, z, .075, .15, 3.77);
  }
  const cargo = [[-8.65,1.16,7.3],[-8.65,1.19,11.65],[-8.65,2.66,8.3],[-8.65,2.66,15.2],[-8.65,4.15,11.2],[-8.65,1.16,19.2]];
  for (const [x,nominalY,z] of cargo) {
    const y=nominalY+.15; // pallet runners rest above the supporting shelf
    for (let k=0;k<5;k++) box('Pallet top slats', timber, x, y-.31, z-.54+k*.27, 1.8,.065,.22);
    for (const dx of [-.63,.63]) box('Pallet runners', timber, x+dx,y-.41,z,.14,.14,1.33);
    carton(x,y+.09,z,1.42,.69,1.11);
  }

  // Office-side workstation: real desktop, monitor, keyboard, chair and task luminaire.
  box('Office workstation top', timber, -22.0, 1.10, 19.2, 1.65, .09, 2.75);
  for(const z of [18.05,20.35]){
    box('Office desk support', steel,-22,.71,z,.09,.72,.12);
    box('Desk feet', steel,-22,.365,z,1.48,.065,.15);
  }
  box('Workstation pedestal', shell, -21.73,.68,20.1,.87,.70,.43);
  for(const y of [.51,.75])box('Drawer pull',steel,-22.18,y,20.1,.025,.028,.24);
  box('Monitor stand base', silver,-21.70,1.18,19.2,.45,.046,.54);
  box('Monitor upright',steel,-21.56,1.45,19.2,.06,.55,.075);
  box('Monitor cabinet',rubber,-21.58,1.84,19.2,.095,.70,1.15);
  instance('Screen face',plane,screenFace,V(-21.635,1.84,19.2),V(1.065,.607,1),west);
  // Abstract interface only: no numbers, customer data, output or approval telemetry.
  box('Screen upper interface bar',screenInk,-21.647,2.055,19.2,.013,.025,.86);
  for(const y of [1.72,1.79,1.86,1.93]){
    box('Abstract office document rows',screenInk,-21.649,y,19.04,.013,.017,.43);
    box('Abstract office document icons',screenInk,-21.649,y,18.76,.013,.033,.033);
  }
  for(const y of [1.98,1.90,1.82])box('Screen interface lines',screenInk,-21.649,y,19.49,.013,.016,.27);
  box('Keyboard chassis',rubber,-22.35,1.17,19.17,.38,.045,.83);
  for(let r=0;r<3;r++)for(let c=0;c<9;c++)box('Keyboard keys',shell,-22.48+r*.10,1.196,18.82+c*.085,.064,.014,.058);
  box('Mouse pad',rubber,-22.28,1.151,20.00,.38,.012,.30);
  box('Mouse',silver,-22.26,1.183,20.00,.16,.055,.095);
  // Rounded ergonomic upholstery rather than cuboid placeholder furniture.
  function rounded(w:number,h:number,r:number){const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return s;}
  const upholstery = ownG(new THREE.ExtrudeGeometry(rounded(.62,.68,.105),{depth:.09,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:1,steps:1,curveSegments:mobile?2:4}));
  instance('Chair rounded seat',upholstery,rubber,V(-23.25,.83,19.2),V(1,1,1),flat);
  instance('Chair ergonomic back',upholstery,rubber,V(-23.53,1.18,19.2),V(1,1.07,1),west);
  rod('Chair lift stem',silver,-23.25,.61,19.2,.042,.43);
  for(let i=0;i<5;i++){
    const a=i/5*Math.PI*2,dx=Math.cos(a)*.39,dz=Math.sin(a)*.39;
    beam('Chair five-star base',steel,V(-23.25,.45,19.2),V(-23.25+dx,.40,19.2+dz),.045,.045);
    rod('Chair castors',rubber,-23.25+dx,.375,19.2+dz,.062,.07,acrossZ);
  }
  for(const z of [18.82,19.58]){box('Chair arm support',steel,-23.24,1.00,z,.055,.32,.055);box('Chair armrest',rubber,-23.21,1.17,z,.39,.045,.08);}
  rod('Desk task-light base',steel,-21.52,1.18,18.15,.12,.035);
  beam('Desk articulated lamp',steel,V(-21.52,1.19,18.15),V(-21.7,1.72,18.15),.034,.034);
  beam('Desk lamp upper arm',steel,V(-21.7,1.72,18.15),V(-22.1,1.94,18.15),.034,.034);
  box('Desk luminaire hood',steel,-22.08,1.92,18.15,.45,.08,.19);
  box('Desk luminaire diffuser',practical,-22.08,1.87,18.15,.40,.025,.14);

  // A modest pallet truck supplies a recognisable handling detail without extra machinery clutter.
  for(const z of [17.58,18.02])box('Pallet truck tapered forks',ochre,-30.15,.46,z,1.52,.12,.15);
  box('Pallet truck heel',ochre,-30.91,.53,17.8,.20,.25,.70);
  for(const z of [17.57,18.03])rod('Pallet truck fork wheels',rubber,-29.53,.378,z,.076,.12,acrossZ);
  rod('Pallet truck steering wheel',rubber,-31.02,.46,17.8,.145,.17,acrossZ);
  beam('Pallet truck steering handle',steel,V(-31.00,.66,17.8),V(-31.44,1.65,17.8),.04,.045);
  for(const z of [17.61,17.99])beam('Pallet truck handle sides',steel,V(-31.44,1.60,z),V(-31.51,1.80,z),.035,.035);
  box('Pallet truck handle grip',rubber,-31.51,1.80,17.8,.055,.055,.41);

  // Two true surface lights. No shadow maps or extra render targets are allocated.
  const workLight = new THREE.PointLight(0xffdfa7,0,20,2);workLight.name='Work-bay practical light';workLight.position.set(-24,3.82,11.2);workLight.castShadow=false;group.add(workLight);
  const officeLight = new THREE.PointLight(0xffe8bc,0,9,2);officeLight.name='Desk-side practical light';officeLight.position.set(-22.15,2.67,18.3);officeLight.castShadow=false;group.add(officeLight);

  // Local soft contact shading is original analytic artwork, not a texture or shadow map.
  const contactMat=ownM(new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;vec4 p=vec4(position,1.);\n#ifdef USE_INSTANCING\np=instanceMatrix*p;\n#endif\ngl_Position=projectionMatrix*modelViewMatrix*p;}',
    fragmentShader:'varying vec2 vUv;void main(){vec2 q=abs(vUv-.5)*2.;float r=pow(pow(q.x,4.)+pow(q.y,4.),.25);float a=.20*(1.-smoothstep(.44,1.,r));if(a<.003)discard;gl_FragColor=vec4(.045,.059,.058,a);}'
  }));
  for(const [x,z,w,d] of [[-22,13.5,15.5,3.2],[-26.1,7.6,7.2,2.25],[-22,19.2,2.4,3.3],[-23.25,19.2,1.4,1.4],[-8.65,13.5,3.6,16.2],[-30.2,17.8,2.6,1.5]])instance('Restrained contact shading',plane,contactMat,V(x,.316,z),V(w,d,1),flat);

  let instances=slatCount;
  for(const b of batches.values()){
    const mesh=new THREE.InstancedMesh(b.geometry,b.material,b.matrices.length);b.mesh=mesh;mesh.name=b.name+' — material batch';
    b.matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();
    mesh.castShadow=false;mesh.receiveShadow=true;group.add(mesh);instances+=mesh.count;
  }
  let disposed=false;
  const state:BusinessInteriorState={lighting:0,equipment:0,screen:0};
  function render(next:BusinessInteriorState,time:number){
    if(disposed)return;state.lighting=clamp(next.lighting);state.equipment=clamp(next.equipment);state.screen=clamp(next.screen);
    const t=Number.isFinite(time)?time:0,L=ease(state.lighting),E=ease(state.equipment),S=ease(state.screen);
    practical.emissiveIntensity=2.7*L;workLight.intensity=105*L;officeLight.intensity=29*L;
    screenFace.emissiveIntensity=1.05*S;screenInk.emissiveIntensity=2.2*S;screenInk.color.setRGB(.004+.065*S,.009+.09*S,.013+.12*S);indicator.emissiveIntensity=1.7*E;
    const headTravel=(.5+.5*Math.sin(t*1.15))*.14*E;
    for(const part of movingHead){tempPosition.copy(part.position);tempPosition.y-=headTravel;tempMatrix.compose(tempPosition,part.rotation,part.scale);part.batch.mesh!.setMatrixAt(part.index,tempMatrix);part.batch.mesh!.instanceMatrix.needsUpdate=true;}
    const spacing=(lineEnd-lineStart)/slatCount,offset=((t*.34*E)%spacing+spacing)%spacing;
    for(let i=0;i<slatCount;i++){tempPosition.set(lineStart+i*spacing+offset,1.331,lineZ);tempMatrix.compose(tempPosition,identity,slatScale);slats.setMatrixAt(i,tempMatrix);}slats.instanceMatrix.needsUpdate=true;
  }
  render(state,0);slats.computeBoundingBox();slats.boundingBox!.max.x+=(lineEnd-lineStart)/slatCount;slats.computeBoundingSphere();slats.boundingSphere!.radius+=(lineEnd-lineStart)/slatCount;group.updateMatrixWorld(true);
  let drawCalls=0,triangles=0,geometryBytes=0;
  group.traverse(o=>{if(o instanceof THREE.Mesh){drawCalls++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o instanceof THREE.InstancedMesh?o.count:1);}if(o instanceof THREE.InstancedMesh)geometryBytes+=o.instanceMatrix.array.byteLength;});
  for(const g of geometries){for(const a of Object.values(g.attributes))geometryBytes+=a.array.byteLength;if(g.index)geometryBytes+=g.index.array.byteLength;}
  const stats={drawCalls,triangles,geometryBytes,instances,textureBytes:0,pointLights:2,shadowLights:0};
  const bounds=new THREE.Box3().setFromObject(group);
  function dispose(){if(disposed)return;disposed=true;group.traverse(o=>{if(o instanceof THREE.InstancedMesh)o.dispose();});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();group.clear();group.removeFromParent();batches.clear();movingHead.length=0;}
  if(geometryBytes>350000||triangles>18000||drawCalls>22){dispose();throw new Error('Interior budget exceeded: '+JSON.stringify(stats));}
  return {group,render,stats,bounds,anchors:INTERIOR_ANCHORS,state,dispose};
}
