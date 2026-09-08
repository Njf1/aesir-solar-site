import * as THREE from 'three';
import {PANEL,cellLayout,PANEL_ROTATION,PANEL_NORMAL} from './panel-layout.ts';
import {HERO_ANCHOR,ROOF_Y} from './site-layout.ts';

/**
 * Original, unbranded architectural illustration; metres, +Y up, south = +Z.
 * No external imagery, fonts, geometry, models or textures. Created 2026-09-08.
 * This is a designed composite British employment site, not a surveyed property.
 * Site lights/environment/contact shadows belong to the owner renderer.
 */
export type CommercialQuality = 'mobile' | 'desktop';
export interface CommercialSite {
  group: THREE.Group;
  heroAnchor: THREE.Vector3;
  heroNormal: THREE.Vector3;
  roofY: number;
  bounds: THREE.Box3;
  setOperation(section:number,activity:number,dusk:number):void;
  stats: {
    drawCalls: number; triangles: number; instances: number; instancedMeshes: number;
    panelCount: number; panelAreaM2: number; arrayCoverage: number;
    textureBytes: number; textureBytesWithMipmaps: number;
  };
  dispose(): void;
}

type Placement = { position: THREE.Vector3; scale: THREE.Vector3; rotation: THREE.Quaternion; color?: THREE.Color; section?:boolean };
type Batch = { geometry: THREE.BufferGeometry; material: THREE.Material; items: Placement[]; name: string; shadow: boolean };

export function createCommercialSite(quality: CommercialQuality): CommercialSite {
  const mobile = quality === 'mobile';
  const group = new THREE.Group(); group.name = 'Original British solar warehouse campus';
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const batches = new Map<string, Batch>();
  const sectionInstances:{mesh:THREE.InstancedMesh;index:number;item:Placement}[]=[];
  const identity = new THREE.Quaternion();
  const boxGeometry = ownGeometry(new THREE.BoxGeometry(1, 1, 1));
  const planeGeometry = ownGeometry(new THREE.PlaneGeometry(1, 1));
  const cylinderGeometry = ownGeometry(new THREE.CylinderGeometry(1, 1, 1, mobile ? 8 : 12));
  const leafGeometry = ownGeometry(new THREE.IcosahedronGeometry(1, mobile ? 0 : 1));
  let decodedBytes = 0;
  let panelCount = 0;
  const roofY = ROOF_Y;
  const panelWidth = PANEL.width, panelLength = PANEL.length, panelTilt = Math.atan2(PANEL_NORMAL.z,PANEL_NORMAL.y);
  const panelRotation = PANEL_ROTATION;
  const glassRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + panelTilt, 0, 0));
  const heroNormal = PANEL_NORMAL.clone();
  const heroAnchor = HERO_ANCHOR.clone();
  const heroPanelCentre = heroAnchor.clone().addScaledVector(heroNormal,-.058);

  function ownGeometry<T extends THREE.BufferGeometry>(g: T): T { geometries.add(g); return g; }
  function ownMaterial<T extends THREE.Material>(m: T): T { materials.add(m); return m; }
  function standard(color: number, roughness: number, metalness = 0) {
    return ownMaterial(new THREE.MeshStandardMaterial({ color, roughness, metalness }));
  }
  function canvasTexture(width: number, height: number, painter: (ctx: CanvasRenderingContext2D) => void, color = true) {
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Commercial texture canvas unavailable');
    painter(context);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.anisotropy = mobile ? 2 : 4;
    textures.add(texture); decodedBytes += width * height * 4;
    return texture;
  }
  function place(key: string, geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number, rotation = identity, color?: THREE.Color, shadow = true) {
    const batchKey = `${geometry.uuid}:${material.uuid}:${shadow ? 1 : 0}`;
    let batch = batches.get(batchKey);
    if (!batch) { batch = { geometry, material, items: [], name: `${key} — material batch`, shadow }; batches.set(batchKey, batch); }
    const item:Placement={ position: new THREE.Vector3(x, y, z), scale: new THREE.Vector3(sx, sy, sz), rotation: rotation.clone(), color };batch.items.push(item);return item;
  }
  function box(key: string, mat: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number, rotation = identity, color?: THREE.Color, shadow = true) {
    return place(key, boxGeometry, mat, x, y, z, sx, sy, sz, rotation, color, shadow);
  }
  function cylinder(key: string, mat: THREE.Material, x: number, y: number, z: number, radius: number, height: number, rotation = identity, color?: THREE.Color) {
    place(key, cylinderGeometry, mat, x, y, z, radius, height, radius, rotation, color);
  }
  const asphalt = standard(0x393c3a, .98);
  const asphaltLight = standard(0x4a4c48, .98);
  const concrete = standard(0xc0beb0, .9);
  const warmConcrete = standard(0xd6d1bd, .85);
  const grass = standard(0x687456, 1);
  const soil = standard(0x4e5140, 1);
  const foliage = standard(0x64754d, 1);
  const bark = standard(0x5c5547, 1);
  const stripe = standard(0xd9d6bf, .9);
  const yellow = standard(0xd0b46d, .8);
  const shell = standard(0xa0aaa8, .63, .24);
  const ribs = standard(0x82908f, .48, .35);
  const charcoal = standard(0x303c41, .62, .32);
  const roof = standard(0xaeb7b6, .76, .22);
  const aluminium = standard(0xb8c2c3, .29, .78);
  const darkMetal = standard(0x49555a, .43, .57);
  const timber = standard(0x93775a, .88);
  const window = ownMaterial(new THREE.MeshPhysicalMaterial({ color: 0x22383e, metalness: .36, roughness: .2, clearcoat: .7, clearcoatRoughness: .15 }));
  const officeWindow=ownMaterial(window.clone());officeWindow.emissive.setHex(0xffb55e);officeWindow.emissiveIntensity=0;
  // Original office-room light modulation. Only emission changes; daytime glass,
  // reflections, roughness, clearcoat and opacity retain their accepted values.
  officeWindow.customProgramCacheKey=()=> 'aesir-office-room-emission-v1';
  officeWindow.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader
      .replace('#include <common>',`#include <common>
        varying vec3 vOfficePosition;
        varying vec3 vOfficeBand;
      `)
      .replace('#include <begin_vertex>',`#include <begin_vertex>
        vec4 officePosition=vec4(transformed,1.0);
        float officeFloor=0.0;
        #ifdef USE_INSTANCING
          officePosition=instanceMatrix*officePosition;
          officeFloor=floor(instanceMatrix[3].y/3.75);
        #endif
        vOfficePosition=(modelMatrix*officePosition).xyz;
        // Unit box geometry: its Y coordinate supplies a consistent glass height.
        vOfficeBand=vec3(position.y+.5,abs(normal.x),officeFloor);
      `);
    shader.fragmentShader=shader.fragmentShader
      .replace('#include <common>',`#include <common>
        varying vec3 vOfficePosition;
        varying vec3 vOfficeBand;
      `)
      .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
        // South mullions start at x=-36.7 every 2.4m; a room spans two bays.
        // West windows are individually spaced every 2m from z=24.
        float officeAcross=mix((vOfficePosition.x+36.7)/4.8,
                               (vOfficePosition.z-23.0)/2.0,vOfficeBand.y);
        float officeRoom=floor(officeAcross);
        float officeU=fract(officeAcross);
        float officeY=clamp(vOfficeBand.x,0.0,1.0);
        float officeSeed=fract(sin(dot(vec2(officeRoom,vOfficeBand.z),
                                      vec2(127.1,311.7)))*43758.5453);
        float officeActivity=mix(.06,.58+.42*officeSeed,step(.15,officeSeed));
        // A small bounded parallax hint belongs only to the ceiling source.
        // The room edges remain aligned with the physical glazing/mullions.
        vec3 officeView=normalize(cameraPosition-vOfficePosition);
        float officeViewAcross=mix(officeView.x,-officeView.z,vOfficeBand.y);
        float officeViewNormal=mix(abs(officeView.z),abs(officeView.x),vOfficeBand.y);
        float officeLightU=officeU+clamp(officeViewAcross/max(.25,officeViewNormal),-1.5,1.5)*.028;
        float officeEdges=smoothstep(.012,.085,officeU)*(1.0-smoothstep(.915,.988,officeU));
        float officeCeiling=smoothstep(.70,.77,officeY)*(1.0-smoothstep(.85,.93,officeY));
        officeCeiling*=smoothstep(.10,.22,officeLightU)*(1.0-smoothstep(.76,.88,officeLightU));
        float officeBounce=.12+.24*smoothstep(.18,.78,officeY);
        float officeDesk=(1.0-smoothstep(.20,.31,officeY))*smoothstep(.14,.24,officeU)*(1.0-smoothstep(.76,.86,officeU));
        float officeLight=officeEdges*(.018+officeActivity*(officeBounce+.55*officeCeiling))*(1.0-.60*officeDesk);
        // At emissiveIntensity=0, Three supplies zero totalEmissiveRadiance.
        // Multiplication by this finite bounded value therefore changes nothing.
        totalEmissiveRadiance*=clamp(officeLight,0.0,1.0);
      `);
  };

  const rubber = standard(0x252a2b, .95);
  const vehiclePaint = standard(0xa8b4b3, .35, .22);
  const whiteMetal = standard(0xd5d6d0, .55, .26);
  const headlight = standard(0xede5cd, .24, .15);
  const red = standard(0x9e493c, .6);
  const panelBacking = standard(0x273439, .66, .3);

  const moduleTexture = canvasTexture(mobile ? 256 : 512, mobile ? 512 : 1024, ctx => {
    const w = ctx.canvas.width, h = ctx.canvas.height;
    ctx.fillStyle = '#101f2c'; ctx.fillRect(0, 0, w, h);
    const px=(x:number)=>(.5+x/PANEL.glassWidth)*w,py=(z:number)=>(.5+z/PANEL.glassLength)*h;
    // Mipmapped single contact layer: no second grid floating above the glass.
    for(let row=0;row<PANEL.rows;row++)for(let col=0;col<PANEL.cols;col++){
      const cell=cellLayout(row,col),x=px(cell.x-cell.width/2),y=py(cell.z-cell.length/2),cw=cell.width/PANEL.glassWidth*w,ch=cell.length/PANEL.glassLength*h;
      const variation=((row*19+col*31)%7)*.55;
      ctx.fillStyle=`rgb(${14+variation},${31+variation},${47+variation})`;ctx.fillRect(x,y,cw,ch);
      ctx.strokeStyle='#718391';ctx.lineWidth=Math.max(.45,w*.00085);
      for(const bx of cell.busXs){ctx.beginPath();ctx.moveTo(px(bx),y+.5);ctx.lineTo(px(bx),y+ch-.5);ctx.stroke();}
      ctx.strokeStyle='#42586a';ctx.lineWidth=Math.max(.22,h*.00021);
      for(const fz of cell.fingerZs){ctx.beginPath();ctx.moveTo(x+.5,py(fz));ctx.lineTo(x+cw-.5,py(fz));ctx.stroke();}
    }
  });
  const panelGlass = ownMaterial(new THREE.MeshPhysicalMaterial({ color: 0xd6e3ef, map: moduleTexture, roughness: .24, metalness: .06, clearcoat: .60, clearcoatRoughness: .18, side: THREE.FrontSide }));

  // Campus ground, access road and a circulation route suitable for later service-yard shots.
  box('landscape', grass, 0, -.28, 3, 157, .46, 136, identity, undefined, false);
  box('road surfaces', asphalt, 3, -.015, 4, 122, .12, 110, identity, undefined, false);
  box('road surfaces', asphalt, 0, -.03, 66, 158, .12, 10, identity, undefined, false);
  box('service apron', asphaltLight, 52, .028, 1, 20, .10, 79, identity, undefined, false);
  box('concrete apron', concrete, 42, .09, -.5, 5, .16, 42, identity, undefined, false);
  box('landscape', grass, -54, .04, 0, 11, .22, 97, identity, undefined, false);
  box('landscape', grass, -1, .05, -44, 102, .24, 10, identity, undefined, false);
  box('landscape', grass, -4, .05, 44, 82, .24, 6, identity, undefined, false);
  box('pedestrian pavement', concrete, -17, .12, 37, 61, .22, 4.3, identity, undefined, false);
  box('pedestrian pavement', concrete, -43, .12, 8, 2.8, .22, 62, identity, undefined, false);
  for (const x of [-59, -49, 62]) box('kerbs', concrete, x, .12, 0, .22, .24, 99);
  for (const z of [-39.1, -48.9, 41, 47]) box('kerbs', concrete, -3, .14, z, z > 0 ? 82 : 103, .25, .2);
  for (let x = -71; x < 72; x += 11) box('road markings', stripe, x, .039, 66, 4.2, .008, .11, identity, undefined, false);
  for (let z = -32; z <= 35; z += 10) box('road markings', stripe, 56, .091, z, .12, .006, 4, identity, undefined, false);
  // Entry crossing, disabled parking stripes and a protected entrance forecourt.
  for (let i = 0; i < 8; i++) box('road markings', stripe, -2 + i * .65, .08, 51, .38, .01, 4, identity, undefined, false);
  for (let i = 0; i < 5; i++) cylinder('entrance bollards', charcoal, -2 + i * 1.65, .52, 36.1, .075, .8);

  // Warehouse mass with a darker base, layered parapet and continuous clerestory band.
  // Identical outer envelope with an actual hollow interior. The west architectural
  // section retracts within its opening; the camera never passes through a solid mass.
  for(const z of[-23.85,23.85])box('warehouse cladding',shell,0,5.35,z,80,10.7,.3);
  box('warehouse cladding',shell,39.85,5.35,0,.3,10.7,47.4);
  for(const[z,d]of[[-9.5,29],[20.25,7.5]])box('warehouse cladding',shell,-39.85,5.35,z,.3,10.7,d);
  box('warehouse cladding',shell,-39.85,10.15,10.75,.3,1.1,11.5);
  box('west architectural section',shell,-39.85,4.8,10.75,.3,9.6,11.5).section=true;
  for(const z of[-23.95,23.95])box('warehouse plinth',charcoal,0,.7,z,80.2,1.4,.3);
  box('warehouse plinth',charcoal,39.95,.7,0,.3,1.4,47.6);
  for(const[z,d]of[[-9.5,29],[20.25,7.5]])box('warehouse plinth',charcoal,-39.95,.7,z,.3,1.4,d);
  box('west section plinth',charcoal,-39.95,.7,10.75,.3,1.4,11.5).section=true;
  box('warehouse roof', roof, 0, roofY - .18, 0, 79.9, .36, 47.9);
  box('clerestory glazing', window, 0, 9.8, 24.035, 72, .92, .08);
  for (let x = -36; x <= 36; x += 3) box('clerestory mullions', aluminium, x, 9.8, 24.09, .07, 1.02, .08);
  for (const z of [-24.05, 24.05]) {
    box('parapets', charcoal, 0, 11.11, z, 80.3, .53, .21);
    box('parapet cappings', aluminium, 0, 11.39, z, 80.5, .055, .32);
    box('gutters', darkMetal, 0, 10.76, z + Math.sign(z) * .16, 80.2, .16, .19);
  }
  for (const x of [-40.05, 40.05]) {
    box('parapets', charcoal, x, 11.11, 0, .21, .53, 48.2);
    box('parapet cappings', aluminium, x, 11.39, 0, .32, .055, 48.4);
  }
  const ribStep = mobile ? 1.05 : .72;
  for (let x = -39.5; x <= 39.5; x += ribStep) {
    box('cladding ribs', ribs, x, 5.65, -24.055, .045, 8.7, .09);
    // The office covers only part of the south facade; the working building stays visible.
    if (x > 13 || x < -38) box('cladding ribs', ribs, x, 5.05, 24.055, .045, 7.1, .09);
  }
  for (let z = -23.5; z <= 23.5; z += ribStep) {
    const rib=box('cladding ribs', ribs, -40.055, 5.65, z, .09, 8.7, .045);if(z>5&&z<16.5)rib.section=true;
    if (z < -19 || z > 17) box('cladding ribs', ribs, 40.055, 5.65, z, .09, 8.7, .045);
  }
  for (const x of [-37.2, -17, 14, 37.2]) for (const z of [-24.2, 24.2]) cylinder('downpipes', darkMetal, x, 5.4, z, .07, 10.3);
  // Fine roof seams are inset below arrays and remain visible at the service edge.
  for (let x = -39; x < 40; x += mobile ? 2.8 : 1.4) box('standing roof seams', aluminium, x, roofY + .012, 0, .028, .035, 47.1, identity, undefined, false);

  // Deliberate asymmetric silhouette: office bar, taller entrance volume and floating canopy.
  box('office stone', warmConcrete, -17, 4.18, 28.3, 42, 8.36, 10.6);
  box('office base', charcoal, -17, .4, 28.3, 42.4, .8, 10.9);
  box('office roof trim', charcoal, -17, 8.57, 28.5, 43.2, .42, 11.4);
  box('office stone', warmConcrete, 7.6, 5.03, 27.9, 8.4, 10.06, 9.8);
  box('entry roof cap', aluminium, 7.6, 10.23, 28.4, 9.5, .3, 11);
  box('entry timber', timber, 7.6, 5.05, 32.85, 8.46, 9.6, .12);
  box('entrance glazing', window, 7.2, 3.7, 32.94, 5.8, 6.55, .08);
  box('entrance frame', charcoal, 7.2, 3.6, 33.02, .13, 6.7, .10);
  box('entrance frame', charcoal, 7.2, 4.6, 33.03, 5.9, .15, .13);
  box('entrance canopy', charcoal, 3.6, 4.52, 34.75, 16.2, .3, 5.8);
  box('canopy soffit', timber, 3.6, 4.34, 34.75, 15.8, .08, 5.55);
  for (const x of [-3.6, 10.8]) cylinder('canopy columns', darkMetal, x, 2.15, 36.9, .10, 4.3);
  for (const floor of [2.28, 6.02]) {
    box('office glazing', officeWindow, -17.5, floor, 33.66, 38.8, 2.6, .08);
    box('office window reveals', charcoal, -17.5, floor - 1.37, 33.73, 39.15, .12, .23);
    box('office window reveals', charcoal, -17.5, floor + 1.37, 33.73, 39.15, .12, .23);
    for (let x = -36.7; x <= 2; x += 2.4) box('office mullions', aluminium, x, floor, 33.77, .065, 2.73, .17);
  }
  for (let x = -34.5; x <= 0; x += 6.9) box('office solar fins', charcoal, x, 5.32, 34.08, .18, 5.9, .64);
  for (let z = 24; z <= 32; z += 2) box('office west glazing', officeWindow, -38.045, 5.6, z, .08, 4.7, 1.65);
  // Occupied terrace on the office roof: planters, service door and screened equipment.
  box('office roof deck', concrete, -17, 8.83, 28.4, 40.6, .08, 9.7);
  for (const x of [-35, -1]) box('roof terrace planters', soil, x, 9.12, 29.5, 2.4, .6, 5.2);
  for (const x of [-35, -1]) box('roof terrace hedges', foliage, x, 9.63, 29.5, 2.1, .76, 4.8);
  for (let x = -31; x <= -6; x += 3.2) box('terrace railing', darkMetal, x, 9.37, 33.23, .04, 1.1, .04);
  box('terrace railing', darkMetal, -18.5, 9.89, 33.23, 28, .045, .045);
  box('terrace railing', darkMetal, -18.5, 9.26, 33.23, 28, .045, .045);

  // Four dock doors, shelters, bumpers and a separate ground-level service door to the east.
  for (const [i, z] of [-15, -5, 5, 15].entries()) {
    box('dock recess', rubber, 40.14, 2.58, z, .22, 4.65, 4.65);
    box('dock shutter', shell, 40.29, 2.74, z, .14, 4.06, 3.61);
    for (let y = .91; y < 4.7; y += .36) box('dock shutter slats', ribs, 40.38, y, z, .055, .035, 3.6);
    for (const edge of [-1, 1]) {
      box('dock surround', charcoal, 40.49, 2.76, z + edge * 2, .57, 4.42, .25);
      box('dock bumpers', rubber, 40.68, .81, z + edge * 1.55, .36, 1.0, .23);
      cylinder('dock bollards', yellow, 41.4, .78, z + edge * 2.55, .11, 1.25);
    }
    box('dock surround', charcoal, 40.49, 5, z, .57, .27, 4.26);
    box('dock apron plates', darkMetal, 40.89, .22, z, 1.5, .16, 3.15);
    // Abstract door markers avoid fictional brands or unreadable generated signage.
    for (let marker = 0; marker <= i; marker++) box('dock markers', stripe, 40.44, 5.65, z - .38 + marker * .22, .03, .21, .11);
    box('dock approach markings', yellow, 45.25, .095, z - 2.05, 7.5, .01, .09, identity, undefined, false);
    box('dock approach markings', yellow, 45.25, .095, z + 2.05, 7.5, .01, .09, identity, undefined, false);
  }
  box('service door', charcoal, 40.12, 1.26, 21.3, .15, 2.42, 1.16);
  box('service canopy', darkMetal, 40.75, 2.65, 21.3, 1.6, .14, 1.7);

  // Rooflights form deliberate clear zones rather than disappearing beneath the PV array.
  const rooflightZones = [ { x: -25.2, z: -8.9, w: 2.0, d: 7.3 }, { x: 15.4, z: -8.9, w: 2.0, d: 7.3 }, { x: 31.9, z: 7.3, w: 2.0, d: 7.3 } ];
  for (const r of rooflightZones) {
    box('rooflight kerbs', charcoal, r.x, roofY + .20, r.z, r.w + .3, .40, r.d + .3);
    box('rooflight glass', window, r.x, roofY + .435, r.z, r.w, .09, r.d);
    for (let z = r.z - 3.5; z <= r.z + 3.5; z += 1.75) box('rooflight frames', aluminium, r.x, roofY + .49, z, r.w + .1, .045, .045);
  }
  // Service plant at the rear and a clear route between the office and working roof.
  const fanGeometry = ownGeometry(new THREE.CylinderGeometry(.58, .58, .12, mobile ? 12 : 20));
  for (const x of [-4.6, 3.7]) {
    box('HVAC plinths', charcoal, x, roofY + .17, -18.2, 4.5, .32, 4.8);
    box('HVAC cabinets', whiteMetal, x, roofY + .96, -18.2, 3.9, 1.25, 4.2);
    for (const z of [-19.1, -17.3]) place('HVAC fans', fanGeometry, darkMetal, x, roofY + 1.64, z, 1, 1, 1);
    for (let z = -20; z <= -16.4; z += .28) box('HVAC louvres', darkMetal, x + 1.97, roofY + .97, z, .05, .76, .09);
  }
  for (const x of [-17, 23]) {
    box('roof vents', charcoal, x, roofY + .28, -21.8, 1.3, .54, 1.1);
    box('roof vent cap', aluminium, x, roofY + .58, -21.8, 1.6, .09, 1.3);
  }
  box('roof service walkway', charcoal, 0, roofY + .031, 22.55, 75, .045, .57, identity, undefined, false);
  // Cable route stays beneath modules, with an inspectable destination at the south roof edge.
  box('cable trays', darkMetal, -10, roofY + .105, 15.8, .19, .10, 13.4);

  // Low-tilt south-facing PV: glass occupies approximately 59% of the warehouse roof.
  const isReserved = (x: number, z: number) =>
    (Math.abs(x) < 7.3 && z < -14.5) || rooflightZones.some(r => Math.abs(x - r.x) < r.w / 2 + .83 && Math.abs(z - r.z) < r.d / 2 + 1.24);
  const local = new THREE.Vector3();
  function panelPart(key: string, material: THREE.Material, centre: THREE.Vector3, lx: number, ly: number, lz: number, sx: number, sy: number, sz: number) {
    local.set(lx, ly, lz).applyQuaternion(panelRotation).add(centre);
    // The module back casts the array's footprint; tiny frames/clamps need no extra shadow pass.
    box(key, material, local.x, local.y, local.z, sx, sy, sz, panelRotation, undefined, key !== 'PV aluminium frames' && key !== 'PV clamps');
  }
  for (let row = 0; row < 16; row++) {
    const z = -19.7 + row * 2.7;
    // Long continuous mounting rails reveal the array's scale without one support mesh per cell.
    for (const dz of [-.70, .70]) box('PV mounting rails', darkMetal, -.475, roofY + .13, z + dz, 74, .12, .055);
    for (let col = 0; col < 58; col++) {
      const x = -36.67 + col * 1.27;
      if (isReserved(x, z)) continue;
      panelCount++;
      const centre = new THREE.Vector3(x, roofY + .33, z);
      panelPart('PV module backs', panelBacking, centre, 0, .012, 0, panelWidth, .030, panelLength);
      for (const side of [-1, 1]) {
        panelPart('PV aluminium frames', aluminium, centre, side * (panelWidth / 2 - .012), .035, 0, .024, .044, panelLength);
        panelPart('PV aluminium frames', aluminium, centre, 0, .035, side * (panelLength / 2 - .012), panelWidth - .048, .044, .024);
      }
      local.set(0, .058, 0).applyQuaternion(panelRotation).add(centre);
      place('PV glass and cells', planeGeometry, panelGlass, local.x, local.y, local.z, panelWidth - .049, panelLength - .049, 1, glassRotation, undefined, false);
      // The module's two silver end clamps remain visible at an oblique camera angle.
      for (const side of [-1, 1]) panelPart('PV clamps', aluminium, centre, side * (panelWidth / 2 + .011), .047, .67, .047, .035, .07);
    }
  }

  // Only the cutaway owns enlarged contact geometry. The exterior has one aligned,
  // mipmapped contact pattern and therefore no abrupt or doubled contact LOD.
  const hero=new THREE.Group();hero.name='Selected module junction and leads';
  hero.position.copy(heroPanelCentre);hero.quaternion.copy(panelRotation);group.add(hero);
  const contactCount=0;
  // Junction box and two original cable loops under the hero panel, ready for a future descent.
  const junction = new THREE.Mesh(ownGeometry(new THREE.BoxGeometry(.14, .035, .105)), panelBacking);
  junction.position.set(0, -.020, -.28); hero.add(junction);
  let cableTriangles = 0;
  for (const side of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(side * .035, -.038, -.29), new THREE.Vector3(side * .13, -.07, -.36), new THREE.Vector3(side * .19, -.105, -.11), new THREE.Vector3(side * .09, -.13, .10)]);
    const geometry = ownGeometry(new THREE.TubeGeometry(curve, 16, .004, 5, false));
    cableTriangles += geometry.index!.count / 3;
    const cable = new THREE.Mesh(geometry, rubber); cable.name = 'Hero module DC lead'; hero.add(cable);
  }

  // Car park: two rows, clear aisles, protected pedestrian edge and a few unbranded vehicles.
  for (let i = 0; i < 17; i++) {
    const x = -43 + i * 2.65;
    box('parking bay lines', stripe, x, .066, 54.7, .075, .009, 5.0, identity, undefined, false);
    box('parking bay stops', concrete, x + 1.23, .18, 57.1, 1.5, .20, .18);
  }
  box('parking bay lines', stripe, -20.5, .066, 57.2, 46, .009, .075, identity, undefined, false);
  for (let z = -27; z <= 25; z += 2.75) box('west parking lines', stripe, -47, .067, z, 4.2, .009, .075, identity, undefined, false);
  const wheelRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
  function car(x: number, z: number, angle: number, color: number, van = false) {
    const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    const rotate = (lx: number, ly: number, lz: number) => new THREE.Vector3(lx, ly, lz).applyQuaternion(yaw).add(new THREE.Vector3(x, 0, z));
    const part = (key: string, mat: THREE.Material, lx: number, ly: number, lz: number, sx: number, sy: number, sz: number, tint?: THREE.Color) => { const p = rotate(lx, ly, lz); box(key, mat, p.x, p.y, p.z, sx, sy, sz, yaw, tint); };
    const tint = new THREE.Color(color);
    part('vehicle bodies', vehiclePaint, 0, .64, 0, van ? 1.96 : 1.78, .65, van ? 5.1 : 4.35, tint);
    part('vehicle bodies', vehiclePaint, 0, van ? 1.36 : 1.14, -.22, van ? 1.86 : 1.53, van ? 1.12 : .59, van ? 3.95 : 2.26, tint);
    part('vehicle glazing', window, 0, van ? 1.55 : 1.22, van ? 1.70 : .78, van ? 1.68 : 1.40, van ? .61 : .47, .09);
    part('vehicle glazing', window, 0, 1.20, -1.33, 1.42, .41, .08);
    if (!van) for (const side of [-1, 1]) part('vehicle glazing', window, side * .776, 1.18, -.22, .035, .42, 1.77);
    for (const side of [-1, 1]) for (const end of [-1, 1]) {
      const p = rotate(side * .91, .38, end * (van ? 1.66 : 1.39));
      cylinder('vehicle wheels', rubber, p.x, p.y, p.z, van ? .36 : .31, .20, yaw.clone().multiply(wheelRotation));
    }
    for (const side of [-1, 1]) {
      part('vehicle headlights', headlight, side * .59, .73, van ? 2.56 : 2.185, .38, .16, .025);
      part('vehicle rear lights', red, side * .65, .78, van ? -2.56 : -2.185, .23, .18, .025);
    }
  }
  const vehicleColours = [0xd7d7ce, 0x738894, 0x384a52, 0xa0a5a4, 0x52685f, 0x9d9288];
  for (const [j, bay] of [0, 2, 3, 6, 7, 11, 13, 15].entries()) car(-41.7 + bay * 2.65, 54.55, Math.PI, vehicleColours[j % vehicleColours.length]);
  for (const [i, z] of [-22, -11, 5, 16].entries()) car(-46.9, z, Math.PI / 2, vehicleColours[(i + 2) % vehicleColours.length]);
  car(46.2, -15, -Math.PI / 2, 0xe0e2db, true);
  car(48.3, 27.8, Math.PI, 0xb8c0bf, true);

  // Landscape planting: grouped canopies and varied tones, not a repeated conifer grid.
  let seed = 6183;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  function tree(x: number, z: number, scale: number) {
    cylinder('tree trunks', bark, x, scale * .9, z, .16 * scale, 1.8 * scale);
    for (let lobe = 0; lobe < (mobile ? 3 : 5); lobe++) {
      const a = lobe * 2.399, radius = lobe ? .75 : 0;
      place('tree canopies', leafGeometry, foliage, x + Math.cos(a) * radius * scale, (2.1 + random() * .5) * scale, z + Math.sin(a) * radius * scale, (1.1 + random() * .25) * scale, (1.0 + random() * .30) * scale, (1.1 + random() * .20) * scale, identity, new THREE.Color().setHSL(.23 + random() * .04, .18, .26 + random() * .11));
    }
  }
  for (let z = -36; z <= 40; z += 12) tree(-55.4 + random() * 1.7, z, 1.05 + random() * .45);
  for (let x = -36; x <= 39; x += 15) tree(x, -43.5 + random() * 1.2, 1.0 + random() * .5);
  for (const x of [-36, -20, 15, 31]) tree(x, 44, 1.05 + random() * .2);
  for (const x of [-30, -18, -6]) {
    box('front planters', soil, x, .38, 38.2, 5, .55, 1.1);
    box('front hedging', foliage, x, .94, 38.2, 4.8, .84, .95);
  }
  // Service-yard furniture: original cages/bins, pallet stacks, substation and perimeter fence.
  for (let i = 0; i < 3; i++) {
    box('yard recycling', darkMetal, 49 + i * 2.2, .83, -33.5, 1.5, 1.55, 1.15);
    box('yard bin lids', charcoal, 49 + i * 2.2, 1.66, -33.5, 1.56, .10, 1.21);
  }
  box('electrical enclosure', whiteMetal, 30, 1.32, -32.7, 5.3, 2.64, 3.3);
  box('electrical enclosure cap', charcoal, 30, 2.7, -32.7, 5.55, .17, 3.55);
  for (let x = 28; x <= 32; x += .31) box('electrical louvres', darkMetal, x, 1.54, -30.98, .12, 1.67, .06);
  for (let i = 0; i < 4; i++) {
    const px = 45 + (i % 2) * 1.5, pz = -28 + Math.floor(i / 2) * 1.8;
    for (let level = 0; level < 3; level++) {
      for (const runner of [-.43, .43]) box('yard timber pallets', timber, px + runner, .11 + level * .16, pz, .15, .13, 1.18);
      for (let slat = 0; slat < 5; slat++) box('yard timber pallets', timber, px, .19 + level * .16, pz - .51 + slat * .25, 1.16, .055, .15);
    }
  }
  for (let z = -38; z <= 42; z += 4) cylinder('perimeter fence posts', darkMetal, 63.3, 1.05, z, .033, 2.1);
  for (const y of [.46, 1.52]) box('perimeter fence rails', darkMetal, 63.3, y, 2, .026, .028, 83);
  // Street furniture uses compact cylinders rather than high-polygon imported props.
  for (const [x, z] of [[-46, 34], [49, 39], [58, -30], [-42, -35]]) {
    cylinder('site light poles', darkMetal, x, 3.7, z, .061, 7.4);
    box('site light heads', charcoal, x, 7.43, z + .35, .27, .13, .9);
  }

  let drawCalls = 0, triangles = 0, instances = 0, instancedMeshes = 0;
  const matrix = new THREE.Matrix4();
  for (const batch of batches.values()) {
    const mesh = new THREE.InstancedMesh(batch.geometry, batch.material, batch.items.length);
    mesh.name = batch.name; mesh.castShadow = batch.shadow; mesh.receiveShadow = true;
    batch.items.forEach((item, index) => { matrix.compose(item.position, item.rotation, item.scale); mesh.setMatrixAt(index, matrix); if (item.color) mesh.setColorAt(index, item.color);if(item.section)sectionInstances.push({mesh,index,item}); });
    mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingBox(); mesh.computeBoundingSphere(); group.add(mesh);
    drawCalls++; instancedMeshes++; instances += batch.items.length;
    triangles += (batch.geometry.index ? batch.geometry.index.count : batch.geometry.getAttribute('position').count) / 3 * batch.items.length;
  }
  // Instance matrices are now on the meshes; release the temporary placement objects.
  batches.clear();
  // Statistics conservatively include fine hero detail even when its LOD is hidden.
  drawCalls += 3; instances += contactCount;
  triangles += contactCount * 12 + 12 + cableTriangles;
  group.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(group);
  const stats = { drawCalls, triangles, instances, instancedMeshes, panelCount, panelAreaM2: panelCount * panelWidth * panelLength, arrayCoverage: panelCount * panelWidth * panelLength / (80 * 48), textureBytes: decodedBytes, textureBytesWithMipmaps: Math.ceil(decodedBytes * 4 / 3) };
  let disposed = false;
  let lastSection=-1;const sectionPosition=new THREE.Vector3(),sectionScale=new THREE.Vector3();
  return {
    group, heroAnchor, heroNormal, roofY, bounds, stats,
    setOperation(section,activity,dusk){
      if(disposed)return;officeWindow.emissiveIntensity=activity*(.12+dusk*.62);
      if(section===lastSection)return;lastSection=section;
      for(const{mesh,index,item}of sectionInstances){sectionPosition.copy(item.position);sectionScale.copy(item.scale);sectionPosition.y+=item.scale.y*section*.5;sectionScale.y=Math.max(.00001,item.scale.y*(1-section));matrix.compose(sectionPosition,item.rotation,sectionScale);mesh.setMatrixAt(index,matrix);mesh.instanceMatrix.needsUpdate=true;}
    },
    dispose() {
      if (disposed) return; disposed = true;
      group.traverse(object => { if (object instanceof THREE.InstancedMesh) object.dispose(); });
      for (const texture of textures) { const image = texture.image as HTMLCanvasElement; texture.dispose(); if (image?.tagName === 'CANVAS') { image.width = 1; image.height = 1; } }
      for (const material of materials) material.dispose();
      for (const geometry of geometries) geometry.dispose();
      group.clear(); group.removeFromParent(); batches.clear();
    },
  };
}
