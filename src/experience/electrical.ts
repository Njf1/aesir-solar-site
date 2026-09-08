import * as THREE from 'three';
import {createEquipmentDetail} from './equipment-detail.ts';
import {ROOF_Y} from './site-layout.ts';
import {ELECTRICAL_PATHS,ELECTRICAL_PORTS,ELECTRICAL_ANCHORS,ELECTRICAL_ROUTE_NODES} from './electrical-path.ts';
type ElectricalTier='mobile'|'desktop';
const V=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
const clamp=(n:number)=>Math.min(1,Math.max(0,Number.isFinite(n)?n:0));
const smooth=(n:number)=>{const t=clamp(n);return t*t*(3-2*t);};

export interface ElectricalScene {
  group: THREE.Group;
  overlay: THREE.Mesh;
  paths: typeof ELECTRICAL_PATHS;
  ports: typeof ELECTRICAL_PORTS;
  anchors: typeof ELECTRICAL_ANCHORS;
  bounds: THREE.Box3;
  stats: { drawCalls: number; triangles: number; geometryBytes: number; textureBytes: number; instances: number };
  setProgress(progress: number, opacity?:number): void;
  dispose(): void;
}

export function createElectricalScene(tier: ElectricalTier): ElectricalScene {
  const mobile = tier === 'mobile';
  const group = new THREE.Group(); group.name = 'Original array DC route, generic inverter and AC service route';
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  const ownG = <T extends THREE.BufferGeometry>(g: T): T => { geometries.add(g); return g; };
  const ownM = <T extends THREE.Material>(m: T): T => { materials.add(m); return m; };
  const boxGeo = ownG(new THREE.BoxGeometry(1, 1, 1));
  const cylGeo = ownG(new THREE.CylinderGeometry(1, 1, 1, mobile ? 8 : 12));
  const metal = ownM(new THREE.MeshStandardMaterial({ color: 0xaeb8b8, roughness: .40, metalness: .62 }));
  const charcoal = ownM(new THREE.MeshStandardMaterial({ color: 0x29383d, roughness: .49, metalness: .35 }));
  const enclosure = ownM(new THREE.MeshStandardMaterial({ color: 0xcdd5d4, roughness: .43, metalness: .20 }));
  const darkRubber = ownM(new THREE.MeshStandardMaterial({ color: 0x182329, roughness: .82, metalness: .02 }));
  const acSheath = ownM(new THREE.MeshStandardMaterial({ color: 0x263940, roughness: .78, metalness: .08 }));
  const seal = ownM(new THREE.MeshStandardMaterial({ color: 0x172326, roughness: .91 }));
  const indicator = ownM(new THREE.MeshStandardMaterial({ color: 0xa3c3b8, emissive: 0x466758, emissiveIntensity: .25, roughness: .5 }));
  const west = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), -Math.PI / 2);
  const identity = new THREE.Quaternion();
  const batches = new Map<string, {g: THREE.BufferGeometry; m: THREE.Material; transforms: THREE.Matrix4[]; name: string}>();
  const placement = new THREE.Object3D();
  function instance(name: string, geometry: THREE.BufferGeometry, material: THREE.Material, p: THREE.Vector3, scale: THREE.Vector3, rotation = identity) {
    const key = geometry.uuid + material.uuid;
    let batch = batches.get(key); if (!batch) { batch = {g: geometry, m: material, transforms: [], name}; batches.set(key, batch); }
    placement.position.copy(p); placement.scale.copy(scale); placement.quaternion.copy(rotation); placement.updateMatrix(); batch.transforms.push(placement.matrix.clone());
  }
  function box(name: string, material: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number) { instance(name, boxGeo, material, V(x, y, z), V(sx, sy, sz)); }
  function localBox(name: string, material: THREE.Material, u: number, y: number, depth: number, w: number, h: number, d: number) {
    instance(name, boxGeo, material, V(-40.205 - depth, 2.34 + y, 18 + u), V(w, h, d), west);
  }
  function tube(path: THREE.CurvePath<THREE.Vector3>, material: THREE.Material, radius: number, _segments: number, name: string) {
    // Allocate detail to physical bends, not metres of perfectly straight cable. Uniform
    // whole-route sampling visibly cut the small gland bends across their corners.
    const points: THREE.Vector3[] = [], tangents: THREE.Vector3[] = [], distances: number[] = [];
    let distance = 0;
    for (const curve of path.curves) {
      const count = curve instanceof THREE.LineCurve3 ? 1 : mobile ? 6 : 10;
      for (let i = points.length ? 1 : 0; i <= count; i++) {
        const point = curve.getPointAt(i / count);
        if (points.length) distance += points[points.length - 1].distanceTo(point);
        points.push(point); tangents.push(curve.getTangentAt(i / count).normalize()); distances.push(distance);
      }
    }
    const sides = mobile ? 5 : 7, positions: number[] = [], normals: number[] = [], uvs: number[] = [], indices: number[] = [];
    const normal = V(1, 0, 0), binormal = new THREE.Vector3(), radial = new THREE.Vector3();
    for (let i = 0; i < points.length; i++) {
      const tangent = tangents[i]; normal.addScaledVector(tangent, -normal.dot(tangent));
      if (normal.lengthSq() < .00001) normal.copy(Math.abs(tangent.x) < .9 ? V(1, 0, 0) : V(0, 1, 0)).addScaledVector(tangent, -normal.dot(tangent));
      normal.normalize(); binormal.crossVectors(tangent, normal).normalize();
      for (let j = 0; j <= sides; j++) {
        const a = j / sides * Math.PI * 2; radial.copy(normal).multiplyScalar(Math.cos(a)).addScaledVector(binormal, Math.sin(a));
        positions.push(points[i].x + radial.x * radius, points[i].y + radial.y * radius, points[i].z + radial.z * radius);
        normals.push(radial.x, radial.y, radial.z); uvs.push(distances[i] / distance, j / sides);
        if (i && j < sides) { const b = i * (sides + 1) + j, a0 = b - sides - 1; indices.push(a0, a0 + 1, b, b, a0 + 1, b + 1); }
      }
    }
    const geometry = ownG(new THREE.BufferGeometry()); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name; mesh.castShadow = false; mesh.receiveShadow = true; group.add(mesh); return mesh;
  }

  // Existing hero leads terminate at these exact source anchors. The first run is enclosed
  // within the campus's existing covered tray; it is intentionally not an exposed live rail.
  tube(ELECTRICAL_PATHS.dcPositive, darkRubber, .0065, mobile ? 128 : 184, 'Representative array DC positive lead');
  tube(ELECTRICAL_PATHS.dcNegative, darkRubber, .0065, mobile ? 128 : 184, 'Representative array DC return lead');
  tube(ELECTRICAL_PATHS.acOutput, acSheath, .011, mobile ? 44 : 64, 'Distinct AC output cable to building entry');

  // Perimeter ladder tray remains beyond the walking strip and the last module row.
  for (const side of [-1, 1]) box('Perimeter tray rails', metal, -24.48, ROOF_Y + .225, 23.3 + side * .13, 29.6, .09, .024);
  for (let x = -38.9; x <= -10; x += .44) box('Perimeter tray rungs', metal, x, ROOF_Y + .185, 23.3, .029, .028, .28);
  for (let x = -38.5; x <= -10; x += 2.35) {
    box('Tray support feet', seal, x, ROOF_Y + .027, 23.3, .44, .054, .42);
    box('Tray support posts', metal, x, ROOF_Y + .105, 23.3, .045, .15, .045);
    box('Tray support crossarms', metal, x, ROOF_Y + .17, 23.3, .06, .04, .34);
  }
  // A removable covered crossover identifies the meeting with the existing service walkway.
  // This deliberately carries no implied construction specification; see route notes.
  box('Covered service walkway crossover', charcoal, -10, ROOF_Y + .15, 22.51, .30, .06, .87);
  for (const z of [22.12, 22.92]) box('Crossover support pads', seal, -10, ROOF_Y + .057, z, .42, .11, .14);
  box('Short tray extension', metal, -10, ROOF_Y + .194, 23.04, .26, .05, .42);

  // Raised parapet saddle clears the cap top (ROOF_Y + .3575) without cutting through it.
  for (const z of [23.15, 23.45]) {
    box('Parapet saddle uprights', metal, -39.34, ROOF_Y + .275, z, .04, .55, .035);
    box('Parapet saddle bridge', metal, -39.91, ROOF_Y + .525, z, 1.18, .055, .035);
  }
  box('Parapet support base', seal, -39.34, ROOF_Y + .026, 23.3, .42, .05, .46);
  box('External tray vertical spine', metal, -40.39, 7.34, 23.3, .035, 8.05, .21);
  for (const z of [23.155, 23.445]) box('External tray side rails', metal, -40.44, 7.34, z, .105, 8.05, .025);
  for (let y = 3.58; y <= 11.45; y += .43) box('External tray rungs', metal, -40.447, y, 23.3, .035, .029, .30);
  for (let y = 3.6; y <= 11.3; y += 1.24) {
    box('Wall standoff brackets', metal, -40.24, y, 23.3, .28, .06, .25);
    box('Wall mounting feet', charcoal, -40.125, y, 23.3, .045, .19, .34);
  }
  // Supported high-level lateral run stays above the enclosure and away from the office.
  for (const y of [3.48, 3.76]) box('Wall lateral tray rails', metal, -40.43, y, 20.22, .09, .025, 6.15);
  for (let z = 17.24; z <= 23.32; z += .4) box('Wall lateral tray rungs', metal, -40.448, 3.62, z, .035, .27, .029);
  for (const z of [17.22, 19.3, 21.4, 23.3]) box('Wall lateral supports', metal, -40.25, 3.58, z, .30, .06, .13);
  for (let y = 1.48; y <= 3.35; y += .43) {
    box('DC pair side supports', metal, -40.25, y, 17.18, .34, .035, .14);
    box('DC pair retaining clips', charcoal, -40.483, y, 17.18, .07, .055, .12);
  }
  for (const z of [13.8, 14.7, 15.6, 16.5, 17.4, 18.1]) {
    box('AC containment standoffs', metal, -40.27, .74, z, .30, .075, .05);
    box('AC retaining saddles', charcoal, -40.475, .74, z, .044, .07, .06);
  }

  // Closed weatherproof generic cabinet, 1.04m wide × 1.50m high × approximately .35m deep.
  // Smooth corners, gasket gap, restrained heat-sink ribs and bottom glands are identifiable.
  function roundedRectangle(width: number, height: number, r: number) {
    const s = new THREE.Shape(), x = -width / 2, y = -height / 2;
    s.moveTo(x + r, y); s.lineTo(x + width - r, y); s.quadraticCurveTo(x + width, y, x + width, y + r);
    s.lineTo(x + width, y + height - r); s.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    s.lineTo(x + r, y + height); s.quadraticCurveTo(x, y + height, x, y + height - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  }
  const shellGeo = ownG(new THREE.ExtrudeGeometry(roundedRectangle(1.04, 1.50, .055), { depth: .315, bevelEnabled: true, bevelThickness: .013, bevelSize: .014, bevelSegments: 2, curveSegments: mobile ? 3 : 5, steps: 1 }));
  const cabinet = new THREE.Mesh(shellGeo, enclosure); cabinet.position.set(-40.240, 2.34, 18); cabinet.quaternion.copy(west); cabinet.name = 'Generic closed inverter enclosure'; cabinet.castShadow = true; cabinet.receiveShadow = true; group.add(cabinet);
  localBox('Recessed back plate', charcoal, 0, 0, .035, .94, 1.40, .04);
  localBox('Enclosure gasket seam', seal, 0, 0, .356, .963, 1.401, .013);
  const doorGeo = ownG(new THREE.ExtrudeGeometry(roundedRectangle(.944, 1.379, .048), { depth: .016, bevelEnabled: true, bevelThickness: .007, bevelSize: .007, bevelSegments: 2, curveSegments: mobile ? 3 : 5 }));
  const door = new THREE.Mesh(doorGeo, enclosure); door.position.set(-40.571, 2.34, 18); door.quaternion.copy(west); door.name = 'Unbranded inverter front cover'; door.castShadow = false; door.receiveShadow = false; group.add(door);
  localBox('Front control recess', charcoal, 0, .29, .394, .42, .29, .022);
  localBox('Unlabelled status indicator', indicator, -.12, .375, .409, .028, .022, .007);
  localBox('Unlabelled control bar', metal, .033, .30, .409, .15, .016, .005);
  for (const u of [-.47, .47]) for (const y of [-.57, .57]) localBox('Front cover fasteners', metal, u, y, .389, .025, .026, .009);
  localBox('Protective upper drip lip', charcoal, 0, .775, .22, 1.095, .047, .42);
  for (let u = -.44; u <= .45; u += .055) localBox('Rear heat sink fins', metal, u, -.16, .025, .018, .95, .076);
  for (const y of [-.50, .48]) {
    localBox('Cabinet mounting rails', metal, 0, y, -.018, 1.04, .09, .06);
    for (const u of [-.38, .38]) localBox('Cabinet standoff brackets', charcoal, u, y, -.055, .10, .15, .10);
  }
  for (const port of Object.values(ELECTRICAL_PORTS).slice(0, 3)) {
    instance('Bottom cable glands', cylGeo, charcoal, port.clone().add(V(0, .035, 0)), V(port === ELECTRICAL_PORTS.acOutput ? .024 : .017, .074, port === ELECTRICAL_PORTS.acOutput ? .024 : .017));
    instance('Gland compression collars', cylGeo, metal, port.clone().add(V(0, .067, 0)), V(port === ELECTRICAL_PORTS.acOutput ? .032 : .024, .021, port === ELECTRICAL_PORTS.acOutput ? .032 : .024));
  }
  // A small sealed wall-entry plate leaves the later building-service design deliberately open.
  box('Building cable entry plate', charcoal, -40.13, .74, 13.7, .055, .26, .26);
  instance('Building entry gland', cylGeo, metal, V(-40.17, .74, 13.7), V(.035, .12, .035), new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), Math.PI / 2));

  // Educational overlay is adjacent to, and visibly separate from, the hardware front cover.
  // Both axes are voltage-versus-time references. No rating, phase count or frequency is encoded.
  const overlayMaterial = ownM(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: true, uniforms: {uProgress: {value: 0}, uOpacity: {value: 0}},
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `
      uniform float uProgress;uniform float uOpacity;varying vec2 vUv;
      // Distance derivatives follow projected canvas pixels, including the steep
      // parts of the sine. A bounded pixel floor prevents subpixel dotted lines.
      float line(float distance,float width){float pixel=max(length(vec2(dFdx(distance),dFdy(distance))),.00001);float halfWidth=max(width,pixel*.85);return 1.-smoothstep(halfWidth-pixel*.5,halfWidth+pixel*.5,abs(distance));}
      void main(){
        vec2 p=vUv;float edge=smoothstep(0.,.018,min(min(p.x,1.-p.x),min(p.y,1.-p.y)));
        float left=smoothstep(.065,.08,p.x)*(1.-smoothstep(.44,.455,p.x));
        float right=smoothstep(.555,.57,p.x)*(1.-smoothstep(.93,.945,p.x));
        float dx=clamp((p.x-.08)/.36,0.,1.),ax=clamp((p.x-.57)/.36,0.,1.);
        float axes=line(p.y-.37,.0015)*(left+right);
        axes+=line(p.x-.08,.0015)*step(.30,p.y)*step(p.y,.73);
        axes+=line(p.x-.57,.0015)*step(.20,p.y)*step(p.y,.75);
        float dc=line(p.y-.59,.006)*left;
        float wave=.37+.205*sin(ax*12.5663706144);
        float ac=line(p.y-wave,.006)*right;
        float dcReveal=1.-smoothstep(uProgress,uProgress+.045,dx);
        float acReveal=1.-smoothstep(uProgress,uProgress+.045,ax);
        vec3 color=vec3(.016,.024,.029)+axes*vec3(.20,.29,.31);
        color+=dc*mix(.24,1.,dcReveal)*vec3(.70,.84,.90);
        color+=ac*mix(.24,1.,acReveal)*vec3(.35,.70,.90);
        float arrow=line(p.y-.51,.002)*step(.477,p.x)*step(p.x,.524);
        arrow+=line(abs(p.y-.51)-(.529-p.x)*.9,.0015)*step(.513,p.x)*step(p.x,.529);
        color+=arrow*vec3(.52,.57,.56);
        gl_FragColor=vec4(color,edge*uOpacity*.95);
      }`,
  }));
  const overlay = new THREE.Mesh(ownG(new THREE.PlaneGeometry(2.08, 1.22)), overlayMaterial);
  overlay.name = 'Educational overlay — voltage versus time, DC reference and AC sine';
  overlay.position.copy(ELECTRICAL_ANCHORS.overlayCentre); overlay.quaternion.copy(west); overlay.renderOrder = 8; overlay.visible = false; group.add(overlay);

  let instances = 0;
  for (const b of batches.values()) {
    const mesh = new THREE.InstancedMesh(b.g, b.m, b.transforms.length); mesh.name = b.name;
    b.transforms.forEach((m, i) => mesh.setMatrixAt(i, m)); mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingBox(); mesh.computeBoundingSphere();
    mesh.castShadow = false; mesh.receiveShadow = true; group.add(mesh); instances += b.transforms.length;
  }
  batches.clear(); group.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(group);
  let drawCalls = 0, triangles = 0, geometryBytes = 0;
  group.traverse(object => {
    if (object instanceof THREE.Mesh) { drawCalls++; triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3 * (object instanceof THREE.InstancedMesh ? object.count : 1); }
    if (object instanceof THREE.InstancedMesh) geometryBytes += object.instanceMatrix.array.byteLength;
  });
  for (const g of geometries) { for (const a of Object.values(g.attributes)) geometryBytes += a.array.byteLength; if (g.index) geometryBytes += g.index.array.byteLength; }
  const stats = {drawCalls, triangles, geometryBytes, textureBytes: 0, instances};
  const refinement=createEquipmentDetail('inverter');group.add(refinement.group);bounds.union(refinement.bounds);
  stats.drawCalls+=refinement.stats.drawCalls;stats.triangles+=refinement.stats.triangles;stats.geometryBytes+=refinement.stats.geometryBytes;stats.instances+=refinement.stats.instances;
  let disposed = false;
  return {
    group, overlay, paths: ELECTRICAL_PATHS, ports: ELECTRICAL_PORTS, anchors: ELECTRICAL_ANCHORS, bounds, stats,
    setProgress(progress: number, opacity=1) {
      if (disposed) return;
      const p = clamp(progress); overlayMaterial.uniforms.uProgress.value = p;
      overlayMaterial.uniforms.uOpacity.value = smooth(p / .16)*opacity; overlay.visible = p > .001&&opacity>.001;
      indicator.emissiveIntensity = .25 + .20 * smooth(p);
    },
    dispose() {
      if (disposed) return; disposed = true;refinement.dispose();
      group.traverse(object => { if (object instanceof THREE.InstancedMesh) object.dispose(); });
      for (const g of geometries) g.dispose(); for (const m of materials) m.dispose();
      group.clear(); group.removeFromParent();
    },
  };
}
